import {
  Delete,
  Description,
  HistoryEdu,
  Image,
  SaveAlt,
  Upload
} from '@mui/icons-material';
import {
  Box,
  Button,
  Divider,
  IconButton,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Paper,
  Stack,
  Tab,
  Tabs,
  Typography,
} from '@mui/material';
import { observer } from 'mobx-react-lite';
import { useRef } from 'react';

import { useMainContext } from '../../hooks/useMainContext';

export const Sidebar = observer(({ 
    onUploadImages, 
    onGenerateCSV 
}: { 
    onUploadImages: () => void;
    onGenerateCSV: () => void;
}) => {
  const { meshesManager, viewManager } = useMainContext();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      const category = viewManager.activeCategoryTab;
      await meshesManager.addGLBUrl(url, file.name, category);
      viewManager.addLog(`Loaded ${category} model: ${file.name}`, 'info');
    }
    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <Paper
      elevation={3}
      sx={{
        bgcolor: '#f8f9fa',
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        width: 300,
        zIndex: 1100,
      }}>
      <Box sx={{ p: 2 }}>
        <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 2 }}>
          Model Assets
        </Typography>
        <input
          type="file"
          accept=".glb,.gltf"
          style={{ display: 'none' }}
          ref={fileInputRef}
          onChange={handleFileChange}
        />
        
        <Stack spacing={1} sx={{ mb: 2 }}>
          <Button
            fullWidth
            variant="contained"
            startIcon={<Upload />}
            onClick={() => fileInputRef.current?.click()}
            sx={{ flex: 1 }}>
            Upload GLB
          </Button>
          
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button
              fullWidth
              variant="outlined"
              size="small"
              startIcon={<Image />}
              onClick={onUploadImages}
              sx={{ flex: 1, fontSize: '0.75rem' }}>
              Images
            </Button>
            <Button
              fullWidth
              variant="outlined"
              size="small"
              startIcon={<HistoryEdu />}
              onClick={onGenerateCSV}
              sx={{ flex: 1, fontSize: '0.75rem' }}>
              CSV
            </Button>
          </Box>
        </Stack>
      </Box>

      <Divider />

      <Box sx={{ borderBottom: 1, borderColor: 'divider', bgcolor: '#fff' }}>
        <Tabs 
            value={viewManager.activeCategoryTab} 
            // @typescript-eslint/no-explicit-any
            onChange={(_, newValue) => viewManager.setActiveCategoryTab(newValue)}
            variant="fullWidth"
            indicatorColor="primary"
            textColor="primary"
        >
          <Tab label="Adults" value="adult" />
          <Tab label="Kids" value="kid" />
        </Tabs>
      </Box>

      <Box sx={{ flexGrow: 1, overflowY: 'auto', py: 1 }}>
        <List>
          {meshesManager.modelsList
            .filter(m => m.category === viewManager.activeCategoryTab)
            .map((model) => (
              <ListItem
                key={model.id}
                disablePadding
                secondaryAction={
                    <IconButton edge="end" aria-label="delete" onClick={() => {
                        // TODO: Implement delete in MeshesManager
                    }}>
                        <Delete fontSize="small" />
                    </IconButton>
                }
               >
                <ListItemButton
                  selected={meshesManager.selectedModelId === model.id}
                  onClick={() => meshesManager.setSelectedModelId(model.id)}
                  sx={{
                    '&.Mui-selected': {
                      bgcolor: 'primary.light',
                      color: 'primary.contrastText',
                      '&:hover': {
                        bgcolor: 'primary.light',
                      },
                      '& .MuiListItemIcon-root': {
                        color: 'primary.contrastText',
                      },
                    },
                  }}>
                  <ListItemIcon>
                    <Description />
                  </ListItemIcon>
                  <ListItemText
                    primary={model.fileName || 'Untitled Model'}
                    secondary={model.hasLandmarks ? 'Landmarks Detected' : 'No Data'}
                    primaryTypographyProps={{
                      style: {
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      },
                    }}
                    secondaryTypographyProps={{
                        sx: { 
                            color: model.hasLandmarks ? 'success.main' : 'text.secondary',
                            fontSize: '0.75rem'
                        }
                    }}
                  />
                </ListItemButton>
              </ListItem>
            ))}
          
          {meshesManager.modelsList.filter(m => m.category === viewManager.activeCategoryTab).length === 0 && (
            <Box sx={{ p: 4, textAlign: 'center' }}>
              <Typography variant="body2" color="text.secondary">
                No {viewManager.activeCategoryTab} models loaded
              </Typography>
            </Box>
          )}
        </List>
      </Box>

      <Divider />

      <Box sx={{ p: 2, display: 'flex', gap: 1 }}>
         <Button
            fullWidth
            variant="outlined"
            size="small"
            color="secondary"
            onClick={() => meshesManager.clear()}
            disabled={meshesManager.modelsList.length === 0}
            sx={{ flex: 1 }}
         >
            Clear All
         </Button>
         <Button
            fullWidth
            variant="contained"
            size="small"
            color="primary"
            startIcon={<SaveAlt />}
            onClick={() => meshesManager.exportLandmarks()}
            disabled={!meshesManager.selectedModel?.hasLandmarks}
            sx={{ flex: 1.5 }}
         >
            Export
         </Button>
      </Box>
    </Paper>
  );
});
