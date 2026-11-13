import { Outlet, Link, createRootRoute, HeadContent, Scripts } from "@tanstack/react-router";
import { Toaster } from "@/components/ui/sonner";

import appCss from "../styles.css?url";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <div className="font-mono text-xs uppercase tracking-[0.2em] text-primary">404</div>
        <h1 className="mt-4 font-display text-4xl font-light text-foreground">这个页面不存在</h1>
        <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
          链接可能已经失效，或者地址拼错了。下面几个入口应该能帮你找到要找的东西。
        </p>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-full bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            回到首页
          </Link>
          <Link
            to="/start-here"
            className="inline-flex items-center justify-center rounded-full border border-hairline px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-surface"
          >
            从零开始
          </Link>
          <Link
            to="/writing"
            className="inline-flex items-center justify-center rounded-full border border-hairline px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-surface"
          >
            文章
          </Link>
          <Link
            to="/courses"
            className="inline-flex items-center justify-center rounded-full border border-hairline px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-surface"
          >
            课程
          </Link>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRoute({
  head: () => ({
    // 这里只放全站级、且**每个页面都会覆盖**的 key。
    // og:* / twitter:* 一律由各路由的 pageSeo() 完整输出 —— 父级的独有 key
    // 会原样漏到子页（meta 只在同名 key 时才被覆盖）。
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "数字旷野 — 独立开发者的 AI 实操档案" },
      {
        name: "description",
        content: "记录一个人如何用 AI 把想法做成产品：独立开发、知识管理、写作与真实复盘。",
      },
      { name: "author", content: "数字旷野" },
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      { rel: "icon", href: "/favicon.svg", type: "image/svg+xml" },
      {
        rel: "alternate",
        type: "application/rss+xml",
        title: "数字旷野 · RSS",
        href: "/rss.xml",
      },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
});

function RootShell({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-CN">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  return (
    <>
      <Outlet />
      <Toaster />
    </>
  );
}
