import { useState, useRef, useEffect } from "react";
import { Send, Bot, User, Loader2, AlertCircle } from "lucide-react";
import { sendChatMessage, isDifyConfigured } from "@/lib/dify";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

function generateId() {
  return Math.random().toString(36).substring(2, 9);
}

const SUGGESTIONS = [
  "帮我写一篇关于独立开发的博客",
  "推荐几个适合程序员的项目工具",
  "如何开始我的第一个 SaaS 产品？",
];

export function AIChat() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: generateId(),
      role: "assistant",
      content: "你好！我是你的 AI 助手。我可以帮助你写作、编程、学习新技能，或者只是聊聊创意想法。今天有什么我可以帮你的吗？",
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const difyReady = isDifyConfigured();

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async (content: string) => {
    if (!content.trim() || isLoading) return;

    setError(null);

    const userMessage: Message = {
      id: generateId(),
      role: "user",
      content: content.trim(),
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    if (!difyReady) {
      await new Promise((resolve) => setTimeout(resolve, 1500));

      const responses = [
        "这是个很有趣的想法！让我从几个角度来分析一下。首先，我们可以考虑用户的核心需求是什么。",
        "根据我的理解，你可能需要考虑几个方面：用户体验、技术可行性、以及长期维护成本。",
        "很高兴和你探讨这个话题！其实有很多独立开发者都尝试过类似的方向，我可以分享一些他们的经验。",
      ];

      const assistantMessage: Message = {
        id: generateId(),
        role: "assistant",
        content: responses[Math.floor(Math.random() * responses.length)],
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, assistantMessage]);
      setIsLoading(false);
      return;
    }

    const assistantMessageId = generateId();
    setMessages((prev) => [
      ...prev,
      {
        id: assistantMessageId,
        role: "assistant",
        content: "",
        timestamp: new Date(),
      },
    ]);

    try {
      const allMessages = [
        ...messages.map((m) => ({ role: m.role, content: m.content })),
        { role: "user" as const, content: content.trim() },
      ];

      let lastAnswer = "";

      const result = await sendChatMessage(
        allMessages,
        (chunk) => {
          lastAnswer = chunk;
          setMessages((prev) =>
            prev.map((m) =>
              m.id === assistantMessageId ? { ...m, content: chunk } : m
            )
          );
        },
        conversationId || undefined
      );

      setConversationId(result.conversationId);
      setMessages((prev) =>
        prev.map((m) =>
          m.id === assistantMessageId ? { ...m, content: result.answer } : m
        )
      );
    } catch (err) {
      setError("发送消息失败，请稍后重试");
      setMessages((prev) => prev.filter((m) => m.id !== assistantMessageId));
    }

    setIsLoading(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend(input);
    }
  };

  return (
    <section className="relative min-h-screen bg-background">
      <div className="mx-auto flex max-w-3xl flex-col pt-16" style={{ height: "calc(100vh - 80px)" }}>
        <div className="flex items-center justify-between border-b border-hairline px-6 py-3">
          <div className="flex items-center gap-2 font-mono text-xs text-muted-foreground">
            <span className="relative flex h-1.5 w-1.5">
              <span className="absolute inset-0 animate-ping rounded-full bg-primary opacity-75" />
              <span className="relative h-1.5 w-1.5 rounded-full bg-primary" />
            </span>
            {difyReady ? "Connected to Dify" : "Powered by Lumen"}
          </div>
          {!difyReady && (
            <div className="flex items-center gap-1.5 font-mono text-[10px] text-yellow-600">
              <AlertCircle className="h-3 w-3" />
              未配置 Dify API
            </div>
          )}
        </div>

        <div className="flex-1 overflow-y-auto px-4 py-6">
          {error && (
            <div className="mb-4 flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-2 font-mono text-xs text-red-600">
              <AlertCircle className="h-4 w-4" />
              {error}
            </div>
          )}

          <div className="space-y-6">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex gap-3 ${message.role === "user" ? "flex-row-reverse" : ""}`}
              >
                <div
                  className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${
                    message.role === "user"
                      ? "bg-primary/20"
                      : "bg-surface border border-hairline"
                  }`}
                >
                  {message.role === "user" ? (
                    <User className="h-4 w-4 text-primary" />
                  ) : (
                    <Bot className="h-4 w-4 text-muted-foreground" />
                  )}
                </div>
                <div
                  className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                    message.role === "user"
                      ? "bg-primary text-primary-foreground"
                      : "border border-hairline bg-surface text-foreground"
                  }`}
                >
                  <p className="text-sm leading-relaxed whitespace-pre-wrap">{message.content}</p>
                  <p
                    className={`mt-1 font-mono text-[10px] ${
                      message.role === "user" ? "text-primary-foreground/60" : "text-muted-foreground"
                    }`}
                  >
                    {message.timestamp.toLocaleTimeString("zh-CN", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                </div>
              </div>
            ))}

            {isLoading && (
              <div className="flex gap-3">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-surface border border-hairline">
                  <Bot className="h-4 w-4 text-muted-foreground" />
                </div>
                <div className="flex items-center gap-2 rounded-2xl border border-hairline bg-surface px-4 py-3">
                  <Loader2 className="h-4 w-4 animate-spin text-primary" />
                  <span className="font-mono text-xs text-muted-foreground">思考中...</span>
                </div>
              </div>
            )}
          </div>
          <div ref={messagesEndRef} />
        </div>

        {messages.length === 1 && (
          <div className="px-4 pb-2">
            <p className="mb-3 font-mono text-xs text-muted-foreground">试试这样问：</p>
            <div className="flex flex-wrap gap-2">
              {SUGGESTIONS.map((suggestion) => (
                <button
                  key={suggestion}
                  onClick={() => handleSend(suggestion)}
                  className="rounded-full border border-hairline bg-surface px-3 py-1.5 font-mono text-xs text-muted-foreground transition-colors hover:border-primary/40 hover:text-foreground"
                >
                  {suggestion}
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="border-t border-hairline p-4">
          <div className="relative flex items-end gap-3 rounded-2xl border border-hairline bg-surface p-2 focus-within:border-primary/40 focus-within:ring-1 focus-within:ring-primary/20">
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="输入你的问题..."
              rows={1}
              className="flex-1 resize-none bg-transparent px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none"
              style={{ maxHeight: "120px" }}
            />
            <button
              onClick={() => handleSend(input)}
              disabled={!input.trim() || isLoading}
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground transition-all hover:opacity-90 disabled:opacity-40"
            >
              <Send className="h-4 w-4" />
            </button>
          </div>
          <p className="mt-2 text-center font-mono text-[10px] text-muted-foreground/60">
            AI 可能会产生不准确的信息，请谨慎辨别
          </p>
        </div>
      </div>
    </section>
  );
}