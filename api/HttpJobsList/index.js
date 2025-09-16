import sql from "mssql";
import auth from "../_auth.js";  // your JWT validation middleware

export default auth(async function (context, req, token) {
  try {
    // Make sure the user is authenticated
    if (!token?.sub) {
      context.res = { status: 401, body: { error: "Unauthorized" } };
      return;
    }

    // Connect to Azure SQL
    const pool = await sql.connect(process.env.DB_CONNECTION);

    // Fetch jobs for this user
    const result = await pool.request()
      .input("user_id", sql.Int, token.sub)
      .query(`
        SELECT TOP 20
          id,
          file_name,
          storage_url,
          pages,
          color,
          duplex,
          status,
          pickup_code,
          created_at
        FROM dbo.Jobs
        WHERE user_id = @user_id
        ORDER BY created_at DESC
      `);

    context.res = {
      status: 200,
      body: result.recordset
    };

  } catch (err) {
    context.log.error("Error in /api/jobs:", err);
    context.res = {
      status: 500,
      body: { error: "Failed to fetch jobs", details: err.message }
    };
  }
});
