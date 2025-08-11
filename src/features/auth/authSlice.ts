import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { AuthUser } from '../../entities';
import { authenticateUser, completeProfile } from './authApi';

interface AuthState {
  user: AuthUser | null;
  isAuthenticated: boolean;
  hasProfile: boolean;
  needsEmailConfirmation: boolean;
  isLoading: boolean;
  message: string;
}

const initialState: AuthState = {
  user: null,
  isAuthenticated: false,
  hasProfile: false,
  needsEmailConfirmation: false,
  isLoading: false,
  message: '',
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    login: (state, action: PayloadAction<AuthUser>) => {
      state.user = action.payload;
      state.isAuthenticated = true;
      state.hasProfile = true;
      state.isLoading = false;
    },
    logout: (state) => {
      state.user = null;
      state.isAuthenticated = false;
      state.hasProfile = false;
      state.needsEmailConfirmation = false;
      state.isLoading = false;
      state.message = '';
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload;
    },
    setEmailConfirmation: (state, action: PayloadAction<boolean>) => {
      state.needsEmailConfirmation = action.payload;
    },
    setMessage: (state, action: PayloadAction<string>) => {
      state.message = action.payload;
    },
    setProfileComplete: (state, action: PayloadAction<boolean>) => {
      state.hasProfile = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(authenticateUser.pending, (state) => {
        state.isLoading = true;
        state.message = '';
      })
      .addCase(authenticateUser.fulfilled, (state, action) => {
        state.isLoading = false;
        state.user = action.payload.user;
        state.isAuthenticated = !!action.payload.user;
        state.hasProfile = action.payload.hasProfile;
        state.needsEmailConfirmation = action.payload.needsEmailConfirmation;
        state.message = action.payload.message;
      })
      .addCase(authenticateUser.rejected, (state, action) => {
        state.isLoading = false;
        state.message = action.error.message || 'Error de autenticación';
      })
      .addCase(completeProfile.pending, (state) => {
        state.isLoading = true;
        state.message = '';
      })
      .addCase(completeProfile.fulfilled, (state) => {
        state.isLoading = false;
        state.hasProfile = true;
        state.message = 'Perfil completado exitosamente';
      })
      .addCase(completeProfile.rejected, (state, action) => {
        state.isLoading = false;
        state.message = action.error.message || 'Error al completar el perfil';
      });
  },
});

export const { login, logout, setLoading, setEmailConfirmation, setMessage, setProfileComplete } = authSlice.actions;
export default authSlice.reducer;
