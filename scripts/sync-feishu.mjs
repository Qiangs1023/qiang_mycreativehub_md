#!/usr/bin/env node
// scripts/sync-feishu.mjs
const REQUIRED = ["FEISHU_APP_ID", "FEISHU_APP_SECRET", "FEISHU_APP_TOKEN", "FEISHU_TABLE_IDS", "FEISHU_TABLE_KINDS"];
for (const k of REQUIRED) {
  if (!process.env[k]) {
    console.error(`Missing env: ${k}`);
    process.exit(2);
  }
}

const TABLE_IDS = process.env.FEISHU_TABLE_IDS.split(",");
const TABLE_KINDS = process.env.FEISHU_TABLE_KINDS.split(",");
if (TABLE_IDS.length !== TABLE_KINDS.length) {
  console.error("FEISHU_TABLE_IDS and FEISHU_TABLE_KINDS must have equal length");
  process.exit(2);
}

const ROOT = process.cwd();
let cachedToken = null;
let tokenExpiresAt = 0;

export async function getToken() {
  const now = Date.now();
  if (cachedToken && tokenExpiresAt > now + 60_000) return cachedToken;
  const res = await fetch("https://open.feishu.cn/open-apis/auth/v3/tenant_access_token/internal", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      app_id: process.env.FEISHU_APP_ID,
      app_secret: process.env.FEISHU_APP_SECRET,
    }),
  });
  const data = await res.json();
  if (data.code !== 0) throw new Error(`token error: ${data.msg}`);
  cachedToken = data.tenant_access_token;
  tokenExpiresAt = now + (data.expire - 60) * 1000;
  return cachedToken;
}

export async function listRecords(token, tableId) {
  const records = [];
  let pageToken;
  for (;;) {
    const url = new URL(
      `https://open.feishu.cn/open-apis/bitable/v1/apps/${process.env.FEISHU_APP_TOKEN}/tables/${tableId}/records`,
    );
    url.searchParams.set("page_size", "500");
    if (pageToken) url.searchParams.set("page_token", pageToken);
    const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
    const json = await res.json();
    if (json.code !== 0) throw new Error(`list records: ${json.msg}`);
    records.push(...json.data.items);
    if (!json.data.has_more) break;
    pageToken = json.data.page_token;
  }
  return records;
}

export { ROOT, TABLE_IDS, TABLE_KINDS };