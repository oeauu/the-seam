import {
  CanvasTexture,
  LinearFilter,
  LinearMipmapLinearFilter,
  NoColorSpace,
  RepeatWrapping,
  SRGBColorSpace,
} from "three";

export type ParchmentQuality = "high" | "medium" | "low";

/**
 * Fixed seed for the offline-generated parchment maps. The generator uses layered
 * value noise plus narrow deterministic strand functions; it creates 512px, 256px,
 * or 128px CanvasTextures for high, medium, and low quality without external assets.
 */
export const DEFAULT_PARCHMENT_SEED = 0x51f0cafe;

interface ParchmentQualityConfig {
  resolution: number;
  includeNormal: boolean;
  normalStrength: number;
  fiberFrequency: number;
  roughnessBase: number;
}

export const PARCHMENT_TEXTURE_QUALITY: Readonly<Record<ParchmentQuality, ParchmentQualityConfig>> = Object.freeze({
  high: {
    resolution: 512,
    includeNormal: true,
    normalStrength: 0.34,
    fiberFrequency: 1,
    roughnessBase: 0.86,
  },
  medium: {
    resolution: 256,
    includeNormal: true,
    normalStrength: 0.22,
    fiberFrequency: 0.82,
    roughnessBase: 0.88,
  },
  low: {
    resolution: 128,
    includeNormal: false,
    normalStrength: 0,
    fiberFrequency: 0.62,
    roughnessBase: 0.92,
  },
});

export interface ParchmentTextureOptions {
  quality?: ParchmentQuality;
  seed?: number;
}

export interface ParchmentTextureSet {
  color: CanvasTexture;
  roughness: CanvasTexture;
  normal: CanvasTexture | null;
  quality: ParchmentQuality;
  seed: number;
  resolution: number;
}

function clamp(value: number, minimum: number, maximum: number): number {
  return Math.min(maximum, Math.max(minimum, value));
}

function clampByte(value: number): number {
  return Math.round(clamp(value, 0, 255));
}

function normalizeSeed(seed: number | undefined): number {
  if (seed === undefined || !Number.isFinite(seed)) return DEFAULT_PARCHMENT_SEED;
  return Math.trunc(seed) >>> 0;
}

function hash2d(x: number, y: number, seed: number): number {
  let value = Math.imul(x, 374761393);
  value = Math.imul(value ^ Math.imul(y, 668265263), 1274126177);
  value = Math.imul(value ^ seed, 2246822519);
  value ^= value >>> 13;
  value = Math.imul(value, 3266489917);
  value ^= value >>> 16;
  return (value >>> 0) / 4294967295;
}

function smoothStep(value: number): number {
  return value * value * (3 - 2 * value);
}

function interpolate(start: number, end: number, amount: number): number {
  return start + (end - start) * amount;
}

function valueNoise(x: number, y: number, seed: number): number {
  const x0 = Math.floor(x);
  const y0 = Math.floor(y);
  const x1 = x0 + 1;
  const y1 = y0 + 1;
  const xAmount = smoothStep(x - x0);
  const yAmount = smoothStep(y - y0);

  const top = interpolate(hash2d(x0, y0, seed), hash2d(x1, y0, seed), xAmount);
  const bottom = interpolate(hash2d(x0, y1, seed), hash2d(x1, y1, seed), xAmount);
  return interpolate(top, bottom, yAmount);
}

function createCanvas(resolution: number): HTMLCanvasElement {
  if (typeof document === "undefined") {
    throw new Error("Parchment textures require a browser canvas.");
  }

  const canvas = document.createElement("canvas");
  canvas.width = resolution;
  canvas.height = resolution;
  return canvas;
}

function writePixels(canvas: HTMLCanvasElement, pixels: Uint8ClampedArray): void {
  const context = canvas.getContext("2d");
  if (!context) throw new Error("Unable to create a 2D canvas context for parchment texture generation.");

  const imageData = context.createImageData(canvas.width, canvas.height);
  imageData.data.set(pixels);
  context.putImageData(imageData, 0, 0);
}

function createCanvasTexture(
  canvas: HTMLCanvasElement,
  quality: ParchmentQuality,
  colorSpace: typeof SRGBColorSpace | typeof NoColorSpace,
): CanvasTexture {
  const texture = new CanvasTexture(canvas);
  texture.colorSpace = colorSpace;
  texture.wrapS = RepeatWrapping;
  texture.wrapT = RepeatWrapping;
  texture.magFilter = LinearFilter;
  texture.minFilter = quality === "low" ? LinearFilter : LinearMipmapLinearFilter;
  texture.generateMipmaps = quality !== "low";
  texture.needsUpdate = true;
  return texture;
}

function createHeightField(
  resolution: number,
  seed: number,
  config: ParchmentQualityConfig,
): Float32Array {
  const heights = new Float32Array(resolution * resolution);
  const frequency = 92 * config.fiberFrequency;
  const seedPhase = (seed % 997) / 997;

  for (let y = 0; y < resolution; y += 1) {
    const v = y / resolution;
    for (let x = 0; x < resolution; x += 1) {
      const u = x / resolution;
      const low = valueNoise(u * 4.2, v * 4.2, seed + 11);
      const middle = valueNoise(u * 13.5, v * 13.5, seed + 37);
      const grain = valueNoise(u * 48, v * 48, seed + 71);
      const warp = valueNoise(u * 3.2, v * 3.2, seed + 101);
      const strand = Math.max(
        0,
        Math.sin((u * frequency + v * 3.2 + warp * 8 + seedPhase) * Math.PI),
      );
      const crossStrand = Math.max(
        0,
        Math.sin((v * frequency * 0.72 + u * 2.1 + seedPhase * 1.7) * Math.PI),
      );
      const fiber = clamp(Math.pow(strand, 18) * 0.72 + Math.pow(crossStrand, 22) * 0.28, 0, 1);

      heights[y * resolution + x] = clamp(
        low * 0.54 + middle * 0.28 + grain * 0.14 + fiber * 0.04,
        0,
        1,
      );
    }
  }

  return heights;
}

function createColorPixels(
  resolution: number,
  seed: number,
  heights: Float32Array,
): Uint8ClampedArray {
  const pixels = new Uint8ClampedArray(resolution * resolution * 4);

  for (let y = 0; y < resolution; y += 1) {
    const v = y / resolution;
    for (let x = 0; x < resolution; x += 1) {
      const u = x / resolution;
      const index = y * resolution + x;
      const grain = valueNoise(u * 72, v * 72, seed + 151);
      const oxidation = valueNoise(u * 2.6, v * 2.6, seed + 181);
      const fiber = Math.max(0, heights[index] - 0.5) * 8;
      const tone = (oxidation - 0.5) * 22 + (grain - 0.5) * 7 - fiber;
      const pixelIndex = index * 4;

      pixels[pixelIndex] = clampByte(201 + tone * 1.1);
      pixels[pixelIndex + 1] = clampByte(177 + tone * 0.9);
      pixels[pixelIndex + 2] = clampByte(128 + tone * 0.62);
      pixels[pixelIndex + 3] = 255;
    }
  }

  return pixels;
}

function createRoughnessPixels(
  resolution: number,
  seed: number,
  heights: Float32Array,
  roughnessBase: number,
): Uint8ClampedArray {
  const pixels = new Uint8ClampedArray(resolution * resolution * 4);

  for (let y = 0; y < resolution; y += 1) {
    const v = y / resolution;
    for (let x = 0; x < resolution; x += 1) {
      const u = x / resolution;
      const index = y * resolution + x;
      const variation = valueNoise(u * 30, v * 30, seed + 211) - 0.5;
      const roughness = clamp(roughnessBase + variation * 0.16 + heights[index] * 0.025, 0.58, 0.98);
      const value = clampByte(roughness * 255);
      const pixelIndex = index * 4;

      pixels[pixelIndex] = value;
      pixels[pixelIndex + 1] = value;
      pixels[pixelIndex + 2] = value;
      pixels[pixelIndex + 3] = 255;
    }
  }

  return pixels;
}

function createNormalPixels(
  resolution: number,
  heights: Float32Array,
  normalStrength: number,
): Uint8ClampedArray {
  const pixels = new Uint8ClampedArray(resolution * resolution * 4);

  for (let y = 0; y < resolution; y += 1) {
    const previousY = (y - 1 + resolution) % resolution;
    const nextY = (y + 1) % resolution;
    for (let x = 0; x < resolution; x += 1) {
      const previousX = (x - 1 + resolution) % resolution;
      const nextX = (x + 1) % resolution;
      const index = y * resolution + x;
      const horizontalGradient = heights[y * resolution + nextX] - heights[y * resolution + previousX];
      const verticalGradient = heights[nextY * resolution + x] - heights[previousY * resolution + x];
      const pixelIndex = index * 4;

      pixels[pixelIndex] = clampByte(128 + horizontalGradient * normalStrength * 255);
      pixels[pixelIndex + 1] = clampByte(128 - verticalGradient * normalStrength * 255);
      pixels[pixelIndex + 2] = 255;
      pixels[pixelIndex + 3] = 255;
    }
  }

  return pixels;
}

export function createParchmentTextureSet(options: ParchmentTextureOptions = {}): ParchmentTextureSet {
  const quality = options.quality ?? "high";
  const config = PARCHMENT_TEXTURE_QUALITY[quality];
  const seed = normalizeSeed(options.seed);
  const resolution = config.resolution;
  const heights = createHeightField(resolution, seed, config);

  let colorTexture: CanvasTexture | null = null;
  let roughnessTexture: CanvasTexture | null = null;
  let normalTexture: CanvasTexture | null = null;

  try {
    const colorCanvas = createCanvas(resolution);
    writePixels(colorCanvas, createColorPixels(resolution, seed, heights));
    colorTexture = createCanvasTexture(colorCanvas, quality, SRGBColorSpace);

    const roughnessCanvas = createCanvas(resolution);
    writePixels(roughnessCanvas, createRoughnessPixels(resolution, seed, heights, config.roughnessBase));
    roughnessTexture = createCanvasTexture(roughnessCanvas, quality, NoColorSpace);

    if (config.includeNormal) {
      const normalCanvas = createCanvas(resolution);
      writePixels(normalCanvas, createNormalPixels(resolution, heights, config.normalStrength));
      normalTexture = createCanvasTexture(normalCanvas, quality, NoColorSpace);
    }

    if (!colorTexture || !roughnessTexture) {
      throw new Error("Parchment texture generation did not produce its required maps.");
    }

    return {
      color: colorTexture,
      roughness: roughnessTexture,
      normal: normalTexture,
      quality,
      seed,
      resolution,
    };
  } catch (error) {
    colorTexture?.dispose();
    roughnessTexture?.dispose();
    normalTexture?.dispose();
    throw error;
  }
}

function disposeCanvasTexture(texture: CanvasTexture | null): void {
  if (!texture) return;
  texture.dispose();
  texture.image.width = 0;
  texture.image.height = 0;
}

export function disposeParchmentTextureSet(textureSet: ParchmentTextureSet): void {
  disposeCanvasTexture(textureSet.color);
  disposeCanvasTexture(textureSet.roughness);
  disposeCanvasTexture(textureSet.normal);
}
