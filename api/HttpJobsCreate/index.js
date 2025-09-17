import { getUser } from "../../lib/jwt.js";

export default async function (context, req) {
  try {
    const user = getUser(req); // verifies JWT (uses JWT_SECRET)
    context.res = {
      status: 200,
      headers: { "content-type": "application/json" },
      body: { ok: true, stage: "auth", user }
    };
  } catch (e) {
    context.res = {
      status: e.status || 401,
      headers: { "content-type": "application/json" },
      body: { ok: false, stage: "auth", error: String(e.message || e) }
    };
  }
}
