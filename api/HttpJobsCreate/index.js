import sql from "mssql";

export default async function (context, req) {
  try {
    context.log("HttpJobsCreate invoked");
    const user = req.user && req.user.id ? req.user.id : null;
    if (!user) {
      context.res = { status: 401, body: { error: "no_user", detail: "Missing or invalid token" } };
      return;
    }

    // simple validation of body
    const { fileName, blobUrl, pages, color, duplex } = req.body || {};
    if (!fileName || !blobUrl || !pages) {
      context.res = { status: 400, body: { error: "bad_request", detail: "Missing required fields" } };
      return;
    }

    // connect to DB
    const pool = await sql.connect(process.env.AzureSQL_Connection);
    context.log("Connected to DB");

    // check subscription
    const sub = await pool.request()
      .input("user_id", sql.Int, user)
      .query(`SELECT TOP 1 * FROM Subscriptions WHERE user_id=@user_id AND active=1 ORDER BY start_at DESC`);
    if (!sub.recordset.length) {
      context.res = { status: 403, body: { error: "no_active_subscription" } };
      return;
    }

    // insert job
    const job = await pool.request()
      .input("user_id", sql.Int, user)
      .input("file_name", sql.NVarChar, fileName)
      .input("storage_url", sql.NVarChar, blobUrl)
      .input("pages", sql.Int, pages)
      .input("color", sql.Bit, color === "color" ? 1 : 0)
      .input("duplex", sql.Bit, duplex === "Yes" ? 1 : 0)
      .input("status", sql.NVarChar, "pending")
      .query(`INSERT INTO Jobs (user_id,file_name,storage_url,pages,color,duplex,status,created_at)
              OUTPUT INSERTED.* VALUES (@user_id,@file_name,@storage_url,@pages,@color,@duplex,@status, SYSUTCDATETIME())`);

    context.res = {
      status: 200,
      body: { ok: true, job: job.recordset[0] }
    };

  } catch (err) {
    context.log.error("Job create failed:", err);
    context.res = { status: 500, body: { error: "exception", detail: err.message, stack: err.stack } };
  }
}
