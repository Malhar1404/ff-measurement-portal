import { makeAutoObservable } from 'mobx';

import { AdjustableSkirtManager } from './AdjustableSkirtManager';
import { CameraManager } from './CameraManager';
import { EnvManager } from './EnvManager';
import { MeshesManager } from './MeshesManager';
import { SkirtStore } from './SkirtStore';
import { ViewManager } from './ViewManager';

export class StateManager {
  constructor() {
    makeAutoObservable(this);
  }

  private _skirtStore = new SkirtStore(this);
  private _viewManager = new ViewManager(this);
  private _adjustableSkirtManager = new AdjustableSkirtManager(this);
  get viewManager() {
    return this._viewManager;
  }

  private _meshesManager = new MeshesManager(this);
  get meshesManager() {
    return this._meshesManager;
  }

  private _cameraManager = new CameraManager(this);

  get cameraManager() {
    return this._cameraManager;
  }

  private _envManager = new EnvManager();

  get envManager() {
    return this._envManager;
  }
  get skirtStore() {
    return this._skirtStore;
  }
  get adjustableSkirtManager() {
    return this._adjustableSkirtManager;
  }
}
