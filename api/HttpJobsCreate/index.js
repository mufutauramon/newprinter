// api/HttpJobsCreate/index.js
import { getUser } from "../../lib/jwt.js";

export default async function (context, req) {
  try {
    const user = getUser(req); // verify JWT

    const body = {
      ok: true,
      stage: "echo-v2",                 // <— marker so we know this version is running
      method: req.method || null,
      echo: req.body ?? null,
      user: { sub: user.sub ?? user.id ?? null, email: user.email ?? null }
    };

    // send JSON body + an extra header we can check in the browser
    context.res = {
      status: 200,
      headers: {
        "content-type": "application/json; charset=utf-8",
        "x-rpn-stage": "echo-v2"        // <— marker header
      },
      // Explicit string to avoid any serialization quirk
      body: JSON.stringify(body)
    };
  } catch (e) {
    context.res = {
      status: e.status || 401,
      headers: { "content-type": "application/json; charset=utf-8" },
      body: JSON.stringify({
        ok: false,
        stage: "auth",
        error: String(e.message || e)
      })
    };
  }
}
