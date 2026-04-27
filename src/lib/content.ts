import { marked } from "marked";

export type ContentMeta = {
  slug: string;
  title: string;
  date?: string;
  tag?: string;
  excerpt?: string;
  cover?: string;
  /** Work */
  stack?: string[];
  link?: string;
  status?: string;
  /** Videos */
  platform?: string;
  duration?: string;
  views?: string;
  videoUrl?: string;
  /** Courses */
  price?: string;
  original?: string;
  students?: string;
  features?: string[];
  badge?: string;
  primary?: boolean;
  cta?: string;
  /** Writing */
  readTime?: string;
};

export type ContentEntry = {
  meta: ContentMeta;
  /** Rendered HTML */
  html: string;
  /** Raw markdown body (without frontmatter) */
  body: string;
};

/**
 * Minimal YAML-frontmatter parser. Supports:
 *  - key: value (string)
 *  - key: "quoted value"
 *  - key: true | false
 *  - key: 123
 *  - key: [a, b, "c d"]
 * No nested objects.
 */
function parseFrontmatter(raw: string): { data: Record<string, unknown>; body: string } {
  const match = raw.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/);
  if (!match) return { data: {}, body: raw };
  const [, head, body] = match;
  const data: Record<string, unknown> = {};

  for (const rawLine of head.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) continue;
    const idx = line.indexOf(":");
    if (idx === -1) continue;
    const key = line.slice(0, idx).trim();
    let value: string = line.slice(idx + 1).trim();

    if (value === "") {
      data[key] = "";
      continue;
    }
    if (value === "true" || value === "false") {
      data[key] = value === "true";
      continue;
    }
    if (/^-?\d+(\.\d+)?$/.test(value)) {
      data[key] = Number(value);
      continue;
    }
    if (value.startsWith("[") && value.endsWith("]")) {
      const inner = value.slice(1, -1);
      const parts: string[] = [];
      let buf = "";
      let inQuote: '"' | "'" | null = null;
      for (const ch of inner) {
        if (inQuote) {
          if (ch === inQuote) inQuote = null;
          else buf += ch;
        } else if (ch === '"' || ch === "'") {
          inQuote = ch;
        } else if (ch === ",") {
          if (buf.trim()) parts.push(buf.trim());
          buf = "";
        } else {
          buf += ch;
        }
      }
      if (buf.trim()) parts.push(buf.trim());
      data[key] = parts;
      continue;
    }
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    data[key] = value;
  }

  return { data, body };
}

marked.setOptions({ gfm: true, breaks: false });

function buildEntry(slug: string, raw: string): ContentEntry {
  const { data, body } = parseFrontmatter(raw);
  const html = marked.parse(body) as string;
  const meta: ContentMeta = {
    slug,
    title: (data.title as string) ?? slug,
    date: data.date as string | undefined,
    tag: data.tag as string | undefined,
    excerpt: data.excerpt as string | undefined,
    cover: data.cover as string | undefined,
    stack: data.stack as string[] | undefined,
    link: data.link as string | undefined,
    status: data.status as string | undefined,
    platform: data.platform as string | undefined,
    duration: data.duration as string | undefined,
    views: data.views as string | undefined,
    videoUrl: data.videoUrl as string | undefined,
    price: data.price as string | undefined,
    original: data.original as string | undefined,
    students: data.students as string | undefined,
    features: data.features as string[] | undefined,
    badge: data.badge as string | undefined,
    primary: data.primary as boolean | undefined,
    cta: data.cta as string | undefined,
    readTime: data.readTime as string | undefined,
  };
  return { meta, html, body };
}

function loadCollection(modules: Record<string, string>): ContentEntry[] {
  const entries: ContentEntry[] = [];
  for (const [path, raw] of Object.entries(modules)) {
    const slug = path.split("/").pop()!.replace(/\.md$/, "");
    entries.push(buildEntry(slug, raw));
  }
  // newest first if date present, else by slug
  entries.sort((a, b) => {
    if (a.meta.date && b.meta.date) return a.meta.date < b.meta.date ? 1 : -1;
    return a.meta.slug.localeCompare(b.meta.slug);
  });
  return entries;
}

const workModules = import.meta.glob("../content/work/*.md", {
  query: "?raw",
  import: "default",
  eager: true,
}) as Record<string, string>;

const writingModules = import.meta.glob("../content/writing/*.md", {
  query: "?raw",
  import: "default",
  eager: true,
}) as Record<string, string>;

const videosModules = import.meta.glob("../content/videos/*.md", {
  query: "?raw",
  import: "default",
  eager: true,
}) as Record<string, string>;

const coursesModules = import.meta.glob("../content/courses/*.md", {
  query: "?raw",
  import: "default",
  eager: true,
}) as Record<string, string>;

const aboutModules = import.meta.glob("../content/about/*.md", {
  query: "?raw",
  import: "default",
  eager: true,
}) as Record<string, string>;

export const workEntries = loadCollection(workModules);
export const writingEntries = loadCollection(writingModules);
export const videosEntries = loadCollection(videosModules);
export const coursesEntries = loadCollection(coursesModules);
export const aboutEntries = loadCollection(aboutModules);

export function findEntry(
  collection: ContentEntry[],
  slug: string,
): ContentEntry | undefined {
  return collection.find((e) => e.meta.slug === slug);
}

export function neighbours(collection: ContentEntry[], slug: string) {
  const i = collection.findIndex((e) => e.meta.slug === slug);
  return {
    prev: i > 0 ? collection[i - 1] : undefined,
    next: i >= 0 && i < collection.length - 1 ? collection[i + 1] : undefined,
  };
}
