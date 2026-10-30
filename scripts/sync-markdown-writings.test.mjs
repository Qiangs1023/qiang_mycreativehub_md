import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

const {
  parseFrontmatter,
  convertObsidianImages,
  renderMarkdown,
  normalizeWriting,
  validateWritings,
  syncWritings,
  writeWritingsFile,
} = await import("./sync-markdown-writings.mjs");

function tempDir(name) {
  return fs.mkdtempSync(path.join(os.tmpdir(), name));
}

test("parseFrontmatter extracts YAML data and Markdown body", () => {
  const source =
    "---\nslug: my-post\ntitle: 我的文章\ndate: 2026-10-30\nstatus: published\n---\n\n# 标题\n";
  const parsed = parseFrontmatter(source, "my-post.md");
  assert.equal(parsed.data.slug, "my-post");
  assert.equal(parsed.data.title, "我的文章");
  assert.equal(parsed.markdown, "# 标题\n");
});

test("parseFrontmatter rejects missing frontmatter", () => {
  assert.throws(
    () => parseFrontmatter("# 没有元数据\n", "my-post.md"),
    /my-post\.md: missing YAML frontmatter/,
  );
});

test("convertObsidianImages maps vault images to public images", () => {
  assert.equal(convertObsidianImages("![[cover.png]]"), "![](/images/cover.png)");
});

test("renderMarkdown supports GFM markdown", () => {
  assert.equal(
    renderMarkdown("## 正文\n\n- 项目\n"),
    "<h2>正文</h2>\n<ul>\n<li>项目</li>\n</ul>\n",
  );
});

test("normalizeWriting produces schema-compatible output", () => {
  const result = normalizeWriting(
    {
      slug: "my-post",
      title: "我的文章",
      date: "2026-10-30",
      status: "published",
      tags: ["独立开发"],
      featured: true,
    },
    "## 正文",
    "my-post.md",
  );
  assert.equal(result.slug, "my-post");
  assert.equal(result.bodyHtml, "<h2>正文</h2>\n");
  assert.deepEqual(result.tags, ["独立开发"]);
  assert.equal(result.featured, true);
});

test("writeWritingsFile only rewrites changed JSON", async () => {
  const dir = tempDir("markdown-writings-write-");
  const file = path.join(dir, "writings.json");
  const writings = [{ slug: "my-post", bodyMarkdown: "" }];

  assert.equal(writeWritingsFile(writings, file), true);
  assert.equal(fs.readFileSync(file, "utf8"), `${JSON.stringify({ writings }, null, 2)}\n`);
  const before = fs.statSync(file).mtimeMs;
  await new Promise((resolve) => setTimeout(resolve, 20));
  assert.equal(writeWritingsFile(writings, file), false);
  assert.equal(fs.statSync(file).mtimeMs, before);
});

test("validateWritings accepts valid metadata and existing local assets", () => {
  const publicDir = tempDir("markdown-writings-public-");
  fs.mkdirSync(path.join(publicDir, "images"), { recursive: true });
  fs.mkdirSync(path.join(publicDir, "uploads"), { recursive: true });
  fs.writeFileSync(path.join(publicDir, "images/cover.png"), "image");
  fs.writeFileSync(path.join(publicDir, "uploads/my-post.png"), "image");

  validateWritings(
    [
      normalizeWriting(
        {
          slug: "my-post",
          title: "我的文章",
          date: "2026-10-30",
          publishedAt: "2026-10-30T12:00:00.000Z",
          status: "published",
          cover: "uploads/my-post.png",
          tags: ["独立开发"],
          featured: false,
        },
        "![[cover.png]]",
        "my-post.md",
      ),
    ],
    publicDir,
  );
});

test("validateWritings reports filename, slug, required fields, and date errors together", () => {
  const publicDir = tempDir("markdown-writings-public-");
  const writing = normalizeWriting(
    {
      slug: "Bad Slug",
      date: "2026-02-31",
      publishedAt: "not-a-date",
    },
    "正文",
    "wrong-file.md",
  );

  assert.throws(
    () => validateWritings([writing], publicDir),
    (error) => {
      assert.ok(error instanceof Error);
      assert.match(error.message, /wrong-file\.md: filename must be Bad Slug\.md/);
      assert.match(error.message, /slug must contain only lowercase letters, numbers, and hyphens/);
      assert.match(error.message, /title is required/);
      assert.match(error.message, /status must be draft, published, or archived/);
      assert.match(error.message, /date must be a valid YYYY-MM-DD calendar date/);
      assert.match(error.message, /publishedAt must be YYYY-MM-DD or ISO 8601/);
      return true;
    },
  );
});

test("validateWritings rejects duplicate slugs", () => {
  const publicDir = tempDir("markdown-writings-public-");
  const first = normalizeWriting(baseData(), "一", "my-post.md");
  const second = normalizeWriting(baseData(), "二", "other-name.md");

  assert.throws(() => validateWritings([first, second], publicDir), /duplicate slug: my-post/);
});

test("validateWritings rejects unsafe and missing local assets", () => {
  const publicDir = tempDir("markdown-writings-public-");
  const unsafeCover = normalizeWriting(
    { ...baseData(), cover: "../secret.png" },
    "正文",
    "my-post.md",
  );
  const missingImage = normalizeWriting(baseData(), "![缺失](/images/missing.png)", "my-post.md");

  assert.throws(
    () => validateWritings([unsafeCover, missingImage], publicDir),
    (error) => {
      assert.ok(error instanceof Error);
      assert.match(error.message, /cover path must stay under public directory/);
      assert.match(error.message, /image does not exist: \/images\/missing\.png/);
      return true;
    },
  );
});

test("syncWritings validates and writes public JSON without sourceFile", () => {
  const root = tempDir("markdown-writings-sync-");
  const contentDir = path.join(root, "content");
  const publicDir = path.join(root, "public");
  const outputFile = path.join(root, "data/writings.json");
  fs.mkdirSync(contentDir, { recursive: true });
  fs.mkdirSync(publicDir, { recursive: true });
  fs.writeFileSync(
    path.join(contentDir, "my-post.md"),
    "---\nslug: my-post\ntitle: 我的文章\ndate: 2026-10-30\nstatus: draft\n---\n\n## 正文\n",
  );

  assert.equal(
    syncWritings({ contentDirectory: contentDir, publicDirectory: publicDir, outputFile }),
    true,
  );
  const data = JSON.parse(fs.readFileSync(outputFile, "utf8"));
  assert.equal(data.writings.length, 1);
  assert.equal(data.writings[0].sourceFile, undefined);
  assert.equal(data.writings[0].status, "draft");
  assert.equal(data.writings[0].bodyHtml, "<h2>正文</h2>\n");
});

function baseData() {
  return {
    slug: "my-post",
    title: "我的文章",
    date: "2026-10-30",
    status: "published",
  };
}
