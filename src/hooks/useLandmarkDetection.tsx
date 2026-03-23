import { useMutation } from '@tanstack/react-query';
import * as THREE from 'three';

import { MeshesManager } from '../state/MeshesManager';
import { ViewManager } from '../state/ViewManager';

interface LandmarkPoint3D {
  x: number;
  y: number;
  z: number;
}

interface MeshLandmarks {
  chest_landmark: LandmarkPoint3D;
  hip_landmark: LandmarkPoint3D;
  narrow_waist_landmark: LandmarkPoint3D;
}

interface PoseLandmark {
  point_3d: LandmarkPoint3D;
}

interface PoseLandmarks {
  left_shoulder: PoseLandmark;
  right_shoulder: PoseLandmark;
  left_elbow: PoseLandmark;
  right_elbow: PoseLandmark;
  left_wrist: PoseLandmark;
  right_wrist: PoseLandmark;
  left_hip: PoseLandmark;
  right_hip: PoseLandmark;
  left_knee: PoseLandmark;
  right_knee: PoseLandmark;
  left_ankle: PoseLandmark;
  right_ankle: PoseLandmark;
}

interface LandmarkResponse {
  mesh_landmarks: MeshLandmarks;
  pose_landmarks: {
    pose_landmarks: PoseLandmarks;
  };
}

const API_BASE_URL = 'http://localhost:3002';

// Define variables type for mutation
interface MutationVars {
    file: File;
    targetMeshUuid?: string; // Optional context for where to apply landmarks
}

const extractLandmarks = async ({ file }: MutationVars): Promise<LandmarkResponse> => {
  // const formData = new FormData();
  // formData.append('file', file);

  // const response = await fetch(`${API_BASE_URL}/landmarks`, {
  //   body: formData,
  //   method: 'POST',
  // });

  // if (!response.ok) {
  //   const errorData = await response.json();
  //   throw new Error(
  //     (errorData.detail as string) ?? 'Failed to extract landmarks',
  //   );
  // }

  // return response.json();
  
  throw new Error('Backend landmark detection is disabled. Use static JSONs in public/landmark_json/');
};

export const useLandmarkDetection = (
  meshesManager: MeshesManager,
  viewManager: ViewManager,
) => {
  return useMutation({
    mutationFn: extractLandmarks,
    onError: (error) => {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error occurred';
      viewManager.addLog(`Landmark detection failed: ${errorMessage}`, 'error');
      console.error('Landmark detection error:', error);
    },
    onMutate: () => {
      viewManager.addLog('Starting landmark detection...', 'info');
    },
    onSuccess: (data, variables) => {
      try {
        let glbScene: THREE.Group | undefined;
        let targetId = variables.targetMeshUuid;

        if (targetId) {
            const model = meshesManager.modelsList.find(m => m.id === targetId);
            glbScene = model?.scene;
        } else {
            targetId = meshesManager.selectedModelId || undefined;
            glbScene = meshesManager.selectedModel?.scene;
        }

        if (targetId) {
            const model = meshesManager.modelsList.find(m => m.id === targetId);
            if (model) {
                model.processLandmarkResponse(data);
            }
        } else {
            meshesManager.selectedModel?.processLandmarkResponse(data);
        }

      } catch (error) {
        viewManager.addLog(
          `Error processing landmarks: ${error instanceof Error ? error.message : 'Unknown error'}`,
          'error',
        );
        console.error('Error processing landmarks:', error);
      }
    },
  });
};
