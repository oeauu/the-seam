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
    await expect(page.locator(".seam-globe-canvas-wrapper")).toHaveAttribute("data-ready", "true");
    await page.screenshot({path:"test-results/seam-desktop-record.png"});

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

  test("country map survives reload and history, and filtering works beside a record", async ({ page }) => {
    await page.goto("/country/156");
    await expect(page.locator(".seam-country-name")).toHaveText("中国");
    const markers = page.locator(".seam-gold-marker-group");
    const total = await markers.count();
    expect(total).toBeGreaterThan(0);
    await markers.first().focus();
    await page.keyboard.press("Enter");
    if (await page.locator(".seam-cluster-picker-modal").isVisible()) await page.locator(".seam-cluster-item-btn").first().click();
    await expect(page.locator(".seam-record-panel")).toBeVisible();
    await page.getByRole("slider").first().focus();
    await page.keyboard.press("End");
    await expect(markers).toHaveCount(0);
    await page.getByRole("button", {name:"收起时间轴"}).click();
    await expect(page.locator(".seam-record-panel")).toBeVisible();
    await expect(markers).toHaveCount(total);
    await page.reload();
    await expect(page.locator(".seam-country-name")).toHaveText("中国");
    await expect(page.locator(".seam-record-panel")).toBeVisible();
    await page.locator(".seam-record-close-btn").click();
    await expect(page).toHaveURL(/\/country\/156$/);
    await page.goBack();
    await expect(page.locator(".seam-record-panel")).toBeVisible();
  });

  test("unconfigured submissions never use a fabricated mailbox", async ({page}) => {
    await page.getByRole("button",{name:"Submit"}).click();
    await expect(page.locator(".seam-email-address")).toHaveText("投稿邮箱尚未公布");
    await expect(page.getByRole("button",{name:"复制邮箱"})).toBeDisabled();
    await expect(page.locator('a[href^="mailto:"]')).toHaveCount(0);
    await page.keyboard.press("Escape");
    await expect(page.locator("#submit-title")).toBeHidden();
  });

  test("mobile country map and record panel fit the viewport", async ({page}) => {
    await page.setViewportSize({width:390,height:844});
    await page.goto("/country/156");
    await expect(page.locator(".seam-country-name")).toHaveText("中国");
    await page.getByRole("button",{name:"放大地图"}).click();
    await page.screenshot({path:"test-results/seam-mobile-country.png"});
    await page.getByRole("button",{name:"档案索引与搜索"}).click();
    await page.locator(".seam-search-input").fill("霍尔");
    await page.locator(".seam-index-item-btn").click();
    await expect(page.locator(".seam-record-panel")).toBeVisible();
    const panel = await page.locator(".seam-record-panel").boundingBox();
    expect(panel?.width).toBeLessThanOrEqual(390);
    expect(panel?.y).toBeGreaterThan(0);
    await page.locator(".seam-record-close-btn").click();
    await page.getByRole("button",{name:"收起时间轴"}).click();
    await expect(page.locator(".seam-timeline-expand-btn")).toBeVisible();
  });

  test("old archive permalinks and WebGL fallback remain usable", async ({page}) => {
    await page.goto("/record/entry-sappho");
    await expect(page.locator(".seam-record-title")).toContainText("萨福");
    await page.locator(".seam-record-close-btn").click();
    await page.getByRole("button",{name:"二维浏览",exact:true}).click();
    await page.locator(".seam-accessible-map select").selectOption("156");
    await expect(page.locator(".seam-country-name")).toHaveText("中国");
    await page.addInitScript(() => {HTMLCanvasElement.prototype.getContext = () => null;});
    await page.goto("/");
    await expect(page.locator(".seam-accessible-map")).toBeVisible();
  });

  test("globe separates dragging from country clicks and returns to 3D", async ({page}) => {
    await expect(page.locator(".seam-globe-canvas-wrapper")).toHaveAttribute("data-ready", "true");
    const canvas = page.locator("canvas");
    const bounds = await canvas.boundingBox();
    if (!bounds) throw new Error("Globe canvas has no bounds");
    const cx = bounds.x + bounds.width / 2, cy = bounds.y + bounds.height / 2;
    await page.mouse.move(cx, cy);
    await page.mouse.down();
    await page.mouse.move(cx + 70, cy - 30, {steps:8});
    await page.mouse.up();
    await expect(page.locator(".seam-country-view")).toHaveCount(0);
    await expect(page.locator(".seam-record-panel")).toHaveCount(0);
    await page.getByRole("button",{name:"重置视角"}).click();
    await page.screenshot({path:"test-results/seam-globe.png"});
    // Project a land point near 10 E, 15 N on the reset globe.
    await page.mouse.click(cx + bounds.height * .088, cy - bounds.height * .136);
    await expect(page.locator(".seam-country-view")).toBeVisible();
    await page.getByRole("button",{name:"← 返回三维地球仪"}).click();
    await expect(page.locator(".seam-globe-canvas-wrapper")).toHaveAttribute("data-ready", "true");
  });
});
