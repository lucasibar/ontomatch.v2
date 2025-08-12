import React, { useState, useEffect } from 'react';
import { Box, Button, TextField, Typography, Alert, CircularProgress } from '@mui/material';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { authenticateUser, clearUserProfile } from './authApi';
import { RootState } from '../../app/store';
import RegisterForm from './RegisterForm';

const AuthForm = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { isLoading, message, needsEmailConfirmation, isAuthenticated, hasProfile, user } = useSelector(
    (state: RootState) => state.auth
  );

  // Debug logs
  console.log('=== AUTHFORM STATE ===');
  console.log('isAuthenticated:', isAuthenticated);
  console.log('hasProfile:', hasProfile);
  console.log('needsEmailConfirmation:', needsEmailConfirmation);
  console.log('message:', message);
  console.log('isLoading:', isLoading);
  console.log('=== FIN AUTHFORM STATE ===');

  // Redirigir automáticamente si está autenticado y tiene perfil completo
  useEffect(() => {
    if (isAuthenticated && hasProfile) {
      console.log('Redirigiendo al home...');
      navigate('/', { replace: true });
    }
  }, [isAuthenticated, hasProfile, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) return;

    try {
      await dispatch(authenticateUser({ email, password })).unwrap();
    } catch (error) {
      // Error ya manejado por el slice
    }
  };

  const handleClearProfile = async () => {
    if (!user?.id) return;
    
    try {
      await clearUserProfile(user.id);
      // Recargar la página para resetear el estado
      window.location.reload();
    } catch (error) {
      console.error('Error al limpiar perfil:', error);
    }
  };

  // Si necesita confirmación de email
  if (needsEmailConfirmation) {
    return (
      <Box sx={{ maxWidth: 500, mx: 'auto', mt: 4, textAlign: 'center' }}>
        <Alert severity="info" sx={{ mb: 3 }}>
          {message}
        </Alert>
        <Typography variant="body1" sx={{ mb: 2 }}>
          Revisa tu bandeja de entrada y haz clic en el enlace de confirmación.
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Una vez confirmado, podrás volver a intentar el acceso.
        </Typography>
      </Box>
    );
  }

  // Si está autenticado pero no tiene perfil completo
  if (isAuthenticated && !hasProfile) {
    return <RegisterForm />;
  }

  // Formulario principal de email/password
  return (
    <Box component="form" onSubmit={handleSubmit} sx={{ maxWidth: 400, mx: 'auto', mt: 4 }}>
      <Typography variant="h4" component="h1" gutterBottom align="center">
        OntoMatch
      </Typography>
      
      <Typography variant="h6" color="text.secondary" gutterBottom align="center" sx={{ mb: 4 }}>
        Tu plataforma de conexión para coaches ontológicos
      </Typography>

      {message && (
        <Alert severity={message.includes('exitoso') ? 'success' : 'error'} sx={{ mb: 3 }}>
          {message}
        </Alert>
      )}
      
      <TextField 
        fullWidth 
        margin="normal" 
        label="Email" 
        type="email"
        value={email} 
        onChange={e => setEmail(e.target.value)} 
        required
        disabled={isLoading}
      />
      
      <TextField 
        fullWidth 
        margin="normal" 
        label="Contraseña" 
        type="password" 
        value={password} 
        onChange={e => setPassword(e.target.value)} 
        required
        disabled={isLoading}
      />
      
      <Button 
        type="submit" 
        variant="contained" 
        fullWidth 
        disabled={isLoading || !email.trim() || !password.trim()} 
        sx={{ mt: 3 }}
      >
        {isLoading ? (
          <CircularProgress size={24} color="inherit" />
        ) : (
          'Continuar'
        )}
      </Button>

      {/* Botón temporal para limpiar perfil (solo para testing) */}
      {isAuthenticated && hasProfile && user && (
        <Button 
          variant="outlined" 
          color="warning" 
          fullWidth 
          onClick={handleClearProfile}
          sx={{ mt: 2 }}
        >
          Limpiar Perfil (Testing)
        </Button>
      )}

      <Typography variant="body2" color="text.secondary" sx={{ mt: 2, textAlign: 'center' }}>
        Si no tienes cuenta, se creará automáticamente
      </Typography>
    </Box>
  );
};

export default AuthForm;
