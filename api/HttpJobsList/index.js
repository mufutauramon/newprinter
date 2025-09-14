import { getSqlPool } from '../../lib/sql.js';
import { getUser } from '../../lib/jwt.js';

export default async function (context, req) {
  const user = getUser(req);
  const pool = await getSqlPool();
  const r = await pool.request().input('uid', user.id).query(`
    SELECT TOP 50 id, file_name, pages, color, duplex, status, pickup_code, created_at
    FROM Jobs WHERE user_id=@uid ORDER BY id DESC`);
  return { status: 200, body: r.recordset };
}
