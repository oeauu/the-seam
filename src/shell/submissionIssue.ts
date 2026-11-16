import type { ArchiveRecord, Language } from "../types";

const DEFAULT_GITHUB_REPO = "oeauu/Thequeerarchive";

export function resolveGitHubRepo(rawRepo?: string): string {
  const raw = (rawRepo ?? import.meta.env.VITE_GITHUB_REPO ?? DEFAULT_GITHUB_REPO).trim();
  return /^[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+$/.test(raw) ? raw : DEFAULT_GITHUB_REPO;
}

export function buildGitHubIssueUrl(
  record: ArchiveRecord,
  language: Language,
  pendingStatus: string | null,
  repoSlug: string = resolveGitHubRepo(),
): string {
  const coords = record.place.coordinates
    ? `${record.place.coordinates.longitude}, ${record.place.coordinates.latitude}`
    : (language === "zh" ? "待考证" : "Pending verification");
  const yearText = record.time.startYear === null
    ? (language === "zh" ? "待考证" : "Pending verification")
    : String(record.time.startYear);
  const source = record.sources[0];

  const markdownHeader = [
    "### 档案投稿信息 / Archive Submission",
    "",
    `- **人物/事件名称 / Title**: ${record.title.zh}`,
    `- **别名 / Aliases**: ${record.aliases.length ? record.aliases.join("、") : "无 / None"}`,
    `- **历史时期 / Era**: ${record.time.label.zh}`,
    `- **年份 / Year**: ${yearText}`,
    `- **地点 / Location**: ${record.place.name.zh}`,
    `- **经纬度 / Coordinates**: ${coords}`,
    `- **考证状态 / Verification**: ${pendingStatus || "已有初步年代与坐标，待原始文献复核"}`,
    `- **第一手史料 / Primary Source**: ${source?.title || ""}`,
    `- **参考链接 / Source URL**: ${source?.url || "无 / None"}`,
    "",
    "#### 历史简介与文献事实 / Summary & Documented Facts",
    record.summary.zh,
  ].join("\n");

  const compactDraft = {
    id: record.id,
    slug: record.slug,
    title: record.title,
    aliases: record.aliases,
    time: record.time,
    place: record.place,
    summary: record.summary,
    sources: record.sources,
  };

  const jsonBlock = [
    "",
    "<details>",
    "<summary>JSON Archive Draft</summary>",
    "",
    "```json",
    JSON.stringify(compactDraft),
    "```",
    "",
    "</details>",
  ].join("\n");

  const makeUrl = (bodyText: string) => {
    const params = new URLSearchParams({
      labels: "archive-submission",
      title: `[Submission] ${record.title.zh}`,
      body: bodyText,
    });
    return `https://github.com/${repoSlug}/issues/new?${params.toString()}`;
  };

  const fullUrl = makeUrl(`${markdownHeader}\n${jsonBlock}`);
  if (fullUrl.length <= 7200) return fullUrl;
  return makeUrl(markdownHeader).slice(0, 7500);
}
