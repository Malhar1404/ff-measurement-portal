import {
  ChevronRight,
  Collections,
  EditLocationAlt,
  Menu,
} from '@mui/icons-material';
import {
  Box,
  Chip,
  IconButton,
  Paper,
  Tab,
  Tabs,
  TextField,
  Typography,
} from '@mui/material';
import { observer } from 'mobx-react-lite';
import { SyntheticEvent, useEffect, useState } from 'react';

import { useMainContext } from '../../hooks/useMainContext';

type SidebarTab = 'landmarks' | 'images';
type LandmarkCoordinate = 'x' | 'y' | 'z';

type EditableLandmark = {
  id: string;
  name: string;
  position: Record<LandmarkCoordinate, number>;
};

const IMAGE_SLOTS = [
  { key: 'front', label: 'Front View' },
  { key: 'back', label: 'Back View' },
  { key: 'left', label: 'Left View' },
  { key: 'right', label: 'Right View' },
] as const;

const roundToTwoDecimals = (value: number) => Math.round(value * 100) / 100;

const createPlaceholderLandmarks = (modelName?: string): EditableLandmark[] => {
  const prefix = modelName?.split('.')[0] || 'Selected Model';

  return [
    {
      id: 'waist',
      name: `${prefix} Waist`,
      position: { x: 12.45, y: 85.2, z: -4.18 },
    },
    {
      id: 'hip',
      name: `${prefix} Hip`,
      position: { x: 15.32, y: 65.48, z: -2.91 },
    },
    {
      id: 'hem',
      name: `${prefix} Hem`,
      position: { x: 11.08, y: 22.76, z: -3.44 },
    },
  ];
};

export const ModelDetailsSidebar = observer(() => {
  const { meshesManager } = useMainContext();
  const selectedModel = meshesManager.selectedModel;

  const [isOpen, setIsOpen] = useState(true);
  const [activeTab, setActiveTab] = useState<SidebarTab>('landmarks');
  const [landmarks, setLandmarks] = useState<EditableLandmark[]>(() =>
    createPlaceholderLandmarks(),
  );

  useEffect(() => {
    setLandmarks(createPlaceholderLandmarks(selectedModel?.fileName));
  }, [selectedModel?.id, selectedModel?.fileName]);

  const handleTabChange = (_event: SyntheticEvent, value: SidebarTab) => {
    setActiveTab(value);
  };

  const handleCoordinateChange = (
    landmarkId: string,
    coordinate: LandmarkCoordinate,
    value: string,
  ) => {
    const parsed = Number(value);
    if (Number.isNaN(parsed)) {
      return;
    }

    setLandmarks((current) =>
      current.map((landmark) =>
        landmark.id === landmarkId
          ? {
              ...landmark,
              position: {
                ...landmark.position,
                [coordinate]: roundToTwoDecimals(parsed),
              },
            }
          : landmark,
      ),
    );
  };

  return (
    <Box
      sx={{
        height: '80vh',
        position: 'fixed',
        right: isOpen ? 420 : 20,
        top: '50%',
        transform: 'translateY(-50%)',
        transition: 'right 0.3s ease-in-out',
        width: 360,
        zIndex: 1000,
      }}>
      <IconButton
        onClick={() => setIsOpen((current) => !current)}
        sx={{
          '&:hover': {
            backgroundColor: '#1565c0',
            transform: 'translateY(-50%) scale(1.05)',
          },
          backgroundColor: '#1976d2',
          borderRadius: '8px 0 0 8px',
          boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
          color: 'white',
          height: 60,
          left: -40,
          position: 'absolute',
          top: '50%',
          transform: 'translateY(-50%)',
          transition: 'all 0.2s ease',
          width: 40,
        }}>
        {isOpen ? <ChevronRight /> : <Menu />}
      </IconButton>

      <Paper
        elevation={8}
        sx={{
          backgroundColor: '#ffffff',
          borderLeft: '4px solid #1976d2',
          borderRadius: '12px 0 0 12px',
          boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
          display: 'flex',
          flexDirection: 'column',
          height: '100%',
          overflow: 'hidden',
        }}>
        <Box
          sx={{
            alignItems: 'center',
            backgroundColor: '#f8f9fa',
            borderBottom: '2px solid #e0e0e0',
            display: 'flex',
            justifyContent: 'space-between',
            p: 2,
          }}>
          <Box sx={{ alignItems: 'center', display: 'flex', gap: 2 }}>
            <Typography
              variant="h6"
              sx={{
                color: '#2c3e50',
                fontSize: '1.1rem',
                fontWeight: 'bold',
              }}>
              Model Details
            </Typography>
            <Chip
              label={activeTab === 'landmarks' ? landmarks.length : IMAGE_SLOTS.length}
              size="small"
              sx={{
                backgroundColor: '#1976d2',
                color: 'white',
                fontSize: '0.8rem',
                fontWeight: 'bold',
                height: '24px',
                minWidth: '24px',
              }}
            />
          </Box>
          <IconButton
            onClick={() => setIsOpen(false)}
            size="small"
            sx={{
              '&:hover': {
                backgroundColor: '#e0e0e0',
              },
              color: '#666',
            }}>
            <ChevronRight />
          </IconButton>
        </Box>

        <Box sx={{ backgroundColor: '#fff', borderBottom: '1px solid #e0e0e0' }}>
          <Tabs
            value={activeTab}
            onChange={handleTabChange}
            variant="fullWidth"
            indicatorColor="primary"
            textColor="primary">
            <Tab
              icon={<EditLocationAlt fontSize="small" />}
              iconPosition="start"
              label="Landmarks"
              value="landmarks"
            />
            <Tab
              icon={<Collections fontSize="small" />}
              iconPosition="start"
              label="Images"
              value="images"
            />
          </Tabs>
        </Box>

        <Box
          sx={{
            display: 'flex',
            flex: 1,
            flexDirection: 'column',
            gap: 1.5,
            overflow: 'auto',
            p: 2,
          }}>
          <Box
            sx={{
              backgroundColor: '#f8f9fa',
              border: '1px solid #e3f2fd',
              borderRadius: 2,
              p: 1.5,
            }}>
            <Typography sx={{ color: '#2c3e50', fontWeight: 700 }} variant="body2">
              {selectedModel?.fileName || 'No model selected'}
            </Typography>
            <Typography sx={{ color: '#607d8b', mt: 0.5 }} variant="caption">
              UI-only panel with placeholder content for now.
            </Typography>
          </Box>

          {activeTab === 'landmarks' ? (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
              {landmarks.map((landmark) => (
                <Box
                  key={landmark.id}
                  sx={{
                    backgroundColor: '#ffffff',
                    border: '1px solid #e0e0e0',
                    borderRadius: 2,
                    boxShadow: '0 2px 8px rgba(15, 23, 42, 0.06)',
                    p: 1.5,
                  }}>
                  <Typography
                    sx={{ color: '#2c3e50', fontSize: '0.95rem', fontWeight: 700, mb: 1.25 }}
                    variant="body2">
                    {landmark.name}
                  </Typography>

                  <Box sx={{ display: 'grid', gap: 1, gridTemplateColumns: 'repeat(3, 1fr)' }}>
                    {(['x', 'y', 'z'] as LandmarkCoordinate[]).map((coordinate) => (
                      <TextField
                        key={coordinate}
                        label={coordinate.toUpperCase()}
                        size="small"
                        type="number"
                        value={landmark.position[coordinate].toFixed(2)}
                        onChange={(event) =>
                          handleCoordinateChange(
                            landmark.id,
                            coordinate,
                            event.target.value,
                          )
                        }
                        inputProps={{ step: '0.01' }}
                        sx={{
                          '& .MuiInputBase-root': {
                            backgroundColor: '#f8f9fa',
                          },
                        }}
                      />
                    ))}
                  </Box>
                </Box>
              ))}
            </Box>
          ) : (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
              {IMAGE_SLOTS.map((slot) => (
                <Box
                  key={slot.key}
                  sx={{
                    backgroundColor: '#ffffff',
                    border: '1px solid #e0e0e0',
                    borderRadius: 2,
                    boxShadow: '0 2px 8px rgba(15, 23, 42, 0.06)',
                    overflow: 'hidden',
                  }}>
                  <Box
                    sx={{
                      alignItems: 'center',
                      background:
                        'linear-gradient(135deg, rgba(25,118,210,0.12), rgba(33,150,243,0.04))',
                      borderBottom: '1px solid #e3f2fd',
                      display: 'flex',
                      justifyContent: 'space-between',
                      px: 1.5,
                      py: 1,
                    }}>
                    <Typography sx={{ color: '#2c3e50', fontWeight: 700 }} variant="body2">
                      {slot.label}
                    </Typography>
                    <Chip
                      label="Placeholder"
                      size="small"
                      sx={{
                        backgroundColor: '#e3f2fd',
                        color: '#1565c0',
                        fontWeight: 600,
                      }}
                    />
                  </Box>

                  <Box
                    sx={{
                      alignItems: 'center',
                      aspectRatio: '16 / 10',
                      background:
                        'repeating-linear-gradient(135deg, #f8f9fa, #f8f9fa 12px, #eef3f8 12px, #eef3f8 24px)',
                      color: '#607d8b',
                      display: 'flex',
                      justifyContent: 'center',
                      px: 2,
                    }}>
                    <Typography sx={{ textAlign: 'center' }} variant="body2">
                      Image preview area for {slot.label.toLowerCase()}
                    </Typography>
                  </Box>
                </Box>
              ))}
            </Box>
          )}
        </Box>
      </Paper>
    </Box>
  );
});
