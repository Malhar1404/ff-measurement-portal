import { CameraControls, OrthographicCamera } from "@react-three/drei";
import CameraControlsImpl from "camera-controls";
import { observer } from "mobx-react-lite";
import { useEffect, useRef } from "react";

import { useMainContext } from "../../../hooks/useMainContext";

export const Camera = observer(() => {
  const { cameraManager, viewManager } = useMainContext();
  const imageCompare = viewManager.comparisonImage;
  const controlsRef = useRef<CameraControls | null>(null);

  useEffect(() => {
    const camera = controlsRef.current;
    if (!camera) {
      return;
    }

    cameraManager.registerCameraRef(camera);
    return () => {
      cameraManager.unregisterCameraRef(camera);
    };
  }, [cameraManager]);

  return (
    <>
      {!imageCompare ? (
        <OrthographicCamera position={[0, 0, 100]} zoom={100} />
      ) : (
        <perspectiveCamera position={[0, 0, 100]} />
      )}

      <CameraControls
        ref={controlsRef}
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
      />
    </>
  );
});
