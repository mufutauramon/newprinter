// api/HttpJobsCreate/index.js
import { getPool, getSql } from "../../lib/sql.js";
import { getUser } from "../../lib/jwt.js";

export default async function (context, req) {
  try {
    // ---- auth: extract user and validate numeric id
    const user = getUser(req);
    const rawUid = user?.sub ?? user?.id;
    const uid = parseInt(rawUid, 10);
    if (!Number.isInteger(uid)) {
      return json(context, 400, {
        error: "invalid_user_id",
        detail: `Expected numeric user id, got: ${String(rawUid)}`
      });
    }

    // ---- validate body
    const { fileName, blobUrl, pages, color, duplex } = req.body || {};
    if (!fileName || !blobUrl || !pages) {
      return json(context, 400, {
        error: "bad_request",
        detail: "fileName, blobUrl and pages are required"
      });
    }
    const pg = parseInt(pages, 10) || 0;
    if (pg <= 0) {
      return json(context, 400, { error: "bad_request", detail: "pages must be > 0" });
    }

    const pool = await getPool();
    const sql = getSql();

    // ---- get latest active subscription for this user
    let sub;
    try {
      const s = await pool.request()
        .input("uid", sql.Int, uid)
        .query(`
          SELECT TOP 1 id, user_id, pages_remaining, active, start_at
          FROM dbo.Subscriptions
          WHERE user_id = @uid AND active = 1
          ORDER BY start_at DESC
        `);
      sub = s.recordset[0];
    } catch (e) {
      context.log.error("subscriptions query failed", e);
      return json(context, 500, {
        error: "sql_subscriptions_query_failed",
        detail: e?.originalError?.info?.message || e?.message || String(e)
      });
    }

    if (!sub) {
      return json(context, 400, { error: "no_active_subscription" });
    }

    // ---- transaction: optionally deduct pages + insert job
    const tx = new sql.Transaction(pool);
    await tx.begin();

    try {
      const rq = new sql.Request(tx);

      // deduct up to pg pages (no negative)
      const toDeduct = Math.min((sub.pages_remaining | 0), pg);
      if (toDeduct > 0) {
        await rq
          .input("sid", sql.Int, sub.id)
          .input("d", sql.Int, toDeduct)
          .query(`
            UPDATE dbo.Subscriptions
            SET pages_remaining = pages_remaining - @d
            WHERE id = @sid
          `);
      }

      const pickup = Math.floor(100000 + Math.random() * 900000).toString();
      const isColor  = String(color  || "").toLowerCase().includes("color");
      const isDuplex = String(duplex || "").toLowerCase() === "yes" || duplex === true;

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
      // return the inserted row so the UI can prepend it
      return json(context, 200, ins.recordset[0]);
    } catch (e) {
      await tx.rollback();
      context.log.error("job create failed", e);
      return json(context, 500, {
        error: "job_create_failed",
        detail: e?.originalError?.info?.message || e?.message || String(e)
      });
    }
  } catch (e) {
    // include detail for outer errors too (e.g., missing/invalid token)
    const status = e.status || 500;
    context.log.error("jobs outer error", e);
    return json(context, status, { error: e?.message || String(e) });
  }
}

// small helper that always returns JSON
function json(ctx, status, body) {
  ctx.res = {
    status,
    headers: { "content-type": "application/json" },
    body
  };
}
