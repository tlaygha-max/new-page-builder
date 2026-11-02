CREATE TABLE public.site_visits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  path TEXT NOT NULL,
  referrer TEXT,
  user_agent TEXT,
  ip TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX site_visits_created_at_idx ON public.site_visits (created_at DESC);
CREATE INDEX site_visits_path_idx ON public.site_visits (path);

GRANT ALL ON public.site_visits TO service_role;

ALTER TABLE public.site_visits ENABLE ROW LEVEL SECURITY;

COMMENT ON TABLE public.site_visits IS 'Anonymous page-view tracking for the visitors dashboard. Written and read only via the service role (server-side); no anon/authenticated access.';