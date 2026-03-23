import { makeAutoObservable } from 'mobx';

import { StateManager } from './StateManager';

export class SkirtStore {
  private _libState: StateManager;

  // 🔥 Track active skirt type for landmark selection (Global setting)
  activeSkirtType: 'allstar_skirt_end' | 'school_skirt_end' =
    'allstar_skirt_end';

  constructor(libState: StateManager) {
    this._libState = libState;
    makeAutoObservable(this);
  }

  setActiveSkirtType(type: 'allstar_skirt_end' | 'school_skirt_end') {
    this.activeSkirtType = type;
  }

  clear() {
    // Global settings don't necessarily need clearing,
    // but we can reset to default if needed.
    this.activeSkirtType = 'allstar_skirt_end';
  }
}
