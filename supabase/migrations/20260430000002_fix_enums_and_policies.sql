-- Migration: Fix ENUM issues and RLS policies
-- This migration is applied AFTER the main schema migration.
-- It converts app_role ENUM to TEXT and recreates all RLS policies with TEXT comparisons.
-- Run this if you have issues with RLS policies referencing ENUM types.

-- Step 1: Drop all policies that depend on app_role ENUM
DROP POLICY IF EXISTS "profiles_select_self_or_admin" ON public.profiles;
DROP POLICY IF EXISTS "profiles_update_self" ON public.profiles;
DROP POLICY IF EXISTS "profiles_admin_all" ON public.profiles;
DROP POLICY IF EXISTS "user_roles_select_self_or_admin" ON public.user_roles;
DROP POLICY IF EXISTS "user_roles_select_all" ON public.user_roles;
DROP POLICY IF EXISTS "user_roles_admin_write" ON public.user_roles;
DROP POLICY IF EXISTS "work_public_read" ON public.work;
DROP POLICY IF EXISTS "work_admin_write" ON public.work;
DROP POLICY IF EXISTS "writing_public_read" ON public.writing;
DROP POLICY IF EXISTS "writing_admin_write" ON public.writing;
DROP POLICY IF EXISTS "videos_public_read" ON public.videos;
DROP POLICY IF EXISTS "videos_admin_write" ON public.videos;
DROP POLICY IF EXISTS "courses_public_read" ON public.courses;
DROP POLICY IF EXISTS "courses_admin_write" ON public.courses;
DROP POLICY IF EXISTS "course_lessons_public_read" ON public.course_lessons;
DROP POLICY IF EXISTS "course_lessons_admin_write" ON public.course_lessons;
DROP POLICY IF EXISTS "about_public_read" ON public.about;
DROP POLICY IF EXISTS "about_admin_write" ON public.about;
DROP POLICY IF EXISTS "content_views_insert" ON public.content_views;
DROP POLICY IF EXISTS "enrollments_select" ON public.enrollments;
DROP POLICY IF EXISTS "covers_public_read" ON storage.objects;
DROP POLICY IF EXISTS "covers_admin_write" ON storage.objects;
DROP POLICY IF EXISTS "covers_admin_update" ON storage.objects;
DROP POLICY IF EXISTS "covers_admin_delete" ON storage.objects;
DROP POLICY IF EXISTS "media_public_read" ON storage.objects;
DROP POLICY IF EXISTS "media_admin_write" ON storage.objects;
DROP POLICY IF EXISTS "media_admin_update" ON storage.objects;
DROP POLICY IF EXISTS "media_admin_delete" ON storage.objects;
DROP POLICY IF EXISTS "course_videos_admin_read" ON storage.objects;
DROP POLICY IF EXISTS "course_videos_admin_write" ON storage.objects;

-- Step 2: Drop helper functions that depend on ENUM
DROP FUNCTION IF EXISTS public.has_role(UUID, app_role);
DROP FUNCTION IF EXISTS public.is_admin(UUID);

-- Step 3: Drop ENUM types (if they exist)
DROP TYPE IF EXISTS public.app_role;

-- Step 4: Convert user_roles.role column to TEXT
ALTER TABLE public.user_roles ALTER COLUMN role TYPE TEXT;

-- Step 5: Create RLS policies using plain TEXT comparison
-- profiles: own + admin
CREATE POLICY "profiles_select_self_or_admin" ON public.profiles FOR SELECT
  USING (auth.uid() = id OR EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin'));
CREATE POLICY "profiles_update_self" ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- user_roles: all authenticated users can read (admin check is done client-side in AuthContext)
CREATE POLICY "user_roles_select_all" ON public.user_roles FOR SELECT USING (true);
CREATE POLICY "user_roles_admin_write" ON public.user_roles FOR ALL
  USING (EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin'))
  WITH CHECK (EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin'));

-- work: published or admin
CREATE POLICY "work_public_read" ON public.work FOR SELECT
  USING (published = true OR EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin'));
CREATE POLICY "work_admin_write" ON public.work FOR ALL
  USING (EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin'))
  WITH CHECK (EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin'));

-- writing: published or admin
CREATE POLICY "writing_public_read" ON public.writing FOR SELECT
  USING (published = true OR EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin'));
CREATE POLICY "writing_admin_write" ON public.writing FOR ALL
  USING (EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin'))
  WITH CHECK (EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin'));

-- videos: published or admin
CREATE POLICY "videos_public_read" ON public.videos FOR SELECT
  USING (published = true OR EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin'));
CREATE POLICY "videos_admin_write" ON public.videos FOR ALL
  USING (EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin'))
  WITH CHECK (EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin'));

-- courses: published or admin
CREATE POLICY "courses_public_read" ON public.courses FOR SELECT
  USING (published = true OR EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin'));
CREATE POLICY "courses_admin_write" ON public.courses FOR ALL
  USING (EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin'))
  WITH CHECK (EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin'));

-- course_lessons: free, enrolled, or admin
CREATE POLICY "course_lessons_public_read" ON public.course_lessons FOR SELECT
  USING (
    is_free = true
    OR EXISTS (SELECT 1 FROM public.enrollments WHERE user_id = auth.uid() AND course_id = public.course_lessons.course_id)
    OR EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin')
  );
CREATE POLICY "course_lessons_admin_write" ON public.course_lessons FOR ALL
  USING (EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin'))
  WITH CHECK (EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin'));

-- about: public read, admin write
CREATE POLICY "about_public_read" ON public.about FOR SELECT USING (true);
CREATE POLICY "about_admin_write" ON public.about FOR ALL
  USING (EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin'))
  WITH CHECK (EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin'));

-- content_views: own or admin
CREATE POLICY "content_views_insert" ON public.content_views FOR INSERT
  WITH CHECK (auth.uid() = user_id OR EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin'));

-- enrollments: own or admin
CREATE POLICY "enrollments_select" ON public.enrollments FOR SELECT
  USING (auth.uid() = user_id OR EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin'));

-- storage: public read for covers/media, admin write for all
CREATE POLICY "covers_public_read" ON storage.objects FOR SELECT USING (bucket_id = 'covers');
CREATE POLICY "covers_admin_write" ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'covers' AND EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin'));
CREATE POLICY "covers_admin_update" ON storage.objects FOR UPDATE
  USING (bucket_id = 'covers' AND EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin'));
CREATE POLICY "covers_admin_delete" ON storage.objects FOR DELETE
  USING (bucket_id = 'covers' AND EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin'));

CREATE POLICY "media_public_read" ON storage.objects FOR SELECT USING (bucket_id = 'media');
CREATE POLICY "media_admin_write" ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'media' AND EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin'));
CREATE POLICY "media_admin_update" ON storage.objects FOR UPDATE
  USING (bucket_id = 'media' AND EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin'));
CREATE POLICY "media_admin_delete" ON storage.objects FOR DELETE
  USING (bucket_id = 'media' AND EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin'));

CREATE POLICY "course_videos_admin_read" ON storage.objects FOR SELECT
  USING (bucket_id = 'course-videos' AND EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin'));
CREATE POLICY "course_videos_admin_write" ON storage.objects FOR ALL
  USING (bucket_id = 'course-videos' AND EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin'))
  WITH CHECK (bucket_id = 'course-videos' AND EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin'));
