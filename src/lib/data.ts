// src/lib/data.ts
import writingsData from "@data/writings.json";
import worksData from "@data/works.json";
import videosData from "@data/videos.json";
import coursesData from "@data/courses.json";
import aboutData from "@data/about.json";
import newsData from "@data/news.json";
import {
  WritingSchema,
  WorkSchema,
  VideoSchema,
  CourseSchema,
  NewsSchema,
  AboutSchema,
  type Writing,
  type Work,
  type Video,
  type Course,
  type News,
  type About,
} from "@/schemas/content";

const writingsArr: Writing[] = WritingSchema.array().parse(writingsData.writings);
const worksArr: Work[] = WorkSchema.array().parse(worksData.works);
const videosArr: Video[] = VideoSchema.array().parse(videosData.videos);
const coursesArr: Course[] = CourseSchema.array().parse(coursesData.courses);
const newsArr: News[] = NewsSchema.array().parse(newsData.news);
const aboutObj: About = AboutSchema.parse(aboutData);

export const byDateDesc = (
  a: { publishedAt?: string; updatedAt?: string; date?: string },
  b: { publishedAt?: string; updatedAt?: string; date?: string },
) => {
  const av = a.publishedAt ?? a.updatedAt ?? a.date ?? "";
  const bv = b.publishedAt ?? b.updatedAt ?? b.date ?? "";
  return bv.localeCompare(av);
};

export const byOrderAsc = (a: { order: number }, b: { order: number }) => a.order - b.order;

const publishedWritings: Writing[] = writingsArr
  .filter((w) => w.status === "published")
  .sort(byDateDesc);

const activeWorks: Work[] = worksArr.filter((w) => w.status === "active").sort(byOrderAsc);

const publishedVideos: Video[] = videosArr.filter((v) => v.status === "published").sort(byDateDesc);

const publishedCourses: Course[] = coursesArr
  .filter((c) => c.status === "published")
  .sort(byOrderAsc);

const publishedNews: News[] = newsArr.filter((n) => n.status === "published").sort(byDateDesc);

export const loadWritings = (): Writing[] => publishedWritings;

export const loadWorks = (): Work[] => activeWorks;

export const loadVideos = (): Video[] => publishedVideos;

export const loadCourses = (): Course[] => publishedCourses;

export const loadNews = (): News[] => publishedNews;

export const loadAbout = (): About => aboutObj;

export const findPublishedWriting = <T extends { slug: string; status: string }>(
  writings: T[],
  slug: string,
): T | undefined => writings.find((w) => w.status === "published" && w.slug === slug);

export const findEntryByStatus = <T extends { slug: string; status: string }>(
  entries: T[],
  slug: string,
  allowedStatuses: ReadonlySet<string>,
): T | undefined => entries.find((item) => allowedStatuses.has(item.status) && item.slug === slug);

export const findWriting = (slug: string): Writing | undefined =>
  findPublishedWriting(writingsArr, slug);

export const findWork = (slug: string): Work | undefined =>
  findEntryByStatus(activeWorks, slug, new Set(["active"]));

export const findVideo = (slug: string): Video | undefined =>
  findEntryByStatus(publishedVideos, slug, new Set(["published"]));

export const findCourse = (slug: string): Course | undefined =>
  findEntryByStatus(publishedCourses, slug, new Set(["published"]));

export const neighbours = <T extends { slug: string }>(collection: T[], slug: string) => {
  const i = collection.findIndex((e) => e.slug === slug);
  return {
    prev: i > 0 ? collection[i - 1] : undefined,
    next: i >= 0 && i < collection.length - 1 ? collection[i + 1] : undefined,
  };
};
