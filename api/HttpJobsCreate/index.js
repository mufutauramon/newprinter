// api/HttpJobsCreate/index.js  (BARE TEST)
export default async function (context, req) {
  context.res = {
    status: 200,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "x-rpn-stage": "bare-v1"
    },
    body: JSON.stringify({
      ok: true,
      stage: "bare-v1",
      method: req.method || null,
      echo: req.body ?? null
    })
  };
}
