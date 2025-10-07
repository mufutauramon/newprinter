// api/HttpJobsCreate/index.js
import { getUser } from "../lib/jwt.js";
import { getPool, getSql } from "../lib/sql.js";

function reply(context, status, body, stage = "") {
  context.res = {
    status,
    headers: { "content-type": "application/json", "x-rpn-stage": stage },
    body: JSON.stringify(body ?? {}),
  };
}

const pick = (...vals) => vals.find(v => v !== undefined && v !== null && v !== "");

export default async function (context, req) {
  try {
    // ---- 1) Parse + normalize request
    const b = req.body || {};
    const fileName = pick(b.fileName, b.file_name, b.filename);
    const blobUrl  = pick(b.blobUrl, b.blob_url, b.url, b.readUrl);
    const pagesRaw = pick(b.pages, b.pagesEstimate, b.page_count);
    const colorRaw = pick(b.color, b.colour, b?.meta?.color);
    const duplexRaw= pick(b.duplex, b?.meta?.duplex);

    // quick probe support
    const looksLikeProbe = !fileName && !blobUrl && (b.ping || Object.keys(b).length <= 2);
    if (looksLikeProbe) return reply(context, 200, { ok: true, method: req.method, echo: b }, "echo");

    // ---- 2) Auth (same style as HttpMe)
    let user;
    try {
      user = getUser(req); // throws 401 on invalid/missing token
    } catch (e) {
      return reply(context, 401, { error: "auth_failed", detail: "invalid_token" }, "auth");
    }
    const uid = Number(user.sub || user.id);
    if (!uid || Number.isNaN(uid)) {
      return reply(context, 401, { error: "auth_failed", detail: "no_user_id" }, "auth");
    }

    // ---- 3) Validate payload
    const pages = Number(pagesRaw);
    if (!fileName || !blobUrl || !Number.isFinite(pages) || pages <= 0) {
      return reply(
        context,
        400,
        { error: "bad_request", detail: "fileName, blobUrl, pages (number > 0) are required", got: { fileName, blobUrl, pages: pagesRaw } },
        "validate"
      );
    }

    // Normalize options (accepts "color"/"bw", "Yes"/"No", booleans, 1/0)
    const normColor = (() => {
      const s = String(colorRaw ?? "").toLowerCase();
      return (s.includes("color") || s === "true" || s === "1") ? 1 : 0;
    })();
    const normDuplex = (() => {
      const s = String(duplexRaw ?? "").toLowerCase();
      return (s.startsWith("y") || s === "true" || s === "1") ? 1 : 0;
    })();

    // ---- 4) Insert job (TEMP: no subscription deduction)
    const sql  = getSql();
    const pool = await getPool();

    const pickup = Math.floor(100000 + Math.random() * 900000).toString(); // 6-digit
    const ins = await pool
      .request()
      .input("uid", sql.Int, uid)
      .input("fn",  sql.NVarChar(260),  fileName)
      .input("url", sql.NVarChar(2048), blobUrl)
      .input("pg",  sql.Int,            pages)
      .input("clr", sql.Bit,            normColor)
      .input("dx",  sql.Bit,            normDuplex)
      .input("pc",  sql.VarChar(12),    pickup)
      .query(`
        INSERT INTO Jobs (user_id, file_name, storage_url, pages, color, duplex, pickup_code, status, created_at)
        OUTPUT inserted.id, inserted.user_id, inserted.file_name, inserted.storage_url,
               inserted.pages, inserted.color, inserted.duplex, inserted.status,
               inserted.pickup_code, inserted.created_at
        VALUES (@uid, @fn, @url, @pg, @clr, @dx, @pc, 'Queued', SYSUTCDATETIME());
      `);

    const row = ins.recordset?.[0] || null;
    if (!row) return reply(context, 500, { error: "insert_failed" }, "db");

    // ---- 5) Success (201)
    return reply(context, 201, { ok: true, job: row }, "job-created");
  } catch (err) {
    context.log?.error?.("HttpJobsCreate error", err);
    return reply(context, 500, { error: "server_error", detail: String(err?.message || err) }, "catch");
  }
}
