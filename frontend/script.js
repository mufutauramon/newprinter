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

// Optionally set window.API_BASE = "https://<your-site>" if functions are separate
const API_BASE = (typeof window !== "undefined" && window.API_BASE) ? window.API_BASE : "";

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

  const res = await postJson(`${API_BASE}/api/auth/signup`, { fullName, phone, email, password, plan });
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

  const res = await postJson(`${API_BASE}/api/auth/login`, { email, password });
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
  const res = await postJson(`${API_BASE}/api/subscribe`, { planName }, { auth: true });
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

// backend endpoints (base is prefixed with API_BASE; SAS path is auto-discovered)
const ENDPOINTS = {
  me:        `${API_BASE}/api/HttpMe`,           // GET  -> { email, subscription:{ pages_remaining, plan, quota_pages } }
  jobsList:  `${API_BASE}/api/HttpJobsList`,     // GET  -> [{...jobs}]
  price:     `${API_BASE}/api/HttpPrice`         // POST -> { priceNaira }  (optional)
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

// ---- JOBS (generic) ----
async function refreshJobs() {
  const res = await getJson(ENDPOINTS.jobsList, { auth: true });
  if (!res.ok) {
    console.error("HttpJobsList error", res.status, res.data);
    return;
  }

  const list = Array.isArray(res.data) ? res.data : (res.data.jobs || []);
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

// ---- SAS endpoint auto-discovery (fixes 404 from casing/route differences) ----
async function getBlobSas(file) {
  const candidates = [
    `${API_BASE}/api/HttpBlobSas`,
    `${API_BASE}/api/httpblobsas`,
    `${API_BASE}/api/HttpBlobSAS`,
    `${API_BASE}/api/BlobSas`,
    `${API_BASE}/api/BlobSAS`,
    `${API_BASE}/api/blob-sas`,
  ];
  const body = {
    fileName: file.name,
    contentType: file.type || "application/octet-stream"
  };

  let lastErr = null;
  for (const url of candidates) {
    const res = await postJson(url, body, { auth: true });
    if (res.ok && res.data?.uploadUrl) {
      // Found the working route
      if (url !== `${API_BASE}/api/HttpBlobSas`) {
        console.warn("Using SAS endpoint:", url);
      }
      return { ok: true, ...res.data };
    }
    // If 404, keep trying; if other error, surface it
    if (res.status !== 404) {
      lastErr = res;
      break;
    }
    lastErr = res;
  }

  if (lastErr) {
    console.error("SAS discovery failed", lastErr.status, lastErr.data, "tried:", candidates);
    toast(lastErr.data?.error || lastErr.data?.message || `Could not get upload URL (status ${lastErr.status})`, "error");
  }
  return { ok: false };
}

// ---- Upload: get SAS → PUT blob → confirm ----
async function sendToPrint() {
  try {
    if (!localStorage.getItem("rp_token")) { toast("Please sign in first.", "info"); return; }

    const file  = $("#fileInput").files[0];
    const pages = parseInt($("#pages").value || "0", 10);
    if (!file || !pages) { toast("Choose a file and enter pages.", "info"); return; }

    const isColor  = $("#color").value === "color";
    const isDuplex = $("#duplex").value === "true";

    // 1) get SAS (auto-discover correct route)
    const sas = await getBlobSas(file);
    if (!sas.ok) return; // toast already shown
    const { uploadUrl, blobUrl /* read SAS */, blobName } = sas;

    // 2) upload to Blob
    const put = await fetch(uploadUrl, {
      method: "PUT",
      headers: { "x-ms-blob-type": "BlockBlob", "content-type": file.type || "application/octet-stream" },
      body: file
    });
    if (!put.ok) throw new Error(`Upload to storage failed (status ${put.status})`);

    // 3) confirm job — adjust if your HttpJobsCreate expects different keys
    const r2 = await postJson(`${API_BASE}/api/HttpJobsCreate`, {
      blobUrl,                 // use read-enabled URL provided by SAS API
      filename: file.name,
      pages,
      meta: { color: isColor, duplex: isDuplex, copies: 1 },
      blobName                 // included in case your backend wants it
    }, { auth: true });

    if (!r2.ok) {
      console.error("HttpJobsCreate error", r2.status, r2.data);
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
