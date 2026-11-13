export function resolveCover(key?: string): string | undefined {
  if (!key) return undefined;
  // 外部图片链接原样返回
  if (/^(https?:)?\/\//.test(key)) return key;
  // 已是绝对路径（以 / 开头）则原样返回
  if (key.startsWith("/")) return key;
  // 相对路径（如 uploads/works/x.jpg）需要拼上 GitHub Pages 的 base 前缀，
  // 否则在子路径部署下会解析成 /works/uploads/... 导致 404
  // import.meta.env 只在 Vite 上下文里存在。单元测试、Node 脚本里它是
  // undefined —— 直接读会抛错，所以这里先兜住。（seo.ts 里也是同样处理。）
  const env = (import.meta as { env?: Record<string, string | undefined> }).env;
  const base = (env?.BASE_URL || "/").replace(/\/$/, "");
  // 文件名里可能有空格（如 "image 20260510111054.jpg"）。
  // 浏览器请求带空格的 URL 时，空格会在传输层被截断，服务端收到的
  // 路径少了后半截 → 404 裂图。encodeURI 只编码路径里的特殊字符，
  // 不会破坏 https:// 与查询串。
  return encodeURI(`${base}/${key}`);
}
