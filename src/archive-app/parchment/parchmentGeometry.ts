import { CylinderGeometry, PlaneGeometry, type BufferGeometry } from "three";
import { sampleParchmentSurface } from "./parchmentSurface";

export interface ParchmentGeometryOptions {
  width: number;
  height: number;
  segmentsX: number;
  segmentsY: number;
}

export function createParchmentGeometry(options: ParchmentGeometryOptions): BufferGeometry {
  const geometry = new PlaneGeometry(options.width, options.height, options.segmentsX, options.segmentsY);
  const position = geometry.getAttribute("position");
  for (let index = 0; index < position.count; index += 1) {
    const x = position.getX(index);
    const y = position.getY(index);
    const surface = sampleParchmentSurface(x, y, options.width, options.height);
    position.setZ(index, surface.position[2]);
  }
  position.needsUpdate = true;
  geometry.computeVertexNormals();
  return geometry;
}

export function createParchmentCurlGeometry(width: number, y: number): BufferGeometry {
  return new CylinderGeometry(0.14, 0.14, width, 64, 1, true, 0, Math.PI).rotateZ(Math.PI / 2).translate(0, y, 0);
}
