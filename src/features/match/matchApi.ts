import { createAsyncThunk } from '@reduxjs/toolkit';
import { supabase } from '../../shared/config/supabase';

// Tipos para el matching
export interface CompatibleUser {
  id: string;
  nombre_completo: string;
  descripcion?: string;
  me_defino: 'masculino' | 'femenino' | 'otro';
  que_busco: ('masculino' | 'femenino' | 'otro')[];
  busca: ('pareja' | 'amistad' | 'negocios')[];
  escuela_nombre?: string;
  foto_principal?: string;
  distancia_km?: number;
}

export interface Match {
  id: string;
  user1_id: string;
  user2_id: string;
  user1_liked_at: string;
  user2_liked_at?: string;
  is_mutual: boolean;
  created_at: string;
  updated_at: string;
}

export interface MatchWithUser {
  id: string;
  other_user: CompatibleUser;
  created_at: string;
  is_mutual: boolean;
}

// Obtener usuarios compatibles
export const getCompatibleUsers = createAsyncThunk(
  'match/getCompatibleUsers',
  async (limit: number = 20): Promise<CompatibleUser[]> => {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      throw new Error('Usuario no autenticado');
    }

    const { data, error } = await supabase
      .rpc('get_compatible_users', {
        current_user_id: user.id,
        limit_count: limit
      });

    if (error) {
      console.error('Error al obtener usuarios compatibles:', error);
      throw new Error('Error al obtener usuarios compatibles');
    }

    return data || [];
  }
);

// Dar like a un usuario
export const likeUser = createAsyncThunk(
  'match/likeUser',
  async (toUserId: string): Promise<{ isMatch: boolean; matchId?: string }> => {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      throw new Error('Usuario no autenticado');
    }

    // 1. Crear el like
    const { error: likeError } = await supabase
      .from('likes')
      .insert({
        from_user_id: user.id,
        to_user_id: toUserId
      });

    if (likeError) {
      console.error('Error al crear like:', likeError);
      throw new Error('Error al dar like');
    }

    // 2. Verificar si hay match (el trigger debería haber creado el match automáticamente)
    const { data: match, error: matchError } = await supabase
      .from('matches')
      .select('*')
      .or(`and(user1_id.eq.${user.id},user2_id.eq.${toUserId}),and(user1_id.eq.${toUserId},user2_id.eq.${user.id})`)
      .eq('is_mutual', true)
      .maybeSingle();

    if (matchError) {
      console.error('Error al verificar match:', matchError);
      // No lanzamos error aquí porque el like se creó correctamente
    }

    return {
      isMatch: !!match,
      matchId: match?.id
    };
  }
);

// Obtener mis matches
export const getMyMatches = createAsyncThunk(
  'match/getMyMatches',
  async (): Promise<MatchWithUser[]> => {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      throw new Error('Usuario no autenticado');
    }

    // Obtener matches donde soy user1 o user2
    const { data: matches, error: matchesError } = await supabase
      .from('matches')
      .select(`
        *,
        user1:profiles!matches_user1_id_fkey(
          id,
          nombre_completo,
          descripcion,
          me_defino,
          que_busco,
          busca,
          escuela:escuelas_habilitadas(nombre)
        ),
        user2:profiles!matches_user2_id_fkey(
          id,
          nombre_completo,
          descripcion,
          me_defino,
          que_busco,
          busca,
          escuela:escuelas_habilitadas(nombre)
        )
      `)
      .or(`user1_id.eq.${user.id},user2_id.eq.${user.id}`)
      .eq('is_mutual', true)
      .order('updated_at', { ascending: false });

    if (matchesError) {
      console.error('Error al obtener matches:', matchesError);
      throw new Error('Error al obtener matches');
    }

    // Transformar los datos para obtener el otro usuario
    const matchesWithUser: MatchWithUser[] = (matches || []).map(match => {
      const otherUser = match.user1_id === user.id ? match.user2 : match.user1;
      
      return {
        id: match.id,
        other_user: {
          id: otherUser.id,
          nombre_completo: otherUser.nombre_completo,
          descripcion: otherUser.descripcion,
          me_defino: otherUser.me_defino,
          que_busco: otherUser.que_busco,
          busca: otherUser.busca,
          escuela_nombre: otherUser.escuela?.nombre
        },
        created_at: match.created_at,
        is_mutual: match.is_mutual
      };
    });

    return matchesWithUser;
  }
);

// Obtener mis likes (usuarios que me han dado like)
export const getMyLikes = createAsyncThunk(
  'match/getMyLikes',
  async (): Promise<CompatibleUser[]> => {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      throw new Error('Usuario no autenticado');
    }

    // Obtener usuarios que me han dado like
    const { data: likes, error: likesError } = await supabase
      .from('likes')
      .select(`
        from_user_id,
        from_user:profiles!likes_from_user_id_fkey(
          id,
          nombre_completo,
          descripcion,
          me_defino,
          que_busco,
          busca,
          escuela:escuelas_habilitadas(nombre),
          fotos(path)
        )
      `)
      .eq('to_user_id', user.id)
      .order('created_at', { ascending: false });

    if (likesError) {
      console.error('Error al obtener likes:', likesError);
      throw new Error('Error al obtener likes');
    }

    // Transformar los datos
    const usersWhoLikedMe: CompatibleUser[] = (likes || []).map(like => ({
      id: like.from_user.id,
      nombre_completo: like.from_user.nombre_completo,
      descripcion: like.from_user.descripcion,
      me_defino: like.from_user.me_defino,
      que_busco: like.from_user.que_busco,
      busca: like.from_user.busca,
      escuela_nombre: like.from_user.escuela?.nombre,
      foto_principal: like.from_user.fotos?.[0]?.path
    }));

    return usersWhoLikedMe;
  }
);

// Obtener mis likes enviados (usuarios a los que he dado like)
export const getMySentLikes = createAsyncThunk(
  'match/getMySentLikes',
  async (): Promise<CompatibleUser[]> => {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      throw new Error('Usuario no autenticado');
    }

    // Obtener usuarios a los que he dado like
    const { data: likes, error: likesError } = await supabase
      .from('likes')
      .select(`
        to_user_id,
        to_user:profiles!likes_to_user_id_fkey(
          id,
          nombre_completo,
          descripcion,
          me_defino,
          que_busco,
          busca,
          escuela:escuelas_habilitadas(nombre),
          fotos(path)
        )
      `)
      .eq('from_user_id', user.id)
      .order('created_at', { ascending: false });

    if (likesError) {
      console.error('Error al obtener likes enviados:', likesError);
      throw new Error('Error al obtener likes enviados');
    }

    // Transformar los datos
    const usersILiked: CompatibleUser[] = (likes || []).map(like => ({
      id: like.to_user.id,
      nombre_completo: like.to_user.nombre_completo,
      descripcion: like.to_user.descripcion,
      me_defino: like.to_user.me_defino,
      que_busco: like.to_user.que_busco,
      busca: like.to_user.busca,
      escuela_nombre: like.to_user.escuela?.nombre,
      foto_principal: like.to_user.fotos?.[0]?.path
    }));

    return usersILiked;
  }
);
