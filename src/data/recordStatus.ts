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
const NON_LATIN_SCRIPT_RE = /[^\p{Script=Latin}\s\d\p{P}\p{S}]/u;

export interface RecordDisplayNames {
  /** Primary title (shown on top in both map labels and detail view): original/local name when distinct, else UI language title */
  primaryTitle: string;
  /** Secondary UI-language translation shown below primaryTitle, or null when single-line rule applies */
  secondaryTitle: string | null;
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

function normalizeLatinTokens(value: string): string[] {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/['’]s\b/g, "")
    .split(/[^a-z0-9]+/)
    .filter(token => token.length >= 3 && !["the", "and", "from", "with", "for", "of", "in", "into", "on"].includes(token));
}

function isPureLatinScript(value: string): boolean {
  return !NON_LATIN_SCRIPT_RE.test(value);
}

function hasRedundantLatinNameInEnglish(localizedEn: string, original: string): boolean {
  if (!isPureLatinScript(original)) return false;
  const origLower = original.toLowerCase();
  const locLower = localizedEn.toLowerCase();
  if (locLower.includes(origLower)) return true;
  const origTokens = normalizeLatinTokens(original);
  const locTokens = normalizeLatinTokens(localizedEn);
  if (origTokens.length === 0 || locTokens.length === 0) return false;
  // Check whether original's core Latin words are already substantially represented in the English title
  // (e.g. "Thomasine Hall / Thomas Hall" vs "Thomas(ine) Hall", "John / Eleanor Rykener" vs "Eleanor Rykener").
  const locSet = new Set(locTokens);
  const overlapCount = origTokens.filter(t => locSet.has(t) || locTokens.some(lt => lt.includes(t) || t.includes(lt))).length;
  return overlapCount >= Math.min(2, origTokens.length) && overlapCount / Math.min(origTokens.length, locTokens.length) >= 0.5;
}

export function areRecordNamesEquivalent(a: string, b: string): boolean {
  const ca = canonicalizeNameForCompare(a);
  const cb = canonicalizeNameForCompare(b);
  return ca.length > 0 && ca === cb;
}

/**
 * Resolves unified display naming across both map labels and detail views:
 * - Both lines follow "original / local name on top, UI translation below".
 * - Records located in China (countryCode === "156") always display single-line UI titles.
 * - Outside China, falls back to single-line UI title when originalName is missing, identical,
 *   already embedded verbatim, or a Latin-script name needing no separate English translation.
 */
export function getRecordDisplayNames(
  record: Pick<ArchiveRecord, "title" | "originalName"> & {
    place?: Pick<ArchiveRecord["place"], "countryCode">;
  },
  language: Language,
): RecordDisplayNames {
  const localized = (record.title[language] || record.title.en || record.title.zh || "").trim();

  if (record.place?.countryCode === "156") {
    return { primaryTitle: localized, secondaryTitle: null };
  }

  const original = (record.originalName || "").trim();
  if (!original) {
    return { primaryTitle: localized, secondaryTitle: null };
  }

  if (areRecordNamesEquivalent(localized, original)) {
    return { primaryTitle: localized, secondaryTitle: null };
  }

  if (localized.toLowerCase().includes(original.toLowerCase())) {
    return { primaryTitle: localized, secondaryTitle: null };
  }

  if (language === "en" && hasRedundantLatinNameInEnglish(localized, original)) {
    return { primaryTitle: localized, secondaryTitle: null };
  }

  return {
    primaryTitle: original,
    secondaryTitle: localized,
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
  if (orig && record.place?.countryCode !== "156") {
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
