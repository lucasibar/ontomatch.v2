import { supabase } from '../shared/config/supabase';

export async function fetchEnabledSchools() {
  // Columna correcta: 'habilitada'
  const { data, error } = await supabase
    .from('escuelas_habilitadas')
    .select('*')
    .eq('habilitada', true)
    .order('nombre', { ascending: true });
  if (error) throw error;
  return data ?? [];
}

export async function getProfileById(userId: string) {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();         // si no hay fila → error.code = 'PGRST116' o similar
  return { data, error };
}

export async function upsertProfile(input: {
  id: string;                 // = auth.user.id
  nombre_completo: string;
  email?: string | null;
  busca: string[];            // ['pareja','amistad','negocios'] (1..3)
  descripcion?: string | null;
  escuela_id?: string | null; // UUID válido o null
}) {
  const payload = {
    id: input.id,
    nombre_completo: input.nombre_completo,
    email: input.email ?? null,
    busca: input.busca,
    descripcion: input.descripcion ?? null,
    escuela_id: input.escuela_id ?? null,
  };
  const { error } = await supabase.from('profiles').upsert(payload, { onConflict: 'id' });
  if (error) throw error;
}
