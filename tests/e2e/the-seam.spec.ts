import { expect, test } from "@playwright/test";

test.describe("The Seam - Spatiotemporal Archive Core E2E Tests", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
  });

  test("renders header branding and switches language", async ({ page }) => {
    // Brand title
    const brand = page.locator(".seam-brand-title");
    await expect(brand).toHaveText("The Seam");

    // Subtitle defaults to Chinese
    const subtitle = page.locator(".seam-brand-subtitle");
    await expect(subtitle).toHaveText("时空历史数字档案");

    // Switch to English
    const enBtn = page.getByRole("button", { name: "EN" });
    await enBtn.click();
    await expect(subtitle).toHaveText("Spatiotemporal Historical Archive");

    // Switch back to Chinese
    const zhBtn = page.getByRole("button", { name: "中" });
    await zhBtn.click();
    await expect(subtitle).toHaveText("时空历史数字档案");
  });

  test("opens directory drawer, searches archive, and selects an entry", async ({ page }) => {
    // Open Index drawer
    const indexBtn = page.getByRole("button", { name: /档案索引|Index/ });
    await indexBtn.click();

    const drawer = page.locator(".seam-index-drawer");
    await expect(drawer).toBeVisible();

    // Search for Thomas Hall
    const searchInput = page.locator(".seam-search-input");
    await searchInput.fill("霍尔");

    const resultItem = page.locator(".seam-index-item-btn").first();
    await expect(resultItem).toBeVisible();
    await expect(resultItem).toContainText("霍尔");

    // Click item -> drawer closes and record panel opens
    await resultItem.click();
    await expect(drawer).toBeHidden();

    const panel = page.locator(".seam-record-panel");
    await expect(panel).toBeVisible();
    await expect(panel.locator(".seam-record-title")).toContainText("托马斯(因)·霍尔");
  });

  test("direct permalink loads record panel at /record/:slug", async ({ page }) => {
    await page.goto("/record/thomas-hall");

    const panel = page.locator(".seam-record-panel");
    await expect(panel).toBeVisible();
    await expect(panel.locator(".seam-record-title")).toContainText("托马斯(因)·霍尔");

    // Verify key archival sections
    await expect(panel.locator(".seam-historiography-box")).toBeVisible();
    await expect(panel.locator(".seam-record-sources-section")).toBeVisible();

    // Close panel
    const closeBtn = panel.locator(".seam-record-close-btn");
    await closeBtn.click();
    await expect(panel).toBeHidden();
  });

  test("timeline collapse immediately displays all eras per Section 8.4", async ({ page }) => {
    const timeline = page.locator(".seam-timeline");
    await expect(timeline).toBeVisible();

    // Click collapse button
    const collapseBtn = page.locator(".seam-timeline-collapse-btn");
    await collapseBtn.click();

    // Expanded timeline should be hidden, replaced by collapsed bar
    await expect(timeline).toBeHidden();
    const expandBtn = page.locator(".seam-timeline-expand-btn");
    await expect(expandBtn).toBeVisible();
    await expect(expandBtn).toContainText("已展示全部历史时期");

    // Re-expand timeline
    await expandBtn.click();
    await expect(timeline).toBeVisible();
  });

  test("opens and closes About and Submit modals", async ({ page }) => {
    // Open About Modal
    const aboutBtn = page.getByRole("button", { name: /关于项目|About/ });
    await aboutBtn.click();

    const aboutModal = page.locator(".seam-modal-content");
    await expect(aboutModal).toBeVisible();
    await expect(aboutModal.locator("#about-title")).toContainText("关于 The Seam");

    // Close About Modal
    await page.locator(".seam-modal-close").click();
    await expect(aboutModal).toBeHidden();

    // Open Submit Modal
    const submitBtn = page.locator(".seam-nav-btn-submit");
    await submitBtn.click();

    const submitModal = page.locator(".seam-modal-content");
    await expect(submitModal).toBeVisible();
    await expect(submitModal.locator("#submit-title")).toContainText("向 The Seam 投稿档案");
    await expect(submitModal.locator(".seam-email-address")).toBeVisible();

    // Close Submit Modal
    await page.locator(".seam-modal-close").click();
    await expect(submitModal).toBeHidden();
  });
});
