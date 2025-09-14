import { getSqlPool } from '../../lib/sql.js';
import { getUser } from '../../lib/jwt.js';

export default async function (context, req) {
  const user = getUser(req);
  const { fileName, blobUrl, pages, color, duplex } = req.body || {};
  const pool = await getSqlPool();

  const s = await pool.request().input('uid', user.id).query(`
    SELECT TOP 1 id, pages_remaining FROM Subscriptions WHERE user_id=@uid AND active=1 ORDER BY start_at DESC`);
  const sub = s.recordset[0];
  if (!sub) return { status: 400, body: { error: 'no active subscription' } };

  const t = new (pool.constructor).Transaction(pool);
  await t.begin();
  try {
    const rq = new (pool.constructor).Request(t);
    const deduct = Math.min(sub.pages_remaining|0, pages|0);
    if (deduct > 0) {
      await rq.input('sid', sub.id).input('d', deduct)
        .query("UPDATE Subscriptions SET pages_remaining = pages_remaining - @d WHERE id=@sid");
    }
    const pick = Math.floor(100000 + Math.random()*900000).toString();
    await rq
      .input('uid', user.id)
      .input('fn', fileName)
      .input('url', blobUrl)
      .input('pg', pages|0)
      .input('c', color === 'color')
      .input('dx', !!duplex)
      .input('pc', pick)
      .query("INSERT INTO Jobs(user_id,file_name,storage_url,pages,color,duplex,pickup_code) VALUES(@uid,@fn,@url,@pg,@c,@dx,@pc)");
    await t.commit();
    return { status: 200, body: { status: 'Queued', pickup_code: pick } };
  } catch (e) {
    await t.rollback();
    return { status: 500, body: { error: 'job create failed' } };
  }
}
