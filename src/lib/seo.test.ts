// src/lib/seo.test.ts
import { test } from "node:test";
import assert from "node:assert/strict";
import { absoluteUrl, pageSeo, workLd, SITE_URL } from "./seo";

/**
 * 回归：文件名带空格的封面（如 `image 20260510111054.jpg`）。
 * 不编码的话 og:image / twitter:image 会变成非法 URL，社交平台拉不到图，
 * 分享卡片直接裂 —— 而 `<img src>` 那条路早就修了，只修一边等于没修。
 */
const SPACE_COVER = "uploads/works/finance-crm/image 20260510111054.jpg";

test("absoluteUrl 编码路径里的空格", () => {
  assert.equal(
    absoluteUrl("/" + SPACE_COVER),
    `${SITE_URL}/uploads/works/finance-crm/image%2020260510111054.jpg`,
  );
});

test("absoluteUrl 不会二次编码已有的 %XX", () => {
  // encodeURI 会把 % 编成 %25，%20 变 %2520 就坏了
  assert.equal(
    absoluteUrl("/uploads/a%20b.jpg"),
    `${SITE_URL}/uploads/a%20b.jpg`,
  );
});

test("absoluteUrl 放行绝对 URL", () => {
  assert.equal(absoluteUrl("https://example.com/a b.jpg"), "https://example.com/a b.jpg");
});

test("absoluteUrl 空值退回站点根", () => {
  assert.equal(absoluteUrl(undefined), `${SITE_URL}/`);
  assert.equal(absoluteUrl(""), `${SITE_URL}/`);
});

test("pageSeo 的 og:image / twitter:image 里没有裸空格", () => {
  const { meta } = pageSeo({
    path: "/work/finance-crm",
    title: "金融客户管理CRM",
    description: "一个独立开发作品，测试描述文字足够长以便通过长度校验。",
    image: SPACE_COVER,
  });
  const og = meta.find((m) => m.property === "og:image");
  const tw = meta.find((m) => m.name === "twitter:image");
  assert.ok(og, "应输出 og:image");
  assert.ok(tw, "应输出 twitter:image");
  assert.ok(!og.content!.includes(" "), `og:image 不该含裸空格：${og.content}`);
  assert.ok(!tw.content!.includes(" "), `twitter:image 不该含裸空格：${tw.content}`);
  assert.ok(og.content!.endsWith("image%2020260510111054.jpg"));
});

test("workLd 的 image 字段里没有裸空格", () => {
  const ld = workLd(
    { slug: "finance-crm", title: "金融客户管理CRM", description: "作品描述" } as never,
    "/work/finance-crm",
    SPACE_COVER,
  );
  const images = ld.image as string[];
  assert.ok(Array.isArray(images));
  assert.ok(
    images.every((u) => !u.includes(" ")),
    `JSON-LD image 不该含裸空格：${JSON.stringify(images)}`,
  );
});
