export function resolveCover(key?: string): string | undefined {
  if (!key) return undefined;
  // 外部图片链接原样返回
  if (/^(https?:)?\/\//.test(key)) return key;
  // 已是绝对路径（以 / 开头）则原样返回
  if (key.startsWith("/")) return key;
  // 相对路径（如 uploads/works/x.jpg）需要拼上 GitHub Pages 的 base 前缀，
  // 否则在子路径部署下会解析成 /works/uploads/... 导致 404
  const base = (import.meta.env.BASE_URL || "/").replace(/\/$/, "");
  return `${base}/${key}`;
}
