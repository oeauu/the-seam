# 01 当前实现审计

## 一、可直接保留的基础

当前 `feat/museum-atlas-3d` 已经建立以下可复用能力：

- React + TypeScript + Vite 工程
- React Three Fiber 与 Drei 三维入口
- `ArchiveEntry` 统一数据模型
- 时间范围、地点、来源、文化意义和对象类型字段
- reducer、selectors、时间与地理工具
- `global | region | focused` 场景状态
- `auto | 3d | 2d` 渲染模式
- 详情抽屉和 `#entry/`、`#atlas/` hash
- Vitest 与 Playwright 基础
- WebGL 失败时的二维兼容入口

本轮不得重新建立第二套数据模型或第二套筛选状态。

## 二、必须重构的问题

### 1. 全球地球仍是抽象球体

当前 `GlobeScene` 使用纯色球体和线框球，没有海岸线、国家边界、羊皮纸材质与历史地图质感。

### 2. 地区视图仍是矩形展台

当前 `RegionAtlasScene` 使用矩形箱体和平面。条目按当前数据范围临时归一化，无法表达真实地区轮廓，也无法保证坐标与地图一致。

### 3. 悬浮档案卡与新方向冲突

当前 `ArchiveCard3D` 在地图上方渲染完整 HTML 卡片。该方式遮挡严重、DOM 开销大，也偏离“金色坐标点 + 名称标签”的新视觉。

`ArchiveCard3D` 不再进入正式 Atlas 场景。可以保留文件用于回溯，最终应标记 deprecated 或删除无引用代码。

### 4. 相机目标与坐标投影不一致

当前地区卡片位置和聚焦位置使用不同坐标计算方式。必须建立统一的 `RegionProjectionContext`，让边界、坐标、标签和相机目标共享同一投影结果。

### 5. 同地点多条目缺少正式分组

需要优先使用稳定的 location ID。没有 location ID 时，才按经纬度容差和地点名称分组。多个条目不得生成完全重叠的多个坐标点。

### 6. 标签管理缺失

必须新增屏幕空间标签布局，解决：

- 地球背面标签穿透
- 屏幕边缘溢出
- 标签相互重叠
- 双语长度变化
- 远中近景显示预算
- 悬停与选中优先级
- 移动端标签过密

### 7. 时间轴仍是普通表单控件

当前双 range 输入虽然完成功能，但视觉上与地图分离。拖动时直接提交完整筛选，容易引发场景频繁更新。

本轮需要改为羊皮卷下端时间轴，并拆分 `previewRange` 与 `committedRange`。

### 8. 减少动态效果逻辑不合理

当前 `prefers-reduced-motion` 会自动进入二维。新方案要求保留低动态三维，只关闭惯性、回弹、自动旋转和非必要过渡。

### 9. 性能降级过于激进

PerformanceMonitor 不应因短暂掉帧立即永久回退二维。应先降低 DPR、纹理分辨率、标签预算、边界细节和材质效果，再在持续失败时提示切换二维。

### 10. 三维测试覆盖不足

现有 E2E 主要验证二维回退和详情链接。本轮必须覆盖三维地球、地区进入、坐标点击、标签显示、时间轴预览和低动态模式。

## 三、迁移清单

### 保留并扩展

- `AtlasViewport`
- `Atlas3DScene`
- `AtlasCameraRig`
- `AtlasFilters`
- `AtlasDetailOverlay`
- `Atlas2DFallback`
- `Legacy2DMap`
- types、selectors、reducer 与测试框架

### 原地重构

- `GlobeScene`
- `RegionAtlasScene`
- `ClusterMarker3D`
- `AtlasTimeline`
- `atlas.css`
- 地理工具与区域选择器

### 新增

- `ParchmentGlobeMaterial`
- `ParchmentRegionSurface`
- `CountryBoundaryLayer`
- `CoordinateMarker3D`
- `CoordinateMarkerLayer`
- `AtlasLabelLayer`
- `LocationEntryPopover`
- `ParchmentTimeline`
- `TimelineScrollEdge`
- `regionProjection.ts`
- `labelLayout.ts`
- `locationGroups.ts`
- `parchmentTexture.ts`
- `reducedMotionProfile.ts`

### 停止使用

- 悬浮 `ArchiveCard3D`
- 矩形地区展台
- 临时经纬度范围归一化
- `prefers-reduced-motion` 自动二维
- 每个 pointermove 直接提交完整筛选状态

## 四、审计结论

当前版本已经具备可靠的工程底座，但视觉和空间表达仍是占位原型。本轮是一次三维地图展陈系统重构，不是简单换色，也不是继续堆叠动画。完成后，用户应首先感知到真实地理、羊皮纸材质、金色坐标、名称层级和时间卷轴之间的连续关系。