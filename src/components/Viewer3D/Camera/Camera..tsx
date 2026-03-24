import { CameraControls } from '@react-three/drei';
import CameraControlsImpl from 'camera-controls';
import { observer } from 'mobx-react-lite';

import { useMainContext } from '../../../hooks/useMainContext';

export const Camera = observer(() => {
  const { cameraManager } = useMainContext();

  return (
    <CameraControls
      makeDefault
      mouseButtons={{
        left: CameraControlsImpl.ACTION.ROTATE,
        middle: CameraControlsImpl.ACTION.DOLLY,
        right: CameraControlsImpl.ACTION.TRUCK,
        wheel: CameraControlsImpl.ACTION.DOLLY,
      }}
      touches={{
        one: CameraControlsImpl.ACTION.TOUCH_ROTATE,
        two: CameraControlsImpl.ACTION.TOUCH_DOLLY_ROTATE,
        three: CameraControlsImpl.ACTION.NONE,
      }}
      ref={(camera) => {
        if (camera) {
          cameraManager.setCameraRef(camera);
        }
      }}
    />
  );
});
