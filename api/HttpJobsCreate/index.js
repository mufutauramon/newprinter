// api/HttpJobsCreate/index.js  (diagnostic)
import { getPool, getSql } from "../../lib/sql.js";
import { getUser } from "../../lib/jwt.js";

export default async function (context, req) {
  try {
    // 1) token → uid
    let uidDetail = null;
    let uid = null;
    try {
      const u = getUser(req);
      uidDetail = u;
      uid = parseInt(u?.sub ?? u?.id, 10);
    } catch (e) {
      return json(context, 401, { error: "no_token_or_invalid", detail: e?.message || String(e) });
    }

    // 2) DB ping
    const pool = await getPool();
    const sql = getSql();

    const ping = await pool.request().query("SELECT 1 AS ok");

    // 3) Read subscription for this user
    const sub = await pool.request()
      .input("uid", sql.Int, uid)
      .query(`
        SELECT TOP 1 id, user_id, pages_remaining, active, start_at
        FROM dbo.Subscriptions
        WHERE user_id=@uid AND active=1
        ORDER BY start_at DESC
      `);

    return json(context, 200, {
      step: "diagnostic",
      uid,
      token_payload: uidDetail,
      db_ping: ping.recordset[0],
      sub: sub.recordset[0] || null,
      body_echo: req.body || null
    });
  } catch (e) {
    context.log.error("diagnostic error", e);
    return json(context, 500, { error: "diagnostic_failed", detail: e?.message || String(e) });
  }
}

function json(ctx, status, body) {
  ctx.res = { status, headers: { "content-type": "application/json" }, body };
}
