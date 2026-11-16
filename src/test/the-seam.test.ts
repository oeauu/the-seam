import { describe, it, expect } from "vitest";
import { ARCHIVE_RECORDS } from "../data/records";
import { PENDING_REVIEW_QUEUE } from "../data/reviewQueue";
import { COUNTRIES_META } from "../data/countriesMeta";
import {
  calculateTimelineBounds,
  recordOverlapsRange,
  formatYear,
} from "../timeline/timelineUtils";
import { CITY_CLUSTER_RADIUS_KM, clusterRecords } from "../geo/clustering";
import { parseRoute, buildRoutePath } from "../state/routing";
import { getRecordDisplayNames, getRecordOtherNames } from "../data/recordStatus";

describe("The Seam - Data & Taxonomy Constraints", () => {
  it("contains vetted records with no modern taxonomy labels", () => {
    expect(ARCHIVE_RECORDS.length).toBeGreaterThanOrEqual(63);

    ARCHIVE_RECORDS.forEach((record) => {
      // Must have clean ID and slug
      expect(record.id).toBeTruthy();
      expect(record.slug).toBeTruthy();

      // Must have bilingual titles and summaries
      expect(record.title.en).toBeTruthy();
      expect(record.title.zh).toBeTruthy();
      expect(record.summary.en).toBeTruthy();
      expect(record.summary.zh).toBeTruthy();

      // Must have valid time definition
      expect(typeof record.time.startYear).toBe("number");
      expect(typeof record.time.endYear).toBe("number");
      if (record.time.startYear !== null && record.time.endYear !== null) expect(record.time.startYear).toBeLessThanOrEqual(record.time.endYear);

      // Must have coordinates
      expect(record.place.coordinates).toBeDefined();
      expect(typeof record.place.coordinates?.latitude).toBe("number");
      expect(typeof record.place.coordinates?.longitude).toBe("number");

      // Must have sources
      expect(record.sources.length).toBeGreaterThan(0);

      // Strictly verify NO modern taxonomy tag fields
      expect("gender" in record).toBe(false);
      expect("sexualOrientation" in record).toBe(false);
      expect("identityCategory" in record).toBe(false);
      expect("tags" in record).toBe(false);
    });
  });

  it("includes the 1629 Virginia General Court case of Thomas(ine) Hall as a core vetted record", () => {
    const hall = ARCHIVE_RECORDS.find((r) => r.slug === "thomas-hall");
    expect(hall).toBeDefined();
    expect(hall?.time.startYear).toBe(1603);
    expect(hall?.time.endYear).toBe(1629);
    expect(hall?.place.coordinates?.latitude).toBeCloseTo(37.2, 0.5);
    expect(hall?.historiographyNote).toBeDefined();
  });

  it("resolves legacy reviewQueue entries cleanly with vetted records promoted and unverified claims removed", () => {
    expect(PENDING_REVIEW_QUEUE).toHaveLength(0);
    for (const slug of ["hadrian-antinous", "athenian-symposium", "michelangelo-cavalieri", "fujian-qixiong-qidi"]) {
      const entry = ARCHIVE_RECORDS.find((r) => r.slug === slug);
      expect(entry).toBeDefined();
      expect(entry?.sources.length).toBeGreaterThan(0);
    }
  });

  it("includes bilingual country metadata for relevant countries", () => {
    const countryList = Object.values(COUNTRIES_META);
    expect(countryList.length).toBeGreaterThanOrEqual(8);
    const china = COUNTRIES_META["156"];
    expect(china).toBeDefined();
    expect(china.name.zh).toBe("中国");
    expect(china.cities.length).toBeGreaterThan(0);
  });
});

describe("The Seam - Timeline Logic", () => {
  it("formats BCE and CE years correctly in Chinese and English", () => {
    expect(formatYear(-600, "zh")).toBe("公元前600年");
    expect(formatYear(-600, "en")).toBe("600 BCE");
    expect(formatYear(1629, "zh")).toBe("公元1629年");
    expect(formatYear(1629, "en")).toBe("1629 CE");
  });

  it("calculates padded rounded timeline bounds", () => {
    const [start, end] = calculateTimelineBounds(-600, 2026);
    expect(start).toBe(-1000);
    expect(end).toBe(2026);
  });

  it("correctly identifies record overlap within a range", () => {
    // Record spanning 1625 - 1630
    expect(recordOverlapsRange(1625, 1630, 1600, 1700, false)).toBe(true);
    expect(recordOverlapsRange(1625, 1630, 1628, 1629, false)).toBe(true);
    expect(recordOverlapsRange(1625, 1630, 1700, 1800, false)).toBe(false);
  });

  it("Section 8.4 Constraint: collapsing timeline immediately shows all records across all eras", () => {
    // Even if record is outside the active [1800, 1900] range, collapsing timeline MUST return true
    expect(recordOverlapsRange(-600, -570, 1800, 1900, true)).toBe(true);
    expect(recordOverlapsRange(1629, 1629, 1800, 1900, true)).toBe(true);
  });
});

describe("The Seam - Geographic Clustering", () => {
  it("groups same-city records within CITY_CLUSTER_RADIUS_KM without merging nearby cities", () => {
    const clusters = clusterRecords(ARCHIVE_RECORDS, CITY_CLUSTER_RADIUS_KM);
    expect(CITY_CLUSTER_RADIUS_KM).toBe(12);
    expect(clusters.length).toBeGreaterThan(0);
    expect(clusters.length).toBeLessThan(ARCHIVE_RECORDS.length);

    const totalClustered = clusters.reduce((sum, c) => sum + c.records.length, 0);
    expect(totalClustered).toBe(ARCHIVE_RECORDS.length);

    const chinaClusters = clusterRecords(
      ARCHIVE_RECORDS.filter((r) => r.place.countryCode === "156"),
      CITY_CLUSTER_RADIUS_KM
    );
    expect(chinaClusters.length).toBe(10);

    clusters.forEach((cluster) => {
      expect(cluster.records.length).toBeGreaterThanOrEqual(1);
      expect(typeof cluster.coordinates.latitude).toBe("number");
      expect(typeof cluster.coordinates.longitude).toBe("number");
    });
  });
});

describe("The Seam - State & Routing", () => {
  it("formats and parses route URLs accurately", () => {
    expect(buildRoutePath({ kind: "globe" })).toBe("/");
    expect(buildRoutePath({ kind: "record", slug: "thomas-hall" })).toBe(
      "/record/thomas-hall"
    );
    expect(buildRoutePath({ kind: "country", countryId: "156" })).toBe("/country/156");

    expect(parseRoute("/")).toEqual({ kind: "globe" });
    expect(parseRoute("/record/sappho-of-lesbos")).toEqual({
      kind: "record",
      slug: "sappho-of-lesbos",
    });
    expect(parseRoute("/country/156")).toEqual({
      kind: "country",
      countryId: "156",
    });
  });
});

describe("The Seam - Multilingual Name Hierarchy", () => {
  it("puts originalName on top and active UI translation below for distinct non-China entries", () => {
    const sappho = ARCHIVE_RECORDS.find((r) => r.id === "entry_sappho")!;
    const zh = getRecordDisplayNames(sappho, "zh");
    expect(zh.primaryTitle).toBe("Σαπφώ");
    expect(zh.secondaryTitle).toBe("萨福（莱斯博斯的萨福）");

    const en = getRecordDisplayNames(sappho, "en");
    expect(en.primaryTitle).toBe("Σαπφώ");
    expect(en.secondaryTitle).toBe("Sappho of Lesbos");
  });

  it("forces single-line UI titles for all records inside China (countryCode 156)", () => {
    const chinaRecords = ARCHIVE_RECORDS.filter((r) => r.place.countryCode === "156");
    expect(chinaRecords.length).toBeGreaterThan(0);

    chinaRecords.forEach((record) => {
      const zh = getRecordDisplayNames(record, "zh");
      expect(zh.primaryTitle).toBe(record.title.zh);
      expect(zh.secondaryTitle).toBeNull();

      const en = getRecordDisplayNames(record, "en");
      expect(en.primaryTitle).toBe(record.title.en);
      expect(en.secondaryTitle).toBeNull();
    });
  });

  it("omits duplicate, redundant-Latin, or missing original names cleanly", () => {
    const elisa = ARCHIVE_RECORDS.find((r) => r.id === "entry_elisa_and_marcela")!;
    const elisaEn = getRecordDisplayNames(elisa, "en");
    expect(elisaEn.primaryTitle).toBe("Elisa Sánchez Loriga & Marcela Gracia Ibeas");
    expect(elisaEn.secondaryTitle).toBeNull();

    const elisaZh = getRecordDisplayNames(elisa, "zh");
    expect(elisaZh.secondaryTitle).toBeNull();

    const customNoOrig = getRecordDisplayNames({ title: { zh: "待考条目", en: "Pending Entry" } }, "zh");
    expect(customNoOrig.primaryTitle).toBe("待考条目");
    expect(customNoOrig.secondaryTitle).toBeNull();

    const thomasHall = ARCHIVE_RECORDS.find((r) => r.id === "entry_thomas_hall")!;
    const thomasEn = getRecordDisplayNames(thomasHall, "en");
    expect(thomasEn.secondaryTitle).toBeNull();
    const otherNamesEn = getRecordOtherNames(thomasHall, "en");
    expect(otherNamesEn).not.toContain("Thomasine Hall / Thomas Hall");
  });

  it("preserves Unicode RTL Arabic names cleanly without synthetic markers", () => {
    const ibnHazm = ARCHIVE_RECORDS.find((r) => r.id === "entry_ibn_hazm_dove")!;
    const names = getRecordDisplayNames(ibnHazm, "zh");
    expect(names.primaryTitle).toBe("طوق الحمامة في الألفة والألاف");
    expect(names.secondaryTitle).toBe("伊本·哈兹姆《鸽子的项圈》");
  });
});
