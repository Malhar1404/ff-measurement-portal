import { Close } from '@mui/icons-material';
import { Backdrop, Box, CircularProgress, CssBaseline, IconButton, Stack, Typography } from '@mui/material';
import { Theme } from '@mui/material/styles';
import { observer } from 'mobx-react-lite';
import { useEffect, useRef, useState } from 'react';

import { fetchAllModelDetails } from '../../services/modelService';
import { useMainContext } from '../../hooks/useMainContext';
import { FileUpload } from './FileUpload';
import { ModelDetailsSidebar } from './ModelDetailsSidebar';
import { Sidebar } from './Sidebar';
import { Viewer3D } from '../Viewer3D/Viewer3D';

export const UiComp = observer(() => {
  const { meshesManager, viewManager } = useMainContext();
  const [upload3DModalOpen, setUpload3DModalOpen] = useState(false);
  const [uploadImagesModalOpen, setUploadImagesModalOpen] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState('Initializing Virtual Fitting...');

  const initialLoadDone = useRef(false);

  // Auto-load models from backend on mount.
  useEffect(() => {
    if (initialLoadDone.current) return;
    initialLoadDone.current = true;

    const loadInitialModels = async () => {
      viewManager.setIsInitialLoading(true);

      try {
        setLoadingMessage('Fetching models from backend...');
        const apiModels = await fetchAllModelDetails();

        setLoadingMessage('Loading 3D model geometries and landmarks...');
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

      viewManager.setIsInitialLoading(false);
    };

    loadInitialModels();
  }, [meshesManager, viewManager]);

  return (
    <Box sx={{ height: '100vh', width: '100vw', overflow: 'hidden' }}>
      <CssBaseline />

      <Box
        sx={{
          backgroundColor: '#f8f9fa',
          display: 'flex',
          flexDirection: 'column',
          height: '100%',
          position: 'relative',
          overflow: 'hidden',
          width: '100%',
        }}
      >
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
                      },
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
        ) : viewManager.isInitialLoading ? null : (
          <>
            <Box
              sx={{
                flex: 1,
                m: 0,
                overflow: 'hidden',
                position: 'relative',
              }}
            >
              <Viewer3D />

              <Sidebar />
            </Box>

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

      <Backdrop
        sx={{
          color: '#fff',
          zIndex: (theme: Theme) => theme.zIndex.drawer + 2000,
          backgroundColor: 'rgba(0, 0, 0, 0.85)',
          display: 'flex',
          flexDirection: 'column',
          gap: 2,
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
