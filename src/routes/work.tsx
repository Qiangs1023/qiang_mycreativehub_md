import { createFileRoute, Outlet, useRouterState } from "@tanstack/react-router";
import { Nav } from "@/components/Nav";
import { Work } from "@/components/Work";
import { Footer } from "@/components/Footer";
import { pageSeo, collectionLd, isIndexMatch, absoluteUrl } from "@/lib/seo";
import { loadWorks } from "@/lib/data";

export const Route = createFileRoute("/work")({
  head: ({ matches }) => {
    if (!isIndexMatch(matches, "/work")) {
      return { meta: [], links: [] };
    }

    const items = loadWorks();
    const name = "作品 — 独立开发者做过的产品与项目";
    const description = `亲手设计、开发、运营的 ${items.length} 个上线产品：AI 客服、轻量主页、金融 CRM。每个都写清解决什么问题、技术栈和当前状态。`;

    return pageSeo({
      path: "/work",
      title: name,
      description,
      jsonLd: collectionLd({
        name,
        description,
        path: "/work",
        items: items.map((w) => ({
          name: w.title,
          url: absoluteUrl(`/work/${w.slug}`),
        })),
      }),
      keywords: ["独立开发", "SaaS", "Next.js", "TypeScript", "产品案例"],
    });
  },
  component: WorkPage,
});

function WorkPage() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const isDetail = pathname !== "/work";
  return (
    <main className="relative min-h-screen pt-20">
      <Nav />
      {isDetail ? (
        <Outlet />
      ) : (
        <Work
          showAction={false}
          headingLevel={1}
          title={
            <>
              作品：我做过的
              <em className="italic text-primary">上线产品</em>
            </>
          }
          description="从一行代码到上线产品。每一个都是我亲手设计、开发、运营的。"
        />
      )}
      <Footer />
    </main>
  );
}
