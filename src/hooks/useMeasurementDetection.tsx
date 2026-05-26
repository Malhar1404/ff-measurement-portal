import { useMutation } from '@tanstack/react-query';

import { MeshesManager } from '../state/MeshesManager';
import { ViewManager } from '../state/ViewManager';
import { BodyMeasurementPoints } from '../types';

interface MeasurementResponse {
  mid_waist_measurement: number;
  narrow_waist_measurement: number;
  allstar_skirt_end_measurement: number;
  school_skirt_end_measurement: number;
}

// Define variables type for mutation
interface MeasurementVars {
  glbFile: File;
  landmarkJson: any;
  targetId?: string;
}

const extractMeasurements = async ({ glbFile, landmarkJson }: MeasurementVars): Promise<MeasurementResponse> => {
  const formData = new FormData();
  formData.append('glb_file', glbFile);

  // Convert landmark response to JSON file
  const jsonBlob = new Blob([JSON.stringify(landmarkJson)], {
    type: 'application/json',
  });
  formData.append('landmark_json', jsonBlob, 'landmarks.json');

  const response = await fetch('http://localhost:3001/compute_measurements', {
    body: formData,
    method: 'POST',
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(
      (errorData.detail as string) ?? 'Failed to compute measurements',
    );
  }

  return response.json();
};

export const useMeasurementDetection = (
  meshesManager: MeshesManager,
  viewManager: ViewManager,
) => {
  return useMutation({
    mutationFn: extractMeasurements,
    onError: (error) => {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error occurred';
      viewManager.addLog(
        `Measurement computation failed: ${errorMessage}`,
        'error',
      );
      console.error('Measurement detection error:', error);
    },
    onMutate: () => {
      viewManager.addLog('Starting measurement computation...', 'info');
    },
    onSuccess: (data, variables) => {
      try {
        const targetId = variables.targetId || meshesManager.selectedModelId;
        if (!targetId) throw new Error('No target model ID for measurements');

        const measurementData = Object.fromEntries(
          Object.entries(data).filter(([key]) => key.endsWith('_measurement')),
        );

        const otherData = Object.fromEntries(
          Object.entries(data).filter(
            ([key, value]) =>
              !key.endsWith('_measurement') &&
              Array.isArray(value) &&
              value.length > 0,
          ),
        );

        const model = meshesManager.modelsList.find(m => m.id === targetId);
        if (model) {
          model.setMeasurementResponse(measurementData);
          model.setLineData(otherData as BodyMeasurementPoints);
        }
      } catch (error) {
        viewManager.addLog(
          `Error processing measurements: ${error instanceof Error ? error.message : 'Unknown error'}`,
          'error',
        );
        console.error('Error processing measurements:', error);
      }
    },
  });
};
