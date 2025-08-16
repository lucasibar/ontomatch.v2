import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '../app/store';
import { 
  getOrCreateChat, 
  getChatMessages, 
  sendChatMessage, 
  markMessagesAsRead,
  subscribeToChatRealtime,
  enterChatPresence,
  leaveChatPresence,
  ChatMessage
} from '../features/chat/chatApi';
import { 
  setCurrentChat, 
  addMessage, 
  markMessagesAsReadLocal,
  setConnectionStatus,
  resetChatState 
} from '../features/chat/chatSlice';
import { supabase } from '../shared/config/supabase';

const Chat: React.FC = () => {
  const { matchId } = useParams<{ matchId: string }>();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { currentChat, currentChatMessages, loadingMessages, loadingSendMessage, error } = useSelector((state: RootState) => state.chat);
  const { user } = useSelector((state: RootState) => state.auth);
  
  const [message, setMessage] = useState('');
  const [otherUser, setOtherUser] = useState<any>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Cargar chat y mensajes
  useEffect(() => {
    if (!matchId) return;

    const loadChat = async () => {
      try {
        // Obtener o crear chat
        const chat = await dispatch(getOrCreateChat(matchId)).unwrap();
        dispatch(setCurrentChat(chat));

        // Obtener mensajes
        await dispatch(getChatMessages(chat.id)).unwrap();

        // Obtener información del otro usuario
        const { data: match } = await supabase
          .from('matches')
          .select('user1_id, user2_id')
          .eq('id', matchId)
          .single();

        if (match) {
          const otherUserId = match.user1_id === user?.id ? match.user2_id : match.user1_id;
          
          const { data: otherUserData } = await supabase
            .from('profiles')
            .select('id, nombre_completo, fotos(path)')
            .eq('id', otherUserId)
            .single();

          setOtherUser(otherUserData);
        }

        // Marcar mensajes como leídos
        await dispatch(markMessagesAsRead(chat.id)).unwrap();
        dispatch(markMessagesAsReadLocal(chat.id));

        // Entrar a presencia
        if (user) {
          await enterChatPresence(matchId, user.id, user.nombre_completo || user.email);
        }

        // Suscribirse a mensajes en tiempo real
        const channel = subscribeToChatRealtime(
          matchId,
          (newMessage: ChatMessage) => {
            dispatch(addMessage(newMessage));
            // Marcar como leído si es del otro usuario
            if (newMessage.sender_id !== user?.id) {
              dispatch(markMessagesAsReadLocal(chat.id));
            }
          }
        );

        dispatch(setConnectionStatus(true));

        // Cleanup
        return () => {
          if (user) {
            leaveChatPresence(matchId);
          }
          channel?.unsubscribe();
          dispatch(setConnectionStatus(false));
        };
      } catch (error) {
        console.error('Error al cargar chat:', error);
      }
    };

    loadChat();

    return () => {
      dispatch(resetChatState());
    };
  }, [matchId, dispatch, user]);

  // Scroll al final de los mensajes
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [currentChatMessages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim() || !currentChat || loadingSendMessage) return;

    try {
      await dispatch(sendChatMessage({ chatId: currentChat.id, content: message.trim() })).unwrap();
      setMessage('');
    } catch (error) {
      console.error('Error al enviar mensaje:', error);
    }
  };

  const getImageUrl = (path: string) => {
    if (!path) return '/default-avatar.png';
    
    const { data } = supabase.storage
      .from('avatars')
      .getPublicUrl(path);
    
    return data.publicUrl;
  };

  if (!matchId) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-600">Match ID no válido</p>
      </div>
    );
  }

  if (loadingMessages) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando chat...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error}</p>
          <button
            onClick={() => navigate('/matches')}
            className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600"
          >
            Volver a Matches
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-4 py-3 flex items-center">
        <button
          onClick={() => navigate('/matches')}
          className="mr-3 p-2 hover:bg-gray-100 rounded-full"
        >
          <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        
        {otherUser && (
          <div className="flex items-center flex-1">
            <img
              src={getImageUrl(otherUser.foto_principal || '')}
              alt={otherUser.nombre_completo}
              className="w-10 h-10 rounded-full object-cover mr-3"
              onError={(e) => {
                e.currentTarget.src = '/default-avatar.png';
              }}
            />
            <div>
              <h2 className="font-semibold text-gray-900">{otherUser.nombre_completo}</h2>
              <p className="text-sm text-gray-500">En línea</p>
            </div>
          </div>
        )}
      </div>

      {/* Mensajes */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {currentChatMessages.map((msg) => (
          <div
            key={msg.id}
            className={`flex ${msg.sender_id === user?.id ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                msg.sender_id === user?.id
                  ? 'bg-blue-500 text-white'
                  : 'bg-white text-gray-900 border border-gray-200'
              }`}
            >
              <p className="text-sm">{msg.content}</p>
              <p className={`text-xs mt-1 ${
                msg.sender_id === user?.id ? 'text-blue-100' : 'text-gray-500'
              }`}>
                {new Date(msg.created_at).toLocaleTimeString([], { 
                  hour: '2-digit', 
                  minute: '2-digit' 
                })}
              </p>
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Input de mensaje */}
      <div className="bg-white border-t border-gray-200 p-4">
        <form onSubmit={handleSendMessage} className="flex space-x-2">
          <input
            type="text"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Escribe un mensaje..."
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            disabled={loadingSendMessage}
          />
          <button
            type="submit"
            disabled={!message.trim() || loadingSendMessage}
            className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loadingSendMessage ? (
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
            ) : (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
              </svg>
            )}
          </button>
        </form>
      </div>
    </div>
  );
};

export default Chat;
