import Ably from 'ably';

// Configuración de Ably para chats en tiempo real
export const ably = new Ably.Realtime({
  key: ,
  clientId: 'ontomatch-client', // Esto se actualizará con el ID del usuario autenticado
});

// Función para configurar el clientId del usuario autenticado
export const setAblyClientId = (userId: string) => {
  ably.auth.clientId = userId;
};

// Función para obtener un canal de chat
export const getChatChannel = (matchId: string) => {
  return ably.channels.get(`chat:${matchId}`);
};

// Función para suscribirse a un canal de chat
export const subscribeToChat = (
  matchId: string, 
  onMessage: (message: any) => void,
  onPresenceUpdate?: (presence: any) => void
) => {
  const channel = getChatChannel(matchId);
  
  // Suscribirse a mensajes
  channel.subscribe('message', onMessage);
  
  // Opcional: suscribirse a presencia (quién está online)
  if (onPresenceUpdate) {
    channel.presence.subscribe('enter', onPresenceUpdate);
    channel.presence.subscribe('leave', onPresenceUpdate);
  }
  
  return channel;
};

// Función para enviar un mensaje
export const sendMessage = async (matchId: string, content: string, senderId: string) => {
  const channel = getChatChannel(matchId);
  
  try {
    await channel.publish('message', {
      content,
      senderId,
      timestamp: new Date().toISOString(),
    });
    
    return true;
  } catch (error) {
    console.error('Error al enviar mensaje:', error);
    return false;
  }
};

// Función para entrar a presencia (marcar como online)
export const enterPresence = async (matchId: string, userId: string, userName: string) => {
  const channel = getChatChannel(matchId);
  
  try {
    await channel.presence.enter({
      userId,
      userName,
      timestamp: new Date().toISOString(),
    });
    
    return true;
  } catch (error) {
    console.error('Error al entrar a presencia:', error);
    return false;
  }
};

// Función para salir de presencia (marcar como offline)
export const leavePresence = async (matchId: string) => {
  const channel = getChatChannel(matchId);
  
  try {
    await channel.presence.leave();
    return true;
  } catch (error) {
    console.error('Error al salir de presencia:', error);
    return false;
  }
};

// Función para desconectar
export const disconnectAbly = () => {
  ably.close();
};
