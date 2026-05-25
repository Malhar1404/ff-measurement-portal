import { Line, Text } from '@react-three/drei';
import { useThree } from '@react-three/fiber';
import { observer } from 'mobx-react-lite';
import * as THREE from 'three';

import { useMeshLandmarkDrag } from '../../../hooks/useMeshLandmarkDrag';
import { useMainContext } from '../../../hooks/useMainContext';
import SkirtMesh from '../../SkirtCreation/SkirtMesh';

const ALWAYS_VISIBLE_MEASUREMENT_LANDMARKS = new Set([
  'chest_landmark',
  'hip_landmark',
  'narrow_waist_landmark',
]);

const LANDMARK_THEME: Record<
  string,
  {
    base: string;
    accent: string;
    groove: string;
    contour: string;
    selectedBase: string;
    selectedAccent: string;
    selectedGroove: string;
    label: string;
  }
> = {
  chest_landmark: {
    base: '#0e7490',
    accent: '#0891b2',
    groove: '#a5f3fc',
    contour: '#22d3ee',
    selectedBase: '#06b6d4',
    selectedAccent: '#22d3ee',
    selectedGroove: '#cffafe',
    label: 'Chest',
  },
  narrow_waist_landmark: {
    base: '#92400e',
    accent: '#b45309',
    groove: '#fde68a',
    contour: '#fbbf24',
    selectedBase: '#f59e0b',
    selectedAccent: '#fcd34d',
    selectedGroove: '#fef3c7',
    label: 'Waist',
  },
  hip_landmark: {
    base: '#6b21a8',
    accent: '#7e22ce',
    groove: '#e9d5ff',
    contour: '#c084fc',
    selectedBase: '#a855f7',
    selectedAccent: '#c084fc',
    selectedGroove: '#f3e8ff',
    label: 'Hip',
  },
};

export const GlbViewer = observer(() => {
  const { camera, gl, raycaster } = useThree();
  const { meshesManager, viewManager } = useMainContext();
  const { handleLandmarkClick, handleLandmarkPointerDown } =
    useMeshLandmarkDrag({ camera, gl, raycaster });
  const selectedModel = meshesManager.selectedModel;
  const meshPoints = selectedModel?.landmarks['Mesh landmarks'] || [];
  const defaultMeshPointColor = 'yellow';
  const { leftGuideLength, bbCenterX, bbCenterZ } = (() => {
    if (!selectedModel) {
      return { leftGuideLength: 12, bbCenterX: 0, bbCenterZ: 0 };
    }

    const bb = new THREE.Box3().setFromObject(selectedModel.scene);
    const size = bb.getSize(new THREE.Vector3());
    const center = bb.getCenter(new THREE.Vector3());
    return {
      leftGuideLength: 0,
      bbCenterX: center.x,
      bbCenterZ: size.z / 2,
    };
  })();

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
            // onClick={(e: any) => {
            //   e.stopPropagation();
            //   meshesManager.setSelectedModelId(scene.uuid);
            // }}
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

      {!viewManager.comparisonImage && meshPoints.map((point: any) => (
        <LandmarkPoint
          key={`mesh-landmark-${point.name}`}
          defaultMeshPointColor={defaultMeshPointColor}
          handleLandmarkClick={handleLandmarkClick}
          handleLandmarkPointerDown={handleLandmarkPointerDown}
          leftGuideLength={leftGuideLength}
          bbCenterX={bbCenterX}
          bbCenterZ={bbCenterZ}
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
  leftGuideLength,
  bbCenterX,
  bbCenterZ,
  isSelected,
  point,
}: {
  defaultMeshPointColor: string;
  handleLandmarkClick: (event: any, landmarkName: string) => void;
  handleLandmarkPointerDown: (event: any, landmarkName: string) => void;
  leftGuideLength: number;
  bbCenterX: number;
  bbCenterZ: number;
  isSelected: boolean;
  point: {
    color?: string;
    name: string;
    originalPosition?: THREE.Vector3;
    originalSliceData?: {
      largestContour: THREE.Vector3[];
    } | null;
    position: THREE.Vector3;
    sliceData?: {
      largestContour: THREE.Vector3[];
    } | null;
    slicePreview?: {
      largestContour: THREE.Vector3[];
    } | null;
    positionSliceData?:{
      largestContour: THREE.Vector3[];
    } | null
  };
}) => {
  const originalPosition = point.originalPosition ?? point.position;

  
  const hasMoved = originalPosition.distanceToSquared(point.position) > 0.0001;
  const connectorPoints = [originalPosition, point.position];
  const activeContour =
  point.slicePreview?.largestContour ??
  point.positionSliceData?.largestContour ??
  point.sliceData?.largestContour ??
  [];
  const originalContour = point.originalSliceData?.largestContour ?? [];
  const contourLinePoints =
    activeContour.length > 2 ? [...activeContour, activeContour[0]] : activeContour;
  const originalContourLinePoints =
    originalContour.length > 2 ? [...originalContour, originalContour[0]] : originalContour;
  const shouldShowMeasurementControl = ALWAYS_VISIBLE_MEASUREMENT_LANDMARKS.has(
    point.name,
  );
  const theme = LANDMARK_THEME[point.name];
  const controlColor = isSelected
    ? (theme?.selectedBase ?? '#1d4ed8')
    : (theme?.base ?? '#123c8b');
  const controlAccentColor = isSelected
    ? (theme?.selectedAccent ?? '#1e40af')
    : (theme?.accent ?? '#0a2a66');
  const contourColor = theme?.contour ?? '#6df0ff';
  // Handle is always at BB center X offset to the left, fixed Z = BB center Z
  let closestPoint = null;
let minDiff = Infinity;

for (const p of contourLinePoints) {
  const diff = Math.abs(p.z - bbCenterZ);
  if (diff < minDiff) {
    minDiff = diff;
    closestPoint = p;
  }
}

// Fallback safety (in case array is empty)
if (!closestPoint) return;

// Create handle position using closest point
const handlePosition = new THREE.Vector3(
  closestPoint.x - leftGuideLength,
  closestPoint.y,
  closestPoint.z
);

  const guideLinePoints = [
    new THREE.Vector3(
       closestPoint.x - leftGuideLength,
  closestPoint.y,
  closestPoint.z       // fixed: BB center Z
    ),
    new THREE.Vector3(
      handlePosition.x,
      handlePosition.y,
      handlePosition.z,
    ),
  ];

  return (
    <group>
      {originalContourLinePoints.length > 1 && (
        <Line
          points={originalContourLinePoints}
          color="#8b949e"
          depthTest={false}
          lineWidth={1.9}
          renderOrder={999}
        />
      )}

      {contourLinePoints.length > 1 && (
        <Line
          points={contourLinePoints}
          color={contourColor}
          depthTest={false}
          lineWidth={2.2}
          renderOrder={999}
        />
      )}

      {isSelected && hasMoved && (
        <Line
          points={connectorPoints}
          color="#e8ff68"
          depthTest={false}
          lineWidth={2}
          renderOrder={999}
        />
      )}

      {shouldShowMeasurementControl && (
        <Line
          points={guideLinePoints}
          color={controlColor}
          depthTest={false}
          lineWidth={2.6}
          renderOrder={999}
        />
      )}

      <mesh
        position={[
          point.position.x as number,
          point.position.y as number,
          point.position.z as number,
        ]}
        renderOrder={999}
        scale={isSelected ? [1.35, 1.35, 1.35] : [1, 1, 1]}
        onPointerDown={(e: any) => handleLandmarkPointerDown(e, point.name)}
        onClick={(e: any) => handleLandmarkClick(e, point.name)}>

        <meshStandardMaterial
          color={point.color || defaultMeshPointColor}
          emissive={isSelected ? '#ffffff' : '#000000'}
          emissiveIntensity={isSelected ? 0.35 : 0}
          depthTest={false}
        />
      </mesh>

      {shouldShowMeasurementControl && theme && (
        <Text
          position={[
            handlePosition.x - 20,
            handlePosition.y,
            handlePosition.z,
          ]}
          fontSize={4}
          color={isSelected ? theme.selectedGroove : theme.groove}
          anchorX="right"
          anchorY="middle"
          depthOffset={-1}
          renderOrder={1}>
          {theme.label}
        </Text>
      )}

      {shouldShowMeasurementControl && (
        <mesh
          position={[
            handlePosition.x,
            handlePosition.y,
            handlePosition.z,
          ]}
          renderOrder={999}
          onPointerDown={(e: any) => handleLandmarkPointerDown(e, point.name)}
          onClick={(e: any) => handleLandmarkClick(e, point.name)}>
          <sphereGeometry args={[1.5, 32, 32]} />
          <meshStandardMaterial
            color={controlColor}
            emissive={controlAccentColor}
            emissiveIntensity={0.35}
            transparent
            opacity={0.98}
            depthTest={false}
          />
        </mesh>
      )}
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
