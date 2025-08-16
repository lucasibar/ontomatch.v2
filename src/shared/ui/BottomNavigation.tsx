import React from 'react';
import { 
  BottomNavigation, 
  BottomNavigationAction, 
  Paper,
  useTheme,
  useMediaQuery
} from '@mui/material';
import { 
  Home as HomeIcon,
  Explore as ExploreIcon,
  People as PeopleIcon,
  Chat as ChatIcon,
  Person as PersonIcon
} from '@mui/icons-material';
import { useNavigate, useLocation } from 'react-router-dom';

const MobileBottomNavigation: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  if (!isMobile) return null;

  const getCurrentValue = () => {
    const path = location.pathname;
    if (path === '/') return 'home';
    if (path === '/swipe') return 'swipe';
    if (path === '/matches') return 'matches';
    if (path.startsWith('/chat')) return 'chat';
    if (path === '/edit-profile') return 'profile';
    return 'home';
  };

  return (
    <Paper 
      sx={{ 
        position: 'fixed', 
        bottom: 0, 
        left: 0, 
        right: 0, 
        zIndex: 1000,
        borderTop: `1px solid ${theme.palette.divider}`,
        backgroundColor: 'white'
      }} 
      elevation={8}
    >
      <BottomNavigation
        value={getCurrentValue()}
        onChange={(event, newValue) => {
          switch (newValue) {
            case 'home':
              navigate('/');
              break;
            case 'swipe':
              navigate('/swipe');
              break;
            case 'matches':
              navigate('/matches');
              break;
            case 'chat':
              navigate('/matches'); // Los chats están en matches
              break;
            case 'profile':
              navigate('/edit-profile');
              break;
          }
        }}
        showLabels
        sx={{
          '& .MuiBottomNavigationAction-root': {
            minWidth: 'auto',
            padding: '6px 12px 8px',
            '&.Mui-selected': {
              color: theme.palette.primary.main,
            },
          },
          '& .MuiBottomNavigationAction-label': {
            fontSize: '0.75rem',
            marginTop: '4px',
          },
        }}
      >
        <BottomNavigationAction
          label="Inicio"
          value="home"
          icon={<HomeIcon />}
        />
        <BottomNavigationAction
          label="Descubrir"
          value="swipe"
          icon={<ExploreIcon />}
        />
        <BottomNavigationAction
          label="Matches"
          value="matches"
          icon={<PeopleIcon />}
        />
        <BottomNavigationAction
          label="Chats"
          value="chat"
          icon={<ChatIcon />}
        />
        <BottomNavigationAction
          label="Perfil"
          value="profile"
          icon={<PersonIcon />}
        />
      </BottomNavigation>
    </Paper>
  );
};

export default MobileBottomNavigation;
