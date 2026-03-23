import { makeAutoObservable } from 'mobx';
import * as THREE from 'three';

import { SkirtGeometryUtils } from '../utils/SkirtGeometryUtils';

export class SkirtInstance {
  id: string; // Unique ID for this skirt instance (e.g. mesh UUID)

  // Computed centers (from geometry)
  computedCenterX = 0;
  computedCenterZ = 0;

  // Manual offsets (User interaction)
  offsetX = 0;
  offsetZ = 0;

  get centerX() {
    return this.computedCenterX + this.offsetX;
  }

  get centerZ() {
    return this.computedCenterZ + this.offsetZ;
  }

  // Y levels
  waistY = 0;
  hipY = 0;
  bottomY = 0;

  // Original bottom Y from landmarks (for reference)
  originalBottomY = 0;
  originalBottomRadius = 0;

  // Radii (NO LONGER USED for geometry, keeping for reference if needed by UI)
  waistRadius = 0;
  hipRadius = 0;
  bottomRadius = 0;

  // Plane cut points
  waistCutPoints: THREE.Vector3[] = [];
  hipCutPoints: THREE.Vector3[] = [];
  bottomCutPoints: THREE.Vector3[] = [];

  // Cut stop level (above hip)
  cutStopY = 0;

  // Skin contours (resampled)
  waistToHipContours: THREE.Vector3[][] = [];

  // Generated skirt geometry
  skirtGeometry: THREE.BufferGeometry | null = null;

  constructor(id: string) {
    this.id = id;
    makeAutoObservable(this);
  }

  setOffsets(x: number, z: number) {
    this.offsetX = x;
    this.offsetZ = z;
  }

  updateFromLandmarks(
    mesh: THREE.Mesh,
    waist: THREE.Vector3,
    bottom: THREE.Vector3,
    hip?: THREE.Vector3,
  ) {
    const oldWaistY = this.waistY;
    const oldHipY = this.hipY;

    this.updateLevels(waist, bottom, hip);
    this.originalBottomY = bottom.y;

    // 🔥 OPTIMIZATION: Only compute expensive plane cuts if waist or hip Y changed
    // Bottom Y change only affects buildSkirtGeometry (vertical drop), not contours
    if (
      this.waistToHipContours.length === 0 ||
      Math.abs(this.waistY - oldWaistY) > 0.001 ||
      Math.abs(this.hipY - oldHipY) > 0.001
    ) {
      this.computePlaneCuts(mesh);
    }

    this.buildSkirtGeometry();
  }

  private updateLevels(
    waist: THREE.Vector3,
    bottom: THREE.Vector3,
    hip?: THREE.Vector3,
  ) {
    this.waistY = waist.y;

    if (hip) {
      this.hipY = hip.y;
    } else {
      this.hipY = waist.y - 15; // fallback
    }

    // 🔥 NEW: Cut stop level is 20% above the hip-to-waist distance
    // This ensures we don't fit the actual hip bulge.
    const waistToHip = this.waistY - this.hipY;
    this.cutStopY = this.hipY + waistToHip * 0.2;

    // 🔥 CONSTRAINT: Bottom cannot move above hip point
    // (High Y values are "up", so we cap bottomY at hipY)
    let constrainedBottomY = bottom.y;

    // Cap at Hip Point (User Request: "move till hip level")
    if (constrainedBottomY > this.hipY) {
      constrainedBottomY = this.hipY;
    }

    this.bottomY = constrainedBottomY;
  }

  private computePlaneCuts(mesh: THREE.Mesh) {
    this.waistCutPoints = SkirtGeometryUtils.sliceMeshAtY(mesh, this.waistY);

    // 🔥 NEW: Use Bounding Box Center for consistent vertical alignment
    const bbox = new THREE.Box3().setFromObject(mesh);
    const center = new THREE.Vector3();
    bbox.getCenter(center);

    this.computedCenterX = center.x;
    this.computedCenterZ = center.z;

    // 🔥 REDUCED DENSITY: 20 internal segments
    const sliceCount = 20;
    this.waistToHipContours = [];

    // 🔥 MARGIN: Start 0.5 units below waist, end 0.5 units above hip-stop
    const startY = this.waistY - 0.5;
    const endY = this.cutStopY + 0.5;
    const distance = startY - endY;

    for (let i = 0; i < sliceCount; i++) {
      const t = i / (sliceCount - 1);
      const y = startY - distance * t;
      const sampledPoints = SkirtGeometryUtils.sliceMeshAtY(mesh, y);

      if (sampledPoints.length > 0) {
        // 🔥 TIGHTER BUFFER: Reduced to fit closer to the skin
        const bufferSize = 0.8 + 0.6 * t;
        const center = SkirtGeometryUtils.computeCenterXZ(sampledPoints);

        const bufferedLocal = sampledPoints.map((p) => {
          const dir = new THREE.Vector3(
            p.x - center.x,
            0,
            p.z - center.z,
          ).normalize();
          const posWithBuffer = p.clone().add(dir.multiplyScalar(bufferSize));

          // Convert to Local Space (relative to computedCenterX/Z)
          return new THREE.Vector3(
            posWithBuffer.x - this.computedCenterX,
            posWithBuffer.y,
            posWithBuffer.z - this.computedCenterZ,
          );
        });

        // 🔥 ALIGNMENT FIX: Force all contours to start from the same front angle (-Z)
        const aligned = SkirtGeometryUtils.resampleContour(bufferedLocal, 64);
        this.waistToHipContours.push(aligned);
      } else {
        // 🔥 FAIL-SAFE: If a slice fails, duplicate previous level
        if (this.waistToHipContours.length > 0) {
          const prevLevel =
            this.waistToHipContours[this.waistToHipContours.length - 1];
          const dummyLocal = prevLevel.map(
            (p) => new THREE.Vector3(p.x, y, p.z),
          );
          this.waistToHipContours.push(dummyLocal);
        }
      }
    }
  }

  private buildSkirtGeometry() {
    if (this.waistToHipContours.length === 0) {
      return;
    }

    // Dispose old geometry
    if (this.skirtGeometry) {
      this.skirtGeometry.dispose();
      this.skirtGeometry = null;
    }

    const allContours = [...this.waistToHipContours];

    // Add vertical drop from cutStopY to bottom
    // 🔥 NEW: Multi-step drop for smoother frustum and better visibility
    if (this.bottomY < this.cutStopY && this.waistToHipContours.length > 0) {
      const lastContour =
        this.waistToHipContours[this.waistToHipContours.length - 1];

      const dropSteps = 10; // Increased to clear legs
      const totalDropFlare = 1.5; // 🔥 Reduced from 5.0 for narrower spread

      for (let j = 1; j <= dropSteps; j++) {
        const t = j / dropSteps;
        const y = this.cutStopY - (this.cutStopY - this.bottomY) * t;

        // 🔥 SMOOTH TRANSITION: Use a curve to flared out and clear thighs
        const flare = totalDropFlare * Math.pow(t, 1.2);

        const stepContour = lastContour.map((p) => {
          const dir = new THREE.Vector3(p.x, 0, p.z).normalize();
          return new THREE.Vector3(p.x, y, p.z).add(dir.multiplyScalar(flare));
        });

        // 🔥 ALIGNMENT: Ensure even the drop steps are aligned
        allContours.push(SkirtGeometryUtils.resampleContour(stepContour, 64));
      }
    }

    if (allContours.length < 2) return;

    // Build skirt from contours
    this.skirtGeometry = SkirtGeometryUtils.buildSkirtGeometry({
      contours: allContours,
    });
  }

  /* ===============================
     Direct method to update bottom Y
     =============================== */
  updateBottomY(newBottomY: number) {
    const CM_PER_INCH = 1 / 0.393701;

    // 🔥 NEW CONSTRAINTS: 1 inch above original and 3 inches below
    const minY = this.originalBottomY - 3 * CM_PER_INCH;
    const maxY = this.originalBottomY + 1 * CM_PER_INCH;

    const constrainedY = THREE.MathUtils.clamp(newBottomY, minY, maxY);

    // Only update if value actually changed
    if (Math.abs(this.bottomY - constrainedY) < 0.001) {
      return;
    }

    this.bottomY = constrainedY;
    this.recomputeWithNewBottomY();
  }

  /* ===============================
     Recompute with new bottom Y from drag
     =============================== */
  private recomputeWithNewBottomY() {
    this.buildSkirtGeometry();
  }

  get hasValidSkirt() {
    return !!this.skirtGeometry;
  }

  clear() {
    if (this.skirtGeometry) {
      this.skirtGeometry.dispose();
      this.skirtGeometry = null;
    }

    this.waistY = 0;
    this.bottomY = 0;
    this.originalBottomY = 0;
    this.waistRadius = 0;
    this.bottomRadius = 0;
    this.computedCenterX = 0;
    this.computedCenterZ = 0;
    this.offsetX = 0;
    this.offsetZ = 0;
    this.waistCutPoints = [];
    this.bottomCutPoints = [];
    this.hipCutPoints = [];
  }
}
