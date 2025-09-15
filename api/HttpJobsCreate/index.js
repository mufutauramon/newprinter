import { getPool, getSql } from "../../lib/sql.js";
import { getUser } from "../../lib/jwt.js";

export default async function (context, req) {
  try {
    const user = getUser(req);
    const { fileName, blobUrl, pages, color, duplex } = req.body || {};

    if (!fileName || !blobUrl || !pages)
      return json(context, 400, { error: "fileName, blobUrl and pages are required" });

    const pg = parseInt(pages, 10) || 0;
    if (pg <= 0) return json(context, 400, { error: "pages must be > 0" });

    const pool = await getPool();
    const sql = getSql();

    // Get latest active subscription
    const s = await pool.request()
      .input("uid", sql.Int, Number(user.sub || user.id))
      .query(`
        SELECT TOP 1 id, pages_remaining
        FROM Subscriptions
        WHERE user_id=@uid AND active=1
        ORDER BY start_at DESC
      `);

    const sub = s.recordset[0];
    if (!sub) return json(context, 400, { error: "no active subscription" });

    const tx = new sql.Transaction(pool);
    await tx.begin();

    try {
      const rq = new sql.Request(tx);

      const toDeduct = Math.min(sub.pages_remaining | 0, pg);
      if (toDeduct > 0) {
        await rq
          .input("sid", sql.Int, sub.id)
          .input("d", sql.Int, toDeduct)
          .query("UPDATE Subscriptions SET pages_remaining = pages_remaining - @d WHERE id=@sid");
      }

      const pickup = Math.floor(100000 + Math.random() * 900000).toString();

      await rq
        .input("uid", sql.Int, Number(user.sub || user.id))
        .input("fn", sql.NVarChar(260), fileName)
        .input("url", sql.NVarChar(2048), blobUrl)
        .input("pg", sql.Int, pg)
        .input("clr", sql.Bit, color === "color")
        .input("dx", sql.Bit, !!duplex)
        .input("pc", sql.VarChar(12), pickup)
        .query(`
          INSERT INTO Jobs (user_id, file_name, storage_url, pages, color, duplex, pickup_code, status, created_at)
          VALUES (@uid, @fn, @url, @pg, @clr, @dx, @pc, 'Queued', SYSUTCDATETIME());
        `);

      await tx.commit();
      return json(context, 200, { status: "Queued", pickup_code: pickup });
    } catch (e) {
      await tx.rollback();
      context.log.error("job create failed", e);
      return json(context, 500, { error: "job_create_failed" });
    }
  } catch (e) {
    const status = e.status || 500;
    return json(context, status, { error: String(e.message || e) });
  }
}

function json(ctx, status, body) {
  ctx.res = { status, headers: { "content-type": "application/json" }, body };
}
