import { Link } from "@tanstack/react-router";
import { SectionHeader } from "./SectionHeader";
import { coursesEntries } from "@/lib/content";

export function Courses({ limit }: { limit?: number } = {}) {
  const items = limit ? coursesEntries.slice(0, limit) : coursesEntries;

  return (
    <section id="courses" className="relative border-y border-hairline bg-surface/30 py-24 md:py-32">
      <div className="mx-auto max-w-6xl px-6">
        <SectionHeader
          index="04"
          eyebrow="Courses"
          title={<>我把走过的路，<em className="italic text-primary">教给你</em>。</>}
          description="不是教程合集，是我自己每天都在用的方法论。"
        />

        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          {items.map((c, i) => {
            const primary = i === 0;
            return (
              <div
                key={c.meta.slug}
                className={`group relative flex flex-col rounded-2xl border p-7 transition-all duration-500 hover:-translate-y-1 ${
                  primary
                    ? "border-primary/50 bg-gradient-to-b from-surface to-surface-elevated shadow-card glow-primary"
                    : "border-hairline bg-surface hover:border-primary/30"
                }`}
              >
                <h3 className="font-display text-2xl font-normal leading-tight text-foreground">{c.meta.title}</h3>
                {c.meta.excerpt && <p className="mt-2 text-sm text-muted-foreground">{c.meta.excerpt}</p>}

                <div className="mt-6 flex items-baseline gap-3">
                  <span className="font-display text-4xl text-foreground">
                    {c.meta.price || "Free"}
                  </span>
                </div>

                <div className="flex-1" />

                <Link
                  to="/courses/$slug"
                  params={{ slug: c.meta.slug }}
                  className={`mt-6 inline-flex items-center justify-center gap-2 rounded-full px-5 py-3 text-sm font-medium transition-transform hover:-translate-y-0.5 ${
                    primary
                      ? "bg-primary text-primary-foreground"
                      : "border border-hairline text-foreground hover:bg-surface-elevated"
                  }`}
                >
                  查看详情 →
                </Link>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
