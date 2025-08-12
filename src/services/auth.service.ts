import { supabase } from '../shared/config/supabase';

export async function loginWithEmail(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  // ÉXITO → data.session != null
  // ERROR típico → error.message === 'Invalid login credentials'
  return { data, error };
}

export async function signupWithEmail(email: string, password: string) {
  // CONFIRM EMAIL está ACTIVADO en Supabase
  const { data, error } = await supabase.auth.signUp({ email, password });
  // Si el email NO existe: crea usuario y ENVÍA mail (data.user, data.session=null)
  // Si el email existe CONFIRMADO: error.message === 'User already registered'
  // Si existe NO CONFIRMADO: reenvía mail; data.user, session=null
  return { data, error };
}

export async function getCurrentUser() {
  const { data } = await supabase.auth.getUser();
  return data.user ?? null;
}

export async function signOut() {
  await supabase.auth.signOut();
}
