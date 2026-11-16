import type { LocalizedString } from "../types";

export interface PendingReviewEntry {
  id: string;
  name: LocalizedString;
  location: LocalizedString;
  claimedYear: number;
  summary: LocalizedString;
  source: LocalizedString;
  contributor: LocalizedString;
  holdReason: {
    en: string;
    zh: string;
  };
}

/**
 * Pending review queue for legacy prototype drafts.
 * All 17 prototype entries from `eventsData.json` have been individually audited:
 * - 4 verifiable subjects were vetted and promoted to `ARCHIVE_RECORDS` (`src/data/records.ts`).
 * - The remaining 13 unverified, fabricated, off-topic, or duplicate drafts were removed.
 */
export const PENDING_REVIEW_QUEUE: PendingReviewEntry[] = [];
