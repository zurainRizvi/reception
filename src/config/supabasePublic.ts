/**
 * Browser-safe Supabase project credentials (anon key only).
 * Used as build-time fallback when Vercel env vars are missing, so RSVPs
 * still reach the shared database instead of only localStorage.
 */
export const supabasePublic = {
  url: 'https://hwgjjnnbkxgazlrbrzql.supabase.co',
  anonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh3Z2pqbm5ia3hnYXpscmJyenFsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTE0ODExMDEsImV4cCI6MjEwNzA1NzEwMX0.kwktvzxR9Jn9rDeV-vMIAOufxMYn3rpEVMy4gHAlp3s',
} as const;
