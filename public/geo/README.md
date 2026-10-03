# 地理数据来源

采集日期：2026-10-04。仅作为现代地理浏览底图，不表示历史国籍或随年代变化的疆界。采用数据发布者的边界口径；项目不自行裁定争议归属。

## 世界轮廓

`public/countries-50m.json` 与 `public/countries-110m.json` 取自固定版本 `world-atlas@2.0.2`：

- https://cdn.jsdelivr.net/npm/world-atlas@2.0.2/countries-50m.json
- https://cdn.jsdelivr.net/npm/world-atlas@2.0.2/countries-110m.json
- 项目说明：https://github.com/topojson/world-atlas

上游为 Natural Earth 4.1.0 的国家轮廓，由 world-atlas 转为 TopoJSON。默认 50m；请求失败时使用本地 110m。无标准数字编号的地理单元使用名称派生浏览 ID，不分配虚构 ISO 编号。

## 城市与行政区划线

取自 Natural Earth Vector 的固定标签 `v5.1.2`：

- 城市：https://raw.githubusercontent.com/nvkelso/natural-earth-vector/v5.1.2/geojson/ne_110m_populated_places_simple.geojson
- 行政区划：https://raw.githubusercontent.com/nvkelso/natural-earth-vector/v5.1.2/geojson/ne_10m_admin_1_states_provinces_lines.geojson

`cities.json` 保留 243 处地名、坐标、首都标志、所属现代地理单元与显示级别。未提供中文名称的条目保留来源名称，不编造译名。已有人工维护的中文标注继续复用。

行政区划线按 `ADM0_NAME` 分为 196 个国家或地区文件，由 `admin-index.json` 查找并按需加载。跳过空几何；相邻点不足 0.04 度时简化，保留线段端点，坐标保留四位小数，仅适用于浏览而非测绘。城市和区划线随缩放逐步出现。没有来源数据时省略该图层，国家轮廓及档案交互仍可使用。

轮廓与标注是不同版本和尺度的地理数据，海岸附近会有简化偏差。档案及城市是否显示在国家地图中，以当前国家轮廓的空间包含判断为准。

Natural Earth 数据为公有领域：https://www.naturalearthdata.com/about/terms-of-use/ 。world-atlas 转换代码使用 ISC 许可。

`public/china.json` 是保留的旧资源，来源版本未记录；本次地图使用上述有来源记录的区划线，并未删除旧资源。

未进行哈希校验。
