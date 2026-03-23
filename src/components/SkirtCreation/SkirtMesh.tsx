import { observer } from 'mobx-react-lite';
import { forwardRef } from 'react';
import * as THREE from 'three';

import { useMainContext } from '../../hooks/useMainContext';

interface Props {
  geometry: THREE.BufferGeometry | null;
  waistY: number;
  bottomY: number;
  centerX?: number;
  centerZ?: number;
}

const SkirtMesh = observer(
  forwardRef<THREE.Mesh, Props>(
    (
      {
        geometry,
        waistY,
        bottomY,
        centerX = 0,
        centerZ = 0,
      }: Props,
      ref,
    ) => {
      const { viewManager } = useMainContext();
      const isVisible = viewManager.isSkirtVisible;

      // 🔥 Position at model's center axis
      // If geometry is custom-built from World points, we need to be careful.
      // For now, let's assume geometry points are local to (centerX, 0, centerZ)
      const position: [number, number, number] = [
        centerX,
        0, // Y is baked into geometry vertices
        centerZ,
      ];

      if (!isVisible || !geometry) return null;
      return (
        <mesh ref={ref} geometry={geometry} position={position}>
          <meshStandardMaterial
            color="#8f2eb5"
            side={THREE.DoubleSide}
            transparent
            opacity={0.9}
          />
        </mesh>
      );
    },
  ),
);

export default SkirtMesh;
