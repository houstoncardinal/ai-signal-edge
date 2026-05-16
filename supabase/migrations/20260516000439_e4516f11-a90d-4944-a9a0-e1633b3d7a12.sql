DROP POLICY IF EXISTS "Anyone can read broker credentials" ON public.broker_credentials;
DROP POLICY IF EXISTS "Anyone can insert broker credentials" ON public.broker_credentials;
DROP POLICY IF EXISTS "Anyone can update broker credentials" ON public.broker_credentials;
DROP POLICY IF EXISTS "Anyone can delete broker credentials" ON public.broker_credentials;
CREATE POLICY "No direct access" ON public.broker_credentials FOR SELECT USING (false);