import { app } from "@azure/functions";
import { getUser } from "../lib/jwt.js";
import { getPool } from "../lib/sql.js";

app.http("HttpJobsList", {
  methods: ["GET"],
  authLevel: "anonymous",
  route: "jobs",
  handler: async (req, ctx) => {
    try {
      // 1. Decode JWT
      const user = getUser(req);
      const userId = parseInt(user.sub, 10);
      if (!userId) throw new Error("Invalid user ID in token");

      // 2. Connect to SQL
      const pool = await getPool();

      // 3. Fetch job history for this user
      const result = await pool.request()
        .input("user_id", userId)
        .query(`
          SELECT TOP 20
            id, file_name, storage_url, pages, color, duplex,
            status, pickup_code, created_at
          FROM dbo.Jobs
          WHERE user_id = @user_id
          ORDER BY created_at DESC
        `);

      // 4. Return JSON
      return {
        status: 200,
        jsonBody: result.recordset
      };

    } catch (err) {
      ctx.log("HttpJobsList error", err);
      return {
        status: err.status || 500,
        jsonBody: { error: err.message }
      };
    }
  }
});
