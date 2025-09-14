import { getPool, getSql } from "../lib/sql.js"; // path is correct: api/HttpAuthSignup -> ../lib

export default async function (context, req) {
  context.log("signup called");

  try {
    const body = req.body || {};
    const email = (body.email || "").trim().toLowerCase();
    const password = body.password || "";

    if (!email || !password) {
      return json(context, 400, { error: "email and password are required" });
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return json(context, 400, { error: "invalid email" });
    }

    // NOTE: for now we store a very simple hash placeholder.
    // Replace with bcrypt later.
    const pwdHash = `sha1:${Buffer.from(password).toString("base64")}`;

    const sql = getSql();
    const pool = await getPool();
    const tx = new sql.Transaction(pool);

    await tx.begin();

    // Check existence (unique index should also enforce)
    const checkReq = new sql.Request(tx);
    checkReq.input("email", sql.NVarChar(256), email);
    const exists = await checkReq.query(
      "SELECT COUNT(1) AS n FROM dbo.Users WHERE email = @email"
    );
    if (exists.recordset[0].n > 0) {
      await tx.rollback();
      return json(context, 409, { error: "email already exists" });
    }

    // Insert user
    const insReq = new sql.Request(tx);
    insReq.input("email", sql.NVarChar(256), email);
    insReq.input("pwd_hash", sql.NVarChar(200), pwdHash);
    const ins = await insReq.query(`
      INSERT INTO dbo.Users (email, pwd_hash, is_operator, created_at)
      VALUES (@email, @pwd_hash, 0, SYSUTCDATETIME());
      SELECT SCOPE_IDENTITY() AS id;
    `);

    await tx.commit();

    const userId = ins.recordset?.[0]?.id;
    return json(context, 200, { token: `TEST_${userId}` });
  } catch (err) {
    // Surface details so we can see what's wrong
    context.log.error("signup error", err);
    return json(context, 500, {
      error: err.message,
      code: err.code ?? null,
      number: err.number ?? null,
      state: err.state ?? null
    });
  }
}

function json(context, status, body) {
  context.res = {
    status,
    headers: { "content-type": "application/json" },
    body
  };
}
