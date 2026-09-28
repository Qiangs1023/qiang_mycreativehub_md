// scripts/sync-feishu-io.test.mjs
process.env.FEISHU_APP_ID = "test_app_id";
process.env.FEISHU_APP_SECRET = "test_app_secret";
process.env.FEISHU_APP_TOKEN = "test_app_token";
process.env.FEISHU_TABLE_IDS = "tbl1,tbl2,tbl3,tbl4,tbl5";
process.env.FEISHU_TABLE_KINDS = "writings,works,videos,courses,abouts";

const { test } = await import("node:test");
const assert = (await import("node:assert/strict")).default;
const fs = await import("node:fs");
const path = await import("node:path");
const os = await import("node:os");

const { writeIfChanged, hash } = await import("./sync-feishu.mjs");

test("writeIfChanged writes new file when missing", () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "sync-"));
  const file = path.join(dir, "x.json");
  writeIfChanged(file, { a: 1 });
  assert.ok(fs.existsSync(file));
  assert.equal(fs.readFileSync(file, "utf-8"), JSON.stringify({ a: 1 }, null, 2) + "\n");
});

test("writeIfChanged skips write when content unchanged", async () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "sync-"));
  const file = path.join(dir, "x.json");
  writeIfChanged(file, { a: 1 });
  const mtime1 = fs.statSync(file).mtimeMs;
  await new Promise((r) => setTimeout(r, 50));
  writeIfChanged(file, { a: 1 });
  const mtime2 = fs.statSync(file).mtimeMs;
  assert.equal(mtime1, mtime2);
});

test("hash returns sha256 hex", () => {
  const h = hash("hello");
  assert.equal(h.length, 64);
  assert.equal(h, "2cf24dba5fb0a30e26e83b2ac5b9e29e1b161e5c1fa7425e73043362938b9824");
});