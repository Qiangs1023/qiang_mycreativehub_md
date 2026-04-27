import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { Prose } from "@/components/Prose";
import { findEntry, neighbours, writingEntries } from "@/lib/content";

function formatDate(date?: string) {
  if (!date) return "";
  const [y, m, d] = date.split("-");
  return `${y}.${m}.${d}`;
}

function getArticleLength(markdown: string) {
  const plainText = markdown
    .replace(/^---[\s\S]*?---\s*/m, "")
    .replace(/[`*_#[\]()>-]/g, "")
    .replace(/\s+/g, "");

  return plainText.length.toLocaleString("zh-CN");
}

export const Route = createFileRoute("/writing/$slug")({
  loader: ({ params }) => {
    const entry = findEntry(writingEntries, params.slug);
    if (!entry) throw notFound();
    return entry;
  },
  head: ({ loaderData }) => {
    if (!loaderData) return {};
    const m = loaderData.meta;
    return {
      meta: [
        { title: `${m.title} — 数字旷野` },
        { name: "description", content: m.excerpt ?? "" },
        { property: "og:title", content: `${m.title} — 数字旷野` },
        { property: "og:description", content: m.excerpt ?? "" },
        { property: "article:published_time", content: m.date ?? "" },
      ],
    };
  },
  notFoundComponent: () => (
    <section className="mx-auto max-w-3xl px-6 py-24 text-center">
      <h1 className="font-display text-4xl">未找到这篇文章</h1>
      <Link to="/writing" className="mt-6 inline-block font-mono text-xs text-primary">
        ← 回到 Writing
      </Link>
    </section>
  ),
  component: WritingDetail,
});

function WritingDetail() {
  const entry = Route.useLoaderData();
  const { meta, html, body } = entry;
  const { prev, next } = neighbours(writingEntries, meta.slug);
  const articleLength = getArticleLength(body);

  return (
    <article className="mx-auto max-w-6xl px-6 py-16 md:py-24">
        <Link
          to="/writing"
          className="inline-flex items-center gap-2 font-mono text-xs text-muted-foreground transition-colors hover:text-primary"
        >
          ← Writing
        </Link>

        <div className="mt-8">
          <div>
            <header className="rounded-[2rem] border border-hairline bg-surface/40 p-8 shadow-card md:p-10 xl:p-12">
              <div className="flex flex-wrap items-center gap-3 font-mono text-xs text-muted-foreground">
                <span className="text-primary">Essay</span>
                <span className="h-px w-6 bg-hairline" />
                {meta.tag && <span>{meta.tag}</span>}
                {meta.date && (
                  <>
                    <span className="h-px w-6 bg-hairline" />
                    <span>{formatDate(meta.date)}</span>
                  </>
                )}
                {meta.readTime && (
                  <>
                    <span className="h-px w-6 bg-hairline" />
                    <span>{meta.readTime}</span>
                  </>
                )}
              </div>

              <h1 className="mt-6 max-w-4xl font-display text-balance text-4xl font-light leading-[1.02] tracking-tight md:text-6xl">
                {meta.title}
              </h1>

              {meta.excerpt && (
                <p className="mt-6 max-w-3xl text-lg leading-relaxed text-muted-foreground md:text-xl">
                  {meta.excerpt}
                </p>
              )}

              <div className="mt-8 flex flex-wrap items-center gap-3">
                <Link
                  to="/writing"
                  className="inline-flex items-center gap-2 rounded-full border border-hairline px-5 py-2.5 text-sm font-medium text-foreground transition-colors hover:border-primary/40 hover:bg-background"
                >
                  返回文章列表
                </Link>
                {meta.tag && (
                  <div className="rounded-full bg-primary/10 px-3 py-1 font-mono text-[10px] uppercase tracking-[0.2em] text-primary">
                    {meta.tag}
                  </div>
                )}
              </div>
            </header>

            <div className="mt-10 rounded-[2rem] border border-hairline bg-background p-6 shadow-card md:p-10 xl:p-12">
              <div className="mb-8 flex flex-wrap gap-6 border-b border-hairline pb-6 font-mono text-[11px] uppercase tracking-[0.16em] text-muted-foreground">
                {meta.date && <span>Published {formatDate(meta.date)}</span>}
                {meta.readTime && <span>Read {meta.readTime}</span>}
                <span>Length {articleLength} 字</span>
              </div>
              <Prose html={html} className="article-prose" />
            </div>

            <section className="mt-10 rounded-[2rem] border border-hairline bg-surface/30 p-6 md:p-8">
              <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
                <div>
                  <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
                    Continue Exploring
                  </div>
                  <h2 className="mt-3 font-display text-2xl font-normal text-foreground md:text-3xl">
                    喜欢这篇文章的话，也可以继续看下一篇。
                  </h2>
                </div>
                <Link
                  to="/writing"
                  className="inline-flex items-center gap-2 font-mono text-xs text-muted-foreground transition-colors hover:text-primary"
                >
                  查看全部文章 →
                </Link>
              </div>
            </section>

            <nav className="mt-20 grid grid-cols-1 gap-4 border-t border-hairline pt-10 md:grid-cols-2">
              {prev ? (
                <Link
                  to="/writing/$slug"
                  params={{ slug: prev.meta.slug }}
                  className="group flex flex-col gap-1 rounded-2xl border border-hairline p-5 transition-colors hover:border-primary/40 hover:bg-surface"
                >
                  <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
                    ← 上一篇
                  </span>
                  <span className="font-display text-lg leading-snug text-foreground transition-colors group-hover:text-primary">
                    {prev.meta.title}
                  </span>
                </Link>
              ) : (
                <div />
              )}
              {next ? (
                <Link
                  to="/writing/$slug"
                  params={{ slug: next.meta.slug }}
                  className="group flex flex-col gap-1 rounded-2xl border border-hairline p-5 text-right transition-colors hover:border-primary/40 hover:bg-surface"
                >
                  <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
                    下一篇 →
                  </span>
                  <span className="font-display text-lg leading-snug text-foreground transition-colors group-hover:text-primary">
                    {next.meta.title}
                  </span>
                </Link>
              ) : (
                <div />
              )}
            </nav>
          </div>
        </div>
    </article>
  );
}
