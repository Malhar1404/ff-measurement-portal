import { makeAutoObservable } from 'mobx';

import { StateManager } from './StateManager';

export type MidpointData = {
  position: { x: number; y: number; z: number };
  secondPointPos: { x: number; y: number; z: number };
};

export class AdjustableSkirtManager {
  private _libState: StateManager;

  bottomMidPoints: MidpointData[] = [];

  constructor(libState: StateManager) {
    this._libState = libState;
    makeAutoObservable(this);
  }

  updateBottomPoints(points: MidpointData[]) {
   
    if (points.length >= 2) {
    }

    this.bottomMidPoints = points;

    // Calculate current Y
    const currentY = this.currentBottomY;

    

    if (!this._libState.skirtStore) {
      console.error('  ❌ ERROR: skirtStore is null/undefined!');
      return;
    }

    // Trigger update
    if (currentY !== 0) {
      const selectedModel = this._libState.meshesManager.selectedModel;
      if (selectedModel) {
          selectedModel.skirt.updateBottomY(currentY);
      } else {
          console.warn('  ⚠️ No model selected, skipping update');
      }
    } else {
      console.warn('  ⚠️ currentY is 0, skipping update');
    }

  }

  get currentBottomY(): number {
    if (this.bottomMidPoints.length < 2) {
      return 0;
    }

    const avgY =
      (this.bottomMidPoints[0].position.y +
        this.bottomMidPoints[1].position.y) /
      2;

    return avgY;
  }

  get hasAdjustedBottom(): boolean {
    return this.bottomMidPoints.length > 0;
  }

  clear() {
    this.bottomMidPoints = [];
  }
}
