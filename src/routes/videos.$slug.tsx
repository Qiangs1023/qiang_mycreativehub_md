import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { Prose } from "@/components/Prose";
import { findEntry, neighbours, videosEntries } from "@/lib/content";
import { resolveCover } from "@/lib/covers";

export const Route = createFileRoute("/videos/$slug")({
  loader: ({ params }) => {
    const entry = findEntry(videosEntries, params.slug);
    if (!entry) throw notFound();
    return entry;
  },
  head: ({ loaderData }) => {
    if (!loaderData) return {};
    const m = loaderData.meta;
    return {
      meta: [
        { title: `${m.title} — Videos · 数字旷野` },
        { name: "description", content: m.excerpt ?? "" },
        { property: "og:title", content: `${m.title} — Videos · 数字旷野` },
        { property: "og:description", content: m.excerpt ?? "" },
      ],
    };
  },
  notFoundComponent: () => (
    <section className="mx-auto max-w-3xl px-6 py-24 text-center">
      <h1 className="font-display text-4xl">未找到这支视频</h1>
      <Link to="/videos" className="mt-6 inline-block font-mono text-xs text-primary">
        ← 回到 Videos
      </Link>
    </section>
  ),
  component: VideoDetail,
});

function VideoDetail() {
  const entry = Route.useLoaderData();
  const { meta, html } = entry;
  const { prev, next } = neighbours(videosEntries, meta.slug);
  const cover = resolveCover(meta.cover);

  return (
    <article className="mx-auto max-w-3xl px-6 py-16 md:py-24">
      <Link
        to="/videos"
        className="inline-flex items-center gap-2 font-mono text-xs text-muted-foreground transition-colors hover:text-primary"
      >
        ← Videos
      </Link>

      <header className="mt-8 rounded-[2rem] border border-hairline bg-surface/40 p-8 md:p-10">
        <div className="flex flex-wrap items-center gap-3 font-mono text-xs text-muted-foreground">
          <span className="text-primary">Video</span>
          {meta.platform && (
            <>
              <span className="h-px w-6 bg-hairline" />
              <span>{meta.platform}</span>
            </>
          )}
          {meta.date && (
            <>
              <span className="h-px w-6 bg-hairline" />
              <span>{meta.date}</span>
            </>
          )}
          {meta.duration && (
            <>
              <span className="h-px w-6 bg-hairline" />
              <span>{meta.duration}</span>
            </>
          )}
          {meta.views && (
            <>
              <span className="h-px w-6 bg-hairline" />
              <span>{meta.views}</span>
            </>
          )}
        </div>

        <h1 className="mt-6 font-display text-balance text-4xl font-light leading-[1.05] tracking-tight md:text-6xl">
          {meta.title}
        </h1>

        {meta.excerpt && (
          <p className="mt-6 max-w-2xl text-lg leading-relaxed text-muted-foreground">
            {meta.excerpt}
          </p>
        )}

        <div className="mt-8 flex flex-wrap items-center gap-3">
          {meta.videoUrl && (
            <a
              href={meta.videoUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="group inline-flex items-center gap-3 rounded-full bg-primary px-6 py-3 text-sm font-medium text-primary-foreground transition-transform hover:-translate-y-0.5"
            >
              <svg viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4">
                <path d="M8 5v14l11-7z" />
              </svg>
              在 {meta.platform} 观看
            </a>
          )}
          <Link
            to="/videos"
            className="inline-flex items-center gap-2 rounded-full border border-hairline px-5 py-2.5 text-sm font-medium text-foreground transition-colors hover:border-primary/40 hover:bg-background"
          >
            返回视频列表
          </Link>
        </div>
      </header>

      {cover && meta.videoUrl && (
        <a
          href={meta.videoUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="group relative mt-12 block overflow-hidden rounded-[1.75rem] border border-hairline"
        >
          <div className="relative aspect-video">
            <img
              src={cover}
              alt={meta.title}
              className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-[1.02]"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-background/60 via-background/10 to-transparent" />
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="flex h-24 w-24 items-center justify-center rounded-full border border-foreground/20 bg-background/30 backdrop-blur-md transition-all duration-500 group-hover:scale-105 group-hover:border-primary/60 group-hover:bg-primary/90">
                <svg viewBox="0 0 24 24" fill="currentColor" className="ml-1 h-10 w-10">
                  <path d="M8 5v14l11-7z" />
                </svg>
              </div>
            </div>
            <div className="absolute bottom-6 left-6 right-6 flex items-center justify-between">
              <div className="flex items-center gap-2 rounded-full border border-foreground/10 bg-background/40 px-3 py-1.5 font-mono text-xs text-foreground/80 backdrop-blur">
                <span>{meta.platform}</span>
                {meta.duration && <span>·</span>}
                {meta.duration && <span>{meta.duration}</span>}
              </div>
              <div className="rounded-full border border-foreground/10 bg-background/40 px-3 py-1.5 font-mono text-xs text-foreground/80 backdrop-blur">
                点击观看 →
              </div>
            </div>
          </div>
        </a>
      )}

      <div className="mt-12 rounded-[2rem] border border-hairline bg-background p-6 md:p-10">
        <Prose html={html} />
      </div>

      <section className="mt-10 rounded-[2rem] border border-hairline bg-surface/30 p-6 md:p-8">
        <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div>
            <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
              Continue Exploring
            </div>
            <h2 className="mt-3 font-display text-2xl font-normal text-foreground md:text-3xl">
              喜欢这个视频的话，也可以继续看下一支。
            </h2>
          </div>
          <Link
            to="/videos"
            className="inline-flex items-center gap-2 font-mono text-xs text-muted-foreground transition-colors hover:text-primary"
          >
            查看全部视频 →
          </Link>
        </div>
      </section>

      <nav className="mt-20 grid grid-cols-1 gap-4 border-t border-hairline pt-10 md:grid-cols-2">
        {prev ? (
          <Link
            to="/videos/$slug"
            params={{ slug: prev.meta.slug }}
            className="group flex flex-col gap-1 rounded-2xl border border-hairline p-5 transition-colors hover:border-primary/40 hover:bg-surface"
          >
            <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
              ← 上一支
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
            to="/videos/$slug"
            params={{ slug: next.meta.slug }}
            className="group flex flex-col gap-1 rounded-2xl border border-hairline p-5 text-right transition-colors hover:border-primary/40 hover:bg-surface"
          >
            <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
              下一支 →
            </span>
            <span className="font-display text-lg leading-snug text-foreground transition-colors group-hover:text-primary">
              {next.meta.title}
            </span>
          </Link>
        ) : (
          <div />
        )}
      </nav>
    </article>
  );
}
