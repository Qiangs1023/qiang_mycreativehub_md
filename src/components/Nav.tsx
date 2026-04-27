import { useEffect, useState } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { useAuth } from "@/lib/auth-context";

const links = [
  { to: "/work", label: "Work" },
  { to: "/writing", label: "Writing" },
  { to: "/videos", label: "Videos" },
  { to: "/courses", label: "Courses" },
  { to: "/news", label: "News" },
  { to: "/about", label: "About" },
] as const;

export function Nav() {
  const [scrolled, setScrolled] = useState(false);
  const { user, isAdmin, signOut } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={`fixed inset-x-0 top-0 z-50 transition-all duration-300 ${
        scrolled
          ? "border-b border-hairline bg-background/70 backdrop-blur-xl"
          : "border-b border-transparent"
      }`}
    >
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        <Link to="/" className="flex items-center gap-2 font-mono text-sm">
          <span className="inline-block h-2 w-2 rounded-full bg-primary shadow-[0_0_12px_var(--color-primary)]" />
          <span className="text-foreground">数字旷野</span>
          <span className="text-muted-foreground">/ indie</span>
        </Link>
        <nav className="hidden items-center gap-1 md:flex">
          {links.map((l) => (
            <Link
              key={l.to}
              to={l.to}
              className="rounded-full px-3 py-1.5 text-sm text-muted-foreground transition-colors hover:bg-surface hover:text-foreground"
              activeProps={{ className: "rounded-full px-3 py-1.5 text-sm text-foreground bg-surface" }}
            >
              {l.label}
            </Link>
          ))}
        </nav>
        <div className="hidden items-center gap-2 md:flex">
          {isAdmin && (
            <Link
              to="/admin"
              className="rounded-full border border-hairline px-3 py-1.5 text-xs text-muted-foreground transition-colors hover:bg-surface hover:text-foreground"
            >
              后台
            </Link>
          )}
          {user ? (
            <button
              onClick={() => signOut().then(() => navigate({ to: "/" }))}
              className="rounded-full px-3 py-1.5 text-xs text-muted-foreground hover:text-foreground"
            >
              退出
            </button>
          ) : (
            <Link
              to="/auth"
              className="rounded-full px-3 py-1.5 text-xs text-muted-foreground hover:text-foreground"
            >
              登录
            </Link>
          )}
          <Link
            to="/courses"
            className="rounded-full bg-primary px-4 py-1.5 text-sm font-medium text-primary-foreground transition-transform hover:-translate-y-0.5"
          >
            订阅 →
          </Link>
        </div>
      </div>
    </header>
  );
}
