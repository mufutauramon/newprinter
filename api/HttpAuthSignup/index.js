// api/HttpAuthSignup/index.js
import { getPool, getSql } from "../lib/sql.js";
import { signJwt } from "../lib/jwt.js";

function respond(context, status, body) {
  context.res = { status, headers: { "content-type": "application/json" }, body };
}

function sqlErrorPayload(err) {
  // mssql often nests messages; surface the most useful bits
  const m =
    err?.originalError?.info?.message ||
    err?.precedingErrors?.[0]?.message ||
    err?.message ||
    String(err);
  const code = err?.number ?? err?.code ?? "SQLERR";
  return { code, message: m };
}

export default async function (context, req) {
  try {
    const b = req.body || {};
    const email    = String(b.email || "").trim().toLowerCase();
    const password = String(b.password || "");
    const fullName = String(b.fullName || "").trim();
    const phone    = String(b.phone || "").trim();
    const plan     = String(b.plan || "Basic").trim();

    // 1) basic validation
    if (!email || !password || !fullName || !phone) {
      return respond(context, 400, { error: "fullName, phone, email and password are required" });
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return respond(context, 400, { error: "invalid email" });
    }
    if (password.length < 6) {
      return respond(context, 400, { error: "password must be at least 6 chars" });
    }
    const digits = phone.replace(/\D/g, "");
    if (!(phone.startsWith("+") || /^\d+$/.test(phone)) || digits.length < 10 || digits.length > 15) {
      return respond(context, 400, { error: "invalid phone (use +234… or 10–15 digits)" });
    }

    // 2) extremely simple hash (must match login)
    const pwdHash = `sha1:${Buffer.from(password).toString("base64")}`;

    const sql = getSql();
    const pool = await getPool();

    // 3) unique email guard
    try {
      const exists = await pool.request()
        .input("email", sql.NVarChar(256), email)
        .query("SELECT COUNT(1) AS n FROM dbo.Users WHERE email=@email;");
      if (exists.recordset?.[0]?.n > 0) {
        return respond(context, 409, { error: "email already exists" });
      }
    } catch (err) {
      return respond(context, 500, { stage: "exists_check", ...sqlErrorPayload(err) });
    }

    // 4) insert the user (note [plan] is reserved word)
    let userId;
    try {
      const ins = await pool.request()
        .input("email",     sql.NVarChar(256), email)
        .input("pwd_hash",  sql.NVarChar(200), pwdHash)
        .input("full_name", sql.NVarChar(150), fullName)
        .input("phone",     sql.NVarChar(32),  phone)
        .input("plan",      sql.NVarChar(50),  plan)
        .query(`
          INSERT INTO dbo.Users (email, pwd_hash, full_name, phone, [plan], is_operator, created_at)
          VALUES (@email, @pwd_hash, @full_name, @phone, @plan, 0, SYSUTCDATETIME());
          SELECT SCOPE_IDENTITY() AS id;
        `);
      userId = ins.recordset?.[0]?.id;
    } catch (err) {
      return respond(context, 500, { stage: "insert_user", ...sqlErrorPayload(err) });
    }

    // 5) JWT
    try {
      const token = signJwt(
        { sub: String(userId), email, fullName, phone, plan },
        { expiresInSeconds: 60 * 60 * 12 }
      );
      if (!token) {
        return respond(context, 500, { stage: "jwt", error: "JWT_SIGN_FAILED (missing secret?)" });
      }
      return respond(context, 200, { token, user: { id: userId, email, fullName, phone, plan } });
    } catch (err) {
      return respond(context, 500, { stage: "jwt", message: err?.message || String(err) });
    }
  } catch (err) {
    context.log.error("signup fatal", err);
    return respond(context, 500, { stage: "fatal", message: err?.message || String(err) });
  }
}
