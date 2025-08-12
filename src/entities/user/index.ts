export interface User {
  id: string;
  nombre_completo: string;
  email?: string;
  me_defino: 'masculino' | 'femenino' | 'otros'; // string en DB
  que_busco: ('masculino' | 'femenino' | 'otros')[]; // array en DB
  busca: ('pareja' | 'amistad' | 'negocios')[]; // array en DB
  descripcion?: string;
  escuela_id?: string;
  created_at: string;
}

export interface Photo {
  id: string;
  user_id: string;
  path: string;
  position: number;
  created_at: string;
  signed_url?: string;
}

export interface School {
  id: string;
  nombre: string;
  activa: boolean;
}

export interface AuthUser {
  id: string;
  nombre_completo: string;
  email: string;
  token: string;
}

// Interface para el frontend (mantiene array para compatibilidad)
export interface RegisterData {
  email: string;
  password: string;
  nombre_completo: string;
  me_defino: ('masculino' | 'femenino' | 'otros')[]; // array en frontend
  que_busco: ('masculino' | 'femenino' | 'otros')[]; // array en frontend
  busca: ('pareja' | 'amistad' | 'negocios')[]; // array en frontend
  descripcion?: string;
  escuela_id?: string;
  photos?: File[];
}

export interface LoginData {
  email: string;
  password: string;
}
