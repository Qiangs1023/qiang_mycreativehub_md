import { createFileRoute } from "@tanstack/react-router";
import { Nav } from "@/components/Nav";
import { Hero } from "@/components/Hero";
import { Marquee } from "@/components/Marquee";
import { Footer } from "@/components/Footer";
import { Work } from "@/components/Work";
import { Writing } from "@/components/Writing";
import { Videos } from "@/components/Videos";
import { Courses } from "@/components/Courses";
import { AIChatSection } from "@/components/AIChatSection";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "数字旷野 — 独立开发者 · 写作者 · 教育者" },
      {
        name: "description",
        content:
          "数字旷野的个人主页 — 独立开发者、自媒体博主、课程作者。在这里查看他的产品、文章、视频与课程。",
      },
      { property: "og:title", content: "数字旷野 — 独立开发者 · 写作者 · 教育者" },
      {
        property: "og:description",
        content:
          "造物，写作，然后分享。三年时间从一个人到 6 位数年收入的实践记录。",
      },
    ],
  }),
  component: Index,
});

function Index() {
  return (
    <main className="relative min-h-screen">
      <Nav />
      <Hero />
      <Marquee />

      <Writing limit={4} />
      <Work limit={6} />
      <Videos limit={5} />
      <Courses />

      <Footer />
    </main>
  );
}
