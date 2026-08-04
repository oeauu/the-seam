import { expect, test } from "@playwright/test";

const artifactRoot = "docs/plans/2026-08-04-parchment-scroll-rebuild-v4/artifacts";

test("captures the V4 parchment scroll acceptance states", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByTestId("parchment-stage")).toHaveAttribute("data-map-ready", "true");
  await page.screenshot({ path: `${artifactRoot}/global-parchment-scroll.png`, fullPage: true });
  const stage = page.getByTestId("parchment-stage");
  await stage.scrollIntoViewIfNeeded();
  await page.screenshot({ path: `${artifactRoot}/parchment-surface-closeup.png` });
  await page.screenshot({ path: `${artifactRoot}/coordinate-annotations.png` });

  const box = await stage.boundingBox();
  if (!box) throw new Error("Parchment stage is not measurable");
  await page.mouse.move(box.x + box.width * 0.48, box.y + box.height * 0.38);
  await page.mouse.down();
  await page.mouse.move(box.x + box.width * 0.34, box.y + box.height * 0.38, { steps: 8 });
  await page.mouse.up();
  await page.screenshot({ path: `${artifactRoot}/map-after-pan.png` });

  await page.keyboard.down("Control");
  await page.mouse.move(box.x + box.width * 0.5, box.y + box.height * 0.38);
  await page.mouse.wheel(0, -260);
  await page.keyboard.up("Control");
  await page.screenshot({ path: `${artifactRoot}/map-after-zoom.png` });
  await page.screenshot({ path: `${artifactRoot}/timeline-idle.png` });

  const start = page.getByLabel("时间轴起始年份");
  await start.dispatchEvent("pointerdown");
  await start.press("ArrowRight");
  await page.screenshot({ path: `${artifactRoot}/timeline-dragging.png` });
  await start.dispatchEvent("pointerup");

  await page.locator(".archive-marker-list__item").first().click();
  await page.screenshot({ path: `${artifactRoot}/record-drawer.png` });
  await page.locator(".record-drawer__close").click();

  await page.goto("/archive");
  await page.screenshot({ path: `${artifactRoot}/archive-page-scroll.png`, fullPage: true });

  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  await page.getByTestId("parchment-stage").scrollIntoViewIfNeeded();
  await expect(page.getByTestId("parchment-stage")).toHaveAttribute("data-map-ready", "true");
  await page.screenshot({ path: `${artifactRoot}/mobile-parchment-map.png` });

  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  await page.getByTestId("parchment-stage").scrollIntoViewIfNeeded();
  await expect(page.getByTestId("parchment-stage")).toHaveAttribute("data-map-ready", "true");
  await page.screenshot({ path: `${artifactRoot}/reduced-motion-3d.png` });

  await page.goto("/?forceFallback=1");
  await page.getByTestId("parchment-stage").scrollIntoViewIfNeeded();
  await expect(page.getByTestId("compatibility-map").locator("path").first()).toBeVisible();
  await page.screenshot({ path: `${artifactRoot}/webgl-fallback.png` });
});
