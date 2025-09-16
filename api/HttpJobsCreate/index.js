// Minimal GET/POST handler — no imports
export default async function (context, req) {
  context.res = {
    status: 200,
    headers: { "content-type": "application/json" },
    body: { ok: true, route: "jobs", method: req.method }
  };
}
