# My Creative Hub

这是一个基于 Jamstack 架构的个人数字花园（作品集、博客、视频聚合展示）。

## 📐 架构设计 (Jamstack + Headless)

本项目采用了前端完全静态化、核心业务后端分离的架构设计。这种设计兼顾了**访问速度**、**零服务器成本**与未来的**商业变现扩展性**。

- **主站展示（当前项目）**：
  - **部署方案**：部署于 GitHub Pages (或其他纯静态托管服务如 Vercel/Netlify)。
  - **内容来源**：纯本地 Markdown 文件，通过 Git 进行版本控制，支持本地无缝写作。
  - **技术栈**：React, Vite, TanStack Router, Tailwind CSS, shadcn/ui。
- **业务系统（未来计划）**：
  - **定位**：独立的“购买课程/付费订阅”页面系统。
  - **部署方案**：部署于你自己的云服务器（配合 Supabase 数据库）。
  - **交互方式**：主站通过外部链接 (`link` 属性) 将用户跳转至业务系统完成支付和消费，通过共享 CSS (Tailwind) 保持无缝的用户体验。

---

## 📝 内容发布工作流

你可以完全在本地的代码编辑器（如 VS Code / Trae）中完成所有内容的发布和管理。

所有的内容都以 Markdown (`.md`) 格式存放在 `src/content/` 目录下：
- `src/content/work/` - 产品与项目
- `src/content/writing/` - 博客文章
- `src/content/videos/` - 视频内容
- `src/content/courses/` - 课程展示
- `src/content/about/` - 关于页面（单文件 `about.md`）
- `src/content/news/` - AI 资讯（RSS 自动拉取，无需手动编辑）

### 1. 发布一篇文章 (Writing)

在 `src/content/writing/` 目录下新建一个 `.md` 文件，例如 `my-new-post.md`：

```markdown
---
title: "我的新文章标题"
date: "2024-05-01"
tag: "思考"
excerpt: "这是一段关于文章内容的简短摘要..."
readTime: "5 min"
---

这里是文章的正文内容，支持**Markdown**语法...
```

### 2. 发布一个课程 (Courses)并链接到独立销售页

在 `src/content/courses/` 目录下新建 `.md` 文件，**注意 `link` 字段**：

```markdown
---
title: "独立开发全栈实战营"
excerpt: "从零到一教你如何用现代技术栈构建并发布自己的 SaaS 产品。"
price: "¥399"
link: "https://你的服务器域名.com/buy/indie-dev-bootcamp"
cta: "立即购买 ↗"
---

课程的详细介绍...
```
*当配置了 `link` 字段后，前端页面上的按钮将自动变为外部跳转链接，指向你的课程销售系统。*

### 3. 修改关于页面 (About)

在 `src/content/about/about.md` 中编辑页面正文内容：

```markdown
---
title: "关于页面标题"
excerpt: "页面简介..."
---

## 第一段标题

正文内容，支持 **Markdown** 语法...

## 第二段标题

更多内容...
```

> 注意：About 页面的左侧区域（Toolbox 技术栈标签）和右侧区域（订阅表单、社交链接）由 React 组件控制，如需修改这些部分请直接编辑 `src/routes/about.tsx`。

### 4. AI 资讯页面 (News)

News 页面会自动从订阅源拉取内容，无需手动维护：

- **订阅源**：`https://ai.hubtoday.app/blog/index.xml`（何夕2077的 AI 资讯）
- **数据文件**：`src/content/news/rss-data.json`（由脚本自动生成）
- **更新时间**：每次构建时自动拉取最新内容；GitHub Actions 每日凌晨 3:30 自动构建并部署

**手动触发更新**

```bash
npm run fetch-rss
```

**修改订阅源**

编辑 `scripts/fetch-rss.mjs`，修改顶部的 `RSS_URL` 变量：

```js
const RSS_URL = "https://你的订阅源地址/index.xml";
```

然后运行：

```bash
npm run fetch-rss
npm run build
```

---

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

**构建静态文件 (用于 GitHub Pages 部署)**
```bash
npm run build
```
*打包后的静态文件将生成在 `dist/` 目录中。*

---

## 🚀 部署到 GitHub Pages (参考步骤)

1. 在你的 GitHub 仓库中，进入 **Settings** -> **Pages**。
2. 将 **Source** 设置为 `GitHub Actions`。
3. 项目根目录已包含 `.github/workflows/deploy.yml`，无需额外创建。
4. 每次 `git push` 后，网站会自动构建并发布到 GitHub Pages。
5. 同时，GitHub Actions 每天凌晨 3:30 会自动触发构建，无需推送也能保持 RSS 内容最新。
