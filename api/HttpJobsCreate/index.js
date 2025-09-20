// api/HttpJobsCreate/index.js
import { getUser } from "../lib/jwt.js"; // <-- your path
// If you’ll add SQL later, you can import here:
// import { getPool, getSql } from "../../lib/sql.js";

//import { secretFingerprint } from "../lib/jwt.js"; // adjust path as needed

//context.log("JWT FP:", secretFingerprint());

function safeReply(context, status, stage, body) {
  context.res = {
    status,
    headers: { "x-rpn-stage": stage, "content-type": "application/json" },
    body: JSON.stringify(body ?? {}),
  };
}

export default async function (context, req) {
  // --- Stage 0: basic body read / tiny validation
  const body = req.body || {};
  const {
    fileName,
    blobUrl,
    pages,
    color,   // "bw" | "color" | "Black & White" | etc
    duplex,  // "Yes"/"No" or boolean-ish
  } = body;

  // If this looks like a pure probe / or clearly not a job payload, echo it
  const looksLikeProbe =
    !fileName && !blobUrl && (body.ping || Object.keys(body).length <= 2);
  if (looksLikeProbe) {
    safeReply(context, 200, "echo-v2", { ok: true, method: req.method, echo: body });
    return;
  }

  // --- Stage 1: parse Authorization header robustly
  // Accept "authorization" or "Authorization"
  const rawAuth =
    req.headers?.authorization ?? req.headers?.Authorization ?? "";

  // Regex will only match if there is *something* after "Bearer"
  const m = /^Bearer\s+(.+)$/.exec(rawAuth);
  const token = m?.[1]?.trim();

  // IMPORTANT:
  // If there is NO header, or header is "Bearer" with nothing after it,
  // we DO NOT 401. We just respond with an echo so your front-end can keep testing.
  // (Production: you can change this to return 401 if you prefer.)
  if (!rawAuth || !token) {
    safeReply(context, 200, "echo-v2", {
      ok: true,
      method: req.method,
      echo: body,
      note: "no_bearer_header_or_empty",
    });
    return;
  }

  // --- Stage 2: verify token when present
  let user = null;
  try {
    user = getUser(token); // { id, email, is_operator, ... }
    if (!user?.id) throw new Error("no_sub");
  } catch (e) {
    safeReply(context, 401, "auth-v1", {
      error: "auth_failed",
      detail: "invalid_token",
    });
    return;
  }

  // --- Stage 3: validate job payload now that we have a user
  if (!fileName || !blobUrl || !pages) {
    safeReply(context, 400, "validate-v1", {
      error: "bad_request",
      detail: "fileName, blobUrl, pages are required",
    });
    return;
  }

  // Normalize a couple of fields so your DB code is easier later
  const normColor = (() => {
    const s = String(color ?? "").toLowerCase();
    if (s.includes("color")) return 1; // bit 1
    return 0; // bit 0
  })();
  const normDuplex = (() => {
    const s = String(duplex ?? "").toLowerCase();
    if (s.startsWith("y") || s === "true" || s === "1") return 1;
    return 0;
  })();

  // --- Stage 4: (placeholder) queue job / insert to DB
  // Keep it simple for now so you can see success from the front-end.
  // You can replace this block with your real SQL insert later.

  // Example fake job row
  const job = {
    id: Date.now(), // placeholder
    user_id: user.id,
    file_name: fileName,
    storage_url: blobUrl,
    pages: Number(pages) || 1,
    color: normColor,
    duplex: normDuplex,
    status: "queued",
    pickup_code: null,
    created_at: new Date().toISOString(),
  };

  safeReply(context, 201, "job-created-v1", { ok: true, job });
}
