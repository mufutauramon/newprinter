export default async function (context, req) {
  return { status: 200, body: { ok: true, ts: new Date().toISOString() } };
}
