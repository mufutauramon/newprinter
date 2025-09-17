// api/HttpJobsCreate/index.js
import { getPool, getSql } from "../../lib/sql.js";
import { getUser } from "../../lib/jwt.js";

export default async function (context, req) {
  // ---- quick probe/echo (handy for debugging)
  if (req.method === "POST" && req.body && req.body.ping) {
    context.res = {
      status: 200,
      headers: { "content-type": "application/json", "x-rpn-stage": "echo-v2" },
      body: { ok: true, stage: "echo-v2", method: "POST", echo: req.body },
    };
    return;
  }

  try {
    // -------- auth
    const user = getUser(req); // throws 401 with {status} on bad token
    const userId = Number(user.sub || user.id);

    // -------- validate input
    const b = req.body || {};
    const fileName = (b.fileName || "").toString().trim();
    const blobUrl  = (b.blobUrl  || "").toString().trim();
    const pages    = parseInt(b.pages, 10);
    const colorStr = (b.color || "").toString().toLowerCase();
    const duplex   = !!b.duplex;

    if (!fileName || !blobUrl || !Number.isFinite(pages) || pages <= 0) {
      return json(context, 400, {
        error: "bad_request",
        detail: "fileName, blobUrl and pages (>0) are required"
      });
    }

    const colorBit = colorStr.includes("color") ? 1 : 0;

    // -------- SQL
    const pool = await getPool();
    const sql  = getSql();

    // Latest active subscription
    const subRs = await pool.request()
      .input("uid", sql.Int, userId)
      .query(`
        SELECT TOP 1 id, pages_remaining
        FROM dbo.Subscriptions
        WHERE user_id = @uid AND active = 1
        ORDER BY start_at DESC
      `);

    const sub = subRs.recordset[0];
    if (!sub) {
      return json(context, 400, { error: "no_active_subscription" });
    }

    const toDeduct = Math.min(pages, (sub.pages_remaining ?? 0));

    const tx = new sql.Transaction(pool);
    await tx.begin();

    try {
      const rq = new sql.Request(tx);

      if (toDeduct > 0) {
        await rq
          .input("sid", sql.Int, sub.id)
          .input("d",   sql.Int, toDeduct)
          .query(`
            UPDATE dbo.Subscriptions
            SET pages_remaining = pages_remaining - @d
            WHERE id = @sid
          `);
      }

      const pickup = Math.floor(100000 + Math.random() * 900000).toString();

      // Insert and return the new row immediately
      const insert = await rq
        .input("uid", sql.Int, userId)
        .input("fn",  sql.NVarChar(260),  fileName)
        .input("url", sql.NVarChar(2048), blobUrl)
        .input("pg",  sql.Int, pages)
        .input("clr", sql.Bit, colorBit)
        .input("dx",  sql.Bit, duplex ? 1 : 0)
        .input("pc",  sql.VarChar(12), pickup)
        .query(`
          INSERT INTO dbo.Jobs
            (user_id, file_name, storage_url, pages, color, duplex, pickup_code, status, created_at)
          OUTPUT INSERTED.id, INSERTED.user_id, INSERTED.file_name, INSERTED.storage_url,
                 INSERTED.pages, INSERTED.color, INSERTED.duplex, INSERTED.status,
                 INSERTED.pickup_code, INSERTED.created_at
          VALUES
            (@uid, @fn, @url, @pg, @clr, @dx, @pc, N'Queued', SYSUTCDATETIME());
        `);

      await tx.commit();

      const row = insert.recordset[0] || { status: "Queued", pickup_code: pickup };
      return json(context, 200, row);
    } catch (e) {
      await tx.rollback();
      context.log.error("HttpJobsCreate: TX failed", e);
      return json(context, 500, {
        error: "job_create_failed",
        detail: e?.message || String(e),
        code: e?.number ?? null,
        stack: e?.stack ?? null
      });
    }
  } catch (e) {
    // errors outside the TX (auth, pool, validation, etc.)
    const status = e.status || 500;
    context.log.error("HttpJobsCreate: outer error", e);
    return json(context, status, {
      error: e.message || String(e),
      stack: e?.stack ?? null
    });
  }
}

function json(ctx, status, body) {
  ctx.res = { status, headers: { "content-type": "application/json" }, body };
}
