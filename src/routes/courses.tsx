import { createFileRoute, Outlet, useRouterState } from "@tanstack/react-router";
import { Nav } from "@/components/Nav";
import { Courses } from "@/components/Courses";
import { Footer } from "@/components/Footer";
import { pageSeo, collectionLd, isIndexMatch, absoluteUrl } from "@/lib/seo";
import { loadCourses } from "@/lib/data";

export const Route = createFileRoute("/courses")({
  head: ({ matches }) => {
    if (!isIndexMatch(matches, "/courses")) {
      return { meta: [], links: [] };
    }

    const items = loadCourses();
    const name = "课程 — 把走过的路教给你";
    const description = `${items.length} 门课与社群：Obsidian+Agent 人生管理系统、独立开发者实战课、跨境贸易社群。每门都有大纲和报名入口。`;

    return pageSeo({
      path: "/courses",
      title: name,
      description,
      jsonLd: collectionLd({
        name,
        description,
        path: "/courses",
        items: items.map((c) => ({
          name: c.title,
          url: absoluteUrl(`/courses/${c.slug}`),
        })),
      }),
      keywords: ["独立开发课程", "Obsidian 教程", "跨境贸易", "AI 工作流"],
    });
  },
  component: CoursesPage,
});

function CoursesPage() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const isCourseIndex = pathname === "/courses";
  return (
    <main className="relative min-h-screen pt-20">
      <Nav />
      {isCourseIndex ? (
        <Courses
          headingLevel={1}
          title={
            <>
              课程：我把走过的路，
              <em className="italic text-primary">教给你</em>。
            </>
          }
          description="不是教程合集，是我自己每天都在用的方法论。"
        />
      ) : (
        <Outlet />
      )}
      <Footer />
    </main>
  );
}
