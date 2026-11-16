import { expect, test } from "@playwright/test";

test.describe("The Seam - Spatiotemporal Archive Core E2E Tests", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
  });

  test("renders header branding and switches language", async ({ page }) => {
    // Brand title without subtitle
    const brand = page.locator(".seam-brand-title");
    await expect(brand).toHaveText("The Seam");
    await expect(page.locator(".seam-brand-subtitle")).toHaveCount(0);

    // Switch to English
    const enBtn = page.getByRole("button", { name: "EN" });
    await enBtn.click();
    await expect(page.getByRole("button", { name: "Index" })).toBeVisible();

    // Switch back to Chinese
    const zhBtn = page.getByRole("button", { name: "中" });
    await zhBtn.click();
    await expect(page.getByRole("button", { name: "档案索引与搜索" })).toBeVisible();
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
    await expect(panel.locator(".seam-record-deck")).toBeVisible();
    await expect(panel.locator(".seam-record-aliases")).toHaveCount(0);
  });

  test("direct permalink loads record panel at /record/:slug", async ({ page }) => {
    await page.goto("/record/thomas-hall");

    const panel = page.locator(".seam-record-panel");
    await expect(panel).toBeVisible();
    await expect(panel.locator(".seam-record-title")).toContainText("托马斯(因)·霍尔");
    await expect(panel.locator(".seam-record-deck")).toBeVisible();
    await expect(panel.locator(".seam-record-aliases")).toHaveCount(0);

    // Verify key archival sections
    await expect(panel.locator(".seam-record-narrative-section")).toBeVisible();
    await expect(panel.locator(".seam-record-historiography-section")).toHaveCount(0);
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
    await expect(page).toHaveURL(/\/about$/);
    await expect(aboutModal.locator("#about-title")).toContainText("关于 The Seam");
    await expect(aboutModal).toContainText("性别气质不明或流动");

    // Close About Modal
    await page.locator(".seam-modal-close").click();
    await expect(aboutModal).toBeHidden();
    await expect(page).toHaveURL(/\/$/);

    // Open Submit Modal
    const submitBtn = page.locator(".seam-nav-btn-submit");
    await expect(submitBtn).toHaveText("投稿");
    await submitBtn.click();

    const submitModal = page.locator(".seam-modal-content");
    await expect(submitModal).toBeVisible();
    await expect(page).toHaveURL(/\/submit$/);
    await expect(submitModal.locator("#submit-title")).toHaveText("向 The Seam 投稿");
    await expect(submitModal.locator(".seam-email-address")).toBeVisible();

    // Close Submit Modal
    await page.locator(".seam-modal-close").click();
    await expect(submitModal).toBeHidden();
    await expect(page).toHaveURL(/\/$/);
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
    await page.getByRole("slider").nth(1).focus();
    await page.keyboard.press("Home");
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

  test("configured mailbox uses the.seam@outlook.com without fabricated placeholders", async ({ page }) => {
    await page.getByRole("button", { name: /投稿|Submit/ }).click();
    await expect(page.locator(".seam-email-address")).toHaveText("the.seam@outlook.com");
    await expect(page.getByRole("button", { name: "复制邮箱" })).toBeEnabled();
    await page.keyboard.press("Escape");
    await expect(page.locator("#submit-title")).toBeHidden();
  });

  test("mobile country map and record panel fit the viewport", async ({page}) => {
    await page.setViewportSize({width:390,height:844});
    await page.goto("/country/156");
    await expect(page.locator(".seam-country-name")).toHaveText("中国");
    await expect(page.locator(".seam-subregions-labels-layer text").first()).toBeVisible();
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
    await page.addInitScript(() => {HTMLCanvasElement.prototype.getContext = () => null;});
    await page.goto("/");
    await expect(page.locator(".seam-accessible-map")).toBeVisible();
    await page.locator(".seam-accessible-map select").selectOption("156");
    await expect(page.locator(".seam-country-name")).toHaveText("中国");
  });

  test("globe separates dragging from country clicks, locks on first click, opens 2D map on second click, and renders nameplates", async ({page}) => {
    await expect(page.locator(".seam-globe-canvas-wrapper")).toHaveAttribute("data-ready", "true");
    const firstPlate = page.locator(".seam-globe-nameplate").first();
    await expect(firstPlate).toBeVisible();
    const firstPlateTitle = await firstPlate.getAttribute("title");
    const plateBeforeDrag = await firstPlate.boundingBox();
    expect(await firstPlate.evaluate(el => ({ left: getComputedStyle(el).left, top: getComputedStyle(el).top }))).toEqual({ left: "0px", top: "0px" });

    const canvas = page.locator("canvas");
    const bounds = await canvas.boundingBox();
    if (!bounds) throw new Error("Globe canvas has no bounds");
    const cx = bounds.x + bounds.width / 2, cy = bounds.y + bounds.height / 2;

    // Dragging rotates without locking a country or opening 2D map, and nameplates track projected coordinates
    await page.mouse.move(cx, cy);
    await page.mouse.down();
    await page.mouse.move(cx + 70, cy - 30, {steps:8});
    await page.mouse.up();
    if (firstPlateTitle && plateBeforeDrag) {
      const samePlateAfter = page.locator(`.seam-globe-nameplate[title="${firstPlateTitle}"]`);
      if (await samePlateAfter.count() > 0 && await samePlateAfter.isVisible()) {
        const plateAfterDrag = await samePlateAfter.boundingBox();
        expect(await samePlateAfter.evaluate(el => ({ left: getComputedStyle(el).left, top: getComputedStyle(el).top }))).toEqual({ left: "0px", top: "0px" });
        if (plateAfterDrag) {
          expect(plateAfterDrag.x).toBeGreaterThan(plateBeforeDrag.x);
          expect(Math.hypot(plateAfterDrag.x - plateBeforeDrag.x, plateAfterDrag.y - plateBeforeDrag.y)).toBeGreaterThan(10);
        }
      }
    }
    await expect(page.locator(".seam-globe-lock-card")).toHaveCount(0);
    await expect(page.locator(".seam-country-view")).toHaveCount(0);
    await expect(page.locator(".seam-record-panel")).toHaveCount(0);

    // Zoom controls, timeline default 2500 BCE range, UN notice, zoom-out dot-only mode & reset view work
    await expect(page.locator(".seam-timeline-active-range")).toContainText("公元前2500年");
    await page.getByRole("button", { name: "联合国边界标准" }).click();
    await expect(page.locator(".seam-un-notice-popover")).toBeVisible();
    await page.getByRole("button", { name: "联合国边界标准" }).click();
    await expect(page.locator(".seam-un-notice-popover")).toBeHidden();
    await page.getByRole("button",{name:"缩小地球"}).click();
    await page.getByRole("button",{name:"缩小地球"}).click();
    await expect(page.locator(".seam-globe-nameplate")).toHaveCount(0);
    await page.getByRole("button",{name:"放大地球"}).click();
    await page.getByRole("button",{name:"重置视角"}).click();
    await expect(page.locator(".seam-globe-nameplate").first()).toBeVisible();
    await page.screenshot({path:"test-results/seam-globe.png"});

    // First click on a land point near 10 E, 15 N locks the country
    await page.mouse.click(cx + bounds.height * .088, cy - bounds.height * .136);
    await expect(page.locator(".seam-globe-lock-card")).toBeVisible();
    await expect(page.locator(".seam-country-view")).toHaveCount(0);
    await page.waitForTimeout(450);
    await page.screenshot({path:"test-results/seam-globe-locked.png"});

    // Second click on the locked country (now centered) expands 2D country map with nameplates
    await page.waitForTimeout(150);
    await page.mouse.click(cx, cy);
    await expect(page.locator(".seam-country-view")).toBeVisible();
    await expect(page.locator(".seam-2d-nameplate")).toHaveCount(0);

    // Return to 3D and verify China shows 2D gold-dot nameplates, provinces, and sub-region filters
    await page.getByRole("button",{name:"← 返回三维地球仪"}).click();
    await expect(page.locator(".seam-globe-canvas-wrapper")).toHaveAttribute("data-ready", "true");
    await page.goto("/country/156");
    await expect(page.locator(".seam-2d-nameplate").first()).toBeVisible();
    await expect(page.locator(".seam-subregions-labels-layer text").first()).toBeVisible();
    await expect(page.locator(".seam-subregion-chip").nth(1)).toBeVisible();
    await page.screenshot({path:"test-results/seam-country-china.png"});
    await page.locator(".seam-subregion-chip").nth(1).click();
    await expect(page.locator(".seam-2d-nameplate")).toHaveCount(1);
    await page.locator(".seam-subregion-chip").first().click();
    await expect(page.locator(".seam-2d-nameplate")).toHaveCount(10);
  });

  test("renders gold pending badges beside info and supports interactive draft submission", async ({ page }) => {
    await page.locator(".seam-nav-btn-submit").click();
    const modal = page.locator(".seam-modal-content");
    await expect(modal.locator("#submit-title")).toHaveText("向 The Seam 投稿");
    await expect(modal.locator(".seam-no-taxonomy-reminder")).toHaveCount(0);

    const addSourceBtn = modal.getByRole("button", { name: "新增参考文献" });
    for (let i = 0; i < 4; i++) {
      await addSourceBtn.click();
    }
    await expect(addSourceBtn).toBeDisabled();
    await expect(modal.locator(".seam-sources-count")).toHaveText("5/5");
    await modal.getByRole("button", { name: "删除参考文献 5" }).click();
    await expect(modal.locator(".seam-sources-count")).toHaveText("4/5");

    await modal.getByLabel(/人物或事件名称/).fill("清代徽州契约文献待考录");
    await modal.getByLabel(/历史时期/).fill("18世纪中期");
    await modal.getByLabel(/具体年代\/事件待考证/).check();
    await modal.getByLabel(/发生或活动地点/).fill("安徽徽州");
    await modal.getByLabel(/精确地理坐标待考证/).check();
    await modal.getByLabel(/历史简介与文献事实/).fill("地方契约文书中所见历史记载，时间与具体村落尚待进一步比对原始档册。");
    await modal.getByLabel(/第一手史料/).fill("地方文书档案馆藏钞本");
    await modal.getByLabel("补充参考文献 2").fill("地方志补充文献卷二");
    await modal.getByRole("button", { name: "提交并生成草稿" }).click();

    await expect(modal.locator(".seam-submit-success-card .seam-pending-tag")).toHaveText("地点与事件待考证");
    const issueLink = modal.getByRole("link", { name: /通过 GitHub Issue 投递/ });
    await expect(issueLink).toBeVisible();
    const issueHref = await issueLink.getAttribute("href");
    expect(issueHref).toContain("https://github.com/oeauu/the-seam/issues/new");
    expect(issueHref).toContain("labels=archive-submission");
    await modal.getByRole("button", { name: "在档案中查看并定位" }).click();
    await expect(page.locator(".seam-record-panel .seam-record-title")).toHaveText("清代徽州契约文献待考录");
    await expect(page.locator(".seam-record-panel .seam-pending-tag").first()).toHaveText("地点与事件待考证");
    await page.locator(".seam-record-close-btn").click();

    await page.getByRole("button", { name: "档案索引与搜索" }).click();
    const filterBtn = page.locator(".seam-pending-filter-btn");
    await expect(filterBtn).toContainText("地点与事件待考 (1)");
    await filterBtn.click();
    await expect(page.locator(".seam-index-item .seam-pending-tag").first()).toHaveText("地点与事件待考证");
    await page.locator(".seam-index-item-btn").first().click();
    await expect(page.locator(".seam-record-panel .seam-pending-tag").first()).toHaveText("地点与事件待考证");
    await page.locator(".seam-record-close-btn").click();
  });
});
