import { useThree } from '@react-three/fiber';
import { observer } from 'mobx-react-lite';
import * as THREE from 'three';

import { useMeshLandmarkDrag } from '../../../hooks/useMeshLandmarkDrag';
import { useMainContext } from '../../../hooks/useMainContext';
import SkirtMesh from '../../SkirtCreation/SkirtMesh';

export const GlbViewer = observer(() => {
  const { camera, gl, raycaster } = useThree();
  const { meshesManager } = useMainContext();
  const { handleLandmarkClick, handleLandmarkPointerDown } =
    useMeshLandmarkDrag({ camera, gl, raycaster });
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
        <LandmarkPoint
          key={`mesh-landmark-${point.name}`}
          defaultMeshPointColor={defaultMeshPointColor}
          handleLandmarkClick={handleLandmarkClick}
          handleLandmarkPointerDown={handleLandmarkPointerDown}
          isSelected={selectedModel?.selectedMeshLandmarkName === point.name}
          point={point}
        />
      ))}
    </group>
  );
});

const LandmarkPoint = observer(({
  defaultMeshPointColor,
  handleLandmarkClick,
  handleLandmarkPointerDown,
  isSelected,
  point,
}: {
  defaultMeshPointColor: string;
  handleLandmarkClick: (event: any, landmarkName: string) => void;
  handleLandmarkPointerDown: (event: any, landmarkName: string) => void;
  isSelected: boolean;
  point: {
    color?: string;
    name: string;
    originalPosition?: THREE.Vector3;
    position: THREE.Vector3;
  };
}) => {
  const originalPosition = point.originalPosition ?? point.position;
  const hasMoved = originalPosition.distanceToSquared(point.position) > 0.0001;
  const connectorPoints = [originalPosition, point.position];

  return (
    <group>
      {(hasMoved || isSelected) && (
        <mesh
          raycast={() => null}
          position={[
            originalPosition.x,
            originalPosition.y,
            originalPosition.z,
          ]}>
          <sphereGeometry args={[0.72, 18, 18]} />
          <meshStandardMaterial
            color="#9aa0a6"
            emissive="#4b5563"
            emissiveIntensity={0.08}
            opacity={0.45}
            transparent
          />
        </mesh>
      )}

      {isSelected && hasMoved && (
        <line >
          <bufferGeometry>
            <bufferAttribute
              attach="attributes-position"
              args={[
                new Float32Array(
                  connectorPoints.flatMap((vector) => [vector.x, vector.y, vector.z]),
                ),
                3,
              ]}
            />
          </bufferGeometry>
          <lineBasicMaterial
            color="#e8ff68"
            depthTest={false}
            linewidth={5}
            transparent
            opacity={1}
          />
        </line>
      )}

      <mesh
        position={[
          point.position.x as number,
          point.position.y as number,
          point.position.z as number,
        ]}
        scale={isSelected ? [1.35, 1.35, 1.35] : [1, 1, 1]}
        onPointerDown={(e: any) => handleLandmarkPointerDown(e, point.name)}
        onClick={(e: any) => handleLandmarkClick(e, point.name)}>
        <sphereGeometry args={[1, 24, 24]} />
        <meshStandardMaterial
          color={point.color || defaultMeshPointColor}
          emissive={isSelected ? '#ffffff' : '#000000'}
          emissiveIntensity={isSelected ? 0.35 : 0}
        />
      </mesh>
    </group>
  );
});

// const DEBUG_COLORS = [
//   '#ff0000', '#00ff00', '#0000ff', '#ffff00', '#ff00ff', '#00ffff',
//   '#ffa500', '#800080', '#008000', '#ffc0cb', '#a52a2a', '#808080'
// ];

// const SkirtDebugPoints = observer(({ skirtInstance }: { skirtInstance: any }) => {
//   const { viewManager } = useMainContext();
//   if (!viewManager.showDebugPoints) return null;

//   return (
//     <group position={[skirtInstance.centerX, 0, skirtInstance.centerZ]}>
//       {skirtInstance.waistToHipContours.map((contour: THREE.Vector3[], levelIndex: number) => (
//         <group key={`level-${levelIndex}`}>
//           {contour.map((p, pointIndex) => (
//             <mesh key={`p-${levelIndex}-${pointIndex}`} position={p}>
//               <sphereGeometry args={[0.2, 8, 8]} />
//               <meshStandardMaterial color={DEBUG_COLORS[levelIndex % DEBUG_COLORS.length]} />
//             </mesh>
//           ))}
//         </group>
//       ))}
//     </group>
//   );
// });

// const SkirtPlaneVisualizer = observer(({ skirtInstance }: { skirtInstance: any }) => {
//   const { viewManager } = useMainContext();
//   if (!viewManager.showDebugPoints) return null;

//   const yLevels = skirtInstance.waistToHipContours
//     .map((contour: THREE.Vector3[]) => contour[0]?.y)
//     .filter((y: number | undefined) => y !== undefined);

//   if (skirtInstance.bottomY < skirtInstance.hipY) {
//     yLevels.push(skirtInstance.bottomY);
//   }

//   return (
//     <group position={[skirtInstance.centerX, 0, skirtInstance.centerZ]}>
//       {yLevels.map((y: number, index: number) => (
//         <mesh key={`plane-${index}`} position={[0, y, 0]} rotation={[-Math.PI / 2, 0, 0]}>
//           <planeGeometry args={[100, 100]} />
//           <meshStandardMaterial
//             color={DEBUG_COLORS[index % DEBUG_COLORS.length]}
//             transparent
//             opacity={0.1}
//             side={THREE.DoubleSide}
//             depthWrite={false}
//           />
//         </mesh>
//       ))}
//     </group>
//   );
// });

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
