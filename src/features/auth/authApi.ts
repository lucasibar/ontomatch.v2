import { createAsyncThunk } from '@reduxjs/toolkit';
import { supabase } from '../../shared/config/supabase';
import { LoginData, RegisterData, AuthUser, User } from '../../entities';

// Función para verificar si un usuario tiene perfil completo (con manejo tolerante)
export const checkUserProfile = async (userId: string): Promise<User | null> => {
  console.log('=== VERIFICANDO PERFIL ===');
  console.log('userId:', userId);
  
  if (!userId) {
    console.log('userId es undefined o vacío');
    return null;
  }

  try {
    // 1. Verificar perfil básico
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .maybeSingle();

    console.log('Consulta a profiles - data:', profile);
    console.log('Consulta a profiles - error:', profileError);

    if (profileError) {
      console.log('Error al consultar perfil:', profileError);
      return null;
    }

    if (!profile) {
      console.log('No se encontró perfil para userId:', userId);
      return null;
    }

    // 2. Verificar si tiene fotos (obligatorias)
    const { data: photos, error: photosError } = await supabase
      .from('fotos')
      .select('*')
      .eq('user_id', userId)
      .order('position', { ascending: true });

    console.log('Consulta a fotos - data:', photos);
    console.log('Consulta a fotos - error:', photosError);

    if (photosError) {
      console.log('Error al consultar fotos:', photosError);
      return null;
    }

    // Si no tiene fotos, considerar perfil incompleto
    if (!photos || photos.length === 0) {
      console.log('Usuario no tiene fotos - perfil incompleto');
      return null;
    }

    console.log('Perfil completo encontrado con', photos.length, 'fotos');
    console.log('=== FIN VERIFICACIÓN PERFIL ===');
    return profile;
  } catch (err) {
    console.error('Excepción en checkUserProfile:', err);
    return null;
  }
};

// Función para verificar si un usuario existe (sin intentar login)
export const checkUserExists = async (email: string): Promise<boolean> => {
  try {
    const { data, error } = await supabase.auth.admin.listUsers();
    if (error) return false;
    return data.users.some(user => user.email === email);
  } catch {
    // Si no tenemos permisos admin, intentamos un método alternativo
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password: 'dummy_password_for_check'
      });
      // Si llega aquí, el usuario existe pero la contraseña está mal
      return true;
    } catch {
      // Si falla completamente, asumimos que no existe
      return false;
    }
  }
};

// Función unificada: login-first, luego signup si falla
export const authenticateUser = createAsyncThunk(
  'auth/authenticate',
  async (credentials: { email: string; password: string }): Promise<{ 
    user: AuthUser | null; 
    hasProfile: boolean; 
    needsEmailConfirmation: boolean;
    message: string;
  }> => {
    try {
      console.log('=== INICIANDO AUTENTICACIÓN ===');
      console.log('Email:', credentials.email);

      // 1) Intentar LOGIN primero
      const { data: loginData, error: loginError } = await supabase.auth.signInWithPassword({
        email: credentials.email,
        password: credentials.password,
      });

      if (loginData.user && !loginError) {
        console.log('Login exitoso, userId:', loginData.user.id);
        
        // Login exitoso, verificar si tiene perfil
        const profile = await checkUserProfile(loginData.user.id);
        
        if (profile) {
          console.log('Usuario con perfil completo');
          return {
            user: {
              id: loginData.user.id,
              nombre_completo: profile.nombre_completo,
              email: loginData.user.email!,
              token: loginData.session.access_token,
            },
            hasProfile: true,
            needsEmailConfirmation: false,
            message: 'Login exitoso'
          };
        } else {
          console.log('Usuario sin perfil completo');
          return {
            user: {
              id: loginData.user.id,
              nombre_completo: '',
              email: loginData.user.email!,
              token: loginData.session.access_token,
            },
            hasProfile: false,
            needsEmailConfirmation: false,
            message: 'Completa tu perfil'
          };
        }
      }

      // 2) Si el login falla, intentar SIGNUP
      console.log('Login falló, intentando signup');
      const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
        email: credentials.email,
        password: credentials.password,
      });

      console.log('=== RESPUESTA DE SIGNUP ===');
      console.log('Data:', signUpData);
      console.log('Error:', signUpError);
      console.log('User:', signUpData?.user);
      console.log('Session:', signUpData?.session);
      console.log('=== FIN SIGNUP ===');

      if (signUpError) {
        // a) Email existía y estaba confirmado → 'User already registered'
        if (signUpError.message?.includes('User already registered')) {
          throw new Error('Email o contraseña incorrectos');
        }
        // b) Otro error → mostrar mensaje
        throw new Error(signUpError.message);
      }

      // Signup OK con confirmación activada → NO hay sesión todavía
      if (!signUpData.session) {
        console.log('Necesita confirmación de email');
        return {
          user: null,
          hasProfile: false,
          needsEmailConfirmation: true,
          message: 'Te enviamos un correo para confirmar tu cuenta. Revisa tu bandeja de entrada.'
        };
      }

      // (Escenario raro: si tuvieras confirmación OFF, session existiría)
      console.log('Signup exitoso con sesión');
      return {
        user: {
          id: signUpData.user!.id,
          nombre_completo: '',
          email: signUpData.user!.email!,
          token: signUpData.session.access_token,
        },
        hasProfile: false,
        needsEmailConfirmation: false,
        message: 'Registro exitoso'
      };

    } catch (error: any) {
      console.log('Error en authenticateUser:', error);
      throw new Error(error.message);
    }
  }
);

export const loginUser = createAsyncThunk(
  'auth/login',
  async (credentials: LoginData): Promise<AuthUser> => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: credentials.email,
      password: credentials.password,
    });

    if (error) {
      throw new Error(error.message);
    }

    if (!data.user) {
      throw new Error('No se pudo autenticar al usuario');
    }

    // Obtener datos adicionales del usuario desde la tabla profiles
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', data.user.id)
      .single();

    if (profileError) {
      throw new Error('Error al obtener el perfil del usuario');
    }

    return {
      id: data.user.id,
      nombre_completo: profile.nombre_completo,
      email: data.user.email!,
      token: data.session.access_token,
    };
  }
);

export const registerUser = createAsyncThunk(
  'auth/register',
  async (userData: RegisterData): Promise<AuthUser> => {
    // 1. Registrar usuario en Supabase Auth
    const { data, error } = await supabase.auth.signUp({
      email: userData.email,
      password: userData.password,
    });

    if (error) {
      throw new Error(error.message);
    }

    if (!data.user) {
      throw new Error('No se pudo crear el usuario');
    }

    // 2. Crear perfil en la tabla profiles
    const { error: profileError } = await supabase
      .from('profiles')
      .insert({
        id: data.user.id,
        nombre_completo: userData.nombre_completo,
        email: userData.email,
        busca: userData.busca,
        descripcion: userData.descripcion,
        escuela_id: userData.escuela_id,
      });

    if (profileError) {
      throw new Error('Error al crear el perfil del usuario');
    }

    // 3. Subir fotos si existen
    if (userData.photos && userData.photos.length > 0) {
      for (let i = 0; i < userData.photos.length; i++) {
        const photo = userData.photos[i];
        const position = i + 1;
        const path = `${data.user.id}/${position}.jpg`;

        // Subir archivo a Storage
        const { error: uploadError } = await supabase.storage
          .from('avatars')
          .upload(path, photo, {
            upsert: true,
            contentType: photo.type,
          });

        if (uploadError) {
          throw new Error(`Error al subir la foto ${position}: ${uploadError.message}`);
        }

        // Crear registro en la tabla fotos
        const { error: photoRecordError } = await supabase
          .from('fotos')
          .upsert({
            user_id: data.user.id,
            path: path,
            position: position,
          });

        if (photoRecordError) {
          throw new Error(`Error al registrar la foto ${position}: ${photoRecordError.message}`);
        }
      }
    }

    return {
      id: data.user.id,
      nombre_completo: userData.nombre_completo,
      email: data.user.email!,
      token: data.session?.access_token || '',
    };
  }
);

// Función para completar el perfil (sin crear usuario)
export const completeProfile = createAsyncThunk(
  'auth/completeProfile',
  async (profileData: {
    nombre_completo: string;
    me_defino: ('masculino' | 'femenino' | 'otros')[];
    que_busco: ('masculino' | 'femenino' | 'otros')[];
    busca: ('pareja' | 'amistad' | 'negocios')[];
    descripcion?: string;
    escuela_id?: string;
    photos?: File[];
  }): Promise<void> => {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      throw new Error('No hay usuario autenticado');
    }

    // Normalización y validación de datos
    const meDefino = (profileData.me_defino?.[0] || 'otros').toLowerCase() as 'masculino' | 'femenino' | 'otros';
    const queBusco = (profileData.que_busco || []).map(x => x.toLowerCase()) as ('masculino' | 'femenino' | 'otros')[];
    const busca = (profileData.busca || []).map(x => x.toLowerCase()) as ('pareja' | 'amistad' | 'negocios')[];

    // Validaciones mínimas
    if (!profileData.nombre_completo?.trim()) {
      throw new Error('Nombre completo es obligatorio');
    }
    if (!meDefino) {
      throw new Error('Debes seleccionar cómo te defines');
    }
    if (!queBusco.length) {
      throw new Error('Debes seleccionar qué buscas');
    }
    if (!busca.length) {
      throw new Error('Debes seleccionar al menos una opción de búsqueda');
    }

    console.log('Datos normalizados para Supabase:', {
      id: user.id,
      nombre_completo: profileData.nombre_completo.trim(),
      email: user.email,
      me_defino: meDefino, // string, no array
      que_busco: queBusco, // array enum
      busca: busca,        // array enum
      descripcion: profileData.descripcion?.trim() || null,
      escuela_id: profileData.escuela_id || null,
    });

    // 1. Crear/actualizar perfil en la tabla profiles
    const profileDataToUpsert = {
      id: user.id,
      nombre_completo: profileData.nombre_completo.trim(),
      email: user.email,
      me_defino: meDefino, // 👈 string, no array
      que_busco: queBusco, // 👈 array enum
      busca: busca,        // 👈 array enum
      descripcion: profileData.descripcion?.trim() || null,
      escuela_id: profileData.escuela_id || null,
    };

    console.log('Datos exactos para upsert:', profileDataToUpsert);

    const { error: profileError } = await supabase
      .from('profiles')
      .upsert(profileDataToUpsert, { onConflict: 'id' });

    if (profileError) {
      console.error('Upsert profiles error:', profileError);
      console.error('Error details:', {
        message: profileError.message,
        details: profileError.details,
        hint: profileError.hint,
        code: profileError.code
      });
      throw new Error(`Error al crear el perfil: ${profileError.message}`);
    }

    // 2. Subir fotos si existen
    if (profileData.photos && profileData.photos.length > 0) {
      // Verificar que la sesión esté activa
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('Sesión no válida. Por favor, inicia sesión nuevamente.');
      }

      for (let i = 0; i < profileData.photos.length; i++) {
        const photo = profileData.photos[i];
        const position = i + 1;
        
        // Usar la extensión original del archivo
        const fileExtension = photo.name.split('.').pop() || 'jpg';
        const path = `${user.id}/${position}.${fileExtension}`;

        console.log('Subiendo foto:', {
          fileName: photo.name,
          fileSize: photo.size,
          fileType: photo.type,
          path: path
        });

        // Subir archivo a Storage
        const { error: uploadError } = await supabase.storage
          .from('avatars')
          .upload(path, photo, {
            upsert: true,
            contentType: photo.type || 'image/jpeg',
            cacheControl: '3600',
          });

        if (uploadError) {
          console.error('Error de upload:', uploadError);
          if (uploadError.message?.includes('bucket')) {
            throw new Error('Error de configuración del servidor');
          } else if (uploadError.message?.includes('size')) {
            throw new Error('La imagen es demasiado grande');
          } else if (uploadError.message?.includes('policy')) {
            throw new Error('Error de permisos. Contacta al administrador.');
          } else {
            throw new Error(`Error al subir la foto ${position}: ${uploadError.message}`);
          }
        }

        // Crear registro en la tabla fotos
        const { error: photoRecordError } = await supabase
          .from('fotos')
          .upsert({
            user_id: user.id,
            path: path,
            position: position,
          });

        if (photoRecordError) {
          throw new Error(`Error al registrar la foto ${position}: ${photoRecordError.message}`);
        }
      }
    }
  }
);

export const logoutUser = createAsyncThunk(
  'auth/logout',
  async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      throw new Error(error.message);
    }
  }
);

// Función para limpiar el perfil del usuario (útil para testing)
export const clearUserProfile = async (userId: string): Promise<void> => {
  console.log('Limpiando perfil para userId:', userId);
  
  try {
    // 1. Eliminar fotos del storage
    const { data: photos } = await supabase
      .from('fotos')
      .select('path')
      .eq('user_id', userId);

    if (photos && photos.length > 0) {
      for (const photo of photos) {
        await supabase.storage
          .from('avatars')
          .remove([photo.path]);
      }
    }

    // 2. Eliminar registros de fotos
    await supabase
      .from('fotos')
      .delete()
      .eq('user_id', userId);

    // 3. Eliminar perfil
    await supabase
      .from('profiles')
      .delete()
      .eq('id', userId);

    console.log('Perfil limpiado exitosamente');
  } catch (error) {
    console.error('Error al limpiar perfil:', error);
    throw error;
  }
};

// Función para obtener las escuelas habilitadas (CORREGIDA)
export const getSchools = async () => {
  console.log('Obteniendo escuelas habilitadas');
  
  const { data, error } = await supabase
    .from('escuelas_habilitadas')
    .select('*')
    .eq('habilitada', true) // Cambiado de 'activa' a 'habilitada'
    .order('nombre', { ascending: true });

  if (error) {
    console.log('Error al obtener escuelas:', error);
    throw new Error('Error al obtener las escuelas');
  }

  console.log('Escuelas obtenidas:', data);
  return data;
};
