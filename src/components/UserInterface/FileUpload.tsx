import { Close, CloudUpload } from '@mui/icons-material';
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  LinearProgress,
  Paper,
  Typography,
} from '@mui/material';
import { useCallback, useRef, useState } from 'react';

import { useMainContext } from '../../hooks/useMainContext';

interface FileUploadProps {
  open: boolean;
  onClose: () => void;
  title: string;
  accept: string;
}

export const FileUpload = ({
  open,
  onClose,
  title,
  accept,
}: FileUploadProps) => {
  const { meshesManager } = useMainContext();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  const handleFileSelect = useCallback(
    async (files: FileList | null) => {
      if (!files || files.length === 0) return;

      setIsUploading(true);

      try {
        for (let i = 0; i < files.length; i++) {
          const file = files[i];
          const blobUrl = URL.createObjectURL(file);
          await meshesManager.addGLBUrl(blobUrl, file.name);
        }
        onClose();
      } catch (error) {
      } finally {
        setIsUploading(false);
      }
    },
    [meshesManager, onClose],
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragOver(false);
      handleFileSelect(e.dataTransfer.files);
    },
    [handleFileSelect],
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  const handleFileInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      handleFileSelect(e.target.files);
    },
    [handleFileSelect],
  );

  const handleClick = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

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
        <Box
          sx={{
            alignItems: 'center',
            display: 'flex',
            justifyContent: 'space-between',
          }}>
          <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
            {title}
          </Typography>
          <Button onClick={onClose} size="small" color="inherit">
            <Close />
          </Button>
        </Box>
      </DialogTitle>
      <DialogContent>
        <Box sx={{ mt: 2 }}>
          <Paper
            sx={{
              '&:hover': {
                backgroundColor: '#f3f8ff',
                borderColor: '#1976d2',
              },
              backgroundColor: isDragOver ? '#f3f8ff' : '#fafafa',
              border: '2px dashed',
              borderColor: isDragOver ? '#1976d2' : '#e0e0e0',
              cursor: 'pointer',
              p: 4,
              textAlign: 'center',
              transition: 'all 0.2s ease',
            }}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onClick={handleClick}>
            <CloudUpload sx={{ color: '#1976d2', fontSize: 48, mb: 2 }} />
            <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 1 }}>
              {isDragOver ? 'Drop files here' : 'Drag & drop files here'}
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              or click to browse files
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Supported formats: {accept}
            </Typography>
          </Paper>

          {isUploading && (
            <Box sx={{ mt: 2 }}>
              <Typography variant="body2" sx={{ mb: 1 }}>
                Uploading files...
              </Typography>
              <LinearProgress />
            </Box>
          )}
        </Box>
      </DialogContent>
      <DialogActions sx={{ p: 2 }}>
        <Button onClick={onClose} color="inherit">
          Cancel
        </Button>
        <Button
          onClick={handleClick}
          variant="contained"
          startIcon={<CloudUpload />}
          disabled={isUploading}
          sx={{
            '&:hover': { backgroundColor: '#1565c0' },
            backgroundColor: '#1976d2',
          }}>
          Browse Files
        </Button>
      </DialogActions>

      <input
        ref={fileInputRef}
        type="file"
        accept={accept}
        multiple
        onChange={handleFileInputChange}
        style={{ display: 'none' }}
      />
    </Dialog>
  );
};
