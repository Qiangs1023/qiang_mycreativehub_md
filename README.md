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

所有内容都通过飞书多维表格管理。本项目共 5 张表（base_token `IjLnbCNkIaaJvjsEbAjc8XiEnYb`）：

- **writings** — 博客文章
- **works** — 产品与项目
- **videos** — 视频内容
- **courses** — 课程展示
- **abouts** — 关于页面（单条记录）

### 工作流

1. 在飞书多维表格编辑/新增一条记录
2. 等待 GitHub Actions 自动同步（每 30 分钟）或手动触发
3. 同步脚本自动写入 `data/*.json` + 下载附件到 `public/uploads/`
4. 下一次站点构建读取新数据并部署到 GitHub Pages

### 本地预览

```bash
FEISHU_APP_ID=... FEISHU_APP_SECRET=... \
FEISHU_APP_TOKEN=IjLnbCNkIaaJvjsEbAjc8XiEnYb \
FEISHU_TABLE_IDS=tblhAtZrGqOp1WJe,tblohFvGJWDtx6wV,tblCAvJrw9yvN3qY,tblrdoCjWQZSquL7,tblJHfKpqS5dAGB8 \
FEISHU_TABLE_KINDS=writings,works,videos,courses,abouts \
npm run sync:feishu

npm run dev
```

详细的 Secrets 配置见末尾的「飞书 Bitable 内容同步」章节。

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

---

## 📬 飞书 Bitable 内容同步 (sync-feishu)

本项目使用飞书多维表格管理 writings / works / videos / courses / abouts 五类内容。GitHub Actions 每 30 分钟 cron 同步一次（`.github/workflows/sync-feishu.yml`），本地构建时读取已 commit 的 `data/*.json`。

### 本地预览真实数据

```bash
FEISHU_APP_ID=<your_app_id> \
FEISHU_APP_SECRET=<your_app_secret> \
FEISHU_APP_TOKEN=IjLnbCNkIaaJvjsEbAjc8XiEnYb \
FEISHU_TABLE_IDS=tblhAtZrGqOp1WJe,tblohFvGJWDtx6wV,tblCAvJrw9yvN3qY,tblrdoCjWQZSquL7,tblJHfKpqS5dAGB8 \
FEISHU_TABLE_KINDS=writings,works,videos,courses,abouts \
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
| `FEISHU_TABLE_IDS` | 5 张表 id，逗号分隔 |
| `FEISHU_TABLE_KINDS` | `writings,works,videos,courses,abouts` |

### 手动触发同步

GitHub → Actions → sync-feishu → Run workflow。

### 内容工作流

1. 在飞书 Bitable 编辑/新增记录
2. 等待 30 分钟内自动同步（也可手动触发）
3. PR 自动 commit 到 main，包含 `data/*.json` 和附件
4. 合并后，下一次站点构建读取新数据
