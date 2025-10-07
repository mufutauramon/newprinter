// api/HttpJobsCreate/index.js
import { getUser } from "../lib/jwt.js";   // same pattern as HttpMe
// import { getPool, getSql } from "../../lib/sql.js"; // for later DB insert

function safeReply(context, status, stage, body) {
  context.res = {
    status,
    headers: { "x-rpn-stage": stage, "content-type": "application/json" },
    body: JSON.stringify(body ?? {}),
  };
}
const pick = (...vals) => vals.find(v => v !== undefined && v !== null && v !== "");

export default async function (context, req) {
  const b = req.body || {};

  // ---- Normalize incoming body (accept multiple key variants)
  const fileName = pick(b.fileName, b.file_name, b.filename);
  const blobUrl  = pick(b.blobUrl, b.blob_url, b.url, b.readUrl);
  const pagesRaw = pick(b.pages, b.pagesEstimate, b.page_count);
  const colorRaw = pick(b.color, b.colour, b?.meta?.color);
  const duplexRaw= pick(b.duplex, b?.meta?.duplex);

  // Tiny probe support for quick pings
  const looksLikeProbe = !fileName && !blobUrl && (b.ping || Object.keys(b).length <= 2);
  if (looksLikeProbe) return safeReply(context, 200, "echo-v2", { ok: true, method: req.method, echo: b });

  // ---- Auth (strict by default; optional if feature-flag is set)
  const authOptional = process.env.JOBS_AUTH_OPTIONAL === "1";
  let user;
  try {
    user = getUser(req); // { id, email, ... } — must throw if invalid
  } catch (e) {
    if (!authOptional) {
      return safeReply(context, 401, "auth-v1", { error: "auth_failed", detail: "invalid_token" });
    }
    // Dev fallback user so you can keep testing
    user = {
      id: req.headers["x-dev-user-id"] || "dev-user",
      email: req.headers["x-dev-user-email"] || "dev@local",
      dev_mode: true
    };
  }

  // ---- Validate payload
  const pages = Number(pagesRaw);
  if (!fileName || !blobUrl || !Number.isFinite(pages) || pages <= 0) {
    return safeReply(context, 400, "validate-v1", {
      error: "bad_request",
      detail: "fileName, blobUrl, pages (number > 0) are required",
      got: { fileName, blobUrl, pages: pagesRaw }
    });
  }

  // ---- Normalize options
  const normColor = (() => {
    const s = String(colorRaw ?? "").toLowerCase();
    return (s.includes("color") || s === "true" || s === "1") ? 1 : 0;
  })();
  const normDuplex = (() => {
    const s = String(duplexRaw ?? "").toLowerCase();
    return (s.startsWith("y") || s === "true" || s === "1") ? 1 : 0;
  })();

  // ---- Placeholder job (swap with SQL insert later)
  const job = {
    id: Date.now(),
    user_id: user.id,
    file_name: fileName,
    storage_url: blobUrl,
    pages,
    color: normColor,
    duplex: normDuplex,
    status: "queued",
    pickup_code: null,
    created_at: new Date().toISOString(),
    dev_mode: !!user.dev_mode
  };

  return safeReply(context, 201, "job-created-v1", { ok: true, job });
}
