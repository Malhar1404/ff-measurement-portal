import { makeAutoObservable, ObservableMap, reaction } from 'mobx';
import * as THREE from 'three';

import { APP_CONFIG } from '../config/appConfig';
import cachedLandmarks from '../config/predefinedLandmarks.json';
import { Utils3D } from '../utils/Utils3D';
import { LandmarkType, MeshManager } from './MeshManager';
import { StateManager } from './StateManager';

export class MeshesManager {
  private _libState: StateManager;
  private _models = new ObservableMap<string, MeshManager>();

  selectedModelId: string | null = null;

  constructor(libState: StateManager) {
    this._libState = libState;
    makeAutoObservable(this);

    // 🔥 REACTIVE: Re-run landmark logic for all models if global skirt type changes
    reaction(
      () => this._libState.skirtStore.activeSkirtType,
      () => {
        this._models.forEach((model) => {
          if (model.hasLandmarks) {
            model.setLandmarks(model.landmarks);
          }
        });
      },
    );
  }

  setSelectedModelId(id: string | null) {
    this.selectedModelId = id;

    if (id && this._models.has(id)) {
      this._libState.cameraManager.focusCameraTo([this._models.get(id)!.scene]);
    }
  }

  get selectedModel(): MeshManager | null {
    if (this.selectedModelId && this._models.has(this.selectedModelId)) {
      return this._models.get(this.selectedModelId)!;
    }
    return null;
  }

  get hasLandmarkData() {
    return this.selectedModel?.hasLandmarks || false;
  }

  get modelsList() {
    // eslint-disable-next-line
    return Array.from(this._models.values());
  }

  get glbscenes() {
    return this.modelsList.map((m) => m.scene);
  }

  // Compatibility getter for older components if needed
  get glbData() {
    return this.modelsList.map((m) => ({
      blobUrl: m.blobUrl,
      fileName: m.fileName,
      scene: m.scene,
    }));
  }

  /* ===============================
     LANDMARK UPDATE
     =============================== */

  setLandmarkPositions(
    landmarkPositions: LandmarkType,
    targetMeshUuid?: string,
  ) {
    let targetId = targetMeshUuid;

    if (!targetId) {
      targetId = this.selectedModelId || undefined;
    }

    if (targetId && this._models.has(targetId)) {
      this._models.get(targetId)!.setLandmarks(landmarkPositions);
    } else {
      // Fallback or handle multi-mesh in one GLB?
      // Usually targetMeshUuid should match the model ID we assigned.
      console.warn(`[ModelsManager] Could not find model for ID: ${targetId}`);
    }
  }

  exportLandmarks() {
    const selected = this.selectedModel;
    if (!selected || selected.landmarks['Mesh landmarks'].length === 0) {
      this._libState.viewManager.addLog(
        'No landmark data for selected model to export.',
        'warning',
      );
      return;
    }

    if (!selected.allMeshLandmarksSaved) {
      this._libState.viewManager.addLog(
        'Save all mesh landmarks before exporting JSON.',
        'warning',
      );
      return;
    }

    const rawFileName = selected.fileName || 'model.glb';
    const baseName = rawFileName.split('.')[0];
    const now = new Date();
    const formatPart = (value: number) => value.toString().padStart(2, '0');
    const timestamp = [
      now.getFullYear(),
      formatPart(now.getMonth() + 1),
      formatPart(now.getDate()),
    ].join('-');
    const exportFileName = `${baseName}_landmarks_${timestamp}.json`;

    const meshLandmarks = selected.landmarks['Mesh landmarks'].reduce(
      (acc, landmark) => {
        const serializedSlice = selected.serializeLandmarkSlice(landmark.sliceData);
        acc[landmark.name] = {
          x: landmark.position.x,
          y: landmark.position.y,
          z: landmark.position.z,
          ...(serializedSlice ? { slice: serializedSlice } : {}),
        };
        return acc;
      },
      {} as Record<string, any>,
    );

    const exportData = {
      [rawFileName]: {
        mesh_landmarks: meshLandmarks,
      },
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = exportFileName;
    link.click();
    URL.revokeObjectURL(url);
    this._libState.viewManager.addLog(
      `Landmarks exported to ${exportFileName}`,
      'info',
    );
  }

  async loadLandmarksFromCache(model: MeshManager) {
    const fileName = model.fileName;
    if (!fileName) return;

    const baseName = fileName.split('.')[0];
    const jsonPath = `/landmark_json/${baseName}_landmarks.json`;

    try {
      const response = await fetch(jsonPath);
      if (response.ok) {
        const data = await response.json();
        // The JSON might be { "filename": {data} } or just {data}
        // User's export format was { "filename": {data} }
        const landmarkData = data[fileName] || data;
        model.processLandmarkResponse(landmarkData);
        this._libState.viewManager.addLog(
          `Loaded static landmarks: ${jsonPath}`,
          'success',
        );
        return;
      }
    } catch (e) {
      console.warn(
        `Could not fetch static landmark JSON for ${fileName} at ${jsonPath}`,
      );
    }

    // Fallback to predefinedLandmarks.json (the hardcoded bundle)
    if ((cachedLandmarks as any)[fileName]) {
      const data = (cachedLandmarks as any)[fileName];
      model.processLandmarkResponse(data);
      this._libState.viewManager.addLog(
        `Applied hardcoded landmarks for: ${fileName}`,
        'info',
      );
    }
  }

  loadImagesFromConfig(model: MeshManager) {
    const fileName = model.fileName;
    if (!fileName) return;

    const baseName = fileName.split('.')[0];
    const imagePaths = APP_CONFIG.modelImages[baseName] || [];
    model.setImages(imagePaths);
  }

  /* ===============================
     GLB LOADING
     =============================== */

  addGLBUrl = async (
    glbUrl: string,
    fileName?: string,
    category: 'adult' | 'kid' = 'adult',
    loadStaticLandmarks = true,
  ) => {
    try {
      const scene = await Utils3D.loadGLTF(glbUrl);

      // Clean scene hierarchy if needed
      scene.traverse((obj) => {
        if (obj instanceof THREE.Mesh) {
          obj.material = obj.material.clone();
        }
      });

      const model = new MeshManager(
        scene.uuid,
        scene,
        glbUrl,
        this._libState,
        fileName,
        category,
      );
      this._models.set(scene.uuid, model);
      this.loadImagesFromConfig(model);

      // 🔥 AUTO-LOAD: Check if we have cached landmarks for this file
      if (loadStaticLandmarks) {
        await this.loadLandmarksFromCache(model);
      }

      // 🔥 Auto-select first model if none selected
      if (!this.selectedModelId) {
        this.setSelectedModelId(scene.uuid);
      } else if (this.selectedModelId === scene.uuid) {
        this._libState.cameraManager.focusCameraTo([scene]);
      }
      return scene.uuid;
    } catch (error) {
      console.error('[MeshesManager] Failed to load GLB:', error);
      throw error;
    }
  };

  async loadAllStaticLandmarks() {
    const models = this.modelsList;
    for (const model of models) {
      await this.loadLandmarksFromCache(model);
    }
  }

  clear() {
    this._models.forEach((m) => m.skirt.clear());
    this._models.clear();
    this.selectedModelId = null;
    this._libState.skirtStore.clear();
  }
}
