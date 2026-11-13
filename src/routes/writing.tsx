import { Outlet, createFileRoute, useRouterState } from "@tanstack/react-router";
import { Nav } from "@/components/Nav";
import { Writing } from "@/components/Writing";
import { Footer } from "@/components/Footer";
import { pageSeo, collectionLd, isIndexMatch, absoluteUrl } from "@/lib/seo";
import { loadWritings } from "@/lib/data";

export const Route = createFileRoute("/writing")({
  head: ({ matches }) => {
    // 只有停在 /writing 这个索引路由时才输出列表页的 meta/links。
    // 详情页（/writing/$slug）上父级必须让位 —— links 不会像 meta 那样去重，
    // 父级的 canonical 会和子级一起进 <head>，搜索引擎取第一个 →
    // 所有文章的 canonical 全指向列表页。
    if (!isIndexMatch(matches, "/writing")) {
      return { meta: [], links: [] };
    }

    const items = loadWritings();
    const name = "写作 — 独立开发、AI 工作流与真实复盘";
    const description = `独立开发、AI 工作流、TypeScript 与真实复盘，每两周一篇。当前已发布 ${items.length} 篇，全部可直接读完。`;

    return pageSeo({
      path: "/writing",
      title: name,
      description,
      jsonLd: collectionLd({
        name,
        description,
        path: "/writing",
        items: items.map((w) => ({
          name: w.title,
          url: absoluteUrl(`/writing/${w.slug}`),
        })),
      }),
      keywords: ["独立开发", "AI 工作流", "TypeScript", "写作复盘", "Obsidian"],
    });
  },
  component: WritingPage,
});

function WritingPage() {
  const pathname = useRouterState({ select: (state) => state.location.pathname });
  const isWritingIndex = pathname === "/writing";

  return (
    <main className="relative min-h-screen pt-20">
      <Nav />
      {isWritingIndex ? (
        <Writing
          showAction={false}
          headingLevel={1}
          title={
            <>
              写作：独立开发、AI 工作流
              <em className="italic text-primary">与真实复盘</em>
            </>
          }
          description="每两周一篇，记录独立工作里的真实思考 —— 不是方法论，是复盘。"
        />
      ) : (
        <Outlet />
      )}
      <Footer />
    </main>
  );
}
