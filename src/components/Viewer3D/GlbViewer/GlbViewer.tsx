import { observer } from 'mobx-react-lite';
import { useEffect, useState } from 'react';
import * as THREE from 'three';

import { useMainContext } from '../../../hooks/useMainContext';
import { BodyParts } from '../../../types';
import { Utils3D } from '../../../utils/Utils3D';
import { MidpointDragLine } from '../../LineCreation/MidpointDragLine';
import { SelectionLine } from '../../LineCreation/SelectionLine';
import SkirtMesh from '../../SkirtCreation/SkirtMesh';

export const GlbViewer = observer(() => {
  const { meshesManager, skirtStore, viewManager } = useMainContext();
  const selectedModel = meshesManager.selectedModel;
  const lineData = selectedModel?.lineData;
  const sphereRadius = 1;

  // Access active type from store
  const activeSkirtType = skirtStore.activeSkirtType;

  const [measurementLinePoints, setMeasurementLinePoints] = useState<any[]>([]);

  const [isInitialized, setIsInitialized] = useState(false);

  const mpPoints = selectedModel?.landmarks['MediaPipe landmarks'] || [];
  const meshPoints = selectedModel?.landmarks['Mesh landmarks'] || [];
  const points = [...mpPoints, ...meshPoints];
  const bodyParts: BodyParts = Utils3D.getBodyParts(mpPoints); // Body parts still use MediaPipe landmarks

  const waistLandmarkName =
    activeSkirtType === 'allstar_skirt_end'
      ? 'mid_waist_landmark'
      : 'narrow_waist_landmark';

  const bottomLandmarkName =
    activeSkirtType === 'allstar_skirt_end'
      ? 'allstar_skirt_end_landmark'
      : 'school_skirt_end_landmark';

  // Vertical measurement line (aligned, non-draggable)
  const measurementPoints = Utils3D.getVerticalLineBetweenLandmarks(
    points,
    waistLandmarkName,
    bottomLandmarkName,
    -20, // 🔥 Offset -15
  );

  // 🔥 Calculate Drag Limits
  // Max Y = Hip Height (cannot go above hip)
  // Min Y = Left/Right Ankle (cannot go below ankles/floor)

  // Check if we have ankle landmarks
  const leftAnkle = points.find((p: any) => p.name === 'left_ankle_landmark');
  const rightAnkle = points.find((p: any) => p.name === 'right_ankle_landmark');

  // Use lower of two ankles as floor reference (or default if missing)
  let floorY = -20; // Default low
  if (leftAnkle && rightAnkle) {
    floorY = Math.min(leftAnkle.position.y, rightAnkle.position.y);
  }

  // 🔥 Sync Limits with SkirtInstance logic
  let activeMaxY = 10; 
  let activeMinY = floorY + 2;

  if (selectedModel) {
    const CM_PER_INCH = 1 / 0.393701;
    // 🔥 NEW CONSTRAINTS: 1 inch above original and 3 inches below
    activeMaxY = selectedModel.skirt.originalBottomY + (1 * CM_PER_INCH);
    activeMinY = selectedModel.skirt.originalBottomY - (3 * CM_PER_INCH);
  }

  const minYLimit = activeMinY;
  const maxYLimit = activeMaxY;

  // 🔥 Initialize points once (respecting customized store Y)
  useEffect(() => {
    if (measurementPoints.length > 0 && !isInitialized && selectedModel) {
      const syncedPoints = [...measurementPoints];
      if (syncedPoints[1]) {
          syncedPoints[1].position.y = selectedModel.skirt.bottomY;
      }
      setMeasurementLinePoints(syncedPoints);
      setIsInitialized(true);
    }
  }, [measurementPoints, isInitialized, selectedModel]);

  // Reset when skirt type or selected model changes
  useEffect(() => {
    setIsInitialized(false);
    setMeasurementLinePoints([]);
  }, [activeSkirtType, meshesManager.selectedModelId]);

  return (
    <group>
      {meshesManager.glbscenes.map((scene: THREE.Group) => {
        // 🔥 Visibility Check: If selection exists, only show selected.
        const isSelected = meshesManager.selectedModelId === scene.uuid;
        const hasSelection = !!meshesManager.selectedModelId;
        const isVisible = !hasSelection || isSelected;

        // Only render if visible
        if (!isVisible) return null;

        return (
          <primitive
            key={scene.uuid}
            object={scene}
            onClick={(e: any) => {
              e.stopPropagation(); // Prevent bubbling
              meshesManager.setSelectedModelId(scene.uuid);
            }}
          />
        );
      })}

      {/* Helper to clear selection if clicking empty space? Maybe complex with OrbitControls. 
            For now, let's assume UI button or user manages it.
            Actually, the user wants "work on particular selected model".
        */}

      {selectedModel &&
        !viewManager.isSkirtVisible &&
        Object.entries(selectedModel.landmarks).map(([groupName, landmarks]) =>
          (landmarks as any[]).map((p: any) => {
            const pos = new THREE.Vector3(
              p.position.x as number,
              p.position.y as number,
              p.position.z as number,
            );

            return (
              <mesh
                key={`${groupName}-${pos.x}-${pos.y}-${pos.z}`}
                position={pos}>
                <sphereGeometry args={[sphereRadius, 32, 32]} />
                <meshStandardMaterial color={'green'} />
              </mesh>
            );
          }),
        )}

      {selectedModel?.hasLandmarks &&
        bodyParts &&
        lineData &&
        !viewManager.isSkirtVisible &&
        Object.entries(bodyParts).map(
          ([partName, points]) =>
            points?.length >= 2 && (
              <SelectionLine
                key={partName}
                pointData={points.map(
                  (p) =>
                    new THREE.Vector3(p.position.x, p.position.y, p.position.z),
                )}
              />
            ),
        )}

      {lineData &&
        !viewManager.isSkirtVisible &&
        Object.entries(lineData)?.map(([key, points], index) => {
          const vectorPoints = (points as any[])?.map(
            (p) =>
              new THREE.Vector3(p[0] as number, p[1] as number, p[2] as number),
          );

          const color = index === 0 ? 'red' : index === 1 ? 'blue' : 'yellow';

          return vectorPoints.map((p, i) => (
            <mesh key={`${key}-${i}`} position={p}>
              <sphereGeometry args={[0.4, 32, 32]} />
              <meshStandardMaterial color={color} />
            </mesh>
          ));
        })}

      {/* 🔥 Render Skirts for ALL instances (or only selected) */}
      {meshesManager.modelsList.map((model) => {
        // 🔥 Checks
        if (
          meshesManager.selectedModelId &&
          meshesManager.selectedModelId !== model.id
        ) {
          return null; // Hide non-selected skirts
        }

        return <SkirtWrapper key={model.id} skirtInstance={model.skirt} />;
      })}

      {/* 🔥 MEASUREMENT LINE (Vertical, aligned, reactive to bottom drag) */}
      {measurementLinePoints.length > 0 && (
        <MidpointDragLine
          midPoints={measurementLinePoints}
          lineColor="#FFD700"
          sphereColor="#8B0000"
          sphereSize={1.5}
          type="measurement"
          isDraggable={true}
          lockedIndices={[0]}
          showInches={true}
          minY={minYLimit}
          maxY={maxYLimit}
          onUpdate={(updatedPoints) => {
            setMeasurementLinePoints(updatedPoints);

            // 🔥 Target the selected model's skirt
            if (selectedModel) {
              selectedModel.skirt.updateBottomY(updatedPoints[1].position.y);
            }
          }}
        />
      )}
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

  // Unique Y levels from contours
  const yLevels = skirtInstance.waistToHipContours.map((contour: THREE.Vector3[]) => contour[0]?.y).filter((y: number | undefined) => y !== undefined);
  
  // Add bottom level if applicable
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
  // If skirt is not valid (no geometry), don't render
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
