import sql from "mssql";

let cached = null;
export async function getSqlPool() {
  if (cached && cached.connected) return cached;
  const cs = process.env.SQL_CONNECTION_STRING;
  if (!cs) throw new Error("SQL_CONNECTION_STRING missing");
  cached = await sql.connect(cs);
  return cached;
}
