// ---------- tiny DOM helpers ----------
const $  = (sel) => document.querySelector(sel);
const $$ = (sel) => Array.from(document.querySelectorAll(sel));

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

// ---------- Quota + Jobs ----------
const jobsTable  = $("#jobsTable tbody");
async function refreshQuota() {
  const res = await getJson("/api/me/quota", { auth: true });
  if (!res.ok) return;
  const { plan, remaining, total } = res.data;
  $("#planName").textContent = plan || "—";
  $("#remaining").textContent = String(remaining ?? 0);
  const pct = total ? Math.round((remaining / total) * 100) : 0;
  $("#quotaFill").style.width = pct + "%";
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
    <td>${j.color ? "Color" : "B/W"} • ${j.duplex ? "Duplex" : "Simplex"}</td>
    <td>${j.status}</td>
    <td>${j.pickup_code || ""}</td>`;
  return tr;
}
async function refreshJobs() {
  const res = await getJson("/api/jobs", { auth: true });
  if (!res.ok) return;
  jobsTable.innerHTML = "";
  res.data.forEach(j => jobsTable.appendChild(jobRow(j)));
}

// ---------- Upload -> Blob -> Create Job ----------
async function requestSas(file) {
  return await postJson("/api/blob/sas", {
    fileName: file.name,
    contentType: file.type || "application/octet-stream"
  }, { auth: true });
}
async function putBlob(uploadUrl, file) {
  return await fetch(uploadUrl, {
    method: "PUT",
    headers: {
      "x-ms-blob-type": "BlockBlob",
      "Content-Type": file.type || "application/octet-stream"
    },
    body: file
  });
}
function normalizeColorValue(str) {
  return (String(str||"").toLowerCase().includes("color") ? "color" : "bw");
}
async function uploadAndCreateJob() {
  const token = localStorage.getItem("rp_token");
  if (!token) return toast("Please sign in first.", "info");

  const fileInput = $("#fileInput");   // <-- matches your HTML
  const file = fileInput?.files?.[0];
  if (!file) return toast("Choose a file to upload.", "info");

  const btn = $("#sendBtn");
  const oldText = btn.textContent;
  btn.disabled = true; btn.textContent = "Uploading…";

  try {
    // 1) Get SAS
    const sas = await requestSas(file);
    if (!sas.ok) throw new Error(`SAS request failed (${sas.status})`);
    const { uploadUrl, blobUrl } = sas.data;

    // 2) PUT file
    const putRes = await putBlob(uploadUrl, file);
    if (!putRes.ok) throw new Error(`Blob upload failed (${putRes.status})`);

    // 3) Create Job in SQL
    const payload = {
      fileName: file.name,
      blobUrl,
      pages: $("#pages")?.value || "1",
      color: normalizeColorValue($("#color")?.value || "Black & White"),
      duplex: $("#duplex")?.value || "Yes"
    };
    const create = await postJson("/api/jobs", payload, { auth: true });
    if (!create.ok) throw new Error(`Create job failed (${create.status})`);
    const job = create.data;

    // 4) Prepend to history
    jobsTable.prepend(jobRow(job));

    fileInput.value = "";
    refreshQuota();
    toast("File sent to print queue.", "success");
  } catch (e) {
    console.error(e);
    toast(e.message || "Upload failed", "error");
  } finally {
    btn.disabled = false; btn.textContent = oldText;
  }
}
$("#sendBtn")?.addEventListener("click", uploadAndCreateJob);

// ---------- boot ----------
(function init() {
  const email = localStorage.getItem("rp_email");
  const token = localStorage.getItem("rp_token");
  if (email && token) {
    $("#authStatus").textContent = `Signed in as ${email}`;
    refreshQuota();
    refreshJobs();
  }
})();
