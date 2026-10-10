import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { supabasePublic } from '@/config/supabasePublic';

let client: SupabaseClient | null = null;

export function getSupabaseConfig() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim() || supabasePublic.url;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim() || supabasePublic.anonKey;
  return { url, anonKey, isConfigured: Boolean(url && anonKey) };
}

export function getSupabaseClient(): SupabaseClient | null {
  const { url, anonKey, isConfigured } = getSupabaseConfig();
  if (!isConfigured) return null;
  if (!client) {
    client = createClient(url, anonKey);
  }
  return client;
}
