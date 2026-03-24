import { CameraControls } from '@react-three/drei';
import { makeAutoObservable } from 'mobx';
import * as THREE from 'three';

import { Utils3D } from '../utils/Utils3D';
import { StateManager } from './StateManager';

export class CameraManager {
  private static readonly FIT_PADDING_RATIO = 0.04;
  private static readonly MIN_DISTANCE_RATIO = 0.05;
  private static readonly MAX_DISTANCE_RATIO = 3;

  private _libState: StateManager;
  private _cameraRef: CameraControls | null = null;
  constructor(libState: StateManager) {
    this._libState = libState;
    makeAutoObservable(this);
  }

  setCameraRef(camera: CameraControls) {
    this._cameraRef = camera;

    const selectedScene = this._libState.meshesManager.selectedModel?.scene;
    if (selectedScene) {
      this.focusCameraTo([selectedScene]);
    }
  }

  get cameraRef() {
    return this._cameraRef;
  }

  public resetCameraToRef = () => {
    const scene = this._libState.meshesManager.selectedModel?.scene;
    if (scene) {
      this.focusCameraTo([scene]);
    }
  };

  public focusCameraTo = (obj: THREE.Object3D[]) => {
    const item = Array.isArray(obj) ? obj[obj.length - 1] : obj;
    const controls = this._cameraRef;

    if (!controls) {
      return;
    }

    item.updateWorldMatrix(true, true);

    const { boundingBox, center, size } = Utils3D.getSizeAndCenter(item);
    if (boundingBox.isEmpty()) {
      return;
    }

    const maxDimension = Math.max(size.x, size.y, size.z, 1);
    const fitDistance = Math.max(
      controls.getDistanceToFitBox(size.x, size.y, size.z),
      maxDimension,
    );
    const fitPadding = Math.max(
      maxDimension * CameraManager.FIT_PADDING_RATIO,
      0.5,
    );

    controls.minDistance = Math.max(
      0.01,
      fitDistance * CameraManager.MIN_DISTANCE_RATIO,
    );
    controls.maxDistance = Math.max(
      controls.minDistance + 1,
      fitDistance * CameraManager.MAX_DISTANCE_RATIO,
    );
    controls.infinityDolly = false;

    const currentPosition = controls.getPosition(new THREE.Vector3());
    const viewDirection = new THREE.Vector3(0, 0, 1);
    if (
      Number.isFinite(currentPosition.x) &&
      Number.isFinite(currentPosition.y) &&
      Number.isFinite(currentPosition.z) &&
      currentPosition.distanceToSquared(center) > 0
    ) {
      viewDirection.copy(currentPosition.sub(center).normalize());
    }

    const cameraPosition = center
      .clone()
      .add(viewDirection.multiplyScalar(fitDistance * 1.05));

    controls.setLookAt(
      cameraPosition.x,
      cameraPosition.y,
      cameraPosition.z,
      center.x,
      center.y,
      center.z,
      true,
    );
    controls.fitToBox(boundingBox, true, {
      paddingBottom: fitPadding,
      paddingLeft: fitPadding,
      paddingRight: fitPadding,
      paddingTop: fitPadding,
    });
  };
}
