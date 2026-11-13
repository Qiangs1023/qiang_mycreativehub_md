import { createFileRoute, Outlet, useRouterState } from "@tanstack/react-router";
import { Nav } from "@/components/Nav";
import { Videos } from "@/components/Videos";
import { Footer } from "@/components/Footer";
import { pageSeo, collectionLd, isIndexMatch, absoluteUrl } from "@/lib/seo";
import { loadVideos } from "@/lib/data";

export const Route = createFileRoute("/videos")({
  head: ({ matches }) => {
    if (!isIndexMatch(matches, "/videos")) {
      return { meta: [], links: [] };
    }

    const items = loadVideos();
    const name = "视频 — 独立开发复盘与工作日常";
    const description = `${items.length} 支深度长视频与工作日常 vlog：独立开发三年复盘、我的工作流、用 Cursor 一天做完一个 SaaS Demo。`;

    return pageSeo({
      path: "/videos",
      title: name,
      description,
      jsonLd: collectionLd({
        name,
        description,
        path: "/videos",
        items: items.map((v) => ({
          name: v.title,
          url: absoluteUrl(`/videos/${v.slug}`),
        })),
      }),
      keywords: ["独立开发视频", "build in public", "工作流", "Cursor", "SaaS demo"],
    });
  },
  component: VideosPage,
});

function VideosPage() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const isVideoIndex = pathname === "/videos";
  return (
    <main className="relative min-h-screen pt-20">
      <Nav />
      {isVideoIndex ? (
        <Videos
          showAction={false}
          headingLevel={1}
          title={
            <>
              视频：我在镜头前
              <em className="italic text-primary">说</em>。
            </>
          }
          description="深度长视频、工作日常 vlog、产品复盘。慢，但尽量不说废话。"
        />
      ) : (
        <Outlet />
      )}
      <Footer />
    </main>
  );
}
