import { getCurrentUser } from '../../services/auth.service';
import { getProfileById, upsertProfile, fetchEnabledSchools } from '../../services/domain.service';

export async function ensureProfileInitialized() {
  const user = await getCurrentUser();
  if (!user) return { needsAuth: true };

  const { data: profile, error } = await getProfileById(user.id);
  if (!profile) {
    // No existe perfil → mostrar formulario Onboarding (nombre, busca, escuela, etc.)
    return { needsOnboarding: true, schools: await fetchEnabledSchools() };
  }

  // Perfil existe → listo
  return { ready: true, profile };
}

export async function saveOnboardingProfile(form: {
  nombre_completo: string;
  busca: string[];                 // validar que contenga valores válidos
  descripcion?: string;
  escuela_id?: string | null;
}) {
  const user = await getCurrentUser();
  if (!user) throw new Error('No hay sesión');
  await upsertProfile({
    id: user.id,                               // CLAVE → id = auth.user.id
    nombre_completo: form.nombre_completo,
    email: user.email ?? null,
    busca: form.busca,
    descripcion: form.descripcion ?? null,
    escuela_id: form.escuela_id ?? null,
  });
}
