# 08 MotionSites 参考使用指南

## 一、定位

MotionSites 在本项目中只作为动效结构、section 组织和提示词参考库使用。

它不是：

- 地图引擎
- Three.js 替代品
- 数据层
- 运行时必须依赖
- 整站视觉模板

三维地球、地区地图、相机、羊皮纸材质、坐标点和标签投影继续由 React Three Fiber 与 Three.js 实现。

## 二、优先参考的内容

如果用户提供了合法可用的 MotionSites prompt 或公开 section，优先提取：

- slider 与 carousel 的拖动惯性
- pointer release 回弹
- sticky panel 的进入退出
- drawer 和 modal 的层级切换
- editorial typography 的逐层显现
- hover focus 与 active state
- responsive mobile drawer
- loading transition
- reduced motion 处理

## 三、适合应用的位置

### 1. 羊皮卷时间轴

参考 slider、carousel 和 scroll marquee 的：

- 手势响应
- 位移阻尼
- 刻度滑动
- 释放回弹
- 边缘渐隐

不得复制营销文案、玻璃拟态和高饱和视觉。

### 2. 详情面板

参考 sticky panel、drawer、editorial section 的：

- 右侧进入
- 内容分层显现
- 关闭退出
- 移动端底部抽屉

### 3. 筛选栏

参考 tabs、accordion 和 responsive menu 的：

- 展开收起
- 当前状态
- 移动端布局
- 键盘焦点

### 4. 标签与聚类

只参考 hover focus 和状态过渡节奏。标签布局、地球背面剔除和碰撞检测必须由本项目自行实现。

## 四、提取流程

Codex 获得具体 prompt 后必须：

1. 阅读 prompt
2. 列出可复用 motion pattern
3. 删除与本项目无关的营销页面结构
4. 删除外部字体、图片、视频和品牌资源依赖
5. 将颜色、字体、圆角和材质改写为博物馆羊皮纸语言
6. 判断能否用现有 CSS 和 React 实现
7. 只有复杂 DOM 动画确有收益时才评估 Framer Motion
8. 记录实际使用的参数与改写结果

## 五、不得执行

- 不把整段 premium prompt 提交到公共仓库
- 不复制未知许可代码
- 不直接引入背景视频
- 不把网站变成全屏营销落地页
- 不用滚动劫持替代地图操作
- 不让 MotionSites 动画接管 Three.js 相机
- 不因示例使用 Tailwind 而引入 Tailwind
- 不因示例使用 Framer Motion 而默认引入该依赖
- 不采用玻璃拟态、赛博霓虹和液态按钮作为核心视觉

## 六、动效参数记录模板

在执行报告中使用：

```text
Reference name:
Reference access type: public / user-provided licensed prompt
Applied component:
Extracted pattern:
Original dependency assumptions:
Final implementation:
Visual changes made for The Queer Archive:
License or rights note:
```

## 七、验收问题

每次应用参考后回答：

1. 这项动画是否提升时间、空间或档案关系的理解
2. 它是否仍像博物馆界面
3. 它是否干扰地图旋转、缩放或时间拖动
4. 低动态模式是否可用
5. 移动端是否可操作
6. 是否引入不必要依赖
7. 是否存在许可问题

任何一项无法通过时，撤回该参考实现。