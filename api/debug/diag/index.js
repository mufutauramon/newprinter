import { getPool } from "../lib/sql.js";

export default async function (context, req) {
  try {
    const pool = await getPool();
    const r = await pool.request().query(`
      SELECT TOP 1 name FROM sys.tables WHERE name='Users';
    `);
    const hasUsers = !!r.recordset.length;
    const hasJwtSecret = !!process.env.JWT_SECRET;
    context.res = {
      status: 200,
      headers: { "content-type": "application/json" },
      body: {
        ok: true,
        db: "connected",
        hasUsersTable: hasUsers,
        hasJwtSecret
      }
    };
  } catch (err) {
    context.res = {
      status: 500,
      headers: { "content-type": "application/json" },
      body: { ok: false, error: err?.message || String(err) }
    };
  }
}
