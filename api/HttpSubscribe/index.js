// TEMP DIAGNOSTIC VERSION (skip subscription deduction)
const ins = await pool.request()
  .input("uid", sql.Int, uid)
  .input("fn",  sql.NVarChar(260),  fileName)
  .input("url", sql.NVarChar(2048), blobUrl)
  .input("pg",  sql.Int,            pg)
  .input("clr", sql.Bit,            String(color||"").toLowerCase().includes("color") ? 1 : 0)
  .input("dx",  sql.Bit,            String(duplex||"").toLowerCase() === "yes" ? 1 : 0)
  .input("pc",  sql.VarChar(12),    Math.floor(100000 + Math.random() * 900000).toString())
  .query(`
    INSERT INTO Jobs (user_id, file_name, storage_url, pages, color, duplex, pickup_code, status, created_at)
    OUTPUT inserted.id, inserted.user_id, inserted.file_name, inserted.storage_url,
           inserted.pages, inserted.color, inserted.duplex, inserted.status,
           inserted.pickup_code, inserted.created_at
    VALUES (@uid, @fn, @url, @pg, @clr, @dx, @pc, 'Queued', SYSUTCDATETIME());
  `);
return json(context, 200, ins.recordset[0]);
