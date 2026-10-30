#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { load as loadYaml } from "js-yaml";
import { marked } from "marked";

const FRONTMATTER_PATTERN = /^---\r?\n([\s\S]*?)\r?\n---(?:\r?\n|$)/;

export function parseFrontmatter(source, sourceFile) {
  const match = String(source).match(FRONTMATTER_PATTERN);
  if (!match) {
    throw new Error(`${sourceFile}: missing YAML frontmatter`);
  }

  return {
    data: loadYaml(match[1]),
    markdown: String(source).slice(match[0].length).replace(/^\r?\n/, ""),
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
    featured: Boolean(data.featured),
    sourceFile,
  };
}

export function writeWritingsFile(writings, outputFile) {
  const json = `${JSON.stringify({ writings }, null, 2)}\n`;
  const existing = fs.existsSync(outputFile) ? fs.readFileSync(outputFile, "utf8") : "";
  if (existing === json) return false;

  fs.mkdirSync(path.dirname(outputFile), { recursive: true });
  fs.writeFileSync(outputFile, json);
  return true;
}

export function syncWritings({ contentDirectory, outputFile }) {
  if (!fs.existsSync(contentDirectory)) {
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

  return writeWritingsFile(writings, outputFile);
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const root = process.cwd();
  const changed = syncWritings({
    contentDirectory: path.join(root, "content/writings"),
    outputFile: path.join(root, "data/writings.json"),
  });
  console.log(changed ? "updated: data/writings.json" : "unchanged: data/writings.json");
}
