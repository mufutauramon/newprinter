// api/HttpJobsCreate/index.js
// SAFE, SURGICAL UPDATE: keeps your existing getUser + (optional) SQL code.
// It only returns clean JSON errors instead of blank 500s.

import { getUser } from "../../lib/jwt.js";          // your existing helper
// If you already use SQL here, keep your imports:
// import { getPool, getSql } from "../../lib/sql.js";

export default async function (context, req) {
  // ---- 0) quick probe (no auth, no DB) so we can test easily
  if (req?.body && req.body.ping) {
    context.res = {
      status: 200,
      headers: { "content-type": "application/json", "x-rpn-stage": "echo-v1" },
      body: { ok: true, stage: "echo-v1", method: req.method || "POST", echo: req.body }
    };
    return;
  }

  try {
    // ---- 1) basic header check (before calling getUser)
    const auth =
      req.headers?.authorization ||
      req.headers?.Authorization ||
      null;

    if (!auth || !auth.startsWith("Bearer ")) {
      context.res = {
        status: 401,
        headers: { "content-type": "application/json" },
        body: { error: "no_user", detail: "Missing or invalid Authorization header" }
      };
      return;
    }

    // ---- 2) call your existing getUser (if it throws, we catch below)
    let user;
    try {
      user = getUser(req); // your original function
    } catch (e) {
      context.log.error("getUser failed:", e);
      context.res = {
        status: 401,
        headers: { "content-type": "application/json" },
        body: { error: "invalid_token", detail: e?.message || "Token verification failed" }
      };
      return;
    }

    if (!user || (!user.id && !user.sub)) {
      context.res = {
        status: 401,
        headers: { "content-type": "application/json" },
        body: { error: "no_user", detail: "Token decoded but no user id/sub present" }
      };
      return;
    }

    // ---- 3) validate request payload (so we return 400 instead of 500 on bad data)
    const { fileName, blobUrl, pages, color, duplex } = req.body || {};
    if (!fileName || !blobUrl) {
      context.res = {
        status: 400,
        headers: { "content-type": "application/json" },
        body: { error: "bad_request", detail: "fileName and blobUrl are required" }
      };
      return;
    }

    // ---- 4) If you already had SQL insert logic, keep it here.
    // Example shape (do NOT change your existing working code):
    /*
    const pool = await getPool();
    const sql  = getSql();
    const result = await pool.request()
      .input("user_id", sql.Int, user.id ?? parseInt(user.sub, 10))
      .input("file_name", sql.NVarChar(255), fileName)
      .input("storage_url", sql.NVarChar(sql.MAX), blobUrl)
      .input("pages", sql.Int, Number(pages || 1))
      .input("color", sql.Bit, (String(color).toLowerCase().includes("color") ? 1 : 0))
      .input("duplex", sql.Bit, (String(duplex).toLowerCase().startsWith("y") ? 1 : 0))
      .query(`
        INSERT INTO dbo.Jobs (user_id, file_name, storage_url, pages, color, duplex, status, created_at)
        OUTPUT INSERTED.*
        VALUES (@user_id, @file_name, @storage_url, @pages, @color, @duplex, 'Queued', SYSUTCDATETIME())
      `);

    const row = result.recordset?.[0];
    context.res = {
      status: 200,
      headers: { "content-type": "application/json" },
      body: row || { ok: true }  // return the inserted job row
    };
    return;
    */

    // ---- 5) TEMP success (while we isolate auth): remove once SQL is back
    context.res = {
      status: 200,
      headers: { "content-type": "application/json" },
      body: {
        ok: true,
        received: { fileName, blobUrl, pages, color, duplex },
        user: { id: user.id ?? user.sub ?? null, email: user.email ?? null }
      }
    };
  } catch (err) {
    // ---- 6) final safety net: always return JSON, never blank 500
    context.log.error("HttpJobsCreate fatal error:", err);
    context.res = {
      status: 500,
      headers: { "content-type": "application/json" },
      body: {
        error: "server_error",
        detail: err?.message || String(err)
      }
    };
  }
}
