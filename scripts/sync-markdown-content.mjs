#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { CORE_SCHEMA, load as loadYaml } from "js-yaml";
import { marked } from "marked";

const FRONTMATTER_PATTERN = /^---\r?\n([\s\S]*?)\r?\n---(?:\r?\n|$)/;
const SLUG_PATTERN = /^[a-z0-9-]+$/;
const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
const ISO_DATE_PATTERN =
  /^\d{4}-\d{2}-\d{2}(?:T\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[+-]\d{2}:\d{2})?)?$/;

export const COLLECTION_CONFIG = {
  writings: {
    statuses: new Set(["draft", "published", "archived"]),
    output: "writings.json",
    property: "writings",
    required: ["slug", "title", "date", "status"],
    urlFields: [],
  },
  works: {
    statuses: new Set(["active", "archived"]),
    output: "works.json",
    property: "works",
    required: ["slug", "title", "date", "status"],
    urlFields: ["link"],
  },
  videos: {
    statuses: new Set(["draft", "published"]),
    output: "videos.json",
    property: "videos",
    required: ["slug", "title", "date", "status"],
    urlFields: ["videoUrl"],
  },
  courses: {
    statuses: new Set(["draft", "published"]),
    output: "courses.json",
    property: "courses",
    required: ["slug", "title", "date", "status"],
    urlFields: ["url"],
  },
  news: {
    statuses: new Set(["draft", "published"]),
    output: "news.json",
    property: "news",
    required: ["slug", "title", "date", "url", "status"],
    urlFields: ["url"],
  },
};

const ENTRY_FIELDS = {
  writings: [
    "slug",
    "title",
    "excerpt",
    "date",
    "publishedAt",
    "tag",
    "tags",
    "readTime",
    "cover",
    "bodyMarkdown",
    "bodyHtml",
    "status",
    "featured",
  ],
  works: [
    "slug",
    "title",
    "excerpt",
    "date",
    "publishedAt",
    "tag",
    "status",
    "cover",
    "stack",
    "link",
    "bodyMarkdown",
    "bodyHtml",
    "featured",
    "order",
  ],
  videos: [
    "slug",
    "title",
    "excerpt",
    "date",
    "publishedAt",
    "tag",
    "status",
    "cover",
    "platform",
    "duration",
    "videoUrl",
    "bodyMarkdown",
    "bodyHtml",
    "featured",
    "order",
  ],
  courses: [
    "slug",
    "title",
    "excerpt",
    "date",
    "publishedAt",
    "tag",
    "status",
    "cover",
    "price",
    "original",
    "features",
    "primary",
    "badge",
    "cta",
    "url",
    "bodyMarkdown",
    "bodyHtml",
    "featured",
    "order",
  ],
  news: ["slug", "title", "date", "url", "bodyMarkdown", "bodyHtml", "status", "updatedAt"],
};

const STRING_ARRAY_FIELDS = new Set(["tags", "stack", "features"]);
const OPTIONAL_STRING_FIELDS = new Set([
  "excerpt",
  "tag",
  "readTime",
  "platform",
  "duration",
  "views",
  "price",
  "original",
  "students",
  "badge",
  "cta",
]);

export function parseFrontmatter(source, sourceFile) {
  const match = String(source).match(FRONTMATTER_PATTERN);
  if (!match) {
    throw new Error(`${sourceFile}: missing YAML frontmatter`);
  }

  const data = loadYaml(match[1], { schema: CORE_SCHEMA });
  if (!data || typeof data !== "object" || Array.isArray(data)) {
    throw new Error(`${sourceFile}: frontmatter must be a YAML object`);
  }

  return {
    data,
    markdown: String(source)
      .slice(match[0].length)
      .replace(/^\r?\n/, ""),
  };
}

export function convertObsidianImages(markdown) {
  return String(markdown).replace(/!\[\[([^\]]+)\]\]/g, (_, target) => {
    const image = target.trim();
    return `![](${image.startsWith("/") ? image : `/images/${image}`})`;
  });
}

/**
 * 正文标题降级：页面模板已经把文章标题渲染成该页唯一的 h1，
 * 正文再出现 h1 会让一页有多个 h1（实测 claude-skills-23-picks 有 9 个），
 * 语义结构直接乱掉。这里在唯一的 markdown→html 出口统一降一级。
 */
export function demoteHeadings(html) {
  return String(html)
    .replace(/<h1(\s[^>]*)?>/gi, "<h2$1>")
    .replace(/<\/h1>/gi, "</h2>");
}

export function renderMarkdown(markdown) {
  const html = marked.parse(convertObsidianImages(markdown), {
    gfm: true,
    breaks: false,
  });
  return demoteHeadings(html);
}

export function normalizeEntry(kind, data, markdown, sourceFile) {
  const fields = ENTRY_FIELDS[kind];
  if (!fields) throw new Error(`unsupported collection: ${kind}`);

  const entry = {};
  for (const field of fields) {
    if (field === "bodyMarkdown") {
      entry.bodyMarkdown = markdown;
    } else if (field === "bodyHtml") {
      entry.bodyHtml = renderMarkdown(markdown);
    } else if (data[field] !== undefined) {
      entry[field] = data[field];
    }
  }
  if (kind === "writings") entry.tags ??= [];
  if (kind === "works") {
    entry.stack ??= [];
    entry.featured = data.featured === undefined ? false : data.featured;
  }
  if (kind === "videos" || kind === "courses") entry.order ??= 0;
  if (kind === "courses") {
    entry.features ??= [];
    entry.primary = data.primary === undefined ? false : data.primary;
  }
  if (kind === "writings") {
    entry.featured = data.featured === undefined ? false : data.featured;
  }

  return { ...entry, sourceFile };
}

function isValidCalendarDate(value) {
  return (
    typeof value === "string" &&
    DATE_PATTERN.test(value) &&
    new Date(`${value}T00:00:00.000Z`).toISOString().slice(0, 10) === value
  );
}

function isValidDateOrIso(value) {
  return (
    typeof value === "string" &&
    ISO_DATE_PATTERN.test(value) &&
    !Number.isNaN(new Date(value).getTime())
  );
}

function resolveLocalAsset(source, publicDirectory, label) {
  if (/^https?:\/\//i.test(source)) return null;

  let decoded = source;
  try {
    decoded = decodeURIComponent(source.split(/[?#]/, 1)[0]);
  } catch {
    return `${label} contains an invalid path encoding: ${source}`;
  }

  const publicRoot = path.resolve(publicDirectory);
  const candidate = path.resolve(publicRoot, decoded.replace(/^\/+/, ""));
  if (candidate !== publicRoot && !candidate.startsWith(`${publicRoot}${path.sep}`)) {
    return `${label} path must stay under public directory: ${source}`;
  }

  const stat = fs.existsSync(candidate) ? fs.statSync(candidate) : undefined;
  if (!stat?.isFile()) return `${label} does not exist: ${source}`;
  return null;
}

// 只查「文件存在」不够：曾经 /uploads 下的「图片」其实是飞书下载代理返回的
// 364 字节 JSON，浏览器会当图片解码失败 → 全站裂图。这里按魔数确认真是图片。
const IMAGE_MAGIC = [
  { name: "jpeg", bytes: [0xff, 0xd8, 0xff] },
  { name: "png", bytes: [0x89, 0x50, 0x4e, 0x47] },
  { name: "gif", bytes: [0x47, 0x49, 0x46, 0x38] },
];

function isRealImage(filePath) {
  let head;
  try {
    const fd = fs.openSync(filePath, "r");
    head = Buffer.alloc(16);
    fs.readSync(fd, head, 0, 16, 0);
    fs.closeSync(fd);
  } catch {
    return false;
  }

  if (IMAGE_MAGIC.some((m) => m.bytes.every((b, i) => head[i] === b))) return true;

  // RIFF....WEBP
  if (head.subarray(0, 4).toString("ascii") === "RIFF" &&
      head.subarray(8, 12).toString("ascii") === "WEBP") return true;

  // ....ftypheic / ftypavif
  if (head.subarray(4, 8).toString("ascii") === "ftyp") return true;

  return false;
}

function imageSources(html) {
  const pattern = /<img\b[^>]*\bsrc=["']([^"']+)["']/gi;
  return [...String(html).matchAll(pattern)].map((match) => match[1]);
}

function externalUrlError(value) {
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:"
      ? null
      : "external URL must use http:// or https://";
  } catch {
    return "external URL must use http:// or https://";
  }
}

export function validateEntries(kind, entries, publicDirectory) {
  const config = COLLECTION_CONFIG[kind];
  if (!config) throw new Error(`unsupported collection: ${kind}`);

  const errors = [];
  const slugCounts = new Map();
  const addError = (entry, message) => errors.push(`${entry.sourceFile}: ${message}`);

  for (const entry of entries) {
    if (typeof entry.slug === "string") {
      slugCounts.set(entry.slug, (slugCounts.get(entry.slug) ?? 0) + 1);
    }

    if (typeof entry.slug !== "string") {
      addError(entry, "slug is required and must be a string");
    } else {
      if (!SLUG_PATTERN.test(entry.slug)) {
        addError(entry, "slug must contain only lowercase letters, numbers, and hyphens");
      }
      if (path.basename(String(entry.sourceFile ?? ""), ".md") !== entry.slug) {
        addError(entry, `filename must be ${entry.slug}.md`);
      }
    }

    for (const field of config.required) {
      if (field === "title") {
        if (typeof entry.title !== "string" || entry.title.trim() === "") {
          addError(entry, "title is required");
        }
      } else if (entry[field] === undefined || entry[field] === null || entry[field] === "") {
        addError(entry, `${field} is required`);
      }
    }

    if (!isValidCalendarDate(entry.date)) {
      addError(entry, "date must be a valid YYYY-MM-DD calendar date");
    }
    if (entry.publishedAt !== undefined && !isValidDateOrIso(entry.publishedAt)) {
      addError(entry, "publishedAt must be YYYY-MM-DD or ISO 8601");
    }
    if (!config.statuses.has(entry.status)) {
      addError(entry, `status must be one of: ${[...config.statuses].join(", ")}`);
    }
    if (entry.updatedAt !== undefined && !isValidDateOrIso(entry.updatedAt)) {
      addError(entry, "updatedAt must be YYYY-MM-DD or ISO 8601");
    }

    for (const field of STRING_ARRAY_FIELDS) {
      if (entry[field] !== undefined) {
        const valid =
          Array.isArray(entry[field]) && entry[field].every((item) => typeof item === "string");
        if (!valid) addError(entry, `${field} must be an array of strings`);
      }
    }
    for (const field of OPTIONAL_STRING_FIELDS) {
      if (entry[field] !== undefined && typeof entry[field] !== "string") {
        addError(entry, `${field} must be a string`);
      }
    }
    for (const field of ["featured", "primary"]) {
      if (entry[field] !== undefined && typeof entry[field] !== "boolean") {
        addError(entry, `${field} must be a boolean`);
      }
    }
    if (entry.order !== undefined) {
      if (typeof entry.order !== "number" || !Number.isFinite(entry.order) || entry.order < 0) {
        addError(entry, "order must be a non-negative number");
      }
    }

    for (const field of config.urlFields) {
      if (entry[field] !== undefined) {
        const error = externalUrlError(entry[field]);
        if (error) addError(entry, `${field}: ${error}`);
      }
    }

    if (entry.cover !== undefined) {
      if (typeof entry.cover !== "string") {
        addError(entry, "cover must be a string path");
      } else {
        const coverError = resolveLocalAsset(entry.cover, publicDirectory, "cover");
        if (coverError) addError(entry, coverError);
        else {
          const decoded = decodeURIComponent(entry.cover.split(/[?#]/, 1)[0]);
          const abs = path.resolve(path.resolve(publicDirectory), decoded.replace(/^\/+/, ""));
          if (!isRealImage(abs)) {
            addError(entry, `cover is not a valid image file: ${entry.cover}`);
          }
        }
      }
    }

    for (const source of imageSources(entry.bodyHtml)) {
      const imageError = resolveLocalAsset(source, publicDirectory, "image");
      if (imageError) addError(entry, imageError);
    }
  }

  for (const [slug, count] of slugCounts) {
    if (count > 1) errors.push(`duplicate slug: ${slug} appears ${count} times`);
  }
  if (errors.length > 0) {
    throw new Error(`Invalid ${kind}:\n- ${errors.join("\n- ")}`);
  }
}

export function loadCollection(contentDirectory, kind) {
  const directory = path.join(contentDirectory, kind);
  if (!fs.existsSync(directory) || !fs.statSync(directory).isDirectory()) {
    throw new Error(`content directory does not exist: ${directory}`);
  }

  return fs
    .readdirSync(directory, { recursive: true })
    .filter((file) => String(file).endsWith(".md"))
    .sort()
    .map((relativeFile) => {
      const source = fs.readFileSync(path.join(directory, relativeFile), "utf8");
      const parsed = parseFrontmatter(source, relativeFile);
      return normalizeEntry(kind, parsed.data, parsed.markdown, relativeFile);
    });
}

export function validateAbout(about, publicDirectory) {
  const errors = [];
  if (typeof about.title !== "string" || about.title.trim() === "")
    errors.push("about.md: title is required");
  if (about.updatedAt !== undefined && !isValidDateOrIso(about.updatedAt)) {
    errors.push("about.md: updatedAt must be YYYY-MM-DD or ISO 8601");
  }
  if (about.cover !== undefined) {
    if (typeof about.cover !== "string") {
      errors.push("about.md: cover must be a string path");
    } else {
      const coverError = resolveLocalAsset(about.cover, publicDirectory, "cover");
      if (coverError) errors.push(`about.md: ${coverError}`);
    }
  }
  for (const source of imageSources(about.bodyHtml)) {
    const imageError = resolveLocalAsset(source, publicDirectory, "image");
    if (imageError) errors.push(`about.md: ${imageError}`);
  }
  if (errors.length > 0) throw new Error(`Invalid about:\n- ${errors.join("\n- ")}`);
}

export function loadAbout(contentDirectory) {
  const file = path.join(contentDirectory, "about.md");
  if (!fs.existsSync(file) || !fs.statSync(file).isFile()) {
    throw new Error(`about source file does not exist: ${file}`);
  }
  const parsed = parseFrontmatter(fs.readFileSync(file, "utf8"), "about.md");
  return {
    key: "about",
    title: parsed.data.title,
    excerpt: parsed.data.excerpt,
    cover: parsed.data.cover,
    bodyMarkdown: parsed.markdown,
    bodyHtml: renderMarkdown(parsed.markdown),
    updatedAt: parsed.data.updatedAt,
  };
}

export function writeJsonIfChanged(outputFile, data) {
  const json = `${JSON.stringify(data, null, 2)}\n`;
  const existing = fs.existsSync(outputFile) ? fs.readFileSync(outputFile, "utf8") : "";
  if (existing === json) return false;

  fs.mkdirSync(path.dirname(outputFile), { recursive: true });
  fs.writeFileSync(outputFile, json);
  return true;
}

function publicEntry(entry) {
  const { sourceFile, ...output } = entry;
  return output;
}

export function syncAll({ contentDirectory, publicDirectory, dataDirectory }) {
  const collections = Object.fromEntries(
    Object.entries(COLLECTION_CONFIG).map(([kind, config]) => {
      const entries = loadCollection(contentDirectory, kind);
      validateEntries(kind, entries, publicDirectory);
      return [kind, { entries, config }];
    }),
  );

  const about = loadAbout(contentDirectory);
  validateAbout(about, publicDirectory);

  const changed = [];
  for (const [kind, { entries, config }] of Object.entries(collections)) {
    const sorted = entries
      .sort((a, b) => {
        const orderA = typeof a.order === "number" ? a.order : 0;
        const orderB = typeof b.order === "number" ? b.order : 0;
        if (orderA !== orderB) return orderA - orderB;
        return String(a.slug).localeCompare(String(b.slug));
      })
      .map(publicEntry);
    const outputFile = path.join(dataDirectory, config.output);
    if (writeJsonIfChanged(outputFile, { [config.property]: sorted })) changed.push(config.output);
  }

  if (writeJsonIfChanged(path.join(dataDirectory, "about.json"), about)) changed.push("about.json");
  return changed.sort();
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const root = process.cwd();
  try {
    const changed = syncAll({
      contentDirectory: path.join(root, "content"),
      publicDirectory: path.join(root, "public"),
      dataDirectory: path.join(root, "data"),
    });
    console.log(changed.length > 0 ? `updated: ${changed.join(", ")}` : "unchanged: all content");
  } catch (error) {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  }
}
