import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = import.meta.env.PUBLIC_SUPABASE_URL ?? '';
const SUPABASE_ANON_KEY = import.meta.env.PUBLIC_SUPABASE_ANON_KEY ?? '';

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.warn(
    'Supabase env vars missing. Set PUBLIC_SUPABASE_URL and PUBLIC_SUPABASE_ANON_KEY in .env',
  );
}

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    storage: typeof window !== 'undefined' ? window.localStorage : undefined,
  },
});

export type HoursEntry = {
  id: string;
  user_id: string;
  fecha: string;
  hora_inicio: string;
  hora_final: string;
  total_horas: number;
  manifiesto: string | null;
  conductor: string;
  placa: string | null;
  created_at: string;
};

export type NewHoursEntry = Omit<HoursEntry, 'id' | 'user_id' | 'created_at'>;
