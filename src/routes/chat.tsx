import { createFileRoute } from "@tanstack/react-router";
import { Nav } from "@/components/Nav";
import { AIChat } from "@/components/AIChat";

export const Route = createFileRoute("/chat")({
  head: () => {
    return {
      meta: [
        { title: "AI Chat — 数字旷野" },
        { name: "description", content: "与 AI 助手对话，获取关于独立开发、内容创作的建议。" },
        { property: "og:title", content: "AI Chat — 数字旷野" },
        { property: "og:description", content: "与 AI 助手对话，获取关于独立开发、内容创作的建议。" },
      ],
    };
  },
  component: ChatPage,
});

function ChatPage() {
  return (
    <>
      <Nav />
      <AIChat />
    </>
  );
}