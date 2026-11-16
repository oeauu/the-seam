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
