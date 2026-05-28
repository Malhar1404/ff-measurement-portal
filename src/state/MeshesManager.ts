import { makeAutoObservable, ObservableMap, reaction } from 'mobx';
import * as THREE from 'three';
import { ApiModelDetail, ModelStatus } from '../types/api';


import { APP_CONFIG } from '../config/appConfig';
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
    if (this.selectedModelId === id) {
      return;
    }

    if (id && this._models.has(id) && !this._models.get(id)!.isReady) {
      this._libState.viewManager.addLog('That model is still loading.', 'warning');
      return;
    }

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
    return this.modelsList
      .filter((m) => m.isReady)
      .map((m) => m.scene);
  }

  // Compatibility getter for older components if needed
  get glbData() {
    return this.modelsList.map((m) => ({
      blobUrl: m.blobUrl,
      fileName: m.fileName,
      scene: m.scene,
    }));
  }

  private createApiModelEntry(apiModel: ApiModelDetail) {
    const placeholderScene = new THREE.Group();
    placeholderScene.name = apiModel.model_name || 'Loading model';

    const fileName =
      apiModel.model_name ||
      apiModel.model_glb_url.split('/').pop()?.split('\\').pop() ||
      'Model';

    const model = new MeshManager(
      placeholderScene.uuid,
      placeholderScene,
      apiModel.model_glb_url,
      this._libState,
      fileName,
      apiModel.category,
    );

    model.dbId = apiModel.model_id;
    model.status = apiModel.status;
    model.setLoadState('loading');

    if (apiModel.images && apiModel.images.length > 0) {
      model.setImages(apiModel.images.map((img) => img.image_url));
    }

    if (apiModel.comments && apiModel.comments.length > 0) {
      model.setModelComment(apiModel.comments[0].comment);
    }

    this._models.set(model.id, model);
    return model;
  }

  /* ===============================
     LANDMARK UPDATE
     =============================== */

  private normalizeStaticLandmarkData(data: any) {
    if (!data) return null;

    if (data.mesh_landmarks) {
      return data;
    }

    const firstKey = Object.keys(data)[0];
    if (firstKey && data[firstKey]?.mesh_landmarks) {
      return data[firstKey];
    }

    return null;
  }

  async loadLandmarksFromCache(model: MeshManager) {
    const fileName = model.fileName;
    if (!fileName) return;

    const baseName = fileName.split('.').slice(0, -1).join('.') || fileName;
    const jsonPath = `/landmark_json/${encodeURIComponent(baseName)}_landmarks.json`;

    try {
      const response = await fetch(jsonPath);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const rawData = await response.json();
      const landmarkData = this.normalizeStaticLandmarkData(rawData);

      if (!landmarkData) {
        throw new Error(`Unexpected landmark JSON structure for ${fileName}`);
      }

      model.processLandmarkResponse(
        landmarkData,
        model.status,
        [landmarkData],
      );
      this._libState.viewManager.addLog(
        `Loaded local landmarks: ${jsonPath}`,
        'success',
      );
    } catch (error) {
      console.warn(
        `Could not load static landmark JSON for ${fileName} at ${jsonPath}`,
        error,
      );
      this._libState.viewManager.addLog(
        `Failed to load local landmarks for ${fileName}`,
        'warning',
      );
    }
  }

  async loadAllStaticLandmarks() {
    for (const model of this.modelsList) {
      await this.loadLandmarksFromCache(model);
    }
  }

  private async loadModelLandmarks(
    model: MeshManager,
    apiModel: ApiModelDetail,
  ) {
    if (!apiModel.landmarks_url) {
      return;
    }

    try {
      const normalizeLandmarkData = async (url: string) => {
        const response = await fetch(`${url}?t=${Date.now()}`);
        if (!response.ok) {
          return null;
        }

        const data = await response.json();
        let landmarkData = data;
        if (!data.mesh_landmarks && Object.keys(data).length > 0) {
          const firstKey = Object.keys(data)[0];
          if (data[firstKey] && data[firstKey].mesh_landmarks) {
            landmarkData = data[firstKey];
          }
        }
        return landmarkData;
      };

      const currentLandmarkData = await normalizeLandmarkData(apiModel.landmarks_url);
      const originalLandmarkData = apiModel.original_landmarks_url
        ? await normalizeLandmarkData(apiModel.original_landmarks_url)
        : currentLandmarkData;

      if (currentLandmarkData) {
        model.processLandmarkResponse(
          currentLandmarkData,
          apiModel.status,
          [originalLandmarkData ?? currentLandmarkData],
        );
        this._libState.viewManager.addLog(`Loaded landmarks for ${model.fileName}`, 'success');
      }
    } catch (error) {
      console.warn(
        `Could not fetch S3 landmark JSON for ${model.fileName} at ${apiModel.landmarks_url}`,
      );
      this._libState.viewManager.addLog(
        `Failed to fetch S3 landmarks for ${model.fileName}`,
        'warning',
      );
    }
  }

  private async hydrateApiModel(model: MeshManager, apiModel: ApiModelDetail) {
    try {
      const scene = await Utils3D.loadGLTF(apiModel.model_glb_url);

      scene.traverse((obj) => {
        if (obj instanceof THREE.Mesh) {
          obj.material = obj.material.clone();
        }
      });

      model.scene.clear();
      model.scene.copy(scene, true);
      model.scene.name = scene.name || model.scene.name;
      model.setLoadState('ready');

      if (!this.selectedModelId) {
        this.setSelectedModelId(model.id);
      } else if (this.selectedModelId === model.id) {
        this._libState.cameraManager.focusCameraTo([model.scene]);
      }

      void this.loadModelLandmarks(model, apiModel);
    } catch (error) {
      console.error('[MeshesManager] Failed to hydrate API model:', error);
      model.setLoadError(
        error instanceof Error ? error.message : 'Failed to load model',
      );
      this._libState.viewManager.addLog(
        `Failed to load model ${model.fileName}`,
        'error',
      );
    }
  }

  private async loadApiModelsBatch(
    stagedModels: Array<{ model: MeshManager; apiModel: ApiModelDetail }>,
    concurrency: number,
  ) {
    const queue = [...stagedModels];
    const workerCount = Math.min(concurrency, queue.length);

    const workers = Array.from({ length: workerCount }, async () => {
      while (queue.length > 0) {
        const next = queue.shift();
        if (!next) {
          return;
        }

        await this.hydrateApiModel(next.model, next.apiModel);
      }
    });

    await Promise.all(workers);
  }

  async loadApiModelsStaged(apiModels: ApiModelDetail[], initialBatchSize = 10) {
    const stagedModels = apiModels.map((apiModel) => ({
      apiModel,
      model: this.createApiModelEntry(apiModel),
    }));

    const initialModels = stagedModels.slice(0, initialBatchSize);
    const backgroundModels = stagedModels.slice(initialBatchSize);

    await this.loadApiModelsBatch(initialModels, 3);

    if (backgroundModels.length > 0) {
      void this.loadApiModelsBatch(backgroundModels, 2);
    }
  }

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

  exportLandmarks(): {
    current: Record<string, Record<string, any>>;
    original: Record<string, Record<string, any>>;
    fileName: string;
  } {
    const selected = this.selectedModel;
    if (!selected || selected.landmarks['Mesh landmarks'].length === 0) {
      this._libState.viewManager.addLog(
        'No landmark data for selected model to export.',
        'warning',
      );
      return {
        current: {},
        original: {},
        fileName: '',
      };
    }

    const rawFileName = selected.fileName || 'model.glb';
    const serialized = selected.getSerializedLandmarkPayload();

    return {
      current: {
        [rawFileName]: {
          mesh_landmarks: serialized.mesh_landmarks,
          mediapipe_landmarks: serialized.mediapipe_landmarks,
        },
      },
      original: {
        [rawFileName]: {
          mesh_landmarks: serialized.original_mesh_landmarks,
          mediapipe_landmarks: serialized.original_mediapipe_landmarks,
        },
      },
      fileName: rawFileName,
    };
  }

  // async loadLandmarksFromCache(model: MeshManager) {
  //   const fileName = model.fileName;
  //   if (!fileName) return;

  //   const baseName = fileName.split('.')[0];
  //   const jsonPath = `/landmark_json/${baseName}_landmarks.json`;

  //   try {
  //     const response = await fetch(jsonPath);
  //     if (response.ok) {
  //       const data = await response.json();
  //       // The JSON might be { "filename": {data} } or just {data}
  //       // User's export format was { "filename": {data} }
  //       const landmarkData = data[fileName] || data;
  //       model.processLandmarkResponse(landmarkData,);
  //       this._libState.viewManager.addLog(
  //         `Loaded static landmarks: ${jsonPath}`,
  //         'success',
  //       );
  //       return;
  //     }
  //   } catch (e) {
  //     console.warn(
  //       `Could not fetch static landmark JSON for ${fileName} at ${jsonPath}`,
  //     );
  //   }

  //   // Fallback to predefinedLandmarks.json (the hardcoded bundle)
  //   if ((cachedLandmarks as any)[fileName]) {
  //     const data = (cachedLandmarks as any)[fileName];
  //     model.processLandmarkResponse(data);
  //     this._libState.viewManager.addLog(
  //       `Applied hardcoded landmarks for: ${fileName}`,
  //       'info',
  //     );
  //   }
  // }

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
    loadStaticLandmarks = false,
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
      model.setLoadState('ready');

      // Local static landmark fallback kept for reference.
      // if (loadStaticLandmarks) {
      //   await this.loadLandmarksFromCache(model);
      // }

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

  addApiModel = async (apiModel: ApiModelDetail) => {
    if (!apiModel.model_glb_url) {
      throw new Error('GLB URL missing for API model');
    }

    const model = this.createApiModelEntry(apiModel);
    await this.hydrateApiModel(model, apiModel);
    return model.id;
  };

  // async loadAllStaticLandmarks() {
  //   const models = this.modelsList;
  //   for (const model of models) {
  //     await this.loadLandmarksFromCache(model);
  //   }
  // }

  clear() {
    this._models.forEach((m) => m.skirt.clear());
    this._models.clear();
    this.selectedModelId = null;
    this._libState.skirtStore.clear();
  }
}
