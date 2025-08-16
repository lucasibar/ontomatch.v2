import React from 'react';
import { useNavigate } from 'react-router-dom';
import SwipeList from '../features/match/SwipeList';
import { CompatibleUser } from '../features/match/matchApi';

const Swipe: React.FC = () => {
  const navigate = useNavigate();

  const handleMatch = (matchId: string, user: CompatibleUser) => {
    // Aquí podrías navegar al chat o mostrar un modal
    console.log('Match con:', user.nombre_completo, 'Match ID:', matchId);
    
    // Opcional: navegar al chat
    // navigate(`/chat/${matchId}`);
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-md mx-auto px-4">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Descubre</h1>
          <p className="text-gray-600">Encuentra personas compatibles</p>
        </div>
        
        <SwipeList onMatch={handleMatch} />
      </div>
    </div>
  );
};

export default Swipe;
