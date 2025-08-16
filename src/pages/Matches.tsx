import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { RootState } from '../app/store';
import { getMyMatches, MatchWithUser } from '../features/match/matchApi';
import { supabase } from '../shared/config/supabase';

const Matches: React.FC = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { matches, loadingMatches, error } = useSelector((state: RootState) => state.match);

  useEffect(() => {
    dispatch(getMyMatches());
  }, [dispatch]);

  const getImageUrl = (path: string) => {
    if (!path) return '/default-avatar.png';
    
    const { data } = supabase.storage
      .from('avatars')
      .getPublicUrl(path);
    
    return data.publicUrl;
  };

  const handleChatClick = (matchId: string) => {
    navigate(`/chat/${matchId}`);
  };

  if (loadingMatches) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando matches...</p>
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
            onClick={() => dispatch(getMyMatches())}
            className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600"
          >
            Reintentar
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-2xl mx-auto px-4">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Mis Matches</h1>
          <p className="text-gray-600">
            {matches.length === 0 
              ? 'Aún no tienes matches. ¡Sigue swipeando!' 
              : `${matches.length} match${matches.length !== 1 ? 'es' : ''} encontrado${matches.length !== 1 ? 's' : ''}`
            }
          </p>
        </div>

        {matches.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">💔</div>
            <p className="text-gray-600 mb-6">No tienes matches aún</p>
            <button
              onClick={() => navigate('/swipe')}
              className="bg-blue-500 text-white px-6 py-3 rounded-lg hover:bg-blue-600"
            >
              Ir a Swipe
            </button>
          </div>
        ) : (
          <div className="grid gap-4">
            {matches.map((match) => (
              <div
                key={match.id}
                className="bg-white rounded-lg shadow-sm p-4 flex items-center space-x-4 hover:shadow-md transition-shadow cursor-pointer"
                onClick={() => handleChatClick(match.id)}
              >
                {/* Avatar */}
                <div className="flex-shrink-0">
                  <img
                    src={getImageUrl(match.other_user.foto_principal || '')}
                    alt={match.other_user.nombre_completo}
                    className="w-16 h-16 rounded-full object-cover border-2 border-blue-500"
                    onError={(e) => {
                      e.currentTarget.src = '/default-avatar.png';
                    }}
                  />
                </div>

                {/* Información del usuario */}
                <div className="flex-1 min-w-0">
                  <h3 className="text-lg font-semibold text-gray-900 truncate">
                    {match.other_user.nombre_completo}
                  </h3>
                  
                  {match.other_user.descripcion && (
                    <p className="text-gray-600 text-sm truncate">
                      {match.other_user.descripcion}
                    </p>
                  )}
                  
                  <div className="flex flex-wrap gap-1 mt-2">
                    {match.other_user.escuela_nombre && (
                      <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full">
                        {match.other_user.escuela_nombre}
                      </span>
                    )}
                    <span className="bg-gray-100 text-gray-800 text-xs px-2 py-1 rounded-full">
                      {match.other_user.me_defino}
                    </span>
                    {match.other_user.busca.map((tipo, index) => (
                      <span key={index} className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full">
                        {tipo}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Indicador de chat */}
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                    <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                    </svg>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Matches;
