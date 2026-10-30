// src/lib/news.ts
import newsData from "@data/news.json";
import { NewsSchema, type News } from "@/schemas/content";

const newsArr: News[] = NewsSchema.array().parse(newsData.news);

const byUpdatedDesc = (a: News, b: News) => {
  const av = a.updatedAt ?? a.date ?? "";
  const bv = b.updatedAt ?? b.date ?? "";
  return bv.localeCompare(av);
};

const publishedNews: News[] = newsArr.filter((n) => n.status === "published").sort(byUpdatedDesc);

export const loadNews = (): News[] => publishedNews;
