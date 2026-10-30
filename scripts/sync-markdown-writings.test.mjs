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
  writeWritingsFile,
} = await import("./sync-markdown-writings.mjs");

function tempDir(name) {
  return fs.mkdtempSync(path.join(os.tmpdir(), name));
}

test("parseFrontmatter extracts YAML data and Markdown body", () => {
  const source = "---\nslug: my-post\ntitle: 我的文章\ndate: 2026-10-30\nstatus: published\n---\n\n# 标题\n";
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
  assert.equal(renderMarkdown("## 正文\n\n- 项目\n"), "<h2>正文</h2>\n<ul>\n<li>项目</li>\n</ul>\n");
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
  assert.equal(
    fs.readFileSync(file, "utf8"),
    `${JSON.stringify({ writings }, null, 2)}\n`,
  );
  const before = fs.statSync(file).mtimeMs;
  await new Promise((resolve) => setTimeout(resolve, 20));
  assert.equal(writeWritingsFile(writings, file), false);
  assert.equal(fs.statSync(file).mtimeMs, before);
});
