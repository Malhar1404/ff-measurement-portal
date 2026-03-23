import { observer } from 'mobx-react-lite';
import * as THREE from 'three';

import { useMainContext } from '../../../hooks/useMainContext';
import SkirtMesh from '../../SkirtCreation/SkirtMesh';

export const GlbViewer = observer(() => {
  const { meshesManager } = useMainContext();
  const selectedModel = meshesManager.selectedModel;
  const meshPoints = selectedModel?.landmarks['Mesh landmarks'] || [];
  const defaultMeshPointColor = 'yellow';

  return (
    <group>
      {meshesManager.glbscenes.map((scene: THREE.Group) => {
        const isSelected = meshesManager.selectedModelId === scene.uuid;
        const hasSelection = !!meshesManager.selectedModelId;
        const isVisible = !hasSelection || isSelected;

        if (!isVisible) return null;

        return (
          <primitive
            key={scene.uuid}
            object={scene}
            onClick={(e: any) => {
              e.stopPropagation();
              meshesManager.setSelectedModelId(scene.uuid);
            }}
          />
        );
      })}

      {meshesManager.modelsList.map((model) => {
        if (
          meshesManager.selectedModelId &&
          meshesManager.selectedModelId !== model.id
        ) {
          return null;
        }

        return <SkirtWrapper key={model.id} skirtInstance={model.skirt} />;
      })}

      {meshPoints.map((point: any) => (
        <mesh
          key={`mesh-landmark-${point.name}`}
          position={[
            point.position.x as number,
            point.position.y as number,
            point.position.z as number,
          ]}>
          <sphereGeometry args={[1, 24, 24]} />
          <meshStandardMaterial color={point.color || defaultMeshPointColor} />
        </mesh>
      ))}
    </group>
  );
});

const DEBUG_COLORS = [
  '#ff0000', '#00ff00', '#0000ff', '#ffff00', '#ff00ff', '#00ffff',
  '#ffa500', '#800080', '#008000', '#ffc0cb', '#a52a2a', '#808080'
];

const SkirtDebugPoints = observer(({ skirtInstance }: { skirtInstance: any }) => {
  const { viewManager } = useMainContext();
  if (!viewManager.showDebugPoints) return null;

  return (
    <group position={[skirtInstance.centerX, 0, skirtInstance.centerZ]}>
      {skirtInstance.waistToHipContours.map((contour: THREE.Vector3[], levelIndex: number) => (
        <group key={`level-${levelIndex}`}>
          {contour.map((p, pointIndex) => (
            <mesh key={`p-${levelIndex}-${pointIndex}`} position={p}>
              <sphereGeometry args={[0.2, 8, 8]} />
              <meshStandardMaterial color={DEBUG_COLORS[levelIndex % DEBUG_COLORS.length]} />
            </mesh>
          ))}
        </group>
      ))}
    </group>
  );
});

const SkirtPlaneVisualizer = observer(({ skirtInstance }: { skirtInstance: any }) => {
  const { viewManager } = useMainContext();
  if (!viewManager.showDebugPoints) return null;

  const yLevels = skirtInstance.waistToHipContours
    .map((contour: THREE.Vector3[]) => contour[0]?.y)
    .filter((y: number | undefined) => y !== undefined);

  if (skirtInstance.bottomY < skirtInstance.hipY) {
    yLevels.push(skirtInstance.bottomY);
  }

  return (
    <group position={[skirtInstance.centerX, 0, skirtInstance.centerZ]}>
      {yLevels.map((y: number, index: number) => (
        <mesh key={`plane-${index}`} position={[0, y, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[100, 100]} />
          <meshStandardMaterial
            color={DEBUG_COLORS[index % DEBUG_COLORS.length]}
            transparent
            opacity={0.1}
            side={THREE.DoubleSide}
            depthWrite={false}
          />
        </mesh>
      ))}
    </group>
  );
});

const SkirtWrapper = observer(({ skirtInstance }: { skirtInstance: any }) => {
  if (!skirtInstance.hasValidSkirt) return null;

  return (
    <>
      <SkirtMesh
        geometry={skirtInstance.skirtGeometry}
        waistY={skirtInstance.waistY}
        bottomY={skirtInstance.bottomY}
        centerX={skirtInstance.centerX}
        centerZ={skirtInstance.centerZ}
      />
      {/* <SkirtDebugPoints skirtInstance={skirtInstance} /> */}
      {/* <SkirtPlaneVisualizer skirtInstance={skirtInstance} /> */}
    </>
  );
});
