import * as THREE from 'three';
import { MeshBVH } from 'three-mesh-bvh';

export class SkirtGeometryUtils {
  /* ===============================
     Slice mesh at Y using BVH + Contour Building (🔥 ADVANCED)
     =============================== */
  static sliceMeshAtY(mesh: THREE.Mesh, y: number): THREE.Vector3[] {
    const geometry = mesh.geometry;
    
    // 🔥 Build BVH for fast intersection on the ORIGINAL geometry if missing
    if (!(geometry as any).boundsTree) {
      (geometry as any).boundsTree = new MeshBVH(geometry);
    }

    // 🔥 Transform World Y plane to Local Space
    // A plane in world space: n.p + d = 0
    // We want to transform the plane constant based on the world matrix
    const localPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), -y);
    const inverseWorld = mesh.matrixWorld.clone().invert();
    localPlane.applyMatrix4(inverseWorld);

    const segments: [THREE.Vector3, THREE.Vector3][] = [];

    // 🔥 Use BVH shapecast for efficient plane-mesh intersection
    (geometry as any).boundsTree.shapecast({
      intersectsBounds: (box: THREE.Box3) => localPlane.intersectsBox(box),
      intersectsTriangle: (tri: any) => {
        const intersects: THREE.Vector3[] = [];

        // Check edge AB
        const i1 = localPlane.intersectLine(
          new THREE.Line3(tri.a, tri.b),
          new THREE.Vector3(),
        );
        if (i1) intersects.push(i1.clone());

        // Check edge BC
        const i2 = localPlane.intersectLine(
          new THREE.Line3(tri.b, tri.c),
          new THREE.Vector3(),
        );
        if (i2) intersects.push(i2.clone());

        // Check edge CA
        const i3 = localPlane.intersectLine(
          new THREE.Line3(tri.c, tri.a),
          new THREE.Vector3(),
        );
        if (i3) intersects.push(i3.clone());

        // If triangle intersects plane at exactly 2 points, we have a segment
        if (intersects.length === 2) {
          segments.push([intersects[0].clone(), intersects[1].clone()]);
        }
      },
    });

    if (segments.length === 0) return [];

    // 🔥 Convert Local segments back to World segments for consistent processing
    const worldSegments = segments.map(seg => [
        seg[0].applyMatrix4(mesh.matrixWorld),
        seg[1].applyMatrix4(mesh.matrixWorld)
    ] as [THREE.Vector3, THREE.Vector3]);

    // 🔥 Group segments into discrete islands (contours)
    const contourIslands = this.buildContoursFromSegmentsWithSegments(worldSegments);
    if (contourIslands.length === 0) return [];

    // 🔥 Select the "Main Body" (largest island by perimeter)
    const mainIsland = contourIslands.reduce((max, current) => 
        this.contourLength(current.points) > this.contourLength(max.points) ? current : max
    );

    // 🔥 Sample Outer Contour using segments ONLY from the main island
    const center = this.computeCenterXZFromSegments(mainIsland.segments);
    const sampledPoints = this.sampleOuterContour(mainIsland.segments, center, 64);

    return sampledPoints;
  }

  /* ===============================
     Build contours AND keep track of segments
     =============================== */
  private static buildContoursFromSegmentsWithSegments(
    allSegments: [THREE.Vector3, THREE.Vector3][],
  ): { points: THREE.Vector3[], segments: [THREE.Vector3, THREE.Vector3][] }[] {
    const islands: { points: THREE.Vector3[], segments: [THREE.Vector3, THREE.Vector3][] }[] = [];
    const segments = [...allSegments];
    const threshold = 1e-3;

    while (segments.length > 0) {
      const contourPoints: THREE.Vector3[] = [];
      const contourSegments: [THREE.Vector3, THREE.Vector3][] = [];
      
      let [start, end] = segments.pop()!;
      contourPoints.push(start, end);
      contourSegments.push([start, end]);

      let extended = true;
      while (extended) {
        extended = false;
        for (let i = 0; i < segments.length; i++) {
          const [a, b] = segments[i];
          if (a.distanceTo(end) < threshold) {
            contourPoints.push(b);
            contourSegments.push([a, b]);
            end = b;
            segments.splice(i, 1);
            extended = true;
            break;
          } else if (b.distanceTo(end) < threshold) {
            contourPoints.push(a);
            contourSegments.push([a, b]);
            end = a;
            segments.splice(i, 1);
            extended = true;
            break;
          }
        }
      }
      islands.push({ points: contourPoints, segments: contourSegments });
    }

    return islands;
  }

  /* ===============================
     Sample Outer Contour (Ray-Cast / Shrink-Wrap approach)
     =============================== */
  private static sampleOuterContour(
    segments: [THREE.Vector3, THREE.Vector3][],
    center: THREE.Vector3,
    count: number
  ): THREE.Vector3[] {
    const sampled: THREE.Vector3[] = [];
    const y = segments[0][0].y;

    for (let i = 0; i < count; i++) {
        const angle = (i / count) * Math.PI * 2;
        const dir = new THREE.Vector2(Math.cos(angle), Math.sin(angle));
        
        let maxDist = 0;
        let bestPoint: THREE.Vector3 | null = null;

        // Check each segment for intersection with this ray
        for (const [a, b] of segments) {
            const intersection = this.intersectRaySegmentXZ(center, dir, a, b);
            if (intersection) {
                const dist = Math.hypot(intersection.x - center.x, intersection.y - center.y);
                if (dist > maxDist) {
                    maxDist = dist;
                    bestPoint = new THREE.Vector3(intersection.x, y, intersection.y);
                }
            }
        }

        // If no intersection, fallback to a point at a distance of 10 from center at this angle
        // This ensures the vertex INDEX corresponds to the ANGLE, preventing twists.
        if (bestPoint) {
            sampled.push(bestPoint);
        } else {
            const fallbackDist = 10;
            sampled.push(new THREE.Vector3(
                center.x + dir.x * fallbackDist,
                y,
                center.z + dir.y * fallbackDist
            ));
        }
    }

    return sampled;
  }

  /* ===============================
     Helper: Intersect Ray with Segment in XZ plane
     =============================== */
  private static intersectRaySegmentXZ(
    origin: THREE.Vector3,
    dir: THREE.Vector2,
    a: THREE.Vector3,
    b: THREE.Vector3
  ): THREE.Vector2 | null {
    const x1 = a.x - origin.x;
    const y1 = a.z - origin.z;
    const x2 = b.x - origin.x;
    const y2 = b.z - origin.z;

    const dx = x2 - x1;
    const dy = y2 - y1;

    // Ray: P = t * dir
    // Segment: Q = P1 + u * delta
    // t * dir.x = x1 + u * dx
    // t * dir.y = y1 + u * dy

    const det = dir.x * dy - dir.y * dx;
    if (Math.abs(det) < 1e-6) return null; // Parallel

    const u = (dir.y * x1 - dir.x * y1) / det;
    const t = (x1 + u * dx) / dir.x;

    if (u >= 0 && u <= 1 && t > 0) {
        return new THREE.Vector2(origin.x + t * dir.x, origin.z + t * dir.y);
    }

    return null;
  }

  private static computeCenterXZFromSegments(segments: [THREE.Vector3, THREE.Vector3][]): THREE.Vector3 {
    const c = new THREE.Vector3();
    let count = 0;
    for (const [a, b] of segments) {
        c.add(a).add(b);
        count += 2;
    }
    return c.divideScalar(count);
  }

  /* ===============================
     Build contours from segments
     =============================== */
  private static buildContoursFromSegments(
    segments: [THREE.Vector3, THREE.Vector3][],
  ): THREE.Vector3[][] {
    const contours: THREE.Vector3[][] = [];
    const threshold = 1e-3; // Connection threshold

    while (segments.length > 0) {
      const contour: THREE.Vector3[] = [];
      let [start, end] = segments.pop()!;
      contour.push(start, end);

      let extended = true;

      // Try to extend the contour by connecting segments
      while (extended) {
        extended = false;
        for (let i = 0; i < segments.length; i++) {
          const [a, b] = segments[i];
          if (a.distanceTo(end) < threshold) {
            contour.push(b);
            end = b;
            segments.splice(i, 1);
            extended = true;
            break;
          } else if (b.distanceTo(end) < threshold) {
            contour.push(a);
            end = a;
            segments.splice(i, 1);
            extended = true;
            break;
          }
        }
      }

      contours.push(contour);
    }

    return contours;
  }

  /* ===============================
     Calculate contour length
     =============================== */
  static contourLength(contour: THREE.Vector3[], closed: boolean = false): number {
    let length = 0;
    for (let i = 0; i < contour.length - 1; i++) {
      length += contour[i].distanceTo(contour[i + 1]);
    }
    if (closed && contour.length > 0) {
      length += contour[contour.length - 1].distanceTo(contour[0]);
    }
    return length;
  }

  static computeCenterXZ(points: THREE.Vector3[]) {
    const c = new THREE.Vector3();
    for (const p of points) {
      c.x += p.x;
      c.z += p.z;
    }
    c.x /= points.length;
    c.z /= points.length;
    return c;
  }

  static computeRadius(points: THREE.Vector3[], center: THREE.Vector3) {
    let max = 0;
    for (const p of points) {
      const d = Math.hypot(p.x - center.x, p.z - center.z);
      max = Math.max(max, d);
    }
    return max;
  }

  /* ===============================
     Resample contour to fixed number of points
     =============================== */
  static resampleContour(points: THREE.Vector3[], targetCount: number): THREE.Vector3[] {
    if (points.length === 0) return [];
    
    const center = this.computeCenterXZ(points);
    
    // 🔥 Alignment: Find the point closest to the 'front' (-Z direction)
    // This prevents mesh twisting when connecting rings
    let startIndex = 0;
    let minAngle = Infinity;
    for (let i = 0; i < points.length; i++) {
        // Angle relative to center (0 is +X, -PI/2 is -Z)
        const angle = Math.atan2(points[i].z - center.z, points[i].x - center.x);
        const diff = Math.abs(angle - (-Math.PI / 2)); 
        const normalizedDiff = Math.min(diff, Math.PI * 2 - diff);
        if (normalizedDiff < minAngle) {
            minAngle = normalizedDiff;
            startIndex = i;
        }
    }
    
    // Rotate points to start from startIndex
    const alignedPoints = [...points.slice(startIndex), ...points.slice(0, startIndex)];
    
    // Ensure contour is closed for length calculation
    const closedPoints = [...alignedPoints, alignedPoints[0]];
    const totalLength = this.contourLength(alignedPoints, true);
    
    const resampled: THREE.Vector3[] = [];
    let currentDist = 0;
    let pointIndex = 0;

    for (let i = 0; i < targetCount; i++) {
        const targetDist = (i / targetCount) * totalLength;
        
        while (pointIndex < closedPoints.length - 1) {
            const segmentLen = closedPoints[pointIndex].distanceTo(closedPoints[pointIndex + 1]);
            if (currentDist + segmentLen >= targetDist) {
                const t = segmentLen > 0 ? (targetDist - currentDist) / segmentLen : 0;
                resampled.push(new THREE.Vector3().lerpVectors(closedPoints[pointIndex], closedPoints[pointIndex+1], t));
                break;
            }
            currentDist += segmentLen;
            pointIndex++;
        }
    }
    
    return resampled;
  }

  /* ===============================
     Build skirt from multiple contour rings
     =============================== */
  static buildSkirtGeometry(params: {
    contours: THREE.Vector3[][];
  }) {
    const { contours } = params;
    if (contours.length < 2) return null;

    const verts: number[] = [];
    const indices: number[] = [];
    const radialSegments = contours[0].length;

    // Generate vertices
    for (let i = 0; i < contours.length; i++) {
      const ring = contours[i];
      for (let j = 0; j < ring.length; j++) {
        verts.push(ring[j].x, ring[j].y, ring[j].z);
      }
    }

    // Build faces
    const heightSegments = contours.length - 1;
    for (let i = 0; i < heightSegments; i++) {
      for (let j = 0; j < radialSegments; j++) {
        const a = i * radialSegments + j;
        const b = i * radialSegments + ((j + 1) % radialSegments);
        const c = (i + 1) * radialSegments + j;
        const d = (i + 1) * radialSegments + ((j + 1) % radialSegments);

        indices.push(a, b, c);
        indices.push(b, d, c);
      }
    }

    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(verts, 3));
    g.setIndex(indices);
    g.computeVertexNormals();

    return g;
  }

  /* ===============================
     Compute radius using MEDIAN (excludes arm outliers)
     =============================== */
  static computeRadiusMedian(
    points: THREE.Vector3[],
    center: THREE.Vector3,
  ): number {
    const distances = points.map((p) =>
      Math.hypot(p.x - center.x, p.z - center.z),
    );
    distances.sort((a, b) => a - b);

    // Return median distance (middle value)
    const midIndex = Math.floor(distances.length / 2);
    return distances[midIndex] ; // 🔥 Increased from 1.35 to 1.6 for wider skirt
  }

  static computeRadiusPercentile(
    points: THREE.Vector3[],
    center: THREE.Vector3,
    percentile = 0.75,
  ): number {
    const distances = points.map((p) =>
      Math.hypot(p.x - center.x, p.z - center.z),
    );
    distances.sort((a, b) => a - b);

    const index = Math.floor(distances.length * percentile);
    return distances[index];
  }

  static computeRadiusAverage(
    points: THREE.Vector3[],
    center: THREE.Vector3,
  ): number {
    let sum = 0;
    for (const p of points) {
      sum += Math.hypot(p.x - center.x, p.z - center.z);
    }
    return sum / points.length;
  }
}
