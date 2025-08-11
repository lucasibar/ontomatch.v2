import { Box, Typography, Button } from '@mui/material';
import { useDispatch, useSelector } from 'react-redux';
import { logout } from '../features/auth/authSlice';
import { logoutUser } from '../features/auth/authApi';
import { RootState } from '../app/store';

const HomePage = () => {
  const dispatch = useDispatch();
  const user = useSelector((state: RootState) => state.auth.user);

  const handleLogout = async () => {
    try {
      await dispatch(logoutUser()).unwrap();
      dispatch(logout());
    } catch (error) {
      console.error('Error al cerrar sesión:', error);
    }
  };

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
          Hola, {user.nombre_completo}
        </Typography>
      )}
      
      <Typography variant="body1" sx={{ mb: 4, maxWidth: 600 }}>
        ¡El login ya está funcionando! Aquí podrás conectar con otros profesionales del coaching ontológico, 
        compartir experiencias y crear relaciones significativas.
      </Typography>

      <Button 
        variant="outlined" 
        color="primary" 
        onClick={handleLogout}
        sx={{ mt: 2 }}
      >
        Cerrar Sesión
      </Button>
    </Box>
  );
};

export default HomePage;
