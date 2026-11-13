import { createFileRoute } from "@tanstack/react-router";
import { Nav } from "@/components/Nav";
import { Hero } from "@/components/Hero";
import { Marquee } from "@/components/Marquee";
import { Footer } from "@/components/Footer";
import { Work } from "@/components/Work";
import { Writing } from "@/components/Writing";
import { Videos } from "@/components/Videos";
import { Courses } from "@/components/Courses";
import { IntentPaths } from "@/components/IntentPaths";
import { pageSeo, personAndSiteLd } from "@/lib/seo";
import { loadWritings, loadWorks, loadVideos, loadCourses } from "@/lib/data";

export const Route = createFileRoute("/")({
  head: () => {
    const writings = loadWritings().length;
    const works = loadWorks().length;
    const videos = loadVideos().length;
    const courses = loadCourses().length;

    return pageSeo({
      path: "/",
      title: "数字旷野 — AI 实操档案",
      description: `用 AI 把想法变成能销售的东西。这里有 ${works} 个上线产品、${writings} 篇文章、${videos} 支视频和 ${courses} 门课，全部是我自己做过的东西。`,
      jsonLd: personAndSiteLd(),
      keywords: ["AI coding", "自动工作流", "Obsidian", "跨境出海" , "个人网站"],
    });
  },
  component: Index,
});

function Index() {
  return (
    <main className="relative min-h-screen">
      <Nav />
      <Hero />
      <Marquee />

      <IntentPaths />

      <Writing limit={4} />
      <Work limit={6} />
      <Videos limit={5} />
      <Courses />

      <Footer />
    </main>
  );
}
