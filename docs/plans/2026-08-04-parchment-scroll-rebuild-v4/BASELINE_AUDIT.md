# V4 Phase 0 基线审计

日期：2026-08-04

## 同步与分支

- 远端 `main`：`5ccd87f2904b25c4fb960421bfaac5a2f4d78932`
- 功能分支：`feat/parchment-scroll-rebuild-v4`
- 当前环境的 Git smart-HTTP 拉取无法连接 GitHub 443 端口；已通过已认证 GitHub API 确认远端 SHA，并在远端以该 SHA 创建功能分支。源文件基线与远端 `main` 的可比文件一致；缺失的计划元数据通过 API 阅读，最终远端提交使用该分支 ref 作为父提交。

## 基线命令

| 检查 | 结果 |
| --- | --- |
| `npm run build` | 通过；Vite 仍警告三维 chunk 超过 500 kB |
| `npm run lint` | 通过；仅有旧 `eventsData.js`、`App.tsx`、`InteractiveMap.tsx` 警告 |
| `npm run test` | 通过；8 个文件、27 个测试 |
| `npm run test:e2e` | 通过；5 个旧 E2E |

## 已记录的旧体验问题

- 正式入口由旧 `App.tsx`、旧 `index.css`/`App.css` 和左右控制台布局驱动。
- 旧应用维护 `activeTimelineYear`、旧筛选、旧抽屉和 Atlas 状态，存在多套数据/UI 状态边界。
- 正式 Atlas 路径仍包含球形 `GlobeScene`、地区平面/双场景逻辑和 Auto/3D/2D 渲染模式概念。
- 旧全局 CSS 使用 `body { height: 100vh; overflow: hidden; }` 与 `.app-main { overflow: hidden; }`，页面文档滚动被锁死。
- 旧 Atlas 的截图可以证明视觉输出，但不能证明拖动、缩放、普通滚轮和抽屉视角保持；V4 将用真实相机数值、`scrollY` 和录制轨迹验收。

## 基线证据

- [baseline-old-home.png](./artifacts/baseline-old-home.png)：旧首页全页截图。
- [baseline-old-interaction.webm](./artifacts/baseline-old-interaction.webm)：旧入口上的短交互录制，包含拖动尝试与页面滚轮。

此文件只记录 V4 开始前的历史基线，不把旧架构的通过项当作 V4 完成项。
