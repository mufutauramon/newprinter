// ---------- utils ----------
const $ = (sel) => document.querySelector(sel);
const all = (sel) => Array.from(document.querySelectorAll(sel));

const toastWrap = () => $("#toast");
function toast(msg, type = "success") {
  const el = document.createElement("div");
  el.className = `toast ${type}`;
  el.textContent = msg;
  toastWrap().appendChild(el);
  setTimeout(() => el.remove(), 3500);
}

async function postJson(url, body) {
  const r = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body ?? {})
  });
  const txt = await r.text();
  let data = {};
  try { data = txt ? JSON.parse(txt) : {}; } catch { data = { raw: txt }; }
  return { ok: r.ok, status: r.status, data };
}

// ---------- auth state ----------
function setSignedIn(email) {
  $("#authStatus").textContent = email ? `Signed in as ${email}` : "Not signed in";
  $("#signOutBtn").classList.toggle("hidden", !email);
  $("#authSection").classList.toggle("hidden", !!email);
  $("#dash").classList.toggle("hidden", !email);
}

// ---------- elements ----------
const emailEl = $("#email");
const pwdEl = $("#password");
const signInBtn = $("#signInBtn");
const signUpBtn = $("#signUpBtn");
const signOutBtn = $("#signOutBtn");

const subscribeBtn = $("#subscribeBtn");
const planRadios = all('input[name="plan"]');

const signupModal = $("#signupModal");
const suFullName = $("#suFullName");
const suPhone = $("#suPhone");
const suPlanChip = $("#suPlan");
const signupClose = $("#signupClose");
const signupCancel = $("#signupCancel");
const signupSubmit = $("#signupSubmit");

// keep plan chip in modal in sync with selected radio
function currentPlan() {
  const r = planRadios.find(r => r.checked);
  return r ? r.value : "Basic";
}
function syncPlanChip() {
  suPlanChip.textContent = currentPlan();
}
planRadios.forEach(r => r.addEventListener("change", syncPlanChip));
syncPlanChip();

// ---------- sign up flow ----------
signUpBtn.addEventListener("click", () => {
  // open the modal; email/password taken from main fields
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

signupSubmit.addEventListener("click", async () => {
  const fullName = suFullName.value.trim();
  const phone = suPhone.value.trim();
  const email = emailEl.value.trim();
  const password = pwdEl.value;

  if (!fullName || !phone) {
    toast("Please provide full name and phone.", "info");
    return;
  }
  if (!email || !password) {
    toast("Email and password are required.", "info");
    return;
  }

  const plan = currentPlan();

  const { ok, status, data } = await postJson("/api/auth/signup", {
    fullName, phone, email, password, plan
  });

  if (ok) {
    localStorage.setItem("rp_email", email);
    localStorage.setItem("rp_token", data.token || "");
    setSignedIn(email);
    toast("Account created successfully.", "success");
    signupModal.close();
  } else if (status === 409) {
    toast("Email already exists.", "error");
  } else {
    toast(`Signup failed (${status}).`, "error");
    console.error("signup error", data);
  }
});


// ---------- sign in ----------
signInBtn.addEventListener("click", async () => {
  const email = emailEl.value.trim();
  const password = pwdEl.value;
  if (!email || !password) {
    toast("Enter email and password.", "info");
    return;
  }
  const { ok, status, data } = await postJson("/api/auth/login", { email, password });
  if (ok) {
    localStorage.setItem("rp_email", email);
    localStorage.setItem("rp_token", data.token || "");
    setSignedIn(email);
    toast("Signed in.", "success");
  } else if (status === 401) {
    toast("Invalid email/password.", "error");
  } else {
    toast(`Login failed (${status}).`, "error");
    console.error("login error", data);
  }
});

// ---------- subscribe/update plan ----------
subscribeBtn.addEventListener("click", async () => {
  const plan = currentPlan();
  const token = localStorage.getItem("rp_token") || "";
  if (!token) {
    toast("Please sign in first.", "info");
    return;
  }
  // adjust the endpoint to your backend route if different
  const r = await postJson("/api/subscriptions/select", { plan, token });
  if (r.ok) {
    toast("Subscription updated.", "success");
  } else {
    toast(`Failed to update plan (${r.status}).`, "error");
    console.error("sub error", r.data);
  }
});

// ---------- sign out ----------
signOutBtn.addEventListener("click", () => {
  localStorage.removeItem("rp_token");
  localStorage.removeItem("rp_email");
  setSignedIn(null);
  toast("Signed out.", "success");
});

// ---------- init ----------
(function init() {
  const email = localStorage.getItem("rp_email");
  const token = localStorage.getItem("rp_token");
  if (email && token) {
    setSignedIn(email);
  } else {
    setSignedIn(null);
  }
})();
