#!/usr/bin/env node
// 把 og-src/*.svg 光栅化成 public/og/*.png（1200×630）。
//
// 只在本地/开发机跑：macOS 的 qlmanage + sips 是唯一无依赖的光栅化链路，
// CI（Linux）跑不了，所以产物 public/og/*.png 必须随代码一起提交。
//
//   node scripts/build-og.mjs
//
// 画布约定：源 SVG 一律画成 1200×1200，1200×630 的画面垂直居中
// （y = 285 .. 915）。qlmanage 只能输出正方形缩略图，最后用 sips 居中裁回。

import { execFileSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

const ROOT = path.resolve(import.meta.dirname, "..");
const SRC_DIR = path.join(ROOT, "og-src");
const OUT_DIR = path.join(ROOT, "public", "og");
const SIZE = 1200;

function run(cmd, args) {
  return execFileSync(cmd, args, { encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] });
}

function listSvgs() {
  if (!fs.existsSync(SRC_DIR)) return [];
  return fs
    .readdirSync(SRC_DIR)
    .filter((f) => f.endsWith(".svg"))
    .sort();
}

function rasterize(svgPath, outPath) {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "og-"));
  try {
    run("qlmanage", ["-t", "-s", String(SIZE), "-o", tmp, svgPath]);
    const produced = fs.readdirSync(tmp).find((f) => f.endsWith(".png"));
    if (!produced) throw new Error(`qlmanage 没有产出 PNG：${svgPath}`);
    const square = path.join(tmp, produced);

    // 居中裁回 1200×630（qlmanage 输出的是正方形）
    run("sips", ["-c", "630", "1200", square, "--out", outPath]);
  } finally {
    fs.rmSync(tmp, { recursive: true, force: true });
  }
}

const files = listSvgs();
if (files.length === 0) {
  console.log("og-src/ 下没有 .svg，跳过。");
  process.exit(0);
}

fs.mkdirSync(OUT_DIR, { recursive: true });

for (const file of files) {
  const name = path.basename(file, ".svg");
  const out = path.join(OUT_DIR, `${name}.png`);
  rasterize(path.join(SRC_DIR, file), out);
  const kb = (fs.statSync(out).size / 1024).toFixed(1);
  console.log(`✓ public/og/${name}.png  (${kb} KB)`);
}

console.log(`\n完成：${files.length} 张 OG 图 → public/og/`);
