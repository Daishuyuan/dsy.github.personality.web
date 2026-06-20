import { createClient } from "@supabase/supabase-js";
import { getCmsEnv } from "./env.ts";

export function getSupabaseStorageClient() {
  const env = getCmsEnv();
  if (!env.supabaseUrl || !env.supabaseServiceRoleKey) {
    return null;
  }
  return createClient(env.supabaseUrl, env.supabaseServiceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false
    }
  });
}
