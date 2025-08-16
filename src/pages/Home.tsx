import { 
  Box, 
  Typography, 
  Button, 
  CircularProgress, 
  Card, 
  CardContent, 
  Chip, 
  Grid,
  Paper,
  Divider,
  useTheme,
  useMediaQuery,
  Container
} from '@mui/material';
import { 
  Edit as EditIcon,
  LocationOn as LocationIcon,
  Favorite as FavoriteIcon,
  People as PeopleIcon,
  School as SchoolIcon,
  Logout as LogoutIcon,
  Explore as ExploreIcon
} from '@mui/icons-material';
import { useDispatch, useSelector } from 'react-redux';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { logout } from '../features/auth/authSlice';
import { logoutUser } from '../features/auth/authApi';
import { RootState } from '../app/store';
import { supabase } from '../shared/config/supabase';
import { User, Photo, School } from '../entities/user';
import { ImageCarousel } from '../shared/ui';

const HomePage = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const user = useSelector((state: RootState) => state.auth.user);
  const [isLoading, setIsLoading] = useState(true);
  const [profile, setProfile] = useState<User | null>(null);
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [school, setSchool] = useState<School | null>(null);
  const [imageUrls, setImageUrls] = useState<{ [key: string]: string }>({});

  useEffect(() => {
    const loadProfile = async () => {
      if (!user) {
        navigate('/auth');
        return;
      }

      try {
        // Cargar perfil completo
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select(`
            *,
            escuela:escuelas_habilitadas(*)
          `)
          .eq('id', user.id)
          .single();

        if (profileError) {
          console.error('Error al cargar perfil:', profileError);
        } else {
          setProfile(profileData);
          setSchool(profileData.escuela);
        }

        // Cargar fotos
        const { data: photosData, error: photosError } = await supabase
          .from('fotos')
          .select('*')
          .eq('user_id', user.id)
          .order('position', { ascending: true });

        if (photosError) {
          console.error('Error al cargar fotos:', photosError);
        } else {
          setPhotos(photosData || []);
          
          // Cargar URLs de las imágenes
          if (photosData && photosData.length > 0) {
            const urls: { [key: string]: string } = {};
            for (const photo of photosData) {
              const url = await getImageUrl(photo.path);
              urls[photo.path] = url;
            }
            setImageUrls(urls);
          }
        }
      } catch (error) {
        console.error('Error al cargar datos:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadProfile();
  }, [user, navigate]);

  const handleLogout = async () => {
    try {
      await dispatch(logoutUser()).unwrap();
      dispatch(logout());
    } catch (error) {
      console.error('Error al cerrar sesión:', error);
    }
  };

  // Función para convertir valores del enum de la base de datos a valores del frontend
  const mapGeneroFromEnum = (genero: string): string => {
    switch (genero.toLowerCase()) {
      case 'masculino': return 'masculino';
      case 'femenino': return 'femenino';
      case 'otro': return 'otros';
      default: return 'otros';
    }
  };

  const getImageUrl = async (path: string): Promise<string> => {
    if (!path) return '/default-avatar.png';
    
    try {
      const { data, error } = await supabase.storage
        .from('avatars')
        .createSignedUrl(path, 3600); // URL válida por 1 hora
      
      if (error) {
        console.error('Error al obtener URL de imagen:', error);
        return '/default-avatar.png';
      }
      
      return data.signedUrl;
    } catch (error) {
      console.error('Error al obtener URL de imagen:', error);
      return '/default-avatar.png';
    }
  };

  if (isLoading) {
    return (
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
      }}>
        <CircularProgress size={60} sx={{ color: 'white' }} />
      </Box>
    );
  }

  if (!profile) {
    return (
      <Box sx={{ 
        display: 'flex', 
        flexDirection: 'column', 
        alignItems: 'center', 
        justifyContent: 'center', 
        minHeight: '100vh',
        textAlign: 'center',
        px: 2,
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        color: 'white'
      }}>
        <Typography variant="h5" sx={{ mb: 2 }}>
          Error al cargar tu perfil
        </Typography>
        <Button 
          variant="contained" 
          onClick={() => navigate('/auth')}
          sx={{ 
            backgroundColor: 'white',
            color: '#667eea',
            '&:hover': {
              backgroundColor: '#f5f5f5'
            }
          }}
        >
          Volver al login
        </Button>
      </Box>
    );
  }

  // Preparar imágenes para el carrusel
  const carouselImages = photos.length > 0 
    ? photos.map(photo => imageUrls[photo.path] || '/default-avatar.png')
    : ['/default-avatar.png'];

  return (
         <Box sx={{ 
       minHeight: '100vh',
       background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
       py: { xs: 2, md: 4 },
       pb: { xs: 8, md: 4 } // Padding inferior para móvil por la barra de navegación
     }}>
      <Container maxWidth="lg">
        {/* Header */}
        <Box sx={{ 
          textAlign: 'center', 
          mb: { xs: 3, md: 4 },
          color: 'white'
        }}>
          <Typography 
            variant={isMobile ? "h4" : "h3"} 
            component="h1" 
            gutterBottom 
            sx={{ 
              fontWeight: 'bold',
              textShadow: '2px 2px 4px rgba(0,0,0,0.3)'
            }}
          >
            OntoMatch
          </Typography>
          <Typography 
            variant={isMobile ? "body1" : "h6"} 
            sx={{ 
              opacity: 0.9,
              textShadow: '1px 1px 2px rgba(0,0,0,0.3)'
            }}
          >
            Tu plataforma de conexión para coaches ontológicos
          </Typography>
        </Box>

        {/* Main Profile Card */}
        <Card sx={{ 
          borderRadius: 4,
          boxShadow: '0 20px 40px rgba(0,0,0,0.1)',
          overflow: 'hidden',
          mb: 4
        }}>
                     {/* Image Carousel */}
           <Box sx={{ 
             position: 'relative',
             height: { 
               xs: 300,    // Mobile
               sm: 320,    // Small tablet
               md: 350,    // Tablet
               lg: 380,    // Desktop
               xl: 400     // Large desktop
             }
           }}>
                         <ImageCarousel 
               images={carouselImages}
               height="100%"
               showIndicators={true}
               showArrows={true}
               autoPlay={false}
               objectFit={isMobile ? 'cover' : 'contain'}
               backgroundColor={isMobile ? '#000000' : '#1a1a1a'}
             />
          </Box>

          <CardContent sx={{ p: { xs: 3, md: 4 } }}>
            {/* Profile Header */}
            <Box sx={{ textAlign: 'center', mb: 4 }}>
              <Typography 
                variant={isMobile ? "h5" : "h4"} 
                component="h2" 
                gutterBottom 
                sx={{ 
                  fontWeight: 'bold',
                  color: theme.palette.text.primary
                }}
              >
                {profile.nombre_completo}
              </Typography>
              
              {profile.email && (
                <Typography 
                  variant="body1" 
                  color="text.secondary" 
                  sx={{ mb: 2 }}
                >
                  {profile.email}
                </Typography>
              )}

              {profile.descripcion && (
                <Paper 
                  elevation={0} 
                  sx={{ 
                    p: 2, 
                    mb: 3, 
                    backgroundColor: theme.palette.grey[50],
                    borderRadius: 2,
                    border: `1px solid ${theme.palette.grey[200]}`
                  }}
                >
                  <Typography 
                    variant="body1" 
                    sx={{ 
                      fontStyle: 'italic',
                      color: theme.palette.text.secondary
                    }}
                  >
                    "{profile.descripcion}"
                  </Typography>
                </Paper>
              )}
            </Box>

            <Divider sx={{ mb: 4 }} />

            {/* Profile Information */}
            <Grid container spacing={3} sx={{ mb: 4 }}>
              <Grid item xs={12} sm={6}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  <PeopleIcon sx={{ mr: 1, color: theme.palette.primary.main }} />
                  <Typography variant="subtitle2" color="text.secondary">
                    Me defino como:
                  </Typography>
                </Box>
                <Chip 
                  label={mapGeneroFromEnum(profile.me_defino)} 
                  color="primary" 
                  variant="filled"
                  sx={{ 
                    textTransform: 'capitalize',
                    fontWeight: 500
                  }}
                />
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  <FavoriteIcon sx={{ mr: 1, color: theme.palette.secondary.main }} />
                  <Typography variant="subtitle2" color="text.secondary">
                    Busco:
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                  {profile.que_busco.map((busco, index) => (
                    <Chip 
                      key={index}
                      label={mapGeneroFromEnum(busco)} 
                      color="secondary" 
                      variant="filled"
                      size="small"
                      sx={{ 
                        textTransform: 'capitalize',
                        fontWeight: 500
                      }}
                    />
                  ))}
                </Box>
              </Grid>

              <Grid item xs={12}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  <LocationIcon sx={{ mr: 1, color: theme.palette.success.main }} />
                  <Typography variant="subtitle2" color="text.secondary">
                    Tipo de relación:
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                  {profile.busca.map((tipo, index) => (
                    <Chip 
                      key={index}
                      label={tipo} 
                      color="success" 
                      variant="filled"
                      size="small"
                      sx={{ 
                        textTransform: 'capitalize',
                        fontWeight: 500
                      }}
                    />
                  ))}
                </Box>
              </Grid>

              {school && (
                <Grid item xs={12}>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                    <SchoolIcon sx={{ mr: 1, color: theme.palette.info.main }} />
                    <Typography variant="subtitle2" color="text.secondary">
                      Escuela:
                    </Typography>
                  </Box>
                  <Chip 
                    label={school.nombre} 
                    color="info" 
                    variant="filled"
                    sx={{ 
                      fontWeight: 500
                    }}
                  />
                </Grid>
              )}
            </Grid>
          </CardContent>
        </Card>

                 {/* Action Buttons - Solo mostrar en desktop ya que móvil tiene bottom navigation */}
         <Box sx={{ 
           display: { xs: 'none', md: 'flex' },
           gap: 2, 
           flexWrap: 'wrap', 
           justifyContent: 'center', 
           mb: 4 
         }}>
           <Button 
             variant="contained" 
             color="primary" 
             size="large"
             startIcon={<ExploreIcon />}
             onClick={() => navigate('/swipe')}
             sx={{ 
               minWidth: 160, 
               py: 1.5,
               borderRadius: 3,
               boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
               '&:hover': {
                 transform: 'translateY(-2px)',
                 boxShadow: '0 6px 20px rgba(0,0,0,0.2)'
               },
               transition: 'all 0.3s ease'
             }}
           >
             Descubrir
           </Button>
           
           <Button 
             variant="contained" 
             color="secondary" 
             size="large"
             startIcon={<PeopleIcon />}
             onClick={() => navigate('/matches')}
             sx={{ 
               minWidth: 160, 
               py: 1.5,
               borderRadius: 3,
               boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
               '&:hover': {
                 transform: 'translateY(-2px)',
                 boxShadow: '0 6px 20px rgba(0,0,0,0.2)'
               },
               transition: 'all 0.3s ease'
             }}
           >
             Mis Matches
           </Button>
 
           <Button 
             variant="outlined" 
             color="primary" 
             size="large"
             startIcon={<EditIcon />}
             onClick={() => navigate('/edit-profile')}
             sx={{ 
               minWidth: 160, 
               py: 1.5,
               borderRadius: 3,
               borderWidth: 2,
               '&:hover': {
                 borderWidth: 2,
                 transform: 'translateY(-2px)',
                 boxShadow: '0 6px 20px rgba(0,0,0,0.1)'
               },
               transition: 'all 0.3s ease'
             }}
           >
             Editar Perfil
           </Button>
         </Box>
 
         {/* Logout Button - Solo mostrar en desktop */}
         <Box sx={{ 
           textAlign: 'center',
           display: { xs: 'none', md: 'block' }
         }}>
           <Button 
             variant="text" 
             color="inherit"
             startIcon={<LogoutIcon />}
             onClick={handleLogout}
             sx={{ 
               color: 'white',
               '&:hover': {
                 backgroundColor: 'rgba(255,255,255,0.1)'
               }
             }}
           >
             Cerrar Sesión
           </Button>
         </Box>
      </Container>
    </Box>
  );
};

export default HomePage;
