// api/HttpJobsCreate/index.js
import { getPool, getSql } from "../../lib/sql.js";
import { getUser } from "../../lib/jwt.js";

export default async function (context, req) {
  try {
    // 0) Identify caller early
    const user = getUser(req); // throws 401 -> caught below
    const uid = Number(user.sub || user.id);

    // 1) DEBUG SHORT-CIRCUIT: if client sends { debug: true } just echo
    if (req.body && req.body.debug) {
      return json(context, 200, {
        ok: true,
        debug: "echo",
        user: { sub: user.sub, id: user.id, email: user.email },
        body: req.body,
      });
    }

    // 2) Validate inputs
    const { fileName, blobUrl, pages, color, duplex } = req.body || {};
    if (!fileName || !blobUrl || !pages) {
      return json(context, 400, { error: "fileName, blobUrl and pages are required" });
    }

    const pg = parseInt(pages, 10) || 0;
    if (pg <= 0) return json(context, 400, { error: "pages must be > 0" });

    // 3) DB work (with its own try/catch to surface real errors)
    const pool = await getPool();
    const sql = getSql();

    // latest active subscription
    const s = await pool.request()
      .input("uid", sql.Int, uid)
      .query(`
        SELECT TOP 1 id, pages_remaining
        FROM Subscriptions
        WHERE user_id=@uid AND active=1
        ORDER BY start_at DESC
      `);

    const sub = s.recordset[0];
    if (!sub) return json(context, 400, { error: "no active subscription" });

    // transaction
    const tx = new sql.Transaction(pool);
    await tx.begin();

    try {
      const rq = new sql.Request(tx);

      const toDeduct = Math.min((sub.pages_remaining | 0), pg);
      if (toDeduct > 0) {
        await rq
          .input("sid", sql.Int, sub.id)
          .input("d", sql.Int, toDeduct)
          .query("UPDATE Subscriptions SET pages_remaining = pages_remaining - @d WHERE id=@sid");
      }

      const pickup = Math.floor(100000 + Math.random() * 900000).toString();

      await rq
        .input("uid", sql.Int, uid)
        .input("fn", sql.NVarChar(260), fileName)
        .input("url", sql.NVarChar(2048), blobUrl)
        .input("pg", sql.Int, pg)
        .input("clr", sql.Bit, (color === "color") ? 1 : 0)
        .input("dx", sql.Bit, duplex ? 1 : 0)
        .input("pc", sql.VarChar(12), pickup)
        .query(`
          INSERT INTO Jobs (user_id, file_name, storage_url, pages, color, duplex, pickup_code, status, created_at)
          VALUES (@uid, @fn, @url, @pg, @clr, @dx, @pc, 'Queued', SYSUTCDATETIME());
        `);

      await tx.commit();

      // return the minimal info the UI can use
      return json(context, 200, {
        status: "Queued",
        pickup_code: pickup,
        // optional: echo back fields so UI can immediately add a row
        file_name: fileName,
        storage_url: blobUrl,
        pages: pg,
        color: color === "color",
        duplex: !!duplex,
        created_at: new Date().toISOString(),
      });
    } catch (dbErr) {
      await tx.rollback();
      context.log.error("job create failed", dbErr);
      // Surface full error so we can see it in the browser Response
      return json(context, 500, { error: "job_create_failed", detail: safeErr(dbErr) });
    }
  } catch (e) {
    // Catches auth errors, validation throws, unexpected throws
    context.log.error("HttpJobsCreate top-level error", e);
    return json(context, e.status || 500, { error: String(e.message || e), detail: safeErr(e) });
  }
}

function json(ctx, status, body) {
  // Force JSON text always, even on errors
  ctx.res = {
    status,
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body, null, 2),
  };
}

function safeErr(e) {
  return {
    message: e?.message,
    code: e?.code,
    number: e?.number,
    name: e?.name,
    stack: (e?.stack || "").split("\n").slice(0, 3),
  };
}
