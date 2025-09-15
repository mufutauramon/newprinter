import sql from "mssql";

export default async function (context, req) {
  try {
    const connStr = process.env.SQL_CONNECTION_STRING;
    if (!connStr) throw new Error("Missing SQL_CONNECTION_STRING");

    const pool = await new sql.ConnectionPool(connStr).connect();
    const { recordset } = await pool.request().query("SELECT DB_NAME() AS db, SUSER_SNAME() AS login_name, SYSUTCDATETIME() AS utc_now");
    await pool.close();

    context.res = { headers: { "content-type": "application/json" }, body: recordset[0] };
  } catch (err) {
    context.log.error("dbcheck error:", err);
    context.res = { status: 500, headers: { "content-type": "application/json" }, body: { error: String(err.message || err) } };
  }
}
