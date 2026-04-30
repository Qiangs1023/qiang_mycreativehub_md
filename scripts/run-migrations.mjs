import { readFileSync, readdirSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import { config } from "dotenv";

const __dirname = dirname(fileURLToPath(import.meta.url));

config({ path: join(__dirname, "..", ".env") });

const MIGRATIONS_DIR = join(__dirname, "..", "supabase", "migrations");

const DB_HOST = process.env.SUPABASE_DB_HOST || "spb-6uukrzky061ha9nw.supabase.opentrust.net";
const DB_PORT = parseInt(process.env.SUPABASE_DB_PORT || "5432");
const DB_NAME = process.env.SUPABASE_DB_NAME || "postgres";
const DB_USER = process.env.SUPABASE_DB_USER || "postgres";

async function run() {
  const password = process.argv[2] || process.env.SUPABASE_DB_PASSWORD;
  if (!password) {
    console.error("请提供数据库密码:");
    console.error("  node scripts/run-migrations.mjs <password>");
    console.error("或设置环境变量:");
    console.error("  SUPABASE_DB_PASSWORD=<password> npm run db-migrate");
    process.exit(1);
  }

  const { Pool } = await import("pg");

  // Try multiple connection configs
  const configs = [
    { ssl: false },
    { ssl: { rejectUnauthorized: false } },
  ];

  let connected = false;
  let pool;

  for (const cfg of configs) {
    try {
      pool = new Pool({
        host: DB_HOST,
        port: DB_PORT,
        database: DB_NAME,
        user: DB_USER,
        password: password,
        ...cfg,
        connectionTimeoutMillis: 8000,
      });
      await pool.query("SELECT 1");
      connected = true;
      console.log("数据库连接成功 (SSL:", cfg.ssl !== false, ")\n");
      break;
    } catch (e) {
      if (pool && typeof pool.end === "function") await pool.end();
      console.log("  尝试 SSL:", cfg.ssl !== false, "-", e.message.substring(0, 60));
    }
  }

  if (!connected) {
    console.error("数据库连接失败: 所有连接方式均失败");
    process.exit(1);
  }

  const files = readdirSync(MIGRATIONS_DIR)
    .filter((f) => f.endsWith(".sql"))
    .sort();

  console.log(`找到 ${files.length} 个迁移文件:\n`);

  for (const file of files) {
    const content = readFileSync(join(MIGRATIONS_DIR, file), "utf-8");
    console.log(`执行: ${file}`);
    try {
      await pool.query(content);
      console.log(`  ✓ 完成`);
    } catch (e) {
      console.log(`  ⚠ 警告: ${e.message.substring(0, 120)}`);
    }
  }

  console.log("\n所有迁移执行完毕");
  await pool.end();
}

run().catch((e) => {
  console.error("错误:", e.message);
  process.exit(1);
});
