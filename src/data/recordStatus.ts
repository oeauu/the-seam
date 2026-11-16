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

/**
 * Formats non-redundant original-script names and language-matched aliases
 * for metadata display without repeating the main title or mixing scripts.
 */
export function getRecordOtherNames(record: ArchiveRecord, language: Language): string | null {
  const title = (record.title[language] || record.title.en || "").trim();
  const titleLower = title.toLowerCase();
  const parts: string[] = [];
  const seenLower = new Set<string>();

  const orig = record.originalName?.trim();
  if (orig) {
    const origSegments = orig.split(/\s*\/\s*/).map(s => s.trim()).filter(Boolean);
    const nonRedundantOrig = origSegments.filter(seg => !titleLower.includes(seg.toLowerCase()));
    if (nonRedundantOrig.length > 0) {
      const joined = nonRedundantOrig.join(" / ");
      parts.push(joined);
      for (const seg of nonRedundantOrig) seenLower.add(seg.toLowerCase());
      seenLower.add(joined.toLowerCase());
    }
  }

  const filteredAliases = record.aliases
    .map(a => a.trim())
    .filter(a => {
      if (!a) return false;
      const lower = a.toLowerCase();
      if (titleLower.includes(lower) || seenLower.has(lower)) return false;
      seenLower.add(lower);
      return language === "zh" ? CJK_RE.test(a) : !CJK_RE.test(a);
    })
    .slice(0, 3);

  parts.push(...filteredAliases);
  if (parts.length === 0) return null;
  return language === "zh" ? parts.join("、") : parts.join(", ");
}
