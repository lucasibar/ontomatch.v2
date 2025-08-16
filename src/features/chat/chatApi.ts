import { createAsyncThunk } from '@reduxjs/toolkit';
import { supabase } from '../../shared/config/supabase';
import { sendMessage as sendAblyMessage, subscribeToChat, enterPresence, leavePresence } from '../../shared/config/ably';

// Tipos para el chat
export interface ChatMessage {
  id: string;
  chat_id: string;
  sender_id: string;
  content: string;
  tipo: 'text' | 'image' | 'audio';
  ably_message_id?: string;
  is_read: boolean;
  created_at: string;
}

export interface Chat {
  id: string;
  match_id: string;
  ably_channel_id?: string;
  created_at: string;
  updated_at: string;
}

export interface ChatWithMatch {
  id: string;
  match_id: string;
  match: {
    id: string;
    user1_id: string;
    user2_id: string;
    is_mutual: boolean;
    created_at: string;
  };
  other_user: {
    id: string;
    nombre_completo: string;
    foto_principal?: string;
  };
  last_message?: ChatMessage;
  unread_count: number;
}

// Obtener chats del usuario
export const getMyChats = createAsyncThunk(
  'chat/getMyChats',
  async (): Promise<ChatWithMatch[]> => {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      throw new Error('Usuario no autenticado');
    }

    // Obtener chats donde el usuario participa
    const { data: chats, error: chatsError } = await supabase
      .from('chats')
      .select(`
        *,
        match:matches!chats_match_id_fkey(
          id,
          user1_id,
          user2_id,
          is_mutual,
          created_at
        )
      `)
      .eq('match.is_mutual', true)
      .order('updated_at', { ascending: false });

    if (chatsError) {
      console.error('Error al obtener chats:', chatsError);
      throw new Error('Error al obtener chats');
    }

    // Para cada chat, obtener información del otro usuario y último mensaje
    const chatsWithDetails: ChatWithMatch[] = await Promise.all(
      (chats || []).map(async (chat) => {
        // Determinar quién es el otro usuario
        const otherUserId = chat.match.user1_id === user.id 
          ? chat.match.user2_id 
          : chat.match.user1_id;

        // Obtener información del otro usuario
        const { data: otherUser } = await supabase
          .from('profiles')
          .select(`
            id,
            nombre_completo,
            fotos(path)
          `)
          .eq('id', otherUserId)
          .single();

        // Obtener último mensaje
        const { data: lastMessage } = await supabase
          .from('messages')
          .select('*')
          .eq('chat_id', chat.id)
          .order('created_at', { ascending: false })
          .limit(1)
          .single();

        // Contar mensajes no leídos
        const { count: unreadCount } = await supabase
          .from('messages')
          .select('*', { count: 'exact', head: true })
          .eq('chat_id', chat.id)
          .eq('sender_id', otherUserId)
          .eq('is_read', false);

        return {
          id: chat.id,
          match_id: chat.match_id,
          match: chat.match,
          other_user: {
            id: otherUser?.id || '',
            nombre_completo: otherUser?.nombre_completo || 'Usuario',
            foto_principal: otherUser?.fotos?.[0]?.path
          },
          last_message: lastMessage || undefined,
          unread_count: unreadCount || 0
        };
      })
    );

    return chatsWithDetails;
  }
);

// Obtener o crear chat para un match
export const getOrCreateChat = createAsyncThunk(
  'chat/getOrCreateChat',
  async (matchId: string): Promise<Chat> => {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      throw new Error('Usuario no autenticado');
    }

    // Verificar que el match existe y es mutuo
    const { data: match, error: matchError } = await supabase
      .from('matches')
      .select('*')
      .eq('id', matchId)
      .eq('is_mutual', true)
      .single();

    if (matchError || !match) {
      throw new Error('Match no encontrado o no es mutuo');
    }

    // Verificar que el usuario es parte del match
    if (match.user1_id !== user.id && match.user2_id !== user.id) {
      throw new Error('No tienes acceso a este chat');
    }

    // Buscar chat existente
    let { data: chat, error: chatError } = await supabase
      .from('chats')
      .select('*')
      .eq('match_id', matchId)
      .maybeSingle();

    if (chatError) {
      console.error('Error al buscar chat:', chatError);
      throw new Error('Error al buscar chat');
    }

    // Si no existe, crear uno nuevo
    if (!chat) {
      const { data: newChat, error: createError } = await supabase
        .from('chats')
        .insert({
          match_id: matchId,
          ably_channel_id: `chat:${matchId}`
        })
        .select()
        .single();

      if (createError) {
        console.error('Error al crear chat:', createError);
        throw new Error('Error al crear chat');
      }

      chat = newChat;
    }

    return chat;
  }
);

// Obtener mensajes de un chat
export const getChatMessages = createAsyncThunk(
  'chat/getChatMessages',
  async (chatId: string): Promise<ChatMessage[]> => {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      throw new Error('Usuario no autenticado');
    }

    // Verificar acceso al chat
    const { data: chat, error: chatError } = await supabase
      .from('chats')
      .select(`
        *,
        match:matches!chats_match_id_fkey(user1_id, user2_id)
      `)
      .eq('id', chatId)
      .single();

    if (chatError || !chat) {
      throw new Error('Chat no encontrado');
    }

    if (chat.match.user1_id !== user.id && chat.match.user2_id !== user.id) {
      throw new Error('No tienes acceso a este chat');
    }

    // Obtener mensajes
    const { data: messages, error: messagesError } = await supabase
      .from('messages')
      .select('*')
      .eq('chat_id', chatId)
      .order('created_at', { ascending: true });

    if (messagesError) {
      console.error('Error al obtener mensajes:', messagesError);
      throw new Error('Error al obtener mensajes');
    }

    return messages || [];
  }
);

// Enviar mensaje
export const sendChatMessage = createAsyncThunk(
  'chat/sendMessage',
  async ({ chatId, content }: { chatId: string; content: string }): Promise<ChatMessage> => {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      throw new Error('Usuario no autenticado');
    }

    // Verificar acceso al chat
    const { data: chat, error: chatError } = await supabase
      .from('chats')
      .select(`
        *,
        match:matches!chats_match_id_fkey(user1_id, user2_id)
      `)
      .eq('id', chatId)
      .single();

    if (chatError || !chat) {
      throw new Error('Chat no encontrado');
    }

    if (chat.match.user1_id !== user.id && chat.match.user2_id !== user.id) {
      throw new Error('No tienes acceso a este chat');
    }

    // Enviar mensaje por Ably
    const ablySuccess = await sendAblyMessage(chat.match_id, content, user.id);
    
    if (!ablySuccess) {
      throw new Error('Error al enviar mensaje en tiempo real');
    }

    // Guardar mensaje en Supabase
    const { data: message, error: messageError } = await supabase
      .from('messages')
      .insert({
        chat_id: chatId,
        sender_id: user.id,
        content,
        tipo: 'text',
        is_read: false
      })
      .select()
      .single();

    if (messageError) {
      console.error('Error al guardar mensaje:', messageError);
      throw new Error('Error al guardar mensaje');
    }

    // Actualizar timestamp del chat
    await supabase
      .from('chats')
      .update({ updated_at: new Date().toISOString() })
      .eq('id', chatId);

    return message;
  }
);

// Marcar mensajes como leídos
export const markMessagesAsRead = createAsyncThunk(
  'chat/markAsRead',
  async (chatId: string): Promise<void> => {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      throw new Error('Usuario no autenticado');
    }

    // Marcar como leídos todos los mensajes que no son del usuario actual
    const { error } = await supabase
      .from('messages')
      .update({ is_read: true })
      .eq('chat_id', chatId)
      .neq('sender_id', user.id)
      .eq('is_read', false);

    if (error) {
      console.error('Error al marcar mensajes como leídos:', error);
      throw new Error('Error al marcar mensajes como leídos');
    }
  }
);

// Suscribirse a chat en tiempo real
export const subscribeToChatRealtime = (
  matchId: string,
  onMessage: (message: ChatMessage) => void,
  onPresenceUpdate?: (presence: any) => void
) => {
  return subscribeToChat(matchId, onMessage, onPresenceUpdate);
};

// Entrar a presencia en chat
export const enterChatPresence = (matchId: string, userId: string, userName: string) => {
  return enterPresence(matchId, userId, userName);
};

// Salir de presencia en chat
export const leaveChatPresence = (matchId: string) => {
  return leavePresence(matchId);
};
