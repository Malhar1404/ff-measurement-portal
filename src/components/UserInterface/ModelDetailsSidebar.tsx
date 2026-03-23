import { EditOutlined, SaveOutlined, Collections, EditLocationAlt } from '@mui/icons-material';
import {
  Box,
  Button,
  Dialog,
  Paper,
  Tab,
  Tabs,
  Typography,
} from '@mui/material';
import { observer } from 'mobx-react-lite';
import { SyntheticEvent, useState } from 'react';

import { useMainContext } from '../../hooks/useMainContext';

type SidebarTab = 'landmarks' | 'images';
type LandmarkCoordinate = 'x' | 'y' | 'z';

export const ModelDetailsSidebar = observer(() => {
  const { meshesManager } = useMainContext();
  const selectedModel = meshesManager.selectedModel;
  const meshLandmarks = selectedModel?.landmarks['Mesh landmarks'] || [];
  const modelImages = selectedModel?.images || [];

  const [activeTab, setActiveTab] = useState<SidebarTab>('landmarks');
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  const handleTabChange = (_event: SyntheticEvent, value: SidebarTab) => {
    setActiveTab(value);
  };

  const formatCoordinate = (value?: number) =>
    typeof value === 'number' ? value.toFixed(2) : '--';

  const formatLandmarkLabel = (name: string) =>
    name
      .replace(/_landmark$/i, '')
      .split('_')
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
      .join(' ');

  const handleEditLandmark = (landmarkName: string) => {
    selectedModel?.markMeshLandmarkEditing(landmarkName);
  };

  const handleSaveLandmark = (landmarkName: string) => {
    selectedModel?.markMeshLandmarkSaved(landmarkName);
  };

  return (
    <Box
      sx={{
        height: '80vh',
        position: 'absolute',
        right: 0,
        top: '50%',
        transform: 'translateY(-50%)',
        width: 320,
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
            p: 1.5,
          }}>
          <Box sx={{ alignItems: 'center', display: 'flex', gap: 1.25 }}>
            <Typography
              variant="h6"
              sx={{
                color: '#2c3e50',
                fontSize: '1rem',
                fontWeight: 'bold',
              }}>
              Model Details
            </Typography>
            
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
            gap: 1,
            overflow: 'auto',
            p: 1.5,
          }}>
          <Box
            sx={{
              backgroundColor: '#f8f9fa',
              border: '1px solid #e3f2fd',
              borderRadius: 2,
              p: 1.2,
            }}>
            <Typography sx={{ color: '#2c3e50', fontWeight: 700 }} variant="body2">
              {selectedModel?.fileName || 'No model selected'}
            </Typography>
          </Box>

          {activeTab === 'landmarks' ? (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              {meshLandmarks.length === 0 ? (
                <Box
                  sx={{
                    backgroundColor: '#ffffff',
                    border: '1px solid #e0e0e0',
                    borderRadius: 2,
                    p: 2,
                    textAlign: 'center',
                  }}>
                  <Typography color="text.secondary" variant="body2">
                    No mesh landmarks available
                  </Typography>
                </Box>
              ) : (
                meshLandmarks.map((landmark) => (
                <Box
                  key={landmark.name}
                  sx={{
                    backgroundColor: '#ffffff',
                    border: '1px solid #e0e0e0',
                    borderRadius: 2,
                    boxShadow: '0 2px 8px rgba(15, 23, 42, 0.06)',
                    p: 1.2,
                  }}>
                  <Box
                    sx={{
                      alignItems: 'center',
                      display: 'flex',
                      justifyContent: 'space-between',
                      gap: 0.75,
                      mb: 0.9,
                    }}>
                    <Typography
                      sx={{ color: '#2c3e50', fontSize: '0.88rem', fontWeight: 700 }}
                      variant="body2">
                      {formatLandmarkLabel(landmark.name)}
                    </Typography>

                    <Box
                      sx={{
                        display: 'flex',
                        gap: 0.6,
                        justifyContent: 'flex-end',
                      }}>
                      <Button
                        size="small"
                        variant="outlined"
                        onClick={() => handleEditLandmark(landmark.name)}
                        sx={{
                          borderRadius: 2,
                          fontSize: '0.7rem',
                          minWidth: 0,
                          px: 0.75,
                          py: 0.25,
                          textTransform: 'none',
                        }}>
                        <EditOutlined sx={{ fontSize: '0.95rem' }} />
                      </Button>
                      <Button
                        size="small"
                        variant="contained"
                        onClick={() => handleSaveLandmark(landmark.name)}
                        sx={{
                          borderRadius: 2,
                          boxShadow: 'none',
                          fontSize: '0.7rem',
                          minWidth: 0,
                          minHeight: 0,
                          px: 0.75,
                          py: 0.25,
                          textTransform: 'none',
                        }}>
                        <SaveOutlined sx={{ fontSize: '0.95rem' }} />
                      </Button>
                    </Box>
                  </Box>

                  <Box sx={{ display: 'grid', gap: 0.75, gridTemplateColumns: 'repeat(3, 1fr)' }}>
                    {(['x', 'y', 'z'] as LandmarkCoordinate[]).map((coordinate) => (
                      <Box
                        key={coordinate}
                        sx={{
                          backgroundColor: '#f8f9fa',
                          borderRadius: 1.5,
                          px: 0.85,
                          py: 0.8,
                        }}>
                        <Typography
                          sx={{ color: '#6b7280', fontSize: '0.66rem' }}
                          variant="caption">
                          {coordinate.toUpperCase()}
                        </Typography>
                        <Typography
                          sx={{ color: '#1f2937', fontSize: '0.8rem', fontWeight: 600 }}
                          variant="body2">
                          {formatCoordinate(landmark?.position[coordinate])}
                        </Typography>
                      </Box>
                    ))}
                  </Box>
                </Box>
              ))
              )}
            </Box>
          ) : (
            <Box
              sx={{
                display: 'grid',
                gap: 1,
                gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
              }}>
              {modelImages.length === 0 ? (
                <Box
                  sx={{
                    backgroundColor: '#ffffff',
                    border: '1px solid #e0e0e0',
                    borderRadius: 2,
                    boxShadow: '0 2px 8px rgba(15, 23, 42, 0.06)',
                    gridColumn: '1 / -1',
                    p: 2,
                    textAlign: 'center',
                  }}>
                  <Typography color="text.secondary" variant="body2">
                    No images available
                  </Typography>
                </Box>
              ) : (
                modelImages.map((imagePath, index) => (
                  <Box
                    key={`${imagePath}-${index}`}
                    sx={{
                      aspectRatio: '4 / 5',
                      backgroundColor: '#ffffff',
                      border: '1px solid #e0e0e0',
                      borderRadius: 2,
                      boxShadow: '0 2px 8px rgba(15, 23, 42, 0.06)',
                      cursor: 'pointer',
                      overflow: 'hidden',
                      transition: 'transform 0.2s ease, box-shadow 0.2s ease',
                      '&:hover': {
                        boxShadow: '0 10px 24px rgba(15, 23, 42, 0.16)',
                        transform: 'translateY(-2px)',
                      },
                    }}>
                    <img
                      src={imagePath}
                      alt={`${selectedModel?.fileName || 'model'} image ${index + 1}`}
                      onClick={() => setPreviewImage(imagePath)}
                      style={{
                        display: 'block',
                        height: '100%',
                        objectFit: 'cover',
                        width: '100%',
                      }}
                    />
                  </Box>
                ))
              )}
            </Box>
          )}
        </Box>
      </Paper>

      <Dialog
        open={Boolean(previewImage)}
        onClose={() => setPreviewImage(null)}
        maxWidth={false}
        PaperProps={{
          sx: {
            backgroundColor: 'transparent',
            backgroundImage: 'none',
            boxShadow: 'none',
            overflow: 'visible',
          },
        }}
        slotProps={{
          backdrop: {
            sx: {
              backdropFilter: 'blur(14px)',
              backgroundColor: 'rgba(15, 23, 42, 0.5)',
            },
          },
        }}>
        {previewImage ? (
          <Box
            sx={{
              alignItems: 'center',
              display: 'flex',
              justifyContent: 'center',
              maxHeight: '90vh',
              maxWidth: '90vw',
            }}>
            <img
              src={previewImage}
              alt={`${selectedModel?.fileName || 'model'} preview`}
              style={{
                borderRadius: 3,
                boxShadow: '0 24px 60px rgba(0, 0, 0, 0.35)',
                display: 'block',
                maxHeight: '90vh',
                maxWidth: '90vw',
                objectFit: 'contain',
              }}
            />
          </Box>
        ) : null}
      </Dialog>
    </Box>
  );
});
