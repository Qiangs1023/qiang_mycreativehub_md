#!/usr/bin/env node
// 逐页断言构建产物：canonical / JSON-LD / H1 / og:image / description / lang。
//
// 这是整个改版的验收闸门 —— 方案里说「肉眼看不到的问题」，靠这个脚本兜底。
//   node scripts/verify-seo.mjs
//
// 退出码非 0 = 有页面不合格。

import fs from "node:fs";
import path from "node:path";

const ROOT = path.resolve(import.meta.dirname, "..");
const DIST = path.join(ROOT, "dist", "client");

if (!fs.existsSync(DIST)) {
  console.error(`找不到构建产物：${DIST}\n先跑 npm run build`);
  process.exit(2);
}

function walk(dir, out = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full, out);
    else if (entry.name.endsWith(".html")) out.push(full);
  }
  return out;
}

const files = walk(DIST).sort();

const countAll = (html, re) => (html.match(re) ?? []).length;
const attr = (html, re) => {
  const m = html.match(re);
  return m ? m[1] : undefined;
};

/**
 * 检测 <a> 套 <a>。
 * 先剥掉注释与 <script> 内容（JSON-LD 里的字符串不该干扰判断）。
 */
function hasNestedAnchor(html) {
  const stripped = html
    .replace(/<!--[\s\S]*?-->/g, "")
    .replace(/<script\b[\s\S]*?<\/script>/gi, "");
  const re = /<(\/?)a\b([^>]*)>/gi;
  let depth = 0;
  let m;
  while ((m = re.exec(stripped)) !== null) {
    if (m[1] === "/") {
      depth = Math.max(0, depth - 1);
      continue;
    }
    if (/\/\s*$/.test(m[2])) continue; // 自闭合
    depth += 1;
    if (depth > 1) return true;
  }
  return false;
}

const rows = [];
const failures = [];

for (const file of files) {
  const html = fs.readFileSync(file, "utf8");
  const route = "/" + path.relative(DIST, file).replace(/index\.html$/, "").replace(/\/$/, "");
  const routeLabel = route === "/" ? "/" : route;

  const canonicals = [...html.matchAll(/<link[^>]*rel="canonical"[^>]*href="([^"]*)"/g)].map((m) => m[1]);
  const ldCount = countAll(html, /type="application\/ld\+json"/g);
  const h1Count = countAll(html, /<h1[\s>]/g);
  const ogImage = attr(html, /property="og:image"[^>]*content="([^"]*)"/);
  const ogUrl = attr(html, /property="og:url"[^>]*content="([^"]*)"/);
  const desc = attr(html, /name="description"[^>]*content="([^"]*)"/);
  const title = attr(html, /<title>([^<]*)<\/title>/);
  const lang = attr(html, /<html[^>]*lang="([^"]*)"/);
  const twitterCard = attr(html, /name="twitter:card"[^>]*content="([^"]*)"/);
  const noindex = /name="robots"[^>]*content="[^"]*noindex/.test(html);

  const problems = [];

  // canonical 必须恰好 1 个，且和页面路径一致（父路由泄漏会变成 2 个）
  if (canonicals.length !== 1) {
    problems.push(`canonical 数量=${canonicals.length}（应为 1）${canonicals.length > 1 ? ` → ${canonicals.join(" , ")}` : ""}`);
  } else if (canonicals[0] !== `https://digiwild.cc${routeLabel === "/" ? "/" : routeLabel}`) {
    problems.push(`canonical 指向错误：${canonicals[0]}`);
  }

  // og:url 必须和 canonical 一致
  if (ogUrl && canonicals.length === 1 && ogUrl !== canonicals[0]) {
    problems.push(`og:url 与 canonical 不一致：${ogUrl}`);
  }

  // 每页恰好 1 个 H1
  if (h1Count !== 1) {
    problems.push(`H1 数量=${h1Count}（应为 1）`);
  }

  // 结构化数据：noindex 的交易页可以没有
  if (!noindex && ldCount < 1) {
    problems.push("缺少 JSON-LD");
  }

  // 404 页是静态兜底文件，不是路由，不参与路由级断言
  if (routeLabel === "/404.html") {
    rows.push({ route: routeLabel, canonical: "—", ld: 0, h1: h1Count, og: "—", desc: "—", problems: [] });
    continue;
  }

  // og:image
  if (!ogImage) {
    problems.push("缺少 og:image");
  }

  // description 长度（noindex 页不参与 —— 它本来就不进搜索结果）
  if (!desc) {
    problems.push("缺少 description");
  } else if (!noindex && desc.length < 30) {
    problems.push(`description 过短（${desc.length} 字符）`);
  } else if (desc.length > 170) {
    problems.push(`description 过长（${desc.length} 字符）`);
  }

  // title
  if (!title) {
    problems.push("缺少 title");
  }

  // lang
  if (lang !== "zh-CN") {
    problems.push(`lang=${lang}（应为 zh-CN）`);
  }

  // twitter:card
  if (!twitterCard) {
    problems.push("缺少 twitter:card");
  }

  // 不该出现的模板残留
  if (/content="Lovable"/.test(html) || /content="@Lovable"/.test(html)) {
    problems.push("仍有 Lovable 模板残留");
  }

  // 假数字
  const fakeNumbers = ["12k", "12,000", "5,000+", "48 篇", "32 万播放", "12 万播放", "8.4 万播放"];
  for (const fake of fakeNumbers) {
    if (html.includes(fake)) problems.push(`出现疑似失真数字：${fake}`);
  }

  // 嵌套 <a> —— 非法 HTML。
  // 浏览器解析器遇到 <a> 套 <a> 会自动拆开外层 <a>，客户端 DOM 与 React 预期不一致
  // → hydration 失败（React #418）→ 整棵树在客户端重建
  // → framer-motion 的 initial opacity:0 永远不解除 → 首屏整块隐形。
  // 这个后果极严重，但产物 HTML 看着完全正常，只能靠断言兜住。
  if (hasNestedAnchor(html)) {
    problems.push("存在嵌套 <a>（非法 HTML，会导致 hydration 失败 + 首屏隐形）");
  }

  rows.push({
    route: routeLabel,
    canonical: canonicals.length === 1 ? "1" : String(canonicals.length),
    ld: ldCount,
    h1: h1Count,
    og: ogImage ? "✓" : "✗",
    desc: desc ? `${desc.length}` : "—",
    problems,
  });

  if (problems.length) failures.push({ route: routeLabel, problems });
}

// ---------- sitemap 与产物一致性 ----------
const sitemapPath = path.join(DIST, "sitemap.xml");
let sitemapIssues = [];
if (fs.existsSync(sitemapPath)) {
  const sitemap = fs.readFileSync(sitemapPath, "utf8");
  const locs = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);
  const builtRoutes = new Set(rows.map((r) => r.route));
  for (const loc of locs) {
    const p = new URL(loc).pathname;
    const normalized = p === "/" ? "/" : p.replace(/\/$/, "");
    if (!builtRoutes.has(normalized)) {
      sitemapIssues.push(`sitemap 里的 ${loc} 没有对应的 HTML 产物`);
    }
  }
  // /chat 与 /courses/pay 是有意不进 sitemap 的：前者 noindex，后者是交易页
  const intentionallyExcluded = new Set(["/404.html", "/chat", "/courses/pay"]);
  for (const r of builtRoutes) {
    if (intentionallyExcluded.has(r)) continue;
    const target = `https://digiwild.cc${r === "/" ? "/" : r}`;
    if (!locs.includes(target)) sitemapIssues.push(`${r} 有页面但不在 sitemap 里`);
  }
} else {
  sitemapIssues.push("缺少 sitemap.xml");
}

// ---------- 输出 ----------
const pad = (s, n) => String(s).padEnd(n);
console.log(
  `\n${pad("页面", 42)} ${pad("canonical", 10)} ${pad("JSON-LD", 9)} ${pad("H1", 5)} ${pad("og:image", 9)} ${pad("desc长度", 9)}`,
);
console.log("─".repeat(86));
for (const r of rows) {
  const flag = r.problems.length ? " ✗" : " ✓";
  console.log(
    `${pad(r.route, 42)} ${pad(r.canonical, 10)} ${pad(r.ld, 9)} ${pad(r.h1, 5)} ${pad(r.og, 9)} ${pad(r.desc, 9)}${flag}`,
  );
}

console.log(`\n共 ${rows.length} 个页面`);

if (sitemapIssues.length) {
  console.log("\n── sitemap 一致性 ──");
  for (const issue of sitemapIssues) console.log(`  ✗ ${issue}`);
}

if (failures.length || sitemapIssues.length) {
  console.log("\n── 不合格页面明细 ──");
  for (const f of failures) {
    console.log(`  ${f.route}`);
    for (const p of f.problems) console.log(`    · ${p}`);
  }
  console.log(`\n结果：${failures.length} 个页面不合格，${sitemapIssues.length} 条 sitemap 问题`);
  process.exit(1);
}

console.log("\n结果：全部页面通过 ✓");
