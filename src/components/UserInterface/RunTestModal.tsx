import { PlayArrow } from '@mui/icons-material';
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  FormControlLabel,
  FormLabel,
  Radio,
  RadioGroup,
  Typography,
} from '@mui/material';
import { observer } from 'mobx-react-lite';
import { useState } from 'react';

import { useLandmarkDetection } from '../../hooks/useLandmarkDetection';
import { useMainContext } from '../../hooks/useMainContext';
import { useMeasurementDetection } from '../../hooks/useMeasurementDetection';

interface RunTestModalProps {
  open: boolean;
  onClose: () => void;
}

export const RunTestModal = observer(({ open, onClose }: RunTestModalProps) => {
  const [selectedTest, setSelectedTest] = useState<'landmark' | 'measurement' | ''>('');
  const { meshesManager, viewManager } = useMainContext();
  const landmarkMutation = useLandmarkDetection(meshesManager, viewManager);
  const measurementMutation = useMeasurementDetection(meshesManager, viewManager);

  const handleRunTest = async () => {
    if (selectedTest === 'landmark' && meshesManager.glbData.length > 0) {
      const modelsToProcess = meshesManager.selectedModelId
        ? meshesManager.glbData.filter((g) => g.scene.uuid === meshesManager.selectedModelId)
        : meshesManager.glbData;

      const promises = modelsToProcess.map(async (glbData) => {
        try {
          const response = await fetch(glbData.blobUrl);
          const blob = await response.blob();
          const file = new File([blob], glbData.fileName || 'model.glb', {
            type: 'model/gltf-binary',
          });

          const targetUuid = glbData.scene.uuid;
          await landmarkMutation.mutateAsync({ file, targetMeshUuid: targetUuid });
        } catch (error) {
          console.error('Error preparing GLB for landmark detection:', error);
          viewManager.addLog(
            `Error preparing GLB file (${glbData.fileName}): ${error instanceof Error ? error.message : 'Unknown error'}`,
            'error',
          );
        }
      });

      await Promise.all(promises);
    }

    if (
      selectedTest === 'measurement' &&
      meshesManager.glbData.length > 0 &&
      meshesManager.hasLandmarkData
    ) {
      const modelsToProcess = meshesManager.selectedModelId
        ? meshesManager.glbData.filter((g) => g.scene.uuid === meshesManager.selectedModelId)
        : meshesManager.glbData;

      const promises = modelsToProcess.map(async (glbData) => {
        try {
          const response = await fetch(glbData.blobUrl);
          const blob = await response.blob();
          const file = new File([blob], glbData.fileName || 'model.glb', {
            type: 'model/gltf-binary',
          });

          const targetId = glbData.scene.uuid;
          const model = meshesManager.modelsList.find((m) => m.id === targetId);
          const landmarkJson = model?.landmarkResponse;

          await measurementMutation.mutateAsync({
            glbFile: file,
            landmarkJson,
            targetId,
          });
        } catch (error) {
          console.error('Error preparing files for measurement computation:', error);
          viewManager.addLog(
            `Error preparing files (${glbData.fileName}): ${error instanceof Error ? error.message : 'Unknown error'}`,
            'error',
          );
        }
      });

      await Promise.all(promises);
    }

    onClose();
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 2,
          boxShadow: 3,
        },
      }}
    >
      <DialogTitle>
        <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
          Run Test Configuration
        </Typography>
      </DialogTitle>
      <DialogContent>
        <Box sx={{ mt: 2 }}>
          <FormControl component="fieldset">
            <FormLabel component="legend" sx={{ fontWeight: 'bold', mb: 2 }}>
              Select the test you want to run:
            </FormLabel>
            <RadioGroup
              value={selectedTest}
              onChange={(e) => setSelectedTest(e.target.value as 'landmark' | 'measurement')}
            >
              <FormControlLabel
                value="landmark"
                control={<Radio color="primary" />}
                label="Landmark Detection"
                sx={{ mb: 1 }}
              />
              <FormControlLabel
                value="measurement"
                control={<Radio color="primary" />}
                label={
                  <Box>
                    <Typography component="span">Measurement Computation</Typography>
                    {!meshesManager.hasLandmarkData && (
                      <Typography
                        variant="caption"
                        sx={{
                          color: 'text.secondary',
                          display: 'block',
                          fontStyle: 'italic',
                        }}
                      >
                        (Requires landmark detection to be run first)
                      </Typography>
                    )}
                  </Box>
                }
                disabled={!meshesManager.hasLandmarkData}
                sx={{ mb: 1 }}
              />
            </RadioGroup>
          </FormControl>
        </Box>
      </DialogContent>
      <DialogActions sx={{ p: 2 }}>
        <Button onClick={onClose} color="inherit">
          Cancel
        </Button>
        <Button
          onClick={handleRunTest}
          variant="contained"
          startIcon={<PlayArrow />}
          disabled={
            !selectedTest ||
            landmarkMutation.isPending ||
            measurementMutation.isPending ||
            meshesManager.glbData.length === 0
          }
          sx={{
            '&:hover': { backgroundColor: '#1565c0' },
            backgroundColor: '#1976d2',
          }}
        >
          {landmarkMutation.isPending || measurementMutation.isPending ? 'Processing...' : 'Run Test'}
        </Button>
      </DialogActions>
    </Dialog>
  );
});
