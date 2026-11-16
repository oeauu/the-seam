import type { ArchiveRecord, Language } from "../types";

export function isLocationPending(record: ArchiveRecord): boolean {
  return !record.place.coordinates || record.place.precision === "pending";
}

export function isEventPending(record: ArchiveRecord): boolean {
  return record.time.startYear === null || Boolean(record.reviewNote);
}

export function getPendingVerificationLabel(
  record: ArchiveRecord,
  language: Language,
): string | null {
  const locationPending = isLocationPending(record);
  const eventPending = isEventPending(record);

  if (locationPending && eventPending) {
    return language === "zh" ? "地点与事件待考证" : "Location & Event Pending";
  }
  if (locationPending) {
    return language === "zh" ? "地点待考证" : "Location Pending";
  }
  if (eventPending) {
    return language === "zh" ? "事件待考证" : "Event Pending";
  }
  return null;
}

const CJK_RE = /[\u4e00-\u9fff]/;

export interface RecordDisplayNames {
  /** Detail-view main heading: historical/local original name when distinct, otherwise localized title */
  primaryTitle: string;
  /** Detail-view secondary title in UI language, null when missing or equivalent */
  secondaryTitle: string | null;
  /** Map label primary line in active UI language */
  mapTitle: string;
  /** Map label secondary line in historical/local script, null when missing or equivalent */
  mapOriginalName: string | null;
}

function canonicalizeNameForCompare(value: string): string {
  return value
    .trim()
    .replace(/\s*[（(]\d{3,4}(?:[–-]\d{3,4})?年?[)）]\s*$/g, "")
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/与/g, " and ")
    .replace(/[《》「」『』"'“”‘’·・,.;:!?()（）[\]{}\-–—/\s]+/g, "");
}

export function areRecordNamesEquivalent(a: string, b: string): boolean {
  const ca = canonicalizeNameForCompare(a);
  const cb = canonicalizeNameForCompare(b);
  return ca.length > 0 && ca === cb;
}

/**
 * Resolves map-label and detail-panel naming hierarchy per localization rules:
 * - Map labels place UI language (zh/en) on top and historical original name below.
 * - Detail pages elevate historical original name as main title with UI translation below.
 * - Omitted or equivalent original names collapse to a single line with zero duplication.
 */
export function getRecordDisplayNames(
  record: Pick<ArchiveRecord, "title" | "originalName">,
  language: Language,
): RecordDisplayNames {
  const localized = (record.title[language] || record.title.en || record.title.zh || "").trim();
  const original = (record.originalName || "").trim();
  const hasDistinctOriginal = Boolean(original) && !areRecordNamesEquivalent(localized, original);

  if (!hasDistinctOriginal) {
    return {
      primaryTitle: localized,
      secondaryTitle: null,
      mapTitle: localized,
      mapOriginalName: null,
    };
  }

  return {
    primaryTitle: original,
    secondaryTitle: localized,
    mapTitle: localized,
    mapOriginalName: original,
  };
}

/**
 * Formats non-redundant variant names and language-matched aliases
 * without repeating the displayed primary or secondary header titles.
 */
export function getRecordOtherNames(record: ArchiveRecord, language: Language): string | null {
  const { primaryTitle, secondaryTitle } = getRecordDisplayNames(record, language);
  const primaryLower = primaryTitle.toLowerCase();
  const secondaryLower = (secondaryTitle || "").toLowerCase();
  const parts: string[] = [];
  const seenLower = new Set<string>([primaryLower]);
  if (secondaryLower) seenLower.add(secondaryLower);

  const orig = record.originalName?.trim();
  if (orig) {
    const origSegments = orig.split(/\s*\/\s*/).map(s => s.trim()).filter(Boolean);
    for (const seg of origSegments) seenLower.add(seg.toLowerCase());
  }

  const filteredAliases = record.aliases
    .map(a => a.trim())
    .filter(a => {
      if (!a) return false;
      const lower = a.toLowerCase();
      if (primaryLower.includes(lower) || secondaryLower.includes(lower) || seenLower.has(lower)) return false;
      seenLower.add(lower);
      return language === "zh" ? CJK_RE.test(a) : !CJK_RE.test(a);
    })
    .slice(0, 3);

  parts.push(...filteredAliases);
  if (parts.length === 0) return null;
  return language === "zh" ? parts.join("、") : parts.join(", ");
}
