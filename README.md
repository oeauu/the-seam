# The Seam

The Seam 是一个以空间和时间浏览历史人物、事件与相关史料的数字档案项目，采用 React、TypeScript、Vite、MapLibre GL JS 与 D3。身份与主题标签不再控制导航、排序或坐标。

- GitHub 仓库：`oeauu/the-seam`
- 在线访问：https://oeauu.github.io/the-seam/

## 浏览功能

- 瓷白与古金配色的三维地球仪（MapLibre GL JS 矢量瓦片，支持离线回退本地 GeoJSON）、联合国标准边界（UN Map No. 4170）标注及边缘防溢出国名控制。
- 未点击国家时仅展示国名与统一规格金色档案坐标点；缩放到极小比例尺时隐藏档案铭牌、仅保留坐标点；首次点击国家聚焦锁定并展示子级地理参考，再次点击进入二维专题地图。
- 随缩放改变坐标聚合；同坐标的多条档案通过选择列表访问。
- 右侧非模态档案面板与地图、时间轴同时可用；手机使用底部面板。
- 时间轴默认跨度为公元前 2500 年至今，按 100 年间隔刻度筛选，支持拖动、键盘单年调整与收起/展开查看全部时期。
- 档案检索与「地点待考」入口；三维不适用时可使用二维国家选择和档案索引。
- `/record/:slug` 与 `/country/:id` 可直接访问，浏览器前进后退同步页面（GitHub Pages 部署含 `404.html` SPA 重定向还原），旧 `entry-*` 档案链接仍可使用。

## 开发

```sh
npm install
npm run dev
npm run build
npm run lint
npm run test
npm run test:e2e
```

如需运行端到端测试但尚未安装 Chromium，可运行 `npx playwright install chromium`。

## 投稿与自动邮件转发配置

- 复制 `.env.example` 为 `.env`，配置 `VITE_SUBMISSION_EMAIL`（官方收件箱）与 `VITE_GITHUB_REPO=oeauu/the-seam`。未配置邮箱时界面显示「投稿邮箱尚未公布」，不使用默认或虚构邮箱。
- 投稿界面支持本地草稿预览、一键生成预填 GitHub Issue（标签 `archive-submission`）以及可选 HookForms / 邮件客户端投递。
- 仓库工作流 `.github/workflows/forward-submission-issue.yml` 会在收到 `archive-submission` Issue 时自动将其正文转发至 `VITE_SUBMISSION_EMAIL`（需在 GitHub Repository Secrets 中配置 `SMTP_USERNAME`、`SMTP_PASSWORD`，可选 `SMTP_SERVER` 与 `SMTP_PORT`）。

## GitHub Pages 部署

- 仓库内置 `.github/workflows/deploy-pages.yml`，推送至 `main` 分支后自动以 `/the-seam/` 前缀构建并发布到 GitHub Pages。

## 内容状态与迁移

`src/data/records.ts` 保留重构版的 13 条档案。`src/data/legacy/` 完整保留 11 条原始档案稿与 17 条演示事件原稿。旧事件未经逐条核查，在 `src/data/archive.ts` 中保留为待考记录：原稿年代照录，可靠年代与坐标为空，可通过索引、地点待考或旧分享链接查阅，不能当成已验证事实投放到地图上。

地理文件、版本、来源及覆盖限制见 [地理数据说明](public/geo/README.md)。现代地图位置不代表历史国籍，边界不随时间改变。

## 结构

- `src/state/`：页面状态与 URL 同步。
- `src/globe/`、`src/country/`、`src/geo/`：三维、二维地图、联合国领土标准与地理处理。
- `src/timeline/`：时间范围与年代显示。
- `src/record/`：档案面板与聚合选择。
- `src/shell/`：索引、介绍、投稿、GitHub Issue 链接构建与弹窗焦点管理。
- `src/data/`：档案、原稿保全和地理标注。
