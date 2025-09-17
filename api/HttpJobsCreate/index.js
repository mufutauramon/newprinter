// api/HttpJobsCreate/index.js
import { getUser } from "../../lib/jwt.js";

export default async function (context, req) {
  try {
    const user = getUser(req);               // verify JWT
    // simple, guaranteed JSON response for POST
    context.res = {
      status: 200,
      headers: { "content-type": "application/json" },
      body: {
        ok: true,
        stage: "auth-ok",
        method: req.method || null,
        echo: req.body ?? null,               // echo whatever you sent
        user: { sub: user.sub ?? user.id ?? null, email: user.email ?? null }
      }
    };
  } catch (e) {
    context.res = {
      status: e.status || 401,
      headers: { "content-type": "application/json" },
      body: { ok: false, stage: "auth", error: String(e.message || e) }
    };
  }
}
