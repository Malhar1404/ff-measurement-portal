import { useFrame } from '@react-three/fiber';
import { folder, useControls } from 'leva';
import { useRef } from 'react';
import * as THREE from 'three';

export const RotatingPointLightBottom = () => {
  const lightRef = useRef<THREE.PointLight>(null);

  const { enabled, intensity, xOffset, yOffset, zOffset, timeFactor, radius } =
    useControls({
      Lights: folder(
        {
          RotatingPointLightBottom: folder(
            {
              enabled: {
                options: [true, false],
                value: true,
              },
              intensity: {
                max: 1,
                min: 0,
                value: 0.1,
              },
              radius: {
                max: 1,
                min: 0,
                value: 1,
              },
              timeFactor: {
                max: 1,
                min: 0,
                value: 0.1,
              },
              xOffset: {
                max: 1,
                min: -1,
                value: 0,
              },
              yOffset: {
                max: 2,
                min: -1,
                value: 0.8,
              },
              zOffset: {
                max: 1,
                min: -1,
                value: 0,
              },
            },
            { collapsed: true },
          ),
        },
        { collapsed: true },
      ),
    });

  useFrame(({ clock }) => {
    if (!enabled) {
      return;
    }
    const time = clock.getElapsedTime();
    const x = Math.sin(time * timeFactor) * radius;
    const z = Math.cos(time * timeFactor) * radius;
    if (lightRef.current) {
      lightRef.current.position.x = -x + xOffset;
      lightRef.current.position.y = yOffset;
      lightRef.current.position.z = -z + zOffset;
    }
  });

  return (
    <>
      {enabled ? <pointLight ref={lightRef} intensity={intensity} /> : null}
      {lightRef.current && (
        <pointLightHelper args={[lightRef.current, 200, 'red']} />
      )}
    </>
  );
};
