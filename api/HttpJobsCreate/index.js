export default async function (context, req) {
  try {
    context.log("HttpJobsCreate - health probe hit");
    context.res = {
      status: 200,
      headers: { "content-type": "application/json" },
      body: { ok: true, probe: "jobs-create alive", method: req.method, route: "jobs" }
    };
  } catch (e) {
    context.log.error("Health probe failed:", e);
    context.res = { status: 500, body: { error: "probe_failed", detail: String(e) } };
  }
}
