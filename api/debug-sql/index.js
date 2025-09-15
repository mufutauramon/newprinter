import { getPool, getSql } from "../lib/sql.js";

export default async function (context, req) {
  try {
    const sql = getSql();
    const pool = await getPool();
    const r = await pool.request().query(`
      SELECT DB_NAME() AS db, SUSER_SNAME() AS login_name, GETUTCDATE() AS utc_now
    `);
    context.res = { status: 200, headers: { "content-type": "application/json" }, body: r.recordset[0] };
  } catch (err) {
    context.log.error("debug-sql error", err);
    context.res = { status: 500, headers: { "content-type": "application/json" }, body: { error: err.message } };
  }
}
