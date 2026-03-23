import { Canvas } from '@react-three/fiber';
import { observer } from 'mobx-react-lite';
import React from 'react';
import * as THREE from 'three';

// Component to handle WebGL context

export const Canvas3D: React.FC<{ children?: React.ReactNode }> = observer(
  ({ children }) => {
    return (
      <Canvas
        className="canvas-3d"
        shadows
        gl={{
          toneMapping: THREE.ACESFilmicToneMapping,
          toneMappingExposure: 0.9,
        }}>
        {children}
      </Canvas>
    );
  },
);
