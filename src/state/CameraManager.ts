import { CameraControls } from "@react-three/drei";
import { makeAutoObservable } from "mobx";
import * as THREE from "three";

import { Utils3D } from "../utils/Utils3D";
import { StateManager } from "./StateManager";

export class CameraManager {
  private static readonly FIT_PADDING_RATIO = 0.04;
  private static readonly MIN_DISTANCE_RATIO = 0.05;
  private static readonly MAX_DISTANCE_RATIO = 3;

  private _libState: StateManager;
  private _cameraRefs: Set<CameraControls> = new Set();
  constructor(libState: StateManager) {
    this._libState = libState;
    makeAutoObservable(this);
  }

  registerCameraRef(camera: CameraControls) {
    this._cameraRefs.add(camera);

    const selectedScene = this._libState.meshesManager.selectedModel?.scene;
    if (selectedScene) {
      this.focusCameraTo([selectedScene]);
    }
  }

  unregisterCameraRef(camera: CameraControls) {
    this._cameraRefs.delete(camera);
  }

  setCameraRef(camera: CameraControls) {
    this.registerCameraRef(camera);
  }

  get cameraRef() {
    return this._cameraRefs.values().next().value ?? null;
  }

  get cameraRefs() {
    return Array.from(this._cameraRefs);
  }

  public resetCameraToRef = () => {
    const scene = this._libState.meshesManager.selectedModel?.scene;
    if (scene) {
      this.focusCameraTo([scene]);
    }
  };

  public focusCameraTo = (obj: THREE.Object3D[]) => {
    const item = Array.isArray(obj) ? obj[obj.length - 1] : obj;
    const controls = this._cameraRefs;

    if (controls.size === 0) {
      return;
    }

    item.updateWorldMatrix(true, true);

    const { boundingBox, center, size } = Utils3D.getSizeAndCenter(item);
    if (boundingBox.isEmpty()) {
      return;
    }

    for (const control of controls) {
      const maxDimension = Math.max(size.x, size.y, size.z, 1);
      const fitDistance = Math.max(
        control.getDistanceToFitBox(size.x, size.y, size.z),
        maxDimension,
      );
      const fitPadding = Math.max(
        maxDimension * CameraManager.FIT_PADDING_RATIO,
        0.5,
      );

      control.minDistance = Math.max(
        0.01,
        fitDistance * CameraManager.MIN_DISTANCE_RATIO,
      );
      control.maxDistance = Math.max(
        control.minDistance + 1,
        fitDistance * CameraManager.MAX_DISTANCE_RATIO,
      );
      control.infinityDolly = false;

      const currentPosition = control.getPosition(new THREE.Vector3());
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

      control.setLookAt(
        cameraPosition.x,
        cameraPosition.y,
        cameraPosition.z,
        center.x,
        center.y,
        center.z,
        true,
      );
      control.fitToBox(boundingBox, true, {
        paddingBottom: fitPadding,
        paddingLeft: fitPadding,
        paddingRight: fitPadding,
        paddingTop: fitPadding,
      });
    }
  };
}
