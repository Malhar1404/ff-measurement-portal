import { CameraControls } from '@react-three/drei';
import { observer } from 'mobx-react-lite';

import { useMainContext } from '../../../hooks/useMainContext';

export const Camera = observer(() => {
  const { cameraManager } = useMainContext();

  return (
    <CameraControls
      makeDefault
      // minPolarAngle={Math.PI / 2}
      // maxPolarAngle={Math.PI / 2}
      // minDistance={0.5}
      // maxDistance={2}
      ref={(camera) => {
        if (camera) {
          cameraManager.setCameraRef(camera);
        }
      }}
    />
  );
});
