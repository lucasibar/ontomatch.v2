import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Box, ThemeProvider, CssBaseline } from '@mui/material';
import { theme } from './theme';
import HomePage from '../pages/Home';
import AuthForm from '../features/auth/AuthForm';
import Swipe from '../pages/Swipe';
import Matches from '../pages/Matches';
import Chat from '../pages/Chat';
import EditProfile from '../pages/EditProfile';
import { useSelector } from 'react-redux';
import { RootState } from './store';
import { Header, BottomNavigation } from '../shared/ui';

const PrivateRoute = ({ children }: { children: JSX.Element }) => {
  const { isAuthenticated, hasProfile } = useSelector((state: RootState) => state.auth);
  
  console.log('=== PRIVATE ROUTE ===');
  console.log('isAuthenticated:', isAuthenticated);
  console.log('hasProfile:', hasProfile);
  console.log('Should render children:', isAuthenticated && hasProfile);
  console.log('=== FIN PRIVATE ROUTE ===');
  
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
          <Header />
          <Box component="main" sx={{ flexGrow: 1, py: 3 }}>
            <Routes>
              <Route path="/" element={<PrivateRoute><HomePage /></PrivateRoute>} />
              <Route path="/swipe" element={<PrivateRoute><Swipe /></PrivateRoute>} />
              <Route path="/matches" element={<PrivateRoute><Matches /></PrivateRoute>} />
              <Route path="/chat/:matchId" element={<PrivateRoute><Chat /></PrivateRoute>} />
              <Route path="/edit-profile" element={<PrivateRoute><EditProfile /></PrivateRoute>} />
              <Route path="/auth" element={<AuthForm />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </Box>
          <BottomNavigation />
        </Box>
      </BrowserRouter>
    </ThemeProvider>
  );
};

export default App;
