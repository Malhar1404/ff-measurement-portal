import { Html, Line, Sphere } from '@react-three/drei';
import { useThree } from '@react-three/fiber';
import { observer } from 'mobx-react-lite';
import { useEffect, useMemo, useRef, useState } from 'react';
import * as THREE from 'three';

import { useMainContext } from '../../hooks/useMainContext';

export type MidpointData = {
  position: { x: number; y: number; z: number };
  secondPointPos: { x: number; y: number; z: number };
};

type MidpointDragLineProps = {
  midPoints: MidpointData[];
  lineColor?: string;
  sphereColor?: string;
  sphereSize?: number;
  onUpdate?: (updatedPoints: MidpointData[]) => void;
  onDragEnd?: (finalPoints: MidpointData[]) => void;
  yMovementLimit?: number; // Relative limit (e.g. +/- 7)
  minY?: number; // 🔥 NEW: Absolute minimum Y limit
  maxY?: number; // 🔥 NEW: Absolute maximum Y limit
  type?: 'waist' | 'bottom' | 'measurement'; // 🔥 NEW: Add 'measurement' type
  isDraggable?: boolean;
  showInches?: boolean; // 🔥 NEW: Option to show inches
  lockedIndices?: number[]; // indices that cannot be dragged
};

export const MidpointDragLine = observer(
  ({
    midPoints,
    lineColor = 'red',
    sphereColor = 'yellow',
    sphereSize = 1,
    onUpdate,
    onDragEnd,
    yMovementLimit = 7,
    minY,
    maxY,
    type = 'bottom',
    isDraggable = true,
    showInches = false, // 🔥 NEW: Default to cm
    lockedIndices = [],
  }: MidpointDragLineProps) => {
    const { adjustableSkirtManager, cameraManager, viewManager } = useMainContext();
    const { camera, raycaster, mouse } = useThree();

    const sphere0Ref = useRef<THREE.Mesh>(null);
    const sphere1Ref = useRef<THREE.Mesh>(null);

    const [isDragging, setIsDragging] = useState(false);
    const [draggedIndex, setDraggedIndex] = useState<0 | 1 | null>(null);

    const dragPlaneRef = useRef(new THREE.Plane());
    const dragPointRef = useRef(new THREE.Vector3());
    const initialYRef = useRef(0);
    const cameraEnabledRef = useRef(true);

    if (!midPoints || midPoints.length < 2) return null;

    const p1 = new THREE.Vector3(
      midPoints[0].position.x,
      midPoints[0].position.y,
      midPoints[0].position.z,
    );
    const p2 = new THREE.Vector3(
      midPoints[1].position.x,
      midPoints[1].position.y,
      midPoints[1].position.z,
    );

    /* ---------------------------------- */
    /* Line length with unit conversion */
    /* ---------------------------------- */
    const lineLength = useMemo(() => {
      return p1.distanceTo(p2);
    }, [midPoints]);

    // 🔥 NEW: Convert cm to inches (1 cm = 0.393701 inches)
    const displayLength = showInches ? lineLength * 0.393701 : lineLength;
    const unit = showInches ? 'in' : 'cm';

    /* ---------------------------------- */
    /* Line midpoint (for HTML label) */
    /* ---------------------------------- */
    const lineMidPoint = useMemo(() => {
      return new THREE.Vector3(
        (p1.x + p2.x) / 2,
        (p1.y + p2.y) / 2,
        (p1.z + p2.z) / 2,
      );
    }, [midPoints]);

    const helperLine1 = [
      new THREE.Vector3(
        midPoints[0].position.x,
        midPoints[0].position.y,
        midPoints[0].position.z,
      ),
      new THREE.Vector3(
        midPoints[0].secondPointPos.x,
        midPoints[0].secondPointPos.y,
        midPoints[0].secondPointPos.z,
      ),
    ];

    const helperLine2 = [
      new THREE.Vector3(
        midPoints[1].position.x,
        midPoints[1].position.y,
        midPoints[1].position.z,
      ),
      new THREE.Vector3(
        midPoints[1].secondPointPos.x,
        midPoints[1].secondPointPos.y,
        midPoints[1].secondPointPos.z,
      ),
    ];

    const handlePointerDown = (e: THREE.Event, index: 0 | 1) => {
      if (!isDraggable) {
        return;
      }

      if (lockedIndices.includes(index)) {
        return;
      }

     
      e.stopPropagation();
      setIsDragging(true);
      setDraggedIndex(index);
      initialYRef.current = midPoints[index].position.y;

      if (cameraManager.cameraRef) {
        cameraEnabledRef.current = cameraManager.cameraRef.enabled ?? true;
        cameraManager.cameraRef.enabled = false;
      }

      const startPos = index === 0 ? p1.clone() : p2.clone();
      const normal = camera.position.clone().sub(startPos).normalize();
      dragPlaneRef.current.setFromNormalAndCoplanarPoint(normal, startPos);
  };

    const handlePointerMove = (event: PointerEvent) => {
      if (!isDragging || draggedIndex === null) return;

      mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
      mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

      raycaster.setFromCamera(mouse, camera);
      raycaster.ray.intersectPlane(dragPlaneRef.current, dragPointRef.current);

      const newY = dragPointRef.current.y;
      
      // Calculate effective limits
      // 🔥 FIX: Remove relative limit (was +/- 7) to allow full range dragging
      let effectiveMinY = -Infinity;
      let effectiveMaxY = Infinity;

      // Apply absolute limits if provided
      if (minY !== undefined) effectiveMinY = minY;
      if (maxY !== undefined) effectiveMaxY = maxY;

      // Clamp
      const clampedY = THREE.MathUtils.clamp(newY, effectiveMinY, effectiveMaxY);


      const updated = [...midPoints];
      updated[draggedIndex].position.y = clampedY;
      updated[draggedIndex].secondPointPos.y = clampedY;

     

      if (type === 'bottom') {
       
        adjustableSkirtManager.updateBottomPoints(updated);
      } 
      if (onUpdate) {
        onUpdate(updated);
      }
    };

    const handlePointerUp = () => {
      if (!isDragging) return;
      
      if (onDragEnd) {
        onDragEnd(midPoints);
      }

      setIsDragging(false);
      setDraggedIndex(null);

      if (cameraManager.cameraRef) {
        cameraManager.cameraRef.enabled = cameraEnabledRef.current;
      }
    };

    useEffect(() => {
      window.addEventListener('pointermove', handlePointerMove);
      window.addEventListener('pointerup', handlePointerUp);

      return () => {
        window.removeEventListener('pointermove', handlePointerMove);
        window.removeEventListener('pointerup', handlePointerUp);
      };
    }, [isDragging, draggedIndex, midPoints]);

    const getSphereColor = (index: 0 | 1) => {
      if (lockedIndices.includes(index)) return 'gray';
      return isDraggable ? sphereColor : 'gray';
    };

    const getSphereOpacity = (index: 0 | 1) => {
        if (lockedIndices.includes(index)) return 0.5;
        return isDraggable ? 1.0 : 0.5;
    }

    return (
      <group>
        {/* Line */}
        <Line
          points={[p1, p2]}
          color={lineColor}
          lineWidth={4}
          depthTest={false} // 🔥 Always visible
          renderOrder={999} // 🔥 Processed last (on top)
        />

        {/* Line length label with unit */}
        {!viewManager.isInitialLoading && (
            <Html
              position={[lineMidPoint.x, lineMidPoint.y, lineMidPoint.z]}
              center
              distanceFactor={60}
              style={{
                background: 'rgba(0,0,0,0.85)',
                borderRadius: '6px',
                color: '#fff',
                fontFamily: 'monospace',
                fontSize: '40px', // 🔥 Increased font size
                fontWeight: 'bold', // 🔥 NEW: Bold text
                padding: '8px 14px',
                pointerEvents: 'none',
                whiteSpace: 'nowrap',
              }}>
              {displayLength.toFixed(2)} {unit}
            </Html>
        )}

        {/* Draggable sphere 0 */}
        <Sphere
          ref={sphere0Ref}
          renderOrder={999} // 🔥 Always on top
          args={[sphereSize, 32, 32]}
          position={[p1.x, p1.y, p1.z]}
          onPointerDown={(e) => handlePointerDown(e, 0)}>
          <meshStandardMaterial
            color={getSphereColor(0)}
            transparent
            opacity={getSphereOpacity(0)}
            depthTest={false} // 🔥 See through objects
          />
        </Sphere>

        {/* Non-draggable second point 0 */}
        <Sphere
          args={[sphereSize, 32, 32]}
          position={[
            midPoints[0].secondPointPos.x,
            midPoints[0].secondPointPos.y,
            midPoints[0].secondPointPos.z,
          ]}>
          <meshStandardMaterial
            color={getSphereColor(0)}
            transparent
            opacity={0.3}
          />
        </Sphere>

        {/* Draggable sphere 1 */}
        <Sphere
          ref={sphere1Ref}
          renderOrder={999} // 🔥 Always on top
          args={[sphereSize, 32, 32]}
          position={[p2.x, p2.y, p2.z]}
          onPointerDown={(e) => handlePointerDown(e, 1)}>
          <meshStandardMaterial
            color={getSphereColor(1)}
            transparent
            opacity={getSphereOpacity(1)}
            depthTest={false} // 🔥 See through objects
          />
        </Sphere>

        {/* Non-draggable second point 1 */}
        <Sphere
          args={[sphereSize, 32, 32]}
          position={[
            midPoints[1].secondPointPos.x,
            midPoints[1].secondPointPos.y,
            midPoints[1].secondPointPos.z,
          ]}>
          <meshStandardMaterial
            color={getSphereColor(1)}
            transparent
            opacity={0.3}
          />
        </Sphere>

        {/* Helper line for point 0 */}
        <Line
          points={helperLine1}
          color={lineColor}
          lineWidth={2}
          dashed
          dashSize={0.2}
          gapSize={0.15}
        />

        {/* Helper line for point 1 */}
        <Line
          points={helperLine2}
          color={lineColor}
          lineWidth={2}
          dashed
          dashSize={0.2}
          gapSize={0.15}
        />
      </group>
    );
  },
);

MidpointDragLine.displayName = 'MidpointDragLine';
