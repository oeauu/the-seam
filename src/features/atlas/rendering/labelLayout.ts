export type LabelWorldPoint = readonly [number, number, number];

export interface LabelSize {
  readonly width: number;
  readonly height: number;
}

export interface LabelViewport {
  readonly width: number;
  readonly height: number;
}

export interface LabelCandidate {
  readonly id: string;
  readonly text: string;
  readonly worldPosition: LabelWorldPoint;
  readonly surfaceNormal?: LabelWorldPoint;
  readonly size?: LabelSize;
  readonly priority?: number;
  readonly selected?: boolean;
  readonly hovered?: boolean;
  readonly visible?: boolean;
  readonly ariaLabel?: string;
}

export interface LabelProjection {
  readonly ndcX: number;
  readonly ndcY: number;
  readonly ndcZ: number;
  /** Positive values face the camera; negative values are on the back side. */
  readonly facing: number;
}

export type LabelPlacement = "right-top" | "right-bottom" | "left-top" | "left-bottom";

export interface LabelBounds {
  readonly left: number;
  readonly top: number;
  readonly right: number;
  readonly bottom: number;
  readonly width: number;
  readonly height: number;
}

export interface PositionedLabel {
  readonly candidate: LabelCandidate;
  readonly anchor: { readonly x: number; readonly y: number };
  readonly bounds: LabelBounds;
  readonly placement: LabelPlacement;
  readonly depth: number;
  readonly priority: number;
}

export type LabelHiddenReason =
  | "hidden"
  | "projection"
  | "backface"
  | "outside-frustum"
  | "budget"
  | "collision";

export interface HiddenLabel {
  readonly candidate: LabelCandidate;
  readonly reason: LabelHiddenReason;
}

export interface LabelLayoutResult {
  readonly visibleLabels: PositionedLabel[];
  readonly hiddenLabels: HiddenLabel[];
}

export interface LabelLayoutOptions {
  readonly viewport: LabelViewport;
  readonly project: (candidate: LabelCandidate) => LabelProjection | null;
  readonly maxLabels?: number;
  readonly mobile?: boolean;
  readonly mobileMaxLabels?: number;
  readonly edgePadding?: number;
  readonly collisionGap?: number;
  readonly frontFaceEpsilon?: number;
  readonly defaultLabelSize?: LabelSize;
}

export const LABEL_PLACEMENTS: readonly LabelPlacement[] = [
  "right-top",
  "right-bottom",
  "left-top",
  "left-bottom",
];

const DEFAULT_LABEL_SIZE: LabelSize = { width: 96, height: 24 };

function safePositive(value: number | undefined, fallback: number): number {
  return value !== undefined && Number.isFinite(value) && value > 0 ? value : fallback;
}

function clamp(value: number, minimum: number, maximum: number): number {
  return Math.min(Math.max(value, minimum), maximum);
}

export function estimateLabelSize(text: string): LabelSize {
  const textWidth = Array.from(text).reduce((width, character) => {
    const codePoint = character.codePointAt(0) ?? 0;
    return width + (codePoint > 255 ? 13 : 7);
  }, 0);

  return {
    width: Math.ceil(clamp(textWidth + 16, 56, 280)),
    height: 24,
  };
}

function resolveLabelSize(candidate: LabelCandidate, options: LabelLayoutOptions): LabelSize {
  const fallback = candidate.text ? estimateLabelSize(candidate.text) : DEFAULT_LABEL_SIZE;
  const defaultSize = options.defaultLabelSize ?? fallback;
  return {
    width: safePositive(candidate.size?.width, safePositive(defaultSize.width, fallback.width)),
    height: safePositive(candidate.size?.height, safePositive(defaultSize.height, fallback.height)),
  };
}

function createBounds(left: number, top: number, size: LabelSize): LabelBounds {
  return {
    left,
    top,
    right: left + size.width,
    bottom: top + size.height,
    width: size.width,
    height: size.height,
  };
}

function boundsForPlacement(
  anchor: { readonly x: number; readonly y: number },
  size: LabelSize,
  placement: LabelPlacement,
  gap: number,
): LabelBounds {
  const left = placement.startsWith("right") ? anchor.x + gap : anchor.x - size.width - gap;
  const top = placement.endsWith("top") ? anchor.y - size.height - gap : anchor.y + gap;
  return createBounds(left, top, size);
}

function clampBounds(bounds: LabelBounds, viewport: LabelViewport, edgePadding: number): LabelBounds {
  const maximumLeft = Math.max(edgePadding, viewport.width - edgePadding - bounds.width);
  const maximumTop = Math.max(edgePadding, viewport.height - edgePadding - bounds.height);
  return createBounds(
    clamp(bounds.left, edgePadding, maximumLeft),
    clamp(bounds.top, edgePadding, maximumTop),
    bounds,
  );
}

function isInsideViewport(bounds: LabelBounds, viewport: LabelViewport, edgePadding: number): boolean {
  return bounds.left >= edgePadding
    && bounds.top >= edgePadding
    && bounds.right <= viewport.width - edgePadding
    && bounds.bottom <= viewport.height - edgePadding;
}

function expandBounds(bounds: LabelBounds, amount: number): LabelBounds {
  return createBounds(bounds.left - amount, bounds.top - amount, {
    width: bounds.width + amount * 2,
    height: bounds.height + amount * 2,
  });
}

export function rectsOverlap(first: LabelBounds, second: LabelBounds): boolean {
  return first.left < second.right
    && first.right > second.left
    && first.top < second.bottom
    && first.bottom > second.top;
}

function collides(bounds: LabelBounds, accepted: PositionedLabel[], gap: number): boolean {
  const expanded = expandBounds(bounds, gap);
  return accepted.some(label => rectsOverlap(expanded, label.bounds));
}

function screenPoint(projection: LabelProjection, viewport: LabelViewport): { x: number; y: number } {
  return {
    x: ((projection.ndcX + 1) / 2) * viewport.width,
    y: ((1 - projection.ndcY) / 2) * viewport.height,
  };
}

function isInFrustum(projection: LabelProjection, epsilon: number): boolean {
  return projection.ndcX >= -1
    && projection.ndcX <= 1
    && projection.ndcY >= -1
    && projection.ndcY <= 1
    && projection.ndcZ >= -1
    && projection.ndcZ <= 1
    && projection.facing > epsilon;
}

function retentionRank(candidate: LabelCandidate): number {
  if (candidate.selected) return 2;
  if (candidate.hovered) return 1;
  return 0;
}

function priorityValue(candidate: LabelCandidate): number {
  return candidate.priority !== undefined && Number.isFinite(candidate.priority) ? candidate.priority : 0;
}

function placementFor(
  candidate: LabelCandidate,
  projection: LabelProjection,
  options: LabelLayoutOptions,
  accepted: PositionedLabel[],
): PositionedLabel | null {
  const viewport = options.viewport;
  const edgePadding = Math.max(0, options.edgePadding ?? 8);
  const gap = Math.max(0, options.collisionGap ?? 6);
  const size = resolveLabelSize(candidate, options);
  const anchor = screenPoint(projection, viewport);

  for (const placement of LABEL_PLACEMENTS) {
    const bounds = boundsForPlacement(anchor, size, placement, gap);
    if (!isInsideViewport(bounds, viewport, edgePadding) || collides(bounds, accepted, gap)) continue;
    return {
      candidate,
      anchor,
      bounds,
      placement,
      depth: projection.ndcZ,
      priority: priorityValue(candidate),
    };
  }

  if (candidate.selected || candidate.hovered) {
    const fallbackPlacement = LABEL_PLACEMENTS[0];
    const fallbackBounds = clampBounds(
      boundsForPlacement(anchor, size, fallbackPlacement, gap),
      viewport,
      edgePadding,
    );
    return {
      candidate,
      anchor,
      bounds: fallbackBounds,
      placement: fallbackPlacement,
      depth: projection.ndcZ,
      priority: priorityValue(candidate),
    };
  }

  return null;
}

export function layoutAtlasLabels(
  candidates: readonly LabelCandidate[],
  options: LabelLayoutOptions,
): LabelLayoutResult {
  const hiddenLabels: HiddenLabel[] = [];
  const visibleLabels: PositionedLabel[] = [];
  const rankedCandidates = candidates
    .map((candidate, index) => ({ candidate, index }))
    .sort((first, second) => {
      const retentionDifference = retentionRank(second.candidate) - retentionRank(first.candidate);
      if (retentionDifference !== 0) return retentionDifference;
      const priorityDifference = priorityValue(second.candidate) - priorityValue(first.candidate);
      return priorityDifference !== 0 ? priorityDifference : first.index - second.index;
    });
  const maxLabels = options.mobile
    ? Math.max(0, options.mobileMaxLabels ?? 6)
    : options.maxLabels === undefined
      ? Number.POSITIVE_INFINITY
      : Math.max(0, options.maxLabels);
  const frontFaceEpsilon = options.frontFaceEpsilon ?? 0.02;
  let ordinaryLabels = 0;

  for (const { candidate } of rankedCandidates) {
    if (candidate.visible === false) {
      hiddenLabels.push({ candidate, reason: "hidden" });
      continue;
    }

    const projection = options.project(candidate);
    if (!projection) {
      hiddenLabels.push({ candidate, reason: "projection" });
      continue;
    }
    if (projection.facing <= frontFaceEpsilon) {
      hiddenLabels.push({ candidate, reason: "backface" });
      continue;
    }
    if (!isInFrustum(projection, frontFaceEpsilon)) {
      hiddenLabels.push({ candidate, reason: "outside-frustum" });
      continue;
    }

    const retained = Boolean(candidate.selected || candidate.hovered);
    if (!retained && ordinaryLabels >= maxLabels) {
      hiddenLabels.push({ candidate, reason: "budget" });
      continue;
    }

    const positioned = placementFor(candidate, projection, options, visibleLabels);
    if (!positioned) {
      hiddenLabels.push({ candidate, reason: "collision" });
      continue;
    }

    visibleLabels.push(positioned);
    if (!retained) ordinaryLabels += 1;
  }

  return { visibleLabels, hiddenLabels };
}
