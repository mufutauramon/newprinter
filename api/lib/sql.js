// ESM module
import sql from "mssql";

let poolPromise; // cache a single pool across invocations

export function getSql() {
  return sql;
}

export async function getPool() {
  if (poolPromise) return poolPromise;

  // Accept typical env var names; your repo uses SQL_CONNECTION_STRING
  const connStr =
    process.env.SQL_CONNECTION_STRING ||
    process.env.SQL_CONNECTION ||
    process.env.AZURE_SQL_CONNECTIONSTRING;

  if (!connStr) {
    throw new Error("Missing SQL_CONNECTION_STRING app setting");
  }

  // Create and cache the connection pool
  poolPromise = new sql.ConnectionPool(connStr)
    .connect()
    .then(pool => {
      // best-effort sanity check (don’t await)
      pool.request().query("SELECT 1").catch(() => {});
      return pool;
    });

  return poolPromise;
}

// optional helper if you ever want to close it
export async function closePool() {
  if (!poolPromise) return;
  const pool = await poolPromise;
  await pool.close();
  poolPromise = undefined;
}
