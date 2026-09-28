import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { Prose } from "@/components/Prose";
import { loadWorks, findWork, neighbours } from "@/lib/data";
import { resolveCover } from "@/lib/covers";

export const Route = createFileRoute("/work/$slug")({
  loader: ({ params }) => {
    const entry = findWork(params.slug);
    if (!entry) throw notFound();
    return entry;
  },
  head: ({ loaderData }) => {
    if (!loaderData) return {};
    const entry = loaderData;
    return {
      meta: [
        { title: `${entry.title} — Work · 数字旷野` },
        { name: "description", content: entry.excerpt ?? "" },
        { property: "og:title", content: `${entry.title} — Work · 数字旷野` },
        { property: "og:description", content: entry.excerpt ?? "" },
      ],
    };
  },
  notFoundComponent: () => (
    <section className="mx-auto max-w-3xl px-6 py-24 text-center">
      <h1 className="font-display text-4xl">未找到这个项目</h1>
      <Link to="/work" className="mt-6 inline-block font-mono text-xs text-primary">
        ← 回到 Work
      </Link>
    </section>
  ),
  component: WorkDetail,
});

function WorkDetail() {
  const entry = Route.useLoaderData();
  const { bodyHtml, slug } = entry;
  const collection = loadWorks();
  const { prev, next } = neighbours(collection, slug);
  const cover = resolveCover(entry.cover);

  return (
    <article className="mx-auto max-w-3xl px-6 py-16 md:py-24">
      <Link
        to="/work"
        className="inline-flex items-center gap-2 font-mono text-xs text-muted-foreground transition-colors hover:text-primary"
      >
        ← Work
      </Link>

      <header className="mt-8 rounded-[2rem] border border-hairline bg-surface/40 p-8 md:p-10">
        <div className="flex flex-wrap items-center gap-3 font-mono text-xs text-muted-foreground">
          <span className="text-primary">Project</span>
          {entry.tag && (
            <>
              <span className="h-px w-6 bg-hairline" />
              <span>{entry.tag}</span>
            </>
          )}
          {entry.status && (
            <>
              <span className="h-px w-6 bg-hairline" />
              <span>{entry.status}</span>
            </>
          )}
          {entry.date && (
            <>
              <span className="h-px w-6 bg-hairline" />
              <span>{entry.date}</span>
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
          {entry.link && (
            <a
              href={entry.link}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground transition-transform hover:-translate-y-0.5"
            >
              访问站点 →
            </a>
          )}
          <Link
            to="/work"
            className="inline-flex items-center gap-2 rounded-full border border-hairline px-5 py-2.5 text-sm font-medium text-foreground transition-colors hover:border-primary/40 hover:bg-background"
          >
            返回项目列表
          </Link>
          {entry.stack && (
            <div className="flex flex-wrap gap-1.5 font-mono text-[10px] text-muted-foreground">
              {entry.stack.map((s: string) => (
                <span key={s} className="rounded border border-hairline px-2 py-0.5">
                  {s}
                </span>
              ))}
            </div>
          )}
        </div>
      </header>

      {cover && (
        <div className="mt-12 overflow-hidden rounded-[1.75rem] border border-hairline">
          <img
            src={cover}
            alt={entry.title}
            className="h-full w-full object-cover"
          />
        </div>
      )}

      <div className="mt-12 rounded-[2rem] border border-hairline bg-background p-6 md:p-10">
        <Prose html={bodyHtml} />
      </div>

      <section className="mt-10 rounded-[2rem] border border-hairline bg-surface/30 p-6 md:p-8">
        <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div>
            <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
              Continue Exploring
            </div>
            <h2 className="mt-3 font-display text-2xl font-normal text-foreground md:text-3xl">
              喜欢这个项目的话，也可以继续看下一个。
            </h2>
          </div>
          <Link
            to="/work"
            className="inline-flex items-center gap-2 font-mono text-xs text-muted-foreground transition-colors hover:text-primary"
          >
            查看全部项目 →
          </Link>
        </div>
      </section>

      <nav className="mt-20 grid grid-cols-1 gap-4 border-t border-hairline pt-10 md:grid-cols-2">
        {prev ? (
          <Link
            to="/work/$slug"
            params={{ slug: prev.slug }}
            className="group flex flex-col gap-1 rounded-2xl border border-hairline p-5 transition-colors hover:border-primary/40 hover:bg-surface"
          >
            <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
              ← 上一个
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
            to="/work/$slug"
            params={{ slug: next.slug }}
            className="group flex flex-col gap-1 rounded-2xl border border-hairline p-5 text-right transition-colors hover:border-primary/40 hover:bg-surface"
          >
            <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
              下一个 →
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