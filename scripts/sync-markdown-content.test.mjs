import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

const { normalizeEntry, validateEntries, validateAbout, syncAll, writeJsonIfChanged } =
  await import("./sync-markdown-content.mjs");

function makeRoot() {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "all-markdown-content-"));
  const content = path.join(root, "content");
  const publicDir = path.join(root, "public");
  const data = path.join(root, "data");
  for (const kind of ["writings", "works", "videos", "courses", "news"]) {
    fs.mkdirSync(path.join(content, kind), { recursive: true });
  }
  fs.mkdirSync(path.join(publicDir, "uploads", "my-work"), { recursive: true });
  fs.mkdirSync(data, { recursive: true });
  // 必须是真的 PNG：同步脚本会按魔数校验 cover 是不是图片
  fs.writeFileSync(
    path.join(publicDir, "uploads/my-work/cover.png"),
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
  );
  return { root, content, publicDir, data };
}

function write(file, source) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, source);
}

function legalContentRoot() {
  const root = makeRoot();
  const files = {
    "writings/my-post.md": `---\nslug: my-post\ntitle: 我的文章\ndate: 2026-10-30\nstatus: published\ntags:\n  - 独立开发\nfeatured: true\n---\n\n## 正文\n`,
    "works/my-work.md": `---\nslug: my-work\ntitle: 我的项目\ndate: 2026-10-10\nstatus: active\ncover: uploads/my-work/cover.png\nstack:\n  - TypeScript\nlink: https://example.com/work\nfeatured: true\norder: 2\n---\n\n## 项目说明\n`,
    "videos/my-video.md": `---\nslug: my-video\ntitle: 我的视频\ndate: 2026-10-11\nstatus: published\nplatform: B站\nduration: 10:00\nviews: 1 万\nvideoUrl: https://example.com/video\norder: 1\n---\n\n## 视频说明\n`,
    "courses/my-course.md": `---\nslug: my-course\ntitle: 我的课程\ndate: 2026-10-12\nstatus: published\nprice: "¥199"\nfeatures:\n  - 示例模块\nprimary: true\nbadge: 推荐\ncta: 立即报名\nurl: https://example.com/course\norder: 3\n---\n\n## 课程说明\n`,
    "news/my-news.md": `---\nslug: my-news\ntitle: 我的动态\ndate: 2026-10-13\nupdatedAt: 2026-10-14\nurl: https://example.com/news\nstatus: published\n---\n\n这是动态正文\n`,
    "about.md": `---\ntitle: 关于数字旷野\nexcerpt: 一个人能创造多大的可能性？\nupdatedAt: 2026-10-15\n---\n\n## 我是谁\n`,
  };
  for (const [file, source] of Object.entries(files)) {
    write(path.join(root.content, file), source);
  }
  return root;
}

test("normalizeEntry preserves collection-specific metadata", () => {
  const work = normalizeEntry(
    "works",
    {
      slug: "digital-wild-site",
      title: "数字旷野 轻量主页",
      date: "2026-05-10",
      status: "active",
      stack: ["TypeScript", "Next.js"],
      link: "https://qiang-mycreativehub-md.pages.dev/",
      featured: true,
      order: 2,
    },
    "## 项目说明",
    "digital-wild-site.md",
  );

  assert.equal(work.slug, "digital-wild-site");
  assert.deepEqual(work.stack, ["TypeScript", "Next.js"]);
  assert.equal(work.link, "https://qiang-mycreativehub-md.pages.dev/");
  assert.equal(work.featured, true);
  assert.equal(work.order, 2);
  assert.equal(work.bodyHtml, "<h2>项目说明</h2>\n");
});

test("syncAll writes every collection and about JSON", () => {
  const root = legalContentRoot();
  const changed = syncAll({
    contentDirectory: root.content,
    publicDirectory: root.publicDir,
    dataDirectory: root.data,
  });

  assert.deepEqual(changed.sort(), [
    "about.json",
    "courses.json",
    "news.json",
    "videos.json",
    "works.json",
    "writings.json",
  ]);
  const writings = JSON.parse(fs.readFileSync(path.join(root.data, "writings.json"), "utf8"));
  const works = JSON.parse(fs.readFileSync(path.join(root.data, "works.json"), "utf8"));
  const videos = JSON.parse(fs.readFileSync(path.join(root.data, "videos.json"), "utf8"));
  const courses = JSON.parse(fs.readFileSync(path.join(root.data, "courses.json"), "utf8"));
  const news = JSON.parse(fs.readFileSync(path.join(root.data, "news.json"), "utf8"));
  const about = JSON.parse(fs.readFileSync(path.join(root.data, "about.json"), "utf8"));

  assert.equal(writings.writings[0].slug, "my-post");
  assert.equal(writings.writings[0].sourceFile, undefined);
  assert.equal(works.works[0].stack[0], "TypeScript");
  assert.equal(videos.videos[0].videoUrl, "https://example.com/video");
  assert.deepEqual(courses.courses[0].features, ["示例模块"]);
  assert.equal(news.news[0].url, "https://example.com/news");
  assert.equal(about.key, "about");
  assert.equal(about.title, "关于数字旷野");
});

test("syncAll is deterministic when content is unchanged", async () => {
  const root = legalContentRoot();
  const options = {
    contentDirectory: root.content,
    publicDirectory: root.publicDir,
    dataDirectory: root.data,
  };
  syncAll(options);
  const output = path.join(root.data, "works.json");
  const before = fs.statSync(output).mtimeMs;
  await new Promise((resolve) => setTimeout(resolve, 20));

  assert.deepEqual(syncAll(options), []);
  assert.equal(fs.statSync(output).mtimeMs, before);
});

test("validateEntries reports required fields, filenames, dates, statuses, and duplicates", () => {
  const root = makeRoot();
  const first = normalizeEntry(
    "writings",
    { slug: "my-post", title: "一", date: "2026-10-30", status: "published" },
    "一",
    "my-post.md",
  );
  const second = normalizeEntry(
    "writings",
    {
      slug: "my-post",
      title: "",
      date: "2026-02-31",
      publishedAt: "invalid",
      status: "active",
    },
    "二",
    "wrong-name.md",
  );

  assert.throws(
    () => validateEntries("writings", [first, second], root.publicDir),
    (error) => {
      assert.ok(error instanceof Error);
      assert.match(error.message, /wrong-name\.md: filename must be my-post\.md/);
      assert.match(error.message, /title is required/);
      assert.match(error.message, /date must be a valid YYYY-MM-DD calendar date/);
      assert.match(error.message, /publishedAt must be YYYY-MM-DD or ISO 8601/);
      assert.match(error.message, /status must be one of: draft, published, archived/);
      assert.match(error.message, /duplicate slug: my-post appears 2 times/);
      return true;
    },
  );
});

test("validateEntries rejects a cover that is not a real image", () => {
  // 回归：曾经 /uploads 下的「图片」其实是飞书下载代理返回的 JSON，
  // 文件存在但内容不是图片 —— 只查「文件存在」放行了它，结果全站裂图。
  const root = makeRoot();
  fs.writeFileSync(path.join(root.publicDir, "uploads/my-work/fake.jpg"), '{"code":0}');

  const entry = normalizeEntry(
    "works",
    {
      slug: "fake-cover",
      title: "假封面",
      date: "2026-10-30",
      status: "active",
      cover: "uploads/my-work/fake.jpg",
    },
    "正文",
    "fake-cover.md",
  );

  assert.throws(
    () => validateEntries("works", [entry], root.publicDir),
    /cover is not a valid image file/,
    "应该是图片但实际是 JSON 的 cover 必须被拒绝",
  );
});

test("validateEntries rejects unsafe external URLs", () => {
  const root = makeRoot();
  const cases = [
    ["works", { link: "javascript:alert(1)" }, "a-work.md", "a-work"],
    ["videos", { videoUrl: "file:///tmp/video.mp4" }, "a-video.md", "a-video"],
    ["courses", { url: "javascript:alert(1)" }, "a-course.md", "a-course"],
    ["news", { url: "javascript:alert(1)" }, "a-news.md", "a-news"],
  ];

  for (const [kind, extra, sourceFile, slug] of cases) {
    const entry = normalizeEntry(
      kind,
      { slug, title: "标题", date: "2026-10-30", status: "published", ...extra },
      "正文",
      sourceFile,
    );
    assert.throws(
      () => validateEntries(kind, [entry], root.publicDir),
      /external URL must use http:\/\/ or https:\/\//,
      `${kind} should reject unsafe URL`,
    );
  }
});

test("validateEntries rejects missing and traversing local images", () => {
  const root = makeRoot();
  const unsafe = normalizeEntry(
    "writings",
    {
      slug: "unsafe-post",
      title: "标题",
      date: "2026-10-30",
      status: "published",
      cover: "../secret.png",
    },
    "正文",
    "unsafe-post.md",
  );
  const missing = normalizeEntry(
    "writings",
    {
      slug: "missing-post",
      title: "标题",
      date: "2026-10-30",
      status: "published",
    },
    "![缺失](/images/missing.png)",
    "missing-post.md",
  );

  assert.throws(
    () => validateEntries("writings", [unsafe, missing], root.publicDir),
    (error) => {
      assert.match(error.message, /cover path must stay under public directory/);
      assert.match(error.message, /image does not exist: \/images\/missing\.png/);
      return true;
    },
  );
});

test("validateAbout validates title, dates, and local cover", () => {
  const root = makeRoot();
  assert.throws(
    () => validateAbout({ title: "", updatedAt: "invalid" }, root.publicDir),
    (error) => {
      assert.match(error.message, /title is required/);
      assert.match(error.message, /updatedAt must be YYYY-MM-DD or ISO 8601/);
      return true;
    },
  );

  assert.throws(
    () => validateAbout({ title: "关于", cover: "../secret.png" }, root.publicDir),
    /cover path must stay under public directory/,
  );
});

test("writeJsonIfChanged only writes changed content", async () => {
  const root = makeRoot();
  const file = path.join(root.root, "output.json");
  assert.equal(writeJsonIfChanged(file, { a: 1 }), true);
  assert.equal(fs.readFileSync(file, "utf8"), `${JSON.stringify({ a: 1 }, null, 2)}\n`);
  const before = fs.statSync(file).mtimeMs;
  await new Promise((resolve) => setTimeout(resolve, 20));
  assert.equal(writeJsonIfChanged(file, { a: 1 }), false);
  assert.equal(fs.statSync(file).mtimeMs, before);
});

test("syncAll fails when a collection directory or about file is missing", () => {
  const root = makeRoot();
  fs.rmSync(path.join(root.content, "news"), { recursive: true, force: true });
  assert.throws(
    () =>
      syncAll({
        contentDirectory: root.content,
        publicDirectory: root.publicDir,
        dataDirectory: root.data,
      }),
    /content directory does not exist:/,
  );

  const complete = legalContentRoot();
  fs.rmSync(path.join(complete.content, "about.md"));
  assert.throws(
    () =>
      syncAll({
        contentDirectory: complete.content,
        publicDirectory: complete.publicDir,
        dataDirectory: complete.data,
      }),
    /about source file does not exist:/,
  );
});
