# 00 总执行计划

## 1. 任务名称

The Seam 三维博物馆时空地图 MVP

## 2. 本轮最终目标

在现有 React + TypeScript + Vite 项目中，完成一个可运行的三维博物馆时空地图入口，并保留现有档案、投稿、审核和双语页面。

用户进入地图页后，应经历以下主流程：

1. 看到一个克制、低饱和、可旋转的三维地球
2. 地球以地区聚类标记呈现当前筛选条件下的档案数量
3. 点击地区后，镜头平滑推进并进入区域档案展台
4. 区域展台显示地图轮廓和位于相应地点上方的档案卡片
5. 用户拖动时间范围、选择来源或文化意义后，卡片以淡入、升起、下沉、淡出的方式更新
6. 点击卡片后，镜头聚焦到该档案，显示博物馆式预览面板
7. 用户可继续进入现有详情抽屉或完整条目页
8. 关闭详情后，镜头恢复到之前的区域视角
9. WebGL 不可用、用户开启减少动态效果、移动设备性能不足时，自动使用现有二维地图模式

## 3. 技术策略

本轮保留 Vite，不迁移 Next.js。

在当前技术栈上新增并使用以下能力：

- `three`
- `@react-three/fiber`
- `@react-three/drei`
- 一个轻量、严格类型的场景状态模块。可使用 Zustand，也可使用 React context 与 reducer。Codex 应根据现有依赖和实现复杂度选择，禁止继续把全部场景状态塞入 `App.tsx`
- Vitest 与 React Testing Library
- Playwright 用于最小端到端交互测试

新增依赖时不得写死未经验证的版本号。应安装与当前 React 19、TypeScript 和 Vite 兼容的稳定版本，并在执行报告中记录实际安装版本。

## 4. 架构原则

### 4.1 保留现有功能

以下现有能力必须保留：

- Header 与双语切换
- Archive 档案列表
- DetailsDrawer 详情抽屉
- ContributeForm 投稿原型
- Review 审核原型
- About 页面
- 搜索、来源分类、文化意义、对象类型等现有筛选能力
- 当前 D3 二维地图，作为显式切换和自动回退模式

### 4.2 重构而非叠加

必须将当前地图页拆成明确模块，不得在 `App.tsx` 和 `InteractiveMap.tsx` 中继续追加数百行代码。

建议形成以下结构，具体文件名可根据项目规范调整：

```text
src/
  features/
    atlas/
      components/
        MuseumAtlasView.tsx
        GlobeScene.tsx
        RegionAtlasScene.tsx
        ArchiveCard3D.tsx
        ClusterMarker3D.tsx
        AtlasCameraRig.tsx
        AtlasTimeline.tsx
        AtlasFilters.tsx
        AtlasDetailOverlay.tsx
        AtlasFallbackBoundary.tsx
      hooks/
        useAtlasData.ts
        useAtlasNavigation.ts
        useAtlasPerformance.ts
      state/
        atlasStore.ts
        atlasReducer.ts
      utils/
        geo.ts
        time.ts
        clustering.ts
        media.ts
      types.ts
  data/
    archiveEntries.ts
```

无需同时创建 `atlasStore.ts` 和 `atlasReducer.ts`。二者选择一种。

### 4.3 三种场景状态

场景至少包含三种明确状态：

- `global`：全球地球
- `region`：区域档案展台
- `focused`：单个档案聚焦

状态转换必须由统一导航控制器管理，禁止通过多个互相独立的布尔值拼接场景状态。

建议状态模型：

```ts
type AtlasMode = "global" | "region" | "focused";

interface AtlasNavigationState {
  mode: AtlasMode;
  selectedRegionId: string | null;
  selectedEntryId: string | null;
  previousCameraPose: CameraPose | null;
}
```

## 5. 首轮实施范围

### 5.1 必须完成

- 三维地球基础场景
- 鼠标和触控旋转、缩放
- 地区聚类标记
- 点击地区进入区域展台
- 区域地图平面或轻微浮雕
- 区域档案卡片
- 卡片按地点定位
- 卡片距离分级与可见性控制
- 时间范围筛选
- 来源筛选
- 文化意义筛选
- 镜头聚焦与返回
- 与现有详情抽屉贯通
- 二维回退
- 减少动态效果适配
- 桌面端与基础移动端适配
- 类型检查、构建、单元测试和最小端到端测试
- 项目 README 更新
- 执行报告

### 5.2 明确不做

- 正式用户认证
- Supabase 数据库迁移
- 生产级投稿工作流
- 实时多人协作
- 评论、私信和社交功能
- 自动生成档案文本
- 完整三维编年长廊
- 大规模图片抓取
- 使用参考视频中的作品图片、字体、品牌元素和视觉资产
- 将当前 mock 数据宣称为已完成史料核验

## 6. 视觉要求

参考视频只提供空间叙事和镜头语言，不提供最终视觉规范。

最终视觉必须符合 The Seam 的博物馆式数字档案美学：

- 低饱和
- 清晰
- 严谨
- 克制
- 大面积留白或深色展厅背景
- 有限的古铜、墨蓝、炭黑、象牙白、暖灰
- 不使用彩虹渐变作为全站主视觉
- 不使用金色奢华、游戏任务点、霓虹赛博、碎裂字体和夜店式视觉
- 不给所有材料套同一种西式画框
- 档案卡根据媒体类型使用图像卡、文献卡、文本卡、口述记录卡和占位卡

## 7. 数据要求

本轮必须停止 `EVENTS_DATA` 与 `MOCK_ENTRIES` 两套互相映射的主数据结构。

应建立单一、严格类型的 `ArchiveEntry` 模型，并通过选择器生成地图、时间轴、档案列表和详情所需视图数据。

现有数据先迁移为演示数据，并增加明确标记：

```ts
contentStatus: "demo" | "reviewed" | "published"
```

未经人工核验的现有内容一律标记为 `demo`。

不得在本轮自行新增历史事实。如果为了测试视觉需要更多条目，应生成明显标记的虚构 UI 测试条目，并且不得出现在生产默认数据中。

## 8. 时间系统要求

当前单年份、固定刻度时间轴必须升级为时间范围控制器。

最少支持：

- 起始年份输入
- 结束年份输入
- 双滑块范围选择
- BCE 与 CE 显示
- 模糊时间范围
- 时间不详
- 条目与筛选范围相交时显示

历史显示不得出现“公元 0 年”。内部计算如果需要连续坐标，必须通过转换函数处理，界面使用公元前 1 年与公元 1 年连续过渡。

## 9. 地理系统要求

一个条目允许：

- 单个精确地点
- 城市级地点
- 地区级地点
- 多地点
- 跨区域
- 地点不确定

全局地球不展示所有图片卡片，只展示聚类与少量代表性标记。

区域场景才展示具体档案卡片。

不得让数百张卡片同时常驻 WebGL 场景。

## 10. 性能与回退要求

- 三维地图代码必须懒加载，避免阻塞其他页面
- 图片纹理按需加载
- 远距离使用聚类标记
- 中距离只加载代表性缩略图
- 近距离加载当前视口内卡片
- 非选中卡片不得渲染复杂 HTML
- 使用性能监测自动降低像素比或卡片数量
- 支持 `prefers-reduced-motion`
- 支持 WebGL 检测
- 低性能或不支持环境使用现有二维地图
- 页面不得因单张损坏图片崩溃

## 11. Codex 执行协议

Codex 应：

1. 克隆或拉取仓库
2. 阅读本目录全部文件
3. 先运行现有安装、构建和 lint，记录基线
4. 创建分支 `feat/museum-atlas-3d`
5. 按 `05_IMPLEMENTATION_PHASES.md` 顺序执行
6. 每完成一个阶段运行对应检查
7. 使用原子提交，不把所有变化压成一个提交
8. 不修改或删除项目方案文件
9. 完成后新增 `EXECUTION_REPORT.md`
10. 推送功能分支
11. 不直接合并到 `main`

建议提交序列：

```text
chore: establish atlas types and test baseline
refactor: unify archive entry data model
feat: add 3d globe scene and region clusters
feat: add region atlas and archival cards
feat: add temporal range and curatorial filtering
feat: add camera focus and detail integration
feat: add accessibility and 2d fallback
test: cover atlas selectors and navigation flows
docs: update project readme and execution report
```

## 12. 最终交付

最终交付必须至少包括：

- 可运行代码
- 锁文件更新
- 新增测试
- README 更新
- `EXECUTION_REPORT.md`
- 功能分支推送成功
- 构建、lint、测试结果
- 已知限制
- 下一阶段建议

如果某个阶段无法完成，不得用假实现掩盖。应保留可运行状态，在执行报告中精确说明阻塞原因、已完成部分和最小后续步骤。
