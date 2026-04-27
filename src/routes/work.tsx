import { createFileRoute, Outlet, useRouterState } from "@tanstack/react-router";
import { Nav } from "@/components/Nav";
import { Work } from "@/components/Work";
import { Footer } from "@/components/Footer";

export const Route = createFileRoute("/work")({
  head: () => ({
    meta: [
      { title: "Work — 数字旷野的产品与项目" },
      {
        name: "description",
        content:
          "数字旷野过去三年构建的独立产品、开源项目与已售出的 SaaS。从 SwiftUI 笔记 App 到 AI 写作工作台。",
      },
      { property: "og:title", content: "Work — 数字旷野的产品与项目" },
      {
        property: "og:description",
        content: "亲手设计、开发、运营的每一个项目。",
      },
    ],
  }),
  component: WorkPage,
});

function WorkPage() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const isDetail = pathname !== "/work";
  return (
    <main className="relative min-h-screen pt-20">
      <Nav />
      {isDetail ? <Outlet /> : <Work showAction={false} />}
      <Footer />
    </main>
  );
}
