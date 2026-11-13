import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { Prose } from "@/components/Prose";
import { findCourse, loadCourses, neighbours } from "@/lib/data";
import { pageSeo, courseLd, ldOne } from "@/lib/seo";

export const Route = createFileRoute("/courses/$slug")({
  loader: ({ params }) => {
    const entry = findCourse(params.slug);
    if (!entry) throw notFound();
    return entry;
  },
  head: ({ loaderData }) => {
    if (!loaderData) return {};
    const entry = loaderData;
    const path = `/courses/${entry.slug}`;
    const price = entry.price ? `，价格 ${entry.price}` : "";
    return pageSeo({
      path,
      title: `${entry.title} — 价格与大纲 · 数字旷野`,
      description:
        entry.excerpt ??
        `${entry.title}${price}。数字旷野亲手做的课程，附章节大纲与报名入口。`,
      image: entry.cover,
      jsonLd: ldOne(courseLd(entry, path, entry.cover)),
      keywords: ["独立开发课程", "在线课程", entry.tag].filter(Boolean),
    });
  },
  notFoundComponent: () => (
    <section className="mx-auto max-w-3xl px-6 py-24 text-center">
      <h1 className="font-display text-4xl">未找到这门课程</h1>
      <Link to="/courses" className="mt-6 inline-block font-mono text-xs text-primary">
        ← 回到 Courses
      </Link>
    </section>
  ),
  component: CourseDetail,
});

function CourseDetail() {
  const entry = Route.useLoaderData();
  const { bodyHtml, slug } = entry;
  const { prev, next } = neighbours(loadCourses(), slug);

  return (
    <article className="mx-auto max-w-5xl px-6 py-16 md:py-24">
      <Link
        to="/courses"
        className="inline-flex items-center gap-2 font-mono text-xs text-muted-foreground transition-colors hover:text-primary"
      >
        ← Courses
      </Link>

      <header className="mt-8 rounded-[2rem] border border-hairline bg-surface/40 p-8 md:p-10">
        <div className="flex flex-wrap items-center gap-3 font-mono text-xs text-muted-foreground">
          <span className="text-primary">Course</span>
          {entry.tag && (
            <>
              <span className="h-px w-6 bg-hairline" />
              <span>{entry.tag}</span>
            </>
          )}
          {entry.badge && (
            <>
              <span className="h-px w-6 bg-hairline" />
              <span className="rounded-full bg-primary/10 px-2.5 py-1 text-[10px] uppercase tracking-wider text-primary">
                {entry.badge}
              </span>
            </>
          )}
        </div>

        <h1 className="mt-6 font-display text-balance text-4xl font-light leading-[1.05] tracking-tight md:text-6xl">
          {entry.title}
        </h1>

        {entry.excerpt && (
          <p className="mt-6 max-w-2xl text-lg leading-relaxed text-muted-foreground">
            {entry.excerpt}
          </p>
        )}

        <div className="mt-8 flex flex-wrap items-center gap-3">
          <div className="flex items-baseline gap-3">
            <span className="font-display text-4xl text-foreground">{entry.price || "咨询"}</span>
            {entry.original && (
              <span className="font-mono text-sm text-muted-foreground line-through">
                {entry.original}
              </span>
            )}
          </div>
          {entry.url ? (
            <a
              href={entry.url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-medium text-primary-foreground transition-transform hover:-translate-y-0.5"
            >
              {entry.cta ?? "立即报名"} →
            </a>
          ) : (
            <Link
              to="/courses/pay"
              search={{ slug }}
              className="inline-flex items-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-medium text-primary-foreground transition-transform hover:-translate-y-0.5"
            >
              {entry.cta ?? "立即报名"} →
            </Link>
          )}
          <Link
            to="/courses"
            className="inline-flex items-center gap-2 rounded-full border border-hairline px-5 py-2.5 text-sm font-medium text-foreground transition-colors hover:border-primary/40 hover:bg-background"
          >
            返回课程列表
          </Link>
        </div>
      </header>

      <div className="mt-12 grid grid-cols-1 gap-12 lg:grid-cols-12">
        <div className="lg:col-span-7">
          <div className="rounded-[2rem] border border-hairline bg-background p-6 md:p-10">
            <Prose html={bodyHtml} />
          </div>

          {entry.features && (
            <div className="mt-8 rounded-[2rem] border border-hairline bg-surface/30 p-6 md:p-8">
              <div className="mb-5 font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
                课程包含
              </div>
              <ul className="space-y-3">
                {entry.features.map((f: string) => (
                  <li key={f} className="flex items-start gap-3 text-sm text-foreground/90">
                    <span className="mt-1.5 inline-block h-1.5 w-1.5 rounded-full bg-primary" />
                    {f}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        <aside className="lg:col-span-5">
          <div className="sticky top-28 space-y-4">
            <div className="rounded-[2rem] border border-hairline bg-surface/40 p-8">
              <div className="mb-4 font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
                立即加入
              </div>
              <div className="flex items-baseline gap-3">
                <span className="font-display text-5xl text-foreground">{entry.price || "咨询"}</span>
                {entry.original && (
                  <span className="font-mono text-sm text-muted-foreground line-through">
                    {entry.original}
                  </span>
                )}
              </div>

              {entry.url ? (
                <a
                  href={entry.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-full bg-primary px-5 py-3.5 text-sm font-medium text-primary-foreground transition-transform hover:-translate-y-0.5"
                >
                  {entry.cta ?? "立即报名"} →
                </a>
              ) : (
                <Link
                  to="/courses/pay"
                  search={{ slug }}
                  className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-full bg-primary px-5 py-3.5 text-sm font-medium text-primary-foreground transition-transform hover:-translate-y-0.5"
                >
                  {entry.cta ?? "立即报名"} →
                </Link>
              )}
              <p className="mt-4 text-center font-mono text-[10px] text-muted-foreground">
                30 天无理由退款保障
              </p>
            </div>
          </div>
        </aside>
      </div>

      <section className="mt-10 rounded-[2rem] border border-hairline bg-surface/30 p-6 md:p-8">
        <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div>
            <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
              Continue Exploring
            </div>
            <h2 className="mt-3 font-display text-2xl font-normal text-foreground md:text-3xl">
              喜欢这门课的话，也可以看看其他课程。
            </h2>
          </div>
          <Link
            to="/courses"
            className="inline-flex items-center gap-2 font-mono text-xs text-muted-foreground transition-colors hover:text-primary"
          >
            查看全部课程 →
          </Link>
        </div>
      </section>

      <nav className="mt-20 grid grid-cols-1 gap-4 border-t border-hairline pt-10 md:grid-cols-2">
        {prev ? (
          <Link
            to="/courses/$slug"
            params={{ slug: prev.slug }}
            className="group flex flex-col gap-1 rounded-2xl border border-hairline p-5 transition-colors hover:border-primary/40 hover:bg-surface"
          >
            <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
              ← 上一门
            </span>
            <span className="font-display text-lg leading-snug text-foreground transition-colors group-hover:text-primary">
              {prev.title}
            </span>
          </Link>
        ) : (
          <div />
        )}
        {next ? (
          <Link
            to="/courses/$slug"
            params={{ slug: next.slug }}
            className="group flex flex-col gap-1 rounded-2xl border border-hairline p-5 text-right transition-colors hover:border-primary/40 hover:bg-surface"
          >
            <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
              下一门 →
            </span>
            <span className="font-display text-lg leading-snug text-foreground transition-colors group-hover:text-primary">
              {next.title}
            </span>
          </Link>
        ) : (
          <div />
        )}
      </nav>
    </article>
  );
}
