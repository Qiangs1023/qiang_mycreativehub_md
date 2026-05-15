import { Link } from "@tanstack/react-router";
import { Sparkles, ArrowRight } from "lucide-react";

export function AIChatSection() {
  return (
    <section className="border-y border-hairline bg-surface/30 py-16 md:py-24">
      <div className="mx-auto max-w-6xl px-6">
        <div className="flex flex-col items-center justify-between gap-8 md:flex-row">
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-hairline bg-primary/10">
              <Sparkles className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h2 className="font-display text-2xl md:text-3xl">AI 助手</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                24 小时在线，随时为你解答
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <Link
              to="/chat"
              className="group inline-flex items-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-medium text-primary-foreground transition-all hover:-translate-y-0.5 hover:shadow-lg"
            >
              开始对话
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Link>
          </div>
        </div>

        <div className="mt-8 grid grid-cols-1 gap-4 md:grid-cols-3">
          <div className="rounded-xl border border-hairline bg-background/50 p-4">
            <div className="mb-2 font-mono text-xs text-primary">写作助手</div>
            <p className="text-sm text-muted-foreground">
              帮你润色文章、提炼观点、生成大纲
            </p>
          </div>
          <div className="rounded-xl border border-hairline bg-background/50 p-4">
            <div className="mb-2 font-mono text-xs text-primary">编程顾问</div>
            <p className="text-sm text-muted-foreground">
              代码优化、架构建议、技术选型咨询
            </p>
          </div>
          <div className="rounded-xl border border-hairline bg-background/50 p-4">
            <div className="mb-2 font-mono text-xs text-primary">创业伙伴</div>
            <p className="text-sm text-muted-foreground">
              产品构思、市场验证、商业模式分析
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}