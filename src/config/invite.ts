/**
 * Isolates this invitation's RSVPs from other Noor-e-Safar sites
 * that share the same Supabase project. Must stay unique per deploy/repo.
 */
export const INVITE_KEY = 'reception' as const;
