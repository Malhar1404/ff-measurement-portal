import { Line } from '@react-three/drei';
import { observer } from 'mobx-react-lite';
import * as THREE from 'three';

type SelectionLineDataType = THREE.Vector3[];

export const SelectionLine = observer(
  ({
    pointData,
    color,
  }: {
    pointData: SelectionLineDataType;
    color?: string;
  }) => {
    const positions = pointData;
    if (!positions || positions.length < 2) {
      return null;
    }

    return (
      <group>
        <Line
          points={positions}
          color={color || 'blue'}
          lineWidth={5}
          depthTest={false}
        />
      </group>
    );
  },
);
