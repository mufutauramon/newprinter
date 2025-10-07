// api/HttpJobsCreate/index.js
import { getUser } from "../../lib/jwt.js";         // <— same style as HttpMe
// If you’ll add SQL later, you can import here:
// import { getPool, getSql } from "../../lib/sql.js";

function safeReply(context, status, stage, body) {
  context.res = {
    status,
    headers: { "x-rpn-stage": stage, "content-type": "application/json" },
    body: JSON.stringify(body ?? {}),
  };
}

function pickFirst(...vals) {
  for (const v of vals) if (v !== undefined && v !== null && v !== "") return v;
  return undefined;
}

export default async function (context, req) {
  // ---- Stage 0: read + normalize body
  const b = req.body || {};
  const fileName = pickFirst(b.fileName, b.file_name, b.filename);
  const blobUrl  = pickFirst(b.blobUrl, b.blob_url, b.url, b.readUrl);
  const pagesRaw = pickFirst(b.pages, b.pagesEstimate, b.page_count);
  const colorRaw = pickFirst(b.color, b.colour, (b.meta && b.meta.color));
  const duplexRaw= pickFirst(b.duplex, (b.meta && b.meta.duplex));

  // Probe/echo for tiny bodies (keeps your helpful dev behavior)
  const looksLikeProbe =
    !fileName && !blobUrl && (b.ping || Object.keys(b).length <= 2);
  if (looksLikeProbe) {
    safeReply(context, 200, "echo-v2", { ok: true, method: req.method, echo: b });
    return;
  }

  // ---- Stage 1: auth (same approach as HttpMe)
  let user;
  try {
    user = getUser(req); // must throw if invalid/missing
  } catch (e) {
    safeReply(context, 401, "auth-v1", { error: "auth_failed", detail: "invalid_token" });
    return;
  }

  // ---- Stage 2: validate payload
  const pages = Number(pagesRaw);
  if (!fileName || !blobUrl || !Number.isFinite(pages) || pages <= 0) {
    safeReply(context, 400, "validate-v1", {
      error: "bad_request",
      detail: "fileName, blobUrl, pages (number > 0) are required",
      got: { fileName, blobUrl, pages: pagesRaw }
    });
    return;
  }

  // ---- Stage 3: normalize options
  const normColor = (() => {
    const s = String(colorRaw ?? "").toLowerCase();
    // accepts "color", true-like strings, or 1
    if (s.includes("color") || s === "true" || s === "1") return 1;
    return 0;
  })();

  const normDuplex = (() => {
    const s = String(duplexRaw ?? "").toLowerCase();
    // accepts "yes", "true", "1"
    if (s.startsWith("y") || s === "true" || s === "1") return 1;
    return 0;
  })();

  // ---- Stage 4: (placeholder) create/queue job
  // Replace this with your SQL insert later.
  const job = {
    id: Date.now(), // placeholder
    user_id: user.id,
    file_name: fileName,
    storage_url: blobUrl,
    pages,
    color: normColor,
    duplex: normDuplex,
    status: "queued",
    pickup_code: null,
    created_at: new Date().toISOString(),
  };

  safeReply(context, 201, "job-created-v1", { ok: true, job });
}
