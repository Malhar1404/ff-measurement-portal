import { useMemo } from 'react';
import * as THREE from 'three';

interface Props {
  points: THREE.Vector3[];
  color: string;
  sphereSize?: number;
}

export function PlaneCutVisualizer({ points, color, sphereSize = 0.3 }: Props) {
  // 🔥 OPTIMIZED: Use instanced mesh for better performance with many spheres
  const { instancedMesh, count } = useMemo(() => {
    const geometry = new THREE.SphereGeometry(sphereSize, 8, 8);
    const material = new THREE.MeshStandardMaterial({ color });
    const mesh = new THREE.InstancedMesh(geometry, material, points.length);

    const matrix = new THREE.Matrix4();
    points.forEach((point, i) => {
      matrix.setPosition(point);
      mesh.setMatrixAt(i, matrix);
    });

    mesh.instanceMatrix.needsUpdate = true;

    return { count: points.length, instancedMesh: mesh };
  }, [points, color, sphereSize]);

  return <primitive object={instancedMesh} />;
}
