# Parchment Scroll Rebuild V4 执行报告

日期：2026-08-04  
功能分支：`feat/parchment-scroll-rebuild-v4`  
远端基线：`main` @ `5ccd87f2904b25c4fb960421bfaac5a2f4d78932`  
计划入口：`README.md` → `00_MASTER_REBUILD_PLAN.md` → `01`–`09`

## 执行边界

本次执行停止 V3 计划，不继续扩展球形 `GlobeScene`、旧控制台布局或生产界面的 Auto / 3D / 2D 按钮。新的正式入口由 `src/archive-app/` 提供；旧入口已隔离到 `src/legacy/`，仅在开发环境通过 `?legacy=1` 调试使用，生产构建不会自动切换回 legacy。

Git smart-HTTP 在当前环境无法连接 GitHub 的 443 端口，因此没有把本地旧提交误当作远端基线。已用已认证 GitHub API 验证上述 `main` SHA，并先在 GitHub 上从该精确 SHA 创建功能分支；本地实现与后续远端提交以该分支 ref 为父提交。这个传输限制和回退路径保留在报告中，未伪装成普通 `git fetch` 成功。

## 计划阅读顺序

已完整阅读并按 README 顺序执行：

1. `docs/plans/CURRENT_PLAN.md`
2. `docs/plans/2026-08-04-parchment-scroll-rebuild-v4/README.md`
3. `00_MASTER_REBUILD_PLAN.md`
4. `01_FAILURE_AUDIT_AND_DECISIONS.md`
5. `02_NEW_APP_BOUNDARY_AND_LEGACY_QUARANTINE.md`
6. `03_PARCHMENT_SCROLL_SCENE_SPEC.md`
7. `04_MAP_PROJECTION_CAMERA_AND_INPUT_SPEC.md`
8. `05_TIMELINE_DRAWER_AND_MOTION_SPEC.md`
9. `06_LAYOUT_SCROLL_ROUTING_AND_ACCESSIBILITY.md`
10. `07_DATA_REUSE_AND_MIGRATION_RULES.md`
11. `08_IMPLEMENTATION_PHASES.md`
12. `09_TESTING_CI_ACCEPTANCE_AND_HANDOFF.md`

## 阶段状态

状态只使用“完成 / 部分完成 / 延后 / 未完成”，不把 demo 数据或技术原型写成完整产品交付。

| 阶段 | 状态 | 实际结果与边界 |
| --- | --- | --- |
| Phase 0 基线审计 | 完成 | 记录旧 build、lint、unit、E2E 结果，保存 `baseline-old-home.png` 与 `baseline-old-interaction.webm`。 |
| Phase 1 新应用边界 | 完成 | 建立 `src/archive-app/`，将旧入口移入 `src/legacy/`；正式入口支持 `/`、`/archive`、`/submit`、`/about` 与记录路由，文档恢复正常滚动。 |
| Phase 2 羊皮卷场景 | 完成 | 使用稳定的程序化羊皮纸表面、上下卷曲几何、材质和灯光，R3F 场景中只有一套正式地图画布。纹理按质量档位缓存，不在每帧重建。 |
| Phase 3 世界地图与坐标 | 完成 | 使用仓库本地 `public/countries-110m.json`、`topojson-client` 和 Equal Earth 投影；世界边界、坐标金标、标签与羊皮卷表面共享投影/表面采样。 |
| Phase 4 相机与输入 | 完成 | reducer 维护单一 `target` / `zoom` 相机状态；拖动、键盘移动、缩放按钮和 Ctrl/Meta+滚轮可操作；普通滚轮保留页面滚动；拖动后 2 秒相机快照不回弹。 |
| Phase 5 时间轴与动效 | 完成 | 时间轴位于羊皮卷下端，拖动有 preview range，pointer-up/blur 只提交一次；支持 undated 过滤，显示年份不产生 year 0；减少动效时仍保留 3D。 |
| Phase 6 坐标、抽屉与多条目 | 完成 | 金色坐标标记支持键盘/屏幕阅读器列表；同坐标多条目先出现选择器；抽屉保存相机快照、支持 Escape、焦点返回和移动端 bottom sheet。 |
| Phase 7 fallback、路由、可访问性 | 完成 | WebGL 不可用或强制 `?forceFallback=1` 时自动显示本地 SVG 兼容地图；没有生产模式切换按钮；路由使用统一解析器与 popstate；提供 SR-only 条目列表。 |
| Phase 8 数据复用与迁移 | 部分完成 | 新应用只通过 `src/domain/archive/` 访问受控的 `ArchiveEntry` 适配器和 demo 内容，旧 UI 不在正式路径中直接复用。完整档案内容、后端、认证、提交工作流和全量历史数据迁移没有被虚构为本阶段完成。 |
| Phase 9 测试、CI、验收交付 | 部分完成 | 本地 build/lint/unit/E2E、实际截图和 WebM 交互录制均完成；GitHub Actions 工作流已加入。远端 Actions 运行结果需在分支推送后由 GitHub 产生，资源版权/来源核验也仍需补充。 |

## 已实现的垂直切片

- `src/archive-app/AppRoot.tsx` 负责正式应用边界、统一路由、能力检测和自动 fallback。
- `src/archive-app/scene/`、`parchment/` 提供 3D 羊皮卷、卷曲上下端、灯光与稳定画布。
- `src/archive-app/map/` 使用本地 TopoJSON 生成真实世界边界，同时提供真实 SVG 兼容视图，不是空白占位。
- `src/archive-app/coordinates/` 将档案位置分组为金色标记、标签和可访问列表。
- `src/archive-app/state/` 将相机、时间范围、抽屉和 fallback 状态集中管理。
- `src/archive-app/timeline/` 提供 preview/committed 双范围状态和下端羊皮纸时间轴。
- `src/archive-app/records/` 提供快照抽屉、焦点恢复、Escape 关闭和多条目选择。
- `src/legacy/README.md` 说明隔离范围、开发调试入口和明确的非目标。
- `.github/workflows/ci.yml` 执行 install、build、lint、unit、Playwright Chromium、E2E，并在失败时上传报告/测试工件。

## 验证结果

以下命令在最终实现提交前后均已复核：

| 命令 | 结果 |
| --- | --- |
| `npm run build` | 通过；Vite 保留大于 500 kB 的主 chunk 警告，未作为完成项隐藏。 |
| `npm run lint` | 通过；仅 legacy/旧数据文件/旧 `InteractiveMap.tsx` 有既存 hooks 或 unused 警告，新 V4 文件无错误。 |
| `npm run test` | 通过：13 个 test files、44 个 tests。 |
| `npm run test:e2e` | 通过：13 个测试，覆盖滚动、拖动、缩放、相机快照、抽屉、时间轴、多条目、reduced motion、fallback 和路由滚动。 |
| `npx playwright test tests/e2e/atlas-visual.spec.ts` | 通过；生成本报告列出的 V4 实际截图。 |

E2E 的关键实际断言包括：`scrollY` 增长、普通 wheel 不改 zoom、Ctrl/Meta wheel 改变 zoom、拖动后的 `data-camera-target` 持久、抽屉关闭后触发器恢复焦点、reduced motion 仍有 canvas、fallback 页面没有 Auto / 3D / 2D 模式按钮。

## 验收工件

所有文件位于 `docs/plans/2026-08-04-parchment-scroll-rebuild-v4/artifacts/`：

- `global-parchment-scroll.png`
- `parchment-surface-closeup.png`
- `coordinate-annotations.png`
- `map-after-pan.png`
- `map-after-zoom.png`
- `timeline-idle.png`
- `timeline-dragging.png`
- `record-drawer.png`
- `archive-page-scroll.png`
- `mobile-parchment-map.png`
- `reduced-motion-3d.png`
- `webgl-fallback.png`
- `v4-interaction.webm`

录制实际包含页面滚动、地图拖动、修改键缩放、时间轴拖动、坐标条目打开和抽屉关闭；不是静态截图拼接。旧体验对照证据保留在 `baseline-old-home.png` 与 `baseline-old-interaction.webm`。

## 原子提交

本地阶段提交如下，均未修改或合并 `main`：

1. `1ab171c chore: capture pre-rebuild baseline`
2. `866d550 refactor: isolate legacy shell and add scrollable archive app`
3. `8418ee4 test: complete parchment scroll rebuild acceptance`
4. 本报告单独提交：`docs: add parchment scroll rebuild execution report`

## 性能与资源备注

- 当前生产构建主 chunk：约 1,236.85 kB minified / 357.85 kB gzip；legacy 与旧 Atlas 仍为懒加载 chunk。大 chunk 是已知后续优化项，不在报告中标记为已优化。
- 羊皮纸程序纹理按质量使用 512 / 384 / 256 尺寸缓存。
- 本地演示数据用于验收交互和布局；完整档案数据接入、Supabase/auth、真实提交后端和全量内容迁移未纳入已完成范围。
- `public/atlas/credits/ASSET_MANIFEST.md` 已标注本阶段资源边界，但继承的 TopoJSON 许可、来源和生产替换仍需正式核验。

## 延后与未完成事项

### 延后

- 完整历史档案 schema、生产 API/Supabase/auth、投稿持久化和权限流程。
- 全量内容/地点/多语言迁移以及真实内容审核流程。
- TopoJSON 的生产版权、来源、版本锁定和资源替换审查。
- 主 chunk 的进一步 code-splitting、真实设备性能预算和更多浏览器矩阵。
- 远端 GitHub Actions 的最终运行结果；工作流已提交，需等待 GitHub 对推送触发运行。

### 未完成

- 没有将旧 GlobeScene、旧控制台或 Auto / 3D / 2D 生产按钮继续改造成 V4 功能。
- 没有把技术占位、demo 数据或本地兼容回退描述成完整生产档案系统。
- 没有自动创建 PR，也没有合并 `main`。

## 交付结论

V4 的核心可交互垂直切片已完成并通过本地验收：新应用边界、可滚动 3D 羊皮卷地图、稳定拖动/缩放、时间轴、金色坐标、档案抽屉、自动兼容回退、可访问路径、实际截图和交互录制均已落地。完整生产数据迁移、资源权利核验、远端 CI 结果和性能深化保持“部分完成/延后”，等待后续明确范围，不作为本次交付的隐含完成项。
