// scripts/sync-feishu.test.mjs
process.env.FEISHU_APP_ID = "test_app_id";
process.env.FEISHU_APP_SECRET = "test_app_secret";
process.env.FEISHU_APP_TOKEN = "test_app_token";
process.env.FEISHU_TABLE_IDS = "tbl1,tbl2,tbl3,tbl4,tbl5";
process.env.FEISHU_TABLE_KINDS = "writings,works,videos,courses,abouts";

const test = (await import("node:test")).test;
const assert = (await import("node:assert/strict")).default;

const {
  pickLocalized,
  attachmentMeta,
  normalizeWriting,
  normalizeWork,
  normalizeVideo,
  normalizeCourse,
  normalizeAbout,
} = await import("./sync-feishu.mjs");

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

test("normalizeAbout includes updatedAt field", () => {
  const records = [
    { fields: { key: "about", title_zh: "Test", body_zh: "body", updatedAt: "2026-05-01" } },
  ];
  const result = normalizeAbout(records);
  assert.equal(result.updatedAt, "2026-05-01");
});