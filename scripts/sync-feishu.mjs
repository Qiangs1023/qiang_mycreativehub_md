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