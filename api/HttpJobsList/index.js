import { getPool, getSql } from "../../lib/sql.js";
import { getUser } from "../../lib/jwt.js";

export default async function (context, req) {
  try {
    const user = getUser(req);
    const pool = await getPool();
    const sql = getSql();

    const r = await pool.request()
      .input("uid", sql.Int, Number(user.sub || user.id))
      .query(`
        SELECT TOP 50 id, file_name, pages, color, duplex, status, pickup_code, created_at
        FROM Jobs
        WHERE user_id=@uid
        ORDER BY id DESC
      `);

    json(context, 200, r.recordset);
  } catch (e) {
    const status = e.status || 500;
    json(context, status, { error: String(e.message || e) });
  }
}

function json(ctx, status, body) {
  ctx.res = { status, headers: { "content-type": "application/json" }, body };
}
