import { supabase } from './supabase';
import { SYNTHETIC_EMAIL, USER_INFO } from './constants';

export async function signInWithCedula(cedula: string): Promise<{
  ok: boolean;
  error?: string;
}> {
  const trimmed = cedula.trim();
  if (!trimmed) return { ok: false, error: 'Ingresa tu cédula' };

  if (trimmed !== USER_INFO.cedula) {
    return { ok: false, error: 'Cédula incorrecta' };
  }

  const { error } = await supabase.auth.signInWithPassword({
    email: SYNTHETIC_EMAIL,
    password: trimmed,
  });

  if (error) {
    return { ok: false, error: 'No se pudo iniciar sesión. Revisa Supabase.' };
  }

  return { ok: true };
}

export async function signOut() {
  await supabase.auth.signOut();
}

export async function getCurrentSession() {
  const { data } = await supabase.auth.getSession();
  return data.session;
}
