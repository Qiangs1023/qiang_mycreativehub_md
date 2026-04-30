import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

type ContentTable = "work" | "writing" | "videos" | "courses" | "about";
type ContentEditBase =
  | "/admin/work"
  | "/admin/writing"
  | "/admin/videos"
  | "/admin/courses"
  | "/admin/about";

type AnyRow = {
  id: string;
  slug: string;
  title: string;
  published: boolean;
  updated_at: string;
};

export function ContentList({
  table,
  editBase,
  title,
  newLabel = "新建",
}: {
  table: ContentTable;
  editBase: ContentEditBase;
  title: string;
  newLabel?: string;
}) {
  const [rows, setRows] = useState<AnyRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [table]);

  async function load() {
    setLoading(true);
    const { data, error } = await supabase
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .from(table as any)
      .select("id,slug,title,published,updated_at")
      .order("updated_at", { ascending: false });
    if (error) toast.error(error.message);
    setRows((data as unknown as AnyRow[]) ?? []);
    setLoading(false);
  }

  async function handleDelete(id: string) {
    if (!confirm("确定删除这一条？此操作不可撤销。")) return;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await supabase.from(table as any).delete().eq("id", id);
    if (error) {
      toast.error(error.message);
    } else {
      toast.success("已删除");
      void load();
    }
  }

  async function handleTogglePublished(row: AnyRow) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await supabase
      .from(table as any)
      .update({ published: !row.published })
      .eq("id", row.id);
    if (error) toast.error(error.message);
    else void load();
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-3xl font-light tracking-tight">{title}</h1>
          <p className="mt-1 text-sm text-muted-foreground">共 {rows.length} 条</p>
        </div>
        <Link
          to={`${editBase}/$id` as "/admin/work/$id"}
          params={{ id: "new" }}
          className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90"
        >
          + {newLabel}
        </Link>
      </div>

      <div className="rounded-xl border border-hairline">
        {loading ? (
          <div className="p-6 text-sm text-muted-foreground">加载中…</div>
        ) : rows.length === 0 ? (
          <div className="p-6 text-sm text-muted-foreground">还没有内容，点击右上角新建。</div>
        ) : (
          <ul className="divide-y divide-hairline">
            {rows.map((r) => (
              <li key={r.id} className="flex items-center gap-3 p-4 text-sm">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="truncate font-medium text-foreground">{r.title}</span>
                    {!r.published && (
                      <span className="rounded bg-muted px-1.5 py-0.5 text-xs text-muted-foreground">
                        草稿
                      </span>
                    )}
                  </div>
                  <p className="mt-0.5 truncate font-mono text-xs text-muted-foreground">
                    {r.slug} · 更新于 {new Date(r.updated_at).toLocaleString()}
                  </p>
                </div>
                <button
                  onClick={() => handleTogglePublished(r)}
                  className="text-xs text-muted-foreground hover:text-foreground"
                >
                  {r.published ? "下架" : "发布"}
                </button>
                <Link
                  to={`${editBase}/$id` as "/admin/work/$id"}
                  params={{ id: r.id }}
                  className="text-xs text-primary hover:underline"
                >
                  编辑
                </Link>
                <button
                  onClick={() => handleDelete(r.id)}
                  className="text-xs text-muted-foreground hover:text-destructive"
                >
                  删除
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
