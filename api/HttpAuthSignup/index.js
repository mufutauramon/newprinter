// api/HttpAuthSignup/index.js
import { getPool, getSql } from "../lib/sql.js";
import { signJwt } from "../lib/jwt.js";

export default async function (context, req) {
  try {
    const b = req.body || {};
    const email = String(b.email || "").trim().toLowerCase();
    const password = String(b.password || "");
    const fullName = String(b.fullName || "").trim();
    const phone = String(b.phone || "").trim();
    const plan = String(b.plan || "Basic").trim();

    if (!email || !password || !fullName || !phone) {
      return json(context, 400, { error: "fullName, phone, email and password are required" });
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return json(context, 400, { error: "invalid email" });
    }
    if (password.length < 6) {
      return json(context, 400, { error: "password must be at least 6 chars" });
    }
    const digits = phone.replace(/\D/g, "");
    if (!(phone.startsWith("+") || /^\d+$/.test(phone)) || digits.length < 10 || digits.length > 15) {
      return json(context, 400, { error: "invalid phone (use +234… or 10–15 digits)" });
    }

    // very simple (demo) hash – must match login
    const pwdHash = `sha1:${Buffer.from(password).toString("base64")}`;

    const sql = getSql();
    const pool = await getPool();

    // unique email guard
    const exists = await pool.request()
      .input("email", sql.NVarChar(256), email)
      .query("SELECT COUNT(1) AS n FROM dbo.Users WHERE email=@email");

    if (exists.recordset[0].n > 0) {
      return json(context, 409, { error: "email already exists" });
    }

    // insert
    const ins = await pool.request()
      .input("email", sql.NVarChar(256), email)
      .input("pwd_hash", sql.NVarChar(200), pwdHash)
      .input("full_name", sql.NVarChar(150), fullName)
      .input("phone", sql.NVarChar(32), phone)
      .input("plan", sql.NVarChar(50), plan)
      .query(`
        INSERT INTO dbo.Users (email, pwd_hash, full_name, phone, plan, is_operator, created_at)
        VALUES (@email, @pwd_hash, @full_name, @phone, @plan, 0, SYSUTCDATETIME());
        SELECT SCOPE_IDENTITY() AS id;
      `);

    const userId = ins.recordset?.[0]?.id;
    const token = signJwt(
      { sub: String(userId), email, fullName, phone, plan },
      { expiresInSeconds: 60 * 60 * 12 }
    );

    return json(context, 200, { token, user: { id: userId, email, fullName, phone, plan } });
  } catch (err) {
    context.log.error("signup error", err);
    return json(context, 500, { error: "signup_failed", detail: String(err?.message || err) });
  }
}

function json(context, status, body) {
  context.res = { status, headers: { "content-type": "application/json" }, body };
}
