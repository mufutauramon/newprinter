import { getPool, getSql } from "../../lib/sql.js";
import { getUser } from "../../lib/jwt.js";

export default async function (context, req) {
  try {
    let uid = 0;
    try {
      const u = getUser(req);
      const raw = u.sub ?? u.id;
      uid = parseInt(raw, 10);
      if (!Number.isInteger(uid)) uid = 0; // tolerate non-numeric tokens for now
    } catch { /* no token */ }

    const { fileName, blobUrl, pages, color, duplex } = req.body || {};
    if (!fileName || !blobUrl || !pages)
      return json(context, 400, { error: "fileName, blobUrl and pages are required" });

    const pg = parseInt(pages, 10) || 0;
    if (pg <= 0) return json(context, 400, { error: "pages must be > 0" });

    const pool = await getPool();
    const sql = getSql();

    const isColor  = String(color  || "").toLowerCase().includes("color");
    const isDuplex = String(duplex || "").toLowerCase() === "yes" || duplex === true;
    const pickup   = Math.floor(100000 + Math.random() * 900000).toString();

    const ins = await pool.request()
      .input("uid", sql.Int, uid)                       // uid may be 0 temporarily
      .input("fn",  sql.NVarChar(260),  fileName)
      .input("url", sql.NVarChar(2048), blobUrl)
      .input("pg",  sql.Int,            pg)
      .input("clr", sql.Bit,            isColor ? 1 : 0)
      .input("dx",  sql.Bit,            isDuplex ? 1 : 0)
      .input("pc",  sql.VarChar(12),    pickup)
      .query(`
        INSERT INTO Jobs (user_id, file_name, storage_url, pages, color, duplex, pickup_code, status, created_at)
        OUTPUT inserted.id, inserted.user_id, inserted.file_name, inserted.storage_url,
               inserted.pages, inserted.color, inserted.duplex, inserted.status,
               inserted.pickup_code, inserted.created_at
        VALUES (@uid, @fn, @url, @pg, @clr, @dx, @pc, 'Queued', SYSUTCDATETIME());
      `);

    return json(context, 200, ins.recordset[0]);
  } catch (e) {
  await tx.rollback();
  context.log.error("job create failed", e);
  return json(context, 500, {
    error: "job_create_failed",
    detail: e?.originalError?.info?.message || e?.message || String(e)
  });
  }
}

function json(ctx, status, body) {
  ctx.res = { status, headers: { "content-type": "application/json" }, body };
}
