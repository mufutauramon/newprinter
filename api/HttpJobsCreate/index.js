// api/HttpJobsCreate/index.js
import { getUser, secretFingerprint } from "../lib/jwt.js"; // same lib as login/HttpMe

function safeReply(context, status, stage, body) {
  context.res = {
    status,
    headers: { "x-rpn-stage": stage, "content-type": "application/json" },
    body: JSON.stringify(body ?? {}),
  };
}

const pick = (...vals) => vals.find(v => v !== undefined && v !== null && v !== "");

export default async function (context, req) {
  // ---- Normalize body (accept a few aliases)
  const b = req.body || {};
  const fileName = pick(b.fileName, b.file_name, b.filename);
  const blobUrl  = pick(b.blobUrl, b.blob_url, b.url, b.readUrl);
  const pagesRaw = pick(b.pages, b.pagesEstimate, b.page_count);
  const colorRaw = pick(b.color, b.colour, b?.meta?.color);
  const duplexRaw= pick(b.duplex, b?.meta?.duplex);

  // quick echo for probes
  const looksLikeProbe = !fileName && !blobUrl && (b.ping || Object.keys(b).length <= 2);
  if (looksLikeProbe) return safeReply(context, 200, "echo-v2", { ok: true, method: req.method, echo: b });

  // ---- AUTH (strict). If it fails, include debug (no token contents)
  const authHeader = req.headers?.authorization || req.headers?.Authorization || "";
  const bearerMatch = /^Bearer\s+(.+)$/i.exec(authHeader);
  const bearerToken = bearerMatch?.[1] || "";
  try {
    // IMPORTANT: this must match the same SECRET as used by HttpAuthLogin
    const user = getUser(req); // throws on invalid
    // ---- Validate payload
    const pages = Number(pagesRaw);
    if (!fileName || !blobUrl || !Number.isFinite(pages) || pages <= 0) {
      return safeReply(context, 400, "validate-v1", {
        error: "bad_request",
        detail: "fileName, blobUrl, pages (number > 0) are required",
        got: { fileName, blobUrl, pages: pagesRaw }
      });
    }

    // normalize options
    const normColor = (() => {
      const s = String(colorRaw ?? "").toLowerCase();
      return (s.includes("color") || s === "true" || s === "1") ? 1 : 0;
    })();
    const normDuplex = (() => {
      const s = String(duplexRaw ?? "").toLowerCase();
      return (s.startsWith("y") || s === "true" || s === "1") ? 1 : 0;
    })();

    // placeholder job (swap for SQL later)
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
    };

    return safeReply(context, 201, "job-created-v1", { ok: true, job });
  } catch (e) {
    // show *useful* debug so you can fix env/config quickly
    return safeReply(context, 401, "auth-v1", {
      error: "auth_failed",
      detail: String(e?.message || e),
      sawAuthHeader: !!authHeader,
      bearerLength: bearerToken ? bearerToken.length : 0,
      // these help you verify BOTH functions use the SAME secret
      jwtSecretFp: secretFingerprint(),              // from this function's env
      hint: "Ensure JWT_SECRET matches HttpAuthLogin and that the client sends Authorization: Bearer <token> to /api/jobs"
    });
  }
}
