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

import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { marked } from "marked";

marked.setOptions({ gfm: true, breaks: false });

export function pickLocalized(fields, base) {
  const result = { zh: fields[`${base}_zh`] ?? "" };
  if (fields[`${base}_en`]) result.en = fields[`${base}_en`];
  return result;
}

export function attachmentMeta(att) {
  if (!att || !att[0]) return undefined;
  return { name: att[0].file_name ?? att[0].name, url: att[0].tmp_url };
}

function convertObsidianImages(html) {
  return html.replace(/!\[\[([^\]]+)\]\]/g, (_, p) => {
    const filename = p.trim();
    const src = filename.startsWith("/") ? filename : `/images/${filename}`;
    const alt = filename.replace(/\.[^.]+$/, "");
    return `<img src="${src}" alt="${alt}" />`;
  });
}

function renderMarkdown(md) {
  if (!md) return "";
  return convertObsidianImages(marked.parse(md));
}

export function normalizeWriting(record) {
  const f = record.fields;
  const slug = f.slug;
  const cover = attachmentMeta(f.cover);
  return {
    slug,
    title: pickLocalized(f, "title").zh || slug,
    excerpt: pickLocalized(f, "excerpt").zh || undefined,
    date: f.date ? String(f.date) : undefined,
    publishedAt: f.publishedAt ? String(f.publishedAt) : undefined,
    tag: f.tag,
    tags: f.tags ?? [],
    readTime: f.readTime,
    cover: cover ? `/uploads/writings/${slug}/${cover.name}` : undefined,
    bodyMarkdown: pickLocalized(f, "body").zh || "",
    bodyHtml: renderMarkdown(pickLocalized(f, "body").zh || ""),
    status: f.status === "published" ? "published" : "draft",
    featured: Boolean(f.featured),
  };
}

export function normalizeWork(record) {
  const f = record.fields;
  const slug = f.slug;
  const cover = attachmentMeta(f.cover);
  return {
    slug,
    title: pickLocalized(f, "title").zh || slug,
    excerpt: pickLocalized(f, "excerpt").zh || undefined,
    date: f.date ? String(f.date) : undefined,
    publishedAt: f.publishedAt ? String(f.publishedAt) : undefined,
    tag: f.tag,
    status: f.status === "active" ? "active" : "archived",
    cover: cover ? `/uploads/works/${slug}/${cover.name}` : undefined,
    stack: f.stack ?? [],
    link: f.link,
    bodyMarkdown: pickLocalized(f, "body").zh || "",
    bodyHtml: renderMarkdown(pickLocalized(f, "body").zh || ""),
    featured: Boolean(f.featured),
    order: typeof f.order === "number" ? f.order : 0,
  };
}

export function normalizeVideo(record) {
  const f = record.fields;
  const slug = f.slug;
  const cover = attachmentMeta(f.cover);
  return {
    slug,
    title: pickLocalized(f, "title").zh || slug,
    excerpt: pickLocalized(f, "excerpt").zh || undefined,
    date: f.date ? String(f.date) : undefined,
    publishedAt: f.publishedAt ? String(f.publishedAt) : undefined,
    tag: f.tag,
    status: f.status === "published" ? "published" : "draft",
    cover: cover ? `/uploads/videos/${slug}/${cover.name}` : undefined,
    platform: f.platform,
    duration: f.duration,
    views: f.views,
    videoUrl: f.videoUrl,
    bodyMarkdown: pickLocalized(f, "body").zh || "",
    bodyHtml: renderMarkdown(pickLocalized(f, "body").zh || ""),
    featured: Boolean(f.featured),
    order: typeof f.order === "number" ? f.order : 0,
  };
}

export function normalizeCourse(record) {
  const f = record.fields;
  const slug = f.slug;
  const cover = attachmentMeta(f.cover);
  return {
    slug,
    title: pickLocalized(f, "title").zh || slug,
    excerpt: pickLocalized(f, "excerpt").zh || undefined,
    date: f.date ? String(f.date) : undefined,
    publishedAt: f.publishedAt ? String(f.publishedAt) : undefined,
    tag: f.tag,
    status: f.status === "published" ? "published" : "draft",
    cover: cover ? `/uploads/courses/${slug}/${cover.name}` : undefined,
    price: f.price,
    original: f.original,
    students: f.students,
    features: f.features ?? [],
    primary: Boolean(f.primary),
    badge: f.badge,
    cta: f.cta,
    url: f.url,
    bodyMarkdown: pickLocalized(f, "body").zh || "",
    bodyHtml: renderMarkdown(pickLocalized(f, "body").zh || ""),
    featured: Boolean(f.featured),
    order: typeof f.order === "number" ? f.order : 0,
  };
}

export function normalizeAbout(records) {
  if (!records || records.length === 0) {
    return { key: "about", title: "", bodyMarkdown: "", bodyHtml: "" };
  }
  const sorted = records.slice().sort((a, b) => {
    const av = String(a.fields.updatedAt ?? "");
    const bv = String(b.fields.updatedAt ?? "");
    return bv.localeCompare(av);
  });
  const f = sorted[0].fields;
  const cover = attachmentMeta(f.cover);
  return {
    key: "about",
    title: pickLocalized(f, "title").zh || "关于",
    excerpt: pickLocalized(f, "excerpt").zh || undefined,
    cover: cover ? `/uploads/about/avatar/${cover.name}` : undefined,
    bodyMarkdown: pickLocalized(f, "body").zh || "",
    bodyHtml: renderMarkdown(pickLocalized(f, "body").zh || ""),
    updatedAt: f.updatedAt ? String(f.updatedAt) : undefined,
  };
}

export function hash(obj) {
  return crypto.createHash("sha256").update(typeof obj === "string" ? obj : JSON.stringify(obj)).digest("hex");
}

export function writeIfChanged(file, data) {
  const json = JSON.stringify(data, null, 2) + "\n";
  const existing = fs.existsSync(file) ? fs.readFileSync(file, "utf-8") : "";
  if (hash(json) === hash(existing)) {
    console.log(`unchanged: ${path.relative(ROOT, file)}`);
    return false;
  }
  fs.writeFileSync(file, json);
  console.log(`${existing ? "updated" : "created"}: ${path.relative(ROOT, file)}`);
  return true;
}

export async function downloadAttachment(url, outPath) {
  if (fs.existsSync(outPath)) return;
  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  const token = await getToken();
  const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
  if (!res.ok) throw new Error(`attachment ${res.status}`);
  const buf = Buffer.from(await res.arrayBuffer());
  fs.writeFileSync(outPath, buf);
}

export async function syncAttachments(records, slug, kind) {
  const attachmentField = { writings: "cover", works: "cover", videos: "cover", courses: "cover" }[kind];
  if (!attachmentField) return;
  const tasks = [];
  for (const r of records) {
    const att = r.fields[attachmentField]?.[0];
    if (!att?.tmp_url) continue;
    const out = path.join(ROOT, "public", "uploads", kind, slug, att.file_name);
    tasks.push(
      downloadAttachment(att.tmp_url, out).catch((err) =>
        console.warn(`attachment ${slug}: ${err.message}`),
      ),
    );
  }
  await Promise.all(tasks);
}

const TABLE_MAP = Object.fromEntries(TABLE_KINDS.map((kind, i) => [kind, TABLE_IDS[i]]));

export async function main() {
  const token = await getToken();
  const articleRecords = TABLE_MAP.writings ? await listRecords(token, TABLE_MAP.writings) : [];
  const workRecords = TABLE_MAP.works ? await listRecords(token, TABLE_MAP.works) : [];
  const videoRecords = TABLE_MAP.videos ? await listRecords(token, TABLE_MAP.videos) : [];
  const courseRecords = TABLE_MAP.courses ? await listRecords(token, TABLE_MAP.courses) : [];
  const aboutRecords = TABLE_MAP.abouts ? await listRecords(token, TABLE_MAP.abouts) : [];

  const writings = articleRecords.map(normalizeWriting).filter((w) => w.status === "published");
  const works = workRecords.map(normalizeWork).filter((w) => w.status === "active");
  const videos = videoRecords.map(normalizeVideo).filter((v) => v.status === "published");
  const courses = courseRecords.map(normalizeCourse).filter((c) => c.status === "published");
  const about = normalizeAbout(aboutRecords);

  await syncAttachments(articleRecords, "writings", "writings");
  await syncAttachments(workRecords, "works", "works");
  await syncAttachments(videoRecords, "videos", "videos");
  await syncAttachments(courseRecords, "courses", "courses");

  writeIfChanged(path.join(ROOT, "data/writings.json"), { writings });
  writeIfChanged(path.join(ROOT, "data/works.json"), { works });
  writeIfChanged(path.join(ROOT, "data/videos.json"), { videos });
  writeIfChanged(path.join(ROOT, "data/courses.json"), { courses });
  writeIfChanged(path.join(ROOT, "data/about.json"), about);
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch((err) => {
    console.error(err);
    process.exit(1);
  });
}