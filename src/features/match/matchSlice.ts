import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { 
  getCompatibleUsers, 
  likeUser, 
  getMyMatches, 
  getMyLikes, 
  getMySentLikes,
  CompatibleUser,
  MatchWithUser
} from './matchApi';

interface MatchState {
  // Usuarios compatibles para swiping
  compatibleUsers: CompatibleUser[];
  currentUserIndex: number;
  
  // Estados de carga
  loadingCompatibleUsers: boolean;
  loadingLike: boolean;
  loadingMatches: boolean;
  loadingLikes: boolean;
  
  // Errores
  error: string | null;
  
  // Matches
  matches: MatchWithUser[];
  
  // Likes recibidos y enviados
  likesReceived: CompatibleUser[];
  likesSent: CompatibleUser[];
  
  // Estado del último like
  lastLikeResult: {
    isMatch: boolean;
    matchId?: string;
    likedUser?: CompatibleUser;
  } | null;
}

const initialState: MatchState = {
  compatibleUsers: [],
  currentUserIndex: 0,
  loadingCompatibleUsers: false,
  loadingLike: false,
  loadingMatches: false,
  loadingLikes: false,
  error: null,
  matches: [],
  likesReceived: [],
  likesSent: [],
  lastLikeResult: null
};

const matchSlice = createSlice({
  name: 'match',
  initialState,
  reducers: {
    // Resetear el estado
    resetMatchState: (state) => {
      state.compatibleUsers = [];
      state.currentUserIndex = 0;
      state.error = null;
      state.lastLikeResult = null;
    },
    
    // Avanzar al siguiente usuario
    nextUser: (state) => {
      if (state.currentUserIndex < state.compatibleUsers.length - 1) {
        state.currentUserIndex++;
      }
    },
    
    // Ir al usuario anterior
    previousUser: (state) => {
      if (state.currentUserIndex > 0) {
        state.currentUserIndex--;
      }
    },
    
    // Establecer índice de usuario actual
    setCurrentUserIndex: (state, action: PayloadAction<number>) => {
      state.currentUserIndex = action.payload;
    },
    
    // Limpiar error
    clearError: (state) => {
      state.error = null;
    },
    
    // Limpiar resultado del último like
    clearLastLikeResult: (state) => {
      state.lastLikeResult = null;
    },
    
    // Agregar usuarios compatibles (para paginación)
    addCompatibleUsers: (state, action: PayloadAction<CompatibleUser[]>) => {
      state.compatibleUsers.push(...action.payload);
    },
    
    // Reemplazar usuarios compatibles
    setCompatibleUsers: (state, action: PayloadAction<CompatibleUser[]>) => {
      state.compatibleUsers = action.payload;
      state.currentUserIndex = 0;
    }
  },
  extraReducers: (builder) => {
    // getCompatibleUsers
    builder
      .addCase(getCompatibleUsers.pending, (state) => {
        state.loadingCompatibleUsers = true;
        state.error = null;
      })
      .addCase(getCompatibleUsers.fulfilled, (state, action) => {
        state.loadingCompatibleUsers = false;
        state.compatibleUsers = action.payload;
        state.currentUserIndex = 0;
      })
      .addCase(getCompatibleUsers.rejected, (state, action) => {
        state.loadingCompatibleUsers = false;
        state.error = action.error.message || 'Error al obtener usuarios compatibles';
      });
    
    // likeUser
    builder
      .addCase(likeUser.pending, (state) => {
        state.loadingLike = true;
        state.error = null;
      })
      .addCase(likeUser.fulfilled, (state, action) => {
        state.loadingLike = false;
        state.lastLikeResult = {
          isMatch: action.payload.isMatch,
          matchId: action.payload.matchId,
          likedUser: state.compatibleUsers[state.currentUserIndex]
        };
        
        // Remover el usuario de la lista y avanzar al siguiente
        state.compatibleUsers.splice(state.currentUserIndex, 1);
        if (state.currentUserIndex >= state.compatibleUsers.length && state.currentUserIndex > 0) {
          state.currentUserIndex = state.compatibleUsers.length - 1;
        }
      })
      .addCase(likeUser.rejected, (state, action) => {
        state.loadingLike = false;
        state.error = action.error.message || 'Error al dar like';
      });
    
    // getMyMatches
    builder
      .addCase(getMyMatches.pending, (state) => {
        state.loadingMatches = true;
        state.error = null;
      })
      .addCase(getMyMatches.fulfilled, (state, action) => {
        state.loadingMatches = false;
        state.matches = action.payload;
      })
      .addCase(getMyMatches.rejected, (state, action) => {
        state.loadingMatches = false;
        state.error = action.error.message || 'Error al obtener matches';
      });
    
    // getMyLikes
    builder
      .addCase(getMyLikes.pending, (state) => {
        state.loadingLikes = true;
        state.error = null;
      })
      .addCase(getMyLikes.fulfilled, (state, action) => {
        state.loadingLikes = false;
        state.likesReceived = action.payload;
      })
      .addCase(getMyLikes.rejected, (state, action) => {
        state.loadingLikes = false;
        state.error = action.error.message || 'Error al obtener likes';
      });
    
    // getMySentLikes
    builder
      .addCase(getMySentLikes.pending, (state) => {
        state.loadingLikes = true;
        state.error = null;
      })
      .addCase(getMySentLikes.fulfilled, (state, action) => {
        state.loadingLikes = false;
        state.likesSent = action.payload;
      })
      .addCase(getMySentLikes.rejected, (state, action) => {
        state.loadingLikes = false;
        state.error = action.error.message || 'Error al obtener likes enviados';
      });
  }
});

export const {
  resetMatchState,
  nextUser,
  previousUser,
  setCurrentUserIndex,
  clearError,
  clearLastLikeResult,
  addCompatibleUsers,
  setCompatibleUsers
} = matchSlice.actions;

export default matchSlice.reducer;
