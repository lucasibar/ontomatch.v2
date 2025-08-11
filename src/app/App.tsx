import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Box, ThemeProvider, CssBaseline } from '@mui/material';
import { theme } from './theme';
import HomePage from '../pages/Home';
import AuthForm from '../features/auth/AuthForm';
import { useSelector } from 'react-redux';
import { RootState } from './store';

const PrivateRoute = ({ children }: { children: JSX.Element }) => {
  const { isAuthenticated, hasProfile } = useSelector((state: RootState) => state.auth);
  return isAuthenticated && hasProfile ? children : <Navigate to="/auth" />;
};

const App = () => {
  const { isAuthenticated, hasProfile } = useSelector((state: RootState) => state.auth);

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <BrowserRouter>
        <Box sx={{ 
          display: 'flex', 
          flexDirection: 'column', 
          minHeight: '100vh',
          backgroundColor: '#FFFFFF',
        }}>
          <Box component="main" sx={{ flexGrow: 1, py: 3 }}>
            <Routes>
              <Route path="/" element={<PrivateRoute><HomePage /></PrivateRoute>} />
              <Route path="/auth" element={<AuthForm />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </Box>
        </Box>
      </BrowserRouter>
    </ThemeProvider>
  );
};

export default App;
