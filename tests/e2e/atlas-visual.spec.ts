import { expect, test, type Page } from "@playwright/test";

const artifactDir = "docs/plans/2026-08-04-parchment-coordinate-atlas-v2/artifacts";

async function openGlobalAtlas(page: Page) {
  await page.goto("/#atlas/global");
  await expect(page.getByTestId("atlas-viewport")).toBeVisible();
  await expect(page.locator(".atlas-canvas")).toBeVisible();
  await page.waitForTimeout(4500);
}

test("captures the parchment atlas v2 acceptance states", async ({ page }) => {
  await openGlobalAtlas(page);
  await page.screenshot({ path: `${artifactDir}/global-parchment-globe.png` });
  await expect(page.locator('[data-testid^="atlas-label-location"]').first()).toBeVisible();
  await page.screenshot({ path: `${artifactDir}/coordinate-labels.png` });

  await page.getByTestId("atlas-label-region:europe").click();
  await expect(page).toHaveURL(/#atlas\/region\/europe$/);
  await page.waitForTimeout(2600);
  await page.screenshot({ path: `${artifactDir}/region-parchment-map.png` });

  await openGlobalAtlas(page);
  const timelineEnd = page.getByTestId("timeline-end");
  await timelineEnd.scrollIntoViewIfNeeded();
  const timelineBox = await timelineEnd.boundingBox();
  expect(timelineBox).not.toBeNull();
  if (timelineBox) {
    const y = timelineBox.y + timelineBox.height / 2;
    await page.mouse.move(timelineBox.x + timelineBox.width * 0.75, y);
    await page.mouse.down();
    await page.mouse.move(timelineBox.x + timelineBox.width * 0.55, y, { steps: 8 });
    await expect(page.getByTestId("timeline-preview-range")).toBeVisible();
    await page.screenshot({ path: `${artifactDir}/timeline-dragging.png` });
    await page.mouse.up();
    await expect(page.getByTestId("timeline-preview-range")).toHaveCount(0);
    await page.screenshot({ path: `${artifactDir}/timeline-committed.png` });
  }

  await page.locator(".atlas-presets button").first().click();
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.waitForTimeout(450);
  const multiEntryLocation = page.locator('[data-testid^="atlas-label-location"]').filter({ hasText: "· 2" }).first();
  await expect(multiEntryLocation).toBeVisible();
  await multiEntryLocation.click();
  await expect(page.getByTestId("location-entry-popover")).toBeVisible();
  await expect(page).toHaveURL(/#atlas\/location\//);
  await page.screenshot({ path: `${artifactDir}/multi-entry-location.png` });
  await page.getByTestId("location-entry-popover").locator("li button").first().click();
  await expect(page.locator("#detail-drawer")).toBeVisible();
  await page.screenshot({ path: `${artifactDir}/detail-drawer.png` });

  const reducedMotionPage = await page.context().newPage();
  await reducedMotionPage.emulateMedia({ reducedMotion: "reduce" });
  await openGlobalAtlas(reducedMotionPage);
  await expect(reducedMotionPage.getByTestId("reduced-motion-status")).toBeVisible();
  await expect(reducedMotionPage.getByTestId("atlas-2d-fallback")).toHaveCount(0);
  await reducedMotionPage.screenshot({ path: `${artifactDir}/reduced-motion-3d.png` });
  await reducedMotionPage.close();

  const fallbackPage = await page.context().newPage();
  await fallbackPage.addInitScript(`(() => {
    const originalGetContext = HTMLCanvasElement.prototype.getContext;
    HTMLCanvasElement.prototype.getContext = function (contextId, options) {
      if (contextId === "webgl" || contextId === "webgl2") return null;
      return originalGetContext.call(this, contextId, options);
    };
  })();`);
  await fallbackPage.goto("/#atlas/global");
  await expect(fallbackPage.getByTestId("atlas-viewport")).toBeVisible();
  await expect(fallbackPage.getByTestId("atlas-2d-fallback")).toBeVisible();
  await fallbackPage.screenshot({ path: `${artifactDir}/webgl-fallback-2d.png` });
  await fallbackPage.close();
});
