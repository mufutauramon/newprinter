import { BlobServiceClient, StorageSharedKeyCredential, generateBlobSASQueryParameters, BlobSASPermissions } from "@azure/storage-blob";
import crypto from "crypto";
import { getUser } from "../../lib/jwt.js";

const CONTAINER = "jobs";

export default async function (context, req) {
  try {
    // Require auth (same style as your other endpoints)
    let user;
    try { user = getUser(req); } 
    catch { 
      context.res = { status: 401, body: "Not authenticated" };
      return;
    }
    const userId = Number(user.sub || user.id);

    // Inputs from client (optional: accept suggested fileName/contentType)
    const { fileName, contentType } = (req.body || {});
    const ext = (fileName && fileName.includes(".")) ? "." + fileName.split(".").pop() : "";
    const keyPrefix = `u${userId}/${Date.now()}_${crypto.randomBytes(4).toString("hex")}`;
    const blobName = `${keyPrefix}${ext}`;

    // Build SAS for a single blob (write+create)
    const accountName = process.env.AZURE_STORAGE_ACCOUNT_NAME;
    const accountKey  = process.env.AZURE_STORAGE_ACCOUNT_KEY;
    if (!accountName || !accountKey) {
      context.res = { status: 500, body: "Missing AZURE_STORAGE_ACCOUNT_NAME / AZURE_STORAGE_ACCOUNT_KEY" };
      return;
    }

    const creds = new StorageSharedKeyCredential(accountName, accountKey);
    const startsOn = new Date(Date.now() - 60 * 1000); // 1 min clock skew
    const expiresOn = new Date(Date.now() + 10 * 60 * 1000); // 10 min SAS

    const sas = generateBlobSASQueryParameters({
      containerName: CONTAINER,
      blobName,
      permissions: BlobSASPermissions.parse("cw"), // create + write
      startsOn,
      expiresOn,
      contentType: contentType || undefined
    }, creds).toString();

    const blobUrl = `https://${accountName}.blob.core.windows.net/${CONTAINER}/${encodeURIComponent(blobName)}?${sas}`;

    // Reply with the signed URL and the public (read) URL (assuming container access is 'Blob' or via SAS read later)
    const publicUrl = `https://${accountName}.blob.core.windows.net/${CONTAINER}/${encodeURIComponent(blobName)}`;

    context.res = {
      status: 200,
      headers: { "content-type": "application/json" },
      body: { uploadUrl: blobUrl, blobUrl: publicUrl, blobName }
    };
  } catch (e) {
    context.log.error("HttpBlobSas error", e);
    context.res = { status: 500, body: "sas_failed" };
  }
}
