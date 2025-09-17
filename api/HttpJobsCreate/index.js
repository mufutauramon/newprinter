import { getPool, getSql } from "../../lib/sql.js";
import { getUser } from "../../lib/jwt.js";

export default async function (context, req) {
  try {
    // ---- Auth (your jwt.js) ----
    let user;
    try {
      user = getUser(req); // { sub | id, email, ... }
    } catch (e) {
      context.res = { status: 401, body: { error: "no_user", detail: "Missing or invalid token" } };
      return;
    }

    const { fileName, blobUrl, pages, color, duplex, debug } = req.body || {};

    // ---- lightweight probe so we can test from the console without SQL ----
    if (debug) {
      context.res = {
        status: 200,
        body: { ok: true, probe: "jobs-create alive", route: "jobs", method: req.method || "POST" }
      };
      return;
    }

    // ---- basic validation ----
    if (!fileName || !blobUrl || !pages) {
      context.res = {
        status: 400,
        body: { error: "bad_request", detail: "fileName, blobUrl and pages are required" }
      };
      return;
    }
    const pg = parseInt(pages, 10);
    if (!Number.isFinite(pg) || pg <= 0) {
      context.res = { status: 400, body: { error: "bad_request", detail: "pages must be > 0" } };
      return;
    }

    // ---- DB work ----
    const pool = await getPool().catch(e => {
      throw withWhere("db_connect", e);
    });
    const sql = getSql();

    // latest active subscription
    const s = await pool.request()
      .input("uid", sql.Int, Number(user.sub || user.id))
      .query(`
        SELECT TOP 1 id, pages_remaining
        FROM Subscriptions
        WHERE user_id=@uid AND active=1
        ORDER BY start_at DESC
      `).catch(e => { throw withWhere("sub_query", e); });

    const sub = s.recordset[0];
    if (!sub) {
      context.res = { status: 403, body: { error: "no_active_subscription" } };
      return;
    }

    // transaction: deduct pages + insert job
    const tx = new sql.Transaction(pool);
    await tx.begin().catch(e => { throw withWhere("tx_begin", e); });

    try {
      const rq = new sql.Request(tx);

      const toDeduct = Math.min((sub.pages_remaining | 0), pg);
      if (toDeduct > 0) {
        await rq
          .input("sid", sql.Int, sub.id)
          .input("d", sql.Int, toDeduct)
          .query("UPDATE Subscriptions SET pages_remaining = pages_remaining - @d WHERE id=@sid")
          .catch(e => { throw withWhere("sub_update", e); });
      }

      const pickup = Math.floor(100000 + Math.random() * 900000).toString();

      const ins = await rq
        .input("uid", sql.Int, Number(user.sub || user.id))
        .input("fn", sql.NVarChar(260), fileName)
        .input("url", sql.NVarChar(2048), blobUrl)
        .input("pg", sql.Int, pg)
        .input("clr", sql.Bit, (color === "color") ? 1 : 0)
        .input("dx", sql.Bit, (duplex === true || duplex === "Yes") ? 1 : 0)
        .input("pc", sql.VarChar(12), pickup)
        .query(`
          INSERT INTO Jobs (user_id, file_name, storage_url, pages, color, duplex, pickup_code, status, created_at)
          OUTPUT INSERTED.*
          VALUES (@uid, @fn, @url, @pg, @clr, @dx, @pc, 'Queued', SYSUTCDATETIME());
        `).catch(e => { throw withWhere("job_insert", e); });

      await tx.commit().catch(e => { throw withWhere("tx_commit", e); });

      context.res = { status: 200, body: { ok: true, job: ins.recordset[0] } };
    } catch (inner) {
      try { await tx.rollback(); } catch {}
      throw inner;
    }

  } catch (err) {
    // always return structured diagnostics
    const status = err.status || 500;
    const body = {
      error: err.code || "exception",
      where: err.where || "unknown",
      detail: err.message || String(err)
    };
    context.log.error("HttpJobsCreate error:", body, err.stack);
    context.res = { status, body };
  }
}

function withWhere(where, e) {
  e.where = where;
  return e;
}
