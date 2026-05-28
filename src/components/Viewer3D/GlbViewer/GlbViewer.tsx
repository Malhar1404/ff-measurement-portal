import { Line, Text } from "@react-three/drei";
import { useThree } from "@react-three/fiber";
import { observer } from "mobx-react-lite";
import React, { useMemo } from "react";
import * as THREE from "three";

import { useMeshLandmarkDrag } from "../../../hooks/useMeshLandmarkDrag";
import { useMainContext } from "../../../hooks/useMainContext";
import SkirtMesh from "../../SkirtCreation/SkirtMesh";

const ALWAYS_VISIBLE_MEASUREMENT_LANDMARKS = new Set([
  "mid_waist_landmark",
  "narrow_waist_landmark",
  "allstar_skirt_end_landmark",
  "school_skirt_end_landmark",
]);

export const LANDMARK_THEME: Record<
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
  mid_waist_landmark: {
    base: "#22d3ee",
    accent: "#22d3ee",
    groove: "#a5f3fc",
    contour: "#22d3ee",
    selectedBase: "#06b6d4",
    selectedAccent: "#22d3ee",
    selectedGroove: "#cffafe",
    label: "Mid Waist",
  },
  narrow_waist_landmark: {
    base: "#fcd34d",
    accent: "#fcd34d",
    groove: "#fde68a",
    contour: "#fbbf24",
    selectedBase: "#f59e0b",
    selectedAccent: "#fcd34d",
    selectedGroove: "#fef3c7",
    label: "Narrow Waist",
  },
  allstar_skirt_end_landmark: {
    base: "#c084fc",
    accent: "#c084fc",
    groove: "#e9d5ff",
    contour: "#c084fc",
    selectedBase: "#a855f7",
    selectedAccent: "#c084fc",
    selectedGroove: "#f3e8ff",
    label: "Allstar End",
  },
  school_skirt_end_landmark: {
    base: "#4ade80",
    accent: "#4ade80",
    groove: "#bbf7d0",
    contour: "#4ade80",
    selectedBase: "#22c55e",
    selectedAccent: "#4ade80",
    selectedGroove: "#dcfce7",
    label: "School End",
  },
};

export const GlbViewer = observer(
  ({ showOriginalLandmarks = false }: { showOriginalLandmarks?: boolean }) => {
    const { camera, gl, raycaster } = useThree();
    const { meshesManager, viewManager } = useMainContext();
    const { handleLandmarkClick, handleLandmarkPointerDown } =
      useMeshLandmarkDrag({ camera, gl, raycaster });
    const selectedModel = meshesManager.selectedModel;
    const meshPoints = selectedModel?.landmarks["Mesh landmarks"] || [];
    const renderedMeshPoints = showOriginalLandmarks
      ? meshPoints.map((point) => ({
          ...point,
          position: point.originalPosition ?? point.position,
          sliceData: point.originalSliceData ?? point.sliceData,
          slicePreview: null,
          positionSliceData: null,
        }))
      : meshPoints;
    const defaultMeshPointColor = "yellow";
    const sceneUuids = meshesManager.glbscenes
      .map((scene) => scene.uuid)
      .join("|");
    const clonedScenes = useMemo(
      () =>
        meshesManager.glbscenes.map((scene) => {
          const clone = scene.clone(true) as THREE.Group;
          clone.uuid = scene.uuid;
          return clone;
        }),
      [sceneUuids],
    );

    const { leftGuideLength, bbMaxX, bbCenterZ } = (() => {
      if (!selectedModel) {
        return { leftGuideLength: 12, bbMaxX: 0, bbCenterZ: 0 };
      }

      const bb = new THREE.Box3().setFromObject(selectedModel.scene);
      const center = bb.getCenter(new THREE.Vector3());
      return {
        leftGuideLength: 0,
        bbMaxX: bb.max.x,
        bbCenterZ: center.z,
      };
    })();

    return (
      <group>
        {clonedScenes.map((scene: THREE.Group) => {
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

        {!viewManager.comparisonImage &&
          renderedMeshPoints.map((point: any) => (
            <LandmarkPoint
              key={`mesh-landmark-${point.name}`}
              defaultMeshPointColor={defaultMeshPointColor}
              handleLandmarkClick={handleLandmarkClick}
              handleLandmarkPointerDown={handleLandmarkPointerDown}
              leftGuideLength={leftGuideLength}
              bbMaxX={bbMaxX}
              bbCenterZ={bbCenterZ}
              isSelected={
                !showOriginalLandmarks &&
                selectedModel?.selectedMeshLandmarkName === point.name
              }
              interactive={!showOriginalLandmarks}
              point={point}
              showOriginalLandmarks={showOriginalLandmarks}
            />
          ))}
      </group>
    );
  },
);

const LandmarkPoint = observer(
  ({
    defaultMeshPointColor,
    handleLandmarkClick,
    handleLandmarkPointerDown,
    leftGuideLength,
    bbMaxX,
    bbCenterZ,
    isSelected,
    interactive,
    point,
    showOriginalLandmarks,
  }: {
    defaultMeshPointColor: string;
    handleLandmarkClick: (event: any, landmarkName: string) => void;
    handleLandmarkPointerDown: (event: any, landmarkName: string) => void;
    leftGuideLength: number;
    bbMaxX: number;
    bbCenterZ: number;
    isSelected: boolean;
    interactive: boolean;
    showOriginalLandmarks: boolean;
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
      positionSliceData?: {
        largestContour: THREE.Vector3[];
      } | null;
    };
  }) => {
    const originalPosition = point.originalPosition ?? point.position;

    const hasMoved =
      originalPosition.distanceToSquared(point.position) > 0.0001;
    const errorDeltaY = originalPosition.y - point.position.y;
    const verticalConnectorPoint = new THREE.Vector3(
      originalPosition.x,
      point.position.y,
      originalPosition.z,
    );
    const connectorPoints = [originalPosition, verticalConnectorPoint];
    const activeContour =
      point.slicePreview?.largestContour ??
      point.positionSliceData?.largestContour ??
      point.sliceData?.largestContour ??
      [];
    const originalContour = point.originalSliceData?.largestContour ?? [];
    const contourLinePoints =
      activeContour.length > 2
        ? [...activeContour, activeContour[0]]
        : activeContour;
    const originalContourLinePoints =
      originalContour.length > 2
        ? [...originalContour, originalContour[0]]
        : originalContour;
    const shouldShowMeasurementControl =
      interactive && ALWAYS_VISIBLE_MEASUREMENT_LANDMARKS.has(point.name);
    const theme = LANDMARK_THEME[point.name];
    const controlColor = isSelected
      ? (theme?.selectedBase ?? "#1d4ed8")
      : (theme?.base ?? "#123c8b");
    const controlAccentColor = isSelected
      ? (theme?.selectedAccent ?? "#1e40af")
      : (theme?.accent ?? "#0a2a66");
    const contourColor = theme?.contour ?? "#6df0ff";
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
      closestPoint.z,
    );

    const guideLinePoints = [
      new THREE.Vector3(
        closestPoint.x - leftGuideLength,
        closestPoint.y,
        closestPoint.z, // fixed: BB center Z
      ),
      new THREE.Vector3(handlePosition.x, handlePosition.y, handlePosition.z),
    ];

    const errorLineX = bbMaxX + 4;
    const errorLineColor = errorDeltaY >= 0 ? "#ef4444" : "#22c55e";
    const errorLinePoints = [
      new THREE.Vector3(errorLineX, originalPosition.y, bbCenterZ),
      new THREE.Vector3(errorLineX, point.position.y, bbCenterZ),
    ];
    const errorLabelY = (originalPosition.y + point.position.y) / 2;
    const errorDeltaValue = Math.abs(errorDeltaY);
    const errorLabel = `${errorDeltaY >= 0 ? "+" : "-"}${errorDeltaValue.toFixed(2)} cm`;

    return (
      <group>
        {showOriginalLandmarks && originalContourLinePoints.length > 1 && (
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

        {isSelected && hasMoved && (
          <>
            <Line
              points={errorLinePoints}
              color={errorLineColor}
              depthTest={false}
              lineWidth={3}
              renderOrder={1000}
            />
            <Text
              position={[errorLineX + 2.5, errorLabelY, bbCenterZ]}
              fontSize={4}
              color={errorLineColor}
              anchorX="left"
              anchorY="middle"
              depthOffset={-2}
              renderOrder={1001}
            >
              {errorLabel}
            </Text>
          </>
        )}

        <mesh
          position={[
            point.position.x as number,
            point.position.y as number,
            point.position.z as number,
          ]}
          renderOrder={999}
          scale={isSelected ? [1.35, 1.35, 1.35] : [1, 1, 1]}
          onPointerDown={
            interactive
              ? (e: any) => handleLandmarkPointerDown(e, point.name)
              : undefined
          }
          onClick={
            interactive
              ? (e: any) => handleLandmarkClick(e, point.name)
              : undefined
          }
        >
          <meshStandardMaterial
            color={point.color || defaultMeshPointColor}
            emissive={isSelected ? "#ffffff" : "#000000"}
            emissiveIntensity={isSelected ? 0.35 : 0}
            depthTest={false}
          />
        </mesh>
      </group>
    );
  },
);

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
