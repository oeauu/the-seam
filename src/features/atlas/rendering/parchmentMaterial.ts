import {
  FrontSide,
  MeshStandardMaterial,
  Vector2,
  type ColorRepresentation,
  type Side,
} from "three";
import {
  createParchmentTextureSet,
  disposeParchmentTextureSet,
  type ParchmentQuality,
  type ParchmentTextureSet,
} from "./parchmentTexture";

interface ParchmentMaterialQualityConfig {
  roughness: number;
  normalScale: number;
}

const PARCHMENT_MATERIAL_QUALITY: Readonly<Record<ParchmentQuality, ParchmentMaterialQualityConfig>> = Object.freeze({
  high: { roughness: 0.9, normalScale: 0.15 },
  medium: { roughness: 0.92, normalScale: 0.1 },
  low: { roughness: 0.96, normalScale: 0 },
});

export interface ParchmentMaterialOptions {
  textures: ParchmentTextureSet;
  quality?: ParchmentQuality;
  color?: ColorRepresentation;
  roughness?: number;
  metalness?: number;
  emissive?: ColorRepresentation;
  emissiveIntensity?: number;
  normalScale?: number;
  opacity?: number;
  transparent?: boolean;
  side?: Side;
}

export interface ParchmentMaterialResourceOptions {
  quality?: ParchmentQuality;
  seed?: number;
  color?: ColorRepresentation;
  roughness?: number;
  metalness?: number;
  emissive?: ColorRepresentation;
  emissiveIntensity?: number;
  normalScale?: number;
  opacity?: number;
  transparent?: boolean;
  side?: Side;
}

export interface ParchmentMaterialResource {
  material: MeshStandardMaterial;
  textures: ParchmentTextureSet;
}

export function createParchmentMaterial(options: ParchmentMaterialOptions): MeshStandardMaterial {
  const quality = options.quality ?? options.textures.quality;
  const qualityConfig = PARCHMENT_MATERIAL_QUALITY[quality];
  const opacity = options.opacity ?? 1;
  const normalScale = options.normalScale ?? qualityConfig.normalScale;

  const material = new MeshStandardMaterial({
    color: options.color ?? "#c8ad78",
    map: options.textures.color,
    roughnessMap: options.textures.roughness,
    normalMap: options.textures.normal ?? undefined,
    roughness: options.roughness ?? qualityConfig.roughness,
    metalness: options.metalness ?? 0.02,
    emissive: options.emissive ?? "#24170b",
    emissiveIntensity: options.emissiveIntensity ?? 0.02,
    normalScale: new Vector2(normalScale, normalScale),
    opacity,
    transparent: options.transparent ?? opacity < 1,
    side: options.side ?? FrontSide,
  });

  material.name = `ParchmentMaterial-${quality}`;
  return material;
}

export function createParchmentMaterialResource(
  options: ParchmentMaterialResourceOptions = {},
): ParchmentMaterialResource {
  const quality = options.quality ?? "high";
  const textures = createParchmentTextureSet({ quality, seed: options.seed });

  try {
    const material = createParchmentMaterial({
      textures,
      quality,
      color: options.color,
      roughness: options.roughness,
      metalness: options.metalness,
      emissive: options.emissive,
      emissiveIntensity: options.emissiveIntensity,
      normalScale: options.normalScale,
      opacity: options.opacity,
      transparent: options.transparent,
      side: options.side,
    });
    return { material, textures };
  } catch (error) {
    disposeParchmentTextureSet(textures);
    throw error;
  }
}

export function disposeParchmentMaterialResource(resource: ParchmentMaterialResource): void {
  resource.material.dispose();
  disposeParchmentTextureSet(resource.textures);
}
