import React, { useEffect, useState } from 'react';
import { 
  Box, 
  Typography, 
  Button, 
  CircularProgress, 
  TextField, 
  FormControl, 
  InputLabel, 
  Select, 
  MenuItem, 
  Chip, 
  OutlinedInput, 
  Card, 
  CardContent, 
  Grid,
  Avatar,
  IconButton,
  Alert,
  Snackbar,
  Paper,
  Divider,
  useTheme,
  useMediaQuery,
  Container
} from '@mui/material';
import { 
  Delete as DeleteIcon,
  AddPhotoAlternate as AddPhotoAlternateIcon,
  ArrowBack as ArrowBackIcon,
  Save as SaveIcon,
  Cancel as CancelIcon,
  Person as PersonIcon,
  Favorite as FavoriteIcon,
  LocationOn as LocationIcon,
  School as SchoolIcon,
  Description as DescriptionIcon
} from '@mui/icons-material';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { RootState } from '../app/store';
import { supabase } from '../shared/config/supabase';
import { User, Photo, School } from '../entities/user';
import { completeProfile } from '../features/auth/authApi';

const EditProfile = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const user = useSelector((state: RootState) => state.auth.user);
  
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [profile, setProfile] = useState<User | null>(null);
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [schools, setSchools] = useState<School[]>([]);
  const [imageUrls, setImageUrls] = useState<{ [key: string]: string }>({});
  
  // Form data
  const [formData, setFormData] = useState({
    nombre_completo: '',
    descripcion: '',
    me_defino: [] as ('masculino' | 'femenino' | 'otros')[],
    que_busco: [] as ('masculino' | 'femenino' | 'otros')[],
    busca: [] as ('pareja' | 'amistad' | 'negocios')[],
    escuela_id: ''
  });
  
  const [newPhotos, setNewPhotos] = useState<File[]>([]);
  const [showSuccess, setShowSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadData = async () => {
      if (!user) {
        navigate('/auth');
        return;
      }

      try {
        // Cargar perfil
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();

        if (profileError) {
          console.error('Error al cargar perfil:', profileError);
        } else {
          setProfile(profileData);
          setFormData({
            nombre_completo: profileData.nombre_completo || '',
            descripcion: profileData.descripcion || '',
            me_defino: profileData.me_defino ? [mapGeneroFromEnum(profileData.me_defino)] : [],
            que_busco: (profileData.que_busco || []).map(mapGeneroFromEnum),
            busca: profileData.busca || [],
            escuela_id: profileData.escuela_id || ''
          });
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

        // Cargar escuelas
        const { data: schoolsData, error: schoolsError } = await supabase
          .from('escuelas_habilitadas')
          .select('*')
          .eq('habilitada', true)
          .order('nombre', { ascending: true });

        if (schoolsError) {
          console.error('Error al cargar escuelas:', schoolsError);
        } else {
          setSchools(schoolsData || []);
        }
      } catch (error) {
        console.error('Error al cargar datos:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [user, navigate]);

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
        .createSignedUrl(path, 3600);
      
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

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handlePhotoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files) {
      const fileArray = Array.from(files);
      setNewPhotos(prev => [...prev, ...fileArray]);
    }
  };

  const removePhoto = (index: number) => {
    setNewPhotos(prev => prev.filter((_, i) => i !== index));
  };

  const removeExistingPhoto = async (photoId: string, path: string) => {
    try {
      // Eliminar de storage
      await supabase.storage
        .from('avatars')
        .remove([path]);

      // Eliminar de base de datos
      await supabase
        .from('fotos')
        .delete()
        .eq('id', photoId);

      // Actualizar estado local
      setPhotos(prev => prev.filter(p => p.id !== photoId));
    } catch (error) {
      console.error('Error al eliminar foto:', error);
      setError('Error al eliminar la foto');
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    setError(null);

    try {
      // Preparar datos para el perfil
      const profileData = {
        nombre_completo: formData.nombre_completo,
        me_defino: formData.me_defino[0] || 'otros',
        que_busco: formData.que_busco,
        busca: formData.busca,
        descripcion: formData.descripcion || null,
        escuela_id: formData.escuela_id || null,
        photos: newPhotos
      };

      // Guardar perfil
      await dispatch(completeProfile(profileData)).unwrap();
      
      setShowSuccess(true);
      setTimeout(() => {
        navigate('/');
      }, 2000);
    } catch (error: any) {
      setError(error.message || 'Error al guardar el perfil');
    } finally {
      setIsSaving(false);
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

  return (
    <Box sx={{ 
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      py: { xs: 2, md: 4 }
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
            Editar Perfil
          </Typography>
          <Typography 
            variant={isMobile ? "body1" : "h6"} 
            sx={{ 
              opacity: 0.9,
              textShadow: '1px 1px 2px rgba(0,0,0,0.3)'
            }}
          >
            Actualiza tu información personal
          </Typography>
        </Box>

        {/* Main Form Card */}
        <Card sx={{ 
          borderRadius: 4,
          boxShadow: '0 20px 40px rgba(0,0,0,0.1)',
          overflow: 'hidden',
          mb: 4
        }}>
          <CardContent sx={{ p: { xs: 3, md: 4 } }}>
            <Grid container spacing={4}>
              {/* Información básica */}
              <Grid item xs={12} md={6}>
                <Box sx={{ mb: 3 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <PersonIcon sx={{ mr: 1, color: theme.palette.primary.main }} />
                    <Typography variant="h6" sx={{ fontWeight: 600 }}>
                      Información Personal
                    </Typography>
                  </Box>
                  
                  <TextField
                    fullWidth
                    label="Nombre completo"
                    value={formData.nombre_completo}
                    onChange={(e) => handleInputChange('nombre_completo', e.target.value)}
                    sx={{ mb: 3 }}
                    variant="outlined"
                  />
                  
                  <TextField
                    fullWidth
                    label="Descripción"
                    value={formData.descripcion}
                    onChange={(e) => handleInputChange('descripcion', e.target.value)}
                    multiline
                    rows={4}
                    sx={{ mb: 3 }}
                    variant="outlined"
                    placeholder="Cuéntanos sobre ti..."
                  />

                  <FormControl fullWidth sx={{ mb: 3 }}>
                    <InputLabel>Me defino como</InputLabel>
                    <Select
                      value={formData.me_defino}
                      onChange={(e) => handleInputChange('me_defino', e.target.value)}
                      input={<OutlinedInput label="Me defino como" />}
                    >
                      <MenuItem value="masculino">Masculino</MenuItem>
                      <MenuItem value="femenino">Femenino</MenuItem>
                      <MenuItem value="otros">Otros</MenuItem>
                    </Select>
                  </FormControl>

                  <FormControl fullWidth>
                    <InputLabel>Escuela</InputLabel>
                    <Select
                      value={formData.escuela_id}
                      onChange={(e) => handleInputChange('escuela_id', e.target.value)}
                      input={<OutlinedInput label="Escuela" />}
                    >
                      <MenuItem value="">Sin escuela</MenuItem>
                      {schools.map((school) => (
                        <MenuItem key={school.id} value={school.id}>
                          {school.nombre}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Box>
              </Grid>

              {/* Preferencias */}
              <Grid item xs={12} md={6}>
                <Box sx={{ mb: 3 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <FavoriteIcon sx={{ mr: 1, color: theme.palette.secondary.main }} />
                    <Typography variant="h6" sx={{ fontWeight: 600 }}>
                      Preferencias
                    </Typography>
                  </Box>

                  <FormControl fullWidth sx={{ mb: 3 }}>
                    <InputLabel>Busco</InputLabel>
                    <Select
                      multiple
                      value={formData.que_busco}
                      onChange={(e) => handleInputChange('que_busco', e.target.value)}
                      input={<OutlinedInput label="Busco" />}
                      renderValue={(selected) => (
                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                          {selected.map((value) => (
                            <Chip key={value} label={value} size="small" color="secondary" />
                          ))}
                        </Box>
                      )}
                    >
                      <MenuItem value="masculino">Masculino</MenuItem>
                      <MenuItem value="femenino">Femenino</MenuItem>
                      <MenuItem value="otros">Otros</MenuItem>
                    </Select>
                  </FormControl>

                  <FormControl fullWidth>
                    <InputLabel>Tipo de relación</InputLabel>
                    <Select
                      multiple
                      value={formData.busca}
                      onChange={(e) => handleInputChange('busca', e.target.value)}
                      input={<OutlinedInput label="Tipo de relación" />}
                      renderValue={(selected) => (
                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                          {selected.map((value) => (
                            <Chip key={value} label={value} size="small" color="success" />
                          ))}
                        </Box>
                      )}
                    >
                      <MenuItem value="pareja">Pareja</MenuItem>
                      <MenuItem value="amistad">Amistad</MenuItem>
                      <MenuItem value="negocios">Negocios</MenuItem>
                    </Select>
                  </FormControl>
                </Box>
              </Grid>

              <Grid item xs={12}>
                <Divider sx={{ my: 3 }} />
                
                {/* Fotos existentes */}
                <Box sx={{ mb: 4 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <AddPhotoAlternateIcon sx={{ mr: 1, color: theme.palette.info.main }} />
                    <Typography variant="h6" sx={{ fontWeight: 600 }}>
                      Fotos actuales
                    </Typography>
                  </Box>
                  
                  <Paper 
                    elevation={0} 
                    sx={{ 
                      p: 3, 
                      backgroundColor: theme.palette.grey[50],
                      borderRadius: 2,
                      border: `1px solid ${theme.palette.grey[200]}`
                    }}
                  >
                    {photos.length > 0 ? (
                      <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                        {photos.map((photo, index) => (
                          <Box key={photo.id} sx={{ position: 'relative' }}>
                            <Avatar
                              src={imageUrls[photo.path] || '/default-avatar.png'}
                              sx={{ 
                                width: 100, 
                                height: 100,
                                border: `3px solid ${theme.palette.primary.main}`
                              }}
                            />
                            <IconButton
                              size="small"
                              sx={{
                                position: 'absolute',
                                top: -8,
                                right: -8,
                                backgroundColor: theme.palette.error.main,
                                color: 'white',
                                '&:hover': { 
                                  backgroundColor: theme.palette.error.dark,
                                  transform: 'scale(1.1)'
                                },
                                transition: 'all 0.2s ease'
                              }}
                              onClick={() => removeExistingPhoto(photo.id, photo.path)}
                            >
                              <DeleteIcon fontSize="small" />
                            </IconButton>
                          </Box>
                        ))}
                      </Box>
                    ) : (
                      <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center' }}>
                        No tienes fotos subidas
                      </Typography>
                    )}
                  </Paper>
                </Box>

                {/* Subir nuevas fotos */}
                <Box sx={{ mb: 4 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <AddPhotoAlternateIcon sx={{ mr: 1, color: theme.palette.success.main }} />
                    <Typography variant="h6" sx={{ fontWeight: 600 }}>
                      Agregar nuevas fotos
                    </Typography>
                  </Box>
                  
                  <Paper 
                    elevation={0} 
                    sx={{ 
                      p: 3, 
                      backgroundColor: theme.palette.grey[50],
                      borderRadius: 2,
                      border: `1px solid ${theme.palette.grey[200]}`
                    }}
                  >
                    <input
                      accept="image/*"
                      style={{ display: 'none' }}
                      id="photo-upload"
                      multiple
                      type="file"
                      onChange={handlePhotoUpload}
                    />
                    <label htmlFor="photo-upload">
                      <Button
                        variant="outlined"
                        component="span"
                        startIcon={<AddPhotoAlternateIcon />}
                        sx={{ 
                          mb: 3,
                          borderRadius: 2,
                          borderWidth: 2,
                          '&:hover': {
                            borderWidth: 2,
                            transform: 'translateY(-2px)'
                          },
                          transition: 'all 0.3s ease'
                        }}
                      >
                        Seleccionar fotos
                      </Button>
                    </label>

                    {/* Preview de nuevas fotos */}
                    {newPhotos.length > 0 && (
                      <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                        {newPhotos.map((photo, index) => (
                          <Box key={index} sx={{ position: 'relative' }}>
                            <Avatar
                              src={URL.createObjectURL(photo)}
                              sx={{ 
                                width: 100, 
                                height: 100,
                                border: `3px solid ${theme.palette.success.main}`
                              }}
                            />
                            <IconButton
                              size="small"
                              sx={{
                                position: 'absolute',
                                top: -8,
                                right: -8,
                                backgroundColor: theme.palette.error.main,
                                color: 'white',
                                '&:hover': { 
                                  backgroundColor: theme.palette.error.dark,
                                  transform: 'scale(1.1)'
                                },
                                transition: 'all 0.2s ease'
                              }}
                              onClick={() => removePhoto(index)}
                            >
                              <DeleteIcon fontSize="small" />
                            </IconButton>
                          </Box>
                        ))}
                      </Box>
                    )}
                  </Paper>
                </Box>
              </Grid>
            </Grid>
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <Box sx={{ 
          display: 'flex', 
          gap: 2, 
          flexWrap: 'wrap', 
          justifyContent: 'center', 
          mb: 4 
        }}>
          <Button 
            variant="outlined" 
            startIcon={<CancelIcon />}
            onClick={() => navigate('/')}
            sx={{ 
              minWidth: 140,
              py: 1.5,
              borderRadius: 3,
              borderWidth: 2,
              color: 'white',
              borderColor: 'white',
              '&:hover': {
                borderWidth: 2,
                backgroundColor: 'rgba(255,255,255,0.1)',
                transform: 'translateY(-2px)'
              },
              transition: 'all 0.3s ease'
            }}
          >
            Cancelar
          </Button>
          
          <Button 
            variant="contained" 
            startIcon={isSaving ? <CircularProgress size={20} /> : <SaveIcon />}
            onClick={handleSave}
            disabled={isSaving}
            sx={{ 
              minWidth: 140,
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
            {isSaving ? 'Guardando...' : 'Guardar'}
          </Button>
        </Box>

        {/* Back Button */}
        <Box sx={{ textAlign: 'center' }}>
          <Button 
            variant="text" 
            color="inherit"
            startIcon={<ArrowBackIcon />}
            onClick={() => navigate('/')}
            sx={{ 
              color: 'white',
              '&:hover': {
                backgroundColor: 'rgba(255,255,255,0.1)'
              }
            }}
          >
            Volver al perfil
          </Button>
        </Box>
      </Container>

      {/* Snackbar para mensajes */}
      <Snackbar
        open={showSuccess}
        autoHideDuration={3000}
        onClose={() => setShowSuccess(false)}
      >
        <Alert severity="success" sx={{ width: '100%' }}>
          Perfil actualizado exitosamente
        </Alert>
      </Snackbar>

      <Snackbar
        open={!!error}
        autoHideDuration={5000}
        onClose={() => setError(null)}
      >
        <Alert severity="error" sx={{ width: '100%' }}>
          {error}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default EditProfile;
