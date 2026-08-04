import { expect, test } from "@playwright/test";

/*
 * Assumption: the map tab mounts AtlasViewport in the main application shell.
 * The 2D path is used here because it is deterministic in CI and does not
 * require a working WebGL implementation.
 */
test.describe("Museum Atlas", () => {
  test("loads the archive application shell", async ({ page }) => {
    await page.goto("/#atlas/global");

    await expect(page.locator("#app-logo")).toContainText("THE QUEER ARCHIVE");
    await expect(page.getByRole("navigation", { name: "Main Navigation" })).toBeVisible();
  });

  test("exposes an accessible atlas entry and a usable 2D fallback", async ({ page }) => {
    await page.goto("/#atlas/global");

    const atlas = page.getByTestId("atlas-viewport");
    await expect(atlas).toBeVisible();
    await expect(atlas).toHaveAttribute("aria-label", /博物馆时空地图|museum atlas/i);

    const modeSwitch = page.getByRole("group", { name: /地图模式|map mode/i });
    await expect(modeSwitch).toBeVisible();
    await expect(page.getByTestId("atlas-mode-2d")).toBeEnabled();

    await page.getByTestId("atlas-mode-2d").click();

    await expect(page.getByTestId("atlas-2d-fallback")).toBeVisible();
    await expect(page.getByRole("img", { name: /二维地图回退|two-dimensional map fallback/i })).toBeVisible();
  });

  test("opens the shared details drawer from the atlas entry list", async ({ page }) => {
    await page.goto("/#atlas/global");
    await page.getByTestId("atlas-mode-2d").click();

    await page.locator(".atlas-accessible-list button").first().press("Enter");

    await expect(page.locator("#detail-drawer")).toBeVisible();
    await expect(page.locator("#drawer-title")).not.toHaveText("");
  });

  test("opens a record from its share hash", async ({ page }) => {
    await page.goto("/#entry/entry_tuer_shen");
    await expect(page.locator("#detail-drawer")).toBeVisible();
  });
});
