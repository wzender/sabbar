import fs from "fs";
import path from "path";
import { query, pool } from "../db";

async function runMigrations() {
  const sqlPath = path.resolve(__dirname, "../../sql/001_init.sql");
  const sql = fs.readFileSync(sqlPath, "utf8");
  await query(sql);
  console.log("Migrations completed");
}

runMigrations()
  .catch((error) => {
    console.error("Migration failed", error);
    process.exit(1);
  })
  .finally(async () => {
    await pool.end();
  });
