import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

export type WorkRow = Database["public"]["Tables"]["work"]["Row"];
export type WritingRow = Database["public"]["Tables"]["writing"]["Row"];
export type VideoRow = Database["public"]["Tables"]["videos"]["Row"];
export type CourseRow = Database["public"]["Tables"]["courses"]["Row"];

export type AboutRow = {
  id: string;
  slug: string;
  title: string;
  excerpt: string | null;
  content: string | null;
  cover_url: string | null;
  published: boolean;
  created_at: string;
  updated_at: string;
};

export async function fetchWork(): Promise<WorkRow[]> {
  const { data, error } = await supabase
    .from("work")
    .select("*")
    .eq("published", true)
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export async function fetchWorkBySlug(slug: string): Promise<WorkRow | null> {
  const { data, error } = await supabase.from("work").select("*").eq("slug", slug).maybeSingle();
  if (error) throw error;
  return data;
}

export async function fetchWriting(): Promise<WritingRow[]> {
  const { data, error } = await supabase
    .from("writing")
    .select("*")
    .eq("published", true)
    .order("published_at", { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export async function fetchWritingBySlug(slug: string): Promise<WritingRow | null> {
  const { data, error } = await supabase.from("writing").select("*").eq("slug", slug).maybeSingle();
  if (error) throw error;
  return data;
}

export async function fetchVideos(): Promise<VideoRow[]> {
  const { data, error } = await supabase
    .from("videos")
    .select("*")
    .eq("published", true)
    .order("published_at", { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export async function fetchVideoBySlug(slug: string): Promise<VideoRow | null> {
  const { data, error } = await supabase.from("videos").select("*").eq("slug", slug).maybeSingle();
  if (error) throw error;
  return data;
}

export async function fetchCourses(): Promise<CourseRow[]> {
  const { data, error } = await supabase
    .from("courses")
    .select("*")
    .eq("published", true)
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export async function fetchCourseBySlug(slug: string): Promise<CourseRow | null> {
  const { data, error } = await supabase.from("courses").select("*").eq("slug", slug).maybeSingle();
  if (error) throw error;
  return data;
}

export type ContentKind = Database["public"]["Enums"]["content_kind"];

export async function trackView(kind: ContentKind, slug: string) {
  try {
    const { data: auth } = await supabase.auth.getUser();
    await supabase.from("content_views").insert({
      kind,
      slug,
      user_id: auth?.user?.id ?? null,
      referrer: typeof document !== "undefined" ? document.referrer : null,
      user_agent: typeof navigator !== "undefined" ? navigator.userAgent : null,
    });
  } catch {
    // best-effort
  }
}

export function neighboursOf<T extends { slug: string }>(list: T[], slug: string) {
  const i = list.findIndex((x) => x.slug === slug);
  return {
    prev: i > 0 ? list[i - 1] : undefined,
    next: i >= 0 && i < list.length - 1 ? list[i + 1] : undefined,
  };
}

export function formatPrice(cents: number, currency: string) {
  if (!cents) return "免费";
  const v = (cents / 100).toLocaleString();
  if (currency === "CNY") return `¥${v}`;
  if (currency === "USD") return `$${v}`;
  return `${v} ${currency}`;
}

export async function fetchAbout(): Promise<AboutRow | null> {
  const { data, error } = await supabase
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .from("about" as any)
    .select("*")
    .eq("published", true)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) throw error;
  return data as unknown as AboutRow | null;
}
