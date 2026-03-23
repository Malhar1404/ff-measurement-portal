import { ChevronRight, Menu } from '@mui/icons-material';
import {
    Box,
    Chip,
    IconButton,
    List,
    ListItem,
    ListItemText,
    Paper,
    Stack,
    Typography,
} from '@mui/material';
import { observer } from 'mobx-react-lite';
import { useState } from 'react';

import { useMainContext } from '../../hooks/useMainContext';
import { LogAccordion } from './LogAccordion';

interface LogEntry {
  id: string;
  message: string;
  timestamp: Date;
  type: 'info' | 'success' | 'warning' | 'error';
}

export const Logger = observer(() => {
  const { viewManager, meshesManager } = useMainContext();
  const logs = viewManager.logs;
  
  const selectedModel = meshesManager.selectedModel;
  const measurementResponse = selectedModel?.measurementResponse;
  const landmarkPositions = selectedModel?.landmarks;
  
  const [isOpen, setIsOpen] = useState(false);

  const getLogColor = (type: LogEntry['type']) => {
    switch (type) {
      case 'success':
        return '#4caf50';
      case 'warning':
        return '#ff9800';
      case 'error':
        return '#f44336';
      default:
        return '#2196f3';
    }
  };

  return (
    <Box
      sx={{
        height: '80vh',
        position: 'fixed',
        right: isOpen ? 0 : -400,
        top: '50%',
        transform: 'translateY(-50%)',
        transition: 'right 0.3s ease-in-out',
        width: 400,
        zIndex: 1000,
      }}>
      {/* Toggle Button */}
      <IconButton
        onClick={() => setIsOpen(!isOpen)}
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

      {/* Logger Panel */}
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
        {/* Header */}
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
                fontSize: '1.2rem',
                fontWeight: 'bold',
              }}>
              📋 Logger
            </Typography>
            <Chip
              label={`${logs.length}`}
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

        {/* Logs Container */}
        <Box
          sx={{
            flex: 1,
            overflow: 'auto',
            p: 1,
          }}>
          {/* No Logs */}
          {logs.length === 0 ? (
            <Box
              sx={{
                alignItems: 'center',
                color: '#9e9e9e',
                display: 'flex',
                flexDirection: 'column',
                fontStyle: 'italic',
                gap: 1,
                height: '100%',
                justifyContent: 'center',
                p: 2,
              }}>
              <Typography
                sx={{ fontSize: '1rem', textAlign: 'center' }}
                variant="body1">
                📝 No logs available
              </Typography>
              <Typography
                sx={{ fontSize: '0.9rem', textAlign: 'center' }}
                variant="body2">
                Upload a model and run tests to see logs here
              </Typography>
            </Box>
          ) : (
            <List sx={{ p: 0 }}>
              <Stack spacing={1.5}>
                {landmarkPositions && (
                  <>
                    {Object.entries(landmarkPositions).map(
                      ([groupName, landmarks]) => (
                        <LogAccordion
                          key={groupName}
                          title={groupName}
                          data={landmarks as any[]} // array of {color, name, position}
                          isLandmarkArray
                        />
                      ),
                    )}
                  </>
                )}

                {measurementResponse && (
                  <LogAccordion
                    title="Measurements"
                    data={measurementResponse as Record<string, number>}
                  />
                )}
              </Stack>

              {/* Normal Logs */}
              {logs
                .slice(-15)
                .reverse()
                .map((log, index) => (
                  <ListItem
                    key={log.id}
                    sx={{
                      '&:hover': {
                        backgroundColor: '#f5f5f5',
                        transform: 'translateX(2px)',
                      },
                      backgroundColor: index === 0 ? '#f3f8ff' : 'transparent',
                      border:
                        index === 0
                          ? '1px solid #e3f2fd'
                          : '1px solid transparent',
                      borderRadius: 1,
                      mb: 0.5,
                      px: 1.5,
                      py: 1,
                      transition: 'all 0.2s ease',
                    }}>
                    <ListItemText
                      primary={
                        <Box
                          sx={{
                            display: 'flex',
                            flexDirection: 'column',
                            gap: 0.5,
                          }}>
                          <Box
                            sx={{
                              alignItems: 'center',
                              display: 'flex',
                              gap: 1,
                            }}>
                            <Box
                              sx={{
                                backgroundColor: getLogColor(log.type),
                                borderRadius: 1,
                                color: 'white',
                                fontSize: '0.7rem',
                                fontWeight: 'bold',
                                minWidth: '50px',
                                p: 0.5,
                                textAlign: 'center',
                                textTransform: 'uppercase',
                              }}>
                              {log.type}
                            </Box>
                            <Typography
                              variant="body2"
                              sx={{
                                color: '#2c3e50',
                                fontSize: '0.9rem',
                                fontWeight: '500',
                                lineHeight: 1.3,
                              }}>
                              {log.message}
                            </Typography>
                          </Box>
                          <Typography
                            variant="caption"
                            sx={{
                              color: '#757575',
                              fontSize: '0.75rem',
                              textAlign: 'right',
                            }}>
                            {log.timestamp.toLocaleTimeString()}
                          </Typography>
                        </Box>
                      }
                    />
                  </ListItem>
                ))}
            </List>
          )}
        </Box>
      </Paper>
    </Box>
  );
});
