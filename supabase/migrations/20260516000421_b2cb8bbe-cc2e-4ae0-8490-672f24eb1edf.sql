CREATE TABLE public.broker_credentials (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  provider TEXT NOT NULL DEFAULT 'alpaca',
  api_key_id TEXT NOT NULL,
  api_secret_key TEXT NOT NULL,
  mode TEXT NOT NULL DEFAULT 'paper' CHECK (mode IN ('paper','live')),
  data_feed TEXT NOT NULL DEFAULT 'iex',
  label TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.broker_credentials ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read broker credentials" ON public.broker_credentials FOR SELECT USING (true);
CREATE POLICY "Anyone can insert broker credentials" ON public.broker_credentials FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can update broker credentials" ON public.broker_credentials FOR UPDATE USING (true);
CREATE POLICY "Anyone can delete broker credentials" ON public.broker_credentials FOR DELETE USING (true);
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$ LANGUAGE plpgsql SET search_path = public;
CREATE TRIGGER broker_credentials_updated_at
  BEFORE UPDATE ON public.broker_credentials
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();