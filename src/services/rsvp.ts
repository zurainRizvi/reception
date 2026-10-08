import { INVITE_KEY } from '@/config/invite';
import { getSupabaseClient, getSupabaseConfig } from '@/lib/supabase';

export type RSVPSubmission = {
  id?: string;
  name: string;
  response: 'yes' | 'no';
  events: string[];
  guests: number;
  message: string;
  submittedAt: string;
};

export interface RSVPService {
  submit(data: RSVPSubmission): Promise<void>;
  getAll(): Promise<RSVPSubmission[]>;
  clearAll(): Promise<void>;
  hasSubmitted(): boolean;
  getLast(): RSVPSubmission | null;
}

class LocalRSVPService implements RSVPService {
  private key = `noor-e-safar-${INVITE_KEY}-rsvp`;
  private listKey = `noor-e-safar-${INVITE_KEY}-rsvp-list`;

  async submit(data: RSVPSubmission) {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(this.key, JSON.stringify(data));
      const existingList = await this.getAll();
      const updatedList = [data, ...existingList.filter((item) => item.name.toLowerCase() !== data.name.toLowerCase())];
      localStorage.setItem(this.listKey, JSON.stringify(updatedList));
    } catch {
      // fallback
    }
  }

  hasSubmitted() {
    return typeof window !== 'undefined' && Boolean(localStorage.getItem(this.key));
  }

  getLast(): RSVPSubmission | null {
    if (typeof window === 'undefined') return null;
    try {
      const raw = localStorage.getItem(this.key);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  }

  async getAll(): Promise<RSVPSubmission[]> {
    if (typeof window === 'undefined') return [];
    try {
      const raw = localStorage.getItem(this.listKey);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  }

  async clearAll() {
    if (typeof window === 'undefined') return;
    try {
      localStorage.removeItem(this.listKey);
      localStorage.removeItem(this.key);
    } catch {
      // fallback
    }
  }
}

type RsvpRow = {
  id: string;
  name: string;
  response: 'yes' | 'no';
  events: string[] | null;
  guests: number;
  message: string | null;
  submitted_at: string;
  invite_key?: string | null;
};

function rowToSubmission(row: RsvpRow): RSVPSubmission {
  return {
    id: row.id,
    name: row.name,
    response: row.response,
    events: row.events ?? [],
    guests: row.guests ?? 0,
    message: row.message ?? '',
    submittedAt: row.submitted_at,
  };
}

class SupabaseRSVPService implements RSVPService {
  private key = `noor-e-safar-${INVITE_KEY}-rsvp`;

  async submit(data: RSVPSubmission) {
    const supabase = getSupabaseClient();
    if (!supabase) {
      throw new Error('Supabase is not configured');
    }

    const { error } = await supabase.from('rsvps').insert({
      name: data.name,
      response: data.response,
      events: data.events,
      guests: data.guests,
      message: data.message,
      submitted_at: data.submittedAt,
      invite_key: INVITE_KEY,
    });

    if (error) {
      throw error;
    }

    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(this.key, JSON.stringify(data));
      } catch {
        // ignore local cache failures
      }
    }
  }

  hasSubmitted() {
    return typeof window !== 'undefined' && Boolean(localStorage.getItem(this.key));
  }

  getLast(): RSVPSubmission | null {
    if (typeof window === 'undefined') return null;
    try {
      const raw = localStorage.getItem(this.key);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  }

  async getAll(): Promise<RSVPSubmission[]> {
    const supabase = getSupabaseClient();
    if (!supabase) return [];

    const { data, error } = await supabase
      .from('rsvps')
      .select('id, name, response, events, guests, message, submitted_at, invite_key')
      .eq('invite_key', INVITE_KEY)
      .order('submitted_at', { ascending: false });

    if (error) {
      throw error;
    }

    return (data as RsvpRow[] | null)?.map(rowToSubmission) ?? [];
  }

  async clearAll() {
    const supabase = getSupabaseClient();
    if (!supabase) {
      throw new Error('Supabase is not configured');
    }

    // Only wipe this invitation's rows — never other invite links.
    const { error } = await supabase.from('rsvps').delete().eq('invite_key', INVITE_KEY);

    if (error) {
      throw error;
    }

    if (typeof window !== 'undefined') {
      try {
        localStorage.removeItem(this.key);
      } catch {
        // ignore local cache failures
      }
    }
  }
}

function createRsvpService(): RSVPService {
  const adapter = process.env.NEXT_PUBLIC_RSVP_ADAPTER?.trim().toLowerCase();
  const { isConfigured } = getSupabaseConfig();

  if (adapter === 'supabase' || (adapter !== 'local' && isConfigured)) {
    if (!isConfigured) {
      console.warn('RSVP adapter is supabase but Supabase env vars are missing; falling back to local.');
      return new LocalRSVPService();
    }
    return new SupabaseRSVPService();
  }

  return new LocalRSVPService();
}

export const rsvpService: RSVPService = createRsvpService();
