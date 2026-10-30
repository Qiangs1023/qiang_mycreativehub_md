import { createFileRoute } from "@tanstack/react-router";
import { Nav } from "@/components/Nav";
import { Footer } from "@/components/Footer";
import { loadNews } from "@/lib/news";

function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, "").trim();
}

function getExcerpt(html: string, maxLength = 160): string {
  const text = stripHtml(html);
  if (text.length <= maxLength) return text;
  return `${text.slice(0, maxLength).replace(/\s+\S*$/, "")}…`;
}

function formatDate(date: string): string {
  const parsed = /^\d{4}-\d{2}-\d{2}$/.test(date)
    ? new Date(`${date}T00:00:00.000Z`)
    : new Date(Number(date));
  if (Number.isNaN(parsed.getTime())) return date;
  return parsed.toLocaleDateString("zh-CN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    timeZone: "UTC",
  });
}

export const Route = createFileRoute("/news")({
  head: () => ({
    meta: [
      { title: "News — 数字旷野的 AI 资讯" },
      {
        name: "description",
        content: "精选 AI 行业资讯与工具，每周更新，助你紧跟 AI 前沿动态。",
      },
      { property: "og:title", content: "News — 数字旷野的 AI 资讯" },
      {
        property: "og:description",
        content: "精选 AI 行业资讯与工具，每周更新，助你紧跟 AI 前沿动态。",
      },
    ],
  }),
  component: NewsPage,
});

function NewsPage() {
  const items = loadNews();
  const latestDate = items[0]?.updatedAt ?? items[0]?.date ?? "";
  const latestLabel = latestDate ? formatDate(latestDate) : "待更新";

  return (
    <main className="relative min-h-screen pt-20">
      <Nav />

      <article className="mx-auto max-w-3xl px-6 py-16 md:py-24">
        <header className="mb-12">
          <div className="mb-3 font-mono text-xs uppercase tracking-[0.2em] text-primary">
            06 / News
          </div>
          <h1 className="font-display text-balance text-5xl font-light leading-[1.05] tracking-tight md:text-6xl">
            AI 深度信号
          </h1>
          <p className="mt-4 max-w-xl text-base leading-relaxed text-muted-foreground">
            精选 AI 行业资讯与工具，每周更新。由站内 Markdown 内容源更新，最后更新于 {latestLabel}。
          </p>
        </header>

        <div className="space-y-0">
          {items.map((item, index) => (
            <div
              key={item.slug}
              className="group border-b border-hairline py-8 first:pt-0 last:border-b-0"
            >
              <div className="mb-3 flex items-center gap-3 font-mono text-xs text-muted-foreground">
                <span className="text-primary">
                  {String(items.length - index).padStart(2, "0")}
                </span>
                <span className="h-px w-4 bg-hairline" />
                <span>{formatDate(item.updatedAt ?? item.date)}</span>
              </div>

              <a href={item.url} target="_blank" rel="noopener noreferrer" className="block">
                <h2 className="font-display text-2xl font-normal leading-tight text-foreground transition-colors group-hover:text-primary md:text-3xl">
                  {item.title}
                </h2>
              </a>

              <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                {getExcerpt(item.bodyHtml)}
              </p>

              <a
                href={item.url}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-3 inline-flex items-center gap-1.5 font-mono text-xs text-muted-foreground transition-colors group-hover:text-primary"
              >
                阅读原文
                <span className="transition-transform group-hover:translate-x-0.5">→</span>
              </a>
            </div>
          ))}
        </div>
      </article>

      <Footer />
    </main>
  );
}
