import {
  CheckCircle,
  Description,
  HourglassEmpty,
} from '@mui/icons-material';
import {
  Box,
  Divider,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Paper,
  Tab,
  Tabs,
  Typography,
} from '@mui/material';
import { observer } from 'mobx-react-lite';
import {  SyntheticEvent } from 'react';

import { useMainContext } from '../../hooks/useMainContext';

export const Sidebar = observer(() => {
  const { meshesManager, viewManager } = useMainContext();
  const visibleModels = meshesManager.modelsList.filter(
    (model) => model.category === viewManager.activeCategoryTab,
  );
  const readyCount = visibleModels.filter((model) => model.isReady).length;
  const totalCount = visibleModels.length;

  return (
    <Paper
      elevation={3}
      sx={{
        bgcolor: '#f8f9fa',
        display: 'flex',
        flexDirection: 'column',
        height: '80vh',
        left: 0,
        position: 'absolute',
        top: '50%',
        transform: 'translateY(-50%)',
        width: 260,
        zIndex: 1100,
      }}>
      <Box
        sx={{
          alignItems: 'center',
          display: 'flex',
          justifyContent: 'space-between',
          gap: 1,
          p: 2,
        }}
      >
        <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 0 }}>
          Model Assets
        </Typography>
        <Typography
          variant="caption"
          sx={{
            color: 'text.secondary',
            letterSpacing: 0.2,
            whiteSpace: 'nowrap',
          }}
        >
          {readyCount} / {totalCount} ready
        </Typography>
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
          {visibleModels
            .map((model) => (
              <ListItem
                key={model.id}
                disablePadding
                secondaryAction={
                  <Box
                    sx={{
                      alignItems: 'center',
                      display: 'flex',
                      justifyContent: 'center',
                      minWidth: 32,
                      mr: 1.5,
                    }}>
                    {model.isLoading ? (
                      <HourglassEmpty
                        fontSize="small"
                        sx={{ color: 'rgba(148, 163, 184, 0.55)' }}
                      />
                    ) : (
                      <CheckCircle
                        fontSize="small"
                        sx={{
                          color: model.isApproved
                            ? 'success.main'
                            : model.isPending
                              ? 'warning.main'
                              : 'rgba(148, 163, 184, 0.45)',
                        }}
                      />
                    )}
                  </Box>
                }
               >
                <ListItemButton
                  selected={meshesManager.selectedModelId === model.id}
                  disabled={!model.isReady}
                  onClick={() => meshesManager.setSelectedModelId(model.id)}
                  sx={{
                    opacity: model.isReady ? 1 : 0.55,
                    cursor: model.isReady ? 'pointer' : 'not-allowed',
                    bgcolor: model.isReady ? 'inherit' : 'rgba(148, 163, 184, 0.08)',
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
                    secondary={
                      model.isLoading
                        ? 'Preparing model...'
                        : model.loadState === 'failed'
                          ? model.loadError || 'Failed to load'
                          : model.hasLandmarks
                            ? 'Landmarks Detected'
                            : 'No Data'
                    }
                    primaryTypographyProps={{
                      style: {
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      },
                    }}
                    secondaryTypographyProps={{
                        sx: { 
                            color: model.isLoading
                              ? 'text.secondary'
                              : model.loadState === 'failed'
                                ? 'error.main'
                                : model.hasLandmarks
                                  ? 'success.main'
                                  : 'text.secondary',
                            fontSize: '0.75rem'
                        }
                    }}
                  />
                </ListItemButton>
              </ListItem>
            ))}
          
          {visibleModels.length === 0 && (
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
