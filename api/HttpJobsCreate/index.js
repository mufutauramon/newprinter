// api/HttpJobsCreate/index.js
import { getUser } from "../../lib/jwt.js";

export default async function (context, req) {
  // ─────────────────────────────────────────────────────────────
  // 1) ECHO path (health check) — leave this so we can always test
  //    POST /api/jobs  body: { "ping": "hello" }
  //    → returns { ok:true, stage:"echo-v2", echo:{...} }
  // ─────────────────────────────────────────────────────────────
  if (req?.body && typeof req.body === "object" && "ping" in req.body) {
    context.res = {
      headers: { "x-rpn-stage": "echo-v2" },
      jsonBody: { ok: true, stage: "echo-v2", method: req.method, echo: req.body },
    };
    return;
  }

  // ─────────────────────────────────────────────────────────────
  // 2) AUTH-ONLY path (no DB yet)
  //    Requires header: Authorization: Bearer <token from localStorage rp_token>
  //    Returns the decoded user (id/email) if the token is valid.
  // ─────────────────────────────────────────────────────────────
  try {
    const auth =
      req.headers?.authorization || req.headers?.Authorization || "";

    if (!auth.startsWith("Bearer ")) {
      context.res = {
        status: 401,
        headers: { "x-rpn-stage": "auth-v1" },
        jsonBody: { error: "no_user", detail: "Missing or invalid token" },
      };
      return;
    }

    const token = auth.slice("Bearer ".length).trim();
    const user = await getUser(token); // expect something like { id, email, ... }

    context.res = {
      headers: { "x-rpn-stage": "auth-v1" },
      jsonBody: {
        ok: true,
        stage: "auth-v1",
        method: req.method,
        user: user ? { id: user.id, email: user.email } : null,
      },
    };
    return;
  } catch (err) {
    context.log("Auth error:", err);
    context.res = {
      status: 401,
      headers: { "x-rpn-stage": "auth-v1" },
      jsonBody: { error: "auth_failed", detail: String(err?.message || err) },
    };
    return;
  }

  // ─────────────────────────────────────────────────────────────
  // 3) (NEXT STEP) DB write will go here after auth is confirmed.
  //    We’ll add SQL only after we see X-RPN-STAGE: auth-v1 with 200.
  // ─────────────────────────────────────────────────────────────
}
