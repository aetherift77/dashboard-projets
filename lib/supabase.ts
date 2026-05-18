import { createClient } from "@supabase/supabase-js";

const supabaseUrl =
  "https://pbeonzeklchqtjvtmtfd.supabase.co";

const supabaseKey =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// 🔥 IMPORTANT: disable strict typing
export const supabase = createClient(
  supabaseUrl,
  supabaseKey,
  {
    db: {
      schema: "public",
    },
  }
);