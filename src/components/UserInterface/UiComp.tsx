import { PlayArrow } from '@mui/icons-material';
import { Backdrop, Box, Button, CircularProgress, CssBaseline, Stack, Typography } from '@mui/material';
import { observer } from 'mobx-react-lite';
import { useState } from 'react';

import { useEffect, useRef } from 'react';
import { APP_CONFIG } from '../../config/appConfig';
import { useMainContext } from '../../hooks/useMainContext';
import { Viewer3D } from '../Viewer3D/Viewer3D';
import { FileUpload } from './FileUpload';
import { GenerateCSVDialog } from './GenerateCSVDialog';
import { ModelDetailsSidebar } from './ModelDetailsSidebar';
import { RunTestModal } from './RunTestModal';
import { Sidebar } from './Sidebar';

export const UiComp = observer(() => {
  const { meshesManager, viewManager } = useMainContext();
  const [runTestModalOpen, setRunTestModalOpen] = useState(false);
  const [upload3DModalOpen, setUpload3DModalOpen] = useState(false);
  const [uploadImagesModalOpen, setUploadImagesModalOpen] = useState(false);
  const [openGenerateCSV, setOpenGenerateCSV] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState('Initializing Virtual Fitting...');

  const initialLoadDone = useRef(false);

  // 🔥 Auto-load models from config on mount
  useEffect(() => {
    if (initialLoadDone.current) return;
    initialLoadDone.current = true;

    const loadInitialModels = async () => {
        viewManager.setIsInitialLoading(true);
        
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

        viewManager.setIsInitialLoading(false);
    };

    loadInitialModels();
  }, [meshesManager]);

  const handleUploadImages = () => {
    setUploadImagesModalOpen(true);
  };

  const handleRunTest = () => {
    setRunTestModalOpen(true);
  };

  const handleGenerateCSV = () => {
    setOpenGenerateCSV(true);
  };

  return (
    <Box sx={{ display: 'flex', height: '100vh', width: '100vw', overflow: 'hidden' }}>
      <CssBaseline />

      {/* Sidebar */}
      <Sidebar
        onUploadImages={handleUploadImages}
        onGenerateCSV={handleGenerateCSV}
      />

      {/* Main Content Area */}
      <Box
        sx={{
          backgroundColor: '#f8f9fa',
          display: 'flex',
          flex: 1,
          flexDirection: 'column',
          position: 'relative',
          overflow: 'hidden'
        }}>
        
        {/* Run Test Button - Floating on the right */}
        <Button
          variant="contained"
          startIcon={<PlayArrow />}
          onClick={handleRunTest}
          sx={{
            position: 'absolute',
            top: 20,
            right: 20, // Offset to stay clear of the logger when open
            zIndex: 1100,
            '&:hover': {
              backgroundColor: '#43a047',
              transform: 'scale(1.05)',
            },
            backgroundColor: '#4caf50',
            borderRadius: 2,
            boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
            fontWeight: 'bold',
            px: 3,
            py: 1.5,
            transition: 'all 0.2s ease',
          }}>
          Run Test
        </Button>

        {/* 3D Viewer Area */}
        <Box
          sx={{
            flex: 1,
            m: 0, // Fill entire space
            overflow: 'hidden',
            position: 'relative',
          }}>
          <Viewer3D />
        </Box>

        {/* Right-side model details panel */}
        <ModelDetailsSidebar />
      </Box>

      {/* Modals */}
      <RunTestModal
        open={runTestModalOpen}
        onClose={() => setRunTestModalOpen(false)}
      />

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

      <GenerateCSVDialog
        open={openGenerateCSV}
        onClose={() => setOpenGenerateCSV(false)}
      />

      {/* Global Initial Loading Overlay */}
      <Backdrop
        sx={{ 
            color: '#fff', 
            zIndex: (theme) => theme.zIndex.drawer + 2000,
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
