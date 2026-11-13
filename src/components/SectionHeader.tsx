type Props = {
  index: string;
  eyebrow: string;
  title: React.ReactNode;
  description?: string;
  action?: React.ReactNode;
  /**
   * 1 = 该区块是当前页的主标题（列表页 /writing 等）
   * 2 = 该区块是首页上的一个板块（默认）
   * 每个页面只应有一个 h1。
   */
  headingLevel?: 1 | 2;
};

export function SectionHeader({
  index,
  eyebrow,
  title,
  description,
  action,
  headingLevel = 2,
}: Props) {
  const Tag = headingLevel === 1 ? "h1" : "h2";

  return (
    <div className="mb-12 grid grid-cols-1 items-end gap-6 md:grid-cols-12">
      <div className="md:col-span-8">
        <div className="mb-4 flex items-center gap-3 font-mono text-xs text-muted-foreground">
          <span className="text-primary">{index}</span>
          <span className="h-px w-8 bg-hairline" />
          <span className="uppercase tracking-[0.2em]">{eyebrow}</span>
        </div>
        <Tag className="font-display text-balance text-4xl font-light leading-[1.1] tracking-tight md:text-5xl">
          {title}
        </Tag>
        {description && (
          <p className="mt-4 max-w-2xl text-base leading-relaxed text-muted-foreground">
            {description}
          </p>
        )}
      </div>
      {action && <div className="md:col-span-4 md:text-right">{action}</div>}
    </div>
  );
}
