// api/HttpBlobSas/index.js (ESM)
import {
  StorageSharedKeyCredential,
  generateBlobSASQueryParameters,
  BlobSASPermissions
} from "@azure/storage-blob";
import crypto from "crypto";
import { getUser } from "../../lib/jwt.js";

const FILESYSTEM = "jobs"; // your ADLS filesystem (container) name

export default async function (context, req) {
  try {
    let user;
    try { user = getUser(req); } catch { context.res = { status: 401, body: "Not authenticated" }; return; }
    const userId = Number(user.sub || user.id);

    const { fileName, contentType } = req.body || {};
    const ext = fileName && fileName.includes(".") ? "." + fileName.split(".").pop() : "";
    const blobName = `u${userId}/${Date.now()}_${crypto.randomBytes(4).toString("hex")}${ext}`;

    const accountName = process.env.AZURE_STORAGE_ACCOUNT_NAME;
    const accountKey  = process.env.AZURE_STORAGE_ACCOUNT_KEY;
    const creds = new StorageSharedKeyCredential(accountName, accountKey);

    const startsOn = new Date(Date.now() - 60 * 1000);

    // Upload SAS (create + write)
    const uploadSas = generateBlobSASQueryParameters({
      containerName: FILESYSTEM,
      blobName,
      permissions: BlobSASPermissions.parse("cw"),
      startsOn,
      expiresOn: new Date(Date.now() + 10 * 60 * 1000),
      contentType: contentType || undefined
    }, creds).toString();

    // Read SAS (for Job History link)
    const readSas = generateBlobSASQueryParameters({
      containerName: FILESYSTEM,
      blobName,
      permissions: BlobSASPermissions.parse("r"),
      startsOn,
      expiresOn: new Date(Date.now() + 60 * 60 * 1000) // 1 hour link
    }, creds).toString();

    // Use the BLOB endpoint for browser PUT
    const uploadUrl = `https://${accountName}.blob.core.windows.net/${FILESYSTEM}/${encodeURIComponent(blobName)}?${uploadSas}`;
    const readUrl   = `https://${accountName}.blob.core.windows.net/${FILESYSTEM}/${encodeURIComponent(blobName)}?${readSas}`;

    context.res = { status: 200, headers: { "content-type": "application/json" }, body: { uploadUrl, blobUrl: readUrl, blobName } };
  } catch (e) {
    context.log.error("HttpBlobSas error", e);
    context.res = { status: 500, body: "sas_failed" };
  }
}
