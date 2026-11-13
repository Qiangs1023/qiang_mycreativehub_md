import { createFileRoute, Link } from "@tanstack/react-router";
import { Nav } from "@/components/Nav";
import { Footer } from "@/components/Footer";
import { IntentPaths } from "@/components/IntentPaths";
import { intents } from "@/lib/intents";
import { pageSeo, webPageLd, ldGraph, absoluteUrl } from "@/lib/seo";
import { loadWritings, loadWorks, loadVideos, loadCourses } from "@/lib/data";

const roadmap = [
  {
    step: "STEP 1",
    title: "先看证据，别先看承诺",
    body: "我做过的三个产品都写清楚了：解决什么问题、用了什么技术、现在是什么状态。先看这些，比看自我介绍有用。",
    to: "/work",
    cta: "看做过的产品",
  },
  {
    step: "STEP 2",
    title: "再挑一条和你处境最像的路",
    body: "下面四个入口是按「你现在想解决什么」分的，不是按栏目分的。点进去就是一条完整动线，中间不会迷路。",
    to: "/courses",
    cta: "看课程",
  },
  {
    step: "STEP 3",
    title: "最后动手，把想法变成能销售的东西",
    body: "所有内容最后都指向同一件事：把想法变成能销售的东西。课程里给的是配置和流程，不是道理。",
    to: "/courses/$slug",
    params: { slug: "indie-dev-bootcamp" },
    cta: "从 0 到 1 实战课",
  },
] as const;

const shortcuts = [
  { to: "/writing", label: "写作", desc: "独立开发与 AI 工作流的真实复盘" },
  { to: "/work", label: "作品", desc: "已上线的产品、工具与项目" },
  { to: "/videos", label: "视频", desc: "深度长视频与工作日常 vlog" },
  { to: "/courses", label: "课程", desc: "Obsidian+Agent 人生管理系统、独立开发实战课、跨境贸易社群" },
  { to: "/news", label: "资讯", desc: "精选 AI 行业资讯与工具" },
  { to: "/about", label: "关于", desc: "我是谁，以及怎么找到我" },
] as const;

export const Route = createFileRoute("/start-here")({
  head: () => {
    const writings = loadWritings();
    const works = loadWorks();
    const videos = loadVideos();
    const courses = loadCourses();

    const description = `新访客从这里开始：我是谁、你能拿到什么、以及从哪一步走。当前站内真实内容：${works.length} 个产品、${writings.length} 篇文章、${videos.length} 支视频、${courses.length} 门课。`;

    return pageSeo({
      path: "/start-here",
      title: "从零开始 — 数字旷野",
      description,
      jsonLd: ldGraph([
        webPageLd({
          name: "从零开始 — 数字旷野",
          description,
          path: "/start-here",
        }),
        {
          "@type": "ItemList",
          "@id": "https://digiwild.cc/start-here#paths",
          "name": "从这里开始的四条路径",
          "description":
            "按用户意图分的四个入口：把想法做成产品、用 AI 管住知识工作流、靠写作赚到第一笔钱、看看真实的人怎么做成的。",
          "itemListElement": intents.map((i, index) => ({
            "@type": "ListItem",
            position: index + 1,
            name: i.title,
            url: absoluteUrl(i.cta.href),
          })),
        },
      ]),
      keywords: ["独立开发", "AI 工作流", "从零开始", "个人品牌", "Obsidian"],
    });
  },
  component: StartHere,
});

function StartHere() {
  return (
    <main className="relative min-h-screen pt-20">
      <Nav />

      <article className="mx-auto max-w-4xl px-6 py-16 md:py-24">
        <header className="mb-16">
          <div className="mb-3 font-mono text-xs uppercase tracking-[0.2em] text-primary">
            00 / Start Here
          </div>
          <h1 className="font-display text-balance text-5xl font-light leading-[1.05] tracking-tight md:text-6xl">
            从零开始。
          </h1>
          <p className="mt-6 max-w-2xl text-lg leading-relaxed text-muted-foreground">
            你不需要读完整个站。告诉我你现在卡在哪，我给你一条最短的路径。
          </p>
        </header>

        <section className="mb-16">
          <h2 className="font-display text-2xl font-normal text-foreground md:text-3xl">
            我是谁
          </h2>
          <p className="mt-4 text-base leading-relaxed text-muted-foreground">
            数字旷野，独立开发者、内容创作者。2019 年从大厂离职，一个人做产品、写文章、录视频，
            开的课全部是我自己每天在用的方法论。这个站上的每一个产品、每一篇文章、每一支视频，
            都来自同一件事：用 AI 把想法变成能销售的东西。
          </p>
        </section>
      </article>

      <IntentPaths compact />

      <section className="mx-auto max-w-4xl px-6 py-16 md:py-24">
        <h2 className="font-display text-balance text-3xl font-light tracking-tight md:text-4xl">
          一条完整的三步路线
        </h2>
        <p className="mt-4 max-w-2xl text-base leading-relaxed text-muted-foreground">
          如果你不想自己挑，直接按这三步走。顺序是有原因的：先信证据，再选方向，最后动手。
        </p>

        <ol className="mt-10 space-y-4">
          {roadmap.map((r) => (
            <li
              key={r.step}
              className="rounded-[2rem] border border-hairline bg-surface/40 p-6 md:p-8"
            >
              <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-primary">
                {r.step}
              </div>
              <h3 className="mt-3 font-display text-2xl font-normal leading-snug text-foreground">
                {r.title}
              </h3>
              <p className="mt-3 text-base leading-relaxed text-muted-foreground">{r.body}</p>
              <Link
                to={r.to}
                params={"params" in r ? r.params : undefined}
                className="mt-5 inline-flex items-center gap-2 font-mono text-xs text-muted-foreground transition-colors hover:text-primary"
              >
                {r.cta} →
              </Link>
            </li>
          ))}
        </ol>
      </section>

      <section className="border-t border-hairline bg-surface/30 py-16 md:py-24">
        <div className="mx-auto max-w-6xl px-6">
          <h2 className="font-display text-3xl font-light tracking-tight md:text-4xl">
            或者，直接去某个栏目
          </h2>
          <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {shortcuts.map((s) => (
              <Link
                key={s.to}
                to={s.to}
                className="group rounded-2xl border border-hairline bg-background p-6 transition-colors hover:border-primary/40 hover:bg-surface"
              >
                <h3 className="font-display text-xl font-normal text-foreground transition-colors group-hover:text-primary">
                  {s.label}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{s.desc}</p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <Footer />
    </main>
  );
}
