// src/lib/intents.ts
// 「用户意图」入口 —— 首页「你想做什么？」与 /start-here 共用同一份数据，
// 避免两处文案漂移。
//
// 原则：入口文案写用户的目标，不写栏目名。用户不关心「Writing」，只关心「我该从哪开始」。
//
// 路由写法注意：TanStack 的 `to` 只认路由模式，具体路径要用 `/courses/$slug` + params。
// `href` 是给 JSON-LD / 绝对地址用的真实路径。

export type IntentTarget = {
  label: string;
  /** TanStack 路由目标 */
  to: string;
  params?: { slug: string };
  /** 真实路径（用于绝对地址与结构化数据） */
  href: string;
};

export type Intent = {
  /** 序号，01–04 */
  index: string;
  /** 用户意图原话（第一屏就要让人对号入座） */
  title: string;
  /** 一句话说明这条路会得到什么 */
  note: string;
  /** 路径链：按顺序点进去就是一条完整动线 */
  trail: IntentTarget[];
  /** 主 CTA */
  cta: IntentTarget;
};

export const intents = [
  {
    index: "01",
    title: "我想把想法做成能卖的产品",
    note: "从一句话想法，到第一个愿意付钱的人。我把这条路上的真实踩坑写成了课。",
    trail: [
      { label: "路线图", to: "/start-here", href: "/start-here" },
      { label: "做过的产品", to: "/work", href: "/work" },
      {
        label: "独立开发实战课",
        to: "/courses/$slug",
        params: { slug: "indie-dev-bootcamp" },
        href: "/courses/indie-dev-bootcamp",
      },
    ],
    cta: {
      label: "从 0 到 1 实战课 →",
      to: "/courses/$slug",
      params: { slug: "indie-dev-bootcamp" },
      href: "/courses/indie-dev-bootcamp",
    },
  },
  {
    index: "02",
    title: "我想用 AI 管住我的知识和工作流",
    note: "Obsidian 当底座，Agent 当手。这套组合我自己每天在用，课里给的是可直接抄的配置。",
    trail: [
      {
        label: "Obsidian+Agent 课程",
        to: "/courses/$slug",
        params: { slug: "obsidian-agent" },
        href: "/courses/obsidian-agent",
      },
      { label: "工作流复盘", to: "/writing", href: "/writing" },
    ],
    cta: {
      label: "Obsidian+Agent 课程 →",
      to: "/courses/$slug",
      params: { slug: "obsidian-agent" },
      href: "/courses/obsidian-agent",
    },
  },
  {
    index: "03",
    title: "我想做全球贸易",
    note: "选品、渠道、履约、合规 —— 每段都容易卡住。我把自己踩过的坑和正在跑的路径摊开讲，群里一起推。",
    trail: [
      {
        label: "跨境贸易社群",
        to: "/courses/$slug",
        params: { slug: "cross-border-trade-community" },
        href: "/courses/cross-border-trade-community",
      },
      { label: "完整路线图", to: "/start-here", href: "/start-here" },
    ],
    cta: {
      label: "跨境贸易社群 →",
      to: "/courses/$slug",
      params: { slug: "cross-border-trade-community" },
      href: "/courses/cross-border-trade-community",
    },
  },
  {
    index: "04",
    title: "我想看看真实的人怎么做成的",
    note: "长视频里讲的是真事：11 个失败项目、两次差点放弃，以及最后做对的那几件。",
    trail: [
      { label: "深度长视频", to: "/videos", href: "/videos" },
      {
        label: "出镜复盘",
        to: "/videos/$slug",
        params: { slug: "1095-days" },
        href: "/videos/1095-days",
      },
    ],
    cta: { label: "看视频 →", to: "/videos", href: "/videos" },
  },
] as const satisfies readonly Intent[];
