import { createFileRoute } from "@tanstack/react-router";
import { Nav } from "@/components/Nav";
import { Footer } from "@/components/Footer";
import { Prose } from "@/components/Prose";
import { aboutEntries } from "@/lib/content";

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
    const entry = aboutEntries[0];
    if (entry) {
      return { html: entry.html, meta: { ...entry.meta } };
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
          <h1 className="font-display text-5xl font-light tracking-tight text-foreground md:text-6xl">
            {data?.meta.title ?? "About"}
          </h1>
        </header>

        <div className="grid grid-cols-1 gap-12 md:grid-cols-3">
          <div className="md:col-span-2">
            <Prose html={data?.html ?? ""} />
          </div>

          <aside className="space-y-8">
            <div>
              <h3 className="mb-3 font-mono text-xs uppercase tracking-wider text-muted-foreground">
                技术栈
              </h3>
              <div className="flex flex-wrap gap-2">
                {stack.map((s) => (
                  <span
                    key={s}
                    className="rounded border border-hairline px-2.5 py-1 font-mono text-xs text-muted-foreground"
                  >
                    {s}
                  </span>
                ))}
              </div>
            </div>
          </aside>
        </div>
      </article>

      <Footer />
    </main>
  );
}