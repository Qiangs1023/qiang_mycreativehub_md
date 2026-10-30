# My Creative Hub

这是一个基于 Jamstack 架构的个人数字花园（作品集、博客、视频聚合展示）。

## 📐 架构设计 (Jamstack + Headless)

本项目采用了前端完全静态化、核心业务后端分离的架构设计。这种设计兼顾了**访问速度**、**零服务器成本**与未来的**商业变现扩展性**。

- **主站展示（当前项目）**：
  - **部署方案**：部署于 Cloudflare Pages；仓库同时保留 GitHub Pages 工作流作为旧部署路径。
  - **内容来源**：博客文章使用本地 Markdown；作品、视频、课程、关于和动态继续从飞书多维表格同步。
  - **技术栈**：React, Vite, TanStack Router, Tailwind CSS, shadcn/ui。
- **业务系统（未来计划）**：
  - **定位**：独立的“购买课程/付费订阅”页面系统。
  - **部署方案**：部署于你自己的云服务器（配合 Supabase 数据库）。
  - **交互方式**：主站通过外部链接 (`link` 属性) 将用户跳转至业务系统完成支付和消费，通过共享 CSS (Tailwind) 保持无缝的用户体验。

---

## 📝 内容发布工作流

博客文章（writings）以本地 Markdown 为唯一来源，文件保存在 `/Users/qiang/Documents/Agent_Space/digiwild/业务/indie/qiang_mycreativehub_md/content/writings/<slug>.md`。其他内容继续由飞书多维表格管理：

- **works** — 产品与项目
- **videos** — 视频内容
- **courses** — 课程展示
- **abouts** — 关于页面（单条记录）
- **news** — 动态/短内容（同步到 `data/news.json`，站点展示为独立功能待接入）

### 新增或修改博客文章

1. 在 `content/writings/` 新增 `<slug>.md`；文件名必须与 frontmatter 的 `slug` 一致。
2. 填写 `slug`、`title`、`date`、`status` 四个必填字段。
3. 只有 `status: published` 的文章会出现在文章列表和详情页；`draft` 与 `archived` 不会公开访问。
4. 执行 `npm run sync:writings`，脚本会校验元数据、日期、slug、重复项、封面和正文图片，并重新生成 `data/writings.json`。
5. 执行 `npm run test:sync` 和 `npm run build` 完成本地验证。
6. 提交 Markdown 和生成的 `data/writings.json`；push 到 `main` 后触发 Cloudflare Pages 自动部署。

示例：

```md
---
slug: my-post
title: 我的第一篇 Markdown 文章
excerpt: 这是一篇示例文章。
date: 2026-10-30
publishedAt: 2026-10-30
tag: 随笔
tags:
  - 独立开发
readTime: 5 min
cover: uploads/writings/my-post/cover.jpg
status: published
featured: false
---

## 正文

这里写正文。Obsidian 图片可以用 `![[cover.png]]`，同步时会转换成 `/images/cover.png`。
```

本地图片必须存在于 `public/` 对应路径，外链使用 `https://`。同步失败时构建会失败，不会带着旧的 `data/writings.json` 继续发布。

### 本地预览

```bash
npm install
npm run sync:writings
npm run dev
```

## 📬 邮箱订阅功能 (Buttondown)

本项目使用 [Buttondown](https://buttondown.email) 实现 newsletter 订阅功能，完美适配纯静态部署的 GitHub Pages。

### 为什么选择 Buttondown

- **零后端**：不需要任何服务器，完全依赖 Buttondown 处理订阅逻辑
- **免费额度**：支持最多 100 名订阅者，适合独立创作者起步
- **嵌入简单**：只需一个 `<form>` 或加载一段 JS 代码
- **完整功能**：订阅确认邮件、群发、退订管理全部内置

### 工作原理

```
用户填写邮箱 → 提交到 Buttondown API
       ↓
Buttondown 发送确认邮件给用户
       ↓
用户点击确认链接 → 订阅成功
       ↓
你在 Buttondown 写文章 → 一键群发给所有订阅者
```

### 如何启用

**1. 注册 Buttondown**

前往 [buttondown.email](https://buttondown.email) 注册免费账号。

**2. 获取你的订阅入口 URL**

注册后在「Settings」中找到你的订阅者入口 URL，格式为：
```
https://buttondown.email/你的用户名
```

**3. 在站点中嵌入订阅表单**

在 `src/components/Nav.tsx` 中，将“订阅”按钮替换为 Buttondown 订阅表单。参考以下代码结构：

```tsx
// src/components/SubscribeForm.tsx
export function SubscribeForm() {
  return (
    <form
      action="https://buttondown.email/api/emails/embed-subscribe/你的用户名"
      method="post"
      target="popup"
      onSubmit={() => window.open('https://buttondown.email/你的用户名', 'popup', 'width=600,height=600')}
    >
      <input
        type="email"
        name="email"
        placeholder="输入邮箱地址"
        required
        className="rounded-full border border-hairline bg-background px-4 py-2 text-sm"
      />
      <button
        type="submit"
        className="rounded-full bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
      >
        订阅
      </button>
    </form>
  );
}
```

然后在 `Nav.tsx` 的订阅按钮位置引入：
```tsx
import { SubscribeForm } from "@/components/SubscribeForm";

// 将原来的 Link 替换为 SubscribeForm
<SubscribeForm />
```

**4. 发布内容**

在 Buttondown 的编辑器中撰写 newsletter，点击「Send」即可群发给所有订阅者。

---

## 🛠 本地开发与构建

**安装依赖**
```bash
npm install
```

**启动本地开发服务器**
```bash
npm run dev
```

**构建静态文件 (用于 Cloudflare Pages 部署)**
```bash
npm run build
```
*打包后的静态文件将生成在 `dist/` 目录中。*

---

## 🚀 Cloudflare Pages 部署

1. Cloudflare Pages 项目连接 GitHub 仓库，生产分支设为 `main`。
2. 构建命令使用 `npm run build`，输出目录使用 `dist/client`。
3. `npm run build` 会先执行 `npm run sync:writings`，再构建站点；Markdown 校验失败时部署会失败。
4. push 到 `main` 后，Cloudflare Pages 自动构建部署。
5. 仓库中的 `.github/workflows/deploy.yml` 是旧 GitHub Pages 路径；如果 GitHub Pages 仍启用，push 后也会触发一次旧部署。

## 📬 飞书 Bitable 内容同步 (sync-feishu)

本项目使用飞书多维表格管理 works / videos / courses / abouts / news 五类内容。GitHub Actions 每 30 分钟 cron 同步一次（`.github/workflows/sync-feishu.yml`）。`writings` 不再由飞书管理，脚本会显式忽略它，避免和 Markdown 来源互相覆盖。

### 本地预览真实数据

```bash
FEISHU_APP_ID=<your_app_id> \
FEISHU_APP_SECRET=<your_app_secret> \
FEISHU_APP_TOKEN=IjLnbCNkIaaJvjsEbAjc8XiEnYb \
FEISHU_TABLE_IDS=tblohFvGJWDtx6wV,tblCAvJrw9yvN3qY,tblrdoCjWQZSquL7,tblJHfKpqS5dAGB8,tblDXtddeUcpgRUq \
FEISHU_TABLE_KINDS=works,videos,courses,abouts,news \
npm run sync:feishu

npm run dev
```

### 必需的 GitHub Secrets

在仓库 Settings → Secrets and variables → Actions 添加：

| Secret | 来源 |
|---|---|
| `FEISHU_APP_ID` | 飞书开放平台 → 应用 → 凭证 → App ID |
| `FEISHU_APP_SECRET` | 同上 → App Secret |
| `FEISHU_APP_TOKEN` | Base URL: `IjLnbCNkIaaJvjsEbAjc8XiEnYb` |
| `FEISHU_TABLE_IDS` | works、videos、courses、abouts、news 五张表 id，逗号分隔 |
| `FEISHU_TABLE_KINDS` | `works,videos,courses,abouts,news` |

### 手动触发同步

GitHub → Actions → sync-feishu → Run workflow。

### 内容工作流

1. 在飞书 Bitable 编辑或新增 works、videos、courses、abouts、news 记录
2. 等待 30 分钟内自动同步，或手动触发
3. GitHub Actions 自动提交 `data/*.json` 和附件
4. 合并后，下一次站点构建读取新数据
