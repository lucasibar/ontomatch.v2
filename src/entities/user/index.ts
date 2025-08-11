export interface User {
  id: string;
  nombre_completo: string;
  email?: string;
  busca: ('pareja' | 'amistad' | 'negocios')[];
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

export interface RegisterData {
  email: string;
  password: string;
  nombre_completo: string;
  busca: ('pareja' | 'amistad' | 'negocios')[];
  descripcion?: string;
  escuela_id?: string;
  photos?: File[];
}

export interface LoginData {
  email: string;
  password: string;
}
