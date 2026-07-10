
DROP POLICY IF EXISTS "Anyone can increment visitor count" ON public.visitor_stats;
REVOKE UPDATE ON public.visitor_stats FROM anon, authenticated;

CREATE OR REPLACE FUNCTION public.increment_visitor_count()
RETURNS BIGINT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  new_count BIGINT;
BEGIN
  UPDATE public.visitor_stats
     SET count = count + 1, updated_at = now()
   WHERE id = 1
  RETURNING count INTO new_count;
  RETURN new_count;
END;
$$;

GRANT EXECUTE ON FUNCTION public.increment_visitor_count() TO anon, authenticated;
