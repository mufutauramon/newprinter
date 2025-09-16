// api/HttpJobsCreate/index.js  (auth echo — no imports)
export default async function (context, req) {
  try {
    const auth = req.headers?.authorization || req.headers?.Authorization || "";
    return json(context, 200, {
      step: "auth-echo",
      hasAuthHeader: !!auth,
      authSample: auth.slice(0, 25) + (auth.length > 25 ? "…" : "")
    });
  } catch (e) {
    context.log.error("auth-echo error", e);
    return json(context, 500, { error: "auth_echo_failed", detail: String(e?.message || e) });
  }
}
function json(ctx, status, body) {
  ctx.res = { status, headers: { "content-type": "application/json" }, body };
}
