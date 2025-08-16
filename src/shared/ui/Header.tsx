import React from 'react';
import { 
  AppBar, 
  Toolbar, 
  Typography, 
  Box, 
  Button, 
  Avatar,
  Menu,
  MenuItem,
  IconButton,
  useTheme,
  useMediaQuery,
  Divider
} from '@mui/material';
import { 
  AccountCircle,
  Logout as LogoutIcon,
  Settings as SettingsIcon,
  Person as PersonIcon
} from '@mui/icons-material';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate, useLocation } from 'react-router-dom';
import { RootState } from '../../app/store';
import { logout } from '../../features/auth/authSlice';
import { logoutUser } from '../../features/auth/authApi';

const Header: React.FC = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const { isAuthenticated, user } = useSelector((state: RootState) => state.auth);
  
  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);

  // Solo mostrar en desktop
  if (isMobile) return null;

  const handleLogout = async () => {
    try {
      await dispatch(logoutUser()).unwrap();
      dispatch(logout());
      navigate('/auth');
    } catch (error) {
      console.error('Error al cerrar sesión:', error);
    }
  };

  const handleMenu = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const isActive = (path: string) => {
    return location.pathname === path;
  };

  const getActiveButtonStyle = (path: string) => ({
    backgroundColor: isActive(path) ? 'rgba(255, 255, 255, 0.1)' : 'transparent',
    color: isActive(path) ? 'white' : 'rgba(255, 255, 255, 0.8)',
    '&:hover': {
      backgroundColor: 'rgba(255, 255, 255, 0.15)',
    },
  });

  return (
    <AppBar 
      position="static" 
      sx={{ 
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        boxShadow: '0 2px 10px rgba(0,0,0,0.1)'
      }}
    >
      <Toolbar sx={{ justifyContent: 'space-between' }}>
        {/* Logo */}
        <Typography 
          variant="h6" 
          component="div" 
          sx={{ 
            fontWeight: 'bold',
            cursor: 'pointer',
            textShadow: '1px 1px 2px rgba(0,0,0,0.3)'
          }}
          onClick={() => navigate('/')}
        >
          OntoMatch
        </Typography>
        
        {/* Navigation Buttons */}
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button 
            color="inherit" 
            onClick={() => navigate('/')}
            sx={getActiveButtonStyle('/')}
            variant="text"
          >
            Inicio
          </Button>
          <Button 
            color="inherit" 
            onClick={() => navigate('/swipe')}
            sx={getActiveButtonStyle('/swipe')}
            variant="text"
          >
            Descubrir
          </Button>
          <Button 
            color="inherit" 
            onClick={() => navigate('/matches')}
            sx={getActiveButtonStyle('/matches')}
            variant="text"
          >
            Matches
          </Button>
        </Box>

        {/* User Menu */}
        {isAuthenticated && user && (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Typography 
              variant="body2" 
              sx={{ 
                color: 'rgba(255, 255, 255, 0.9)',
                fontWeight: 500
              }}
            >
              Hola, {user.email?.split('@')[0] || 'Usuario'}
            </Typography>
            
            <IconButton
              size="large"
              aria-label="account of current user"
              aria-controls="menu-appbar"
              aria-haspopup="true"
              onClick={handleMenu}
              color="inherit"
              sx={{
                '&:hover': {
                  backgroundColor: 'rgba(255, 255, 255, 0.1)',
                },
              }}
            >
              <AccountCircle />
            </IconButton>
            
            <Menu
              id="menu-appbar"
              anchorEl={anchorEl}
              anchorOrigin={{
                vertical: 'bottom',
                horizontal: 'right',
              }}
              keepMounted
              transformOrigin={{
                vertical: 'top',
                horizontal: 'right',
              }}
              open={Boolean(anchorEl)}
              onClose={handleClose}
              PaperProps={{
                sx: {
                  mt: 1,
                  minWidth: 200,
                  boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
                  borderRadius: 2,
                }
              }}
            >
              <MenuItem 
                onClick={() => {
                  navigate('/edit-profile');
                  handleClose();
                }}
                sx={{ py: 1.5 }}
              >
                <PersonIcon sx={{ mr: 2, fontSize: 20 }} />
                Editar Perfil
              </MenuItem>
              
              <Divider />
              
              <MenuItem 
                onClick={() => {
                  handleLogout();
                  handleClose();
                }}
                sx={{ py: 1.5, color: theme.palette.error.main }}
              >
                <LogoutIcon sx={{ mr: 2, fontSize: 20 }} />
                Cerrar Sesión
              </MenuItem>
            </Menu>
          </Box>
        )}
      </Toolbar>
    </AppBar>
  );
};

export default Header;
