# The Seam 三维博物馆时空地图 MVP 执行报告

> 执行分支：`feat/museum-atlas-3d`
>
> 基线提交：`3a1c84a`（从最新 `main` 创建；本次未合并回 `main`）

## 1. 执行摘要

本轮在现有 React + TypeScript + Vite 项目中完成博物馆时空地图 MVP：新增严格的 `ArchiveEntry` 数据边界、三维地球与地区场景、区域档案卡片、时间范围与策展筛选、相机聚焦、详情整合、性能/无障碍回退，并保留原有 D3 二维地图、档案、投稿、审核、关于页和双语切换。

演示内容仍明确标记为 `contentStatus: "demo"`，没有新增未经核验的历史事实、正式投稿接口、Supabase、认证或生产数据迁移。

## 2. 基线状态

- 基线分支：`main`
- 基线提交：`3a1c84a`
- Node.js：`v24.18.0`
- npm：`11.16.0`
- 基线 `npm install`：通过；npm audit 报告 1 个 high severity 项，本轮未自动升级无关依赖
- 基线 `npm run build`：通过；Vite `8.1.3`
- 基线 `npm run lint`：通过，但已有旧代码 Hooks/未使用变量警告
- 基线没有 `test` 或 `test:e2e` 脚本；本轮补齐

## 3. 实际依赖

运行依赖：

- `@react-three/fiber` `9.7.0`
- `@react-three/drei` `10.7.7`
- `three` `0.185.1`

测试与类型依赖：

- `vitest` `4.1.10`
- `@testing-library/react` `16.3.2`
- `@testing-library/jest-dom` `7.0.0`
- `jsdom` `30.0.1`
- `@playwright/test` `1.62.1`
- `@types/three` `0.185.3`

新增脚本：`npm run test`、`npm run test:e2e`。

## 4. 文件结构变化

主要新增结构：

```text
src/features/atlas/
  AtlasViewport.tsx
  atlas.css
  types.ts
  selectors.ts
  components/
    Atlas3DScene.tsx
    GlobeScene.tsx
    RegionAtlasScene.tsx
    ClusterMarker3D.tsx
    ArchiveCard3D.tsx
    AtlasCameraRig.tsx
    AtlasFilters.tsx
    AtlasTimeline.tsx
    AtlasDetailOverlay.tsx
    Atlas2DFallback.tsx
    Legacy2DMap.tsx
  data/
    archiveEntries.ts
    taxonomy.ts
  state/
    atlasReducer.ts
  utils/
    geo.ts
    time.ts
```

测试与配置：

- `src/features/atlas/**/*.test.ts`
- `src/test/setup.ts`
- `vitest.config.ts`
- `playwright.config.ts`
- `tests/e2e/atlas.spec.ts`

交付文档：本报告和项目根目录 `README.md`。

## 5. 阶段完成情况

| 阶段 | 状态 | 实际交付 |
| --- | --- | --- |
| Phase 0：基线、分支与任务记录 | 已完成 | 同步最新 `main`、记录基线、创建功能分支和报告 |
| Phase 1：类型、测试和统一数据模型 | 已完成 | `ArchiveEntry`、时间/地理工具、taxonomy、选择器、reducer、Vitest 基础 |
| Phase 2：Atlas 模块和二维回退入口 | 已完成 | `AtlasViewport`、WebGL/减少动态效果检测、3D lazy load、显式模式切换 |
| Phase 3：全球地球与地区聚类 | 已完成 | 地球场景、经纬度投影、地区聚类、聚类标记、相机控制、性能回退 |
| Phase 4：区域档案展台 | 已完成 | 区域场景、档案卡片、同一数据选择器驱动的详情入口 |
| Phase 5：时间范围与筛选联动 | 已完成 | 时间范围交集、来源/文化意义/对象类型筛选、未定年选项 |
| Phase 6：档案聚焦与详情整合 | 已完成 | 聚焦态、返回导航、详情抽屉 canonical 数据适配、`#entry/`/`#atlas/` hash |
| Phase 7：性能、自适应与移动端 | 已完成 | Three.js 分包、PerformanceMonitor、减少动态效果转二维、响应式样式和键盘入口 |
| Phase 8：恢复有价值的旧功能 | 已完成 | 原 D3 地图封装为 `Legacy2DMap` 并懒加载；投稿、审核、Archive、About、双语保留 |
| Phase 9：测试、文档与收尾 | 已完成 | 单元测试、Playwright 流程、README、报告和交付检查 |

## 6. 测试与验证结果

以下命令在执行分支最后一次验证均通过：

```text
npm run build       ✅ TypeScript/Vite 构建通过
npm run lint        ✅ 通过；仅有基线 Hooks/未使用变量警告
npm run test        ✅ 4 files / 10 tests passed
npm run test:e2e    ✅ 4 tests passed
git diff --check    ✅ 在提交前执行
```

Playwright 使用 `channel: "chromium"`，避免本机 headless shell 下载失败；E2E 覆盖应用壳、Atlas 无障碍入口、显式二维回退、键盘打开详情抽屉和分享 hash。

## 7. 手工/交互验收

- 三维模式：默认能力检测通过时加载懒分包，全球/区域/聚焦状态共享选择器和详情入口。
- 二维模式：显式切换后同时保留原 D3 地图能力和 canonical 档案列表；筛选、时间和详情入口不改变数据边界。
- 键盘：Atlas 档案列表可聚焦；二维 SVG 聚类支持 Enter/Space；Escape 从聚焦返回区域或全球。
- 详情：Atlas 条目、旧分享 hash 和详情抽屉使用同一 `ARCHIVE_ENTRIES` 查找。
- 移动/减少动态效果：CSS 提供窄屏布局；`prefers-reduced-motion` 自动进入二维模式。

未使用真实移动设备和真实低性能 GPU 做物理测量；这部分以能力检测、PerformanceMonitor 和 CSS 回退实现，并作为后续实机验收项保留。

## 8. 性能、错误与回退

- Three.js 场景通过 `React.lazy` 单独分包；旧 D3 二维地图也按需加载。
- WebGL 不可用、用户选择二维或系统减少动态效果时，进入二维回退。
- R3F `PerformanceMonitor` 发现性能下降时切换到二维模式。
- 媒体暂用无外链占位资产，避免图片网络失败阻塞场景；媒体 rights/alt 字段仍在模型中保留。
- Vite 报告 `Atlas3DScene` minified chunk 大于 500 kB（当前约 912 kB，gzip 约 244 kB）；这是本轮已知优化项，不影响构建或运行。

## 9. 数据迁移与内容规则

- `src/features/atlas/data/archiveEntries.ts` 将现有 `MOCK_ENTRIES` 与 `EVENTS_DATA` 适配为严格 `ArchiveEntry[]`。
- 所有适配数据标记 `contentStatus: "demo"`，并保留来源、证据、解释风险、引用、媒体权利和 alt 信息。
- 历史年使用不含 year zero 的工具；旧数据中的 `0` 通过适配边界归一到 `1 CE`，没有新增 year zero。
- 时间筛选使用区间交集，而不是只比较起始年；无日期条目由 `includeUndated` 控制。
- 地点保留经纬度、精度、主地点和区域 ID；无法解析坐标的事件仍保留为无坐标档案，不伪造位置。
- 现有 Archive/投稿/审核等旧页面仍保留少量 legacy 数据结构，地图、Atlas 选择器和详情抽屉已统一走 canonical 边界；后续可继续迁移这些非地图页面。

## 10. 回退方案

运行时回退顺序：`auto` → WebGL/动态效果检测 → canonical 二维回退；二维分支内同时保留原 D3 `Legacy2DMap` 和可访问档案列表。用户也可以显式选择 `2D`。

代码回退：本轮没有数据库或不可逆数据迁移；若需要撤销，只需停止使用 `feat/museum-atlas-3d`，或恢复到基线 `3a1c84a`，不会影响远端 `main`。`backup_old/` 未纳入提交。

## 11. 已知问题

- 旧 `InteractiveMap` 的 Hooks 依赖警告仍存在；本轮只做包装，避免扩大 legacy 重构范围。
- `App.tsx` 中投稿/审核原型仍有原有宽松数据类型；Atlas 新代码没有新增 `any`、`as any` 或 `@ts-ignore`。
- npm audit 仍有 1 个 high severity 项，需要独立评估依赖升级。
- 三维场景 chunk 仍偏大，下一轮可继续拆分材质、场景和控制器。
- `backup_old/` 和 Playwright 运行生成的本地产物均不纳入功能分支。

## 12. 交付状态

- 功能分支：`feat/museum-atlas-3d`
- 远端目标：`origin/feat/museum-atlas-3d`
- 合并状态：未合并到 `main`
- 执行报告：`docs/plans/2026-08-04-museum-atlas-3d/EXECUTION_REPORT.md`
- 最终功能提交 SHA：`db18430`（包含全部代码与测试；其后仅追加本报告文档提交）
- 推送状态：已推送到 `origin/feat/museum-atlas-3d`；未合并 `main`

## 13. 后续建议

1. 将 Archive、投稿和审核原型中的 legacy 条目也迁移到 `ArchiveEntry`，减少双数据结构。
2. 拆分 `Atlas3DScene` 的材质与交互 chunk，并在真实移动设备/低端 GPU 上做帧率验收。
3. 评估 npm audit 项和旧地图 Hooks 警告，再单独安排依赖与 legacy 清理。
