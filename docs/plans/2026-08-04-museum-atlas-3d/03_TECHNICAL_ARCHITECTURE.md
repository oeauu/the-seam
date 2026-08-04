# 03 技术架构

## 1. 总体决策

本轮保留 React + TypeScript + Vite。

不迁移 Next.js，原因如下：

- 当前项目已经建立完整 Vite 原型
- 三维体验不依赖服务端渲染
- 本轮核心风险在 WebGL、状态和数据模型，不在路由框架
- 同时迁移框架会扩大回归范围
- Supabase 和正式后端不属于本轮范围

## 2. 推荐依赖

Codex 应安装与当前 React 19 兼容的稳定版本：

```text
three
@react-three/fiber
@react-three/drei
```

状态管理可选：

```text
zustand
```

测试：

```text
vitest
@testing-library/react
@testing-library/jest-dom
@playwright/test
```

如果 Drei 已提供所需相机控制、性能监测、Billboard 和 Html 能力，不再引入重复库。

不得同时引入多个动画框架。优先使用 React Three Fiber 的逐帧插值和 Drei 相机控制。如果确实需要独立补间库，应在执行报告中说明原因。

## 3. 模块边界

### 3.1 Atlas Feature

三维地图应成为独立 feature：

```text
src/features/atlas/
```

至少包含：

- 场景入口
- 全球场景
- 区域场景
- 相机控制
- 三维卡片
- 聚类标记
- 时间控制
- 筛选控制
- 详情覆盖层
- 性能与回退
- 类型与工具函数

### 3.2 旧 D3 地图

将现有 `InteractiveMap.tsx` 重命名或包装为：

```text
Legacy2DMap.tsx
```

不需要在第一步大规模重写旧地图。

新增统一入口：

```tsx
<AtlasViewport mode="auto" />
```

`AtlasViewport` 决定渲染三维或二维版本。

## 4. 场景树

建议场景结构：

```tsx
<Canvas>
  <AtlasEnvironment />
  <AtlasCameraRig />
  <Suspense fallback={null}>
    {mode === "global" && <GlobeScene />}
    {mode === "region" && <RegionAtlasScene />}
    {mode === "focused" && <RegionAtlasScene dimmed />}
  </Suspense>
  <AtlasPerformanceController />
</Canvas>
```

HTML 控件、时间轴、筛选器和详情面板放在 Canvas 外层，避免将大量 DOM 放进三维场景。

## 5. 全球地球实现

### 5.1 地球本体

使用 Three.js SphereGeometry。

地图视觉可以采用两种方式：

1. 本地低饱和地球纹理
2. 基于 GeoJSON 的国界线投影到球面

优先实现一个稳定、克制的本地纹理地球，再叠加国界线。

所有纹理必须本地化，避免运行时依赖第三方地图服务。

### 5.2 地理坐标转换

建立唯一转换函数：

```ts
latLngToVector3(latitude, longitude, radius)
```

禁止在多个组件复制球面转换公式。

### 5.3 地区聚类

第一版不需要复杂地理聚类库。

可按 `regionId` 或 `culturalRegionId` 聚合条目，计算：

- 条目数
- 中心坐标
- 代表性条目
- 时间跨度
- 来源分布

当数据量扩大后再考虑 Supercluster 或空间索引。

## 6. 区域展台实现

### 6.1 区域地图

建议流程：

1. 读取现有 GeoJSON 或 TopoJSON
2. 使用 D3 projection 将区域投影到二维平面
3. 在离屏 Canvas 绘制边界、地形色和标签
4. 将 Canvas 生成纹理
5. 映射到 Three.js PlaneGeometry
6. 使用相同投影将条目经纬度转换为平面坐标

这种方式比直接把每个行政区多边形转换为复杂三维 Mesh 更稳定，也更适合当前项目。

地图展台可增加极轻微高度或边缘阴影，但不得做成游戏地形。

### 6.2 地图投影

不同地区可以使用不同 projection 配置，但必须通过统一工厂生成：

```ts
createRegionProjection(regionId, bounds, viewport)
```

条目坐标、地图纹理和标签必须共享同一个投影。

## 7. 档案卡片实现

### 7.1 卡片组件

`ArchiveCard3D` 接收：

- entry
- world position
- distance level
- selected state
- media representation
- onSelect

### 7.2 朝向

区域展台中的卡片应大体朝向相机，可以使用 Billboard，但允许轻微固定倾角，以保持“展台中的档案卡”而不是悬浮 UI 图标。

### 7.3 卡片媒体

媒体类型：

```ts
type MediaKind =
  | "image"
  | "document"
  | "text"
  | "oral-history"
  | "legal-record"
  | "placeholder";
```

图片加载失败时必须回退到对应类型的馆藏卡。

### 7.4 同地点堆叠

同地点多条记录使用：

- 小型卡片堆叠
- 聚类数字
- 点击后展开扇形或列表

第一版优先使用聚类数字和 HTML 列表，不做复杂三维扇形动画。

## 8. 相机系统

### 8.1 统一控制

相机逻辑放在 `AtlasCameraRig` 中。

支持：

- 全球轨道控制
- 地区进入动画
- 档案聚焦动画
- 返回上一个相机姿态
- 动画中禁用重复输入
- ESC 返回

### 8.2 相机姿态

```ts
interface CameraPose {
  position: [number, number, number];
  target: [number, number, number];
  zoom?: number;
}
```

进入聚焦前保存 pose。

关闭聚焦后恢复 pose。

### 8.3 状态转换

相机动画与场景模式切换必须由单一状态机或 reducer 控制。

禁止：

- 多个 useEffect 同时修改相机
- 组件卸载后仍运行动画
- 点击多个标记导致动画叠加

## 9. 状态管理

地图专属状态从 `App.tsx` 移出。

建议状态：

```ts
interface AtlasState {
  renderMode: "auto" | "3d" | "2d";
  sceneMode: "global" | "region" | "focused";
  selectedRegionId: string | null;
  selectedEntryId: string | null;
  timeRange: HistoricalRange;
  includeUndated: boolean;
  selectedSourceIds: string[];
  selectedMeaningIds: string[];
  cameraTransition: "idle" | "entering" | "focusing" | "returning";
}
```

筛选结果通过纯选择器计算，不在多个组件内各自 filter。

## 10. 数据选择器

至少建立：

```ts
selectEntriesInTimeRange
selectEntriesByFilters
selectRegionClusters
selectEntriesForRegion
selectLocationClusters
selectEntryById
```

选择器必须可单元测试。

## 11. 时间轴实现

时间轴 UI 放在 Canvas 外。

时间数据类型：

```ts
interface HistoricalRange {
  start: HistoricalYear | null;
  end: HistoricalYear | null;
}
```

不得使用 JavaScript Date 表示古代年份。

建立：

```ts
historicalYearToAxis
axisToHistoricalYear
formatHistoricalYear
rangesOverlap
```

历史年份显示跳过公元 0 年。

## 12. 路由与分享

当前项目使用 hash。

本轮可继续使用 hash，但必须集中在一个路由适配器中。

建议：

```text
#atlas/global
#atlas/region/:regionId
#atlas/entry/:entryId
```

应用启动时根据 hash 恢复状态。

## 13. 性能策略

### 13.1 懒加载

三维地图模块通过 `React.lazy` 加载。

非地图页面不得加载 Three.js 主包。

### 13.2 纹理

- 使用缩略图，不加载原始大图
- 纹理缓存有上限
- 离开区域后释放不再需要的纹理
- 只对选中档案加载较高分辨率资源

### 13.3 LOD

至少实现逻辑级 LOD：

- global：地区聚类
- region far：地点聚类
- region near：具体卡片
- focused：单件档案

无需第一版使用 Three.js LOD 类，但行为必须存在。

### 13.4 自适应性能

可以使用 Drei `PerformanceMonitor` 或等效机制：

- 降低 DPR
- 减少卡片数量
- 关闭阴影
- 减少抗锯齿
- 必要时切换二维模式

## 14. 错误边界

至少处理：

- WebGL 创建失败
- GeoJSON 加载失败
- 图片纹理失败
- 单条数据缺少坐标
- 单条数据时间不详
- Canvas 运行时异常

三维模块出错时显示二维地图，不显示空白页。

## 15. CSS 重构

不要求一次拆完 `index.css`。

本轮至少把 Atlas 新样式放入独立文件：

```text
src/features/atlas/atlas.css
```

减少新增内联样式。

现有内联样式可逐步治理，不作为本轮全量任务。

## 16. 测试架构

单元测试重点：

- 时间范围转换
- 范围相交
- 地理坐标转换
- 聚类选择器
- 筛选选择器
- 导航 reducer

组件测试重点：

- 时间范围输入
- 二维回退切换
- 聚类点击
- 详情打开关闭

端到端重点：

- 地图页启动
- 进入地区
- 选择条目
- 打开详情
- 返回地区
- 切换二维模式

不要对像素级三维画面做脆弱快照测试。
