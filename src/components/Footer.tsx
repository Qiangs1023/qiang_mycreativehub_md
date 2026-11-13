import { Link } from "@tanstack/react-router";

const footerLinks = [
  { to: "/writing", label: "写作" },
  { to: "/work", label: "作品" },
  { to: "/videos", label: "视频" },
  { to: "/courses", label: "课程" },
  { to: "/news", label: "资讯" },
  { to: "/about", label: "关于" },
] as const;

export function Footer() {
  return (
    <footer className="hairline-t py-10">
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-6 font-mono text-xs text-muted-foreground md:flex-row">
        <div className="flex items-center gap-2">
          <span className="inline-block h-1.5 w-1.5 rounded-full bg-primary" />
          <span>© 2026 数字旷野 · 创作-开发-出海</span>
        </div>

        <nav className="flex flex-wrap items-center justify-center gap-4">
          {footerLinks.map((l) => (
            <Link
              key={l.to}
              to={l.to}
              className="transition-colors hover:text-primary"
              activeProps={{ className: "text-primary" }}
            >
              {l.label}
            </Link>
          ))}
          <a href="/rss.xml" className="transition-colors hover:text-primary">
            RSS
          </a>
        </nav>

        <div>built in public · with care from 上海</div>
      </div>
    </footer>
  );
}
