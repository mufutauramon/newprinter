// ESM
import { getPool, getSql } from "../lib/sql.js";
import { signJwt } from "../lib/jwt.js";

export default async function (context, req) {
  try {
    const body = req.body || {};
    const email = (body.email || "").trim().toLowerCase();
    const password = body.password || "";

    if (!email || !password) {
      return json(context, 400, { error: "email and password are required" });
    }

    // IMPORTANT: must match how you stored pwd_hash at signup.
    // We previously used a simple placeholder:
    const pwdHashAttempt = `sha1:${Buffer.from(password).toString("base64")}`;

    const sql = getSql();
    const pool = await getPool();
    const r = await pool.request()
      .input("email", sql.NVarChar(256), email)
      .query("SELECT TOP 1 id, email, pwd_hash, is_operator FROM dbo.Users WHERE email=@email");

    if (!r.recordset?.length) {
      return json(context, 401, { error: "invalid credentials" });
    }
    const user = r.recordset[0];

    if (user.pwd_hash !== pwdHashAttempt) {
      return json(context, 401, { error: "invalid credentials" });
    }

    // issue JWT
    const token = signJwt({
      sub: String(user.id),
      email: user.email,
      is_operator: !!user.is_operator
    }, { expiresInSeconds: 60 * 60 * 12 }); // 12h

    return json(context, 200, { token });
  } catch (err) {
    context.log.error("login error", err);
    return json(context, 500, { error: err.message || String(err) });
  }
}

function json(context, status, body) {
  context.res = {
    status,
    headers: { "content-type": "application/json" },
    body
  };
}
