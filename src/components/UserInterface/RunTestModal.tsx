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

import { useMainContext } from '../../hooks/useMainContext';

interface RunTestModalProps {
  open: boolean;
  onClose: () => void;
}

export const RunTestModal = observer(({ open, onClose }: RunTestModalProps) => {
  const [selectedTest, setSelectedTest] = useState<
    'landmark' | 'measurement' | ''
  >('');
  const { meshesManager, viewManager } = useMainContext();

  const handleRunTest = async () => {
    if (selectedTest === 'landmark' && meshesManager.glbData.length > 0) {

      // 🔥 Filter: Process only selected model if one is selected, else all
      const modelsToProcess = meshesManager.selectedModelId
        ? meshesManager.glbData.filter(g => g.scene.uuid === meshesManager.selectedModelId)
        : meshesManager.glbData;

      // Iterate over target GLBs
      const promises = modelsToProcess.map(async (glbData) => {
        try {
          // Convert blob URL back to File object for API call
          const response = await fetch(glbData.blobUrl);
          const blob = await response.blob();
          const file = new File([blob], glbData.fileName || 'model.glb', {
            type: 'model/gltf-binary',
          });

          const targetUuid = glbData.scene.uuid;

          // Call the API with the actual GLB file and UUID
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
      // 🔥 Filter: Process only selected model if one is selected, else all
      const modelsToProcess = meshesManager.selectedModelId
        ? meshesManager.glbData.filter(g => g.scene.uuid === meshesManager.selectedModelId)
        : meshesManager.glbData;

      const promises = modelsToProcess.map(async (glbData) => {
        try {
          // Convert blob URL back to File object for API call
          const response = await fetch(glbData.blobUrl);
          const blob = await response.blob();
          const file = new File([blob], glbData.fileName || 'model.glb', {
            type: 'model/gltf-binary',
          });

          const targetId = glbData.scene.uuid;
          const model = meshesManager.modelsList.find(m => m.id === targetId);

          // Call the measurement API with GLB file and landmark JSON
          // 🔥 We use the selected landmark response for the target model
          const landmarkJson = model?.landmarkResponse;

          await measurementMutation.mutateAsync({
            glbFile: file,
            landmarkJson: landmarkJson,
            targetId: targetId
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
      }}>
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
              onChange={(e) =>
                setSelectedTest(e.target.value as 'landmark' | 'measurement')
              }>
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
                    <Typography component="span">
                      Measurement Computation
                    </Typography>
                    {!meshesManager.hasLandmarkData && (
                      <Typography
                        variant="caption"
                        sx={{
                          color: 'text.secondary',
                          display: 'block',
                          fontStyle: 'italic',
                        }}>
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
          }}>
          {landmarkMutation.isPending || measurementMutation.isPending
            ? 'Processing...'
            : 'Run Test'}
        </Button>
      </DialogActions>
    </Dialog>
  );
});
