// api/HttpJobsCreate/index.js  (AUTH TEST)
import { getUser } from "../../lib/jwt.js";

export default async function (context, req) {
  try {
    let user = null;
    try {
      user = getUser(req);            // may throw with status 401
    } catch (e) {
      context.res = {
        status: e.status || 401,
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ ok: false, stage: "auth-v1", error: String(e.message || e) })
      };
      return;
    }

    context.res = {
      status: 200,
      headers: {
        "content-type": "application/json",
        "x-rpn-stage": "auth-v1"
      },
      body: JSON.stringify({
        ok: true,
        stage: "auth-v1",
        user: { sub: user.sub ?? user.id ?? null, email: user.email ?? null },
        echo: req.body ?? null
      })
    };
  } catch (e) {
    context.res = {
      status: 500,
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ ok: false, stage: "catch", error: String(e.message || e) })
    };
  }
}
