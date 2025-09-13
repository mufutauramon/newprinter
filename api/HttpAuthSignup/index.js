export default async function (context, req) {
  try {
    const { email, password } = req.body || {};
    if (!email || !password) {
      context.res = {
        status: 400,
        headers: { "Content-Type": "application/json" },
        body: { error: "email and password required" }
      };
      return;
    }
    context.res = {
      status: 200,
      headers: { "Content-Type": "application/json" },
      body: { token: "TEST_" + Buffer.from(email).toString("base64").slice(0,16) }
    };
  } catch (e) {
    context.log.error("SIGNUP TEMP ERROR:", e);
    context.res = {
      status: 500,
      headers: { "Content-Type": "application/json" },
      body: { error: String(e) }
    };
  }
}
