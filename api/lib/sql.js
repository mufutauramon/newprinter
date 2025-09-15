// ESM module
import sql from "mssql";

let poolPromise;

export function getSql() {
  return sql;
}

export async function getPool() {
  if (poolPromise) return poolPromise;

  const connStr =
    process.env.SQL_CONNECTION_STRING ||
    process.env.SQL_CONNECTION ||
    process.env.AZURE_SQL_CONNECTIONSTRING;

  if (!connStr) throw new Error("Missing SQL_CONNECTION_STRING app setting");

  poolPromise = new sql.ConnectionPool(connStr).connect().then(pool => {
    pool.request().query("SELECT 1").catch(() => {});
    return pool;
  });

  return poolPromise;
}

export async function closePool() {
  if (!poolPromise) return;
  const pool = await poolPromise;
  await pool.close();
  poolPromise = undefined;
}
