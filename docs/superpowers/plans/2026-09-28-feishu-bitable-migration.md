# qiang_mycreativehub_md 飞书 Bitable 内容迁移实施计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 把 qiang_mycreativehub_md 的内容来源从本地 Markdown 迁移到飞书 Bitable，让作者在飞书 UI 编辑即可更新站点。

**Architecture:** prebuild 阶段跑 `scripts/sync-feishu.mjs` 从飞书 5 张表拉数据 → 写入 `data/*.json` + 下载封面到 `public/uploads/` → `src/lib/data.ts` 用 zod 校验后暴露给 React 组件。GitHub Actions 每 30 分钟 cron 同步一次保证线上新鲜度。

**Tech Stack:** Vite 7 + React 19 + TanStack Router + Zod 3 + Node 24 ESM（`node --test` 内置）+ GitHub Pages 部署 + 飞书开放平台 Bitable API。

---

## File Structure

| 路径 | 类型 | 职责 |
|---|---|---|
| `src/schemas/content.ts` | 新建 | 5 个 zod schema + TS 类型 |
| `src/lib/data.ts` | 新建 | zod 校验 data/*.json + 暴露 load/find 函数 |
| `data/writings.json` | 新建 | 初始 `{ writings: [] }` 占位；sync 后填充 |
| `data/works.json` | 新建 | 初始 `{ works: [] }` 占位 |
| `data/videos.json` | 新建 | 初始 `{ videos: [] }` 占位 |
| `data/courses.json` | 新建 | 初始 `{ courses: [] }` 占位 |
| `data/about.json` | 新建 | 初始占位 `{ key: "about", bodyMarkdown: "", bodyHtml: "" }` |
| `scripts/sync-feishu.mjs` | 新建 | 飞书 → data/*.json 同步脚本 |
| `scripts/sync-feishu.test.mjs` | 新建 | node --test 测试 normalize 函数 |
| `.github/workflows/sync-feishu.yml` | 新建 | 每 30 分钟 cron 同步 |
| `package.json` | 修改 | 加 prebuild + sync:feishu 脚本 |
| `src/components/Writing.tsx` | 修改 | 改用 loadWritings() |
| `src/components/Work.tsx` | 修改 | 改用 loadWorks() |
| `src/components/Videos.tsx` | 修改 | 改用 loadVideos() |
| `src/components/Courses.tsx` | 修改 | 改用 loadCourses() |
| `src/routes/writing.$slug.tsx` | 修改 | 改用 findWriting() |
| `src/routes/work.$slug.tsx` | 修改 | 改用 findWork() |
| `src/routes/videos.$slug.tsx` | 修改 | 改用 findVideo() |
| `src/routes/about.tsx` | 修改 | 改用 loadAbout() |
| `src/lib/content.ts` | 删除 | 旧 md parser |
| `src/content/writing/*.md` | 删除 | 8 个文件 |
| `src/content/work/*.md` | 删除 | 3 个 |
| `src/content/videos/*.md` | 删除 | 3 个 |
| `src/content/courses/*.md` | 删除 | 4 个 |
| `src/content/about/about.md` | 删除 | 1 个 |
| `README.md` | 修改 | 文档 GH Secrets 配置 |

**保留**：`src/content/news/rss-data.json` + `scripts/fetch-rss.mjs`（RSS 链路独立）。

---

## Task Dependencies

```
Task 1 (zod schemas)            [independent]
Task 2 (data.json placeholders) [independent]
Task 3 (data.ts + tests)        [depends on 1, 2]
Task 4 (sync token + list)      [independent]
Task 5 (sync normalize + test)  [depends on 4]
Task 6 (sync attach + write)    [depends on 5]
Task 7 (package.json scripts)   [independent]
Task 8 (run sync, populate data)[depends on 3, 6, 7]
Task 9 (Writing component)      [depends on 8]
Task 10 (Work component)        [depends on 8]
Task 11 (Videos component)      [depends on 8]
Task 12 (Courses component)     [depends on 8]
Task 13 (writing route)         [depends on 9]
Task 14 (work route)            [depends on 10]
Task 15 (videos route)          [depends on 11]
Task 16 (about route)           [depends on 8]
Task 17 (delete old files)      [depends on 9-16]
Task 18 (GH workflow)           [depends on 6]
Task 19 (README GH Secrets)     [depends on 18]
Task 20 (e2e validation)        [last]
```

---

## Task 1: 创建 zod schema 文件

**Files:**
- Create: `src/schemas/content.ts`

- [ ] **Step 1: 写入完整 schema 文件**

```ts
// src/schemas/content.ts
import { z } from "zod";

export const WritingSchema = z.object({
  slug: z.string(),
  title: z.string().min(1),
  excerpt: z.string().optional(),
  date: z.string().optional(),
  publishedAt: z.string().optional(),
  tag: z.string().optional(),
  tags: z.array(z.string()).default([]),
  readTime: z.string().optional(),
  cover: z.string().optional(),
  bodyMarkdown: z.string().default(""),
  bodyHtml: z.string().default(""),
  status: z.enum(["draft", "published"]),
  featured: z.boolean().default(false),
});

export const WorkSchema = z.object({
  slug: z.string(),
  title: z.string().min(1),
  excerpt: z.string().optional(),
  date: z.string().optional(),
  publishedAt: z.string().optional(),
  tag: z.string().optional(),
  status: z.enum(["active", "archived"]),
  cover: z.string().optional(),
  stack: z.array(z.string()).default([]),
  link: z.string().optional(),
  bodyMarkdown: z.string().default(""),
  bodyHtml: z.string().default(""),
  featured: z.boolean().default(false),
  order: z.number().default(0),
});

export const VideoSchema = z.object({
  slug: z.string(),
  title: z.string().min(1),
  excerpt: z.string().optional(),
  date: z.string().optional(),
  publishedAt: z.string().optional(),
  tag: z.string().optional(),
  status: z.enum(["draft", "published"]),
  cover: z.string().optional(),
  platform: z.string().optional(),
  duration: z.string().optional(),
  views: z.string().optional(),
  videoUrl: z.string().optional(),
  bodyMarkdown: z.string().default(""),
  bodyHtml: z.string().default(""),
  featured: z.boolean().default(false),
  order: z.number().default(0),
});

export const CourseSchema = z.object({
  slug: z.string(),
  title: z.string().min(1),
  excerpt: z.string().optional(),
  date: z.string().optional(),
  publishedAt: z.string().optional(),
  tag: z.string().optional(),
  status: z.enum(["draft", "published"]),
  cover: z.string().optional(),
  price: z.string().optional(),
  original: z.string().optional(),
  students: z.string().optional(),
  features: z.array(z.string()).default([]),
  primary: z.boolean().default(false),
  badge: z.string().optional(),
  cta: z.string().optional(),
  url: z.string().optional(),
  bodyMarkdown: z.string().default(""),
  bodyHtml: z.string().default(""),
  featured: z.boolean().default(false),
  order: z.number().default(0),
});

export const AboutSchema = z.object({
  key: z.literal("about"),
  title: z.string(),
  excerpt: z.string().optional(),
  cover: z.string().optional(),
  bodyMarkdown: z.string().default(""),
  bodyHtml: z.string().default(""),
});

export type Writing = z.infer<typeof WritingSchema>;
export type Work = z.infer<typeof WorkSchema>;
export type Video = z.infer<typeof VideoSchema>;
export type Course = z.infer<typeof CourseSchema>;
export type About = z.infer<typeof AboutSchema>;
```

- [ ] **Step 2: 编译检查**

Run: `npx tsc --noEmit src/schemas/content.ts`
Expected: 无错误输出（tsconfig 已有）

- [ ] **Step 3: Commit**

```bash
git add src/schemas/content.ts
git commit -m "feat(schemas): add zod schemas for 5 content collections"
```

---

## Task 2: 创建 data/*.json 占位文件

**Files:**
- Create: `data/writings.json`
- Create: `data/works.json`
- Create: `data/videos.json`
- Create: `data/courses.json`
- Create: `data/about.json`

- [ ] **Step 1: 写入 5 个占位 JSON**

```json
// data/writings.json
{ "writings": [] }
```

```json
// data/works.json
{ "works": [] }
```

```json
// data/videos.json
{ "videos": [] }
```

```json
// data/courses.json
{ "courses": [] }
```

```json
// data/about.json
{ "key": "about", "title": "", "bodyMarkdown": "", "bodyHtml": "" }
```

- [ ] **Step 2: Commit**

```bash
git add data/writings.json data/works.json data/videos.json data/courses.json data/about.json
git commit -m "chore(data): add empty placeholder data/*.json"
```

---

## Task 3: 创建 src/lib/data.ts + 测试

**Files:**
- Create: `src/lib/data.ts`
- Create: `src/lib/data.test.ts`

- [ ] **Step 1: 写失败测试**

```ts
// src/lib/data.test.ts
import { test } from "node:test";
import assert from "node:assert/strict";
import { loadWritings, findWriting } from "./data";

test("loadWritings returns empty array from placeholder", () => {
  const writings = loadWritings();
  assert.ok(Array.isArray(writings));
});

test("findWriting returns undefined for non-existent slug", () => {
  assert.equal(findWriting("non-existent"), undefined);
});
```

- [ ] **Step 2: 运行测试确认失败**

Run: `node --test --experimental-strip-types src/lib/data.test.ts`
Expected: FAIL with "Cannot find module './data'"

- [ ] **Step 3: 实现 data.ts**

```ts
// src/lib/data.ts
import writingsData from "@/data/writings.json";
import worksData from "@/data/works.json";
import videosData from "@/data/videos.json";
import coursesData from "@/data/courses.json";
import aboutData from "@/data/about.json";
import {
  WritingSchema,
  WorkSchema,
  VideoSchema,
  CourseSchema,
  AboutSchema,
  type Writing,
  type Work,
  type Video,
  type Course,
  type About,
} from "@/schemas/content";

const writingsArr: Writing[] = WritingSchema.array().parse(writingsData.writings);
const worksArr: Work[] = WorkSchema.array().parse(worksData.works);
const videosArr: Video[] = VideoSchema.array().parse(videosData.videos);
const coursesArr: Course[] = CourseSchema.array().parse(coursesData.courses);
const aboutObj: About = AboutSchema.parse(aboutData);

const byDateDesc = (a: { publishedAt?: string; date?: string }, b: { publishedAt?: string; date?: string }) => {
  const av = a.publishedAt ?? a.date ?? "";
  const bv = b.publishedAt ?? b.date ?? "";
  return bv.localeCompare(av);
};

const byOrderAsc = (a: { order: number }, b: { order: number }) => a.order - b.order;

export const loadWritings = (): Writing[] =>
  writingsArr.filter((w) => w.status === "published").slice().sort(byDateDesc);

export const loadWorks = (): Work[] =>
  worksArr.filter((w) => w.status === "active").slice().sort(byOrderAsc);

export const loadVideos = (): Video[] =>
  videosArr.filter((v) => v.status === "published").slice().sort(byDateDesc);

export const loadCourses = (): Course[] =>
  coursesArr.filter((c) => c.status === "published").slice().sort(byOrderAsc);

export const loadAbout = (): About => aboutObj;

export const findWriting = (slug: string): Writing | undefined =>
  writingsArr.find((w) => w.slug === slug);

export const findWork = (slug: string): Work | undefined =>
  worksArr.find((w) => w.slug === slug);

export const findVideo = (slug: string): Video | undefined =>
  videosArr.find((v) => v.slug === slug);

export const findCourse = (slug: string): Course | undefined =>
  coursesArr.find((c) => c.slug === slug);

export const neighbours = <T extends { slug: string }>(collection: T[], slug: string) => {
  const i = collection.findIndex((e) => e.slug === slug);
  return {
    prev: i > 0 ? collection[i - 1] : undefined,
    next: i >= 0 && i < collection.length - 1 ? collection[i + 1] : undefined,
  };
};
```

- [ ] **Step 4: 运行测试确认通过**

Run: `node --test --experimental-strip-types src/lib/data.test.ts`
Expected: PASS (2 tests)

- [ ] **Step 5: Commit**

```bash
git add src/lib/data.ts src/lib/data.test.ts
git commit -m "feat(data): add data loader with zod validation"
```

---

## Task 4: 创建 sync-feishu.mjs — token 缓存 + listRecords

**Files:**
- Create: `scripts/sync-feishu.mjs`（第一部分）

- [ ] **Step 1: 写入脚本骨架（token + listRecords）**

```js
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
```

- [ ] **Step 2: 语法检查**

Run: `node --check scripts/sync-feishu.mjs`
Expected: 无输出（语法正确）

- [ ] **Step 3: Commit**

```bash
git add scripts/sync-feishu.mjs
git commit -m "feat(sync): add sync-feishu token cache + listRecords"
```

---

## Task 5: sync-feishu normalize 函数 + 测试

**Files:**
- Modify: `scripts/sync-feishu.mjs`（追加 normalize 函数）
- Create: `scripts/sync-feishu.test.mjs`

- [ ] **Step 1: 写失败测试**

```js
// scripts/sync-feishu.test.mjs
import { test } from "node:test";
import assert from "node:assert/strict";
import {
  pickLocalized,
  attachmentMeta,
  normalizeWriting,
  normalizeWork,
  normalizeVideo,
  normalizeCourse,
  normalizeAbout,
} from "./sync-feishu.mjs";

test("pickLocalized prefers _zh, falls back to _en", () => {
  assert.deepEqual(pickLocalized({ title_zh: "你好", title_en: "Hello" }, "title"), {
    zh: "你好",
    en: "Hello",
  });
});

test("pickLocalized returns empty zh when both missing", () => {
  assert.deepEqual(pickLocalized({}, "title"), { zh: "" });
});

test("attachmentMeta extracts first file token", () => {
  const att = [{ file_token: "abc", name: "x.jpg", tmp_url: "https://x" }];
  assert.deepEqual(attachmentMeta(att), { name: "x.jpg", url: "https://x" });
});

test("attachmentMeta returns undefined for empty", () => {
  assert.equal(attachmentMeta(undefined), undefined);
  assert.equal(attachmentMeta([]), undefined);
});

test("normalizeWriting merges _zh/_en", () => {
  const record = {
    fields: {
      slug: "sold-my-saas",
      title_zh: "为什么我把 SaaS 卖了",
      title_en: "",
      body_zh: "正文",
      body_en: "",
      excerpt_zh: "摘要",
      date: "2025-04-15",
      status: "published",
      featured: true,
    },
  };
  const result = normalizeWriting(record);
  assert.equal(result.slug, "sold-my-saas");
  assert.equal(result.title, "为什么我把 SaaS 卖了");
  assert.equal(result.bodyMarkdown, "正文");
  assert.equal(result.status, "published");
  assert.equal(result.featured, true);
});

test("normalizeWork handles stack array and link", () => {
  const record = {
    fields: {
      slug: "digital-wild-site",
      title_zh: "数字旷野 轻量主页",
      stack: ["TypeScript", "Next.js"],
      link: "https://example.com",
      status: "active",
      order: 1,
    },
  };
  const result = normalizeWork(record);
  assert.equal(result.title, "数字旷野 轻量主页");
  assert.deepEqual(result.stack, ["TypeScript", "Next.js"]);
  assert.equal(result.link, "https://example.com");
  assert.equal(result.status, "active");
  assert.equal(result.order, 1);
});

test("normalizeVideo extracts platform/duration/views/videoUrl", () => {
  const record = {
    fields: {
      slug: "1095-days",
      title_zh: "1095 天",
      platform: "B站",
      duration: "28:14",
      views: "32 万播放",
      videoUrl: "https://example.com/video",
      status: "published",
    },
  };
  const result = normalizeVideo(record);
  assert.equal(result.platform, "B站");
  assert.equal(result.duration, "28:14");
  assert.equal(result.views, "32 万播放");
  assert.equal(result.videoUrl, "https://example.com/video");
});

test("normalizeCourse handles features array and primary", () => {
  const record = {
    fields: {
      slug: "obsidian-agent",
      title_zh: "Obsidian+Agent",
      price: "¥199",
      features: ["私密社群", "持续更新"],
      primary: true,
      cta: "立即报名",
      url: "https://example.com/course",
      status: "published",
    },
  };
  const result = normalizeCourse(record);
  assert.equal(result.price, "¥199");
  assert.deepEqual(result.features, ["私密社群", "持续更新"]);
  assert.equal(result.primary, true);
  assert.equal(result.cta, "立即报名");
  assert.equal(result.url, "https://example.com/course");
});

test("normalizeAbout picks latest by updatedAt desc", () => {
  const records = [
    { fields: { key: "about", title_zh: "Old", body_zh: "old body", updatedAt: "2025-01-01" } },
    { fields: { key: "about", title_zh: "New", body_zh: "new body", updatedAt: "2026-05-01" } },
  ];
  const result = normalizeAbout(records);
  assert.equal(result.title, "New");
  assert.equal(result.bodyMarkdown, "new body");
  assert.equal(result.key, "about");
});

test("normalizeAbout tolerates single record without updatedAt", () => {
  const records = [{ fields: { key: "about", title_zh: "Only", body_zh: "body" } }];
  const result = normalizeAbout(records);
  assert.equal(result.title, "Only");
});
```

- [ ] **Step 2: 运行测试确认失败**

Run: `node --test scripts/sync-feishu.test.mjs`
Expected: FAIL（因为 normalize 函数还没导出）

- [ ] **Step 3: 实现 normalize 函数（追加到 sync-feishu.mjs）**

在 `sync-feishu.mjs` 现有内容末尾追加：

```js
// 追加到 scripts/sync-feishu.mjs
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { marked } from "marked";

marked.setOptions({ gfm: true, breaks: false });

export function pickLocalized(record, base) {
  return {
    zh: record.fields[`${base}_zh`] ?? "",
    en: record.fields[`${base}_en`] ?? undefined,
  };
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
    title: pickLocalized(record, "title").zh || slug,
    excerpt: pickLocalized(record, "excerpt").zh || undefined,
    date: f.date ? String(f.date) : undefined,
    publishedAt: f.publishedAt ? String(f.publishedAt) : undefined,
    tag: f.tag,
    tags: f.tags ?? [],
    readTime: f.readTime,
    cover: cover ? `/uploads/writings/${slug}/${cover.name}` : undefined,
    bodyMarkdown: pickLocalized(record, "body").zh || "",
    bodyHtml: renderMarkdown(pickLocalized(record, "body").zh || ""),
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
    title: pickLocalized(record, "title").zh || slug,
    excerpt: pickLocalized(record, "excerpt").zh || undefined,
    date: f.date ? String(f.date) : undefined,
    publishedAt: f.publishedAt ? String(f.publishedAt) : undefined,
    tag: f.tag,
    status: f.status === "active" ? "active" : "archived",
    cover: cover ? `/uploads/works/${slug}/${cover.name}` : undefined,
    stack: f.stack ?? [],
    link: f.link,
    bodyMarkdown: pickLocalized(record, "body").zh || "",
    bodyHtml: renderMarkdown(pickLocalized(record, "body").zh || ""),
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
    title: pickLocalized(record, "title").zh || slug,
    excerpt: pickLocalized(record, "excerpt").zh || undefined,
    date: f.date ? String(f.date) : undefined,
    publishedAt: f.publishedAt ? String(f.publishedAt) : undefined,
    tag: f.tag,
    status: f.status === "published" ? "published" : "draft",
    cover: cover ? `/uploads/videos/${slug}/${cover.name}` : undefined,
    platform: f.platform,
    duration: f.duration,
    views: f.views,
    videoUrl: f.videoUrl,
    bodyMarkdown: pickLocalized(record, "body").zh || "",
    bodyHtml: renderMarkdown(pickLocalized(record, "body").zh || ""),
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
    title: pickLocalized(record, "title").zh || slug,
    excerpt: pickLocalized(record, "excerpt").zh || undefined,
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
    bodyMarkdown: pickLocalized(record, "body").zh || "",
    bodyHtml: renderMarkdown(pickLocalized(record, "body").zh || ""),
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
    title: pickLocalized(sorted[0], "title").zh || "关于",
    excerpt: pickLocalized(sorted[0], "excerpt").zh || undefined,
    cover: cover ? `/uploads/about/avatar/${cover.name}` : undefined,
    bodyMarkdown: pickLocalized(sorted[0], "body").zh || "",
    bodyHtml: renderMarkdown(pickLocalized(sorted[0], "body").zh || ""),
  };
}
```

- [ ] **Step 4: 安装 marked 依赖**

Run: `npm install marked`
Expected: marked 添加到 package.json dependencies

- [ ] **Step 5: 运行测试确认通过**

Run: `node --test scripts/sync-feishu.test.mjs`
Expected: PASS（10 tests）

- [ ] **Step 6: Commit**

```bash
git add scripts/sync-feishu.mjs scripts/sync-feishu.test.mjs package.json package-lock.json
git commit -m "feat(sync): add normalize functions with tests"
```

---

## Task 6: sync-feishu 附件下载 + JSON 写盘

**Files:**
- Modify: `scripts/sync-feishu.mjs`（追加 download/write/main）
- Create: `scripts/sync-feishu-io.test.mjs`

- [ ] **Step 1: 写失败测试（writeIfChanged）**

```js
// scripts/sync-feishu-io.test.mjs
import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import { writeIfChanged, hash } from "./sync-feishu.mjs";

test("writeIfChanged writes new file when missing", () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "sync-"));
  const file = path.join(dir, "x.json");
  writeIfChanged(file, { a: 1 });
  assert.ok(fs.existsSync(file));
  assert.equal(fs.readFileSync(file, "utf-8"), JSON.stringify({ a: 1 }, null, 2) + "\n");
});

test("writeIfChanged skips write when content unchanged", () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "sync-"));
  const file = path.join(dir, "x.json");
  writeIfChanged(file, { a: 1 });
  const mtime1 = fs.statSync(file).mtimeMs;
  // Wait briefly to ensure mtime would differ
  setTimeout(() => {}, 50);
  writeIfChanged(file, { a: 1 });
  const mtime2 = fs.statSync(file).mtimeMs;
  assert.equal(mtime1, mtime2);
});

test("hash returns sha256 hex", () => {
  const h = hash("hello");
  assert.equal(h.length, 64);
  assert.equal(h, "2cf24dba5fb0a30e26e83b2ac5b9e29e1b161e5c1fa7425e73043362938b9824");
});
```

- [ ] **Step 2: 运行测试确认失败**

Run: `node --test scripts/sync-feishu-io.test.mjs`
Expected: FAIL（hash 和 writeIfChanged 未导出）

- [ ] **Step 3: 实现 IO 模块（追加到 sync-feishu.mjs）**

```js
// 追加到 scripts/sync-feishu.mjs
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
  const attachmentField = { articles: "cover", works: "cover", videos: "cover", courses: "cover" }[kind];
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
```

- [ ] **Step 4: 写 main() 函数（追加到 sync-feishu.mjs）**

```js
// 追加到 scripts/sync-feishu.mjs
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

// 只在作为主模块运行时执行
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch((err) => {
    console.error(err);
    process.exit(1);
  });
}
```

- [ ] **Step 5: 运行测试**

Run: `node --test scripts/sync-feishu-io.test.mjs`
Expected: PASS（3 tests）

- [ ] **Step 6: 语法检查**

Run: `node --check scripts/sync-feishu.mjs`
Expected: 无输出

- [ ] **Step 7: Commit**

```bash
git add scripts/sync-feishu.mjs scripts/sync-feishu-io.test.mjs
git commit -m "feat(sync): add attachment download, json write, main runner"
```

---

## Task 7: package.json 加 sync 脚本

**Files:**
- Modify: `package.json`

- [ ] **Step 1: 在 scripts 中加 prebuild + sync:feishu**

```json
{
  "scripts": {
    "dev": "vite dev",
    "build": "vite build",
    "build:dev": "vite build --mode development",
    "preview": "vite preview",
    "lint": "eslint .",
    "format": "prettier --write .",
    "sync:feishu": "node scripts/sync-feishu.mjs",
    "prebuild": "node scripts/sync-feishu.mjs",
    "test:sync": "node --test scripts/sync-feishu.test.mjs scripts/sync-feishu-io.test.mjs",
    "fetch-rss": "node scripts/fetch-rss.mjs"
  }
}
```

- [ ] **Step 2: 验证 JSON 合法**

Run: `node -e "JSON.parse(require('fs').readFileSync('package.json'))"`
Expected: 无输出

- [ ] **Step 3: Commit**

```bash
git add package.json
git commit -m "chore(scripts): add prebuild + sync:feishu + test:sync"
```

---

## Task 8: 运行 sync 填充 data/*.json

**Files:**
- Modify: `data/*.json`（由 sync 写入）

- [ ] **Step 1: 设置环境变量并跑 sync**

Run:
```bash
FEISHU_APP_ID=<your_app_id> \
FEISHU_APP_SECRET=<your_app_secret> \
FEISHU_APP_TOKEN=IjLnbCNkIaaJvjsEbAjc8XiEnYb \
FEISHU_TABLE_IDS=tblhAtZrGqOp1WJe,tblohFvGJWDtx6wV,tblCAvJrw9yvN3qY,tblrdoCjWQZSquL7,tblJHfKpqS5dAGB8 \
FEISHU_TABLE_KINDS=writings,works,videos,courses,abouts \
npm run sync:feishu
```
Expected: 看到 "created: data/writings.json" 等 5 行；附件下载成功日志

- [ ] **Step 2: 验证 data/*.json 内容**

Run: `node -e "const w=require('./data/writings.json'); console.log('writings:', w.writings.length)"`
Expected: `writings: 8`

- [ ] **Step 3: 验证附件下载**

Run: `ls public/uploads/works/digital-wild-customer-service/`
Expected: 看到 znkf_Admin.jpg

- [ ] **Step 4: Commit**

```bash
git add data/ public/uploads/
git commit -m "chore(data): initial sync from feishu (19 records + 6 covers)"
```

---

## Task 9: 迁移 src/components/Writing.tsx

**Files:**
- Modify: `src/components/Writing.tsx:1-15`

- [ ] **Step 1: 替换 import**

找到文件顶部 import 部分：

旧：
```ts
import { writingEntries } from "@/lib/content";
```

新：
```ts
import { loadWritings } from "@/lib/data";
```

- [ ] **Step 2: 替换 entries 引用**

旧（文件中某处）：
```ts
const items = limit ? writingEntries.slice(0, limit) : writingEntries;
```

新：
```ts
const items = limit ? loadWritings().slice(0, limit) : loadWritings();
```

- [ ] **Step 3: 替换 post.meta.* → post.* 字段访问**

在 `items.map((post) => (...))` 内把：
- `post.meta.slug` → `post.slug`
- `post.meta.title` → `post.title`
- `post.meta.date` → `post.date`
- `post.meta.excerpt` → `post.excerpt`
- `post.meta.tag` → `post.tag`
- `post.meta.readTime` → `post.readTime`

- [ ] **Step 4: 编译检查**

Run: `npx tsc --noEmit`
Expected: 无错误

- [ ] **Step 5: Commit**

```bash
git add src/components/Writing.tsx
git commit -m "refactor(Writing): switch to feishu data layer"
```

---

## Task 10: 迁移 src/components/Work.tsx

**Files:**
- Modify: `src/components/Work.tsx`

- [ ] **Step 1: 替换 import**

旧：`import { workEntries } from "@/lib/content";`
新：`import { loadWorks } from "@/lib/data";`

- [ ] **Step 2: 替换 entries + 字段访问**

`workEntries` → `loadWorks()`；`item.meta.*` → `item.*`

- [ ] **Step 3: 编译检查 + Commit**

```bash
npx tsc --noEmit
git add src/components/Work.tsx
git commit -m "refactor(Work): switch to feishu data layer"
```

---

## Task 11: 迁移 src/components/Videos.tsx

**Files:**
- Modify: `src/components/Videos.tsx`

- [ ] **Step 1: 替换 import + 引用**

`videosEntries` → `loadVideos()`；`item.meta.*` → `item.*`

- [ ] **Step 2: 编译检查 + Commit**

```bash
npx tsc --noEmit
git add src/components/Videos.tsx
git commit -m "refactor(Videos): switch to feishu data layer"
```

---

## Task 12: 迁移 src/components/Courses.tsx

**Files:**
- Modify: `src/components/Courses.tsx`

- [ ] **Step 1: 替换 import + 引用**

`coursesEntries` → `loadCourses()`；`item.meta.*` → `item.*`

- [ ] **Step 2: 编译检查 + Commit**

```bash
npx tsc --noEmit
git add src/components/Courses.tsx
git commit -m "refactor(Courses): switch to feishu data layer"
```

---

## Task 13: 迁移 src/routes/writing.$slug.tsx

**Files:**
- Modify: `src/routes/writing.$slug.tsx`

- [ ] **Step 1: 替换 import + 引用**

旧：
```ts
import { writingEntries, findEntry, neighbours } from "@/lib/content";
const entry = findEntry(writingEntries, slug);
```

新：
```ts
import { loadWritings, findWriting, neighbours } from "@/lib/data";
const entry = findWriting(slug);
const collection = loadWritings();
```

- [ ] **Step 2: 字段访问 `entry.meta.*` → `entry.*`**

- [ ] **Step 3: neighbours 调用用 collection 而非 slice**

```ts
const { prev, next } = neighbours(collection, slug);
```

- [ ] **Step 4: 编译检查 + Commit**

```bash
npx tsc --noEmit
git add src/routes/writing.$slug.tsx
git commit -m "refactor(route): switch writing detail to feishu data layer"
```

---

## Task 14: 迁移 src/routes/work.$slug.tsx

**Files:**
- Modify: `src/routes/work.$slug.tsx`

- [ ] **Step 1: 同 Task 13 模式迁移**

`workEntries` → `loadWorks()` + `findWork(slug)`；`entry.meta.*` → `entry.*`

- [ ] **Step 2: 编译检查 + Commit**

```bash
npx tsc --noEmit
git add src/routes/work.$slug.tsx
git commit -m "refactor(route): switch work detail to feishu data layer"
```

---

## Task 15: 迁移 src/routes/videos.$slug.tsx

**Files:**
- Modify: `src/routes/videos.$slug.tsx`

- [ ] **Step 1: 同 Task 13 模式迁移**

`videosEntries` → `loadVideos()` + `findVideo(slug)`

- [ ] **Step 2: 编译检查 + Commit**

```bash
npx tsc --noEmit
git add src/routes/videos.$slug.tsx
git commit -m "refactor(route): switch videos detail to feishu data layer"
```

---

## Task 16: 迁移 src/routes/about.tsx

**Files:**
- Modify: `src/routes/about.tsx`

- [ ] **Step 1: 替换 import + 引用**

旧：`import { aboutEntries } from "@/lib/content";`
新：`import { loadAbout } from "@/lib/data";`

`aboutEntries[0]` → `loadAbout()`

- [ ] **Step 2: 字段访问 `entry.meta.*` → `entry.*`**

- [ ] **Step 3: 编译检查 + Commit**

```bash
npx tsc --noEmit
git add src/routes/about.tsx
git commit -m "refactor(route): switch about page to feishu data layer"
```

---

## Task 17: 删除旧 content.ts + 旧 .md 文件

**Files:**
- Delete: `src/lib/content.ts`
- Delete: `src/content/writing/*.md`（8 个）
- Delete: `src/content/work/*.md`（3 个）
- Delete: `src/content/videos/*.md`（3 个）
- Delete: `src/content/courses/*.md`（4 个）
- Delete: `src/content/about/about.md`

- [ ] **Step 1: 删除文件**

Run:
```bash
rm src/lib/content.ts
rm src/content/writing/*.md
rm src/content/work/*.md
rm src/content/videos/*.md
rm src/content/courses/*.md
rm src/content/about/about.md
```

- [ ] **Step 2: 验证 news 保留**

Run: `ls src/content/news/`
Expected: `rss-data.json`

- [ ] **Step 3: 完整构建**

Run: `npm run build`
Expected: 看到 dist/ 生成，无 TS/zod 错误

- [ ] **Step 4: Commit**

```bash
git add -u
git commit -m "refactor: remove legacy md parser + content/*.md (now sourced from feishu)"
```

---

## Task 18: 添加 GitHub Actions sync workflow

**Files:**
- Create: `.github/workflows/sync-feishu.yml`

- [ ] **Step 1: 写入 workflow 文件**

```yaml
# .github/workflows/sync-feishu.yml
name: sync-feishu
on:
  schedule:
    - cron: "*/30 * * * *"
  workflow_dispatch:
jobs:
  sync:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: "24"
      - run: node scripts/sync-feishu.mjs
        env:
          FEISHU_APP_ID: ${{ secrets.FEISHU_APP_ID }}
          FEISHU_APP_SECRET: ${{ secrets.FEISHU_APP_SECRET }}
          FEISHU_APP_TOKEN: ${{ secrets.FEISHU_APP_TOKEN }}
          FEISHU_TABLE_IDS: ${{ secrets.FEISHU_TABLE_IDS }}
          FEISHU_TABLE_KINDS: ${{ secrets.FEISHU_TABLE_KINDS }}
      - uses: stefanzweifel/git-auto-commit-action@v5
        with:
          commit_message: "chore: sync from feishu bitable"
          file_pattern: "data/*.json public/uploads/**/*"
```

- [ ] **Step 2: YAML 校验**

Run: `node -e "require('fs').readFileSync('.github/workflows/sync-feishu.yml')"`
Expected: 无输出

- [ ] **Step 3: Commit**

```bash
git add .github/workflows/sync-feishu.yml
git commit -m "ci: add sync-feishu workflow (30min cron + manual)"
```

---

## Task 19: README 文档 GH Secrets 配置

**Files:**
- Modify: `README.md`

- [ ] **Step 1: 在 README 添加 secrets 章节**

在 README 现有 RSS 章节后追加：

```markdown
---

## 📬 飞书 Bitable 内容同步 (sync-feishu)

本项目使用飞书多维表格管理 writings / works / videos / courses / abouts 五类内容。Vite prebuild 自动跑 `scripts/sync-feishu.mjs` 从飞书拉数据，GitHub Actions 每 30 分钟 cron 同步。

### 本地预览

```bash
FEISHU_APP_ID=<your_app_id> \
FEISHU_APP_SECRET=<your_app_secret> \
FEISHU_APP_TOKEN=IjLnbCNkIaaJvjsEbAjc8XiEnYb \
FEISHU_TABLE_IDS=tblhAtZrGqOp1WJe,tblohFvGJWDtx6wV,tblCAvJrw9yvN3qY,tblrdoCjWQZSquL7,tblJHfKpqS5dAGB8 \
FEISHU_TABLE_KINDS=writings,works,videos,courses,abouts \
npm run sync:feishu

npm run dev
```

### 必需的 GitHub Secrets

在仓库 Settings → Secrets → Actions 添加：

| Secret | 来源 |
|---|---|
| `FEISHU_APP_ID` | 飞书开放平台 → 应用 → 凭证 |
| `FEISHU_APP_SECRET` | 同上 |
| `FEISHU_APP_TOKEN` | Base URL: `IjLnbCNkIaaJvjsEbAjc8XiEnYb` |
| `FEISHU_TABLE_IDS` | 5 张表 id，逗号分隔 |
| `FEISHU_TABLE_KINDS` | `writings,works,videos,courses,abouts` |

### 手动触发同步

GitHub → Actions → sync-feishu → Run workflow。
```

- [ ] **Step 2: Commit**

```bash
git add README.md
git commit -m "docs: document feishu sync workflow and required secrets"
```

---

## Task 20: 端到端验证

**Files:** 无修改

- [ ] **Step 1: 完整 build**

Run: `npm run build`
Expected: 看到 `dist/` 生成 + 无错误

- [ ] **Step 2: 启动 preview 服务器**

Run: `npm run preview -- --port 4173` (background)
访问 `http://localhost:4173/` 验证首页 4 类内容卡片都渲染

- [ ] **Step 3: 验证详情页**

依次访问：
- `/writing/sold-my-saas` - 文章正文 + excerpt
- `/work/finance-crm` - work 详情含 stack / cover
- `/about` - about 全文

- [ ] **Step 4: 验证附件 URL**

检查 dev server 输出中 `/uploads/...` 路径返回 200

- [ ] **Step 5: Type 检查**

Run: `npx tsc --noEmit`
Expected: 无错误

- [ ] **Step 6: 测试**

Run: `npm run test:sync`
Expected: 13 tests PASS

- [ ] **Step 7: 标记完成**

```bash
git tag v1.0.0-feishu-migration
```

---

## Self-Review Checklist（执行后核对）

- [ ] `src/lib/data.ts` 5 个 zod schema 通过 node --test
- [ ] `scripts/sync-feishu.mjs` 10 个 normalize 测试 + 3 个 IO 测试通过
- [ ] `data/*.json` 由 sync 实际写入（不是占位）
- [ ] `public/uploads/{writings,works,videos,courses}/` 含真实附件
- [ ] 所有 8 个组件/路由文件不再 import `src/lib/content`
- [ ] `src/lib/content.ts` 已删除
- [ ] `src/content/{writing,work,videos,courses}/*.md` 已删除
- [ ] `src/content/about/about.md` 已删除
- [ ] `src/content/news/rss-data.json` 保留
- [ ] `npm run build` 跑通
- [ ] GH workflow 文件存在
- [ ] README 有 secrets 章节

---

## 回滚指引

任何中间任务失败：

```bash
git log --oneline    # 找到最近的稳定 commit
git reset --hard <stable-sha>
npm install
```

整个迁移：

```bash
git revert <migration-root-commit>..HEAD
```

飞书数据丢失无法回滚（飞书是 source of truth）。建议在迁移完成后：

1. 飞书 Base 启用「变更历史」自动备份
2. 定期 export 5 张表为 CSV 备份