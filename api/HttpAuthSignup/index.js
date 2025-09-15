// api/HttpAuthSignup/index.js
import { getPool, getSql } from "../lib/sql.js";

export default async function (context, req) {
  try {
    const b = req.body || {};
    const fullName = String(b.fullName || "").trim();
    const phone = String(b.phone || "").trim();
    const email = String(b.email || "").trim().toLowerCase();
    const password = String(b.password || "");
    const subscription_tier = String(b.plan || "").trim(); // rename "plan" -> subscription_tier

    if (!email || !password) {
      return json(context, 400, { error: "email and password are required" });
    }

    // simple SHA1+base64 hash
    const pwd_hash = `sha1:${Buffer.from(password).toString("base64")}`;

    const sql = getSql();
    const pool = await getPool();

    await pool.request()
      .input("email", sql.NVarChar(256), email)
      .input("pwd_hash", sql.NVarChar(256), pwd_hash)
      .input("full_name", sql.NVarChar(256), fullName)
      .input("phone", sql.NVarChar(50), phone)
      .input("subscription_tier", sql.NVarChar(50), subscription_tier)
      .query(`
        INSERT INTO dbo.Users (email, pwd_hash, full_name, phone, subscription_tier)
        VALUES (@email, @pwd_hash, @full_name, @phone, @subscription_tier)
      `);

    return json(context, 200, { ok: true, where: "HttpAuthSignup" });
  } catch (err) {
    context.log.error("signup error", err);
    return json(context, 500, { error: "signup_failed", detail: String(err?.message || err) });
  }
}

function json(context, status, body) {
  context.res = {
    status,
    headers: { "content-type": "application/json" },
    body
  };
}
