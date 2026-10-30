# My Creative Hub

这是一个基于 Jamstack 架构的个人数字花园（作品集、博客、视频聚合展示）。

## 📐 架构设计 (Jamstack + Headless)

本项目采用了前端完全静态化、核心业务后端分离的架构设计。这种设计兼顾了**访问速度**、**零服务器成本**与未来的**商业变现扩展性**。

- **主站展示（当前项目）**：
  - **部署方案**：部署于 Cloudflare Pages；仓库同时保留 GitHub Pages 工作流作为旧部署路径。
  - **内容来源**：全部内容使用本地 Markdown，通过 Git 版本控制，同步后自动部署。
  - **技术栈**：React, Vite, TanStack Router, Tailwind CSS, shadcn/ui。
- **业务系统（未来计划）**：
  - **定位**：独立的“购买课程/付费订阅”页面系统。
  - **部署方案**：部署于你自己的云服务器（配合 Supabase 数据库）。
  - **交互方式**：主站通过外部链接 (`link` 属性) 将用户跳转至业务系统完成支付和消费，通过共享 CSS (Tailwind) 保持无缝的用户体验。

---

## 📝 内容发布工作流

全部内容都以本地 Markdown 为唯一来源，统一存放在 `/Users/qiang/Documents/Agent_Space/digiwild/业务/indie/qiang_mycreativehub_md/content/`：

```text
content/
  writings/<slug>.md   博客文章
  works/<slug>.md      产品与项目
  videos/<slug>.md     视频内容
  courses/<slug>.md    课程展示
  news/<slug>.md       动态与资讯
  about.md             关于页面（单文件）
```

飞书同步和 RSS 自动抓取已全部移除。任何外部流程都不会再改写 `data/*.json`。

### 通用规则

1. 每个条目一个 Markdown 文件，文件名必须等于 frontmatter 里的 `slug`。
2. `slug` 只允许小写英文、数字和连字符。
3. `date` 必须是 `YYYY-MM-DD` 格式的有效日期；`publishedAt`、`updatedAt` 可用 `YYYY-MM-DD` 或 ISO 8601。
4. 本地图片和封面必须真实存在于 `public/` 下，且路径不能逃出 `public/`。Obsidian 写法 `![[image.png]]` 会自动转成 `/images/image.png`。
5. 外链只允许 `http://` 或 `https://`。
6. 校验不通过时 `npm run build` 会直接失败，不会带着旧数据发布。

### 各类型的字段和可见性

| 类型     | 必填                                 | 可选                                                                                                                            | 对外可见            |
| -------- | ------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------- | ------------------- |
| writings | `slug` `title` `date` `status`       | `excerpt` `publishedAt` `tag` `tags` `readTime` `cover` `featured`                                                              | `status: published` |
| works    | `slug` `title` `date` `status`       | `excerpt` `publishedAt` `tag` `cover` `stack` `link` `featured` `order`                                                         | `status: active`    |
| videos   | `slug` `title` `date` `status`       | `excerpt` `publishedAt` `tag` `cover` `platform` `duration` `views` `videoUrl` `featured` `order`                               | `status: published` |
| courses  | `slug` `title` `date` `status`       | `excerpt` `publishedAt` `tag` `cover` `price` `original` `students` `features` `primary` `badge` `cta` `url` `featured` `order` | `status: published` |
| news     | `slug` `title` `date` `url` `status` | `updatedAt`                                                                                                                     | `status: published` |
| about    | `title`                              | `excerpt` `cover` `updatedAt`                                                                                                   | 始终可见            |

`draft` 和 `archived` 内容会保留在仓库里，但不会出现在列表页，也无法通过详情页 URL 访问。

### 示例

文章 `content/writings/my-post.md`：

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

这里写正文。
```

项目 `content/works/my-project.md`：

```md
---
slug: my-project
title: 我的项目
excerpt: 一句话介绍。
date: 2026-10-30
status: active
cover: uploads/works/my-project/cover.jpg
stack:
  - TypeScript
  - React
link: https://example.com
featured: false
order: 0
---

## 项目说明
```

视频 `content/videos/my-video.md`：

```md
---
slug: my-video
title: 我的视频
date: 2026-10-30
status: published
cover: uploads/videos/my-video/cover.jpg
platform: B站
duration: 10:00
views: 1 万播放
videoUrl: https://www.bilibili.com/video/BVxxx
featured: false
order: 0
---

## 视频说明
```

课程 `content/courses/my-course.md`：

```md
---
slug: my-course
title: 我的课程
date: 2026-10-30
status: published
price: "¥199"
original: "¥599"
students: 已有 120 位学员
features:
  - 12 周直播课程
  - 一对一项目评审
primary: false
badge: 推荐
cta: 立即报名
url: https://example.com/course
featured: false
order: 0
---

## 课程说明
```

动态 `content/news/my-news.md`：

```md
---
slug: my-news
title: 一条动态
date: 2026-10-30
updatedAt: 2026-10-31
url: https://example.com/post
status: published
---

补充说明。
```

关于页面 `content/about.md`：

```md
---
title: 关于数字旷野
excerpt: 一个人能创造多大的可能性？
updatedAt: 2026-10-30
---

## 我是谁
```

### 本地预览

```bash
npm install
npm run sync:content
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
      onSubmit={() =>
        window.open("https://buttondown.email/你的用户名", "popup", "width=600,height=600")
      }
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
<SubscribeForm />;
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

_打包后的静态文件将生成在 `dist/` 目录中。_

---

## 🚀 Cloudflare Pages 部署

1. Cloudflare Pages 项目连接 GitHub 仓库，生产分支设为 `main`。
2. 构建命令使用 `npm run build`，输出目录使用 `dist/client`。
3. `npm run build` 会先执行 `npm run sync:content`，再构建站点；Markdown 校验失败时部署会失败。
4. push 到 `main` 后，Cloudflare Pages 自动构建部署。
5. 仓库中的 `.github/workflows/deploy.yml` 是旧 GitHub Pages 路径；如果 GitHub Pages 仍启用，push 后也会触发一次旧部署。

## 🗂 已移除的自动化

本项目历史上使用过飞书多维表格定时同步和 RSS 自动抓取，这两条链路都已删除：

- `.github/workflows/sync-feishu.yml` 已删除，GitHub 上每 30 分钟的飞书同步不再运行
- `scripts/sync-feishu.mjs`、`scripts/fetch-rss.mjs` 及相关测试已删除
- `package.json` 中的 `sync:feishu`、`fetch-rss`、`prebuild` 命令已移除
- News 页面不再读取 `src/content/news/rss-data.json`，改为读取 `data/news.json`

GitHub 仓库设置里可能还留有 `FEISHU_*` 相关的 Secrets。新代码不会读取它们，需要时可以在仓库设置里手动删除。

内容回滚方式：用 Git 回退对应的提交即可恢复旧的同步链路。
