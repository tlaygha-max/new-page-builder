CREATE TABLE public.card_activation_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  card_title TEXT NOT NULL,
  ip TEXT,
  user_agent TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX card_activation_requests_created_at_idx ON public.card_activation_requests (created_at DESC);

GRANT ALL ON public.card_activation_requests TO service_role;

ALTER TABLE public.card_activation_requests ENABLE ROW LEVEL SECURITY;

COMMENT ON TABLE public.card_activation_requests IS 'Card activation requests from the demo gateway. Stores only the product name, IP and browser — never card numbers, CVV, expiry or holder names. Service-role access only.';