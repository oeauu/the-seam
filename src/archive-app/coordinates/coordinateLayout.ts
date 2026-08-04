export interface LabelCandidate {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  priority: number;
}

export interface PositionedLabel extends LabelCandidate {
  offsetX: number;
  offsetY: number;
  visible: boolean;
}

function overlaps(a: PositionedLabel, b: PositionedLabel): boolean {
  const ax = a.x + a.offsetX;
  const ay = a.y + a.offsetY;
  const bx = b.x + b.offsetX;
  const by = b.y + b.offsetY;
  return Math.abs(ax - bx) < (a.width + b.width) / 2 && Math.abs(ay - by) < (a.height + b.height) / 2;
}

export function layoutCoordinateLabels(candidates: readonly LabelCandidate[], mobile = false): PositionedLabel[] {
  const visibleBudget = mobile ? 5 : 9;
  const sorted = [...candidates].sort((a, b) => b.priority - a.priority);
  const placed: PositionedLabel[] = [];
  for (const candidate of sorted) {
    const options = [
      [0.26, -0.2], [-0.26, -0.2], [0.28, 0.2], [-0.28, 0.2], [0, -0.34], [0, 0.34],
    ] as const;
    const offset = options.find(([offsetX, offsetY]) => !placed.some(item => overlaps(item, { ...candidate, offsetX, offsetY, visible: true })));
    const visible = placed.length < visibleBudget && Boolean(offset);
    const [offsetX, offsetY] = offset ?? [0, 0];
    placed.push({ ...candidate, offsetX, offsetY, visible });
  }
  return placed;
}
