import { CameraControls } from '@react-three/drei';
import { makeAutoObservable } from 'mobx';
import * as THREE from 'three';

import { Utils3D } from '../utils/Utils3D';
import { StateManager } from './StateManager';

export class CameraManager {
  private _libState: StateManager;
  private _cameraRef: CameraControls | null = null;
  constructor(libState: StateManager) {
    this._libState = libState;
    makeAutoObservable(this);
  }

  setCameraRef(camera: CameraControls) {
    this._cameraRef = camera;
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
    // let center = Utils3D.calculateCenter(obj);
    const item = Array.isArray(obj) ? obj[obj.length - 1] : obj;

    const targetZ = -1;
    const { boundingBox, center } = Utils3D.getSizeAndCenter(item);
    if (item instanceof THREE.Mesh) {
      const { center: meshCenter } = Utils3D.getCenterPointAndNormal(
        item as THREE.Mesh,
      );

      const targetX = Math.abs(meshCenter.x);

      this._cameraRef?.setLookAt(
        center.x,
        center.y,
        center.z,
        targetX,
        meshCenter.y,
        targetZ,
        true,
      );
    } else {
      this._cameraRef?.setLookAt(
        center.x,
        center.y,
        center.z,
        0,
        center.y,
        targetZ,
        true,
      );
    }
    this._cameraRef?.fitToBox(boundingBox, true);
  };
}
