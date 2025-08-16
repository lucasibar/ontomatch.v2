import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { 
  getMyChats, 
  getOrCreateChat, 
  getChatMessages, 
  sendChatMessage, 
  markMessagesAsRead,
  ChatWithMatch,
  ChatMessage,
  Chat
} from './chatApi';

interface ChatState {
  // Lista de chats
  chats: ChatWithMatch[];
  loadingChats: boolean;
  
  // Chat actual
  currentChat: Chat | null;
  currentChatMessages: ChatMessage[];
  loadingMessages: boolean;
  
  // Estados de carga
  loadingSendMessage: boolean;
  
  // Errores
  error: string | null;
  
  // Estado de conexión en tiempo real
  isConnected: boolean;
}

const initialState: ChatState = {
  chats: [],
  loadingChats: false,
  currentChat: null,
  currentChatMessages: [],
  loadingMessages: false,
  loadingSendMessage: false,
  error: null,
  isConnected: false
};

const chatSlice = createSlice({
  name: 'chat',
  initialState,
  reducers: {
    // Limpiar error
    clearError: (state) => {
      state.error = null;
    },
    
    // Establecer chat actual
    setCurrentChat: (state, action: PayloadAction<Chat | null>) => {
      state.currentChat = action.payload;
      if (!action.payload) {
        state.currentChatMessages = [];
      }
    },
    
    // Agregar mensaje en tiempo real
    addMessage: (state, action: PayloadAction<ChatMessage>) => {
      // Solo agregar si es del chat actual
      if (state.currentChat && action.payload.chat_id === state.currentChat.id) {
        state.currentChatMessages.push(action.payload);
      }
      
      // Actualizar último mensaje en la lista de chats
      const chatIndex = state.chats.findIndex(chat => chat.id === action.payload.chat_id);
      if (chatIndex !== -1) {
        state.chats[chatIndex].last_message = action.payload;
        
        // Incrementar contador de no leídos si no es del usuario actual
        // (esto se manejará mejor cuando tengamos el ID del usuario actual)
      }
    },
    
    // Marcar mensajes como leídos localmente
    markMessagesAsReadLocal: (state, action: PayloadAction<string>) => {
      const chatId = action.payload;
      
      // Marcar como leídos en el chat actual
      if (state.currentChat && state.currentChat.id === chatId) {
        state.currentChatMessages.forEach(message => {
          message.is_read = true;
        });
      }
      
      // Resetear contador en la lista de chats
      const chatIndex = state.chats.findIndex(chat => chat.id === chatId);
      if (chatIndex !== -1) {
        state.chats[chatIndex].unread_count = 0;
      }
    },
    
    // Actualizar estado de conexión
    setConnectionStatus: (state, action: PayloadAction<boolean>) => {
      state.isConnected = action.payload;
    },
    
    // Resetear estado del chat
    resetChatState: (state) => {
      state.currentChat = null;
      state.currentChatMessages = [];
      state.error = null;
    }
  },
  extraReducers: (builder) => {
    // getMyChats
    builder
      .addCase(getMyChats.pending, (state) => {
        state.loadingChats = true;
        state.error = null;
      })
      .addCase(getMyChats.fulfilled, (state, action) => {
        state.loadingChats = false;
        state.chats = action.payload;
      })
      .addCase(getMyChats.rejected, (state, action) => {
        state.loadingChats = false;
        state.error = action.error.message || 'Error al obtener chats';
      });
    
    // getOrCreateChat
    builder
      .addCase(getOrCreateChat.pending, (state) => {
        state.error = null;
      })
      .addCase(getOrCreateChat.fulfilled, (state, action) => {
        state.currentChat = action.payload;
      })
      .addCase(getOrCreateChat.rejected, (state, action) => {
        state.error = action.error.message || 'Error al obtener chat';
      });
    
    // getChatMessages
    builder
      .addCase(getChatMessages.pending, (state) => {
        state.loadingMessages = true;
        state.error = null;
      })
      .addCase(getChatMessages.fulfilled, (state, action) => {
        state.loadingMessages = false;
        state.currentChatMessages = action.payload;
      })
      .addCase(getChatMessages.rejected, (state, action) => {
        state.loadingMessages = false;
        state.error = action.error.message || 'Error al obtener mensajes';
      });
    
    // sendChatMessage
    builder
      .addCase(sendChatMessage.pending, (state) => {
        state.loadingSendMessage = true;
        state.error = null;
      })
      .addCase(sendChatMessage.fulfilled, (state, action) => {
        state.loadingSendMessage = false;
        // El mensaje ya se agregó en tiempo real, no necesitamos agregarlo aquí
      })
      .addCase(sendChatMessage.rejected, (state, action) => {
        state.loadingSendMessage = false;
        state.error = action.error.message || 'Error al enviar mensaje';
      });
    
    // markMessagesAsRead
    builder
      .addCase(markMessagesAsRead.fulfilled, (state, action) => {
        // Los mensajes ya se marcaron como leídos localmente
      })
      .addCase(markMessagesAsRead.rejected, (state, action) => {
        state.error = action.error.message || 'Error al marcar mensajes como leídos';
      });
  }
});

export const {
  clearError,
  setCurrentChat,
  addMessage,
  markMessagesAsReadLocal,
  setConnectionStatus,
  resetChatState
} = chatSlice.actions;

export default chatSlice.reducer;
