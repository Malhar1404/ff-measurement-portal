
import { useEffect, useRef } from 'react';
import * as THREE from 'three';

import { useMainContext } from './useMainContext';
import { ThreeEvent } from '@react-three/fiber/dist/declarations/src/core/events';
import { SkirtGeometryUtils } from '../utils/SkirtGeometryUtils';
import { Utils3D } from '../utils/Utils3D';

type UseMeshLandmarkDragParams = {
  camera: THREE.Camera;
  gl: THREE.WebGLRenderer;
  raycaster: THREE.Raycaster;
};

export const useMeshLandmarkDrag = ({
  camera,
  gl,
  raycaster,
}: UseMeshLandmarkDragParams) => {
  const { cameraManager, meshesManager } = useMainContext();

  const draggedLandmarkNameRef = useRef<string | null>(null);
  const suppressClickRef = useRef(false);
  const cameraEnabledRef = useRef(true);
  const hasDraggedRef = useRef(false);
  const dragPlaneRef = useRef(new THREE.Plane());
  const dragPointRef = useRef(new THREE.Vector3());

  const computeSliceForLandmark = (landmarkName: string) => {
    const selectedModel = meshesManager.selectedModel;
    const mesh = selectedModel?.getPrimaryMesh();
    const landmark = selectedModel?.landmarks['Mesh landmarks'].find(
      (item) => item.name === landmarkName,
    );

    if (!selectedModel || !mesh || !landmark) {
      return null;
    }

    mesh.updateWorldMatrix(true, true);
    return SkirtGeometryUtils.sliceMeshContoursAtY(mesh, landmark.position.y);
  };

  useEffect(() => {
    const getPointerOnDragPlane = (event: PointerEvent): THREE.Vector3 | null => {
      const rect = gl.domElement.getBoundingClientRect();
      const pointer = new THREE.Vector2(
        ((event.clientX - rect.left) / rect.width) * 2 - 1,
        -((event.clientY - rect.top) / rect.height) * 2 + 1,
      );

      raycaster.setFromCamera(pointer, camera);
      return raycaster.ray.intersectPlane(dragPlaneRef.current, dragPointRef.current)
        ? dragPointRef.current.clone()
        : null;
    };

    const projectPointToMesh = (
      selectedModel: NonNullable<typeof meshesManager.selectedModel>,
      targetPoint: THREE.Vector3,
    ) => {
      const [projectedPoint] = Utils3D.checkRayCastOnZAxis(selectedModel.scene, [
        targetPoint,
      ]);
      return projectedPoint ?? targetPoint;
    };

    const handlePointerMove = (event: PointerEvent) => {
      const landmarkName = draggedLandmarkNameRef.current;
      const selectedModel = meshesManager.selectedModel;

      if (!landmarkName || !selectedModel) {
        return;
      }

      const pointOnDragPlane = getPointerOnDragPlane(event);

      if (!pointOnDragPlane) {
        return;
      }

      const activeLandmark = selectedModel.landmarks['Mesh landmarks'].find(
        (item) => item.name === landmarkName,
      );

      if (!activeLandmark) {
        return;
      }

      selectedModel.updateMeshLandmarkPosition(
        landmarkName,
        projectPointToMesh(
          selectedModel,
          new THREE.Vector3(
          activeLandmark.position.x,
          pointOnDragPlane.y,
          activeLandmark.position.z,
        ),
        ),
      );
      selectedModel.updateMeshLandmarkSlicePreview(
        landmarkName,
        computeSliceForLandmark(landmarkName),
      );
      hasDraggedRef.current = true;
      suppressClickRef.current = true;
    };

   const handlePointerUp = () => {
  const landmarkName = draggedLandmarkNameRef.current;

  if (!landmarkName) {
    return;
  }

  const selectedModel = meshesManager.selectedModel;
  if (selectedModel) {
    const slice = computeSliceForLandmark(landmarkName);
    selectedModel.commitMeshLandmarkSlice(landmarkName, slice);
    // Also update positionSliceData so the contour stays at the dropped position
    selectedModel.updateMeshLandmarkPositionSlice(landmarkName, slice);
  }

  draggedLandmarkNameRef.current = null;
  suppressClickRef.current = hasDraggedRef.current;
  hasDraggedRef.current = false;

  if (cameraManager.cameraRef) {
    cameraManager.cameraRef.enabled = cameraEnabledRef.current;
  }
};

    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerUp);

    return () => {
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
    };
  }, [camera, cameraManager, gl, meshesManager, raycaster]);

  const handleLandmarkPointerDown = (
    event: ThreeEvent<PointerEvent>,
    landmarkName: string,
  ) => {
    const selectedModel = meshesManager.selectedModel;

    if (!selectedModel) {
      return;
    }

    event.stopPropagation();

    if (selectedModel.selectedMeshLandmarkName !== landmarkName) {
      return;
    }

    const activeLandmark = selectedModel.landmarks['Mesh landmarks'].find(
      (item) => item.name === landmarkName,
    );

    if (!activeLandmark) {
      return;
    }

    draggedLandmarkNameRef.current = landmarkName;
    suppressClickRef.current = false;
    hasDraggedRef.current = false;

    const dragAnchor = activeLandmark.position.clone();
    const normal = camera.position.clone().sub(dragAnchor).normalize();
    dragPlaneRef.current.setFromNormalAndCoplanarPoint(normal, dragAnchor);

    selectedModel.updateMeshLandmarkSlicePreview(
      landmarkName,
      computeSliceForLandmark(landmarkName),
    );

    if (cameraManager.cameraRef) {
      cameraEnabledRef.current = cameraManager.cameraRef.enabled ?? true;
      cameraManager.cameraRef.enabled = false;
    }
  };

  const handleLandmarkClick = (
    event: ThreeEvent<MouseEvent>,
    landmarkName: string,
  ) => {
    event.stopPropagation();

    if (suppressClickRef.current) {
      suppressClickRef.current = false;
      return;
    }

    meshesManager.selectedModel?.toggleMeshLandmarkSelection(landmarkName);
  };

  return {
    handleLandmarkClick,
    handleLandmarkPointerDown,
  };
};
