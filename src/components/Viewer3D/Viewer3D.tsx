import { observer } from 'mobx-react-lite';

import { SkirtTypeSelector } from '../UI/SkirtTypeSelector';
import { Camera } from './Camera/Camera.';
import { Canvas3D } from './Canvas3D/Canvas3D';
import { Env } from './Env/Env';
import { GlbViewer } from './GlbViewer/GlbViewer';
import { Light } from './Light/Light';


type SkirtType = 'allstar_skirt_end' | 'school_skirt_end';


export const Viewer3D = observer(() => {
  return (
    <div style={{ height: '100%', position: 'relative', width: '100%' }}>
      <Canvas3D>
        <Camera />
        <Light />
        <Env />
        <GlbViewer />
        {/* <PostProcessing /> */}
      </Canvas3D>

      {/* Skirt Type Selector */}
      <div
        style={{
          left: '20px',
          position: 'absolute',
          top: '20px',
          zIndex: 100,
        }}>
        <SkirtTypeSelector />
      </div>
    </div>
  );
});

