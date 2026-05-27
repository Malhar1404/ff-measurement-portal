import { makeAutoObservable } from 'mobx';
import * as THREE from 'three';

import { BodyMeasurementPoints } from '../types';
import {
  MeshSliceResult,
  SkirtGeometryUtils,
} from '../utils/SkirtGeometryUtils';
import { Utils3D } from '../utils/Utils3D';
import { SkirtInstance } from './SkirtInstance';
import { StateManager } from './StateManager';
import { ModelStatus } from '../types/api';

export type ModelLoadState = 'loading' | 'ready' | 'failed';

export interface SerializedSlicePoint {
  x: number;
  y: number;
  z: number;
}

export interface SerializedLandmarkSlice {
  plane_y: number;
  contours: SerializedSlicePoint[][];
  largest_contour: SerializedSlicePoint[];
}

export interface SingleLandmark {
  color: string;
  name: string;
  originalPosition?: THREE.Vector3;
  originalSliceData?: MeshSliceResult | null;
  position: THREE.Vector3;
  sliceData?: MeshSliceResult | null;
  slicePreview?: MeshSliceResult | null;
  positionSliceData ?: MeshSliceResult | null;
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
  dbId: string | null = null;
  status: ModelStatus = 'not_checked';
  loadState: ModelLoadState = 'loading';
  loadError: string | null = null;


  // Data isolation
  landmarks: LandmarkType = {
    'MediaPipe landmarks': [],
    'Mesh landmarks': [],
  };
  lineData: BodyMeasurementPoints | null = null;
  landmarkResponse: any = null;
  measurementResponse: any = null;
  selectedMeshLandmarkName: string | null = null;
  modelComment: string = '';

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

  setMeasurementResponse(response: any) {
    this.measurementResponse = response;
  }

  setImages(images: string[]) {
    this.images = images;
  }
  setModelComment(comment: string) {
    this.modelComment = comment;
  }
  setStatus(status: ModelStatus) {
    this.status = status;
  }

  setLoadState(loadState: ModelLoadState) {
    this.loadState = loadState;
    if (loadState !== 'failed') {
      this.loadError = null;
    }
  }

  setLoadError(message: string) {
    this.loadState = 'failed';
    this.loadError = message;
  }

  get isReady() {
    return this.loadState === 'ready';
  }

  get isLoading() {
    return this.loadState === 'loading';
  }

  private resolveLandmarkPoint(data: any, landmarkName: string) {
    return (
      data?.mesh_landmarks?.[landmarkName] ??
      data?.pose_landmarks?.pose_landmarks?.[landmarkName]?.point_3d ??
      null
    );
  }

  private getLandmarkPointMap(data: any, landmarkNames: string[]) {
    return landmarkNames
      .map((name) => ({
        name,
        raw: this.resolveLandmarkPoint(data, name),
      }))
      .filter((landmark) => landmark.raw);
  }

  private getOriginalLandmarkPoint(
    ogLandmarks: any,
    landmarkName: string,
    fallbackRaw: any,
  ) {
    const candidates = Array.isArray(ogLandmarks)
      ? ogLandmarks
      : [ogLandmarks];

    for (const candidate of candidates) {
      const rawPoint = this.resolveLandmarkPoint(candidate, landmarkName);
      if (rawPoint) {
        return rawPoint;
      }
    }

    return this.extractLandmarkPosition(fallbackRaw);
  }
  updateMeshLandmarkPosition(
    landmarkName: string,
    position: THREE.Vector3,
  ) {
    const landmark = this.landmarks['Mesh landmarks'].find(
      (item) => item.name === landmarkName,
    );

    if (!landmark) {
      return;
    }

    landmark.position = position.clone();
    landmark.sliceData = null;
    landmark.slicePreview = null;
    this.updateSkirt();
  }

  updateMeshLandmarkSlicePreview(
    landmarkName: string,
    slicePreview: MeshSliceResult | null,
  ) {
    const landmark = this.landmarks['Mesh landmarks'].find(
      (item) => item.name === landmarkName,
    );

    if (!landmark) {
      return;
    }

    landmark.slicePreview = slicePreview;
  }

  updateMeshLandmarkPositionSlice(landmarkName: string, slice: any) {
  const landmark = this.landmarks['Mesh landmarks'].find(
    (l) => l.name === landmarkName,
  );
  if (landmark) {
    landmark.positionSliceData = slice;
  }
}

  commitMeshLandmarkSlice(
    landmarkName: string,
    sliceData: MeshSliceResult | null,
  ) {
    const landmark = this.landmarks['Mesh landmarks'].find(
      (item) => item.name === landmarkName,
    );

    if (!landmark) {
      return;
    }

    landmark.sliceData = sliceData;
    landmark.position 
    landmark.slicePreview = null;
  }

  toggleMeshLandmarkSelection(landmarkName: string) {
    this.markMeshLandmarkEditing(landmarkName);
  }

  markMeshLandmarkEditing(landmarkName: string) {
    const isAlreadyEditingSelected =
      this.selectedMeshLandmarkName === landmarkName &&
      this.landmarks['Mesh landmarks'].find((item) => item.name === landmarkName)
        ?.color === 'red';

    if (isAlreadyEditingSelected) {
      const activeLandmark = this.landmarks['Mesh landmarks'].find(
        (item) => item.name === landmarkName,
      );

      if (activeLandmark) {
        activeLandmark.color = 'yellow';
        activeLandmark.slicePreview = null;
      }

      this.selectedMeshLandmarkName = null;
      return;
    }

    this.landmarks['Mesh landmarks'].forEach((landmark) => {
      if (landmark.color === 'red') {
        landmark.color = 'yellow';
      }
    });

    const landmark = this.landmarks['Mesh landmarks'].find(
      (item) => item.name === landmarkName,
    );

    if (landmark) {
      landmark.color = 'red';
      this.selectedMeshLandmarkName = landmarkName;
    }
  }

  markMeshLandmarkSaved(landmarkName: string) {
    const landmark = this.landmarks['Mesh landmarks'].find(
      (item) => item.name === landmarkName,
    );

    if (landmark) {
      landmark.color = 'green';
      landmark.slicePreview = null;
      this.selectedMeshLandmarkName = null;
    }
  }

  processLandmarkResponse(data: any,model_status:ModelStatus,ogLandmarks:any) {
    this.landmarkResponse = data;
    const lms = this.getLandmarkPointMap(data, [
      'mid_waist_landmark',
      'narrow_waist_landmark',
      'allstar_skirt_end_landmark',
      'school_skirt_end_landmark',
    ]);

    if (lms.length === 0) {
      return;
    }

    const vectors = lms.map(
      (l) => {
        const pos = this.extractLandmarkPosition(l.raw);
        return new THREE.Vector3(pos.x, pos.y, pos.z);
      },
    );
    const corrected = Utils3D.checkRayCastOnZAxis(this.scene, vectors);
    const mesh = this.getPrimaryMesh();

    if (mesh) {
      mesh.updateWorldMatrix(true, true);
    }

    const landmarkObjects = lms.map((l, i) => {
      const originalPoint = this.getOriginalLandmarkPoint(ogLandmarks, l.name, l.raw);

      return {
        color:
          model_status === 'approved'
            ? 'green'
            : model_status === 'pending'
              ? 'red'
              : 'yellow',
        name: l.name,
        originalPosition: new THREE.Vector3(
          originalPoint.x,
          originalPoint.y,
          originalPoint.z,
        ),
        originalSliceData: mesh
          ? SkirtGeometryUtils.sliceMeshContoursAtY(mesh, originalPoint.y)
          : null,
        position: corrected[i],
        positionSliceData: mesh
          ? SkirtGeometryUtils.sliceMeshContoursAtY(mesh, corrected[i].y)
          : null,
        sliceData: this.deserializeLandmarkSlice(l.raw),
        slicePreview: null,
      };
    });

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
        originalPosition: (() => {
          const originalPoint = this.getOriginalLandmarkPoint(
            ogLandmarks,
            p.name,
            p.vector,
          );
          return new THREE.Vector3(
            originalPoint.x,
            originalPoint.y,
            originalPoint.z,
          );
        })(),
        originalSliceData: null,
        position: correctedPose[i],
        sliceData: null,
        slicePreview: null,
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
  get comment() {
    return this.modelComment;
  }
  get hasMeasurements() {
    return this.lineData !== null;
  }

  get unsavedMeshLandmarks() {
    return this.landmarks['Mesh landmarks'].filter(
      (landmark) => landmark.color !== 'green',
    );
  }

  get allMeshLandmarksSaved() {
    const meshLandmarks = this.landmarks['Mesh landmarks'];
    return meshLandmarks.length > 0 && this.unsavedMeshLandmarks.length === 0;
  }

  get isApproved() {
    return this.allMeshLandmarksSaved;
  }
  get isPending() {
    return !this.allMeshLandmarksSaved && this.unsavedMeshLandmarks.length < 3;
  }

  get meshLandmarksSavedCount() {
    return this.landmarks['Mesh landmarks'].filter(
      (landmark) => landmark.color === 'green',
    ).length;
  }

  private serializeLandmarkGroup(
    landmarks: SingleLandmark[],
    useOriginal = false,
  ) {
    return landmarks.reduce((acc, landmark) => {
      const point = useOriginal && landmark.originalPosition
        ? landmark.originalPosition
        : landmark.position;

      acc[landmark.name] = {
        x: point.x,
        y: point.y,
        z: point.z,
      };
      return acc;
    }, {} as Record<string, any>);
  }

  getSerializedLandmarkPayload() {
    return {
      mesh_landmarks: this.serializeLandmarkGroup(this.landmarks['Mesh landmarks']),
      mediapipe_landmarks: this.serializeLandmarkGroup(this.landmarks['MediaPipe landmarks']),
      original_mesh_landmarks: this.serializeLandmarkGroup(this.landmarks['Mesh landmarks'], true),
      original_mediapipe_landmarks: this.serializeLandmarkGroup(this.landmarks['MediaPipe landmarks'], true),
    };
  }

  serializeLandmarkSlice(sliceData?: MeshSliceResult | null): SerializedLandmarkSlice | undefined {
    if (!sliceData) {
      return undefined;
    }

    return {
      plane_y: sliceData.planeY,
      contours: sliceData.contours.map((contour) =>
        contour.map((point) => this.serializeVector3(point)),
      ),
      largest_contour: sliceData.largestContour.map((point) =>
        this.serializeVector3(point),
      ),
    };
  }

  private extractLandmarkPosition(rawLandmark: any) {
    if (
      rawLandmark &&
      typeof rawLandmark === 'object' &&
      'x' in rawLandmark &&
      'y' in rawLandmark &&
      'z' in rawLandmark
    ) {
      return rawLandmark;
    }

    if (rawLandmark?.position) {
      return rawLandmark.position;
    }

    return { x: 0, y: 0, z: 0 };
  }

  private deserializeLandmarkSlice(rawLandmark: any): MeshSliceResult | null {
    const slice = rawLandmark?.slice;

    if (!slice?.largest_contour?.length) {
      return null;
    }

    return {
      planeY: slice.plane_y ?? this.extractLandmarkPosition(rawLandmark).y,
      contours: Array.isArray(slice.contours)
        ? slice.contours.map((contour: SerializedSlicePoint[]) =>
          contour.map((point) => this.deserializeVector3(point)),
        )
        : [],
      largestContour: slice.largest_contour.map((point: SerializedSlicePoint) =>
        this.deserializeVector3(point),
      ),
      sampledLargestContour: slice.largest_contour.map(
        (point: SerializedSlicePoint) => this.deserializeVector3(point),
      ),
    };
  }

  private serializeVector3(point: THREE.Vector3): SerializedSlicePoint {
    return {
      x: point.x,
      y: point.y,
      z: point.z,
    };
  }

  private deserializeVector3(point: SerializedSlicePoint) {
    return new THREE.Vector3(point.x, point.y, point.z);
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

    const bottom =
      mp.find((l) => l.name === bottomLandmarkName)?.position ||
      meshLm.find((l) => l.name === bottomLandmarkName)?.position;

    if (waist && bottom) {
      const syntheticHip = new THREE.Vector3(
        waist.x,
        (waist.y + bottom.y) / 2,
        waist.z,
      );
      this.skirt.updateFromLandmarks(mesh, waist, bottom, syntheticHip);
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
