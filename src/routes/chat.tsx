import { createFileRoute } from "@tanstack/react-router";
import { Nav } from "@/components/Nav";
import { AIChat } from "@/components/AIChat";
import { isDifyConfigured } from "@/lib/dify";
import { pageSeo } from "@/lib/seo";

export const Route = createFileRoute("/chat")({
  head: () => {
    // Dify 没配置时这页只有一句「维护中」，没什么可被索引的价值 —— 直接 noindex，
    // 免得搜索结果里出现一个坏掉的入口。
    const configured = isDifyConfigured();
    return pageSeo({
      path: "/chat",
      title: "AI 助手 — 与数字旷野聊独立开发",
      description:
        "和数字旷野的 AI 助手聊聊独立开发、AI 工作流与内容创作。",
      noIndex: !configured,
      keywords: ["AI 助手", "独立开发", "AI 工作流"],
    });
  },
  component: ChatPage,
});

function ChatPage() {
  const configured = isDifyConfigured();
  return (
    <>
      <Nav />
      {configured ? (
        <AIChat />
      ) : (
        <main className="mx-auto min-h-screen max-w-3xl px-6 pt-36 pb-24">
          <h1 className="font-display text-4xl">AI 助手</h1>
          <p className="mt-4 text-muted-foreground">
            对话功能正在维护中，欢迎先浏览文章与作品。
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <a
              href="/writing"
              className="rounded-full border border-hairline px-4 py-2 text-sm text-foreground transition-colors hover:bg-surface"
            >
              读文章
            </a>
            <a
              href="/work"
              className="rounded-full border border-hairline px-4 py-2 text-sm text-foreground transition-colors hover:bg-surface"
            >
              看作品
            </a>
            <a
              href="/courses"
              className="rounded-full bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
            >
              看课程
            </a>
          </div>
        </main>
      )}
    </>
  );
}
