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
import { ChangeEvent, SyntheticEvent, useRef } from 'react';

import { useMainContext } from '../../hooks/useMainContext';

export const Sidebar = observer(() => {
  const { meshesManager, viewManager } = useMainContext();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (event: ChangeEvent<HTMLInputElement>) => {
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
        width: 260,
        zIndex: 1100,
      }}>
      <Box sx={{ p: 2 }}>
        <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 0 }}>
          Model Assets
        </Typography>
        <input
          type="file"
          accept=".glb,.gltf"
          style={{ display: 'none' }}
          ref={fileInputRef}
          onChange={handleFileChange}
        />
        
      </Box>

      <Divider />

      <Box sx={{ borderBottom: 1, borderColor: 'divider', bgcolor: '#fff' }}>
        <Tabs 
            value={viewManager.activeCategoryTab} 
            onChange={(_event: SyntheticEvent, newValue: 'adult' | 'kid') =>
              viewManager.setActiveCategoryTab(newValue)
            }
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
    </Paper>
  );
});
