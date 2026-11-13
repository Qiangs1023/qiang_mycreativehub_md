import { Link } from "@tanstack/react-router";
import { intents, type IntentTarget } from "@/lib/intents";

/**
 * 意图入口的链接适配器。
 *
 * TanStack 的 `Link` 在类型层面要求 `to` 是路由模式 + 对应的 params，
 * 而 intents 里同一批目标既有静态路由（/work）也有参数路由（/courses/$slug）。
 * 这里统一收口，避免每个调用点各写一遍类型体操。
 */
const TargetLink = Link as unknown as React.ComponentType<{
  to: string;
  params?: Record<string, string>;
  className?: string;
  children?: React.ReactNode;
}>;

function TrailLink({ target }: { target: IntentTarget }) {
  return (
    <TargetLink to={target.to} params={target.params} className="transition-colors hover:text-primary">
      {target.label}
    </TargetLink>
  );
}

/**
 * 「你想做什么？」—— 用用户意图而不是栏目名做入口。
 * 首页和 /start-here 共用 src/lib/intents.ts 的同一份数据。
 */
export function IntentPaths({ compact = false }: { compact?: boolean } = {}) {
  return (
    <section id="start-here" className="relative border-y border-hairline bg-surface/30 py-20 md:py-24">
      <div className="mx-auto max-w-6xl px-6">
        <div className="mb-10 grid grid-cols-1 items-end gap-6 md:grid-cols-12">
          <div className="md:col-span-8">
            <div className="mb-4 flex items-center gap-3 font-mono text-xs text-muted-foreground">
              <span className="text-primary">00</span>
              <span className="h-px w-8 bg-hairline" />
              <span className="uppercase tracking-[0.2em]">Start Here</span>
            </div>
            <h2 className="font-display text-balance text-4xl font-light leading-[1.1] tracking-tight md:text-5xl">
              你想<em className="italic text-primary">做什么</em>？
            </h2>
            <p className="mt-4 max-w-2xl text-base leading-relaxed text-muted-foreground">
              不知道该从哪开始也没关系 —— 挑一个最像你现在处境的，剩下的路跟我一起探索。
            </p>
          </div>
          <div className="md:col-span-4 md:text-right">
            <Link
              to="/start-here"
              className="inline-flex items-center gap-2 font-mono text-xs text-muted-foreground transition-colors hover:text-primary"
            >
              完整路线图 →
            </Link>
          </div>
        </div>

        <ul className="divide-y divide-hairline border-y border-hairline">
          {intents.map((item) => (
            <li key={item.index}>
              {/*
                整行可点，但行内还有一串路径链链接（每个都是 <a>）。
                这里用「拉伸链接」而不是把整行包成 <a>：
                <a> 套 <a> 是非法 HTML，浏览器的 HTML 解析器会自动拆开外层 <a>，
                导致客户端 DOM 结构与 React 预期不一致 → hydration 失败（React #418）
                → 整棵树在客户端重建 → framer-motion 的 initial opacity:0 永远不解除
                → 首页首屏整块隐形。

                所以：外层是 <div>，标题是主链接并用 after:inset-0 撑满整行，
                路径链用 relative z-10 浮在拉伸层之上，保持各自可点。
              */}
              <div className="group relative grid grid-cols-12 items-baseline gap-4 py-6 transition-colors hover:bg-surface md:gap-8">
                <div className="col-span-3 font-mono text-xs text-primary md:col-span-1">
                  {item.index}
                </div>
                <div className="col-span-9 md:col-span-6">
                  <h3 className="font-display text-xl font-normal leading-snug text-foreground transition-colors group-hover:text-primary md:text-2xl">
                    <TargetLink
                      to={item.cta.to}
                      params={item.cta.params}
                      className="after:absolute after:inset-0 after:content-['']"
                    >
                      {item.title}
                    </TargetLink>
                  </h3>
                  {!compact && (
                    <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                      {item.note}
                    </p>
                  )}
                </div>
                <div className="col-span-12 font-mono text-xs text-muted-foreground md:col-span-4">
                  {item.trail.map((t, i) => (
                    <span key={t.href} className="relative z-10 inline-block">
                      {i > 0 && <span className="mx-2 text-primary">→</span>}
                      <TrailLink target={t} />
                    </span>
                  ))}
                </div>
                <div className="col-span-12 text-right font-mono text-xs text-muted-foreground transition-colors group-hover:text-primary md:col-span-1">
                  →
                </div>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
