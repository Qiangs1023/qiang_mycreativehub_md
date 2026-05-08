import { Link } from "@tanstack/react-router";
import { SectionHeader } from "./SectionHeader";
import { writingEntries } from "@/lib/content";

function formatDate(date?: string | null) {
  if (!date) return "";
  const d = date.slice(0, 10);
  const [y, m] = d.split("-");
  return `${y} · ${m}`;
}

export function Writing({ showAction = true }: { showAction?: boolean } = {}) {
  const items = writingEntries.slice(0, 4);

  return (
    <section id="writing" className="relative border-y border-hairline bg-surface/30 py-24 md:py-32">
      <div className="mx-auto max-w-6xl px-6">
        <SectionHeader
          index="02"
          eyebrow="Writing"
          title={<>我<em className="italic text-primary">想清楚</em>的事。</>}
          description="每两周一篇，关于独立工作、产品设计、和如何在不焦虑的前提下生活。"
          action={
            showAction ? (
              <Link to="/writing" className="inline-flex items-center gap-2 font-mono text-xs text-muted-foreground transition-colors hover:text-primary">
                全部文章 →
              </Link>
            ) : undefined
          }
        />

        <ul className="divide-y divide-hairline border-y border-hairline">
          {items.map((post) => (
            <li key={post.meta.slug}>
              <Link
                to="/writing/$slug"
                params={{ slug: post.meta.slug }}
                className="group grid grid-cols-12 items-baseline gap-4 py-6 transition-colors hover:bg-surface md:gap-8"
              >
                <div className="col-span-12 font-mono text-xs text-muted-foreground md:col-span-2">
                  {formatDate(post.meta.date)}
                </div>
                <div className="col-span-12 md:col-span-7">
                  <h3 className="font-display text-2xl font-normal leading-tight text-foreground transition-colors group-hover:text-primary md:text-3xl">
                    {post.meta.title}
                  </h3>
                  {post.meta.excerpt && <p className="mt-2 text-sm text-muted-foreground">{post.meta.excerpt}</p>}
                </div>
                <div className="col-span-6 font-mono text-xs text-muted-foreground md:col-span-2">
                  {post.meta.tag} {post.meta.readTime ? `· ${post.meta.readTime}` : ""}
                </div>
                <div className="col-span-6 text-right font-mono text-xs text-muted-foreground transition-colors group-hover:text-primary md:col-span-1">
                  →
                </div>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
