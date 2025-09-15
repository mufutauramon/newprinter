export default async function (context, req) {
  context.res = {
    headers: { "content-type": "application/json" },
    body: { ok: true, when: new Date().toISOString() }
  };
}
