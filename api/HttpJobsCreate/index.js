// api/HttpJobsCreate/index.js
// Robust version: handles CORS, echo, and lazy-loads getUser so top-level import
// can’t crash the function before we respond.

export default async function (context, req) {
  // ---- CORS & common headers
  const baseHeaders = {
    "content-type": "application/json; charset=utf-8",
    "access-control-allow-origin": "*",
    "access-control-allow-methods": "GET,POST,OPTIONS",
    "access-control-allow-headers": "authorization,content-type",
  };

  // ---- 1) Handle preflight
  if (req.method === "OPTIONS") {
    context.res = { status: 204, headers: baseHeaders };
    return;
  }

  // ---- 2) Ultra-safe echo path (no auth, no DB, no imports)
  try {
    if (req?.body && req.body.ping) {
      context.res = {
        status: 200,
        headers: { ...baseHeaders, "x-rpn-stage": "echo-v2" },
        body: { ok: true, stage: "echo-v2", method: req.method || "POST", echo: req.body },
      };
      return;
    }
  } catch (e) {
    // even echo should not explode; fall through to error below
  }

  try {
    // ---- 3) Basic Authorization header check (still BEFORE we import jwt)
    const auth =
      req.headers?.authorization ||
      req.headers?.Authorization ||
      null;

    if (!auth || !auth.startsWith("Bearer ")) {
      context.res = {
        status: 401,
        headers: baseHeaders,
        body: { error: "no_user", detail: "Missing or invalid Authorization header" },
      };
      return;
    }

    // ---- 4) Lazy-load getUser to avoid top-level import crashes
    let getUser;
    try {
      ({ getUser } = await import("../../lib/jwt.js"));
    } catch (impErr) {
      context.log.error("Failed to import jwt.js:", impErr);
      context.res = {
        status: 500,
        headers: baseHeaders,
        body: { error: "server_error", detail: "JWT module failed to load" },
      };
      return;
    }

    // ---- 5) Verify token
    let user;
    try {
      user = getUser(req);
    } catch (e) {
      context.log.error("getUser failed:", e);
      context.res = {
        status: 401,
        headers: baseHeaders,
        body: { error: "invalid_token", detail: e?.message || "Token verification failed" },
      };
      return;
    }

    if (!user || (!user.id && !user.sub)) {
      context.res = {
        status: 401,
        headers: baseHeaders,
        body: { error: "no_user", detail: "Token decoded but no user id/sub present" },
      };
      return;
    }

    // ---- 6) Validate incoming job payload early
    const { fileName, blobUrl, pages, color, duplex } = req.body || {};
    if (!fileName || !blobUrl) {
      context.res = {
        status: 400,
        headers: baseHeaders,
        body: { error: "bad_request", detail: "fileName and blobUrl are required" },
      };
      return;
    }

    // ---- 7) TODO: your existing SQL insert goes here (unchanged).
    // Keep your current DB code; when ready, drop it back in this block.
    // For now, return a temp success so the frontend can continue.
    context.res = {
      status: 200,
      headers: { ...baseHeaders, "x-rpn-stage": "auth-ok" },
      body: {
        ok: true,
        received: { fileName, blobUrl, pages, color, duplex },
        user: { id: user.id ?? user.sub ?? null, email: user.email ?? null },
      },
    };
  } catch (err) {
    // ---- 8) Final guard: always return JSON
    context.log.error("HttpJobsCreate fatal error:", err);
    context.res = {
      status: 500,
      headers: baseHeaders,
      body: { error: "server_error", detail: err?.message || String(err) },
    };
  }
}
