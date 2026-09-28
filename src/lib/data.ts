// src/lib/data.ts
import writingsData from "@/data/writings.json";
import worksData from "@/data/works.json";
import videosData from "@/data/videos.json";
import coursesData from "@/data/courses.json";
import aboutData from "@/data/about.json";
import {
  WritingSchema,
  WorkSchema,
  VideoSchema,
  CourseSchema,
  AboutSchema,
  type Writing,
  type Work,
  type Video,
  type Course,
  type About,
} from "@/schemas/content";

const writingsArr: Writing[] = WritingSchema.array().parse(writingsData.writings);
const worksArr: Work[] = WorkSchema.array().parse(worksData.works);
const videosArr: Video[] = VideoSchema.array().parse(videosData.videos);
const coursesArr: Course[] = CourseSchema.array().parse(coursesData.courses);
const aboutObj: About = AboutSchema.parse(aboutData);

export const byDateDesc = (a: { publishedAt?: string; date?: string }, b: { publishedAt?: string; date?: string }) => {
  const av = a.publishedAt ?? a.date ?? "";
  const bv = b.publishedAt ?? b.date ?? "";
  return bv.localeCompare(av);
};

export const byOrderAsc = (a: { order: number }, b: { order: number }) => a.order - b.order;

const publishedWritings: Writing[] = writingsArr
  .filter((w) => w.status === "published")
  .sort(byDateDesc);

const activeWorks: Work[] = worksArr
  .filter((w) => w.status === "active")
  .sort(byOrderAsc);

const publishedVideos: Video[] = videosArr
  .filter((v) => v.status === "published")
  .sort(byDateDesc);

const publishedCourses: Course[] = coursesArr
  .filter((c) => c.status === "published")
  .sort(byOrderAsc);

export const loadWritings = (): Writing[] => publishedWritings;

export const loadWorks = (): Work[] => activeWorks;

export const loadVideos = (): Video[] => publishedVideos;

export const loadCourses = (): Course[] => publishedCourses;

export const loadAbout = (): About => aboutObj;

export const findWriting = (slug: string): Writing | undefined =>
  writingsArr.find((w) => w.slug === slug);

export const findWork = (slug: string): Work | undefined =>
  worksArr.find((w) => w.slug === slug);

export const findVideo = (slug: string): Video | undefined =>
  videosArr.find((v) => v.slug === slug);

export const findCourse = (slug: string): Course | undefined =>
  coursesArr.find((c) => c.slug === slug);

export const neighbours = <T extends { slug: string }>(collection: T[], slug: string) => {
  const i = collection.findIndex((e) => e.slug === slug);
  return {
    prev: i > 0 ? collection[i - 1] : undefined,
    next: i >= 0 && i < collection.length - 1 ? collection[i + 1] : undefined,
  };
};