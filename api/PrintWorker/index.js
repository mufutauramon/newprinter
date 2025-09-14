import { getSqlPool } from "../lib/sql.js";
import { BlobServiceClient } from "@azure/storage-blob";

export default async function (context, req) {
  const configured = process.env.WORKER_SECRET || "";
  const provided = (req.headers["x-worker-secret"] || "").trim();

  if (configured && provided !== configured) {
    return { status: 401, body: { error: "unauthorized" } };
  }

  const pool = await getSqlPool();
  const batchSize = parseInt(process.env.BATCH_SIZE || "5", 10);

  try {
    const jobs = (await pool.request().query(`
      SELECT TOP (${batchSize}) id, storage_url, file_name
      FROM Jobs WHERE status='Queued' ORDER BY id ASC`)).recordset;

    if (!jobs.length) return { status: 200, body: { ok: true, processed: 0 } };

    const svc = BlobServiceClient.fromConnectionString(process.env.STORAGE_CONNECTION_STRING);
    const container = svc.getContainerClient(process.env.STORAGE_CONTAINER);

    for (const j of jobs) {
      context.log(`Processing job ${j.id} - ${j.file_name}`);
      await pool.request().input("id", j.id).query("UPDATE Jobs SET status='Printing' WHERE id=@id");

      // Just download blob to prove access (replace with actual printer integration)
      const u = new URL(j.storage_url);
      const blobName = decodeURIComponent(u.pathname.split("/").slice(2).join("/"));
      const blob = container.getBlobClient(blobName);
      const dl = await blob.download();
      await streamToNull(dl.readableStreamBody);

      await pool.request().input("id", j.id).query("UPDATE Jobs SET status='Ready' WHERE id=@id");
    }

    return { status: 200, body: { ok: true, processed: jobs.length } };
  } catch (e) {
    context.log.error(e);
    return { status: 500, body: { ok: false, error: String(e) } };
  }
}

async function streamToNull(readable) {
  for await (const _ of readable) { /* discard */ }
}
