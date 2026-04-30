import { useState, useRef } from "react";
import { generateContent } from "@/lib/ai.server";
import { toast } from "sonner";
import { marked } from "marked";

type ContentType = "article" | "video_script";

marked.setOptions({ gfm: true, breaks: false });

export function AiAssistant({
  contentType,
  onInsert,
  onClose,
}: {
  contentType: ContentType;
  onInsert: (markdown: string) => void;
  onClose: () => void;
}) {
  const [prompt, setPrompt] = useState("");
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [preview, setPreview] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);

  const typeLabel = contentType === "article" ? "撰写文章" : "口播文案";
  const placeholder =
    contentType === "article"
      ? "例如：写一篇关于独立开发者如何找到第一个付费用户的文章，包含真实案例"
      : "例如：介绍我最近做的一个AI工具，5分钟口播，风格轻松自然";

  const handleGenerate = async () => {
    if (!prompt.trim()) {
      toast.error("请输入话题或要求");
      return;
    }
    setBusy(true);
    setResult(null);
    try {
      const res = await generateContent({ data: { prompt: prompt.trim(), type: contentType } });
      setResult(res.content);
      toast.success("生成完成");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "生成失败");
    } finally {
      setBusy(false);
    }
  };

  const handleInsert = () => {
    if (result) {
      onInsert(result);
      toast.success("已插入到编辑器");
      onClose();
    }
  };

  const renderPreview = () => {
    if (!result) return "";
    return marked.parse(result) as string;
  };

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between border-b border-hairline px-5 py-4">
        <div className="flex items-center gap-2">
          <span className="inline-block h-2 w-2 rounded-full bg-primary" />
          <h3 className="font-mono text-sm text-foreground">AI 助手 · {typeLabel}</h3>
        </div>
        <button
          onClick={onClose}
          className="rounded-md p-1 text-muted-foreground hover:bg-surface hover:text-foreground"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-4 w-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      <div className="flex-1 space-y-5 overflow-y-auto p-5">
        <div>
          <label className="mb-1.5 block font-mono text-xs text-muted-foreground">话题/要求</label>
          <textarea
            rows={4}
            value={prompt}
            placeholder={placeholder}
            onChange={(e) => setPrompt(e.target.value)}
            className="w-full resize-y rounded-lg border border-hairline bg-background px-3 py-2 font-sans text-sm text-foreground placeholder:text-muted-foreground outline-none focus:border-primary"
            onKeyDown={(e) => {
              if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
                e.preventDefault();
                handleGenerate();
              }
            }}
          />
          <p className="mt-1 text-[10px] text-muted-foreground">⌘ + Enter 快速生成</p>
        </div>

        <button
          onClick={handleGenerate}
          disabled={busy || !prompt.trim()}
          className="w-full rounded-md bg-primary px-4 py-2 font-mono text-sm font-medium text-primary-foreground hover:opacity-90 disabled:opacity-40"
        >
          {busy ? "生成中…" : "生成内容"}
        </button>

        {busy && (
          <div className="flex items-center justify-center gap-2 py-8">
            <span className="h-3 w-3 animate-pulse rounded-full bg-primary/60" />
            <span className="font-mono text-xs text-muted-foreground">AI 正在撰写中…</span>
          </div>
        )}

        {result && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-mono text-xs text-muted-foreground">生成结果</span>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setPreview(!preview)}
                  className="rounded px-2 py-0.5 font-mono text-[10px] text-muted-foreground hover:bg-surface hover:text-foreground"
                >
                  {preview ? "源码" : "预览"}
                </button>
                <button
                  onClick={handleInsert}
                  className="rounded bg-primary/10 px-2 py-0.5 font-mono text-[10px] text-primary hover:bg-primary/20"
                >
                  插入到编辑器
                </button>
              </div>
            </div>

            {preview ? (
              <div
                ref={contentRef}
                className="prose-custom rounded-lg border border-hairline bg-surface/50 p-4 text-sm leading-relaxed"
                dangerouslySetInnerHTML={{ __html: renderPreview() }}
              />
            ) : (
              <pre className="max-h-80 overflow-y-auto whitespace-pre-wrap rounded-lg border border-hairline bg-background p-4 font-mono text-xs leading-relaxed text-foreground/80">
                {result}
              </pre>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
