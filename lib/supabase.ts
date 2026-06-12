import { createClient } from "@supabase/supabase-js";

// Client Supabase « public » (clé anon). Conservé pour compatibilité, mais l'application
// n'y accède plus directement : tout passe par /api/db (clé service_role côté serveur).
// L'URL et la clé proviennent des variables d'environnement → en clonant le repo,
// chacun branche SA propre base.
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseKey, {
  db: { schema: "public" },
});
