import { CanvasTexture, RepeatWrapping, SRGBColorSpace, type MeshStandardMaterial, MeshStandardMaterial as ThreeMeshStandardMaterial } from "three";

export type ParchmentQuality = "high" | "medium" | "low";

interface ParchmentResources {
  material: MeshStandardMaterial;
  texture: CanvasTexture;
}

const cache = new Map<ParchmentQuality, ParchmentResources>();

function seededNoise(seed: number): () => number {
  let value = seed >>> 0;
  return () => {
    value = (value * 1664525 + 1013904223) >>> 0;
    return value / 4294967296;
  };
}

function textureSize(quality: ParchmentQuality): number {
  return quality === "high" ? 512 : quality === "medium" ? 384 : 256;
}

function createTexture(quality: ParchmentQuality): CanvasTexture {
  const size = textureSize(quality);
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const context = canvas.getContext("2d");
  if (!context) throw new Error("Canvas 2D context is unavailable for parchment texture");
  const noise = seededNoise(0x9e3779b9 + size);
  context.fillStyle = "#e5d0a1";
  context.fillRect(0, 0, size, size);
  const image = context.createImageData(size, size);
  for (let index = 0; index < image.data.length; index += 4) {
    const n = Math.floor((noise() - 0.5) * 20);
    image.data[index] = 229 + n;
    image.data[index + 1] = 208 + n;
    image.data[index + 2] = 163 + n;
    image.data[index + 3] = 255;
  }
  context.putImageData(image, 0, 0);
  for (let index = 0; index < size * 2; index += 1) {
    context.strokeStyle = `rgba(104, 71, 35, ${0.015 + noise() * 0.025})`;
    context.lineWidth = 0.4 + noise() * 1.1;
    context.beginPath();
    const y = noise() * size;
    context.moveTo(0, y);
    context.bezierCurveTo(size * 0.3, y + noise() * 8, size * 0.7, y - noise() * 8, size, y + noise() * 4);
    context.stroke();
  }
  const texture = new CanvasTexture(canvas);
  texture.colorSpace = SRGBColorSpace;
  texture.wrapS = RepeatWrapping;
  texture.wrapT = RepeatWrapping;
  texture.needsUpdate = true;
  return texture;
}

export function getParchmentResources(quality: ParchmentQuality): ParchmentResources {
  const cached = cache.get(quality);
  if (cached) return cached;
  const texture = createTexture(quality);
  const material = new ThreeMeshStandardMaterial({
    map: texture,
    color: "#ead7aa",
    roughness: 0.88,
    metalness: 0.02,
    bumpMap: texture,
    bumpScale: quality === "low" ? 0.015 : 0.028,
  });
  const resources = { material, texture };
  cache.set(quality, resources);
  return resources;
}

export function disposeParchmentResources(): void {
  for (const resources of cache.values()) {
    resources.texture.dispose();
    resources.material.dispose();
  }
  cache.clear();
}
