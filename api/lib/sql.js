// ESM module
import sql from "mssql";

/**
 * Creates (and caches) a single SQL connection pool.
 * Works with either:
 *  - SQL_PASSWORD connection string in SQL_CONNECTION_STRING
 *  - Managed Identity (not used here)
 */
let poolPromise;

export function getSql() {
  return sql;
}

export async function getPool() {
  if (poolPromise) return poolPromise;

  // ---- Expecting a classic SQL username/password connection string ----
  const connStr = process.env.SQL_CONNECTION_STRING;
  if (!connStr) {
    throw new Error("Missing SQL_CONNECTION_STRING app setting");
  }

  // mssql can take a connection string directly.
  poolPromise = new sql.ConnectionPool(connStr)
    .connect()
    .then(pool => {
      // basic sanity query, but don’t block future acquires
      pool.request().query("SELECT 1").catch(() => {});
      return pool;
    });

  return poolPromise;
}
