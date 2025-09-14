import { getSqlPool } from '../../lib/sql.js';
import { getUser } from '../../lib/jwt.js';

export default async function (context, req) {
  const user = getUser(req);
  const { pages, color } = req.body || {};
  const pool = await getSqlPool();
  const r = await pool.request().input('uid', user.id).query(`
    SELECT TOP 1 s.pages_remaining, p.overage_naira
    FROM Subscriptions s JOIN Plans p ON p.id=s.plan_id
    WHERE s.user_id=@uid AND s.active=1 ORDER BY s.start_at DESC`);
  if (!r.recordset.length) return { status: 400, body: { error: 'no active subscription' } };
  const remaining = r.recordset[0].pages_remaining|0;
  const over = Math.max(0, (pages|0) - remaining);
  const overRate = (r.recordset[0].overage_naira|0) + (color === 'color' ? 80 : 0);
  return { status: 200, body: { total: over * overRate, breakdown: { over, overRate } } };
}
