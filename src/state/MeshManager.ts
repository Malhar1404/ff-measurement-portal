import { makeAutoObservable } from 'mobx';
import * as THREE from 'three';

import { BodyMeasurementPoints } from '../types';
import { Utils3D } from '../utils/Utils3D';
import { SkirtInstance } from './SkirtInstance';
import { StateManager } from './StateManager';

export interface SingleLandmark {
  color: string;
  name: string;
  position: THREE.Vector3;
}

export interface LandmarkType {
  'MediaPipe landmarks': SingleLandmark[];
  'Mesh landmarks': SingleLandmark[];
}

export class MeshManager {
  id: string;
  scene: THREE.Group;
  fileName?: string;
  blobUrl: string;
  category: 'adult' | 'kid' = 'adult';
  images: string[] = [];

  // Data isolation
  landmarks: LandmarkType = {
    'MediaPipe landmarks': [],
    'Mesh landmarks': [],
  };
  lineData: BodyMeasurementPoints | null = null;
  landmarkResponse: any = null;
  measurementResponse: any = null;

  // Each mesh has its own skirt instance
  skirt: SkirtInstance;

  private _libState: StateManager;

  constructor(
    id: string,
    scene: THREE.Group,
    blobUrl: string,
    libState: StateManager,
    fileName?: string,
    category: 'adult' | 'kid' = 'adult',
  ) {
    this.id = id;
    this.scene = scene;
    this.blobUrl = blobUrl;
    this.fileName = fileName;
    this.category = category;
    this._libState = libState;
    this.skirt = new SkirtInstance(id);

    makeAutoObservable(this);
  }

  setLandmarks(landmarks: LandmarkType) {
    this.landmarks = landmarks;
    this.updateSkirt();
  }

  setLineData(lineData: BodyMeasurementPoints) {
    this.lineData = lineData;
  }

  setLandmarkResponse(response: any) {
    this.landmarkResponse = response;
  }

  setMeasurementResponse(response: any) {
    this.measurementResponse = response;
  }

  setImages(images: string[]) {
    this.images = images;
  }

  processLandmarkResponse(data: any) {
    this.landmarkResponse = data;

    // Process core landmarks
    const meshLm = data.mesh_landmarks;
    if (!meshLm) return;

    const lms = [
      { name: 'chest_landmark', pos: meshLm.chest_landmark },
      { name: 'hip_landmark', pos: meshLm.hip_landmark },
      { name: 'narrow_waist_landmark', pos: meshLm.narrow_waist_landmark },
    ];

    const vectors = lms.map(
      (l) => new THREE.Vector3(l.pos.x, l.pos.y, l.pos.z),
    );
    const corrected = Utils3D.checkRayCastOnZAxis(this.scene, vectors);

    const landmarkObjects = lms.map((l, i) => ({
      color:
        l.name === 'chest_landmark'
          ? 'red'
          : l.name === 'hip_landmark'
            ? 'green'
            : 'blue',
      name: l.name,
      position: corrected[i],
    }));

    // Process pose landmarks
    const poseLandmarksGroup = data.pose_landmarks?.pose_landmarks;
    if (poseLandmarksGroup) {
      const poseVectors = Object.entries(poseLandmarksGroup)
        .filter(([name]) => name !== 'left_hip' && name !== 'right_hip')
        .map(([name, pData]: [string, any]) => ({
          name,
          vector: new THREE.Vector3(
            pData.point_3d.x,
            pData.point_3d.y,
            pData.point_3d.z,
          ),
        }));

      const correctedPose = Utils3D.checkRayCastOnZAxis(
        this.scene,
        poseVectors.map((p) => p.vector),
      );

      const poseLandmarkObjects = poseVectors.map((p, i) => ({
        color: 'orange',
        name: p.name,
        position: correctedPose[i],
      }));

      this.setLandmarks({
        'MediaPipe landmarks': poseLandmarkObjects,
        'Mesh landmarks': landmarkObjects,
      });
    } else {
      this.setLandmarks({
        'MediaPipe landmarks': [],
        'Mesh landmarks': landmarkObjects,
      });
    }
  }

  get hasLandmarks() {
    return (
      this.landmarks['MediaPipe landmarks'].length > 0 ||
      this.landmarks['Mesh landmarks'].length > 0
    );
  }

  get hasMeasurements() {
    return this.lineData !== null;
  }

  private updateSkirt() {
    const mesh = this.getPrimaryMesh();
    if (!mesh) return;

    const mp = this.landmarks['MediaPipe landmarks'];
    const meshLm = this.landmarks['Mesh landmarks'];

    // Pick correct waist and bottom based on active type
    const activeType = this._libState.skirtStore.activeSkirtType;

    const waistLandmarkName =
      activeType === 'allstar_skirt_end'
        ? 'mid_waist_landmark'
        : 'narrow_waist_landmark';

    const bottomLandmarkName =
      activeType === 'allstar_skirt_end'
        ? 'allstar_skirt_end_landmark'
        : 'school_skirt_end_landmark';

    // Find waist in either mp or meshLm
    const waist =
      mp.find((l) => l.name === waistLandmarkName)?.position ||
      meshLm.find((l) => l.name === waistLandmarkName)?.position;

    const bottom = mp.find((l) => l.name === bottomLandmarkName)?.position;

    const hip =
      meshLm.find((l) => l.name === 'hip_landmark')?.position ||
      mp.find((l) => l.name.includes('hip_landmark'))?.position;

    if (waist && bottom) {
      this.skirt.updateFromLandmarks(mesh, waist, bottom, hip);
    }
  }

  getPrimaryMesh(): THREE.Mesh | null {
    let mesh: THREE.Mesh | null = null;
    this.scene.traverse((child) => {
      if (!mesh && (child as THREE.Mesh).isMesh) {
        mesh = child as THREE.Mesh;
      }
    });
    return mesh;
  }
}
