export default async function (context, req) {
  context.log("OK hit", new Date().toISOString(), req.method);
  context.res = {
    status: 200,
    headers: { "Content-Type": "application/json", "X-Debug": String(Date.now()) },
    body: { ok: true, method: req.method, body: req.body ?? null }
  };
  // no return value needed when using context.res
}
