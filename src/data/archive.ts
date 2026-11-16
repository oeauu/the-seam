import type { ArchiveRecord } from "../types";
import { ARCHIVE_RECORDS } from "./records";
import legacyMock from "./legacy/mockData.json";

function slugify(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

export const ALL_RECORDS: ArchiveRecord[] = ARCHIVE_RECORDS.map(record => {
  const legacy = legacyMock.MOCK_ENTRIES.find(entry => entry.id === record.id);
  return {
    ...record,
    legacySlugs: [slugify(record.id)],
    // The old coordinate is an approximate browsing anchor, not evidence of
    // a birthplace or the geographical origin of a multi-region tradition.
    place: legacy && ["cultural-region", "transregional"].includes(record.place.precision)
      ? { ...record.place, relation: "representative" as const, notes: {
        zh: "沿用原稿的近似地域浏览坐标，不代表出生地或传统的唯一发源地。",
        en: "Approximate browsing anchor retained from the original draft; not a birthplace or a unique cultural origin.",
      } } : record.place,
  };
});

export function findRecord(slug: string): ArchiveRecord | undefined {
  return ALL_RECORDS.find(record => record.slug === slug || record.id === slug || record.legacySlugs?.includes(slug));
}
