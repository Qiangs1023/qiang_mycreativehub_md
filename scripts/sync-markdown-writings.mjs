#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { CORE_SCHEMA, load as loadYaml } from "js-yaml";
import { marked } from "marked";

const FRONTMATTER_PATTERN = /^---\r?\n([\s\S]*?)\r?\n---(?:\r?\n|$)/;
const SLUG_PATTERN = /^[a-z0-9-]+$/;
const WRITING_STATUSES = new Set(["draft", "published", "archived"]);
const ISO_DATE_PATTERN =
  /^\d{4}-\d{2}-\d{2}(?:T\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[+-]\d{2}:\d{2})?)?$/;

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

export function renderMarkdown(markdown) {
  return marked.parse(convertObsidianImages(markdown), {
    gfm: true,
    breaks: false,
  });
}

export function normalizeWriting(data, markdown, sourceFile) {
  return {
    slug: data.slug,
    title: data.title,
    excerpt: data.excerpt,
    date: data.date,
    publishedAt: data.publishedAt,
    tag: data.tag,
    tags: data.tags ?? [],
    readTime: data.readTime,
    cover: data.cover,
    bodyMarkdown: markdown,
    bodyHtml: renderMarkdown(markdown),
    status: data.status,
    featured: data.featured === undefined ? false : data.featured,
    sourceFile,
  };
}

function isValidCalendarDate(value) {
  return (
    typeof value === "string" &&
    /^\d{4}-\d{2}-\d{2}$/.test(value) &&
    new Date(`${value}T00:00:00.000Z`).toISOString().slice(0, 10) === value
  );
}

function isValidPublishedAt(value) {
  if (typeof value !== "string" || !ISO_DATE_PATTERN.test(value)) return false;
  return !Number.isNaN(new Date(value).getTime());
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
  if (!stat?.isFile()) {
    return `${label} does not exist: ${source}`;
  }
  return null;
}

function imageSources(html) {
  const sources = [];
  const pattern = /<img\b[^>]*\bsrc=["']([^"']+)["']/gi;
  for (const match of String(html).matchAll(pattern)) {
    sources.push(match[1]);
  }
  return sources;
}

export function validateWritings(writings, publicDirectory) {
  const errors = [];
  const slugCounts = new Map();
  const addError = (writing, message) => {
    errors.push(`${writing.sourceFile}: ${message}`);
  };

  for (const writing of writings) {
    if (typeof writing.slug === "string") {
      slugCounts.set(writing.slug, (slugCounts.get(writing.slug) ?? 0) + 1);
    }

    if (typeof writing.slug !== "string") {
      addError(writing, "slug must contain only lowercase letters, numbers, and hyphens");
    } else {
      if (!SLUG_PATTERN.test(writing.slug)) {
        addError(writing, "slug must contain only lowercase letters, numbers, and hyphens");
      }
      if (path.basename(String(writing.sourceFile ?? ""), ".md") !== writing.slug) {
        addError(writing, `filename must be ${writing.slug}.md`);
      }
    }

    if (typeof writing.title !== "string" || writing.title.trim() === "") {
      addError(writing, "title is required");
    }
    if (!isValidCalendarDate(writing.date)) {
      addError(writing, "date must be a valid YYYY-MM-DD calendar date");
    }
    if (writing.publishedAt !== undefined && !isValidPublishedAt(writing.publishedAt)) {
      addError(writing, "publishedAt must be YYYY-MM-DD or ISO 8601");
    }
    if (!WRITING_STATUSES.has(writing.status)) {
      addError(writing, "status must be draft, published, or archived");
    }
    if (writing.excerpt !== undefined && typeof writing.excerpt !== "string") {
      addError(writing, "excerpt must be a string");
    }
    if (writing.tag !== undefined && typeof writing.tag !== "string") {
      addError(writing, "tag must be a string");
    }
    if (writing.readTime !== undefined && typeof writing.readTime !== "string") {
      addError(writing, "readTime must be a string");
    }
    if (!Array.isArray(writing.tags) || writing.tags.some((tag) => typeof tag !== "string")) {
      addError(writing, "tags must be an array of strings");
    }
    if (typeof writing.featured !== "boolean") {
      addError(writing, "featured must be a boolean");
    }

    if (writing.cover !== undefined) {
      if (typeof writing.cover !== "string") {
        addError(writing, "cover must be a string path");
      } else {
        const coverError = resolveLocalAsset(writing.cover, publicDirectory, "cover");
        if (coverError) addError(writing, coverError);
      }
    }

    for (const source of imageSources(writing.bodyHtml)) {
      const imageError = resolveLocalAsset(source, publicDirectory, "image");
      if (imageError) addError(writing, imageError);
    }
  }

  for (const [slug, count] of slugCounts) {
    if (count > 1) errors.push(`duplicate slug: ${slug} appears ${count} times`);
  }

  if (errors.length > 0) {
    throw new Error(`Invalid writings:\n- ${errors.join("\n- ")}`);
  }
}

export function scanWritings(contentDirectory, publicDirectory) {
  if (!fs.existsSync(contentDirectory) || !fs.statSync(contentDirectory).isDirectory()) {
    throw new Error(`content directory does not exist: ${contentDirectory}`);
  }

  const files = fs
    .readdirSync(contentDirectory, { recursive: true })
    .filter((file) => String(file).endsWith(".md"))
    .sort();
  const writings = files.map((relativeFile) => {
    const sourceFile = relativeFile;
    const source = fs.readFileSync(path.join(contentDirectory, relativeFile), "utf8");
    const parsed = parseFrontmatter(source, sourceFile);
    return normalizeWriting(parsed.data, parsed.markdown, sourceFile);
  });

  validateWritings(writings, publicDirectory);
  return writings;
}

function publicWriting(writing) {
  const { sourceFile, ...output } = writing;
  return output;
}

export function writeWritingsFile(writings, outputFile) {
  const json = `${JSON.stringify({ writings: writings.map(publicWriting) }, null, 2)}\n`;
  const existing = fs.existsSync(outputFile) ? fs.readFileSync(outputFile, "utf8") : "";
  if (existing === json) return false;

  fs.mkdirSync(path.dirname(outputFile), { recursive: true });
  fs.writeFileSync(outputFile, json);
  return true;
}

export function syncWritings({ contentDirectory, publicDirectory, outputFile }) {
  const writings = scanWritings(contentDirectory, publicDirectory);
  return writeWritingsFile(writings, outputFile);
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const root = process.cwd();
  try {
    const changed = syncWritings({
      contentDirectory: path.join(root, "content/writings"),
      publicDirectory: path.join(root, "public"),
      outputFile: path.join(root, "data/writings.json"),
    });
    console.log(changed ? "updated: data/writings.json" : "unchanged: data/writings.json");
  } catch (error) {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  }
}
