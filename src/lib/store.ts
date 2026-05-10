import { writable, derived } from 'svelte/store';
import type { HoursEntry, NewHoursEntry } from './supabase';
import { supabase } from './supabase';
import { DEFAULTS, USER_INFO } from './constants';
import {
  todayISO,
  dayOfWeekColombia,
  computeTotalHoras,
} from './date-utils';

const AUTO_CREATE_KEY = 'horas-cossio-last-auto-create';

export const session = writable<{ userId: string | null; loading: boolean }>({
  userId: null,
  loading: true,
});

export const entries = writable<HoursEntry[]>([]);
export const entriesLoading = writable(false);
export const entriesError = writable<string | null>(null);

export async function loadEntries() {
  entriesLoading.set(true);
  entriesError.set(null);
  const { data, error } = await supabase
    .from('hours_entries')
    .select('*')
    .order('fecha', { ascending: false })
    .order('hora_inicio', { ascending: false });

  if (error) {
    entriesError.set(error.message);
    entriesLoading.set(false);
    return;
  }
  entries.set((data ?? []) as HoursEntry[]);
  entriesLoading.set(false);
}

export async function addEntry(entry: NewHoursEntry, userId: string) {
  const { data, error } = await supabase
    .from('hours_entries')
    .insert([{ ...entry, user_id: userId }])
    .select()
    .single();

  if (error) throw error;
  entries.update((list) => [data as HoursEntry, ...list]);
  return data as HoursEntry;
}

export async function updateEntry(id: string, patch: Partial<NewHoursEntry>) {
  const { data, error } = await supabase
    .from('hours_entries')
    .update(patch)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  entries.update((list) =>
    list.map((e) => (e.id === id ? (data as HoursEntry) : e)),
  );
  return data as HoursEntry;
}

export async function deleteEntry(id: string) {
  const { error } = await supabase.from('hours_entries').delete().eq('id', id);
  if (error) throw error;
  entries.update((list) => list.filter((e) => e.id !== id));
}

export const placaSuggestions = derived(entries, ($entries) => {
  const placas = new Set<string>();
  for (const e of $entries) {
    if (e.placa) placas.add(e.placa);
  }
  return Array.from(placas).slice(0, 6);
});

export const conductorSuggestions = derived(entries, ($entries) => {
  const conductores = new Set<string>();
  for (const e of $entries) {
    if (e.conductor) conductores.add(e.conductor);
  }
  return Array.from(conductores).slice(0, 4);
});

export const totalHorasMes = derived(entries, ($entries) => {
  const now = new Date();
  const y = now.getFullYear();
  const m = now.getMonth();
  return $entries
    .filter((e) => {
      const d = new Date(e.fecha);
      return d.getFullYear() === y && d.getMonth() === m;
    })
    .reduce((acc, e) => acc + Number(e.total_horas), 0);
});

/**
 * Crea automáticamente la entrada de HOY si:
 *  - Hoy es lunes a sábado (no domingos)
 *  - No existe ya una entrada para hoy
 *  - No fue auto-creada antes hoy (respeta si el usuario la borró manualmente)
 */
export async function ensureTodayEntry(userId: string): Promise<void> {
  if (typeof window === 'undefined') return;

  const today = todayISO();
  const dow = dayOfWeekColombia();

  // 0 = Domingo → no auto-crear
  if (dow === 0) return;

  // Si ya marcamos hoy como auto-creado, respetamos (aunque el usuario lo haya borrado)
  const lastAutoCreate = window.localStorage.getItem(AUTO_CREATE_KEY);
  if (lastAutoCreate === today) return;

  // Doble check en Supabase por si localStorage fue limpiado
  const { data: existing } = await supabase
    .from('hours_entries')
    .select('id')
    .eq('user_id', userId)
    .eq('fecha', today)
    .maybeSingle();

  if (existing) {
    window.localStorage.setItem(AUTO_CREATE_KEY, today);
    return;
  }

  const payload: NewHoursEntry = {
    fecha: today,
    hora_inicio: DEFAULTS.horaInicio,
    hora_final: DEFAULTS.horaFinal,
    total_horas: computeTotalHoras(DEFAULTS.horaInicio, DEFAULTS.horaFinal),
    manifiesto: DEFAULTS.manifiesto || null,
    conductor: USER_INFO.conductorDefault,
    placa: DEFAULTS.placa,
  };

  try {
    await addEntry(payload, userId);
    window.localStorage.setItem(AUTO_CREATE_KEY, today);
  } catch (err) {
    console.error('Auto-create today failed:', err);
  }
}
