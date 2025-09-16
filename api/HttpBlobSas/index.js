// api/HttpBlobSas/index.js
import {
  StorageSharedKeyCredential,
  generateBlobSASQueryParameters,
  BlobSASPermissions
} from "@azure/storage-blob";
import crypto from "crypto";
// import { getUser } from "../../lib/jwt.js"; // enable if you want auth

const FILESYSTEM = "jobs"; // your ADLS filesystem/container

export default async function (context, req) {
  try {
    // Optional auth (uncomment when JWT wired)
    // let user; try { user = getUser(req); } catch { context.res = { status: 401, body: { error: "Not authenticated" } }; return; }

    const { fileName, contentType } = req.body || {};
    const ext = fileName && fileName.includes(".") ? "." + fileName.split(".").pop() : "";
    const blobName = `u${Date.now()}_${crypto.randomBytes(4).toString("hex")}${ext}`;

    const accountName = process.env.AZURE_STORAGE_ACCOUNT_NAME;
    const accountKey  = process.env.AZURE_STORAGE_ACCOUNT_KEY;
    if (!accountName || !accountKey) {
      context.res = { status: 500, body: { error: "Missing AZURE_STORAGE_ACCOUNT_NAME / AZURE_STORAGE_ACCOUNT_KEY" } };
      return;
    }

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

    // Read SAS (for job link)
    const readSas = generateBlobSASQueryParameters({
      containerName: FILESYSTEM,
      blobName,
      permissions: BlobSASPermissions.parse("r"),
      startsOn,
      expiresOn: new Date(Date.now() + 60 * 60 * 1000)
    }, creds).toString();

    const uploadUrl = `https://${accountName}.blob.core.windows.net/${FILESYSTEM}/${encodeURIComponent(blobName)}?${uploadSas}`;
    const blobUrl   = `https://${accountName}.blob.core.windows.net/${FILESYSTEM}/${encodeURIComponent(blobName)}?${readSas}`;

    context.res = { status: 200, headers: { "content-type": "application/json" }, body: { uploadUrl, blobUrl, blobName } };
  } catch (e) {
    context.log.error("HttpBlobSas error", e);
    context.res = { status: 500, body: { error: "sas_failed" } };
  }
}
