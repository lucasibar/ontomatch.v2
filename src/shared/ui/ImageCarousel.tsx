import React, { useState, useEffect } from 'react';
import { 
  Box, 
  IconButton, 
  Paper, 
  Typography,
  useTheme,
  useMediaQuery
} from '@mui/material';
import { 
  ChevronLeft, 
  ChevronRight,
  Circle,
  CircleOutlined
} from '@mui/icons-material';

interface ImageCarouselProps {
  images: string[];
  height?: number | string;
  showIndicators?: boolean;
  showArrows?: boolean;
  autoPlay?: boolean;
  autoPlayInterval?: number;
  objectFit?: 'cover' | 'contain';
  backgroundColor?: string;
}

const ImageCarousel: React.FC<ImageCarouselProps> = ({
  images,
  height = 400,
  showIndicators = true,
  showArrows = true,
  autoPlay = false,
  autoPlayInterval = 3000,
  objectFit = 'contain',
  backgroundColor = '#000000'
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  // Auto-play functionality
  useEffect(() => {
    if (!autoPlay || images.length <= 1) return;

    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % images.length);
    }, autoPlayInterval);

    return () => clearInterval(interval);
  }, [autoPlay, autoPlayInterval, images.length]);

  const nextImage = () => {
    setCurrentIndex((prev) => (prev + 1) % images.length);
  };

  const prevImage = () => {
    setCurrentIndex((prev) => (prev - 1 + images.length) % images.length);
  };

  const goToImage = (index: number) => {
    setCurrentIndex(index);
  };

  if (!images || images.length === 0) {
    return (
      <Paper
        elevation={3}
        sx={{
          height,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: theme.palette.grey[100],
          borderRadius: 3,
          overflow: 'hidden'
        }}
      >
        <Typography variant="body2" color="text.secondary">
          No hay imágenes disponibles
        </Typography>
      </Paper>
    );
  }

  return (
    <Box sx={{ position: 'relative', width: '100%' }}>
      {/* Main Image Container */}
             <Paper
         elevation={3}
         sx={{
           height,
           borderRadius: 3,
           overflow: 'hidden',
           position: 'relative',
           backgroundColor: theme.palette.grey[100],
           border: `1px solid ${theme.palette.divider}`
         }}
       >
                 {/* Image */}
         <Box
           component="img"
           src={images[currentIndex]}
           alt={`Imagen ${currentIndex + 1}`}
           sx={{
             width: '100%',
             height: '100%',
             objectFit: objectFit,
             backgroundColor: backgroundColor,
             transition: 'transform 0.3s ease-in-out',
             '&:hover': {
               transform: 'scale(1.02)'
             }
           }}
           onError={(e) => {
             const target = e.target as HTMLImageElement;
             target.src = '/default-avatar.png';
           }}
         />

        {/* Image Counter */}
        <Box
          sx={{
            position: 'absolute',
            top: 16,
            right: 16,
            backgroundColor: 'rgba(0, 0, 0, 0.6)',
            color: 'white',
            padding: '4px 12px',
            borderRadius: 2,
            fontSize: '0.875rem',
            fontWeight: 500
          }}
        >
          {currentIndex + 1} / {images.length}
        </Box>

        {/* Navigation Arrows */}
        {showArrows && images.length > 1 && (
          <>
            <IconButton
              onClick={prevImage}
              sx={{
                position: 'absolute',
                left: 16,
                top: '50%',
                transform: 'translateY(-50%)',
                backgroundColor: 'rgba(255, 255, 255, 0.9)',
                color: theme.palette.text.primary,
                '&:hover': {
                  backgroundColor: 'rgba(255, 255, 255, 1)',
                  transform: 'translateY(-50%) scale(1.1)'
                },
                transition: 'all 0.2s ease-in-out'
              }}
              size={isMobile ? 'small' : 'medium'}
            >
              <ChevronLeft />
            </IconButton>

            <IconButton
              onClick={nextImage}
              sx={{
                position: 'absolute',
                right: 16,
                top: '50%',
                transform: 'translateY(-50%)',
                backgroundColor: 'rgba(255, 255, 255, 0.9)',
                color: theme.palette.text.primary,
                '&:hover': {
                  backgroundColor: 'rgba(255, 255, 255, 1)',
                  transform: 'translateY(-50%) scale(1.1)'
                },
                transition: 'all 0.2s ease-in-out'
              }}
              size={isMobile ? 'small' : 'medium'}
            >
              <ChevronRight />
            </IconButton>
          </>
        )}
      </Paper>

      {/* Indicators */}
      {showIndicators && images.length > 1 && (
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'center',
            gap: 1,
            mt: 2
          }}
        >
          {images.map((_, index) => (
            <IconButton
              key={index}
              onClick={() => goToImage(index)}
              sx={{
                padding: 0,
                color: index === currentIndex 
                  ? theme.palette.primary.main 
                  : theme.palette.grey[400],
                '&:hover': {
                  color: theme.palette.primary.main,
                  transform: 'scale(1.2)'
                },
                transition: 'all 0.2s ease-in-out'
              }}
              size="small"
            >
              {index === currentIndex ? <Circle /> : <CircleOutlined />}
            </IconButton>
          ))}
        </Box>
      )}
    </Box>
  );
};

export default ImageCarousel;
