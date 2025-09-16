import { getPool, getSql } from "../../lib/sql.js";
import { getUser } from "../../lib/jwt.js";

function json(ctx, status, body) {
  ctx.res = { status, headers: { "content-type": "application/json" }, body };
}

export default async function (context, req) {
  try {
    context.log("HttpJobsCreate invoked");

    // ---------- DEBUG ECHO ----------
    if (req.body && req.body.debug) {
      context.log("Debug mode echoing body");
      return json(context, 200, {
        ok: true,
        route: "jobs",
        method: "POST",
        echo: req.body
      });
    }

    // ---------- AUTH ----------
    let user;
    try {
      user = getUser(req); // throws if missing/invalid
    } catch (e) {
      context.log.warn("Auth error:", e.message);
      return json(context, e.status || 401, { error: e.message || "unauthorized" });
    }
    const userId = Number(user.sub || user.id);
    if (!userId) return json(context, 401, { error: "invalid_user" });

    // ---------- INPUT ----------
    const { fileName, blobUrl, pages, color, duplex } = req.body || {};
    if (!fileName || !blobUrl || pages == null) {
      return json(context, 400, { error: "fileName, blobUrl and pages are required" });
    }

    const pg = parseInt(pages, 10);
    if (!Number.isFinite(pg) || pg <= 0) {
      return json(context, 400, { error: "pages must be a positive integer" });
    }

    const pool = await getPool();
    const sql = getSql();

    // ---------- ACTIVE SUB ----------
    let sub;
    try {
      const s = await pool.request()
        .input("uid", sql.Int, userId)
        .query(`
          SELECT TOP 1 id, pages_remaining
          FROM dbo.Subscriptions
          WHERE user_id=@uid AND active=1
          ORDER BY start_at DESC
        `);
      sub = s.recordset[0];
    } catch (e) {
      context.log.error("SQL select subscription failed:", e);
      return json(context, 500, { error: "select_subscription_failed" });
    }

    if (!sub) return json(context, 400, { error: "no_active_subscription" });

    // ---------- TRANSACTION ----------
    const tx = new sql.Transaction(pool);
    try {
      await tx.begin();

      const rq = new sql.Request(tx);

      const toDeduct = Math.min((sub.pages_remaining | 0), pg);
      if (toDeduct > 0) {
        await rq
          .input("sid", sql.Int, sub.id)
          .input("d", sql.Int, toDeduct)
          .query(`
            UPDATE dbo.Subscriptions
            SET pages_remaining = pages_remaining - @d
            WHERE id=@sid
          `);
      }

      const pickup = Math.floor(100000 + Math.random() * 900000).toString();

      // Insert and return the created row
      const ins = await rq
        .input("uid", sql.Int, userId)
        .input("fn", sql.NVarChar(260), fileName)
        .input("url", sql.NVarChar(2048), blobUrl)
        .input("pg", sql.Int, pg)
        .input("clr", sql.Bit, String(color).toLowerCase() === "color")
        .input("dx", sql.Bit, !!duplex && String(duplex).toLowerCase() !== "no")
        .input("pc", sql.VarChar(12), pickup)
        .query(`
          INSERT INTO dbo.Jobs
            (user_id, file_name, storage_url, pages, color, duplex, pickup_code, status, created_at)
          OUTPUT INSERTED.id, INSERTED.file_name, INSERTED.storage_url, INSERTED.pages,
                 INSERTED.color, INSERTED.duplex, INSERTED.status, INSERTED.pickup_code, INSERTED.created_at
          VALUES (@uid, @fn, @url, @pg, @clr, @dx, @pc, 'Queued', SYSUTCDATETIME());
        `);

      await tx.commit();

      // return the created job (first row from OUTPUT)
      const job = ins.recordset?.[0] ?? { status: "Queued", pickup_code: pickup };
      return json(context, 200, job);
    } catch (e) {
      try { await tx.rollback(); } catch {}
      context.log.error("job create failed:", e?.message || e);
      return json(context, 500, { error: "job_create_failed", detail: String(e.message || e) });
    }
  } catch (e) {
    context.log.error("top-level HttpJobsCreate error:", e);
    const status = e.status || 500;
    return json(context, status, { error: String(e.message || e) });
  }
}
