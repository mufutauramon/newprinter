import { getPool, getSql } from "../../lib/sql.js";
import { getUser } from "../../lib/jwt.js";

export default async function (context, req) {
  try {
    const user = getUser(req);
    const { pages, color } = req.body || {};
    const pg = parseInt(pages, 10) || 0;
    if (pg <= 0) return json(context, 400, { error: "pages must be > 0" });

    const pool = await getPool();
    const sql = getSql();

    const r = await pool.request()
      .input("uid", sql.Int, Number(user.sub || user.id))
      .query(`
        SELECT TOP 1 s.pages_remaining, p.overage_naira
        FROM Subscriptions s
        JOIN Plans p ON p.id = s.plan_id
        WHERE s.user_id=@uid AND s.active=1
        ORDER BY s.start_at DESC
      `);

    if (!r.recordset.length) return json(context, 400, { error: "no active subscription" });

    const remaining = r.recordset[0].pages_remaining | 0;
    const over = Math.max(0, pg - remaining);
    const overRate = (r.recordset[0].overage_naira | 0) + (color === "color" ? 80 : 0);

    return json(context, 200, { total: over * overRate, breakdown: { over, overRate } });
  } catch (e) {
    const status = e.status || 500;
    json(context, status, { error: String(e.message || e) });
  }
}

function json(ctx, status, body) {
  ctx.res = { status, headers: { "content-type": "application/json" }, body };
}
