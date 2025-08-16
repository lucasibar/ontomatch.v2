import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '../../app/store';
import { 
  getCompatibleUsers, 
  likeUser, 
  CompatibleUser
} from './matchApi';
import { 
  resetMatchState, 
  nextUser, 
  previousUser,
  clearError,
  clearLastLikeResult 
} from './matchSlice';
import { supabase } from '../../shared/config/supabase';

interface SwipeListProps {
  onMatch?: (matchId: string, user: CompatibleUser) => void;
}

const SwipeList: React.FC<SwipeListProps> = ({ onMatch }) => {
  const dispatch = useDispatch();
  const {
    compatibleUsers,
    currentUserIndex,
    loadingCompatibleUsers,
    loadingLike,
    error,
    lastLikeResult
  } = useSelector((state: RootState) => state.match);

  const [currentUser, setCurrentUser] = useState<CompatibleUser | null>(null);
  const [swipeDirection, setSwipeDirection] = useState<'left' | 'right' | null>(null);
  const [showMatchModal, setShowMatchModal] = useState(false);

  // Cargar usuarios compatibles al montar el componente
  useEffect(() => {
    dispatch(getCompatibleUsers(20));
    return () => {
      dispatch(resetMatchState());
    };
  }, [dispatch]);

  // Actualizar usuario actual cuando cambie el índice
  useEffect(() => {
    if (compatibleUsers.length > 0 && currentUserIndex < compatibleUsers.length) {
      setCurrentUser(compatibleUsers[currentUserIndex]);
    } else {
      setCurrentUser(null);
    }
  }, [compatibleUsers, currentUserIndex]);

  // Manejar resultado del like
  useEffect(() => {
    if (lastLikeResult) {
      if (lastLikeResult.isMatch && onMatch) {
        onMatch(lastLikeResult.matchId!, lastLikeResult.likedUser!);
        setShowMatchModal(true);
      }
      
      // Limpiar el resultado después de un tiempo
      setTimeout(() => {
        dispatch(clearLastLikeResult());
        setShowMatchModal(false);
      }, 3000);
    }
  }, [lastLikeResult, onMatch, dispatch]);

  // Función para dar like
  const handleLike = async () => {
    if (!currentUser || loadingLike) return;
    
    setSwipeDirection('right');
    await dispatch(likeUser(currentUser.id));
    
    setTimeout(() => {
      setSwipeDirection(null);
    }, 300);
  };

  // Función para dar dislike (pasar al siguiente)
  const handleDislike = () => {
    if (!currentUser || loadingLike) return;
    
    setSwipeDirection('left');
    dispatch(nextUser());
    
    setTimeout(() => {
      setSwipeDirection(null);
    }, 300);
  };

  // Función para obtener URL de imagen
  const getImageUrl = (path: string) => {
    if (!path) return '/default-avatar.png';
    
    const { data } = supabase.storage
      .from('avatars')
      .getPublicUrl(path);
    
    return data.publicUrl;
  };

  // Función para recargar usuarios
  const handleReload = () => {
    dispatch(clearError());
    dispatch(getCompatibleUsers(20));
  };

  if (loadingCompatibleUsers) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Buscando usuarios compatibles...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error}</p>
          <button
            onClick={handleReload}
            className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600"
          >
            Reintentar
          </button>
        </div>
      </div>
    );
  }

  if (!currentUser) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <p className="text-gray-600 mb-4">No hay más usuarios compatibles por ahora</p>
          <button
            onClick={handleReload}
            className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600"
          >
            Buscar más usuarios
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="relative">
      {/* Card del usuario actual */}
      <div className={`relative transition-transform duration-300 ${
        swipeDirection === 'right' ? 'translate-x-full rotate-12' :
        swipeDirection === 'left' ? '-translate-x-full -rotate-12' : ''
      }`}>
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden max-w-sm mx-auto">
          {/* Imagen */}
          <div className="relative h-96 bg-gray-200">
            <img
              src={getImageUrl(currentUser.foto_principal || '')}
              alt={currentUser.nombre_completo}
              className="w-full h-full object-cover"
              onError={(e) => {
                e.currentTarget.src = '/default-avatar.png';
              }}
            />
            
            {/* Overlay con información */}
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-6">
              <h2 className="text-white text-2xl font-bold mb-2">
                {currentUser.nombre_completo}
              </h2>
              
              {currentUser.descripcion && (
                <p className="text-white/90 text-sm mb-2 line-clamp-2">
                  {currentUser.descripcion}
                </p>
              )}
              
              <div className="flex flex-wrap gap-2">
                {currentUser.escuela_nombre && (
                  <span className="bg-white/20 text-white text-xs px-2 py-1 rounded-full">
                    {currentUser.escuela_nombre}
                  </span>
                )}
                <span className="bg-white/20 text-white text-xs px-2 py-1 rounded-full">
                  {currentUser.me_defino}
                </span>
                {currentUser.busca.map((tipo, index) => (
                  <span key={index} className="bg-white/20 text-white text-xs px-2 py-1 rounded-full">
                    {tipo}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Botones de acción */}
      <div className="flex justify-center gap-4 mt-6">
        <button
          onClick={handleDislike}
          disabled={loadingLike}
          className="w-16 h-16 rounded-full bg-white border-2 border-gray-300 flex items-center justify-center hover:bg-gray-50 disabled:opacity-50"
        >
          <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        <button
          onClick={handleLike}
          disabled={loadingLike}
          className="w-16 h-16 rounded-full bg-white border-2 border-red-500 flex items-center justify-center hover:bg-red-50 disabled:opacity-50"
        >
          <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
          </svg>
        </button>
      </div>

      {/* Indicador de progreso */}
      <div className="flex justify-center mt-4">
        <div className="flex gap-1">
          {compatibleUsers.map((_, index) => (
            <div
              key={index}
              className={`w-2 h-2 rounded-full ${
                index === currentUserIndex ? 'bg-blue-500' : 'bg-gray-300'
              }`}
            />
          ))}
        </div>
      </div>

      {/* Modal de match */}
      {showMatchModal && lastLikeResult?.isMatch && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-8 text-center max-w-md mx-4">
            <div className="text-6xl mb-4">🎉</div>
            <h3 className="text-2xl font-bold mb-2">¡Es un match!</h3>
            <p className="text-gray-600 mb-6">
              Tú y {lastLikeResult.likedUser?.nombre_completo} se han gustado mutuamente
            </p>
            <button
              onClick={() => {
                setShowMatchModal(false);
                dispatch(clearLastLikeResult());
              }}
              className="bg-blue-500 text-white px-6 py-3 rounded-lg hover:bg-blue-600"
            >
              ¡Genial!
            </button>
          </div>
        </div>
      )}

      {/* Loading overlay */}
      {loadingLike && (
        <div className="absolute inset-0 bg-white/50 flex items-center justify-center rounded-2xl">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
        </div>
      )}
    </div>
  );
};

export default SwipeList;
