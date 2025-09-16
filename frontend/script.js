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
    // refresh quota and jobs when signed in
    refreshQuota();
    refreshJobs();
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

// quota / jobs
const planNameEl = $("#planName");
const remainingEl= $("#remaining");
const quotaFill  = $("#quotaFill");
const jobsTable  = $("#jobsTable tbody");

// ---------- upload elements (NEW) ----------
const fileEl   = $("#fileInput"); // <-- updated to match your HTML
const pagesEl  = $("#pages");
const colorEl  = $("#color");
const duplexEl = $("#duplex");
const sendBtn  = $("#sendBtn");

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
    // refresh quota after subscription
    refreshQuota();
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

// ---------- quota + jobs loaders ----------
async function refreshQuota() {
  const res = await getJson("/api/me/quota", { auth: true });
  if (!res.ok) return;
  const { plan, remaining, total } = res.data;
  planNameEl.textContent = plan || "—";
  remainingEl.textContent = String(remaining ?? 0);
  const pct = total ? Math.max(0, Math.min(100, Math.round((remaining / total) * 100))) : 0;
  quotaFill.style.width = pct + "%";
}

function jobRow(j) {
  const tr = document.createElement("tr");
  const link = j.storage_url
    ? `<a href="${j.storage_url}" target="_blank" rel="noopener">${j.file_name}</a>`
    : `${j.file_name}`;
  tr.innerHTML = `
    <td>${new Date(j.created_at).toLocaleString()}</td>
    <td>${link}</td>
    <td>${j.pages}</td>
    <td>${(j.color ? "Color" : "B/W")} • ${j.duplex ? "Duplex" : "Simplex"}</td>
    <td>${j.status}</td>
    <td>${j.pickup_code || ""}</td>
  `;
  return tr;
}

async function refreshJobs() {
  const res = await getJson("/api/jobs", { auth: true });
  if (!res.ok) return;
  jobsTable.innerHTML = "";
  for (const j of res.data) jobsTable.appendChild(jobRow(j));
}

// ---------- Upload -> Blob -> Create Job (NEW) ----------
const BLOB_SAS_URL = "/api/blob/sas"; // your new SAS function route

async function requestSas(file) {
  // asks backend for a single-blob SAS upload URL
  const res = await postJson(BLOB_SAS_URL, {
    fileName: file.name,
    contentType: file.type || "application/octet-stream"
  }, { auth: true });

  if (!res.ok) throw new Error(`SAS request failed (${res.status})`);
  return res.data; // { uploadUrl, blobUrl, blobName }
}

async function putBlob(uploadUrl, file) {
  const r = await fetch(uploadUrl, {
    method: "PUT",
    headers: {
      "x-ms-blob-type": "BlockBlob",
      "Content-Type": file.type || "application/octet-stream"
    },
    body: file
  });
  if (!r.ok) {
    const t = await r.text();
    throw new Error(`Blob upload failed (${r.status}): ${t}`);
  }
}

function normalizeColorValue(str) {
  // server treats 'color' => BIT 1; anything else => 0
  const s = (str || "").toString().toLowerCase();
  return s.includes("color") ? "color" : "bw";
}

async function uploadAndCreateJob() {
  const token = localStorage.getItem("rp_token");
  if (!token) return toast("Please sign in first.", "info");

  const file = fileEl?.files?.[0];
  if (!file) return toast("Choose a file to upload.", "info");

  const btn = sendBtn;
  const oldText = btn.textContent;
  btn.disabled = true; btn.textContent = "Uploading…";

  try {
    // 1) SAS for this blob
    const { uploadUrl, blobUrl } = await requestSas(file);

    // 2) Upload to blob directly
    await putBlob(uploadUrl, file);

    // 3) Create job in SQL (your existing /api/jobs)
    const payload = {
      fileName: file.name,
      blobUrl,
      pages: pagesEl?.value || "1",
      color: normalizeColorValue(colorEl?.value || "Black & White"),
      duplex: (duplexEl?.value || "Yes")
    };

    const res = await postJson("/api/jobs", payload, { auth: true });
    if (!res.ok) {
      console.error("create job", res.data);
      toast(`Create job failed (${res.status}).`, "error");
      return;
    }

    // 4) Prepend to Job History immediately
    const j = res.data; // row returned by your API
    jobsTable.prepend(jobRow(j));

    // 5) Clear file input & refresh quota (deduct pages)
    if (fileEl) fileEl.value = "";
    refreshQuota();

    toast("File sent to print queue.", "success");
  } catch (e) {
    console.error(e);
    toast(e.message || "Upload failed", "error");
  } finally {
    btn.disabled = false; btn.textContent = oldText;
  }
}

// wire the Send button
if (sendBtn) sendBtn.addEventListener("click", uploadAndCreateJob);

// ---------- boot ----------
(function init() {
  const email = localStorage.getItem("rp_email");
  const token = localStorage.getItem("rp_token");
  setSignedIn(email && token ? email : null);
})();
