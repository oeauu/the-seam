export interface SurfacePoint {
  position: [number, number, number];
  normal: [number, number, number];
}

export function sampleParchmentSurface(x: number, y: number, width = 6.8, height = 3.7): SurfacePoint {
  const edgeX = Math.max(0, Math.abs(x) / (width / 2) - 0.72);
  const edgeY = Math.max(0, Math.abs(y) / (height / 2) - 0.72);
  const z =
    0.025 * Math.sin(x * 2.1 + y * 0.7) * Math.cos(y * 1.6) +
    0.06 * edgeX * edgeX +
    0.045 * edgeY * edgeY;
  const slopeX = 0.025 * 2.1 * Math.cos(x * 2.1 + y * 0.7) * Math.cos(y * 1.6);
  const slopeY = -0.025 * Math.sin(x * 2.1 + y * 0.7) * Math.sin(y * 1.6) * 1.6;
  const normal: [number, number, number] = [-slopeX, -slopeY, 1];
  return { position: [x, y, z], normal };
}
