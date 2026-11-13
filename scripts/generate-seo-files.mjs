#!/usr/bin/env node
// 生成 sitemap.xml / rss.xml / robots.txt / llms.txt。
//
// 全部从 data/*.json（由 sync:content 从 content/*.md 同步而来）派生，
// 所以内容一变，sitemap 和 RSS 自动跟着变，不会再出现「sitemap 只列了 7 个 URL、
// 详情页全漏掉」的情况。
//
//   node scripts/generate-seo-files.mjs
//
// SITE_URL 可用环境变量覆盖（默认生产域名）。

import fs from "node:fs";
import path from "node:path";

const ROOT = path.resolve(import.meta.dirname, "..");
const SITE_URL = (process.env.SITE_URL || "https://digiwild.cc").replace(/\/+$/, "");
const PUBLIC_DIR = path.join(ROOT, "public");

const readJson = (name) =>
  JSON.parse(fs.readFileSync(path.join(ROOT, "data", `${name}.json`), "utf8"));

const writings = readJson("writings").writings ?? [];
const works = readJson("works").works ?? [];
const videos = readJson("videos").videos ?? [];
const courses = readJson("courses").courses ?? [];

const published = (list) => list.filter((e) => e.status === "published" || e.status === "active");

/* ------------------------------------------------------------------ *
 * sitemap.xml
 * ------------------------------------------------------------------ */

const staticRoutes = [
  { path: "/", changefreq: "weekly", priority: "1.0" },
  { path: "/start-here", changefreq: "monthly", priority: "0.9" },
  { path: "/writing", changefreq: "weekly", priority: "0.8" },
  { path: "/work", changefreq: "monthly", priority: "0.8" },
  { path: "/videos", changefreq: "weekly", priority: "0.7" },
  { path: "/courses", changefreq: "weekly", priority: "0.9" },
  { path: "/news", changefreq: "weekly", priority: "0.6" },
  { path: "/about", changefreq: "monthly", priority: "0.5" },
];

const contentDate = (entry) => (entry.publishedAt ?? entry.date ?? "").slice(0, 10);

// 静态页面的 lastmod 取「站内最新内容日期」——比写死一个日期更有意义
const allDates = [...published(writings), ...published(works), ...published(videos), ...published(courses)]
  .map(contentDate)
  .filter(Boolean)
  .sort();
const latestContentDate = allDates.at(-1) ?? "2026-01-01";

const urls = [
  ...staticRoutes.map((r) => ({
    loc: `${SITE_URL}${r.path === "/" ? "/" : r.path}`,
    lastmod: latestContentDate,
    changefreq: r.changefreq,
    priority: r.priority,
  })),
  ...published(writings).map((e) => ({
    loc: `${SITE_URL}/writing/${e.slug}`,
    lastmod: contentDate(e),
    changefreq: "monthly",
    priority: "0.7",
  })),
  ...published(works).map((e) => ({
    loc: `${SITE_URL}/work/${e.slug}`,
    lastmod: contentDate(e),
    changefreq: "monthly",
    priority: "0.7",
  })),
  ...published(videos).map((e) => ({
    loc: `${SITE_URL}/videos/${e.slug}`,
    lastmod: contentDate(e),
    changefreq: "monthly",
    priority: "0.6",
  })),
  ...published(courses).map((e) => ({
    loc: `${SITE_URL}/courses/${e.slug}`,
    lastmod: contentDate(e),
    changefreq: "monthly",
    priority: "0.9",
  })),
];

const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls
  .map(
    (u) => `  <url>
    <loc>${u.loc}</loc>
    <lastmod>${u.lastmod}</lastmod>
    <changefreq>${u.changefreq}</changefreq>
    <priority>${u.priority}</priority>
  </url>`,
  )
  .join("\n")}
</urlset>
`;

/* ------------------------------------------------------------------ *
 * rss.xml
 * ------------------------------------------------------------------ */

const rssItems = published(writings)
  .slice()
  .sort((a, b) => contentDate(b).localeCompare(contentDate(a)))
  .map((e) => {
    const link = `${SITE_URL}/writing/${e.slug}`;
    const pubDate = new Date(`${contentDate(e)}T08:00:00+08:00`).toUTCString();
    return `    <item>
      <title><![CDATA[${e.title}]]></title>
      <link>${link}</link>
      <guid isPermaLink="true">${link}</guid>
      <description><![CDATA[${e.excerpt ?? ""}]]></description>
      <pubDate>${pubDate}</pubDate>
    </item>`;
  })
  .join("\n");

const rss = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>数字旷野 · 独立开发者的 AI 实操档案</title>
    <link>${SITE_URL}/</link>
    <atom:link href="${SITE_URL}/rss.xml" rel="self" type="application/rss+xml" />
    <description>独立开发、AI 工作流与真实复盘，每两周一篇。</description>
    <language>zh-CN</language>
    <lastBuildDate>${new Date(`${latestContentDate}T08:00:00+08:00`).toUTCString()}</lastBuildDate>
${rssItems}
  </channel>
</rss>
`;

/* ------------------------------------------------------------------ *
 * robots.txt
 * ------------------------------------------------------------------ */

const robots = `User-agent: *
Allow: /

# AI 引用型爬虫放行（默认 User-agent:* 已放行，这里显式声明避免后续误改）
User-agent: GPTBot
Allow: /

User-agent: ClaudeBot
Allow: /

User-agent: PerplexityBot
Allow: /

User-agent: OAI-SearchBot
Allow: /

User-agent: Google-Extended
Allow: /

Sitemap: ${SITE_URL}/sitemap.xml
`;

/* ------------------------------------------------------------------ *
 * llms.txt
 * ------------------------------------------------------------------ */

const featured = published(writings)
  .slice()
  .sort((a, b) => contentDate(b).localeCompare(contentDate(a)))
  .slice(0, 5);

const llms = `# 数字旷野 — 独立开发者的 AI 实操档案

> 一个人的 AI 工作流实操记录：产品、文章、视频与课程。面向想用 AI 把想法变成产品的开发者。

## 栏目

- [从零开始](${SITE_URL}/start-here)：新访客的路线图 —— 我是谁、你能拿到什么、从哪开始
- [写作](${SITE_URL}/writing)：独立开发与 AI 工作流的真实复盘，每两周一篇
- [作品](${SITE_URL}/work)：已上线的产品与项目，含技术栈与现状
- [视频](${SITE_URL}/videos)：深度长视频与工作日常 vlog
- [课程](${SITE_URL}/courses)：Obsidian+Agent、独立开发实战、跨境贸易社群
- [关于](${SITE_URL}/about)：我是谁，以及联系方式

## 精选文章

${featured.map((e) => `- [${e.title}](${SITE_URL}/writing/${e.slug})：${e.excerpt ?? ""}`).join("\n")}

## 事实

- 位置：中国上海
- 语言：中文
- 站内内容：${published(writings).length} 篇文章、${published(works).length} 个上线产品、${published(videos).length} 支视频、${published(courses).length} 门在售课程
- 联系：${SITE_URL}/about 页底部邮箱
- 订阅：${SITE_URL}/rss.xml
`;

/* ------------------------------------------------------------------ *
 * 落盘
 * ------------------------------------------------------------------ */

fs.mkdirSync(PUBLIC_DIR, { recursive: true });

const outputs = [
  ["sitemap.xml", sitemap],
  ["rss.xml", rss],
  ["robots.txt", robots],
  ["llms.txt", llms],
];

for (const [name, content] of outputs) {
  fs.writeFileSync(path.join(PUBLIC_DIR, name), content, "utf8");
  console.log(`✓ public/${name}  (${content.length} B)`);
}

console.log(`\nsitemap 收录 ${urls.length} 个 URL · RSS ${published(writings).length} 篇文章`);
