# qiang_mycreativehub_md → 飞书 Bitable 内容迁移设计

**日期**：2026-09-28
**目标项目**：`/Users/qiangs/Documents/Qiangs_code/Superme/qiang_mycreativehub_md`
**模式参考**：`/Users/qiangs/Documents/Qiangs_code/personal-site`

---

## 1. 背景与目标

### 现状

qiang_mycreativehub_md 当前用本地 Markdown 文件（`src/content/{writing,work,videos,courses,about}/*.md`）+ 自写 frontmatter parser + `import.meta.glob` 构建时加载，把内容渲染成静态站点。

### 目标

把内容来源从本地 Markdown 迁移到飞书多维表格（Bitable），让作者在飞书 UI 直接编辑，无需碰代码与 git。参考 personal-site 已成熟的 sync-feishu.mjs 模式。

### 范围

- ✅ 4 类内容迁飞书：writings / works / videos / courses（加 abouts 1 张，共 5 张表）
- ✅ 保留栈：Vite + React + TanStack Router（不迁 Next.js）
- ✅ 不做中英双语 UI（但飞书表用 `_zh`/`_en` 字段预留）
- ❌ 不做内容反向同步（飞书 → md，本地 md 完全废弃）
- ❌ 不改 news/rss 链路（保留 `scripts/fetch-rss.mjs` + `rss-data.json`）

---

## 2. 架构

```
作者在飞书 Bitable 编辑（5 张 digiwild 表）
  ↓
scripts/sync-feishu.mjs（Node ESM）
  ├─ tenant_access_token 鉴权 + 内存缓存
  ├─ listRecords 翻页拉取每张表（page_size=500）
  ├─ normalize 产出体：_zh/_en 双语合并为单语 title/body
  ├─ marked 转 bodyMarkdown → bodyHtml
  ├─ 下载封面附件到 public/uploads/{kind}/{slug}/{file}
  └─ sha256 diff 后写 data/{writing,work,videos,courses,about}.json
  ↓
src/lib/data.ts
  ├─ zod schema 强校验（WritingSchema/WorkSchema/VideoSchema/CourseSchema/AboutSchema）
  ├─ 静态 import data/*.json（Vite tree-shake）
  └─ 暴露 loadWritings/loadWorks/loadVideos/loadCourses + findBySlug + loadAbout
  ↓
React 组件 + TanStack Router
  ↓
vite build（prebuild 自动跑 sync-feishu.mjs）
  ↓
GitHub Pages 静态站
```

---

## 3. 飞书 5 张表 schema

### 公共约定

- 所有表都用 `slug` 作主键（正则 `^[a-z0-9-]+$`），构建期被读为路由 slug
- `status` 控制可见性：`published`/`active` 才进生产构建
- `body` 全部走多行文本（Markdown）；sync 脚本用 marked 转 HTML 落到 data/*.json
- 封面字段（cover/thumbnail）= 飞书附件；sync 时下载到 `public/uploads/{kind}/{slug}/`，URL 重写为 `/uploads/...`
- 核心字段一律 `_zh`/`_en` 双语后缀（writings 与 personal-site Articles 对齐）

### 3.1 writings 表 `tblhAtZrGqOp1WJe`（16 字段）

| 字段 | 类型 | 必填 | 备注 |
|---|---|---|---|
| slug | text | ✓ | regex `^[a-z0-9-]+$` |
| title_zh / title_en | text | ✓ / 空 | en 空则回退 zh |
| excerpt_zh / excerpt_en | text | – | |
| body_zh / body_en | text | – | Markdown |
| date | datetime | ✓ | yyyy-MM-dd |
| publishedAt | datetime | – | yyyy-MM-dd，构建时排序 |
| tag | select(单选) | – | 文章分类 |
| tags | select(多选) | – | 细分标签 |
| readTime | text | – | "8 min" |
| cover | attachment | – | 封面图 |
| status | select(单选) | – | draft/published/archived，默认 draft |
| featured | checkbox | – | 首页置顶 |
| updatedAt | updated_at | – | 系统时间 |

### 3.2 works 表 `tblohFvGJWDtx6wV`（17 字段）

通用字段同 writings，去除 readTime/tags/featured/featured；加：

- `stack` select(多选) 技术栈
- `link` text(url) 项目链接
- `order` number 排序（asc）
- `status` 改为 active/archived（默认 active）

### 3.3 videos 表 `tblCAvJrw9yvN3qY`（19 字段）

works 通用字段 +：

- `platform` select(单选) 发布平台
- `duration` text 时长
- `views` text 播放量（"32 万播放"）
- `videoUrl` text(url) 视频链接

`status` 同 writings（draft/published）

### 3.4 courses 表 `tblrdoCjWQZSquL7`（23 字段）

works 通用字段 +：

- `price` text 售价
- `original` text 原价
- `students` text 学员数
- `features` select(多选) 课程特色
- `primary` checkbox 主推课程
- `badge` text 角标文字
- `cta` text 按钮文案
- `url` text(url) 购买链接

### 3.5 abouts 表 `tblJHfKpqS5dAGB8`（9 字段，单条记录）

| 字段 | 类型 | 备注 |
|---|---|---|
| key | text | 固定 "about" |
| title_zh / title_en | text | |
| excerpt_zh / excerpt_en | text | |
| body_zh / body_en | text | Markdown |
| cover | attachment | |
| updatedAt | updated_at | 系统时间 |

sync 时取按 `updatedAt` 倒序第一条；多条时打印 warning 但仍用第一条。

---

## 4. sync 脚本（`scripts/sync-feishu.mjs`）

### 4.1 环境变量

```
FEISHU_APP_ID=cli_xxx
FEISHU_APP_SECRET=xxx
FEISHU_APP_TOKEN=IjLnbCNkIaaJvjsEbAjc8XiEnYb
FEISHU_TABLE_IDS=tblhAtZrGqOp1WJe,tblohFvGJWDtx6wV,tblCAvJrw9yvN3qY,tblrdoCjWQZSquL7,tblJHfKpqS5dAGB8
FEISHU_TABLE_KINDS=writings,works,videos,courses,abouts
```

`TABLE_IDS` 与 `TABLE_KINDS` 必须等长同序。

### 4.2 模块

- `getToken()`：tenant_access_token + 内存缓存
- `listRecords(token, tableId)`：翻页 page_size=500
- `normalizeWriting/Work/Video/Course(record)`：合并 `_zh`/`_en` → 单语 `title`/`body`/`excerpt`
- `normalizeAbout(records)`：单条，按 updatedAt desc 取首条
- `renderMarkdown(md)`：marked.parse + convertObsidianImages（保留 `![[...]]` 语法）
- `downloadAttachment(url, out)`：缓存已存在跳过
- `writeIfChanged(file, data)`：sha256 对比，无变化不写
- 启动时调 `+field-list` 缓存 `{name: id}` 映射，写 cell value 用 name

### 4.3 状态过滤

- writings/videos/courses：`status === "published"`
- works：`status === "active"`
- abouts：取最新一条（按 updatedAt desc）

### 4.4 错误处理

| 场景 | 行为 |
|---|---|
| env 缺失 | 立即 exit(2) |
| token 拉取失败 | 重试 1 次后抛错 |
| 单条记录缺 `slug` | warning 跳过该条 |
| 单条 normalize zod 校验失败 | warning 打印 errors 跳过该条 |
| 附件下载失败 | warning 跳过该附件 |
| listRecords 翻页 has_more 异常 | 抛错，避免只同步到一半 |

### 4.5 输出

- `data/writings.json` → `{ writings: [...] }`
- `data/works.json` → `{ works: [...] }`
- `data/videos.json` → `{ videos: [...] }`
- `data/courses.json` → `{ courses: [...] }`
- `data/about.json` → 单对象 `{ key, excerpt, bodyMarkdown, bodyHtml, cover, updatedAt }`
- `public/uploads/{kind}/{slug-or-key}/{filename}`：封面附件

---

## 5. 数据加载层（`src/schemas/content.ts` + `src/lib/data.ts`）

### 5.1 `src/schemas/content.ts`

5 个 zod schema + z.infer 推导 5 个 TS 类型：

```ts
WritingSchema, WorkSchema, VideoSchema, CourseSchema, AboutSchema
type Writing, Work, Video, Course, About
```

字段对应 normalize 后的单语结构：`title`、`bodyMarkdown`、`bodyHtml`、`excerpt`、`slug`、`date`、`cover` 等。

### 5.2 `src/lib/data.ts`

```ts
import writings from '@/data/writings.json'
// ... 其他 4 张
import { WritingSchema, ... } from '@/schemas/content'

const writingsArr = z.array(WritingSchema).parse(writings.writings)
// ... 其他 4 个

export const loadWritings = () => writingsArr.filter(w => w.status === 'published').sort(byDate)
export const loadWorks    = () => worksArr.filter(w => w.status === 'active').sort(byOrder)
export const loadVideos   = () => videosArr.filter(v => v.status === 'published').sort(byDate)
export const loadCourses  = () => coursesArr.filter(c => c.status === 'published').sort(byOrder)
export const loadAbout    = () => aboutData

export const findWriting = (slug) => writingsArr.find(w => w.slug === slug)
export const findWork    = (slug) => worksArr.find(w => w.slug === slug)
export const findVideo   = (slug) => videosArr.find(v => v.slug === slug)
export const findCourse  = (slug) => coursesArr.find(c => c.slug === slug)
```

---

## 6. 组件改造

| 文件 | 改动 |
|---|---|
| `src/components/Writing.tsx` | `writingEntries` → `loadWritings()`；`meta.title` → `title` |
| `src/components/Work.tsx` | 同 |
| `src/components/Videos.tsx` | 同 |
| `src/components/Courses.tsx` | 同 |
| `src/routes/writing.$slug.tsx` | `findEntry(writingEntries, slug)` → `findWriting(slug)` |
| `src/routes/work.$slug.tsx` | 同 |
| `src/routes/videos.$slug.tsx` | 同 |
| `src/routes/about.tsx` | `aboutEntries` → `loadAbout()` |

---

## 7. 删除与新增

### 删除（git 历史保留）

- `src/lib/content.ts`
- `src/content/writing/*.md`（8 个）
- `src/content/work/*.md`（3 个）
- `src/content/videos/*.md`（3 个）
- `src/content/courses/*.md`（4 个）
- `src/content/about/about.md`

### 保留

- `src/content/news/rss-data.json` + `scripts/fetch-rss.mjs`（RSS 链路独立）

### 新增

- `scripts/sync-feishu.mjs`
- `src/schemas/content.ts`
- `src/lib/data.ts`
- `data/{writings,works,videos,courses,about}.json`（初始空占位 `{writings:[]}`）
- `.github/workflows/sync-feishu.yml`

---

## 8. 部署 & 同步

### 8.1 `package.json` 脚本

```json
{
  "scripts": {
    "dev": "vite dev",
    "build": "vite build",
    "prebuild": "node scripts/sync-feishu.mjs",
    "sync:feishu": "node scripts/sync-feishu.mjs",
    "fetch-rss": "node scripts/fetch-rss.mjs"
  }
}
```

`vite build` 通过 prebuild 自动跑 sync，云端永远拿最新内容。

### 8.2 GitHub Actions：`.github/workflows/sync-feishu.yml`

```yaml
name: sync-feishu
on:
  schedule: [{ cron: "*/30 * * * *" }]
  workflow_dispatch:
jobs:
  sync:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: '24' }
      - run: node scripts/sync-feishu.mjs
        env:
          FEISHU_APP_ID: ${{ secrets.FEISHU_APP_ID }}
          FEISHU_APP_SECRET: ${{ secrets.FEISHU_APP_SECRET }}
          FEISHU_APP_TOKEN: ${{ secrets.FEISHU_APP_TOKEN }}
          FEISHU_TABLE_IDS: ${{ secrets.FEISHU_TABLE_IDS }}
          FEISHU_TABLE_KINDS: ${{ secrets.FEISHU_TABLE_KINDS }}
      - uses: stefanzweifel/git-auto-commit-action@v5
        with:
          commit_message: "chore: sync from feishu bitable"
          file_pattern: "data/*.json public/uploads/**/*"
```

每 30 分钟 cron 同步（与 personal-site 一致）；也支持手动触发。

### 8.3 本地开发体验

- `npm run dev` 不跑 sync（避免无 secrets 报错）
- 首次 dev 时如 `data/*.json` 为空占位，UI 显示空列表（不报错）
- 需预览真实内容时：`FEISHU_APP_ID=... npm run sync:feishu && npm run dev`

---

## 9. 数据流 & source of truth

```
飞书 Bitable（source of truth）
  ↓ sync-feishu.mjs（prebuild + cron 30min）
data/*.json（git-committed cache）+ public/uploads/（git-committed）
  ↓ src/lib/data.ts（zod parse + 暴露）
React 组件（只读）
```

飞书 Bitable 是唯一 source of truth；本地 data/*.json + public/uploads/ 是缓存（提交 git 保证 dev 不需 secrets）。

---

## 10. 回滚策略

| 故障场景 | 恢复方式 |
|---|---|
| 飞书 API 挂了 | sync 失败 → prebuild 失败 → build 失败 → 旧站点不受影响 |
| `data/*` 文件破坏 | `git revert` 上一条 sync commit |
| 整张表被误删 | 启用飞书 Bitable「变更历史」 + 定期 backup to another base |
| 单条记录错误 | 飞书 UI 直接改 → 等下次 sync → 自动修复 |
| `scripts/sync-feishu.mjs` bug | `git revert` 同步脚本 + 重 deploy |

本地 `src/content/*.md` 在 git 历史中完整保留（仅删除 working tree），任何回滚都能 100% 恢复旧行为。

---

## 11. 验证清单（迁移完成时跑一次）

- [ ] `npm run sync:feishu` 成功后 `data/*.json` 内容齐全
- [ ] `npm run build` 跑通无 TS/zod 错误
- [ ] 站点 `/writing/sold-my-saas` 渲染出原文（带封面/正文）
- [ ] 站点 `/work/finance-crm` 渲染出 work 卡片（含 cover）
- [ ] 站点 `/about` 显示 about.md 全文
- [ ] GitHub Actions sync workflow 跑一次成功
- [ ] 部署到 GitHub Pages 后线上内容 = 飞书最新内容

---

## 12. 决策记录（关键抉择）

| 决策点 | 选择 | 理由 |
|---|---|---|
| 改造深度 | 仅替换内容来源 | 保留 Vite + React + TanStack Router 栈不变 |
| 内容范围 | 5 类全上飞书 | writings/works/videos/courses + abouts |
| 多语言 | 暂不双语 UI，字段预留 _zh/_en | 与 personal-site Articles 对齐；未来可零成本启用 |
| 本地 md | 完全废弃 | 与飞书数据单一 source of truth |
| 同步时机 | prebuild + cron 30min | 兼顾本地预览与线上新鲜度 |
| Body 字段 | 多行文本存 Markdown | 与现网 .md 一致；改动量最小 |
| 图片附件 | 下载到 public/uploads | 与 personal-site 同模式，静态部署下路径稳定 |
| 数据校验 | Zod schema | qiang_mycreativehub_md 已有 zod 依赖 |
| sync 字段合并 | normalize 时 `_zh`/`_en` 合并为单语 | 简化组件读取；en 留空则回退 zh |

---

## 附录 A：已完成项（2026-09-28）

- ✅ 飞书 5 张 digiwild 表字段 schema 全部写入（84 个字段）
- ✅ 19 条现有内容已迁移到飞书：
  - writings: 8 条（3 条 featured）
  - works: 3 条（active，含 3 张封面）
  - videos: 3 条（published，含 3 张封面）
  - courses: 4 条（published）
  - abouts: 1 条（key=about）
- ✅ 25 条空测试记录已清理