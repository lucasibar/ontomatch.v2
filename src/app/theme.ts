import { createTheme } from '@mui/material/styles';

export const theme = createTheme({
  palette: {
    primary: {
      main: '#8B5CF6', // Violeta elegante
      light: '#A78BFA',
      dark: '#7C3AED',
      contrastText: '#FFFFFF',
    },
    secondary: {
      main: '#F3F4F6', // Gris muy claro
      light: '#FFFFFF',
      dark: '#E5E7EB',
      contrastText: '#1F2937',
    },
    background: {
      default: '#FFFFFF',
      paper: '#FFFFFF',
    },
    text: {
      primary: '#1F2937', // Negro elegante
      secondary: '#6B7280',
    },
    error: {
      main: '#EF4444',
    },
    success: {
      main: '#10B981',
    },
  },
  typography: {
    fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
    h1: {
      fontWeight: 300,
      fontSize: '2.5rem',
      letterSpacing: '-0.02em',
    },
    h2: {
      fontWeight: 300,
      fontSize: '2rem',
      letterSpacing: '-0.01em',
    },
    h3: {
      fontWeight: 400,
      fontSize: '1.75rem',
      letterSpacing: '-0.01em',
    },
    h4: {
      fontWeight: 400,
      fontSize: '1.5rem',
      letterSpacing: '-0.01em',
    },
    h5: {
      fontWeight: 500,
      fontSize: '1.25rem',
      letterSpacing: '-0.01em',
    },
    h6: {
      fontWeight: 500,
      fontSize: '1.125rem',
      letterSpacing: '-0.01em',
    },
    body1: {
      fontWeight: 400,
      fontSize: '1rem',
      lineHeight: 1.6,
    },
    body2: {
      fontWeight: 400,
      fontSize: '0.875rem',
      lineHeight: 1.5,
    },
    button: {
      fontWeight: 500,
      textTransform: 'none',
      letterSpacing: '0.025em',
    },
  },
  shape: {
    borderRadius: 16,
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          padding: '12px 24px',
          boxShadow: 'none',
          '&:hover': {
            boxShadow: '0 4px 12px rgba(139, 92, 246, 0.15)',
          },
        },
        contained: {
          background: 'linear-gradient(135deg, #8B5CF6 0%, #A78BFA 100%)',
          '&:hover': {
            background: 'linear-gradient(135deg, #7C3AED 0%, #8B5CF6 100%)',
          },
        },
        outlined: {
          borderColor: '#E5E7EB',
          '&:hover': {
            borderColor: '#8B5CF6',
            backgroundColor: 'rgba(139, 92, 246, 0.04)',
          },
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 20,
          boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)',
          border: '1px solid #F3F4F6',
          '&:hover': {
            boxShadow: '0 8px 30px rgba(0, 0, 0, 0.12)',
            transform: 'translateY(-2px)',
          },
          transition: 'all 0.3s ease',
        },
      },
    },
    MuiAvatar: {
      styleOverrides: {
        root: {
          border: '3px solid #F3F4F6',
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          borderRadius: 20,
          fontWeight: 500,
        },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          backgroundColor: '#FFFFFF',
          color: '#1F2937',
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
          borderBottom: '1px solid #F3F4F6',
        },
      },
    },
  },
});
