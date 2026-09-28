// src/schemas/content.ts
import { z } from "zod";

export const WritingSchema = z.object({
  slug: z.string(),
  title: z.string().min(1),
  excerpt: z.string().optional(),
  date: z.string().optional(),
  publishedAt: z.string().optional(),
  tag: z.string().optional(),
  tags: z.array(z.string()).default([]),
  readTime: z.string().optional(),
  cover: z.string().optional(),
  bodyMarkdown: z.string().default(""),
  bodyHtml: z.string().default(""),
  status: z.enum(["draft", "published"]),
  featured: z.boolean().default(false),
});

export const WorkSchema = z.object({
  slug: z.string(),
  title: z.string().min(1),
  excerpt: z.string().optional(),
  date: z.string().optional(),
  publishedAt: z.string().optional(),
  tag: z.string().optional(),
  status: z.enum(["active", "archived"]),
  cover: z.string().optional(),
  stack: z.array(z.string()).default([]),
  link: z.string().optional(),
  bodyMarkdown: z.string().default(""),
  bodyHtml: z.string().default(""),
  featured: z.boolean().default(false),
  order: z.number().default(0),
});

export const VideoSchema = z.object({
  slug: z.string(),
  title: z.string().min(1),
  excerpt: z.string().optional(),
  date: z.string().optional(),
  publishedAt: z.string().optional(),
  tag: z.string().optional(),
  status: z.enum(["draft", "published"]),
  cover: z.string().optional(),
  platform: z.string().optional(),
  duration: z.string().optional(),
  views: z.string().optional(),
  videoUrl: z.string().optional(),
  bodyMarkdown: z.string().default(""),
  bodyHtml: z.string().default(""),
  featured: z.boolean().default(false),
  order: z.number().default(0),
});

export const CourseSchema = z.object({
  slug: z.string(),
  title: z.string().min(1),
  excerpt: z.string().optional(),
  date: z.string().optional(),
  publishedAt: z.string().optional(),
  tag: z.string().optional(),
  status: z.enum(["draft", "published"]),
  cover: z.string().optional(),
  price: z.string().optional(),
  original: z.string().optional(),
  students: z.string().optional(),
  features: z.array(z.string()).default([]),
  primary: z.boolean().default(false),
  badge: z.string().optional(),
  cta: z.string().optional(),
  url: z.string().optional(),
  bodyMarkdown: z.string().default(""),
  bodyHtml: z.string().default(""),
  featured: z.boolean().default(false),
  order: z.number().default(0),
});

export const AboutSchema = z.object({
  key: z.literal("about"),
  title: z.string(),
  excerpt: z.string().optional(),
  cover: z.string().optional(),
  bodyMarkdown: z.string().default(""),
  bodyHtml: z.string().default(""),
});

export type Writing = z.infer<typeof WritingSchema>;
export type Work = z.infer<typeof WorkSchema>;
export type Video = z.infer<typeof VideoSchema>;
export type Course = z.infer<typeof CourseSchema>;
export type About = z.infer<typeof AboutSchema>;