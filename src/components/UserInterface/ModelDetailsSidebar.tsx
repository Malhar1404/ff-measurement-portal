import {
  Collections,
  EditLocationAlt,
} from '@mui/icons-material';
import {
  Box,
  Chip,
  Paper,
  Tab,
  Tabs,
  Typography,
} from '@mui/material';
import { observer } from 'mobx-react-lite';
import { SyntheticEvent, useMemo, useState } from 'react';

import { useMainContext } from '../../hooks/useMainContext';

type SidebarTab = 'landmarks' | 'images';
type LandmarkCoordinate = 'x' | 'y' | 'z';

const IMAGE_SLOTS = [
  { key: 'front', label: 'Front View' },
  { key: 'back', label: 'Back View' },
  { key: 'left', label: 'Left View' },
  { key: 'right', label: 'Right View' },
] as const;

export const ModelDetailsSidebar = observer(() => {
  const { meshesManager } = useMainContext();
  const selectedModel = meshesManager.selectedModel;

  const [activeTab, setActiveTab] = useState<SidebarTab>('landmarks');

  const landmarkRows = useMemo(() => {
    const meshLandmarks = selectedModel?.landmarks['Mesh landmarks'] || [];

    return [
      { key: 'chest_landmark', label: 'Chest' },
      { key: 'narrow_waist_landmark', label: 'Waist' },
      { key: 'hip_landmark', label: 'Hip' },
    ].map(({ key, label }) => ({
      label,
      landmark: meshLandmarks.find((item) => item.name === key),
    }));
  }, [selectedModel]);

  const handleTabChange = (_event: SyntheticEvent, value: SidebarTab) => {
    setActiveTab(value);
  };

  const formatCoordinate = (value?: number) =>
    typeof value === 'number' ? value.toFixed(2) : '--';

  return (
    <Box
      sx={{
        height: '80vh',
        position: 'absolute',
        right: 0,
        top: '50%',
        transform: 'translateY(-50%)',
        width: 360,
        zIndex: 1000,
      }}>
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
              label={activeTab === 'landmarks' ? landmarkRows.length : IMAGE_SLOTS.length}
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
              {activeTab === 'landmarks'
                ? 'Showing selected model landmark values.'
                : 'UI-only image placeholders for now.'}
            </Typography>
          </Box>

          {activeTab === 'landmarks' ? (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
              {landmarkRows.map(({ label, landmark }) => (
                <Box
                  key={label}
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
                    {label}
                  </Typography>

                  <Box sx={{ display: 'grid', gap: 1, gridTemplateColumns: 'repeat(3, 1fr)' }}>
                    {(['x', 'y', 'z'] as LandmarkCoordinate[]).map((coordinate) => (
                      <Box
                        key={coordinate}
                        sx={{
                          backgroundColor: '#f8f9fa',
                          borderRadius: 1.5,
                          px: 1,
                          py: 1,
                        }}>
                        <Typography
                          sx={{ color: '#6b7280', fontSize: '0.72rem' }}
                          variant="caption">
                          {coordinate.toUpperCase()}
                        </Typography>
                        <Typography
                          sx={{ color: '#1f2937', fontSize: '0.86rem', fontWeight: 600 }}
                          variant="body2">
                          {formatCoordinate(landmark?.position[coordinate])}
                        </Typography>
                      </Box>
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
