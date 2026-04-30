-- =====================================================
-- About table — single-page content management
-- =====================================================
CREATE TABLE public.about (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  excerpt TEXT,
  content TEXT,
  cover_url TEXT,
  published BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TRIGGER trg_about_updated BEFORE UPDATE ON public.about
FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

ALTER TABLE public.about ENABLE ROW LEVEL SECURITY;

CREATE POLICY "about_public_read" ON public.about FOR SELECT
  USING (published = true OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "about_admin_write" ON public.about FOR ALL
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));
