import { getSqlPool } from '../../lib/sql.js';
import { getUser } from '../../lib/jwt.js';

export default async function (context, req) {
  try {
    const user = getUser(req);
    const { planName } = req.body || {};
    const pool = await getSqlPool();
    const p = await pool.request().input('n', planName)
      .query("SELECT TOP 1 id, quota_pages FROM Plans WHERE name=@n");
    if (!p.recordset.length) return { status: 400, body: { error: 'plan not found' } };

    const plan = p.recordset[0];
    const t = new (pool.constructor).Transaction(pool);
    await t.begin();
    try {
      const rq = new (pool.constructor).Request(t);
      await rq.input('uid', user.id)
        .query("UPDATE Subscriptions SET active=0, end_at=SYSUTCDATETIME() WHERE user_id=@uid AND active=1");
      await rq.input('uid', user.id).input('pid', plan.id).input('q', plan.quota_pages)
        .query("INSERT INTO Subscriptions(user_id, plan_id, pages_remaining) VALUES(@uid,@pid,@q)");
      await t.commit();
    } catch (e) { await t.rollback(); throw e; }
    return { status: 200, body: { plan: planName, quota: plan.quota_pages } };
  } catch (e) {
    const code = e.status || 500; return { status: code, body: { error: 'subscribe failed' } };
  }
}
