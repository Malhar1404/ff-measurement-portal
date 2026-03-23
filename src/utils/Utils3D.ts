import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import { LUTCubeLoader } from 'three/examples/jsm/loaders/LUTCubeLoader';
import { RGBELoader } from 'three/examples/jsm/loaders/RGBELoader';

import { Landmark } from '@/type';

import { Logger } from './Logger';

export class Utils3D {
  static gltfLoader = new GLTFLoader();
  static loadGLTF = (url: string) => {
    return new Promise<THREE.Group>((resolve, reject) => {
      if (!url) {
        return resolve(new THREE.Group());
      }
      Utils3D.gltfLoader.load(
        url,
        (gltf) => {
          resolve(gltf.scene);
        },
        () => {},
        (error) => {
          reject(error);
        },
      );
    });
  };
  static async loadEnvironmentTexture(file: File): Promise<THREE.Texture> {
    const url = URL.createObjectURL(file);
    const rgbeLoader = new RGBELoader();
    try {
      const texture = await rgbeLoader.loadAsync(url);
      texture.mapping = THREE.EquirectangularReflectionMapping;
      URL.revokeObjectURL(url);
      return texture;
    } catch (error) {
      URL.revokeObjectURL(url);
      Logger.error(`Error loading environment map: ${error}`);
      throw error;
    }
  }
  static loadNodeMapForGLTF = async (url: string) => {
    const scene = await Utils3D.loadGLTF(url);
    const nodeMap: { [key: string]: THREE.Mesh } = {};
    scene.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        nodeMap[child.name] = child;
      }
    });
    return nodeMap;
  };
  static loadTexture = async (url: string) => {
    const texture = await new THREE.TextureLoader().loadAsync(url);
    return texture;
  };

  static loadLut = async (url: string) => {
    const lut = await new LUTCubeLoader().loadAsync(url);
    return lut;
  };

  static getImageUrlFromTexture(inTexture: THREE.Texture): string | null {
    const canvas = document.createElement('canvas');
    canvas.width = 2000;
    canvas.height = 2000;

    const repeat = inTexture.repeat ?? new THREE.Vector2(1, 1);
    const ctx = canvas.getContext('2d', { willReadFrequently: true });

    if (!ctx) {
      Logger.error('Failed to get 2D context');
      return null;
    }

    const pattern = ctx.createPattern(
      inTexture.image as HTMLImageElement,
      'repeat',
    );
    if (pattern) {
      ctx.fillStyle = pattern;

      ctx.save();
      ctx.scale(1 / repeat.x, 1 / repeat.y);
      ctx.fillRect(0, 0, canvas.width * repeat.x, canvas.height * repeat.y);

      ctx.restore();
    } else {
      Logger.error('Failed to create pattern');
      return null;
    }

    return canvas.toDataURL();
  }

  static getBoundingBox = (objects: THREE.Object3D[]) => {
    const boundingBox = new THREE.Box3();

    objects.forEach((obj) => {
      boundingBox.expandByObject(obj);
    });

    return boundingBox;
  };
  static getCenterPointAndNormal = (mesh: THREE.Mesh) => {
    const geometry = mesh.geometry;
    const positions = geometry.attributes.position;
    const normals = geometry.attributes.normal;
    const uvs = geometry.attributes.uv as THREE.BufferAttribute;
    const matrixWorld = mesh.matrixWorld;

    if (!positions || !normals || !uvs) {
      // find center of the bounding box
      const boundingBox = Utils3D.getBoundingBox([mesh]);
      const center = boundingBox.getCenter(new THREE.Vector3());
      return {
        center,
        normal: new THREE.Vector3(0, 0, 1),
        uv: new THREE.Vector2(0.5, 0.5),
      };
    }

    const center = new THREE.Vector3(0, 0, 0);
    const count = positions.count;

    // Calculate the center in 3D space
    for (let i = 0; i < count; i++) {
      const vertex = new THREE.Vector3()
        .fromBufferAttribute(positions, i)
        .applyMatrix4(matrixWorld);
      center.add(vertex);
    }
    center.divideScalar(count);

    // Find the closest vertex to the center
    let closestDistance = Infinity;
    let closestIndex = 0;

    for (let i = 0; i < count; i++) {
      const vertex = new THREE.Vector3()
        .fromBufferAttribute(positions, i)
        .applyMatrix4(matrixWorld);
      const distance = vertex.distanceTo(center);

      if (distance < closestDistance) {
        closestDistance = distance;
        closestIndex = i;
      }
    }

    const normal = new THREE.Vector3()
      .fromBufferAttribute(normals, closestIndex)
      .applyMatrix4(matrixWorld);

    const position = new THREE.Vector3()
      .fromBufferAttribute(positions, closestIndex)
      .applyMatrix4(matrixWorld);

    const uv = new THREE.Vector2().fromBufferAttribute(uvs, closestIndex);

    return {
      center: position,
      normal,
      uv,
    };
  };
  static getSizeAndCenter = (obj: THREE.Object3D) => {
    const boundingBox = Utils3D.getBoundingBox([obj]);
    const size = boundingBox.getSize(new THREE.Vector3());
    const center = boundingBox.getCenter(new THREE.Vector3());
    return {
      boundingBox,
      center,
      size,
    };
  };

  static checkRayCastOnZAxis = (
    scene: THREE.Scene | THREE.Group | null,
    points: THREE.Vector3[],
  ) => {
    if (!scene) return [];
    const newPoints: THREE.Vector3[] = [];
    const raycaster = new THREE.Raycaster();
    const offset = 0.01;

    // 🔥 Collect all meshes and set to DoubleSide
    const meshes: THREE.Mesh[] = [];
    const originalSides = new Map<THREE.Material, THREE.Side>();

    scene.traverse((obj) => {
      if (obj instanceof THREE.Mesh) {
        meshes.push(obj as THREE.Mesh);

        const materials = Array.isArray(obj.material)
          ? obj.material
          : [obj.material];

        materials.forEach((mat) => {
          if (mat && mat instanceof THREE.Material) {
            if (!originalSides.has(mat)) {
              originalSides.set(mat, mat.side);
              mat.side = THREE.DoubleSide;
            }
          }
        });
      }
    });

    points.forEach((point) => {
      // +Z
      const dirPlus = new THREE.Vector3(0, 0, 1);
      const originPlus = point.clone().addScaledVector(dirPlus, -offset);
      raycaster.set(originPlus, dirPlus);

      // 🔥 Raycast against the meshes array directly
      const intersectsPlus = raycaster.intersectObjects(meshes, false); // false because meshes are already flat

      const dirMinus = new THREE.Vector3(0, 0, -1);
      const originMinus = point.clone().addScaledVector(dirMinus, -offset);
      raycaster.set(originMinus, dirMinus);
      const intersectsMinus = raycaster.intersectObjects(meshes, false);

      if (intersectsPlus.length > 0 && intersectsMinus.length > 0) {
        const distPlus = intersectsPlus[0].point.distanceTo(point);
        const distMinus = intersectsMinus[0].point.distanceTo(point);
        if (distPlus < distMinus) {
          newPoints.push(intersectsPlus[0].point);
        } else {
          newPoints.push(intersectsMinus[0].point);
        }
      } else {
        newPoints.push(point);
      }
    });

    // 🔥 Restore original sides
    originalSides.forEach((side, mat) => {
      mat.side = side;
    });
    return newPoints;
  };

  static getBodyParts = (points: Landmark[]) => {
    const rightUpper = points.filter((p) =>
      ['crotch', 'right_ankle'].includes(p.name as string),
    );

    const rightUpperOffset =
      rightUpper.length > 0
        ? [
            rightUpper[0],
            {
              position: {
                ...rightUpper[0].position,
                x: rightUpper[0].position.x - 15,
              },
            },
          ]
        : [];

    const rightLowerOffset =
      rightUpper.length > 1
        ? [
            rightUpper[1],
            {
              position: {
                ...rightUpper[1].position,
                x: rightUpper[1].position.x - 15,
              },
            },
          ]
        : [];

    const bodyParts = {
      left_hand: points.filter((p) =>
        ['left_shoulder', 'left_elbow', 'left_wrist'].includes(
          p.name as string,
        ),
      ),
      right_hand: points.filter((p) =>
        ['right_shoulder', 'right_elbow', 'right_wrist'].includes(
          p.name as string,
        ),
      ),
      right_leg: points
        .filter((p) => ['crotch', 'right_ankle'].includes(p.name as string))
        .map((p) => ({
          ...p,
          position: { ...p.position, x: p.position.x - 15 },
        })),
      right_lower: rightLowerOffset,
      right_upper: rightUpperOffset,
    };

    return bodyParts;
  };

  // 🔥 UPDATED: Get aligned vertical line between two landmarks
  // 🔥 UPDATED: Get aligned vertical line with offset from mesh
  static getVerticalLineBetweenLandmarks = (
    points: Landmark[],
    topLandmarkName: string,
    bottomLandmarkName: string,
    xOffset = -50, // 🔥 NEW: Offset to left side away from mesh
  ) => {
    const topPoints = points.filter((p) => p.name === topLandmarkName);
    const bottomPoints = points.filter((p) => p.name === bottomLandmarkName);

    if (topPoints.length === 0 || bottomPoints.length === 0) {
      return [];
    }

    const top = topPoints[0];
    const bottom = bottomPoints[0];

    // 🔥 Use top's X/Z for horizontal position to stay static relative to body center
    return [
      {
        position: {
          x: top.position.x + xOffset, // Offset based on top (stabler)
          y: top.position.y,
          z: top.position.z,
        },
        secondPointPos: {
          x: top.position.x,
          y: top.position.y,
          z: top.position.z,
        },
      },
      {
        position: {
          x: top.position.x + xOffset, // Same offset (aligned)
          y: bottom.position.y, // Bottom Y
          z: top.position.z, // Same Z (aligned)
        },
        secondPointPos: {
          x: bottom.position.x,
          y: bottom.position.y,
          z: bottom.position.z,
        },
      },
    ];
  };

  // Keep the horizontal line function for the draggable bottom line
  static getHorizontalLineAtLandmark = (
    points: Landmark[],
    landmarkName: string,
    xOffset = 15,
  ) => {
    const landmarkPoints = points.filter((p) => p.name === landmarkName);

    if (landmarkPoints.length === 0) {
      return [];
    }

    const landmark = landmarkPoints[0];

    return [
      {
        position: {
          x: landmark.position.x - xOffset,
          y: landmark.position.y,
          z: landmark.position.z,
        },
        secondPointPos: {
          x: landmark.position.x,
          y: landmark.position.y,
          z: landmark.position.z,
        },
      },
      {
        position: {
          x: landmark.position.x + xOffset,
          y: landmark.position.y,
          z: landmark.position.z,
        },
        secondPointPos: {
          x: landmark.position.x,
          y: landmark.position.y,
          z: landmark.position.z,
        },
      },
    ];
  };

  // Keep the old function for vertical lines if needed
  static getMidLinePointsByLandmarks = (
    points: Landmark[],
    startLandmarkName: string,
    endLandmarkName: string,
    xOffset = -15,
  ) => {
    const startPoints = points.filter((p) => p.name === startLandmarkName);
    const endPoints = points.filter((p) => p.name === endLandmarkName);

    if (startPoints.length === 0 || endPoints.length === 0) {
      return [];
    }

    const start = startPoints[0];
    const end = endPoints[0];

    return [
      {
        position: {
          ...start.position,
          x: start.position.x + xOffset,
        },
        secondPointPos: start.position,
      },
      {
        position: {
          ...end.position, // 🔥 FIXED: Use end position as base
          x: end.position.x + xOffset,
        },
        secondPointPos: end.position,
      },
    ];
  };
}
