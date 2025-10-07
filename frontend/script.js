// ---------- tiny DOM helpers ----------
const $  = (sel) => document.querySelector(sel);
const $$ = (sel) => Array.from(document.querySelectorAll(sel));

// ---------- toast ----------
function toast(msg, type = "success") {
  const wrap = $("#toast");
  const el = document.createElement("div");
  el.className = `toast ${type}`;
  el.textContent = msg;
  wrap.appendChild(el);
  setTimeout(() => el.remove(), 3500);
}

// ---------- HTTP helpers ----------
async function postJson(url, body = {}, { auth = false } = {}) {
  const headers = { "Content-Type": "application/json" };
  if (auth) {
    const t = localStorage.getItem("rp_token");
    if (t) headers["Authorization"] = `Bearer ${t}`;
  }
  const r = await fetch(url, { method: "POST", headers, body: JSON.stringify(body) });
  const text = await r.text();
  let data = {};
  try { data = text ? JSON.parse(text) : {}; } catch { data = { raw: text }; }
  return { ok: r.ok, status: r.status, data, url };
}

async function getJson(url, { auth = false } = {}) {
  const headers = {};
  if (auth) {
    const t = localStorage.getItem("rp_token");
    if (t) headers["Authorization"] = `Bearer ${t}`;
  }
  const r = await fetch(url, { headers });
  const text = await r.text();
  let data = {};
  try { data = text ? JSON.parse(text) : {}; } catch { data = { raw: text }; }
  return { ok: r.ok, status: r.status, data, url };
}

// ---------- UI state ----------
function setSignedIn(email) {
  $("#authStatus").textContent = email ? `Signed in as ${email}` : "Not signed in";
  $("#signOutBtn").classList.toggle("hidden", !email);
  $("#authSection").classList.toggle("hidden", !!email);
  $("#dash").classList.toggle("hidden", !email);
  if (email) afterSignInBoot(); // load quota + jobs after login/signup
}

// ---------- elements ----------
const emailEl   = $("#email");
const pwdEl     = $("#password");
const signInBtn = $("#signInBtn");
const signUpBtn = $("#signUpBtn");
const signOutBtn= $("#signOutBtn");

// subscribe elements
const subscribeBtn = $("#subscribeBtn");
const planRadios   = $$('.plans input[name="plan"]');

// signup modal elements
const signupModal  = $("#signupModal");
const suFullName   = $("#suFullName");
const suPhone      = $("#suPhone");
const suPlanChip   = $("#suPlan");
const signupClose  = $("#signupClose");
const signupCancel = $("#signupCancel");
const signupSubmit = $("#signupSubmit");

// quota / jobs DOM
const planNameEl = $("#planName");
const remainingEl= $("#remaining");
const quotaFill  = $("#quotaFill");
const jobsTable  = $("#jobsTable tbody");

// ---------- plan helpers ----------
function currentPlan() {
  const r = planRadios.find(r => r.checked);
  return r ? r.value : "Basic";
}
function syncPlanChip() { suPlanChip.textContent = currentPlan(); }
planRadios.forEach(r => r.addEventListener("change", syncPlanChip));
syncPlanChip();

// ---------- Sign up flow (open modal) ----------
signUpBtn.addEventListener("click", () => {
  if (!emailEl.value || !pwdEl.value) {
    toast("Enter email and password first.", "info");
    return;
  }
  suFullName.value = "";
  suPhone.value = "";
  syncPlanChip();
  signupModal.showModal();
});

signupClose.addEventListener("click", () => signupModal.close());
signupCancel.addEventListener("click", () => signupModal.close());

// Create account (POST /api/auth/signup)
signupSubmit.addEventListener("click", async () => {
  const fullName = suFullName.value.trim();
  const phone    = suPhone.value.trim();
  const email    = emailEl.value.trim().toLowerCase();
  const password = pwdEl.value;
  const plan     = currentPlan();

  if (!fullName || !phone)   return toast("Please provide full name and phone.", "info");
  if (!email || !password)   return toast("Email and password are required.", "info");

  const res = await postJson("/api/auth/signup", { fullName, phone, email, password, plan });
  if (res.ok) {
    localStorage.setItem("rp_email", email);
    localStorage.setItem("rp_token", res.data.token || "");
    setSignedIn(email);
    toast("Account created successfully.", "success");
    signupModal.close();
  } else if (res.status === 409) {
    toast("Email already exists.", "error");
  } else {
    toast(`Signup failed (${res.status}).`, "error");
    console.error("signup", res.data);
  }
});

// ---------- Sign in (POST /api/auth/login) ----------
signInBtn.addEventListener("click", async () => {
  const email    = emailEl.value.trim().toLowerCase();
  const password = pwdEl.value;
  if (!email || !password) return toast("Enter email and password.", "info");

  const res = await postJson("/api/auth/login", { email, password });
  if (res.ok) {
    localStorage.setItem("rp_email", email);
    localStorage.setItem("rp_token", res.data.token || "");
    setSignedIn(email);
    toast("Signed in.", "success");
  } else if (res.status === 401) {
    toast("Invalid email/password.", "error");
  } else {
    toast(`Login failed (${res.status}).`, "error");
    console.error("login", res.data);
  }
});

// ---------- Subscribe / Update plan (POST /api/subscribe) ----------
subscribeBtn.addEventListener("click", async () => {
  const token = localStorage.getItem("rp_token");
  if (!token) return toast("Please sign in first.", "info");

  const planName = currentPlan();
  const res = await postJson("/api/subscribe", { planName }, { auth: true });
  if (res.ok) {
    toast(`Subscription set to ${planName}.`, "success");
    await refreshQuota(); // immediately show quota
  } else {
    toast(`Failed to update plan (${res.status}).`, "error");
    console.error("subscribe", res.data);
  }
});

// ---------- Sign out ----------
signOutBtn.addEventListener("click", () => {
  localStorage.removeItem("rp_token");
  localStorage.removeItem("rp_email");
  setSignedIn(null);
  toast("Signed out.", "success");
});

// ================= REMOTEPRINT NG: DASHBOARD WIRING =================

// endpoints (match your function.json + handlers)
const ENDPOINTS = {
  me:        "/api/HttpMe",       // GET  -> { email, subscription:{ pages_remaining, plan, quota_pages } }
  jobsList:  "/api/HttpJobsList", // GET  -> [{...}]  (fallback to /api/jobs if 404)
  jobsListAlt: "/api/jobs",       // GET  -> may echo; we'll still try
  blobSas:   "/api/blob/sas",     // POST -> { uploadUrl, blobUrl, blobName }
  jobs:      "/api/jobs",         // POST -> { fileName, blobUrl, pages, color, duplex }  (auth)
  price:     "/api/HttpPrice"     // POST -> { priceNaira } (optional)
};

// ---- QUOTA (adapts to HttpMe shape) ----
async function refreshQuota() {
  const res = await getJson(ENDPOINTS.me, { auth: true });
  if (!res.ok) {
    console.error("HttpMe error", res.status, res.data);
    planNameEl.textContent = "—";
    remainingEl.textContent = "0";
    quotaFill.style.width = "0%";
    return;
  }

  const d = res.data || {};
  const sub = d.subscription || null;

  if (!sub) {
    planNameEl.textContent = "—";
    remainingEl.textContent = "0";
    quotaFill.style.width = "0%";
    toast("No active subscription/quota for this account.", "info");
    return;
  }

  const planName  = sub.plan || "—";
  const total     = Number(sub.quota_pages ?? 0);
  const remaining = Number(sub.pages_remaining ?? 0);

  planNameEl.textContent  = planName;
  remainingEl.textContent = String(remaining);
  const pct = total ? Math.max(0, Math.min(100, Math.round((remaining / total) * 100))) : 0;
  quotaFill.style.width = pct + "%";

  window.__quota = { planName, total, remaining };
}

// ---- JOBS LIST (try HttpJobsList, then /api/jobs) ----
async function refreshJobs() {
  let res = await getJson(ENDPOINTS.jobsList, { auth: true });
  if (!res.ok && res.status === 404) {
    res = await getJson(ENDPOINTS.jobsListAlt, { auth: true });
  }
  if (!res.ok) {
    console.error("Jobs list error", res.status, res.data);
    return;
  }

  // Prefer array; otherwise check res.data.jobs
  const list = Array.isArray(res.data) ? res.data : (res.data.jobs || []);
  if (!Array.isArray(list)) {
    // If it's the echo from your POST handler, just skip rendering
    return;
  }

  jobsTable.innerHTML = "";
  for (const j of list) {
    const meta = j.meta_json ? (typeof j.meta_json === "string" ? JSON.parse(j.meta_json) : j.meta_json) : {};
    const created = j.created_at || j.createdAt || j.time;
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${created ? new Date(created).toLocaleString() : "—"}</td>
      <td>${j.filename || j.file_name || j.file || "—"}</td>
      <td>${j.pages ?? j.page_count ?? "—"}</td>
      <td>${(j.color ?? meta.color) ? "Color" : "B/W"} • ${(j.duplex ?? meta.duplex) ? "Duplex" : "Simplex"}</td>
      <td>${j.status || "uploaded"}</td>
      <td>${j.pickup_code || j.code || ""}</td>
    `;
    jobsTable.appendChild(tr);
  }
}

// ---- Price (server, with client fallback) ----
$("#priceBtn")?.addEventListener("click", async () => {
  const pages = parseInt($("#pages").value || "0", 10);
  if (!pages) { $("#priceOut").textContent = "—"; return; }
  const res = await postJson(ENDPOINTS.price, {
    pages,
    color:  $("#color").value === "color",
    duplex: $("#duplex").value === "true"
  }, { auth: true });

  if (res.ok && typeof res.data?.priceNaira === "number") {
    $("#priceOut").textContent = `₦ ${res.data.priceNaira.toLocaleString()}`;
  } else {
    const perSide = ($("#color").value === "color") ? 70 : 25;
    $("#priceOut").textContent = `₦ ${(perSide * pages).toLocaleString()}`;
  }
});

// ---- Upload: /api/blob/sas (anon) -> PUT -> /api/jobs (auth) ----
async function sendToPrint() {
  try {
    if (!localStorage.getItem("rp_token")) { toast("Please sign in first.", "info"); return; }

    const file  = $("#fileInput").files[0];
    const pages = parseInt($("#pages").value || "0", 10);
    if (!file || !pages) { toast("Choose a file and enter pages.", "info"); return; }

    // your HttpJobsCreate normalizes strings like "color"/"bw" and "Yes"/"No"
    const color   = $("#color").value;              // "bw" or "color"
    const duplex  = $("#duplex").value === "true" ? "Yes" : "No"; // send "Yes"/"No" to be safe

    // 1) SAS (anonymous)
    const r1 = await postJson(ENDPOINTS.blobSas, {
      fileName: file.name,
      contentType: file.type || "application/octet-stream"
    }, { auth: false });

    if (!r1.ok) {
      console.error("blob/sas error", r1.status, r1.data, "url:", r1.url);
      toast(r1.data?.error || r1.data?.message || `Could not get upload URL (status ${r1.status})`, "error");
      return;
    }
    const { uploadUrl, blobUrl } = r1.data;

    // 2) Upload to Blob
    const put = await fetch(uploadUrl, {
      method: "PUT",
      headers: { "x-ms-blob-type": "BlockBlob", "content-type": file.type || "application/octet-stream" },
      body: file
    });
    if (!put.ok) throw new Error(`Upload to storage failed (status ${put.status})`);

    // 3) Confirm job (authorized) — EXACT keys your handler checks
    const r2 = await postJson(ENDPOINTS.jobs, {
      fileName: file.name,
      blobUrl,         // read-enabled URL from SAS
      pages,
      color,           // "bw" or "color" (your code will lower-case and map)
      duplex           // "Yes" or "No" (your code handles several truthy strings)
    }, { auth: true });

    if (!r2.ok) {
      console.error("POST /api/jobs error", r2.status, r2.data);
      toast(r2.data?.error || r2.data?.message || "Unable to queue job.", "error");
      return;
    }

    toast("Uploaded and queued.", "success");
    await refreshQuota();
    await refreshJobs();
  } catch (e) {
    console.error(e);
    toast(e.message || "Upload error.", "error");
  }
}
$("#sendBtn")?.addEventListener("click", sendToPrint);

// ---- after sign-in loader ----
async function afterSignInBoot() {
  await refreshQuota();
  await refreshJobs();
}

// ---------- boot ----------
(function init() {
  const email = localStorage.getItem("rp_email");
  const token = localStorage.getItem("rp_token");
  setSignedIn(email && token ? email : null);
})();
