export default async function (context, req) {
  return {
    status: 200,
    headers: { "Content-Type": "application/json" },
    body: { url: req.url, method: req.method, body: req.body ?? null, headers: req.headers }
  };
}
