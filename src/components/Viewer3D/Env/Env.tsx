import { Environment } from '@react-three/drei';
import { useLoader } from '@react-three/fiber';
import { observer } from 'mobx-react-lite';
import * as THREE from 'three';
import { RGBELoader } from 'three-stdlib';

import { useMainContext } from '../../../hooks/useMainContext';

export const Env = observer(() => {
  const defaultTexture = useLoader(RGBELoader, '/env/studio_small_09_2k.hdr');
  const { envManager } = useMainContext();

  return (
    <Environment background={envManager.envVisibility}>
      <color attach="background" args={['black']} />
      <mesh
        rotation={[
          envManager.envRotation.x,
          envManager.envRotation.y,
          envManager.envRotation.z,
        ]}
        scale={100}>
        <sphereGeometry />
        <meshBasicMaterial
          transparent
          opacity={envManager.envIntensity}
          map={envManager.environmentTexture || defaultTexture}
          side={THREE.BackSide}
          toneMapped={false}
        />
      </mesh>
    </Environment>
  );
});
