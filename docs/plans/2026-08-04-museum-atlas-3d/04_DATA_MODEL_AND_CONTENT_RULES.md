# 04 数据模型与内容规则

## 1. 单一档案模型

本轮必须将地图事件数据和详情条目数据合并为单一数据源。

建议核心类型：

```ts
export interface LocalizedText {
  zh: string;
  en: string;
  original?: string;
}

export type ContentStatus = "demo" | "reviewed" | "published";
export type EvidenceGrade = "A" | "B" | "C" | "D";
export type TemporalPrecision =
  | "exact"
  | "year"
  | "decade"
  | "century"
  | "period"
  | "legendary"
  | "unknown";

export interface TemporalExtent {
  startYear: number | null;
  endYear: number | null;
  precision: TemporalPrecision;
  label: LocalizedText;
  notes?: LocalizedText;
}

export type LocationPrecision =
  | "exact"
  | "city"
  | "region"
  | "country"
  | "cultural-region"
  | "transregional"
  | "unknown";

export interface ArchiveLocation {
  id: string;
  name: LocalizedText;
  latitude: number | null;
  longitude: number | null;
  precision: LocationPrecision;
  regionId: string | null;
  isPrimary: boolean;
  notes?: LocalizedText;
}

export type MediaKind =
  | "image"
  | "document"
  | "text"
  | "oral-history"
  | "legal-record"
  | "placeholder";

export interface MediaAsset {
  id: string;
  kind: MediaKind;
  src: string | null;
  thumbnailSrc: string | null;
  alt: LocalizedText;
  caption?: LocalizedText;
  creator?: string;
  date?: string;
  rightsStatus:
    | "public-domain"
    | "licensed"
    | "fair-use-review-required"
    | "unknown";
  rightsNote?: LocalizedText;
  sourceUrl?: string;
}

export interface SourceReference {
  id: string;
  title: string;
  author?: string;
  year?: string;
  sourceTypeId: string;
  citation?: string;
  url?: string;
  language?: string;
  note?: LocalizedText;
}

export interface ArchiveEntry {
  id: string;
  slug: string;
  title: LocalizedText;
  originalName?: string;
  aliases: string[];
  summary: LocalizedText;
  description: LocalizedText;
  temporal: TemporalExtent;
  locations: ArchiveLocation[];
  sourceTypeIds: string[];
  objectTypeIds: string[];
  culturalMeaningIds: string[];
  evidenceGrades: EvidenceGrade[];
  interpretationRisks: LocalizedText[];
  references: SourceReference[];
  media: MediaAsset[];
  contentStatus: ContentStatus;
  contributorName: string;
  reviewStatus: "draft" | "pending" | "needs-revision" | "approved";
  createdAt?: string;
  updatedAt?: string;
}
```

可以根据现有项目适度简化，但不得回到松散对象和 `any`。

## 2. 数据迁移

### 2.1 迁移顺序

1. 建立新类型
2. 将 `MOCK_ENTRIES` 转换为 `ArchiveEntry[]`
3. 把 `EVENTS_DATA` 中独有信息合并进对应条目
4. 为地图、时间轴和列表建立选择器
5. 替换 `getCombinedEvents()`
6. 删除重复旧数据前，确认所有视图已切换

### 2.2 演示数据标记

当前条目没有完成本轮史料核验。

全部迁移条目默认：

```ts
contentStatus: "demo"
```

界面在适当位置显示：

- 中文：演示数据，尚待史料核验
- 英文：Demo content pending source review

不得在普通用户界面用过度醒目的警告破坏浏览，但必须清楚可见。

## 3. 时间规则

### 3.1 不使用公元 0 年

历史年份显示规则：

- `-1` 表示公元前 1 年
- `1` 表示公元 1 年
- `0` 不得作为有效历史年份保存

如果需要连续滑轴，使用内部轴坐标转换：

```ts
function historicalYearToAxis(year: number): number {
  if (year === 0) throw new Error("Historical year zero is invalid");
  return year < 0 ? year : year - 1;
}

function axisToHistoricalYear(axis: number): number {
  return axis < 0 ? axis : axis + 1;
}
```

具体实现可调整，但必须有测试。

### 3.2 范围相交

条目时间与筛选时间范围相交时显示。

```ts
entryStart <= filterEnd && entryEnd >= filterStart
```

时间不详条目只在用户启用“包括时间不详”时显示。

### 3.3 长期流传

人物生卒、事件发生、形象流传和现代再阐释可能属于不同时间层。

第一版允许一个主时间范围和备注。

未来可扩展多个 temporal assertions，本轮不必过度设计。

## 4. 地点规则

### 4.1 主地点

每条记录至少有一个地点或明确标记地点不详。

多个地点中只有一个 `isPrimary: true`。

### 4.2 不确定地点

不得为了地图显示而伪造精确坐标。

城市不确定时使用地区中心，并设置：

```ts
precision: "region"
```

### 4.3 跨区域

跨区域形象可以关联多个地点或一个文化区域。

全球聚类使用主地点，详情中展示全部地点。

## 5. 来源分类

来源分类必须由统一配置文件提供。

建议：

```ts
interface TaxonomyOption {
  id: string;
  label: LocalizedText;
  description?: LocalizedText;
  parentId?: string;
}
```

主来源类别：

- textual
- institutional
- cultural-memory
- modern-research
- modern-reinterpretation

子类别包括：

- historical-document
- local-gazetteer
- mythology
- religious-text
- literature
- theatre
- poetry
- biography
- legal-record
- medical-record
- colonial-record
- court-record
- oral-tradition
- folklore
- community-memory
- museum
- academic-paper
- monograph
- contemporary-art
- film
- online-culture

## 6. 文化意义标签

文化意义不是现代身份标签。

统一配置至少包括：

- transgression
- transformation
- sacredness
- stigma
- guardianship
- concealment
- reclamation
- performance
- power-intimacy
- non-institutional-intimacy
- local-memory
- legal-regulation
- medical-naming
- colonial-naming
- modern-reactivation
- literary-symbolization
- mythologization
- mourning
- exile
- ambiguity

不得在不同组件中使用不同英文拼写表达同一标签。

## 7. 对象类型

对象类型用于档案形态，不用于划分现代身份。

建议：

- historical-person
- historical-allusion
- event
- mythological-figure
- religious-figure
- literary-character
- performance-figure
- folklore-figure
- social-role
- local-term
- visual-artwork
- legal-object
- medical-object
- place
- organization
- modern-reinterpretation

## 8. 媒体与版权

### 8.1 基本原则

- 不从参考视频提取图片
- 不自动抓取网络图片
- 不使用来源不明图片
- 不将低清截图当作正式馆藏图
- 所有图片都需要 alt、来源和权利状态

### 8.2 MVP 允许的素材

- 仓库已有且权利明确的素材
- 公共领域素材
- 自制占位卡
- 无版权争议的地图纹理
- 明确标记的开发占位图

### 8.3 无图条目

无图条目使用档案类型模板，不得降低为缺失状态。

例如：

- 文献摘录卡
- 口述记录卡
- 地方记忆卡
- 法律档案卡
- 纯文字馆藏卡

## 9. 投稿模型

本轮投稿仍保存在前端原型中，但应复用 `ArchiveEntryDraft` 类型。

```ts
type ArchiveEntryDraft = Omit<
  ArchiveEntry,
  "id" | "slug" | "contentStatus" | "reviewStatus"
>;
```

审核通过后不得通过模糊字符串生成地图事件。

应直接生成一个新的 `ArchiveEntry` 对象。

## 10. 数据验证

建议建立轻量运行时验证。

可以手写类型守卫，也可以引入单一 schema 库。不得为了验证同时引入多个库。

至少验证：

- id 唯一
- slug 唯一
- 非空标题
- 时间不含 0
- endYear 不早于 startYear
- 经纬度范围有效
- 至少一个来源或标记待补充
- 图片具有 alt
- 发布数据不能是 `contentStatus: demo`

## 11. 数据与 UI 分离

UI 不得直接依赖原始字段拼接规则。

建立 presenter 或 selector：

```ts
getEntryPrimaryLocation
getEntryDisplayPeriod
getEntryPrimaryMedia
getEntryEvidenceLabel
getEntryMapVisibility
```

这样未来接入 Supabase 时不需要重写场景组件。
