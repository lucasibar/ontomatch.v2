import React, { useState } from 'react';
import { Box, Button, TextField, Typography, Link } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { loginUser } from './authApi';
import { login } from './authSlice';
import ErrorMessage from '../../shared/ui/ErrorMessage';

const LoginForm = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);
    
    try {
      const user = await dispatch(loginUser({ email, password })).unwrap();
      dispatch(login(user));
      navigate('/');
    } catch (err: any) {
      setError(err.message || 'Error al iniciar sesión. Verifica tus credenciales.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Box component="form" onSubmit={handleSubmit} sx={{ maxWidth: 400, mx: 'auto', mt: 4 }}>
      <Typography variant="h4" component="h1" gutterBottom align="center">
        Iniciar Sesión
      </Typography>
      
      {error && <ErrorMessage message={error} />}
      
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
      
      <Button type="submit" variant="contained" fullWidth disabled={isLoading} sx={{ mt: 3 }}>
        {isLoading ? 'Iniciando sesión...' : 'Iniciar Sesión'}
      </Button>

      <Box sx={{ mt: 2, textAlign: 'center' }}>
        <Typography variant="body2">
          ¿No tienes cuenta?{' '}
          <Link href="/register" underline="hover">
            Regístrate aquí
          </Link>
        </Typography>
      </Box>
    </Box>
  );
};

export default LoginForm;
