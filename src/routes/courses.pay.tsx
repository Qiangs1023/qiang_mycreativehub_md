import { createFileRoute, Link } from "@tanstack/react-router";
import { findCourse, loadCourses } from "@/lib/data";
import { pageSeo } from "@/lib/seo";

export const Route = createFileRoute("/courses/pay")({
  loader: ({ location }) => {
    const params = new URLSearchParams(location.search);
    const slug = params.get("slug");
    if (!slug) return null;
    const entry = findCourse(slug);
    return entry ?? null;
  },
  head: () =>
    pageSeo({
      path: "/courses/pay",
      title: "课程报名 — 数字旷野",
      description: "选择课程后扫码联系，完成报名后拉入课程群。",
      // 交易页没有独立索引价值，别进搜索结果
      noIndex: true,
    }),
  notFoundComponent: () => (
    <div className="mx-auto max-w-2xl px-6 py-24 text-center">
      <h1 className="font-display text-3xl">课程不存在</h1>
      <Link to="/courses" className="mt-6 inline-block text-primary">
        ← 返回课程列表
      </Link>
    </div>
  ),
  component: PayPage,
});

function PayPage() {
  const course = Route.useLoaderData();

  // 没有 ?slug= 时不要渲染空白页（预渲染出来就是一个零 H1 的空壳），
  // 改成让访客直接挑一门课。
  if (!course) {
    const courses = loadCourses();
    return (
      <main className="mx-auto min-h-screen max-w-3xl px-6 pt-36 pb-24">
        <div className="font-mono text-xs uppercase tracking-[0.2em] text-primary">
          报名
        </div>
        <h1 className="mt-3 font-display text-4xl font-light">选一门课开始</h1>
        <p className="mt-4 text-muted-foreground">
          选好后进入报名页，扫码联系即可完成报名并拉入课程群。
        </p>

        <ul className="mt-10 divide-y divide-hairline border-y border-hairline">
          {courses.map((c) => (
            <li key={c.slug}>
              <Link
                to="/courses/pay"
                search={{ slug: c.slug }}
                className="group flex items-center justify-between gap-4 py-5 transition-colors hover:bg-surface"
              >
                <div className="min-w-0">
                  <h2 className="font-display text-xl font-normal text-foreground transition-colors group-hover:text-primary">
                    {c.title}
                  </h2>
                  {c.excerpt && (
                    <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                      {c.excerpt}
                    </p>
                  )}
                </div>
                <div className="shrink-0 font-display text-2xl text-foreground">
                  {c.price}
                </div>
              </Link>
            </li>
          ))}
        </ul>

        <Link
          to="/courses"
          className="mt-8 inline-flex items-center gap-2 font-mono text-xs text-muted-foreground transition-colors hover:text-primary"
        >
          ← 返回课程列表
        </Link>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-2xl px-6 pt-36 pb-24">
      <Link
        to="/courses"
        className="inline-flex items-center gap-2 font-mono text-xs text-muted-foreground transition-colors hover:text-primary"
      >
        ← 返回课程列表
      </Link>

      <div className="mt-12 rounded-[2rem] border border-hairline bg-surface/40 p-8 md:p-10">
        <div className="text-center">
          <span className="font-mono text-xs text-primary">报名课程</span>
          <h1 className="mt-3 font-display text-3xl">{course.title}</h1>
          <p className="mt-4 font-display text-5xl text-primary">{course.price}</p>
        </div>

        <div className="mt-10 space-y-6">
          <div className="rounded-xl border border-hairline bg-background p-6 text-center">
            <p className="mb-1 font-mono text-xs text-muted-foreground">微信扫码联系</p>
            <p className="mb-4 text-xs leading-relaxed text-muted-foreground">
              扫码添加微信后备注课程名，付款并拉群。
            </p>
            <div className="mx-auto max-w-[200px] rounded-lg border border-hairline bg-surface p-3">
              <img
                src="/images/wechat-pay.jpg"
                alt="数字旷野的微信二维码，扫码添加后备注课程名"
                width={673}
                height={701}
                className="mx-auto h-auto w-full"
              />
            </div>
          </div>

          <div className="rounded-xl bg-primary/10 p-6">
            <h2 className="font-mono text-xs text-muted-foreground">报名流程</h2>
            <ol className="mt-4 space-y-2 text-sm">
              <li className="flex items-center gap-2">
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary text-xs text-primary-foreground">
                  1
                </span>
                扫码添加下方微信，备注「{course.title}」
              </li>
              <li className="flex items-center gap-2">
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary text-xs text-primary-foreground">
                  2
                </span>
                微信转账 {course.price}
              </li>
              <li className="flex items-center gap-2">
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary text-xs text-primary-foreground">
                  3
                </span>
                收到确认后拉入课程群
              </li>
            </ol>
          </div>

          <div className="flex items-center justify-center gap-3 rounded-xl border border-primary/30 bg-primary/5 p-6">
            <div className="text-center">
              <p className="font-mono text-xs text-muted-foreground">微信联系</p>
              <p className="mt-2 font-mono text-sm text-foreground">qiang_life</p>
              <p className="mt-4 text-xs text-muted-foreground">24小时内回复</p>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
