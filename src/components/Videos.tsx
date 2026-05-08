import { Link } from "@tanstack/react-router";
import { SectionHeader } from "./SectionHeader";
import { videosEntries } from "@/lib/content";
import { resolveCover } from "@/lib/covers";

export function Videos({ showAction = true }: { showAction?: boolean } = {}) {
  const items = videosEntries.slice(0, 5);

  return (
    <section id="videos" className="relative py-24 md:py-32">
      <div className="mx-auto max-w-6xl px-6">
        <SectionHeader
          index="03"
          eyebrow="On Camera"
          title={<>我在镜头前<em className="italic text-primary">说</em>。</>}
          description="深度长视频、工作日常 vlog、产品复盘。每月 2 支。"
          action={
            showAction ? (
              <Link to="/videos" className="inline-flex items-center gap-2 font-mono text-xs text-muted-foreground transition-colors hover:text-primary">
                全部视频 →
              </Link>
            ) : undefined
          }
        />

        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          {items.map((v, i) => {
            const img = v.meta.cover?.startsWith("http") ? v.meta.cover : resolveCover(v.meta.cover ?? undefined);
            const featured = i === 0;
            const meta = [v.meta.tag, v.meta.date?.slice(0, 4), v.meta.duration].filter(Boolean).join(" · ");
            return (
              <Link
                key={v.meta.slug}
                to="/videos/$slug"
                params={{ slug: v.meta.slug }}
                className={`group relative overflow-hidden rounded-2xl border border-hairline bg-surface ${featured ? "md:col-span-2" : ""}`}
              >
                <div className="relative aspect-video overflow-hidden">
                  {img && (
                    <img src={img} alt={v.meta.title} loading="lazy" className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105" />
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-background/80 via-background/10 to-transparent" />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="flex h-14 w-14 items-center justify-center rounded-full border border-foreground/30 bg-background/40 backdrop-blur transition-all duration-300 group-hover:scale-110 group-hover:border-primary group-hover:bg-primary group-hover:text-primary-foreground">
                      <svg viewBox="0 0 24 24" fill="currentColor" className="ml-0.5 h-5 w-5">
                        <path d="M8 5v14l11-7z" />
                      </svg>
                    </div>
                  </div>
                </div>
                <div className="p-5">
                  <div className="mb-1 font-mono text-[10px] text-muted-foreground">{meta}</div>
                  <h3 className="font-display text-xl font-normal text-foreground transition-colors group-hover:text-primary">
                    {v.meta.title}
                  </h3>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}
