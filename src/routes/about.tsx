import { createFileRoute } from "@tanstack/react-router";
import { marked } from "marked";
import { Nav } from "@/components/Nav";
import { Footer } from "@/components/Footer";
import { Prose } from "@/components/Prose";
import { aboutEntries } from "@/lib/content";
import { fetchAbout } from "@/lib/db-content";
import { isSupabaseConfigured } from "@/integrations/supabase/client";

marked.setOptions({ gfm: true, breaks: false });

const stack = [
  "TypeScript",
  "React",
  "Next.js",
  "Tailwind",
  "PostgreSQL",
  "Swift",
  "Go",
  "Figma",
  "Cursor",
];

export const Route = createFileRoute("/about")({
  loader: async () => {
    if (isSupabaseConfigured) {
      try {
        const dbEntry = await fetchAbout();
        if (dbEntry && dbEntry.content) {
          const html = marked.parse(dbEntry.content) as string;
          return {
            html,
            meta: {
              title: dbEntry.title,
              excerpt: dbEntry.excerpt ?? undefined,
            },
          };
        }
      } catch {
        // fall back to markdown
      }
    }
    const fallback = aboutEntries[0];
    if (fallback) {
      return { html: fallback.html, meta: { ...fallback.meta } };
    }
    return null;
  },
  head: ({ loaderData }) => {
    const m = loaderData?.meta;
    return {
      meta: [
        { title: m?.title ? `${m.title}` : "About — 关于数字旷野" },
        {
          name: "description",
          content: m?.excerpt ?? "我是数字旷野 — 2019 年从大厂离职，一个人做产品、写文章、录视频。",
        },
        { property: "og:title", content: "About — 关于数字旷野" },
        {
          property: "og:description",
          content: "一个人，一台电脑，一段还在继续的旅程。",
        },
      ],
    };
  },
  component: AboutPage,
});

function AboutPage() {
  const data = Route.useLoaderData();

  return (
    <main className="relative min-h-screen pt-20">
      <Nav />

      <article className="mx-auto max-w-6xl px-6 py-16 md:py-24">
        <header className="mb-12">
          <div className="mb-3 font-mono text-xs uppercase tracking-[0.2em] text-primary">
            05 / About
          </div>
          <h1 className="font-display text-balance text-5xl font-light leading-[1.05] tracking-tight md:text-6xl">
            一个人，<em className="italic text-primary">一台电脑</em>。
          </h1>
        </header>

        <div className="grid grid-cols-1 gap-12 md:grid-cols-12">
          <div className="md:col-span-7">
            {data ? (
              <Prose html={data.html} />
            ) : (
              <p className="text-base leading-relaxed text-muted-foreground">
                暂无内容，请编辑 src/content/about/about.md 添加。
              </p>
            )}

            <div className="hairline-t mt-10 pt-8">
              <div className="mb-4 font-mono text-xs uppercase tracking-[0.2em] text-muted-foreground">
                Toolbox
              </div>
              <div className="flex flex-wrap gap-2 font-mono text-xs">
                {stack.map((s) => (
                  <span
                    key={s}
                    className="rounded-full border border-hairline px-3 py-1 text-foreground/80 transition-colors hover:border-primary/50 hover:text-primary"
                  >
                    {s}
                  </span>
                ))}
              </div>
            </div>
          </div>

          <div className="md:col-span-5">
            <div className="sticky top-28 space-y-4">
              <div className="rounded-[2rem] border border-hairline bg-surface/40 p-8">
                <div className="mb-4 flex items-center gap-2 font-mono text-xs text-muted-foreground">
                  <span className="h-2 w-2 rounded-full bg-primary" />
                  邮件订阅 · 每两周一封
                </div>
                <h2 className="font-display text-2xl font-normal leading-tight text-foreground">
                  加入 12,000+ 名读者，
                  <br />
                  收到我每两周一次的笔记。
                </h2>
                <p className="mt-3 text-sm text-muted-foreground">
                  独立工作的真实日常、产品笔记、和我读到的好东西。无广告，可一键退订。
                </p>

                <form
                  onSubmit={(e) => e.preventDefault()}
                  className="mt-6 flex flex-col gap-2 sm:flex-row"
                >
                  <input
                    type="email"
                    placeholder="you@example.com"
                    className="flex-1 rounded-full border border-hairline bg-background px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none"
                  />
                  <button
                    type="submit"
                    className="rounded-full bg-primary px-5 py-3 text-sm font-medium text-primary-foreground transition-transform hover:-translate-y-0.5"
                  >
                    订阅
                  </button>
                </form>

                <div className="mt-6 hairline-t pt-5">
                  <div className="mb-3 font-mono text-xs uppercase tracking-[0.2em] text-muted-foreground">
                    在别处找到我
                  </div>
                  <div className="flex flex-wrap gap-3 font-mono text-xs">
                    {["Twitter / X", "GitHub", "B站", "YouTube", "小红书"].map((s) => (
                      <a
                        key={s}
                        href="#"
                        className="text-muted-foreground underline underline-offset-4 transition-colors hover:text-primary"
                      >
                        {s}
                      </a>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </article>

      <Footer />
    </main>
  );
}
