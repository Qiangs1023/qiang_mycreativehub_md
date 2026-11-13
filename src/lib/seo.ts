// src/lib/seo.ts
// 全站 SEO 元信息与结构化数据的唯一出口。
//
// 设计约束（踩过的坑，别改）：
// 1. TanStack 的 head 里 meta 会「父级 + 子级」叠加执行，**同名 key 子级覆盖父级**，
//    但父级独有的 key（og:url / og:image / twitter:*）会**原样漏到子页**。
//    所以 list 路由（writing/work/videos/courses）必须在「非索引页」时返回空 meta，
//    详情页自己给全套 —— 见各 route 的 head 实现。
// 2. links（canonical）**不会**像 meta 那样去重，父路由的 canonical 会和子级同时进 <head>，
//    搜索引擎取第一个 → 所有详情页的 canonical 会指向列表页。所以父路由非索引页必须 links: []。
// 3. jsonLd 走 meta 的 "script:ld+json" 一等公民写法，交给 headContentUtils 渲染。
// 4. 结构化数据节点一律**不带 @context**，由 ldGraph / ldOne 在外层统一包。
//    否则把带 @context 的对象塞进 @graph 里是非法 JSON-LD。

import type { Course, Video, Work, Writing } from "@/schemas/content";

const env = (import.meta as { env?: Record<string, string | undefined> }).env ?? {};

/** 生产域名。Cloudflare Pages / GitHub Pages 部署时可用 VITE_SITE_URL 覆盖。 */
export const SITE_URL = (env.VITE_SITE_URL || "https://digiwild.cc").replace(/\/+$/, "");
export const SITE_NAME = "数字旷野";
export const SITE_LOCALE = "zh_CN";
export const SITE_LANG = "zh-CN";
export const DEFAULT_OG_IMAGE = "/og/default.png";

/** 自有社交账号；没配就不输出 twitter:site / twitter:creator（缺失好过编一个假账号）。 */
const TWITTER_HANDLE = (env.VITE_TWITTER_HANDLE || "").trim();

const PERSON_ID = `${SITE_URL}/#person`;
const WEBSITE_ID = `${SITE_URL}/#website`;

/**
 * 把路径里的非法 URL 字符（空格等）编码掉。
 *
 * 为什么需要：文件名带空格时（如 `image 20260510111054.jpg`），原样拼进
 * og:image / twitter:image / JSON-LD image 就是一个**非法 URL**——
 * 微信、推特、飞书的抓取器会在空格处截断，拉不到图，分享卡片直接裂。
 * （`<img src>` 那条路走 resolveCover，已经处理过；og 这条路是独立出口。）
 *
 * 注意不能直接用 encodeURI 整条丢进去：encodeURI 会把 `%` 编成 `%25`，
 * 已有的 `%20` 会被二次编码成 `%2520`。所以先按 `%XX` 切段，合法转义原样保留。
 */
function encodeUrlPath(path: string): string {
  return path
    .split(/(%[0-9A-Fa-f]{2})/g)
    .map((seg) => (/^%[0-9A-Fa-f]{2}$/.test(seg) ? seg : encodeURI(seg)))
    .join("");
}

export function absoluteUrl(path?: string): string {
  if (!path) return `${SITE_URL}/`;
  if (/^https?:\/\//i.test(path)) return path;
  return `${SITE_URL}${path.startsWith("/") ? "" : "/"}${encodeUrlPath(path)}`;
}

/** description 控制在 60–150 字符：超长按句读截断，不切在词中间（中文按标点断）。 */
export function clampDescription(text: string | undefined | null, max = 150): string {
  const t = (text || "").replace(/\s+/g, " ").trim();
  if (!t) return "";
  if (t.length <= max) return t;
  const cut = t.slice(0, max);
  const stop = Math.max(
    cut.lastIndexOf("。"),
    cut.lastIndexOf("，"),
    cut.lastIndexOf("、"),
    cut.lastIndexOf("；"),
    cut.lastIndexOf(" "),
  );
  return (stop > max * 0.6 ? cut.slice(0, stop) : cut).trimEnd() + "…";
}

/** "¥1,288" → "1288"；无法解析返回 undefined（不编造价格）。 */
export function parsePrice(price?: string): string | undefined {
  if (!price) return undefined;
  const digits = price.replace(/[^\d.]/g, "");
  return digits || undefined;
}

/** "28:14" → "PT28M14S"；"1:02:03" → "PT1H2M3S"。 */
export function toIsoDuration(duration?: string): string | undefined {
  if (!duration) return undefined;
  const m = duration.trim().match(/^(?:(\d+):)?(\d{1,2}):(\d{2})$/);
  if (!m) return undefined;
  const h = Number(m[1] || 0);
  const min = Number(m[2]);
  const sec = Number(m[3]);
  if (!h && !min && !sec) return undefined;
  return `PT${h ? `${h}H` : ""}${min ? `${min}M` : ""}${sec ? `${sec}S` : ""}`;
}

/** 占位 URL（如 bilibili.com/video/example）不是真实地址，不能进 JSON-LD 也不能给用户点。 */
export function isPlaceholderUrl(url?: string | null): boolean {
  if (!url) return true;
  return /(^|\/)(example|placeholder|replace_me|replace-me)(\/|$|\?)/i.test(url);
}

/**
 * 判断当前匹配是否停在某个 section 的**索引路由**上。
 *
 * 必须用 routeId 而不是 pathname 比较：/courses 与 /courses/pay 的 pathname 有前缀关系，
 * 只有 routeId 能区分「列表页」和「详情页 / 子页面」。
 */
export function isIndexMatch(
  matches: Array<{ routeId?: string }> | undefined,
  routeId: string,
): boolean {
  const deepest = matches?.[matches.length - 1];
  if (!deepest?.routeId) return false;
  return deepest.routeId === routeId;
}

/**
 * description 至少要能独立成立：摘要太短时补上内容类型与作者，
 * 让搜索引擎拿到完整语义，而不是一句 13 字的反问。
 */
export function ensureDescription(
  text: string | undefined | null,
  fallback: string,
  min = 40,
): string {
  const t = (text || "").trim();
  if (t.length >= min) return t;
  if (!t) return fallback;
  return `${t.replace(/[。.!！?？]+$/, "")} —— ${fallback}`;
}

export type PageSeoOptions = {
  /** 路由路径，用作 canonical，例如 "/writing/xxx" */
  path: string;
  /** 完整 <title> 文本，含品牌后缀 */
  title: string;
  description: string;
  /** og:image，相对路径或绝对 URL */
  image?: string;
  type?: "website" | "article" | "video.other";
  jsonLd?: unknown;
  publishedTime?: string;
  modifiedTime?: string;
  keywords?: string[];
  noIndex?: boolean;
};

/**
 * 生成一套**完整**的 meta + links。
 * 只要用了这个函数，就不要再在同一个 head 里手写 og/twitter/canonical —— 必须是全量覆盖，
 * 否则父级的 key 会漏下来。
 */
export function pageSeo(opts: PageSeoOptions) {
  const canonical = absoluteUrl(opts.path);
  const description = clampDescription(opts.description);
  const image = absoluteUrl(opts.image || DEFAULT_OG_IMAGE);

  const meta: Array<Record<string, string>> = [
    { title: opts.title },
    { name: "description", content: description },
    { name: "author", content: SITE_NAME },
    { property: "og:type", content: opts.type ?? "website" },
    { property: "og:title", content: opts.title },
    { property: "og:description", content: description },
    { property: "og:url", content: canonical },
    { property: "og:image", content: image },
    { property: "og:image:alt", content: opts.title },
    { property: "og:locale", content: SITE_LOCALE },
    { property: "og:site_name", content: SITE_NAME },
    { name: "twitter:card", content: "summary_large_image" },
    { name: "twitter:title", content: opts.title },
    { name: "twitter:description", content: description },
    { name: "twitter:image", content: image },
  ];

  if (TWITTER_HANDLE) {
    meta.push({ name: "twitter:site", content: TWITTER_HANDLE });
    meta.push({ name: "twitter:creator", content: TWITTER_HANDLE });
  }
  if (opts.publishedTime) {
    meta.push({ property: "article:published_time", content: opts.publishedTime });
  }
  if (opts.modifiedTime) {
    meta.push({ property: "article:modified_time", content: opts.modifiedTime });
  }
  if (opts.keywords?.length) {
    meta.push({ name: "keywords", content: opts.keywords.join(",") });
  }
  if (opts.noIndex) {
    meta.push({ name: "robots", content: "noindex, nofollow" });
  }
  if (opts.jsonLd) {
    meta.push({ "script:ld+json": opts.jsonLd } as unknown as Record<string, string>);
  }

  // 只放 canonical：favicon / RSS 这类全站级 link 统一由 __root 的 head 输出，
  // 避免同一个 rel 在 <head> 里出现两次（links 不会像 meta 那样去重）。
  const links = [{ rel: "canonical", href: canonical }];

  return { meta, links };
}

/* ------------------------------------------------------------------ *
 * 结构化数据
 * ------------------------------------------------------------------ */

/** 把若干节点包成一个 @graph 文档。 */
export function ldGraph(items: unknown[]) {
  return { "@context": "https://schema.org", "@graph": items };
}

/** 把单个节点包成独立文档。 */
export function ldOne(item: Record<string, unknown>) {
  return { "@context": "https://schema.org", ...item };
}

/** 首页：Person + WebSite（author/publisher 用 @id 互指）。 */
export function personAndSiteLd() {
  return ldGraph([
    {
      "@type": "Person",
      "@id": PERSON_ID,
      "name": SITE_NAME,
      "url": `${SITE_URL}/`,
      "jobTitle": "独立开发者、内容创作者",
      "description":
        "AI coding 重度用户，记录独立开发、AI 工作流与内容创作的真实实践。",
      "knowsAbout": ["独立开发", "AI 工作流", "Obsidian", "SaaS", "跨境贸易"],
    },
    {
      "@type": "WebSite",
      "@id": WEBSITE_ID,
      "url": `${SITE_URL}/`,
      "name": SITE_NAME,
      "description": "独立开发者的 AI 实操档案：产品、文章、视频与课程。",
      "inLanguage": SITE_LANG,
      "publisher": { "@id": PERSON_ID },
    },
  ]);
}

export function articleLd(entry: Writing, path: string, image?: string) {
  const url = absoluteUrl(path);
  return {
    "@type": "Article",
    "headline": entry.title,
    "description": entry.excerpt ?? "",
    "datePublished": entry.publishedAt ?? entry.date,
    "dateModified": entry.publishedAt ?? entry.date,
    "inLanguage": SITE_LANG,
    "author": { "@id": PERSON_ID },
    "publisher": { "@id": PERSON_ID },
    "mainEntityOfPage": { "@type": "WebPage", "@id": url },
    url,
    "image": [absoluteUrl(image || DEFAULT_OG_IMAGE)],
  };
}

export function courseLd(entry: Course, path: string, image?: string) {
  const url = absoluteUrl(path);
  const price = parsePrice(entry.price);
  const ld: Record<string, unknown> = {
    "@type": "Course",
    "name": entry.title,
    "description": entry.excerpt ?? "",
    "provider": { "@id": PERSON_ID },
    "inLanguage": SITE_LANG,
    url,
    "image": [absoluteUrl(image || DEFAULT_OG_IMAGE)],
  };
  if (price) {
    ld.offers = {
      "@type": "Offer",
      price,
      priceCurrency: "CNY",
      availability: "https://schema.org/InStock",
      url,
    };
  }
  return ld;
}

export function workLd(entry: Work, path: string, image?: string) {
  return {
    "@type": "SoftwareApplication",
    "name": entry.title,
    "applicationCategory": "BusinessApplication",
    "operatingSystem": "Web",
    "description": entry.excerpt ?? "",
    "url": absoluteUrl(path),
    "image": [absoluteUrl(image || DEFAULT_OG_IMAGE)],
    "author": { "@id": PERSON_ID },
  };
}

export function videoLd(entry: Video, path: string, image?: string) {
  const url = absoluteUrl(path);
  const ld: Record<string, unknown> = {
    "@type": "VideoObject",
    "name": entry.title,
    "description": entry.excerpt ?? "",
    "thumbnailUrl": [absoluteUrl(image || DEFAULT_OG_IMAGE)],
    "uploadDate": entry.publishedAt ?? entry.date,
    "inLanguage": SITE_LANG,
    url,
  };
  const duration = toIsoDuration(entry.duration);
  if (duration) ld.duration = duration;
  // 占位链接（bilibili.com/video/example）不是真实地址，不进结构化数据。
  if (entry.videoUrl && !isPlaceholderUrl(entry.videoUrl)) {
    ld.embedUrl = entry.videoUrl;
    ld.contentUrl = entry.videoUrl;
  }
  return ld;
}

/** 列表页：CollectionPage + ItemList */
export function collectionLd(opts: {
  name: string;
  description: string;
  path: string;
  items: Array<{ name: string; url: string }>;
}) {
  const url = absoluteUrl(opts.path);
  return ldGraph([
    {
      "@type": "CollectionPage",
      "@id": url,
      url,
      "name": opts.name,
      "description": opts.description,
      "inLanguage": SITE_LANG,
      "isPartOf": { "@id": WEBSITE_ID },
    },
    {
      "@type": "ItemList",
      "@id": `${url}#list`,
      "name": opts.name,
      url,
      "numberOfItems": opts.items.length,
      "itemListElement": opts.items.map((item, i) => ({
        "@type": "ListItem",
        position: i + 1,
        name: item.name,
        url: item.url,
      })),
    },
  ]);
}

/** 普通内页：WebPage */
export function webPageLd(opts: { name: string; description: string; path: string }) {
  const url = absoluteUrl(opts.path);
  return {
    "@type": "WebPage",
    "@id": url,
    url,
    "name": opts.name,
    "description": opts.description,
    "inLanguage": SITE_LANG,
    "isPartOf": { "@id": WEBSITE_ID },
  };
}
