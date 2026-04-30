import { createFileRoute, Link, Outlet, useNavigate, useLocation } from "@tanstack/react-router";
import { useEffect } from "react";
import { useAuth } from "@/lib/auth-context";

export const Route = createFileRoute("/admin")({
  head: () => ({
    meta: [{ title: "管理后台 — 数字旷野" }, { name: "robots", content: "noindex" }],
  }),
  component: AdminLayout,
});

const navItems = [
  { to: "/admin" as const, label: "概览", exact: true },
  { to: "/admin/work" as const, label: "作品" },
  { to: "/admin/writing" as const, label: "文章" },
  { to: "/admin/videos" as const, label: "视频" },
  { to: "/admin/courses" as const, label: "课程" },
  { to: "/admin/about" as const, label: "关于" },
  { to: "/admin/users" as const, label: "用户" },
];

function AdminLayout() {
  const { user, isAdmin, configured, loading, signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (loading) return;
    if (!user) {
      navigate({ to: "/auth" });
    }
  }, [user, loading, navigate]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center text-sm text-muted-foreground">
        加载中…
      </div>
    );
  }

  if (!configured) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 px-6 text-center">
        <h1 className="font-display text-3xl">后台未启用</h1>
        <p className="max-w-md text-sm text-muted-foreground">
          当前 GitHub Pages 版本未配置 Supabase 环境变量，所以后台与登录功能不可用。
        </p>
        <Link to="/" className="text-sm text-primary hover:underline">
          返回首页 →
        </Link>
      </div>
    );
  }

  if (!user) return null;

  if (!isAdmin) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 px-6 text-center">
        <h1 className="font-display text-3xl">无权访问</h1>
        <p className="max-w-md text-sm text-muted-foreground">
          此区域仅限管理员。如需提升权限，请联系站点所有者。
        </p>
        <Link to="/" className="text-sm text-primary hover:underline">
          返回首页 →
        </Link>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-background">
      <aside className="sticky top-0 hidden h-screen w-56 shrink-0 border-r border-hairline bg-surface/30 p-6 md:block">
        <Link to="/" className="mb-8 flex items-center gap-2 font-mono text-sm">
          <span className="inline-block h-2 w-2 rounded-full bg-primary" />
          <span>admin</span>
        </Link>
        <nav className="flex flex-col gap-1">
          {navItems.map((item) => {
            const isActive = item.exact
              ? location.pathname === item.to
              : location.pathname.startsWith(item.to);
            return (
              <Link
                key={item.to}
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                to={item.to as any}
                className={`rounded-md px-3 py-1.5 text-sm transition-colors ${
                  isActive
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:bg-surface hover:text-foreground"
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>
        <div className="mt-8 border-t border-hairline pt-4">
          <p className="truncate text-xs text-muted-foreground">{user.email}</p>
          <button
            onClick={() => signOut().then(() => navigate({ to: "/" }))}
            className="mt-2 text-xs text-muted-foreground hover:text-foreground"
          >
            退出登录
          </button>
        </div>
      </aside>

      <main className="min-w-0 flex-1">
        {/* mobile top bar */}
        <div className="flex items-center gap-2 overflow-x-auto border-b border-hairline px-4 py-3 md:hidden">
          {navItems.map((item) => (
            <Link
              key={item.to}
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              to={item.to as any}
              className="whitespace-nowrap rounded-md px-3 py-1 text-xs text-muted-foreground hover:text-foreground"
              activeProps={{
                className:
                  "whitespace-nowrap rounded-md px-3 py-1 text-xs text-primary bg-primary/10",
              }}
            >
              {item.label}
            </Link>
          ))}
        </div>
        <div className="mx-auto max-w-5xl p-6 md:p-10">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
