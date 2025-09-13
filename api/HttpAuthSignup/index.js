export default async function (context, req) {
  try {
    if (req.method === 'GET') {
      return {
        status: 200,
        headers: { "Content-Type": "application/json" },
        body: { info: "POST { email, password } JSON to /api/auth/signup" }
      };
    }

    const { email, password } = req.body || {};
    if (!email || !password) {
      return { status: 400, body: { error: "email and password required" } };
    }

    const pool = await getSqlPool();
    const hash = await bcrypt.hash(password, 10);

    const r = await pool.request()
      .input('e', email)
      .input('p', hash)
      .query("INSERT INTO dbo.Users(email, pwd_hash) OUTPUT inserted.id VALUES(@e,@p)");

    const id = r.recordset[0].id;
    return { status: 200, body: { token: sign({ id, email }) } };

  } catch (e) {
    context.log.error("SIGNUP ERROR:", e);  // logs in Azure portal
    return {
      status: 500,
      headers: { "Content-Type": "application/json" },
      body: { error: String(e) }            // TEMP: return actual error text
    };
  }
}
