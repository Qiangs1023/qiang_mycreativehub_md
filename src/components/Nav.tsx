import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { Menu, X, MessageCircle } from "lucide-react";
import { isDifyConfigured } from "@/lib/dify";

const links = [
  { to: "/start-here", label: "从零开始" },
  { to: "/writing", label: "写作" },
  { to: "/work", label: "作品" },
  { to: "/videos", label: "视频" },
  { to: "/courses", label: "课程" },
  { to: "/about", label: "关于" },
] as const;

export function Nav() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  // Dify 没配就别在导航里摆一个点进去只会看到报错的入口（方案 P0-4）
  const chatEnabled = isDifyConfigured();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileMenuOpen]);

  return (
    <>
      <header
        className={`fixed inset-x-0 top-0 z-50 transition-all duration-300 ${
          scrolled
            ? "border-b border-hairline bg-background/70 backdrop-blur-xl"
            : "border-b border-transparent"
        }`}
      >
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <Link to="/" className="flex items-center gap-2 font-mono text-sm z-50">
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
            {chatEnabled && (
              <Link
                to="/chat"
                className="flex items-center gap-1.5 rounded-full bg-surface px-3 py-1.5 text-sm text-foreground transition-colors hover:bg-primary hover:text-primary-foreground"
              >
                <MessageCircle className="h-4 w-4" />
                AI助手
              </Link>
            )}
            <Link
              to="/courses"
              className="rounded-full bg-primary px-4 py-1.5 text-sm font-medium text-primary-foreground transition-transform hover:-translate-y-0.5"
            >
              课程 →
            </Link>
          </div>

          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="flex items-center justify-center rounded-full p-2 text-muted-foreground transition-colors hover:bg-surface hover:text-foreground md:hidden z-50"
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </header>

      {mobileMenuOpen && (
        <div
          className="fixed inset-0 z-40 bg-background/95 backdrop-blur-xl pt-20"
          onClick={() => setMobileMenuOpen(false)}
        >
          <nav className="flex flex-col items-center justify-center gap-6 pt-12">
            {links.map((l) => (
              <Link
                key={l.to}
                to={l.to}
                onClick={() => setMobileMenuOpen(false)}
                className="font-display text-3xl text-foreground transition-colors hover:text-primary"
              >
                {l.label}
              </Link>
            ))}
            {chatEnabled && (
              <Link
                to="/chat"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-2 font-display text-3xl text-foreground transition-colors hover:text-primary"
              >
                <MessageCircle className="h-8 w-8" />
                AI 助手
              </Link>
            )}
            <Link
              to="/courses"
              onClick={() => setMobileMenuOpen(false)}
              className="mt-4 rounded-full bg-primary px-6 py-3 text-sm font-medium text-primary-foreground"
            >
              课程 →
            </Link>
          </nav>
        </div>
      )}
    </>
  );
}
