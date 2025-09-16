import { getPool, getSql } from "../../lib/sql.js";
import { getUser } from "../../lib/jwt.js";

export default async function (context, req) {
  try {
    // ---------- Auth ----------
    const u = getUser(req); // throws on invalid token
    const uid = parseInt(u?.sub ?? u?.id, 10);
    if (!Number.isInteger(uid)) {
      return json(context, 401, { error: "invalid_user", detail: `uid=${String(u?.sub ?? u?.id)}` });
    }

    // ---------- Body ----------
    const { fileName, blobUrl, pages, color, duplex } = req.body || {};
    if (!fileName || !blobUrl || !pages) {
      return json(context, 400, { error: "bad_request", detail: "fileName, blobUrl, pages required" });
    }
    const pg = parseInt(pages, 10);
    if (!Number.isInteger(pg) || pg <= 0) {
      return json(context, 400, { error: "bad_request", detail: "pages must be a positive integer" });
    }

    const isColor  = String(color  || "").toLowerCase().includes("color");
    const isDuplex = /^(yes|true|1)$/i.test(String(duplex || "yes"));

    // ---------- DB ----------
    const pool = await getPool();
    const sql  = getSql();

    // Latest active subscription
    const subQ = await pool.request()
      .input("uid", sql.Int, uid)
      .query(`
        SELECT TOP 1 id, user_id, pages_remaining, active, start_at
        FROM dbo.Subscriptions
        WHERE user_id=@uid AND active=1
        ORDER BY start_at DESC
      `);

    const sub = subQ.recordset[0];
    if (!sub) return json(context, 400, { error: "no_active_subscription" });

    const tx = new sql.Transaction(pool);
    await tx.begin();

    try {
      const rq = new sql.Request(tx);

      const toDeduct = Math.min((sub.pages_remaining | 0), pg);
      if (toDeduct > 0) {
        await rq
          .input("sid", sql.Int, sub.id)
          .input("d",   sql.Int, toDeduct)
          .query(`UPDATE dbo.Subscriptions SET pages_remaining = pages_remaining - @d WHERE id=@sid`);
      }

      const pickup = Math.floor(100000 + Math.random() * 900000).toString();

      const ins = await rq
        .input("uid", sql.Int, uid)
        .input("fn",  sql.NVarChar(260),  fileName)
        .input("url", sql.NVarChar(2048), blobUrl)
        .input("pg",  sql.Int,            pg)
        .input("clr", sql.Bit,            isColor ? 1 : 0)
        .input("dx",  sql.Bit,            isDuplex ? 1 : 0)
        .input("pc",  sql.VarChar(12),    pickup)
        .query(`
          INSERT INTO dbo.Jobs
            (user_id, file_name, storage_url, pages, color, duplex, pickup_code, status, created_at)
          OUTPUT
            inserted.id, inserted.user_id, inserted.file_name, inserted.storage_url,
            inserted.pages, inserted.color, inserted.duplex, inserted.status,
            inserted.pickup_code, inserted.created_at
          VALUES
            (@uid, @fn, @url, @pg, @clr, @dx, @pc, 'Queued', SYSUTCDATETIME());
        `);

      await tx.commit();
      return json(context, 200, ins.recordset[0]);
    } catch (e) {
      await tx.rollback();
      context.log.error("job_create_failed", e);
      return json(context, 500, {
        error: "job_create_failed",
        detail: errInfo(e)
      });
    }
  } catch (e) {
    const status = e.status || 500;
    context.log.error("jobs_create_outer_error", e);
    return json(context, status, { error: "outer_error", detail: errInfo(e) });
  }
}

function json(ctx, status, body) {
  ctx.res = { status, headers: { "content-type": "application/json" }, body };
}

// pull as much detail as possible from mssql errors
function errInfo(e) {
  return {
    message: e?.message || String(e),
    code: e?.code,
    number: e?.number,
    state: e?.state,
    class: e?.class,
    lineNumber: e?.lineNumber,
    serverName: e?.serverName,
    procName: e?.procName,
    originalInfo: e?.originalError?.info,
    stackTop: (e?.stack || "").split("\n").slice(0, 3).join("\n")
  };
}
