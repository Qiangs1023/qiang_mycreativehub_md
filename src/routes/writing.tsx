import { Outlet, createFileRoute, useRouterState } from "@tanstack/react-router";
import { Nav } from "@/components/Nav";
import { Writing } from "@/components/Writing";
import { Footer } from "@/components/Footer";

export const Route = createFileRoute("/writing")({
  head: () => ({
    meta: [
      { title: "Writing — 数字旷野的文章档案" },
      {
        name: "description",
        content:
          "关于独立工作、产品设计、TypeScript、和如何在不焦虑的前提下生活。每两周一篇。",
      },
      { property: "og:title", content: "Writing — 数字旷野的文章档案" },
      {
        property: "og:description",
        content: "我想清楚的事 —— 48 篇长文，持续更新。",
      },
    ],
  }),
  component: WritingPage,
});

function WritingPage() {
  const pathname = useRouterState({ select: (state) => state.location.pathname });
  const isWritingIndex = pathname === "/writing";

  return (
    <main className="relative min-h-screen pt-20">
      <Nav />
      {isWritingIndex ? <Writing showAction={false} /> : <Outlet />}
      <Footer />
    </main>
  );
}
