import { useMutation } from '@tanstack/react-query';

const API_BASE_URL = 'http://localhost:8000';

interface ProcessMeasurementParams {
  csvFile: File;
  glbFiles: File[];
}

const processMeasurements = async (data: ProcessMeasurementParams) => {
  const formData = new FormData();

  // CSV file
  formData.append('csv_file', data.csvFile);

  // GLB files
  data.glbFiles.forEach((file) => {
    formData.append('glb_files', file);
  });

  const response = await fetch(`${API_BASE_URL}/process_measurements`, {
    body: formData,
    method: 'POST',
  });

  if (!response.ok) {
    const text = await response.text(); // backend returns plain text error
    throw new Error(text || 'Failed to process measurement data');
  }

  return await response.blob(); // backend returns CSV file
};

export const useCSVMeasurementProcessing = () => {
  return useMutation({
    mutationFn: processMeasurements,

    onError: (error) => {
      console.error(
        ' Error during /process_measurements:',
        error instanceof Error ? error.message : error,
      );
    },

    onMutate: () => {
      
    },

    onSuccess: (blob) => {
      

      // auto-download CSV file
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'measurement_errors.csv';
      a.click();
      URL.revokeObjectURL(url);

      
    },
  });
};
