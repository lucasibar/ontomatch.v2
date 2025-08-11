import React, { useState, useEffect } from 'react';
import { Box, Button, TextField, Typography, FormControl, InputLabel, Select, MenuItem, Avatar, IconButton, Chip, FormHelperText } from '@mui/material';
import { Delete as DeleteIcon } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { completeProfile, getSchools } from './authApi';
import { setProfileComplete } from './authSlice';
import ErrorMessage from '../../shared/ui/ErrorMessage';
import { School } from '../../entities';
import { RootState } from '../../app/store';

const RegisterForm = () => {
  const [nombreCompleto, setNombreCompleto] = useState('');
  const [photos, setPhotos] = useState<File[]>([]);
  const [photoPreviews, setPhotoPreviews] = useState<string[]>([]);
  const [descripcion, setDescripcion] = useState('');
  const [busca, setBusca] = useState<('pareja' | 'amistad' | 'negocios')[]>([]);
  const [escuelaId, setEscuelaId] = useState<string>('');
  const [schools, setSchools] = useState<School[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const user = useSelector((state: RootState) => state.auth.user);

  // Cargar escuelas al montar el componente
  useEffect(() => {
    const loadSchools = async () => {
      try {
        const schoolsData = await getSchools();
        setSchools(schoolsData);
      } catch (err: any) {
        setError('Error al cargar las escuelas');
      }
    };
    loadSchools();
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validar tipo de archivo
    if (!file.type.startsWith('image/')) {
      setError('Por favor selecciona una imagen válida');
      return;
    }

    // Validar tamaño (máximo 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError('La imagen debe ser menor a 5MB');
      return;
    }

    // Validar límite de fotos (máximo 5)
    if (photos.length >= 5) {
      setError('Ya tienes el máximo de fotos permitidas');
      return;
    }

    // Agregar archivo a la lista
    setPhotos([...photos, file]);

    // Crear preview
    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result as string;
      setPhotoPreviews([...photoPreviews, result]);
    };
    reader.readAsDataURL(file);
  };

  const handleRemovePhoto = (index: number) => {
    setPhotos(photos.filter((_, i) => i !== index));
    setPhotoPreviews(photoPreviews.filter((_, i) => i !== index));
  };

  const handleBuscaChange = (value: 'pareja' | 'amistad' | 'negocios') => {
    if (busca.includes(value)) {
      setBusca(busca.filter(item => item !== value));
    } else if (busca.length < 3) {
      setBusca([...busca, value]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);
    
    if (!user) {
      setError('No hay usuario autenticado');
      setIsLoading(false);
      return;
    }
    
    // Validaciones
    if (!nombreCompleto.trim()) {
      setError('El nombre completo es obligatorio');
      setIsLoading(false);
      return;
    }

    if (busca.length === 0) {
      setError('Debes seleccionar al menos una opción de búsqueda');
      setIsLoading(false);
      return;
    }

    if (photos.length === 0) {
      setError('Debes subir al menos una foto');
      setIsLoading(false);
      return;
    }

    try {
      await dispatch(completeProfile({ 
        nombre_completo: nombreCompleto.trim(),
        busca,
        descripcion: descripcion.trim() || undefined,
        escuela_id: escuelaId || undefined,
        photos
      })).unwrap();
      
      dispatch(setProfileComplete(true));
      navigate('/');
    } catch (err: any) {
      setError(err.message || 'Error al completar el perfil. Verifica los datos ingresados.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Box component="form" onSubmit={handleSubmit} sx={{ maxWidth: 500, mx: 'auto', mt: 4 }}>
      <Typography variant="h4" component="h1" gutterBottom align="center">
        Registro
      </Typography>
      
      {error && <ErrorMessage message={error} />}
      
      <TextField 
        fullWidth 
        margin="normal" 
        label="Nombre completo *" 
        value={nombreCompleto} 
        onChange={e => setNombreCompleto(e.target.value)} 
        required
        disabled={isLoading}
      />

      
      {/* Fotos */}
      <Box sx={{ mt: 3, mb: 2 }}>
        <Typography variant="h6" gutterBottom>
          Fotos *
        </Typography>
        <Typography variant="body2" color="text.secondary" gutterBottom>
          Puedes agregar entre 1 y 5 fotos
        </Typography>
        
                 <input
           accept="image/*"
           style={{ display: 'none' }}
           id="photos-input"
           type="file"
           onChange={(e) => handleFileChange(e)}
           disabled={isLoading || (photos.length >= 5)}
         />
        <label htmlFor="photos-input">
          <Button 
            variant="outlined" 
            component="span" 
            fullWidth 
            disabled={isLoading || (photos.length >= 5)}
            sx={{ mb: 2 }}
          >
            {photos.length >= 5 ? 'Máximo de fotos alcanzado' : 'Agregar foto'}
          </Button>
        </label>

        {/* Mostrar todas las fotos */}
        {(photoPreviews.length > 0) && (
          <Box sx={{ mt: 2, display: 'flex', gap: 2, flexWrap: 'wrap' }}>
            {photoPreviews.map((photo, index) => (
              <Box key={index} sx={{ position: 'relative' }}>
                <Avatar
                  src={photo}
                  alt={`Foto ${index + 1}`}
                  sx={{ width: 60, height: 60 }}
                />
                <IconButton
                  size="small"
                  sx={{
                    position: 'absolute',
                    top: -8,
                    right: -8,
                    bgcolor: 'error.main',
                    color: 'white',
                    '&:hover': { bgcolor: 'error.dark' }
                  }}
                  onClick={() => handleRemovePhoto(index)}
                  disabled={isLoading}
                >
                  <DeleteIcon fontSize="small" />
                </IconButton>
              </Box>
            ))}
          </Box>
        )}
      </Box>
      
      {/* ¿Qué buscas? */}
      <Box sx={{ mt: 3, mb: 2 }}>
        <Typography variant="h6" gutterBottom>
          ¿Qué buscas? *
        </Typography>
        <Typography variant="body2" color="text.secondary" gutterBottom>
          Selecciona entre 1 y 3 opciones
        </Typography>
        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
          {(['pareja', 'amistad', 'negocios'] as const).map((option) => (
            <Chip
              key={option}
              label={option.charAt(0).toUpperCase() + option.slice(1)}
              onClick={() => handleBuscaChange(option)}
              color={busca.includes(option) ? 'primary' : 'default'}
              variant={busca.includes(option) ? 'filled' : 'outlined'}
              disabled={isLoading}
              sx={{ cursor: 'pointer' }}
            />
          ))}
        </Box>
        {busca.length > 0 && (
          <FormHelperText>
            Seleccionado: {busca.join(', ')}
          </FormHelperText>
        )}
      </Box>

      <TextField 
        fullWidth 
        margin="normal" 
        label="Descripción personal" 
        multiline
        rows={3}
        value={descripcion} 
        onChange={e => setDescripcion(e.target.value)} 
        placeholder="Cuéntanos sobre ti..."
        disabled={isLoading}
        helperText="Opcional"
      />

      <FormControl fullWidth margin="normal" disabled={isLoading}>
        <InputLabel>Escuela de certificación</InputLabel>
        <Select
          value={escuelaId}
          label="Escuela de certificación"
          onChange={e => setEscuelaId(e.target.value)}
        >
          <MenuItem value="">
            <em>No especificar</em>
          </MenuItem>
          {schools.map((school) => (
            <MenuItem key={school.id} value={school.id}>
              {school.nombre}
            </MenuItem>
          ))}
        </Select>
      </FormControl>
      
      <Button type="submit" variant="contained" fullWidth disabled={isLoading} sx={{ mt: 3 }}>
        {isLoading ? 'Registrando...' : 'Registrarse'}
      </Button>

      
    </Box>
  );
};

export default RegisterForm;
