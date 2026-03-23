import { Close, CloudUpload, Delete, TableView } from '@mui/icons-material';
import {
  Alert,
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  LinearProgress,
  List,
  ListItem,
  ListItemText,
  Paper,
  Tooltip,
  Typography,
} from '@mui/material';
import { useCallback, useRef, useState } from 'react';

import { useCSVMeasurementProcessing } from '../../hooks/useCSVMeasurementProcessing';

interface GenerateCSVDialogProps {
  open: boolean;
  onClose: () => void;
}

export const GenerateCSVDialog = ({
  open,
  onClose,
}: GenerateCSVDialogProps) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [isDragOver, setIsDragOver] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { mutate: processMeasurements, isLoading } =
    useCSVMeasurementProcessing();

  const handleFileSelect = useCallback(
    (files: FileList | null) => {
      if (!files || files.length === 0) return;

      setError(null); // Reset error

      const incoming = Array.from(files);

      const existingCSV = selectedFiles.find((f) => f.name.endsWith('.csv'));
      const newCSV = incoming.find((f) => f.name.endsWith('.csv'));

      // ❌ Prevent 2 CSVs
      if (existingCSV && newCSV) {
        setError('Only one CSV file is allowed.');
        return;
      }

      setSelectedFiles((prev) => [...prev, ...incoming]);
    },
    [selectedFiles],
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

  const handleClickBrowse = () => {
    fileInputRef.current?.click();
  };

  const handleRemoveFile = (file: File) => {
    setSelectedFiles((prev) => prev.filter((f) => f !== file));
  };

  const handleGenerateCSV = () => {
    const csv = selectedFiles.find((f) => f.name.endsWith('.csv'));
    const glbs = selectedFiles.filter((f) => f.name.endsWith('.glb'));

    if (!csv) return;

    setIsProcessing(true);

    processMeasurements(
      { csvFile: csv, glbFiles: glbs },
      {
        onSettled: () => {
          setIsProcessing(false);
          setSelectedFiles([]);
        },
      },
    );
  };

  const csvFile = selectedFiles.find((f) => f.name.endsWith('.csv'));
  const glbFiles = selectedFiles.filter((f) => f.name.endsWith('.glb'));

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{ sx: { borderRadius: 2, boxShadow: 3 } }}>
      <DialogTitle>
        <Box
          sx={{
            alignItems: 'center',
            display: 'flex',
            justifyContent: 'space-between',
          }}>
          <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
            Generate CSV
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
              '&:hover': { backgroundColor: '#f3f8ff', borderColor: '#1976d2' },
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
            onClick={handleClickBrowse}>
            <CloudUpload sx={{ color: '#1976d2', fontSize: 48, mb: 2 }} />

            <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 1 }}>
              {isDragOver ? 'Drop files here' : 'Drag & drop files here'}
            </Typography>

            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              or click to browse files
            </Typography>

            <Typography variant="caption" color="text.secondary">
              Supported formats: 1 CSV + multiple GLB
            </Typography>
          </Paper>

          {error && (
            <Alert severity="error" sx={{ mt: 2 }}>
              {error}
            </Alert>
          )}

          {/* ---------------------------- 
                FILE PREVIEW LIST 
          ---------------------------- */}
          <Box sx={{ mt: 3 }}>
            {csvFile && (
              <>
                <Typography
                  variant="subtitle2"
                  sx={{ fontWeight: 'bold', mb: 1 }}>
                  CSV File (required)
                </Typography>
                <List dense>
                  <ListItem
                    secondaryAction={
                      <IconButton onClick={() => handleRemoveFile(csvFile)}>
                        <Delete color="error" />
                      </IconButton>
                    }>
                    <ListItemText primary={csvFile.name} />
                  </ListItem>
                </List>
              </>
            )}

            {glbFiles.length > 0 && (
              <>
                <Typography
                  variant="subtitle2"
                  sx={{ fontWeight: 'bold', mb: 1, mt: 2 }}>
                  GLB Files ({glbFiles.length})
                </Typography>
                <List dense>
                  {glbFiles.map((file, idx) => (
                    <ListItem
                      key={idx}
                      secondaryAction={
                        <IconButton onClick={() => handleRemoveFile(file)}>
                          <Delete color="error" />
                        </IconButton>
                      }>
                      <ListItemText primary={file.name} />
                    </ListItem>
                  ))}
                </List>
              </>
            )}
          </Box>

          {isProcessing && (
            <Box sx={{ mt: 2 }}>
              <Typography variant="body2" sx={{ mb: 1 }}>
                Processing files...
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

        {/* Tooltip wrapper for disabled button */}
        <Box sx={{ position: 'relative' }}>
          <Tooltip
            title={!csvFile ? 'CSV file is required' : ''}
            placement="top">
            <span>
              <Button
                onClick={handleGenerateCSV}
                variant="contained"
                startIcon={<TableView />}
                disabled={!csvFile || isProcessing}
                sx={{
                  '&:hover': { backgroundColor: '#1565c0' },
                  backgroundColor: '#1976d2',
                }}>
                Generate Test Case
              </Button>
            </span>
          </Tooltip>
        </Box>
      </DialogActions>

      <input
        ref={fileInputRef}
        type="file"
        accept=".csv,.glb"
        multiple
        onChange={handleFileInputChange}
        style={{ display: 'none' }}
      />
    </Dialog>
  );
};
