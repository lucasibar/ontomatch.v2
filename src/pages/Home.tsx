import { Box, Typography, Button, CircularProgress } from '@mui/material';
import { useDispatch, useSelector } from 'react-redux';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { logout } from '../features/auth/authSlice';
import { logoutUser } from '../features/auth/authApi';
import { ensureProfileInitialized } from '../features/onboarding/useOnboarding';
import { RootState } from '../app/store';

const HomePage = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const user = useSelector((state: RootState) => state.auth.user);
  const [isLoading, setIsLoading] = useState(true);
  const [profileStatus, setProfileStatus] = useState<any>(null);

  useEffect(() => {
    const checkProfile = async () => {
      try {
        const status = await ensureProfileInitialized();
        setProfileStatus(status);
        
        if (status.needsAuth) {
          navigate('/auth');
        } else if (status.needsOnboarding) {
          // Por ahora solo mostrar mensaje, después implementaremos la página de onboarding
          console.log('Usuario necesita completar perfil');
        }
      } catch (error) {
        console.error('Error al verificar perfil:', error);
      } finally {
        setIsLoading(false);
      }
    };

    checkProfile();
  }, [navigate]);

  const handleLogout = async () => {
    try {
      await dispatch(logoutUser()).unwrap();
      dispatch(logout());
    } catch (error) {
      console.error('Error al cerrar sesión:', error);
    }
  };

  if (isLoading) {
    return (
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        minHeight: '60vh' 
      }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ 
      display: 'flex', 
      flexDirection: 'column', 
      alignItems: 'center', 
      justifyContent: 'center', 
      minHeight: '60vh',
      textAlign: 'center',
      px: 2
    }}>
      <Typography variant="h3" component="h1" gutterBottom>
        ¡Bienvenido a OntoMatch!
      </Typography>
      
      <Typography variant="h5" color="text.secondary" sx={{ mb: 2 }}>
        Tu plataforma de conexión para coaches ontológicos
      </Typography>

      {user && (
        <Typography variant="h6" color="primary" sx={{ mb: 4 }}>
          Hola, {user.nombre_completo || user.email}
        </Typography>
      )}

      {profileStatus?.needsOnboarding && (
        <Typography variant="body1" color="warning.main" sx={{ mb: 4 }}>
          Necesitas completar tu perfil para continuar
        </Typography>
      )}
      
      <Typography variant="body1" sx={{ mb: 4, maxWidth: 600 }}>
        ¡El login ya está funcionando! Aquí podrás conectar con otros profesionales del coaching ontológico, 
        compartir experiencias y crear relaciones significativas.
      </Typography>

      <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', justifyContent: 'center', mb: 4 }}>
        <Button 
          variant="contained" 
          color="primary" 
          onClick={() => navigate('/swipe')}
          sx={{ minWidth: 120 }}
        >
          Descubrir
        </Button>
        
        <Button 
          variant="outlined" 
          color="primary" 
          onClick={() => navigate('/matches')}
          sx={{ minWidth: 120 }}
        >
          Mis Matches
        </Button>
      </Box>

      <Button 
        variant="outlined" 
        color="secondary" 
        onClick={handleLogout}
        sx={{ mt: 2 }}
      >
        Cerrar Sesión
      </Button>
    </Box>
  );
};

export default HomePage;
