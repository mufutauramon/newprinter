import jwt from "jsonwebtoken";

export default async function (context, req) {
  try {
    const auth = req.headers["authorization"] || "";
    if (!auth.startsWith("Bearer ")) {
      context.res = { status: 401, body: { error: "Missing token" } };
      return;
    }

    const token = auth.slice(7);
    const payload = jwt.decode(token); // just decode, no verify yet

    context.res = {
      status: 200,
      headers: { "content-type": "application/json" },
      body: {
        ok: true,
        route: "jobs",
        method: req.method,
        tokenPayload: payload
      }
    };
  } catch (err) {
    context.log("Auth check failed:", err);
    context.res = { status: 500, body: { error: "Auth step failed" } };
  }
}
