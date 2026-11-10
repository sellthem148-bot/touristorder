-- À lancer sur Supabase après chaque `prisma db push` qui crée une table
-- (SQL editor, ou psql "$DIRECT_URL" -f prisma/rls.sql).
--
-- L'application lit la base uniquement côté serveur, via Prisma. Les tables
-- créées par Prisma naissent SANS row level security : la clé publique (anon)
-- de Supabase pourrait alors les lire par l'API REST. Activer la RLS sans
-- aucune policy = tout refuser à cette API. Idempotent, ne touche à aucune donnée.
DO $$
DECLARE t record;
BEGIN
  FOR t IN
    SELECT c.relname
    FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname = 'public' AND c.relkind = 'r' AND NOT c.relrowsecurity
  LOOP
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', t.relname);
    RAISE NOTICE 'RLS activée : %', t.relname;
  END LOOP;
END $$;
