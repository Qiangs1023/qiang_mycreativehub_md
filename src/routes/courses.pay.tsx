import { createFileRoute, Link } from "@tanstack/react-router";
import { findEntry, coursesEntries } from "@/lib/content";

export const Route = createFileRoute("/courses/pay")({
  loader: ({ location }) => {
    const params = new URLSearchParams(location.search);
    const slug = params.get("slug");
    if (!slug) throw new Error("课程不存在");
    const entry = findEntry(coursesEntries, slug);
    if (!entry) throw new Error("课程不存在");
    return entry;
  },
  component: PayPage,
});

function PayPage() {
  const course = Route.useLoaderData();
  
  if (!course) {
    return (
      <div className="mx-auto max-w-2xl px-6 py-24 text-center">
        <h1 className="font-display text-3xl">课程不存在</h1>
        <Link to="/courses" className="mt-6 text-primary">← 返回课程列表</Link>
      </div>
    );
  }
  
  const { meta } = course;

  return (
    <div className="mx-auto max-w-2xl px-6 py-24">
      <Link
        to="/courses"
        className="inline-flex items-center gap-2 font-mono text-xs text-muted-foreground transition-colors hover:text-primary"
      >
        ← 返回课程列表
      </Link>

      <div className="mt-12 rounded-[2rem] border border-hairline bg-surface/40 p-8 md:p-10">
        <div className="text-center">
          <span className="font-mono text-xs text-primary">报名课程</span>
          <h1 className="mt-3 font-display text-3xl">{meta.title}</h1>
          <p className="mt-4 font-display text-5xl text-primary">{meta.price}</p>
        </div>

        <div className="mt-10 space-y-6">
          <div className="rounded-xl border border-hairline bg-background p-6 text-center">
            <p className="mb-4 font-mono text-xs text-muted-foreground">微信扫码支付</p>
            <div className="mx-auto max-w-[200px] rounded-lg border border-hairline bg-surface p-3">
              <img
                src="/images/wechat-pay.png"
                alt="微信支付"
                className="mx-auto h-auto w-full"
              />
            </div>
          </div>

          <div className="rounded-xl bg-primary/10 p-6">
            <h3 className="font-mono text-xs text-muted-foreground">报名流程</h3>
            <ol className="mt-4 space-y-2 text-sm">
              <li className="flex items-center gap-2">
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary text-xs text-primary-foreground">1</span>
                扫码支付 {meta.price}
              </li>
              <li className="flex items-center gap-2">
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary text-xs text-primary-foreground">2</span>
                添加下方微信，备注"报名课程"
              </li>
              <li className="flex items-center gap-2">
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary text-xs text-primary-foreground">3</span>
                等待拉入课程群
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
    </div>
  );
}
