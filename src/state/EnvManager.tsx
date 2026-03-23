import { makeAutoObservable } from 'mobx';
import * as THREE from 'three';

import { Logger } from '../utils/Logger';
import { Utils3D } from '../utils/Utils3D';

export class EnvManager {
  private _envVisibility = false;
  private _envIntensity = 1.6;
  private _envRotation: { x: number; y: number; z: number } = {
    x: 0,
    y: 0,
    z: 1.5,
  };
  private _environmentTexture: THREE.Texture | null = null;

  constructor() {
    makeAutoObservable(this);
  }

  get envVisibility() {
    return this._envVisibility;
  }

  setEnvVisibility(visibility: boolean) {
    this._envVisibility = visibility;
  }

  get envIntensity() {
    return this._envIntensity;
  }

  setEnvIntensity(intensity: number) {
    this._envIntensity = intensity;
  }

  get envRotation() {
    return this._envRotation;
  }

  setEnvRotation(rotation: { x: number; y: number; z: number }) {
    this._envRotation = rotation;
  }

  get environmentTexture() {
    return this._environmentTexture;
  }

  setEnvironmentTexture(texture: THREE.Texture) {
    this._environmentTexture = texture;
  }

  async handleEnvUpload(file: File) {
    try {
      const texture = await Utils3D.loadEnvironmentTexture(file);
      this.setEnvironmentTexture(texture);
    } catch (error) {
      Logger.error(`Failed to load environment: ${error}`);
    }
  }

  clearMap = (mapType: string) => {
    if (mapType === 'envMap') {
      this._envVisibility = false;
      this._envIntensity = 1.6;
      this._envRotation = { x: 0, y: 0, z: 1.5 };
      this._environmentTexture = null;
    }
  };
}
