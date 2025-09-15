import { getPool, getSql } from "../lib/sql.js";
import { BlobServiceClient } from "@azure/storage-blob";

export default async function (context, req) {
  try {
    const configured = (process.env.WORKER_SECRET || "").trim();
    const provided = (req.headers["x-worker-secret"] || "").trim();
    if (configured && provided !== configured) return json(context, 401, { error: "unauthorized" });

    const pool = await getPool();
    const sql = getSql();
    const batchSize = parseInt(process.env.BATCH_SIZE || "5", 10);

    const jobs = (await pool.request().query(`
      SELECT TOP (${batchSize}) id, storage_url, file_name
      FROM Jobs
      WHERE status='Queued'
      ORDER BY id ASC
    `)).recordset;

    if (!jobs.length) return json(context, 200, { ok: true, processed: 0 });

    // If you're using account key:
    const svc = BlobServiceClient.fromConnectionString(process.env.STORAGE_CONNECTION_STRING);
    const container = svc.getContainerClient(process.env.STORAGE_CONTAINER);

    for (const j of jobs) {
      context.log(`Processing job ${j.id} - ${j.file_name}`);
      await pool.request().input("id", sql.Int, j.id).query("UPDATE Jobs SET status='Printing' WHERE id=@id");

      // download to prove access (swap with real printing)
      const u = new URL(j.storage_url);
      const blobName = decodeURIComponent(u.pathname.split("/").slice(2).join("/"));
      const blob = container.getBlobClient(blobName);
      const dl = await blob.download();
      for await (const _ of dl.readableStreamBody) { /* discard */ }

      await pool.request().input("id", sql.Int, j.id).query("UPDATE Jobs SET status='Ready' WHERE id=@id");
    }

    return json(context, 200, { ok: true, processed: jobs.length });
  } catch (e) {
    context.log.error(e);
    return json(context, 500, { ok: false, error: String(e) });
  }
}

function json(ctx, status, body) {
  ctx.res = { status, headers: { "content-type": "application/json" }, body };
}
