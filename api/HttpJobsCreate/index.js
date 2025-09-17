// api/HttpJobsCreate/index.js
// Node v18, Azure Functions v4, package.json has "type":"module"

function safeReply(context, status, stage, bodyObj = {}) {
  context.res = {
    status,
    headers: { "x-rpn-stage": stage, "content-type": "application/json" },
    body: JSON.stringify(bodyObj),
  };
}

/** Normalize inputs coming from the front-end */
function coerceIncoming(body = {}) {
  const fileName  = (body.fileName || body.filename || "").toString();
  const blobUrl   = (body.blobUrl  || body.storage_url || "").toString();
  const pagesNum  = parseInt(body.pages, 10);
  const pages     = Number.isFinite(pagesNum) && pagesNum > 0 ? pagesNum : 1;

  // "color" can be "color", "bw", true/false, etc.
  const colorStr  = (body.color || "").toString().toLowerCase();
  const color     = colorStr.includes("color") || colorStr === "1" || colorStr === "true";

  // "duplex" usually "Yes"/"No"
  const duplexStr = (body.duplex || "").toString().toLowerCase();
  const duplex    = duplexStr.startsWith("y") || duplexStr === "1" || duplexStr === "true";

  return { fileName, blobUrl, pages, color, duplex };
}

export default async function (context, req) {
  // ---------- Echo path (no auth header) ----------
  const authHeader = req.headers?.authorization || req.headers?.Authorization;
  if (!authHeader) {
    // Leave the echo probe in place for quick health checks
    safeReply(context, 200, "echo-v2", {
      ok: true,
      method: req.method || "POST",
      echo: req.body ?? {},
    });
    return;
  }

  // ---------- Try to import libs ----------
  let getUser, getPool, getSql;
  try {
    ({ getUser } = await import("../lib/jwt.js"));   // <-- your path
    ({ getPool, getSql } = await import("../lib/sql.js")); // <-- your path
  } catch (e) {
    safeReply(context, 500, "crash-import", {
      error: "import_failed",
      detail: String(e?.message || e),
    });
    return;
  }

  // ---------- Verify token ----------
  const m = /^Bearer\s+(.+)$/i.exec(authHeader);
  const token = m?.[1];
  if (!token) {
    safeReply(context, 401, "auth-v1", { error: "no_token" });
    return;
  }

  let user;
  try {
    user = await getUser(token); // should return { id, email, ... }
    if (!user?.id) throw new Error("getUser returned no id");
  } catch (e) {
    safeReply(context, 401, "auth-v1", {
      error: "auth_failed",
      detail: String(e?.message || e),
    });
    return;
  }

  // ---------- Validate body & insert job ----------
  const { fileName, blobUrl, pages, color, duplex } = coerceIncoming(req.body);

  if (!fileName || !blobUrl) {
    safeReply(context, 400, "auth-v1", {
      error: "bad_request",
      detail: "fileName and blobUrl are required",
    });
    return;
  }

  try {
    const pool = await getPool();
    const sql = getSql();

    // Insert the job and return the inserted row
    const result = await pool.request()
      .input("user_id",     sql.Int,  user.id)
      .input("file_name",   sql.NVarChar, fileName)
      .input("storage_url", sql.NVarChar, blobUrl)
      .input("pages",       sql.Int, pages)
      .input("color",       sql.Bit, color ? 1 : 0)
      .input("duplex",      sql.Bit, duplex ? 1 : 0)
      .input("status",      sql.NVarChar, "queued")
      .query(`
        INSERT INTO dbo.Jobs (user_id, file_name, storage_url, pages, color, duplex, status, created_at)
        OUTPUT inserted.*
        VALUES (@user_id, @file_name, @storage_url, @pages, @color, @duplex, @status, SYSUTCDATETIME());
      `);

    const row = result.recordset?.[0] || null;
    safeReply(context, 200, "auth-v1", { ok: true, job: row });
  } catch (e) {
    safeReply(context, 500, "auth-v1", {
      error: "sql_error",
      detail: String(e?.message || e),
    });
  }
}
