import { createAsyncThunk } from '@reduxjs/toolkit';
import { supabase } from '../../shared/config/supabase';
import { LoginData, RegisterData, AuthUser, User } from '../../entities';

// Función para verificar si un usuario tiene perfil completo (con manejo tolerante)
export const checkUserProfile = async (userId: string): Promise<User | null> => {
  console.log('Verificando perfil para userId:', userId);
  
  if (!userId) {
    console.log('userId es undefined o vacío');
    return null;
  }

  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .maybeSingle(); // Usar maybeSingle en lugar de single para manejar 0 filas

  if (error) {
    console.log('Error al consultar perfil:', error);
    return null;
  }

  if (!data) {
    console.log('No se encontró perfil para userId:', userId);
    return null;
  }

  console.log('Perfil encontrado:', data);
  return data;
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

// Función para intentar login o registro automático (CORREGIDA)
export const authenticateUser = createAsyncThunk(
  'auth/authenticate',
  async (credentials: { email: string; password: string }): Promise<{ 
    user: AuthUser | null; 
    hasProfile: boolean; 
    needsEmailConfirmation: boolean;
    message: string;
  }> => {
    try {
      console.log('Iniciando autenticación para:', credentials.email);

      // 1. Intentar login primero
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

      // 2. Si el login falla, verificar si el usuario existe
      console.log('Login falló, verificando si usuario existe');
      
      if (loginError?.message?.includes('Invalid login credentials')) {
        // Verificar si el usuario existe para dar mejor mensaje
        const userExists = await checkUserExists(credentials.email);
        
        if (userExists) {
          throw new Error('Credenciales inválidas. Verifica tu email y contraseña.');
        }
      }

      // 3. Si el usuario no existe, intentar registro
      console.log('Intentando registro para nuevo usuario');
      const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
        email: credentials.email,
        password: credentials.password,
      });

      if (signUpError) {
        console.log('Error en registro:', signUpError);
        throw new Error(signUpError.message);
      }

      if (signUpData.user) {
        console.log('Registro exitoso, userId:', signUpData.user.id);
        
        // Verificar si necesita confirmación de email
        if (signUpData.session) {
          console.log('No necesita confirmación de email');
          // No necesita confirmación, verificar perfil
          const profile = await checkUserProfile(signUpData.user.id);
          
          if (profile) {
            return {
              user: {
                id: signUpData.user.id,
                nombre_completo: profile.nombre_completo,
                email: signUpData.user.email!,
                token: signUpData.session.access_token,
              },
              hasProfile: true,
              needsEmailConfirmation: false,
              message: 'Registro exitoso'
            };
          } else {
            return {
              user: {
                id: signUpData.user.id,
                nombre_completo: '',
                email: signUpData.user.email!,
                token: signUpData.session.access_token,
              },
              hasProfile: false,
              needsEmailConfirmation: false,
              message: 'Completa tu perfil'
            };
          }
        } else {
          console.log('Necesita confirmación de email');
          // Necesita confirmación de email
          return {
            user: null,
            hasProfile: false,
            needsEmailConfirmation: true,
            message: 'Te enviamos un correo para confirmar tu cuenta. Revisa tu bandeja de entrada.'
          };
        }
      }

      throw new Error('No se pudo procesar la autenticación');
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
    busca: ('pareja' | 'amistad' | 'negocios')[];
    descripcion?: string;
    escuela_id?: string;
    photos?: File[];
  }): Promise<void> => {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      throw new Error('No hay usuario autenticado');
    }

    // 1. Crear/actualizar perfil en la tabla profiles
    const { error: profileError } = await supabase
      .from('profiles')
      .upsert({
        id: user.id,
        nombre_completo: profileData.nombre_completo,
        email: user.email,
        busca: profileData.busca,
        descripcion: profileData.descripcion,
        escuela_id: profileData.escuela_id,
      });

    if (profileError) {
      throw new Error('Error al crear el perfil del usuario');
    }

    // 2. Subir fotos si existen
    if (profileData.photos && profileData.photos.length > 0) {
      for (let i = 0; i < profileData.photos.length; i++) {
        const photo = profileData.photos[i];
        const position = i + 1;
        const path = `${user.id}/${position}.jpg`;

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
