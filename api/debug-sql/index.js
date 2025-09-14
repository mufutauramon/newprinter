import { getPool, getSql } from "../lib/sql.js";

export default async function (context, req) {
  try {
    const sql = getSql();
    const pool = await getPool();

    // Try read & write in a transaction; rollback so we don't leave junk
    const tx = new sql.Transaction(pool);
    await tx.begin();

    const r1 = await new sql.Request(tx).query("SELECT TOP 1 id, email FROM dbo.Users ORDER BY id DESC");
    const r2Req = new sql.Request(tx);
    r2Req.input("email", sql.NVarChar(256), `probe_${Date.now()}@remoteprint.ng`);
    r2Req.input("pwd", sql.NVarChar(200), "probe");
    await r2Req.query(`
      INSERT INTO dbo.Users (email, pwd_hash, is_operator, created_at)
      VALUES (@email, @pwd, 0, SYSUTCDATETIME());
    `);

    await tx.rollback(); // don't keep the probe row

    context.res = {
      status: 200,
      headers: { "content-type": "application/json" },
      body: {
        ok: true,
        lastUser: r1.recordset?.[0] ?? null
      }
    };
  } catch (e) {
    context.log.error("debug/sql error", e);
    context.res = {
      status: 500,
      headers: { "content-type": "application/json" },
      body: { error: e.message, code: e.code ?? null, number: e.number ?? null, state: e.state ?? null }
    };
  }
}
