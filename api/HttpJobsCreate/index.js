// api/HttpJobsCreate/index.js
export default async function (context, req) {
  // -------- 0) CRASH GUARD --------
  const safeReply = (status, stage, body) => {
    context.res = {
      status,
      headers: { "x-rpn-stage": stage },
      // Azure Functions for Node v4: use jsonBody for JSON
      jsonBody: body,
    };
  };

  try {
    // -------- 1) ECHO PATH (health check) --------
    if (req?.body && typeof req.body === "object" && "ping" in req.body) {
      safeReply(200, "echo-v2", {
        ok: true,
        stage: "echo-v2",
        method: req.method,
        echo: req.body,
      });
      return;
    }

    // -------- 2) AUTH PATH (no DB yet) --------
    // Do the import *inside* the handler so a bad import won't crash at load time
    let getUser;
    try {
      ({ getUser } = await import("../lib/jwt.js"));
    } catch (e) {
      safeReply(500, "crash-import", {
        error: "import_failed",
        detail: String(e?.message || e),
      });
      return;
    }

    const authHeader =
      req.headers?.authorization || req.headers?.Authorization || "";
    if (!authHeader.startsWith("Bearer ")) {
      safeReply(401, "auth-v1", {
        error: "no_user",
        detail: "Missing or invalid token",
      });
      return;
    }

    const token = authHeader.slice("Bearer ".length).trim();

    let user;
    try {
      user = await getUser(token); // expect something like { id, email }
    } catch (e) {
      safeReply(401, "auth-v1", {
        error: "auth_failed",
        detail: String(e?.message || e),
      });
      return;
    }

    safeReply(200, "auth-v1", {
      ok: true,
      stage: "auth-v1",
      method: req.method,
      user: user ? { id: user.id, email: user.email } : null,
    });
  } catch (e) {
    // Final guard: if anything else explodes, report it
    safeReply(500, "crash-v1", {
      error: "unhandled",
      detail: String(e?.message || e),
    });
  }
}
