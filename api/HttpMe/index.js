import { getSqlPool } from '../../lib/sql.js';
import { getUser } from '../../lib/jwt.js';

export default async function (context, req) {
  try {
    const user = getUser(req);
    const pool = await getSqlPool();
    const sub = await pool.request().input('uid', user.id).query(`
      SELECT TOP 1 s.pages_remaining, p.name AS plan, p.quota_pages
      FROM Subscriptions s JOIN Plans p ON p.id=s.plan_id
      WHERE s.user_id=@uid AND s.active=1 ORDER BY s.start_at DESC`);
    return { status: 200, body: { email: user.email, subscription: sub.recordset[0] || null } };
  } catch (e) {
    const code = e.status || 500;
    return { status: code, body: { error: e.message || 'error' } };
  }
}
