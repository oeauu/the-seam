import type { ArchiveRecord } from "../types";
import { ARCHIVE_RECORDS } from "./records";
import { PENDING_REVIEW_QUEUE } from "./reviewQueue";
import legacyEvents from "./legacy/eventsData.json";
import legacyMock from "./legacy/mockData.json";

function slugify(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

// Preserve the original event text and old permalinks. Unverified dates and
// coordinates do not participate in map placement or the reliable timeline.
const retainedEvents: ArchiveRecord[] = legacyEvents.EVENTS_DATA.flatMap(group =>
  group.events.map((event, index) => {
    const normalizedYear = group.year === 0 ? 1 : group.year;
    const id = `event-${slugify(group.location.en)}-${normalizedYear}-${slugify(event.name.en)}-${index}`;
    const held = PENDING_REVIEW_QUEUE.find(entry => entry.name.en === event.name.en);
    return {
      id,
      slug: slugify(id),
      title: event.name,
      aliases: [],
      summary: event.summary,
      body: event.summary,
      time: { startYear: null, endYear: null, label: {
        zh: `原稿标注：${group.yearDisplay.zh}（年代待核）`,
        en: `Original claim: ${group.yearDisplay.en} (date unverified)`,
      } },
      place: { name: group.location, coordinates: null, precision: "pending", relation: "event-site" },
      reviewNote: held?.holdReason || {
        zh: "保留自旧版演示事件稿。尚未逐条核对史料与年代，不作为已核实记录显示在地图上。",
        en: "Retained from the former demo. Sources and dates have not been individually verified; no map coordinate is assigned.",
      },
      sources: [{ title: event.source.zh, citation: event.source.en, note: event.contributor }],
    };
  }),
);

export const ALL_RECORDS: ArchiveRecord[] = [
  ...ARCHIVE_RECORDS.map(record => {
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
  }),
  ...retainedEvents,
];

export function findRecord(slug: string): ArchiveRecord | undefined {
  return ALL_RECORDS.find(record => record.slug === slug || record.id === slug || record.legacySlugs?.includes(slug));
}
