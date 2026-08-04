# 04 技术架构与迁移方案

## 一、总体架构

继续使用：

- Vite
- React
- TypeScript
- React Three Fiber
- Drei
- Three.js
- D3 / TopoJSON 工具
- Vitest
- Playwright

不迁移到 Next.js，不把地图重写成普通 DOM 页面。

MotionSites 只作为 DOM motion pattern 和组件组织参考，不作为运行时依赖。是否引入 Framer Motion 必须经过 bundle、维护成本和实际收益评估。

## 二、状态结构

建议扩展 Atlas 状态：

```ts
interface AtlasState {
  renderMode: "auto" | "3d" | "2d";
  qualityLevel: "high" | "medium" | "low";
  motionProfile: "full" | "reduced";
  sceneMode: "global" | "region" | "focused";
  selectedRegionId: string | null;
  selectedLocationGroupId: string | null;
  selectedEntryId: string | null;
  previewRange: HistoricalRange;
  committedRange: HistoricalRange;
  isTimelineDragging: boolean;
  hoveredMarkerId: string | null;
  selectedSourceIds: string[];
  selectedMeaningIds: string[];
  selectedObjectTypeIds: string[];
}
```

不得让时间轴、地图和详情各自维护冲突的本地筛选状态。

## 三、地点分组模型

新增 `LocationGroup`：

```ts
interface LocationGroup {
  id: string;
  locationId: string | null;
  name: LocalizedText;
  latitude: number;
  longitude: number;
  precision: LocationPrecision;
  entryIds: string[];
  regionId: string;
}
```

分组优先级：

1. 相同显式 location ID
2. 相同标准化地点名且坐标在容差内
3. 坐标在容差内且文化区域一致
4. 无法可靠分组时保持独立

容差必须根据位置精度决定，不得把相邻城市错误合并。

## 四、三维羊皮纸地球

### 材质生成

`parchmentTexture.ts` 使用固定 seed 生成：

- base color texture
- roughness texture
- 可选 normal texture

所有纹理在组件卸载时释放。纹理分辨率根据 quality level 选择。

### 边界生成

世界边界数据放入本地静态资源。构建阶段或首次加载时转换为球面线段。

建议缓存：

- high detail desktop geometry
- simplified mobile geometry

不得在每一帧重新生成边界。

## 五、地区地图投影

建立 `createRegionProjection(regionGeometry, viewport)`。

输出至少包括：

- D3 projection
- projected polygon paths
- map bounds
- world-to-scene transform
- scene-to-screen helper
- camera target

地区轮廓、坐标点、标签锚点和相机聚焦必须共享该上下文。

地区表面可采用：

1. ShapeGeometry + 轻微 extrusion
2. CanvasTexture 绘制在真实轮廓 mesh 上
3. 预处理 triangulation

优先选择稳定、可维护和适合多地区的方法。

## 六、坐标渲染

小数据量阶段可以使用独立 mesh。达到阈值后使用 InstancedMesh。

渲染层分为：

- region cluster markers
- location group markers
- selected marker overlay
- optional hover ring

标记 mesh 不承载文字。文字由独立标签层渲染。

## 七、标签系统

### 数据流

1. 选择器生成 label candidates
2. Three.js 场景提供世界坐标与相机矩阵
3. 投影到屏幕空间
4. 标签布局算法完成剔除与避让
5. React DOM 层渲染最终标签

### 性能

- 相机运动时降频计算
- 相机停止后精确布局
- 使用 ResizeObserver 处理容器变化
- 移动端设定标签预算
- 避免每个标签独立订阅 useFrame

## 八、羊皮卷时间轴

时间轴由 DOM 层渲染，但视觉上与三维场景连续。

建议结构：

```text
ParchmentTimeline
  TimelineScrollEdge
  TimelineScale
  TimelineRangeHandles
  TimelineInputs
  TimelinePresets
```

拖动更新通过 requestAnimationFrame 合并。坐标透明度可以读取 previewRange，精确聚类读取 committedRange。

如果引入 spring library，仅用于 DOM 时间轴和面板，不用于 Three.js 核心相机逻辑。

## 九、相机系统

`AtlasCameraRig` 需要扩展：

- 保存全球姿态
- 保存地区姿态
- 根据投影上下文聚焦坐标
- 区分 full motion 和 reduced motion
- 动画期间锁定冲突操作
- 详情关闭后恢复姿态
- OrbitControls target 与相机 rig 同步

必须解决当前 CameraRig 与 OrbitControls 同时控制 camera 的潜在冲突。建议使用单一控制源或通过 controls ref 设置 target。

## 十、性能降级

分级降级顺序：

1. 降低 DPR
2. 降低纹理分辨率
3. 减少边界细节
4. 减少标签数量
5. 关闭 normal/displacement
6. 关闭持续材质动画
7. 关闭 marker pulse
8. 持续失败后提示切换二维

不得一次掉帧就立即永久切换二维。

## 十一、迁移步骤

1. 添加新选择器与地点分组测试
2. 建立投影上下文并替换地区临时归一化
3. 建立羊皮纸材质
4. 重构 GlobeScene
5. 重构 RegionAtlasScene
6. 添加 coordinate marker layer
7. 添加 label layer
8. 停止渲染 ArchiveCard3D
9. 重构时间轴状态和视觉
10. 修复相机与 controls
11. 整合同地点列表和详情
12. 清理死代码

## 十二、依赖纪律

- 新依赖必须说明用途、体积和替代方案
- 不因 MotionSites 示例默认使用 Tailwind 而引入 Tailwind
- 不热链 Google Fonts 或外部动画资源
- 不引入第二套 Three.js abstraction
- 不使用未经许可的 premium prompt 内容
- 不使用 `any`、`as any`、`@ts-ignore`

## 十三、构建与 bundle

本轮需要检查：

- Atlas3DScene chunk
- Three.js tree shaking
- 纹理体积
- GeoJSON 体积
- 标签层是否造成主 bundle 增长
- 动态 import 是否仍有效

目标不是强行追求某个数字，而是避免本轮视觉资源让首屏体积失控。