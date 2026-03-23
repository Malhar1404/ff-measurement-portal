import { ThreeEvent, useThree } from '@react-three/fiber';
import { useEffect, useRef } from 'react';
import * as THREE from 'three';

import { useMainContext } from './useMainContext';

export const useMeshLandmarkDrag = () => {
  const { camera, gl, raycaster } = useThree();
  const { cameraManager, meshesManager } = useMainContext();

  const draggedLandmarkNameRef = useRef<string | null>(null);
  const suppressClickRef = useRef(false);
  const cameraEnabledRef = useRef(true);
  const hasDraggedRef = useRef(false);

  useEffect(() => {
    const getIntersectedPointOnMesh = (
      event: PointerEvent,
    ): THREE.Vector3 | null => {
      const selectedModel = meshesManager.selectedModel;

      if (!selectedModel) {
        return null;
      }

      const rect = gl.domElement.getBoundingClientRect();
      const pointer = new THREE.Vector2(
        ((event.clientX - rect.left) / rect.width) * 2 - 1,
        -((event.clientY - rect.top) / rect.height) * 2 + 1,
      );

      const meshes: THREE.Mesh[] = [];
      const originalSides = new Map<THREE.Material, THREE.Side>();

      selectedModel.scene.traverse((obj) => {
        if (!(obj instanceof THREE.Mesh)) {
          return;
        }

        meshes.push(obj);

        const materials = Array.isArray(obj.material)
          ? obj.material
          : [obj.material];

        materials.forEach((mat) => {
          if (mat && mat instanceof THREE.Material && !originalSides.has(mat)) {
            originalSides.set(mat, mat.side);
            mat.side = THREE.DoubleSide;
          }
        });
      });

      raycaster.setFromCamera(pointer, camera);
      const intersections = raycaster.intersectObjects(meshes, false);

      originalSides.forEach((side, mat) => {
        mat.side = side;
      });

      return intersections[0]?.point.clone() ?? null;
    };

    const handlePointerMove = (event: PointerEvent) => {
      const landmarkName = draggedLandmarkNameRef.current;
      const selectedModel = meshesManager.selectedModel;

      if (!landmarkName || !selectedModel) {
        return;
      }

      const pointOnMesh = getIntersectedPointOnMesh(event);

      if (!pointOnMesh) {
        return;
      }

      selectedModel.updateMeshLandmarkPosition(landmarkName, pointOnMesh);
      hasDraggedRef.current = true;
      suppressClickRef.current = true;
    };

    const handlePointerUp = () => {
      if (!draggedLandmarkNameRef.current) {
        return;
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

    draggedLandmarkNameRef.current = landmarkName;
    suppressClickRef.current = false;
    hasDraggedRef.current = false;

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
