import {
  EditOutlined,
  SaveAlt,
  SaveOutlined,
  Collections,
  EditLocationAlt,
  Check,
} from '@mui/icons-material';
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
import { useSnackbar } from 'notistack';
import { SyntheticEvent, useState } from 'react';

import { useMainContext } from '../../hooks/useMainContext';
import CommentsBox from './CommentBox';
import { downloadFile } from '../../utils/generalUtils';

type SidebarTab = 'landmarks' | 'images';

export const ModelDetailsSidebar = observer(() => {
  const { meshesManager, viewManager } = useMainContext();
  const { enqueueSnackbar } = useSnackbar();
  const selectedModel = meshesManager.selectedModel;
  const meshLandmarks = selectedModel?.landmarks['Mesh landmarks'] || [];
  const modelImages = selectedModel?.images || [];
  const selectedLandmarkName = selectedModel?.selectedMeshLandmarkName ?? null;


  const [activeTab, setActiveTab] = useState<SidebarTab>('landmarks');

  const handleTabChange = (_event: SyntheticEvent, value: SidebarTab) => {
    setActiveTab(value);
  };


  const formatLandmarkLabel = (name: string) =>
    name
      .replace(/_landmark$/i, '')
      .split('_')
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
      .join(' ');

  const formatModelName = (fileName?: string) =>
    fileName ? fileName.replace(/\.[^/.]+$/, '') : 'No model selected';

  const handleEditLandmark = (landmarkName: string) => {
    selectedModel?.markMeshLandmarkEditing(landmarkName);
    selectedModel?.setStatus('pending');
  };

  const handleSaveLandmark = (landmarkName: string) => {
    selectedModel?.markMeshLandmarkSaved(landmarkName);
    if (selectedModel?.isApproved) {
      selectedModel.setStatus('approved');
      enqueueSnackbar('Landmarks saved locally.', {
        variant: 'success',
      });
    }
  };

  const handleSaveLandmarks = () => {
    if (!selectedModel) {
      return;
    }

    if (!selectedModel.allMeshLandmarksSaved) {
      enqueueSnackbar('Save all points first before exporting landmarks.', {
        variant: 'error',
      });
      return;
    }

    const exportData = meshesManager.exportLandmarks();
    const fileName = Object.keys(exportData)[0];
    downloadFile(exportData, fileName);
  };


  const getLandmarkStatusStyles = (color?: string) => {
    switch (color) {
      case 'red':
        return {
          backgroundColor: 'rgba(211, 47, 47, 0.12)',
          borderColor: 'rgba(211, 47, 47, 0.45)',
          boxShadow: '0 8px 20px rgba(211, 47, 47, 0.14)',
          coordinateBg: 'rgba(211, 47, 47, 0.08)',
          titleColor: '#9a1b1b',
        };
      case 'green':
        return {
          backgroundColor: 'rgba(46, 125, 50, 0.12)',
          borderColor: 'rgba(46, 125, 50, 0.42)',
          boxShadow: '0 8px 20px rgba(46, 125, 50, 0.14)',
          coordinateBg: 'rgba(46, 125, 50, 0.08)',
          titleColor: '#1f6d23',
        };
      case 'yellow':
      default:
        return {
          backgroundColor: 'rgba(255, 214, 10, 0.14)',
          borderColor: 'rgba(214, 170, 0, 0.42)',
          boxShadow: '0 8px 20px rgba(214, 170, 0, 0.12)',
          coordinateBg: 'rgba(255, 214, 10, 0.08)',
          titleColor: '#8a6a00',
        };
    }
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
              {formatModelName(selectedModel?.fileName)}
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
                meshLandmarks.map((landmark) => {
                  const isSelected = selectedLandmarkName === landmark.name;
                  const statusStyles = getLandmarkStatusStyles(landmark.color);
                  
                  return (
                    <Box
                      key={landmark.name}
                      sx={{
                        backgroundColor: statusStyles.backgroundColor,
                        border: `1px solid ${statusStyles.borderColor}`,
                        borderRadius: 2,
                        boxShadow: statusStyles.boxShadow,
                        p: 1.2,
                        transition:
                          'background-color 0.2s ease, border-color 0.2s ease, box-shadow 0.2s ease',
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
                          sx={{
                            color: statusStyles.titleColor,
                            fontSize: '0.88rem',
                            fontWeight: 700,
                          }}
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
                              backgroundColor: isSelected ? 'rgba(255,255,255,0.35)' : 'rgba(255,255,255,0.2)',
                              borderRadius: 2,
                              fontSize: '0.7rem',
                              minWidth: 0,
                              px: 0.75,
                              py: 0.25,
                              textTransform: 'none',
                            }}>
                            <EditOutlined sx={{ fontSize: '0.95rem' }} />Edit
                          </Button>
                          <Button
                            size="small"
                            variant="contained"
                            onClick={() => handleSaveLandmark(landmark.name)}
                            sx={{
                              backgroundColor: 'rgba(25, 118, 210, 0.9)',
                              borderRadius: 2,
                              boxShadow: 'none',
                              fontSize: '0.7rem',
                              minWidth: 0,
                              minHeight: 0,
                              '&:hover': {
                                backgroundColor: 'rgba(25, 118, 210, 1)',
                              },
                              px: 0.75,
                              py: 0.25,
                              textTransform: 'none',
                            }}>
                            <SaveOutlined sx={{ fontSize: '0.95rem' }} />Save
                          </Button>
                        </Box>
                      </Box>
                    </Box>
                  );
                })
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
                      onClick={() => viewManager.setComparisonImage(imagePath)}
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

        {activeTab === 'landmarks' ? (<>
          <CommentsBox
            key={selectedModel?.id || 'no-model'}
            defaultValue={selectedModel?.modelComment ?? ''}
           onSubmit={(comment) => {
  if (selectedModel) {
    selectedModel.setModelComment(comment);
    enqueueSnackbar('Comment saved locally.', {
      variant: 'success',
    });
  }
}}
            disabled={!selectedModel}
          />
          <Box
            sx={{
              backgroundColor: '#fff',
              borderTop: '1px solid #e0e0e0',
              p: 1.5,
              display: 'flex',
              gap: 1,
            }}
          >

            {/* Save Draft */}
            <Button
              fullWidth
              size="small"
              variant="outlined"
              color="primary"
              startIcon={<SaveAlt />}
              onClick={handleSaveLandmarks}
              disabled={!selectedModel?.hasLandmarks}
              sx={{
                borderRadius: 2,
                fontSize: '0.7rem',
                py: 0.6,
                textTransform: 'none',
                fontWeight: 500,
              }}
            >
              Save Draft
            </Button>
          </Box>
        </>
        ) : null}
      </Paper>

    </Box>
  );
});
