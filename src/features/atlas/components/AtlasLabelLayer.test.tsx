import { fireEvent, render, screen } from "@testing-library/react";
import type { ReactNode } from "react";
import { describe, expect, it, vi } from "vitest";
import { AtlasLabelLayer } from "./AtlasLabelLayer";

vi.mock("@react-three/drei", () => ({
  Html: ({ children }: { children: ReactNode }) => <div data-testid="html-overlay">{children}</div>,
}));

vi.mock("@react-three/fiber", async () => {
  const { PerspectiveCamera } = await import("three");
  const camera = new PerspectiveCamera(50, 2, 0.1, 100);
  camera.position.set(0, 0, 5);
  camera.updateProjectionMatrix();
  camera.updateMatrixWorld();
  return {
    useThree: () => ({ camera, size: { width: 400, height: 240 } }),
    useFrame: () => undefined,
  };
});

describe("AtlasLabelLayer", () => {
  it("renders projected labels in a DOM overlay without archive cards", async () => {
    const onSelect = vi.fn();

    render(
      <AtlasLabelLayer
        candidates={[{
          id: "entry-1",
          text: "Archive point",
          worldPosition: [0, 0, 0],
          surfaceNormal: [0, 0, 1],
          size: { width: 120, height: 24 },
          selected: true,
        }]}
        onSelect={onSelect}
      />,
    );

    const overlay = await screen.findByTestId("html-overlay");
    expect(overlay).toBeInTheDocument();
    const label = screen.getByRole("button", { name: "Archive point" });
    expect(label).toHaveAttribute("data-selected", "true");
    fireEvent.click(label);
    expect(onSelect).toHaveBeenCalledWith("entry-1");
    expect(screen.queryByText(/Grade|Evidence|Source/)).not.toBeInTheDocument();
  });
});
