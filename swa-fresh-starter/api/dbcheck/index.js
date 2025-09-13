import { getSqlPool } from "../lib/sql.js";
export default async function (context, req) {
  try {
    const pool = await getSqlPool();
    const r = await pool.request().query("SELECT TOP 1 name FROM sys.tables");
    return { status: 200, body: { ok: true, tables: r.recordset } };
  } catch (e) {
    return { status: 500, body: { ok: false, error: String(e) } };
  }
}
