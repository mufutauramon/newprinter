import { getPool, getSql } from "../lib/sql.js";
import { signJwt } from "../lib/jwt.js";

export default async function (context, req) {
  try {
    const b = req.body || {};
    const email = String(b.email || "").trim().toLowerCase();
    const password = String(b.password || "");
    const fullName = String(b.fullName || "").trim();
    const phone = String(b.phone || "").trim();

    // 1) basic validation
    if (!email || !password || !fullName || !phone) {
      return json(context, 400, { error: "fullName, phone, email and password are required" });
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return json(context, 400, { error: "invalid email" });
    }
    if (password.length < 6) {
      return json(context, 400, { error: "password must be at least 6 chars" });
    }
    // Allow +234… or digits; 10–15 total digits for simplicity
    const digits = phone.replace(/\D/g, "");
    if (!(phone.startsWith("+") || /^\d+$/.test(phone)) || digits.length < 10 || digits.length > 15) {
      return json(context, 400, { error: "invalid phone (use +234… or 10–15 digits)" });
    }

    // 2) hash (placeholder — keep consistent with login)
    const pwdHash = `sha1:${Buffer.from(password).toString("base64")}`;

    const sql = getSql();
    const pool = await getPool();

    // 3) unique email guard
    const exists = await pool.request()
      .input("email", sql.NVarChar(256), email)
      .query("SELECT COUNT(1) AS n FROM dbo.Users WHERE email=@email");
    if (exists.recordset[0].n > 0) {
      return json(context, 409, { error: "email already exists" });
    }

    // 4) insert
    const ins = await pool.request()
      .input("email", sql.NVarChar(256), email)
      .input("pwd_hash", sql.NVarChar(200), pwdHash)
      .input("full_name", sql.NVarChar(150), fullName)
      .input("phone", sql.NVarChar(32), phone)
      .query(`
        INSERT INTO dbo.Users (email, pwd_hash, full_name, phone, is_operator, created_at)
        VALUES (@email, @pwd_hash, @full_name, @phone, 0, SYSUTCDATETIME());
        SELECT SCOPE_IDENTITY() AS id;
      `);

    const userId = ins.recordset?.[0]?.id;

    // 5) issue a JWT (same secret as login uses)
    const token = signJwt({ sub: String(userId), email, fullName, phone }, { expiresInSeconds: 60 * 60 * 12 });

    return json(context, 200, { token, user: { id: userId, email, fullName, phone } });
  } catch (err) {
    context.log.error("signup error", err);
    return json(context, 500, { error: err.message || String(err) });
  }
}

function json(context, status, body) {
  context.res = { status, headers: { "content-type": "application/json" }, body };
}
