# The Queer Archive 三维羊皮纸坐标地图 V2 计划

本目录是下一轮 Codex 执行的唯一计划入口。

本轮建立在 `feat/museum-atlas-3d` 已完成的三维技术原型上，不回退到 `main`，也不重写已经稳定的数据模型、时间范围筛选、来源与文化意义筛选、详情抽屉和 WebGL 基础。

三维始终是正式体验。羊皮纸不是二维替代方案，而是三维地球、三维区域地图和空间光照共同构成的主要材质语言。二维仅作为 WebGL 不可用或用户主动选择时的紧急兼容路径，不承担本轮主要视觉目标。

本轮的核心变化是重新确定地图的视觉与展陈逻辑：

1. 全球与地区场景改为具有陈旧羊皮纸质感的三维地图
2. 全球视图保留可旋转三维地球，并呈现为数字化历史地图仪
3. 地区视图使用真实地理轮廓和轻微立体起伏，不再使用矩形展台
4. 删除地图上方悬浮的档案卡片
5. 每个条目以金色坐标点贴附在真实地点
6. 坐标附近显示条目名称
7. 远景聚类，中景显示代表名称，近景显示可读标签
8. 点击坐标后调阅右侧博物馆式档案面板
9. 时间轴成为羊皮卷下端的一部分，并在拖动时产生克制的滑动与张力反馈
10. 时间和筛选控制坐标的显示、隐藏与聚合
11. 三维场景通过材质、光照、相机和轻微地形变化获得流动感与质感
12. MotionSites 仅作为 DOM 动效模式和 section 组织参考
13. 减少动态效果环境继续保留三维，只降低惯性、过渡和非必要动画
14. 二维仅用于真正的 WebGL 失败或用户显式切换

## 执行文件

Codex 必须按以下顺序阅读全部文件，并以 `00_MASTER_EXECUTION_PLAN.md` 为总控：

1. `00_MASTER_EXECUTION_PLAN.md`
2. `01_CURRENT_IMPLEMENTATION_AUDIT.md`
3. `02_VISUAL_SYSTEM_PARCHMENT_MAP.md`
4. `03_INTERACTION_AND_LABEL_SPEC.md`
5. `04_TECHNICAL_ARCHITECTURE_AND_MIGRATION.md`
6. `05_IMPLEMENTATION_PHASES.md`
7. `06_TESTING_ACCEPTANCE_AND_HANDOFF.md`
8. `07_ASSET_CONTENT_AND_RIGHTS_RULES.md`
9. `08_MOTIONSITES_REFERENCE_GUIDE.md`

出现理解冲突时，优先级为：

1. `00_MASTER_EXECUTION_PLAN.md`
2. `06_TESTING_ACCEPTANCE_AND_HANDOFF.md`
3. `02_VISUAL_SYSTEM_PARCHMENT_MAP.md`
4. `04_TECHNICAL_ARCHITECTURE_AND_MIGRATION.md`
5. 其他文件

## 本轮交付目标

完成一个可运行、可构建、可测试的三维羊皮纸坐标地图，使用户能够：

- 在具有纸张纤维、氧化色差和三维光照的地球上旋转和缩放
- 看到贴附在真实地点上的金色坐标和地区聚类
- 进入至少三个具有真实轮廓与轻微立体层次的地区地图
- 在地区地图上看到条目坐标与名称标签
- 在羊皮卷下端拖动时间范围，并感受到刻度滑动和轻微回弹
- 通过时间、来源和文化意义筛选坐标
- 点击坐标后调阅一个或多个相关档案
- 关闭详情后返回原来的三维地图视角
- 在减少动态效果环境中继续使用低动态三维模式
- 在 WebGL 不可用时进入功能完整但视觉简化的二维兼容模式

## 明确不做

本轮不接入 Supabase，不实现真实账号鉴权，不扩充正式史料，不自动生成历史条目，不增加社交功能，不实现完整编年长廊，不复制参考视频的金色奢华风和悬浮展品陈列。

## 执行纪律

- 从 `feat/museum-atlas-3d` 最新远端提交创建新分支 `feat/parchment-coordinate-atlas-v2`
- 不直接修改或合并 `main`
- 三维是默认和主要验收对象
- 不因 `prefers-reduced-motion` 自动切换到二维
- 不继续使用 `ArchiveCard3D` 作为地图的主要展示对象
- 不以矩形板代替地区真实轮廓
- 不伪造经纬度
- 不通过 `any`、`as any`、`@ts-ignore` 掩盖类型问题
- 不添加来源不明的纹理、地图图片或文化材料
- 不从外部 CDN 热链字体、纹理或图片
- 所有新增视觉资源必须本地化、程序生成或附带权利说明
- MotionSites premium 内容只有在用户合法获得并提供时才可使用
- 每个实施阶段结束后运行对应检查
- 最终在本目录新增 `EXECUTION_REPORT.md`
- 最终推送功能分支，不自动合并