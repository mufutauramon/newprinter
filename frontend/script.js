const API = '/api';
let TOKEN = null;
const $ = s => document.querySelector(s);
function setHidden(el, hidden){ el.classList.toggle('hidden', hidden); }
function fmtTime(ts){ return new Date(ts).toLocaleString(); }

async function apiFetch(path, opts={}){
  const headers = Object.assign({ 'Content-Type': 'application/json' }, opts.headers || {});
  if (TOKEN) headers['Authorization'] = 'Bearer ' + TOKEN;
  const res = await fetch(API + path, { ...opts, headers });
  if(!res.ok){
    let msg = 'request failed';
    try { const j = await res.json(); msg = j.error || JSON.stringify(j); } catch {}
    throw new Error(msg);
  }
  if(res.status === 204) return null;
  return res.json();
}

async function getMe(){
  try{
    const me = await apiFetch('/me');
    $('#authStatus').textContent = `Signed in`;
    setHidden($('#signOutBtn'), false);
    setHidden($('#authSection'), true);
    setHidden($('#dash'), false);
    renderMe(me);
    await loadJobs();
  }catch(e){
    $('#authStatus').textContent = 'Not signed in';
    setHidden($('#signOutBtn'), true);
    setHidden($('#authSection'), false);
    setHidden($('#dash'), true);
  }
}

function renderMe(me){
  const sub = me.subscription || {};
  $('#planName').textContent = sub.plan || '—';
  $('#remaining').textContent = sub.pages_remaining ?? 0;
  const quota = sub.quota_pages || 0;
  const remaining = sub.pages_remaining || 0;
  const pct = quota ? Math.max(2, Math.min(100, Math.round((remaining/quota)*100))) : 0;
  $('#quotaFill').style.width = pct + '%';
}

async function loadJobs(){
  const jobs = await apiFetch('/jobs');
  const tbody = document.querySelector('#jobsTable tbody');
  tbody.innerHTML='';
  for(const j of jobs){
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${fmtTime(j.created_at)}</td>
      <td>${j.file_name}</td>
      <td>${j.pages}</td>
      <td>${j.color?'Color':'B/W'} · ${j.duplex?'Duplex':'Simplex'}</td>
      <td>${j.status}</td>
      <td><span class="badge">${j.pickup_code || '—'}</span></td>`;
    tbody.appendChild(tr);
  }
}

// events
$('#signUpBtn').addEventListener('click', async ()=>{
  const email = $('#email').value.trim();
  const password = $('#password').value.trim();
  if(!email || !password) return alert('Enter email and password');
  try{
    const { token } = await apiFetch('/auth/signup', { method:'POST', body: JSON.stringify({ email, password }) });
    TOKEN = token; await getMe();
  }catch(e){ alert(e.message); }
});

$('#signInBtn').addEventListener('click', async ()=>{
  const email = $('#email').value.trim();
  const password = $('#password').value.trim();
  if(!email || !password) return alert('Enter email and password');
  try{
    const { token } = await apiFetch('/auth/login', { method:'POST', body: JSON.stringify({ email, password }) });
    TOKEN = token; await getMe();
  }catch(e){ alert(e.message); }
});

$('#signOutBtn').addEventListener('click', ()=>{ TOKEN = null; getMe(); });

$('#subscribeBtn').addEventListener('click', async()=>{
  if(!TOKEN) return alert('Sign in first');
  const selectedPlan = document.querySelector('input[name="plan"]:checked').value;
  try{
    const r = await apiFetch('/subscribe', { method:'POST', body: JSON.stringify({ planName: selectedPlan }) });
    alert(`Plan set to ${selectedPlan}. Quota: ${r.quota} pages`);
    await getMe();
  }catch(e){ alert(e.message); }
});

$('#priceBtn').addEventListener('click', async()=>{
  if(!TOKEN) return alert('Sign in first');
  const pages = parseInt($('#pages').value || '0', 10);
  if(!Number.isFinite(pages) || pages <= 0) return alert('Enter a valid page count');
  const color = $('#color').value;
  try{
    const { total, breakdown } = await apiFetch('/price', { method:'POST', body: JSON.stringify({ pages, color }) });
    $('#priceOut').textContent = `₦ ${total.toLocaleString()}  (overage ${breakdown.over} × ₦${breakdown.overRate})`;
  }catch(e){ alert(e.message); }
});

$('#sendBtn').addEventListener('click', async()=>{
  if(!TOKEN) return alert('Sign in first');
  const file = $('#fileInput').files[0];
  if(!file) return alert('Choose a file');
  if(file.size > 30*1024*1024) return alert('Max 30 MB');
  const pages = parseInt($('#pages').value || '0', 10);
  if(!Number.isFinite(pages) || pages <= 0) return alert('Enter a valid page count');
  const color = $('#color').value;
  const duplex = $('#duplex').value === 'true';

  // SAS
  const { uploadUrl, blobUrl } = await apiFetch('/uploads/sas', { method:'POST', body: JSON.stringify({ fileName: file.name }) });
  const upRes = await fetch(uploadUrl, { method: 'PUT', headers: { 'x-ms-blob-type':'BlockBlob', 'Content-Type': file.type || 'application/octet-stream' }, body: file });
  if(!upRes.ok) return alert('Upload failed');

  const jobRes = await apiFetch('/jobs', { method:'POST', body: JSON.stringify({ fileName: file.name, blobUrl, pages, color, duplex }) });
  alert(`Job queued. Pickup code: ${jobRes.pickup_code || '—'}`);
  await getMe();
});

getMe();


function showToast(message, type="info") {
  const wrap = document.getElementById('toast');
  const el = document.createElement('div');
  el.className = `toast ${type}`;
  el.innerHTML = `<span class="title">${type.toUpperCase()}</span> ${message}`;
  wrap.appendChild(el);
  setTimeout(()=>{ el.style.opacity = '0'; }, 2600);
  setTimeout(()=>{ wrap.removeChild(el); }, 3000);
}

// Generic JSON fetch helper
async function callJson(url, options={}) {
  const res = await fetch(url, {
    ...options,
    headers: { 'Content-Type': 'application/json', ...(options.headers||{}) }
  });
  const text = await res.text();
  let data;
  try { data = text ? JSON.parse(text) : {}; } catch { data = { raw:text }; }
  return { ok: res.ok, status: res.status, data };
}

// Hook up to your form/buttons:
// Example minimal handlers (adjust selectors to match your page)
async function handleSignup(email, password) {
  const { ok, status, data } = await callJson('/api/auth/signup', {
    method: 'POST',
    body: JSON.stringify({ email, password })
  });
  if (ok) {
    showToast('Account created', 'success');
    if (data.token) localStorage.setItem('rp_token', data.token);
  } else if (status === 409) {
    showToast('Email already exists', 'error');
  } else {
    showToast(`Signup failed (${status})`, 'error');
    console.error('signup error', data);
  }
}

async function handleSignin(email, password) {
  const { ok, status, data } = await callJson('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password })
  });
  if (ok) {
    localStorage.setItem('rp_token', data.token);
    showToast('Signed in', 'success');
    // navigate/update UI
  } else if (status === 401) {
    showToast('Invalid email/password', 'error');
  } else {
    showToast(`Signin failed (${status})`, 'error');
    console.error('login error', data);
  }
}

// Example: wire to simple prompts or real form
window.rpSignupPrompt = async () => {
  const email = prompt('Email:');
  const pwd = prompt('Password:');
  if (!email || !pwd) return;
  await handleSignup(email, pwd);
};
window.rpSigninPrompt = async () => {
  const email = prompt('Email:');
  const pwd = prompt('Password:');
  if (!email || !pwd) return;
  await handleSignin(email, pwd);
};


