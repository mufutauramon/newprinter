export default async function (context, req) {
  const env = ["SQL_CONNECTION_STRING","JWT_SECRET","FUNCTIONS_NODE_VERSION"];
  const present = Object.fromEntries(env.map(k => [k, !!process.env[k]]));
  context.res = {
    headers: { "content-type": "application/json" },
    body: { status: "ok", present }
  };
}
