import { Link } from "@tanstack/react-router";
import { SectionHeader } from "./SectionHeader";
import { workEntries } from "@/lib/content";
import { resolveCover } from "@/lib/covers";

export function Work({ showAction = true, limit }: { showAction?: boolean; limit?: number } = {}) {
  const items = limit ? workEntries.slice(0, limit) : workEntries;

  return (
    <section id="work" className="relative py-24 md:py-32">
      <div className="mx-auto max-w-6xl px-6">
        <SectionHeader
          index="01"
          eyebrow="Selected Work"
          title={<>我做过的<em className="italic text-primary">东西</em>。</>}
          description="从一行代码到上线产品。每一个都是我亲手设计、开发、运营的。"
          action={
            showAction ? (
              <Link to="/work" className="inline-flex items-center gap-2 font-mono text-xs text-muted-foreground transition-colors hover:text-primary">
                查看全部 →
              </Link>
            ) : undefined
          }
        />

        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          {items.map((p, i) => {
            const img = resolveCover(p.meta.cover ?? undefined);
            const tag = p.meta.tag;
            return (
              <Link
                key={p.meta.slug}
                to="/work/$slug"
                params={{ slug: p.meta.slug }}
                className="group relative flex flex-col overflow-hidden rounded-2xl border border-hairline bg-surface transition-all duration-500 hover:-translate-y-1 hover:border-primary/40"
              >
                <div className="relative aspect-[4/3] overflow-hidden">
                  {img && (
                    <img src={img} alt={p.meta.title} loading="lazy" className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105" />
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-surface via-transparent to-transparent" />
                  <div className="absolute left-3 top-3 rounded-full border border-hairline bg-background/70 px-2.5 py-1 font-mono text-[10px] text-muted-foreground backdrop-blur">
                    {String(i + 1).padStart(2, "0")} {tag ? `/ ${tag}` : ""}
                  </div>
                </div>
                <div className="flex flex-1 flex-col p-6">
                  <h3 className="font-display text-2xl font-normal text-foreground">{p.meta.title}</h3>
                  {p.meta.excerpt && <p className="mt-2 flex-1 text-sm leading-relaxed text-muted-foreground">{p.meta.excerpt}</p>}
                  {p.meta.stack && p.meta.stack.length > 0 && (
                    <div className="mt-5 flex flex-wrap gap-1.5 font-mono text-[10px] text-muted-foreground">
                      {p.meta.stack.slice(0, 4).map((s: string) => (
                        <span key={s} className="rounded border border-hairline px-2 py-0.5">{s}</span>
                      ))}
                    </div>
                  )}
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}
