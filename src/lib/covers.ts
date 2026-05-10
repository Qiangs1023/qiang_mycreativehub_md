export function resolveCover(key?: string): string | undefined {
  if (!key) return undefined;
  if (key.startsWith("http")) return key;
  if (key.startsWith("/")) return key;
  return undefined;
}