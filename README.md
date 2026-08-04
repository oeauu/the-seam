# The Queer Archive

The Queer Archive 是一个以博物馆式数字档案为方向的 React + TypeScript + Vite 原型，用于浏览与解释跨地域、跨时期的酷儿文化材料。当前版本提供三维时空地图 MVP，同时保留原有档案浏览、详情、投稿和审核原型。

## 当前功能

- 可旋转、缩放的低饱和三维全球地球与地区聚类
- 区域档案展台、地点卡片和单条档案聚焦
- 时间范围、来源、文化意义和搜索筛选
- 博物馆式详情预览，并复用现有详情抽屉
- WebGL 不可用、减少动态效果或低性能环境下的二维回退
- 原有 D3 多级地图、档案列表、双语界面、投稿和审核原型
- 键盘导航、ESC 返回和可访问的同步档案列表

## 开发命令

```bash
npm install
npm run dev
npm run build
npm run lint
npm run test
npm run test:e2e
```

Playwright 测试首次运行前，如本机尚未安装浏览器，请执行：

```bash
npx playwright install chromium
```

## 三维与二维地图

地图入口默认根据 WebGL、`prefers-reduced-motion` 和设备能力选择渲染模式。地图面板内可以显式切换三维和二维模式。二维模式使用与三维选择器相同的档案、时间和分类筛选结果，适合作为无障碍和低性能回退。

三维模块通过 `React.lazy` 懒加载，非地图页面不会主动加载 Three.js 主场景。三维场景按 global、region、focused 三种导航状态组织，远景使用地区聚类，区域近景才展示具体档案卡片。

## 数据与内容状态

当前档案内容是演示数据，统一标记为 `contentStatus: "demo"`，尚待逐条史料核验。项目不会把演示内容当作已经完成核验的历史事实，也不会在本轮自动扩充历史条目或抓取网络图片。媒体字段包含替代文本和权利状态；无图条目使用档案类型占位卡。

## 技术架构

- React 19、TypeScript、Vite
- Three.js、React Three Fiber、Drei
- D3 与 TopoJSON：现有二维地图和区域数据
- Vitest、Testing Library、Playwright：单元、组件和端到端验证
- `src/features/atlas/`：类型、选择器、导航状态、三维场景、二维回退和地图控件
- `src/db/`：现有数据与地理资源的兼容层；地图和档案视图通过统一 `ArchiveEntry` 选择器消费数据

## 计划与执行记录

本轮实施计划位于 [`docs/plans/2026-08-04-museum-atlas-3d/`](docs/plans/2026-08-04-museum-atlas-3d/)。总控文件是 [`00_MASTER_EXECUTION_PLAN.md`](docs/plans/2026-08-04-museum-atlas-3d/00_MASTER_EXECUTION_PLAN.md)，最终执行结果记录在 [`EXECUTION_REPORT.md`](docs/plans/2026-08-04-museum-atlas-3d/EXECUTION_REPORT.md)。

## 视觉原则

项目采用低饱和、严谨、克制的数字档案馆视觉。文化材料本身是视觉主体，不使用参考视频中的金色奢华、霓虹粒子、游戏任务点或未经授权的艺术品图片。
