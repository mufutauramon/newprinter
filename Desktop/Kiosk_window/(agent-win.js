// agent-win.js
require('dotenv').config(); // load .env
const fs = require('fs');
const fsp = require('fs/promises');
const os = require('os');
const path = require('path');
const { spawn } = require('child_process');

// Prefer built-in fetch (Node 18+), else fallback to node-fetch
let fetchFn = global.fetch;
if (!fetchFn) {
  fetchFn = (...a) => import('node-fetch').then(m => m.default(...a));
}

// --- env ---
const API_BASE = process.env.API_BASE;
const TOKEN = process.env.KIOSK_TOKEN;
const PRINTER = process.env.PRINTER_NAME || '(default printer)';
const POLL_MS = Number(process.env.POLL_MS || 3000);

if (!API_BASE || !TOKEN) {
  console.error('[agent] Missing API_BASE or KIOSK_TOKEN in .env');
  process.exit(1);
}

console.log(`[agent] starting (Windows mode). printer=${PRINTER}, poll=${POLL_MS}ms`);

// --- small helper to call kiosk API with kiosk token ---
async function api(pathname, opts = {}) {
  const res = await fetchFn(`${API_BASE}${pathname}`, {
    ...opts,
    headers: {
      'Authorization': `Bearer ${TOKEN}`,
      ...(opts.headers || {}),
    }
  });

  const text = await res.text();
  let data;
  try {
    data = text ? JSON.parse(text) : {};
  } catch (_) {
    data = { raw: text };
  }

  if (!res.ok) {
    throw new Error(data?.error || `HTTP ${res.status}`);
  }

  return data;
}

// --- download the user's file (PDF/etc) to a temp path ---
async function downloadToTemp(url) {
  const r = await fetchFn(url, {
    headers: { 'Authorization': `Bearer ${TOKEN}` }
  }).catch(() => null);

  if (!r || !r.ok) {
    throw new Error(`download_failed ${r?.status || ''}`);
  }

  const buf = Buffer.from(await r.arrayBuffer());
  const tmpPath = path.join(
    os.tmpdir(),
    `rp_${Date.now()}_${Math.random().toString(36).slice(2)}.pdf`
  );

  await fsp.writeFile(tmpPath, buf);
  return tmpPath;
}

/**
 * Windows print:
 * We shell out to PowerShell:
 *   Start-Process -FilePath "C:\file.pdf" -Verb Print
 *
 * That sends the file to the DEFAULT Windows printer for that file type.
 * So: make sure the kiosk PC's default printer is the real kiosk printer.
 */
function printFileWin(filePath) {
  return new Promise((resolve, reject) => {
    const psCmd = [
      'Start-Process',
      '-FilePath', `"${filePath.replace(/"/g, '\\"')}"`,
      '-Verb', 'Print'
    ].join(' ');

    const child = spawn('powershell.exe', [
      '-NoProfile',
      '-Command',
      psCmd
    ], {
      windowsHide: true
    });

    let out = '';
    let err = '';

    child.stdout.on('data', d => { out += d.toString(); });
    child.stderr.on('data', d => { err += d.toString(); });

    child.on('close', code => {
      if (code === 0) {
        resolve(out.trim());
      } else {
        reject(new Error(`print_failed code=${code}: ${err || out}`));
      }
    });
  });
}

// --- one poll cycle ---
async function cycle() {
  try {
    // Ask server which jobs are active for this kiosk scope
    // Your server responds { items: [...] }
    const q = await api('/api/kiosk/queue');
    const items = Array.isArray(q?.items) ? q.items : [];

    // We only try to actually print jobs that are already status='printing'.
    // Because in your kiosk UI, clicking "Print" updates status -> 'printing'.
    const toPrint = items.filter(j =>
      String(j.status || '').toLowerCase() === 'printing'
    );

    if (toPrint.length === 0) {
      return; // nothing to do this tick
    }

    for (const job of toPrint) {
      try {
        // Build absolute download URL
        const fileUrl = job.public_url?.startsWith('http')
          ? job.public_url
          : `${API_BASE}${job.public_url}`;

        console.log(`[job ${job.id}] downloading ${fileUrl}`);
        const localPath = await downloadToTemp(fileUrl);

        console.log(`[job ${job.id}] printing ${localPath}`);
        await printFileWin(localPath);

        console.log(`[job ${job.id}] mark complete -> server`);
        await api(`/api/kiosk/jobs/${job.id}/complete`, {
          method: 'POST'
        });

        // cleanup
        fs.unlink(localPath, () => {});
      } catch (err) {
        console.error(`[job ${job.id}] ❌ ${err.message}`);
      }
    }
  } catch (err) {
    console.error('[poll]', err.message);
  }
}

// poll forever
setInterval(cycle, POLL_MS);
cycle();
