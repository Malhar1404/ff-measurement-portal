import { Backdrop, Box, CircularProgress, CssBaseline, Stack, Typography, IconButton } from '@mui/material';
import { Theme } from '@mui/material/styles';
import { Close } from '@mui/icons-material';
import { observer } from 'mobx-react-lite';
import { useEffect, useRef, useState } from 'react';
import { APP_CONFIG } from '../../config/appConfig';
import { fetchAllModelDetails } from '../../services/modelService';
import { useMainContext } from '../../hooks/useMainContext';
import { Viewer3D } from '../Viewer3D/Viewer3D';
import { FileUpload } from './FileUpload';
import { ModelDetailsSidebar } from './ModelDetailsSidebar';
import { Sidebar } from './Sidebar';

export const UiComp = observer(() => {
  const { meshesManager, viewManager } = useMainContext();
  const [upload3DModalOpen, setUpload3DModalOpen] = useState(false);
  const [uploadImagesModalOpen, setUploadImagesModalOpen] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState('Initializing Virtual Fitting...');

  const initialLoadDone = useRef(false);

  // 🔥 Auto-load models from config on mount
  useEffect(() => {
    if (initialLoadDone.current) return;
    initialLoadDone.current = true;

    const loadInitialModels = async () => {
      viewManager.setIsInitialLoading(true);

      try {
        setLoadingMessage('Fetching models from database...');
        const apiModels = await fetchAllModelDetails();

        setLoadingMessage('Loading 3D Model Geometries and Landmarks...');
        for (const apiModel of apiModels) {
          try {
            await meshesManager.addApiModel(apiModel);
          } catch (error) {
            console.error(`Failed to load API model: ${apiModel.model_name}`, error);
          }
        }
      } catch (error) {
        console.error('Failed to fetch models from API', error);
      }

      // ─── LOCAL FALLBACK ────────────────────────────────────────────────────────
      // This is currently disabled to test the API directly.
      // Uncomment or use if API fails or returns no models.
      /*
      const categories = APP_CONFIG.initialModels;

      // Stage 1: Load Models
      setLoadingMessage('Loading 3D Model Geometries...');
      for (const path of categories.adults) {
        try {
          const fileName = path.split('/').pop()?.split('\\').pop() || 'Adult Model';
          await meshesManager.addGLBUrl(path, fileName, 'adult', false);
        } catch (error) {
          console.error(`Failed to auto-load adult model: ${path}`, error);
        }
      }

      for (const path of categories.kids) {
        try {
          const fileName = path.split('/').pop()?.split('\\').pop() || 'Kid Model';
          await meshesManager.addGLBUrl(path, fileName, 'kid', false);
        } catch (error) {
          console.error(`Failed to auto-load kid model: ${path}`, error);
        }
      }

      // Stage 2: Load Landmarks
      setLoadingMessage('Processing Landmark Cache & Raycasting...');
      await meshesManager.loadAllStaticLandmarks();
      */
      
      viewManager.setIsInitialLoading(false);
    };

    loadInitialModels();
  }, [meshesManager, viewManager]);

  // const handleUploadImages = () => {
  //   setUploadImagesModalOpen(true);
  // };

  // const handleGenerateCSV = () => {
  //   setOpenGenerateCSV(true);
  // };

  return (
    <Box sx={{ height: '100vh', width: '100vw', overflow: 'hidden' }}>
      <CssBaseline />

      {/* Main Content Area */}
      <Box
        sx={{
          backgroundColor: '#f8f9fa',
          display: 'flex',
          flexDirection: 'column',
          height: '100%',
          position: 'relative',
          overflow: 'hidden',
          width: '100%',
        }}>

        {viewManager.comparisonImage ? (
          <Box sx={{ display: 'flex', flex: 1, width: '100%', height: '100%', position: 'relative', overflow: 'hidden' }}>
            <Box sx={{ flex: 1, position: 'relative', borderRight: '1px solid #333', height: '100%', overflow: 'hidden' }}>
              <Viewer3D />
            </Box>

            <Box sx={{ flex: 1, backgroundColor: '#000', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', height: '100%', overflow: 'hidden' }}>
              <img
                src={viewManager.comparisonImage}
                alt="Comparison"
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'contain',
                }}
              />

              {/* Thumbnails Section */}
              <Box
                sx={{
                  position: 'absolute',
                  right: 16,
                  top: '50%',
                  transform: 'translateY(-50%)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 2,
                  zIndex: 10,
                  backgroundColor: 'rgba(0, 0, 0, 0.5)',
                  padding: 1,
                  borderRadius: 2,
                }}
              >
                {meshesManager.selectedModel?.images.map((imgUrl, index) => (
                  <Box
                    key={`thumb-${imgUrl}-${index}`}
                    onClick={() => viewManager.setComparisonImage(imgUrl)}
                    sx={{
                      width: 64,
                      height: 80,
                      borderRadius: 1,
                      overflow: 'hidden',
                      cursor: 'pointer',
                      border: viewManager.comparisonImage === imgUrl ? '2px solid #6df0ff' : '2px solid transparent',
                      opacity: viewManager.comparisonImage === imgUrl ? 1 : 0.6,
                      transition: 'all 0.2s',
                      boxShadow: '0 2px 8px rgba(0,0,0,0.5)',
                      '&:hover': {
                        opacity: 1,
                        transform: 'scale(1.05)',
                        border: '2px solid rgba(109, 240, 255, 0.7)',
                      }
                    }}
                  >
                    <img
                      src={imgUrl}
                      alt={`Thumbnail ${index + 1}`}
                      style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                    />
                  </Box>
                ))}
              </Box>
            </Box>

            <IconButton
              onClick={() => viewManager.setComparisonImage(null)}
              sx={{
                position: 'fixed',
                top: 16,
                right: 16,
                backgroundColor: 'rgba(255, 255, 255, 0.9)',
                color: '#333',
                zIndex: 9999,
                boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                '&:hover': {
                  backgroundColor: '#fff',
                  transform: 'scale(1.05)',
                },
              }}
            >
              <Close />
            </IconButton>
          </Box>
        ) : (
          <>
            {/* 3D Viewer Area */}
            <Box
              sx={{
                flex: 1,
                m: 0, // Fill entire space
                overflow: 'hidden',
                position: 'relative',
              }}>
              <Viewer3D />

              {/* Left-side assets panel */}
              <Sidebar />
            </Box>

            {/* Right-side model details panel */}
            <ModelDetailsSidebar />
          </>
        )}
      </Box>



      <FileUpload
        open={upload3DModalOpen}
        onClose={() => setUpload3DModalOpen(false)}
        title="Upload 3D Model"
        accept=".glb,.gltf"
      />

      <FileUpload
        open={uploadImagesModalOpen}
        onClose={() => setUploadImagesModalOpen(false)}
        title="Upload Images"
        accept=".jpg,.jpeg,.png,.gif,.bmp,.webp"
      />

      {/* Global Initial Loading Overlay */}
      <Backdrop
        sx={{
          color: '#fff',
          zIndex: (theme: Theme) => theme.zIndex.drawer + 2000,
          backgroundColor: 'rgba(0, 0, 0, 0.85)',
          display: 'flex',
          flexDirection: 'column',
          gap: 2
        }}
        open={viewManager.isInitialLoading}
      >
        <CircularProgress color="inherit" size={60} thickness={4} />
        <Stack spacing={0.5} alignItems="center">
          <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
            Initializing Virtual Fitting
          </Typography>
          <Typography variant="body2" sx={{ opacity: 0.8 }}>
            {loadingMessage}
          </Typography>
        </Stack>
      </Backdrop>
    </Box>
  );
});
