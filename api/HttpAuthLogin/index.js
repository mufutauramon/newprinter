import { getPool, getSql } from "../lib/sql.js";
import { signJwt } from "../lib/jwt.js";

export default async function (context, req) {
  try {
    const b = req.body || {};
    const email    = String(b.email || "").trim().toLowerCase();
    const password = String(b.password || "");

    if (!email || !password) {
      return json(context, 400, { error: "email and password are required" });
    }

    // MUST MATCH SIGNUP hashing
    const attemptHash = `sha1:${Buffer.from(password).toString("base64")}`;

    const sql  = getSql();
    const pool = await getPool();
   const r = await pool.request()
    .input("email", sql.NVarChar(256), email)
    .query(`
    SELECT TOP 1 id, email, pwd_hash, is_operator, full_name, phone, [plan]
    FROM dbo.Users WHERE email=@email`);

    if (!r.recordset?.length) {
      return json(context, 401, { error: "invalid credentials" });
    }
    const u = r.recordset[0];

    if (u.pwd_hash !== attemptHash) {
      return json(context, 401, { error: "invalid credentials" });
    }

    const token = signJwt(
      {
        sub: String(u.id),
        email: u.email,
        is_operator: !!u.is_operator,
        fullName: u.full_name || null,
        phone: u.phone || null,
        plan: u.plan || null
      },
      { expiresInSeconds: 60 * 60 * 12 }
    );

    return json(context, 200, {
      token,
      user: {
        id: u.id,
        email: u.email,
        fullName: u.full_name || null,
        phone: u.phone || null,
        plan: u.plan || null
      }
    });

  } catch (err) {
    context.log.error("login error", err);
    return json(context, 500, { error: err.message || String(err) });
  }
}

function json(context, status, body) {
  context.res = { status, headers: { "content-type": "application/json" }, body };
}
