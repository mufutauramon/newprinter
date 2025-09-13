import bcrypt from "bcryptjs";
import { getSqlPool } from "../../lib/sql.js";
import { sign } from "../../lib/jwt.js";

export default async function (context, req) {
  try {
    if (req.method === "GET") {
      context.res = {
        status: 200,
        headers: { "Content-Type": "application/json" },
        body: { info: "POST { email, password } JSON to /api/auth/signup" }
      };
      return;
    }

    const { email, password } = req.body || {};
    if (!email || !password) {
      context.res = {
        status: 400,
        headers: { "Content-Type": "application/json" },
        body: { error: "email and password required" }
      };
      return;
    }

    const pool = await getSqlPool();
    const hash = await bcrypt.hash(password, 10);

    const r = await pool.request()
      .input("e", email)
      .input("p", hash)
      .query("INSERT INTO dbo.Users(email, pwd_hash) OUTPUT inserted.id VALUES(@e,@p)");

    const id = r.recordset[0].id;
    context.res = {
      status: 200,
      headers: { "Content-Type": "application/json" },
      body: { token: sign({ id, email }) }
    };
  } catch (e) {
    context.log.error("SIGNUP ERROR:", e);
    context.res = {
      status: 500,
      headers: { "Content-Type": "application/json" },
      body: { error: String(e) }
    };
  }
}
