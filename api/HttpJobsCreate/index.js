// api/HttpJobsCreate/index.js
export default async function (context, req) {
  context.res = {
    status: 200,
    headers: { "content-type": "application/json" },
    body: { ok: true, step: "jobs-create-alive" }
  };
}
