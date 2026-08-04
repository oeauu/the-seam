import { expect, test } from "@playwright/test";

const stage = (page: import("@playwright/test").Page) => page.getByTestId("parchment-stage");

async function scrollStageIntoView(page: import("@playwright/test").Page) {
  const mapStage = stage(page);
  await mapStage.scrollIntoViewIfNeeded();
  await expect(mapStage).toBeVisible();
  return mapStage;
}

test.describe("Parchment Scroll Rebuild V4", () => {
  test("keeps the homepage in normal document flow", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("heading", { name: "The map is a surface for memory." })).toBeVisible();
    const metrics = await page.evaluate(() => ({ scrollHeight: document.documentElement.scrollHeight, viewport: window.innerHeight }));
    expect(metrics.scrollHeight).toBeGreaterThan(metrics.viewport + 500);
    await page.mouse.wheel(0, 900);
    await expect.poll(() => page.evaluate(() => window.scrollY)).toBeGreaterThan(0);
    await page.getByRole("contentinfo").scrollIntoViewIfNeeded();
    await expect(page.getByRole("contentinfo")).toContainText("Parchment Scroll Rebuild V4");
  });

  test("pans the parchment without camera rebound", async ({ page }) => {
    await page.goto("/");
    const mapStage = await scrollStageIntoView(page);
    const before = await mapStage.getAttribute("data-camera-target");
    const box = await mapStage.boundingBox();
    expect(box).not.toBeNull();
    if (!box) return;
    await page.mouse.move(box.x + box.width * 0.45, box.y + box.height * 0.35);
    await page.mouse.down();
    await page.mouse.move(box.x + box.width * 0.34, box.y + box.height * 0.35, { steps: 8 });
    await page.mouse.up();
    const after = await mapStage.getAttribute("data-camera-target");
    expect(after).not.toBe(before);
    await page.waitForTimeout(2000);
    await expect(mapStage).toHaveAttribute("data-camera-target", after ?? "");
  });

  test("separates ordinary page wheel from modified map zoom", async ({ page }) => {
    await page.goto("/");
    const mapStage = await scrollStageIntoView(page);
    const box = await mapStage.boundingBox();
    expect(box).not.toBeNull();
    if (!box) return;
    const zoomBefore = await mapStage.getAttribute("data-camera-zoom");
    const scrollBefore = await page.evaluate(() => window.scrollY);
    await page.locator("[data-testid='parchment-stage']").dispatchEvent("wheel", { deltaY: -260, ctrlKey: true, bubbles: true, cancelable: true });
    await expect.poll(() => mapStage.getAttribute("data-camera-zoom")).not.toBe(zoomBefore);
    const scrollDuringZoom = await page.evaluate(() => window.scrollY);
    expect(Math.abs(scrollDuringZoom - scrollBefore)).toBeLessThan(40);
    await page.mouse.wheel(0, 700);
    await expect.poll(() => page.evaluate(() => window.scrollY)).toBeGreaterThan(scrollBefore);
  });

  test("keeps a camera snapshot through the record drawer and returns focus", async ({ page }) => {
    await page.goto("/");
    const mapStage = await scrollStageIntoView(page);
    const box = await mapStage.boundingBox();
    expect(box).not.toBeNull();
    if (!box) return;
    await page.mouse.move(box.x + box.width * 0.45, box.y + box.height * 0.35);
    await page.mouse.down();
    await page.mouse.move(box.x + box.width * 0.38, box.y + box.height * 0.35, { steps: 6 });
    await page.mouse.up();
    const snapshot = await mapStage.getAttribute("data-camera-target");
    const trigger = page.locator(".archive-marker-list__item").first();
    await trigger.click();
    await expect(page.locator("[data-record-drawer='true']")).toBeVisible();
    expect(await mapStage.getAttribute("data-camera-target")).toBe(snapshot);
    await page.locator(".record-drawer__close").click();
    await expect(page.locator("[data-record-drawer='true']")).toHaveCount(0);
    await expect(mapStage).toHaveAttribute("data-camera-target", snapshot ?? "");
    await expect(trigger).toBeFocused();
  });

  test("does not open a drawer after a map drag", async ({ page }) => {
    await page.goto("/");
    const mapStage = await scrollStageIntoView(page);
    const box = await mapStage.boundingBox();
    expect(box).not.toBeNull();
    if (!box) return;
    await page.mouse.move(box.x + box.width * 0.55, box.y + box.height * 0.42);
    await page.mouse.down();
    await page.mouse.move(box.x + box.width * 0.28, box.y + box.height * 0.42, { steps: 10 });
    await page.mouse.up();
    await expect(page.locator("[data-record-drawer='true']")).toHaveCount(0);
  });

  test("previews the timeline before committing its range", async ({ page }) => {
    await page.goto("/");
    const timeline = page.locator(".parchment-timeline");
    await timeline.scrollIntoViewIfNeeded();
    const start = page.getByLabel("时间轴起始年份");
    const committedBefore = await timeline.getAttribute("data-committed-range");
    await start.dispatchEvent("pointerdown");
    await start.press("ArrowRight");
    await expect(timeline).toHaveAttribute("data-is-dragging", "true");
    await expect(timeline).toHaveAttribute("data-committed-range", committedBefore ?? "");
    await start.dispatchEvent("pointerup");
    await expect(timeline).toHaveAttribute("data-is-dragging", "false");
    await expect.poll(() => timeline.getAttribute("data-committed-range")).not.toBe(committedBefore);
  });

  test("opens a multi-entry location chooser before the drawer", async ({ page }) => {
    await page.goto("/");
    const multiEntry = page.locator(".archive-sr-only button", { hasText: "西安市" }).first();
    await multiEntry.evaluate(element => element.click());
    await expect(page.locator(".location-picker")).toBeVisible();
    await page.locator(".location-picker__item").first().click();
    await expect(page.locator("[data-record-drawer='true']")).toBeVisible();
  });

  test("keeps three-dimensional parchment under reduced motion", async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto("/");
    const mapStage = await scrollStageIntoView(page);
    await expect(page.getByTestId("parchment-canvas")).toHaveCount(1);
    await expect(mapStage).toHaveAttribute("data-motion-profile", "reduced");
    await expect(mapStage).toHaveAttribute("data-rendering-capability", "webgl");
  });

  test("automatically shows the local compatibility map without mode buttons", async ({ page }) => {
    await page.goto("/?forceFallback=1");
    await expect(page.getByTestId("compatibility-map")).toBeVisible();
    await expect(page.getByTestId("parchment-canvas")).toHaveCount(0);
    const visibleButtons = await page.locator("button:visible").allTextContents();
    expect(visibleButtons.join(" ")).not.toMatch(/Auto|3D|2D/);
  });

  for (const route of ["/archive", "/submit", "/about"]) {
    test(`${route} remains vertically scrollable`, async ({ page }) => {
      await page.goto(route);
      const metrics = await page.evaluate(() => ({ scrollHeight: document.documentElement.scrollHeight, viewport: window.innerHeight }));
      expect(metrics.scrollHeight).toBeGreaterThan(metrics.viewport + 100);
      await page.mouse.wheel(0, 600);
      await expect.poll(() => page.evaluate(() => window.scrollY)).toBeGreaterThan(0);
    });
  }
});
