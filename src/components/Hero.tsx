import { motion } from "framer-motion";
import { Link } from "@tanstack/react-router";
import portrait from "@/assets/portrait.jpg";
import { writingEntries } from "@/lib/content";

export function Hero() {
  const latestWriting = writingEntries[0];

  return (
    <section id="top" className="relative overflow-hidden pt-32 pb-24 md:pt-40 md:pb-32">
      <div className="mx-auto grid max-w-6xl grid-cols-1 gap-12 px-6 md:grid-cols-12">
        <div className="md:col-span-7">
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="mb-6 inline-flex items-center gap-2 rounded-full border border-hairline bg-surface/60 px-3 py-1 font-mono text-xs text-muted-foreground backdrop-blur"
          >
            <span className="relative flex h-1.5 w-1.5">
              <span className="absolute inset-0 animate-ping rounded-full bg-primary opacity-75" />
              <span className="relative h-1.5 w-1.5 rounded-full bg-primary" />
            </span>
            正在构建 — Lumen, 一个面向写作者的 AI 工作台
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.05 }}
            className="font-display text-balance text-5xl font-light leading-[1.05] tracking-tight md:text-7xl"
          >
            造物，写作，
            <br />
            然后<em className="italic text-primary">分享</em>。
          </motion.h1>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.7, delay: 0.2 }}
            className="mt-8 max-w-xl text-lg leading-relaxed text-muted-foreground"
          >
            我是数字旷野 — 独立开发者、内容创作者。
            过去三年，我把一个人的工作室做成了 6 位数年收入。这里记录我所做、所写、所教的一切。
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.35 }}
            className="mt-10 flex flex-wrap items-center gap-3"
          >
            <Link
              to="/courses"
              className="group inline-flex items-center gap-2 rounded-full bg-primary px-5 py-3 text-sm font-medium text-primary-foreground transition-transform hover:-translate-y-0.5"
            >
              查看课程
              <span className="transition-transform group-hover:translate-x-1">→</span>
            </Link>
            {latestWriting ? (
              <Link
                to="/writing/$slug"
                params={{ slug: latestWriting.meta.slug }}
                className="inline-flex items-center gap-2 rounded-full border border-hairline px-5 py-3 text-sm text-foreground transition-colors hover:bg-surface"
              >
                阅读最新文章
              </Link>
            ) : (
              <Link
                to="/writing"
                className="inline-flex items-center gap-2 rounded-full border border-hairline px-5 py-3 text-sm text-foreground transition-colors hover:bg-surface"
              >
                浏览文章列表
              </Link>
            )}
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.5 }}
            className="mt-14 grid max-w-md grid-cols-3 gap-6 font-mono text-xs"
          >
            <div>
              <div className="font-display text-3xl text-foreground">12k</div>
              <div className="mt-1 text-muted-foreground">订阅读者</div>
            </div>
            <div>
              <div className="font-display text-3xl text-foreground">48</div>
              <div className="mt-1 text-muted-foreground">已发布文章</div>
            </div>
            <div>
              <div className="font-display text-3xl text-primary">3</div>
              <div className="mt-1 text-muted-foreground">付费产品</div>
            </div>
          </motion.div>
        </div>

        <motion.div
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.9, delay: 0.1 }}
          className="relative md:col-span-5"
        >
          <div className="relative aspect-[4/5] overflow-hidden rounded-2xl border border-hairline shadow-card">
            <img
              src={portrait}
              alt="数字旷野的肖像照片"
              width={896}
              height={1152}
              className="h-full w-full object-cover grayscale-[15%]"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-background via-background/10 to-transparent" />
            <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between font-mono text-xs text-foreground/80">
              <span>// 上海, 2025</span>
              <span className="cursor-blink" />
            </div>
          </div>
          <div className="absolute -right-3 -top-3 hidden rounded-md border border-primary/40 bg-background/80 px-2 py-1 font-mono text-[10px] text-primary backdrop-blur md:block">
            v3.2.0
          </div>
        </motion.div>
      </div>
    </section>
  );
}
