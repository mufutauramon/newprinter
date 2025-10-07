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
  const r = await fetch(url, {
    method: "POST",
    headers,
    body: JSON.stringify(body),
  });
  const text = await r.text();
  let data = {};
  try { data = text ? JSON.parse(text) : {}; } catch { data = { raw: text }; }
  return { ok: r.ok, status: r.status, data };
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
  return { ok: r.ok, status: r.status, data };
}

// ---------- UI state ----------
function setSignedIn(email) {
  $("#authStatus").textContent = email ? `Signed in as ${email}` : "Not signed in";
  $("#signOutBtn").classList.toggle("hidden", !email);
  $("#authSection").classList.toggle("hidden", !!email);
  $("#dash").classList.toggle("hidden", !email);

  if (email) {
    // when you’re ready: refresh quota and jobs here
    // refreshQuota();
    // refreshJobs();
  }
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

// quota / jobs (placeholders for later)
const planNameEl = $("#planName");
const remainingEl= $("#remaining");
const quotaFill  = $("#quotaFill");
const jobsTable  = $("#jobsTable tbody");

// ---------- plan helpers ----------
function currentPlan() {
  const r = planRadios.find(r => r.checked);
  return r ? r.value : "Basic";
}
function syncPlanChip() {
  suPlanChip.textContent = currentPlan();
}
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
    // when you’re ready, refresh quota UI:
    // refreshQuota();
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

// ---------- (optional) quota + jobs loaders you can wire later ----------
// async function refreshQuota() {
//   const res = await getJson("/api/me/quota", { auth: true });
//   if (!res.ok) return;
//   const { plan, remaining, total } = res.data;
//   planNameEl.textContent = plan || "—";
//   remainingEl.textContent = String(remaining ?? 0);
//   const pct = total ? Math.max(0, Math.min(100, Math.round((remaining / total) * 100))) : 0;
//   quotaFill.style.width = pct + "%";
// }

// async function refreshJobs() {
//   const res = await getJson("/api/jobs", { auth: true });
//   if (!res.ok) return;
//   jobsTable.innerHTML = "";
//   for (const j of res.data) {
//     const tr = document.createElement("tr");
//     tr.innerHTML = `
//       <td>${new Date(j.created_at).toLocaleString()}</td>
//       <td>${j.file_name}</td>
//       <td>${j.pages}</td>
//       <td>${j.color ? "Color" : "B/W"} • ${j.duplex ? "Duplex" : "Simplex"}</td>
//       <td>${j.status}</td>
//       <td>${j.pickup_code || ""}</td>
//     `;
//     jobsTable.appendChild(tr);
//   }
// }
// ---------- QUOTA + JOBS + UPLOAD (drop-in) ----------

// tiny util to try multiple element ids/classes and return the first that exists
function pickSel(...sels) { for (const s of sels) { const el = document.querySelector(s); if (el) return el; } return null; }

// ELEMENT MAP (we’ll find whatever exists)
const el = {
  // quota card
  planName:  pickSel("#planName", "#quota-plan"),
  remaining: pickSel("#remaining", "#quota-remaining"),
  bar:       pickSel("#quotaFill", "#quota-bar"),

  // jobs table body
  jobsBody:  pickSel("#jobsTable tbody", "#jobs-body"),

  // upload form (we try several common ids)
  file:      pickSel("#uploadFile", "#upload-file", "#file", "input[type=file]"),
  pages:     pickSel("#uploadPages", "#upload-pages", "#pages", "input[type=number]"),
  color:     pickSel("#uploadColor", "#upload-color", "#color"),
  duplex:    pickSel("#uploadDuplex", "#upload-duplex", "#duplex"),
  sendBtn:   pickSel("#sendBtn", "#btn-send", "#sendToPrint", "#btn-upload"),
  msg:       pickSel("#uploadMsg", "#priceMsg", "#upload-msg")
};

// Fallback-friendly GET that can try two endpoints
async function getAuthJsonTry(paths) {
  for (const p of paths) {
    const r = await getJson(p, { auth: true });
    if (r.ok) return r;
  }
  return { ok: false, status: 404, data: { error: "not found" } };
}

// QUOTA
async function refreshQuota() {
  const res = await getAuthJsonTry(["/api/me/quota", "/api/quota"]);
  if (!res.ok) return;

  const d = res.data || {};
  // normalize response shapes
  const planName = d.planName || d.plan || "—";
  const total = (d.pages_total ?? d.total ?? 0);
  const used   = (d.pages_used ?? 0);
  const reserved = (d.pages_reserved ?? 0);
  const remaining = (d.available ?? d.remaining ?? Math.max(0, total - used - reserved));

  if (el.planName)  el.planName.textContent  = planName;
  if (el.remaining) el.remaining.textContent = String(remaining);
  if (el.bar) {
    const pct = total ? Math.max(0, Math.min(100, Math.round((remaining / total) * 100))) : 0;
    el.bar.style.width = pct + "%";
  }

  // keep in memory if you need quota_id elsewhere
  window.__quota = d;
}

// JOBS
async function refreshJobs() {
  const res = await getAuthJsonTry(["/api/me/jobs", "/api/jobs"]);
  if (!res.ok || !el.jobsBody) return;

  const list = Array.isArray(res.data) ? res.data : (res.data.jobs || []);
  el.jobsBody.innerHTML = "";

  for (const j of list) {
    const time   = j.created_at || j.createdAt || j.time;
    const name   = j.filename || j.file_name || j.file || "—";
    const pages  = j.pages ?? j.page_count ?? "—";
    const color  = (j.color ?? (j.meta_json?.color)) ? "Color" : "B/W";
    const duplex = (j.duplex ?? (j.meta_json?.duplex)) ? "Duplex" : "Simplex";
    const status = j.status || "uploaded";
    const code   = j.pickup_code || j.code || "";

    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${time ? new Date(time).toLocaleString() : "—"}</td>
      <td>${name}</td>
      <td>${pages}</td>
      <td>${color} • ${duplex}</td>
      <td>${status}</td>
      <td>${code}</td>
    `;
    el.jobsBody.appendChild(tr);
  }
}

// UPLOAD: ask SAS → PUT blob → confirm (reserve pages + create job)
async function sendToPrint() {
  try {
    if (!localStorage.getItem("rp_token")) {
      toast("Please sign in first.", "info");
      return;
    }
    if (!el.file || !el.pages) {
      toast("Upload controls not found on the page.", "error");
      return;
    }

    const file  = el.file.files[0];
    const pages = parseInt((el.pages.value || "0"), 10);
    if (!file || !pages) { toast("Choose a file and enter pages.", "info"); return; }

    const color  = (el.color?.value || "Black & White"); // "Black & White" / "Color"
    const duplex = ((el.duplex?.value || "No") === "Yes");

    // 1) get SAS
    const r1 = await postJson("/api/jobs/upload-url",
      { filename: file.name, contentType: file.type || "application/octet-stream", pagesEstimate: pages },
      { auth: true }
    );
    if (!r1.ok) {
      toast(r1.data?.error || "Failed to start upload.", "error");
      return;
    }
    const { uploadUrl, blobUrlPublic, quotaId } = r1.data;

    // 2) direct-to-blob upload
    const put = await fetch(uploadUrl, {
      method: "PUT",
      headers: { "x-ms-blob-type": "BlockBlob", "content-type": file.type || "application/octet-stream" },
      body: file
    });
    if (!put.ok) throw new Error("Upload to storage failed");

    // 3) confirm
    const r2 = await postJson("/api/jobs/confirm",
      { quotaId, blobUrl: blobUrlPublic, filename: file.name, pages, meta: { color, duplex, copies: 1 } },
      { auth: true }
    );
    if (!r2.ok) {
      toast(r2.data?.error || "Confirm failed.", "error");
      return;
    }

    toast("Uploaded and queued for printing.", "success");
    await refreshQuota();
    await refreshJobs();
    if (el.msg) el.msg.textContent = "";
  } catch (e) {
    console.error(e);
    toast(e.message || "Upload error.", "error");
    if (el.msg) el.msg.textContent = e.message || "Upload error.";
  }
}

// hook the button if present
if (el.sendBtn) el.sendBtn.addEventListener("click", sendToPrint);

// When signed in, refresh quota + jobs automatically
async function afterSignInBoot() {
  await refreshQuota();
  await refreshJobs();
}
// ================= REMOTEPRINT NG: WIRE TO YOUR API =================

// endpoints (your function folders)
const ENDPOINTS = {
  me:        "/api/HttpMe",           // GET  -> quota/plan info
  jobsList:  "/api/HttpJobsList",     // GET  -> [{...jobs}]
  blobSas:   "/api/HttpBlobSas",      // POST -> { uploadUrl, blobUrlPublic, quotaId? }
  jobsCreate:"/api/HttpJobsCreate",   // POST -> { jobId }
  price:     "/api/HttpPrice"         // POST -> { priceNaira }  (optional)
};

// element refs (match your HTML)
const ui = {
  // upload
  file:     document.getElementById("fileInput"),
  pages:    document.getElementById("pages"),
  color:    document.getElementById("color"),
  duplex:   document.getElementById("duplex"),
  send:     document.getElementById("sendBtn"),
  priceBtn: document.getElementById("priceBtn"),
  priceOut: document.getElementById("priceOut"),
  // quota
  planName: document.getElementById("planName"),
  remaining:document.getElementById("remaining"),
  bar:      document.getElementById("quotaFill"),
  // jobs
  jobsBody: document.querySelector("#jobsTable tbody"),
};

// -------- QUOTA / ME --------
async function refreshQuota() {
  const res = await getJson(ENDPOINTS.me, { auth: true });
  if (!res.ok) { return; }

  // allow multiple shapes from backend
  const d = res.data || {};
  const planName  = d.planName || d.plan || "—";
  const total     = d.pages_total ?? d.total ?? 0;
  const used      = d.pages_used ?? d.used ?? 0;
  const reserved  = d.pages_reserved ?? d.reserved ?? 0;
  const remaining = d.available ?? d.remaining ?? Math.max(0, total - used - reserved);

  ui.planName.textContent   = planName;
  ui.remaining.textContent  = String(remaining);
  ui.bar.style.width        = total ? `${Math.max(0, Math.min(100, Math.round((remaining/total)*100)))}%` : "0%";

  // stash for later (e.g., quota_id if you return it)
  window.__quota = d;
}

// -------- JOBS LIST --------
async function refreshJobs() {
  const res = await getJson(ENDPOINTS.jobsList, { auth: true });
  if (!res.ok) { return; }

  const list = Array.isArray(res.data) ? res.data : (res.data.jobs || []);
  ui.jobsBody.innerHTML = "";
  for (const j of list) {
    const meta = j.meta_json ? (typeof j.meta_json === "string" ? JSON.parse(j.meta_json) : j.meta_json) : {};
    const created = j.created_at || j.time || j.createdAt;
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${created ? new Date(created).toLocaleString() : "—"}</td>
      <td>${j.filename || j.file_name || j.file || "—"}</td>
      <td>${j.pages ?? j.page_count ?? "—"}</td>
      <td>${(j.color ?? meta.color) ? "Color" : "B/W"} • ${(j.duplex ?? meta.duplex) ? "Duplex" : "Simplex"}</td>
      <td>${j.status || "uploaded"}</td>
      <td>${j.pickup_code || j.code || ""}</td>
    `;
    ui.jobsBody.appendChild(tr);
  }
}

// -------- PRICE (server) --------
async function getServerPrice() {
  const pages = parseInt(ui.pages.value || "0", 10);
  if (!pages) { ui.priceOut.textContent = "—"; return; }
  const res = await postJson(ENDPOINTS.price, {
    pages,
    color:  ui.color.value === "color",
    duplex: ui.duplex.value === "true"
  }, { auth: true });
  if (res.ok && typeof res.data?.priceNaira === "number") {
    ui.priceOut.textContent = `₦ ${res.data.priceNaira.toLocaleString()}`;
  } else {
    // fallback client estimate if server not ready
    const perSide = (ui.color.value === "color") ? 70 : 25;
    ui.priceOut.textContent = `₦ ${(perSide * pages).toLocaleString()}`;
  }
}

// -------- UPLOAD: get SAS → PUT blob → confirm --------
async function sendToPrint() {
  try {
    if (!localStorage.getItem("rp_token")) { toast("Please sign in first.", "info"); return; }

    const file  = ui.file.files[0];
    const pages = parseInt(ui.pages.value || "0", 10);
    if (!file || !pages) { toast("Choose a file and enter pages.", "info"); return; }

    const isColor = ui.color.value === "color";
    const isDuplex= ui.duplex.value === "true";

    // 1) ask for SAS
    const r1 = await postJson(ENDPOINTS.blobSas, {
      filename: file.name,
      contentType: file.type || "application/octet-stream",
      pagesEstimate: pages
    }, { auth: true });

    if (!r1.ok) {
      toast(r1.data?.error || "Could not get upload URL.", "error");
      return;
    }
    const { uploadUrl, blobUrlPublic, quotaId } = r1.data;

    // 2) upload to Blob
    const put = await fetch(uploadUrl, {
      method: "PUT",
      headers: { "x-ms-blob-type": "BlockBlob", "content-type": file.type || "application/octet-stream" },
      body: file
    });
    if (!put.ok) throw new Error("Upload to storage failed.");

    // 3) confirm job (and reserve)
    const r2 = await postJson(ENDPOINTS.jobsCreate, {
      quotaId,                     // your API can ignore if it looks up active period
      blobUrl: blobUrlPublic,
      filename: file.name,
      pages,
      meta: { color: isColor, duplex: isDuplex, copies: 1 }
    }, { auth: true });

    if (!r2.ok) {
      toast(r2.data?.error || "Unable to queue job.", "error");
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

// wire buttons
if (ui.send)     ui.send.addEventListener("click", sendToPrint);
if (ui.priceBtn) ui.priceBtn.addEventListener("click", getServerPrice);

// after sign-in (called by setSignedIn)
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
