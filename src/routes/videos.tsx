import { createFileRoute, Outlet, useRouterState } from "@tanstack/react-router";
import { Nav } from "@/components/Nav";
import { Videos } from "@/components/Videos";
import { Footer } from "@/components/Footer";

export const Route = createFileRoute("/videos")({
  head: () => ({
    meta: [
      { title: "Videos — 数字旷野的视频频道" },
      {
        name: "description",
        content:
          "B站与 YouTube 上的深度长视频、独立开发 vlog、产品复盘。月更两支。",
      },
      { property: "og:title", content: "Videos — 数字旷野的视频频道" },
      {
        property: "og:description",
        content: "我在镜头前说的一切 —— 慢，但深。",
      },
    ],
  }),
  component: VideosPage,
});

function VideosPage() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const isVideoIndex = pathname === "/videos";
  return (
    <main className="relative min-h-screen pt-20">
      <Nav />
      {isVideoIndex ? <Videos showAction={false} /> : <Outlet />}
      <Footer />
    </main>
  );
}
