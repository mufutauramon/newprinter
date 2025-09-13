export default async function (context, req) {
  return {
    status: 200,
    headers: { "Content-Type": "application/json" },
    body: { ok: true, method: req.method, body: req.body ?? null }
  };
}
