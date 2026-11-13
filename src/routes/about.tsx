import { createFileRoute } from "@tanstack/react-router";
import { Nav } from "@/components/Nav";
import { Footer } from "@/components/Footer";
import { Prose } from "@/components/Prose";
import { loadAbout } from "@/lib/data";
import { pageSeo, webPageLd, ldGraph, ensureDescription } from "@/lib/seo";

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
    const entry = loadAbout();
    return {
      title: entry.title,
      excerpt: entry.excerpt,
      cover: entry.cover,
      bodyHtml: entry.bodyHtml,
    };
  },
  head: ({ loaderData }) => {
    const data = loaderData;
    const description = ensureDescription(
      data?.excerpt,
      "数字旷野：AI coding 重度用户，独立开发者、内容创作者与课程作者。这里记录我做过的产品、写过的文章和开的课。",
    );
    return pageSeo({
      path: "/about",
      title: "关于数字旷野 — 独立开发者、写作者与课程作者",
      description,
      jsonLd: ldGraph([
        webPageLd({ name: "关于数字旷野", description, path: "/about" }),
        {
          "@type": "ProfilePage",
          "@id": "https://digiwild.cc/about#profile",
          "url": "https://digiwild.cc/about",
          "about": { "@id": "https://digiwild.cc/#person" },
          "inLanguage": "zh-CN",
        },
      ]),
      keywords: ["数字旷野", "独立开发者", "内容创作者", "关于我"],
    });
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
            {data?.title ?? "About"}
          </h1>
        </header>

        <div className="grid grid-cols-1 gap-12 md:grid-cols-3">
          <div className="md:col-span-2">
            <Prose html={data?.bodyHtml ?? ""} />
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