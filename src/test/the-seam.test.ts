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
import { getRecordDisplayNames, getRecordNameplateNames, getRecordOtherNames } from "../data/recordStatus";
import {
  MAX_GLOBE_ZOOM,
  MIN_GLOBE_ZOOM,
  buildGlobeClusterPaintSpecs,
  buildLocalPorcelainFallbackStyle,
  computeGlobeClusterSizing,
} from "../geo/maplibreStyle";

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
    expect(chinaClusters.length).toBe(11);

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
  it("uses one localized line in English-primary countries", () => {
    const record = ARCHIVE_RECORDS.find((entry) => entry.slug === "mary-jones-1836")!;
    for (const countryCode of ["036", "124", "372", "554", "826", "840"]) {
      const localizedRecord = { ...record, place: { ...record.place, countryCode } };
      expect(getRecordNameplateNames(localizedRecord, "en")).toEqual({
        primaryTitle: record.title.en,
        secondaryTitle: null,
      });
      expect(getRecordNameplateNames(localizedRecord, "zh")).toEqual({
        primaryTitle: record.title.zh,
        secondaryTitle: record.originalName,
      });
    }
  });

  it("keeps documented names on their own line even when they appear in the map title", () => {
    const originals = {
      "azande-male-marriage": "diare / kumbami",
      "mudoko-dako": "Mudoko Dako",
      "maale-ashtime": "Ashtime",
      "bukhontxana-mine-marriages": "Bukhontxana",
      "lesotho-mummy-baby": "Mummy–Baby",
      "kewpie-district-six": "Kewpie",
    };
    for (const [slug, name] of Object.entries(originals)) {
      const record = ARCHIVE_RECORDS.find((entry) => entry.slug === slug)!;
      for (const language of ["zh", "en"] as const) {
        expect(getRecordNameplateNames(record, language)).toEqual({
          primaryTitle: record.title[language],
          secondaryTitle: name,
        });
      }
    }
  });

  it("uses the selected language on the first line of map nameplates", () => {
    const german = ARCHIVE_RECORDS.find((record) => record.originalName === "Institut für Sexualwissenschaft")!;
    expect(getRecordNameplateNames(german, "zh")).toEqual({
      primaryTitle: german.title.zh,
      secondaryTitle: german.originalName,
    });

    const mulan = ARCHIVE_RECORDS.find((record) => record.originalName === "木兰")!;
    expect(getRecordNameplateNames(mulan, "en")).toEqual({
      primaryTitle: mulan.title.zh,
      secondaryTitle: "Hua Mulan",
    });
  });

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

describe("The Seam - Globe Golden Coordinate Marker Sizing & Opacity", () => {
  it("computes zoom stops and dot radii from each viewport's normal globe baseline", () => {
    const mobile = computeGlobeClusterSizing(390, 844);
    const desktop = computeGlobeClusterSizing(1280, 720);
    const large = computeGlobeClusterSizing(1920, 1080);

    for (const sizing of [mobile, desktop, large]) {
      expect(MIN_GLOBE_ZOOM).toBeLessThan(sizing.normalZoom);
      expect(sizing.normalZoom).toBeLessThan(sizing.plateauZoom);
      expect(sizing.plateauZoom).toBeLessThan(MAX_GLOBE_ZOOM);

      expect(sizing.coreRadius.min / sizing.coreRadius.normal).toBeCloseTo(0.87, 2);
      expect(sizing.coreRadius.min).toBeLessThan(sizing.coreRadius.normal);
      expect(sizing.coreRadius.normal).toBeLessThan(sizing.coreRadius.max);
      expect(sizing.coreRadius.max / sizing.coreRadius.normal).toBeCloseTo(1.24, 2);
    }

    expect(desktop.normalGlobeDiameterPx).toBeGreaterThan(mobile.normalGlobeDiameterPx);
    expect(desktop.coreRadius.normal).toBeGreaterThan(mobile.coreRadius.normal);
    expect(large.coreRadius.normal).toBeGreaterThanOrEqual(desktop.coreRadius.normal);
  });

  it("keeps cluster core material opaque (#c49a45) and plateaus cleanly on zoom-in", () => {
    const sizing = computeGlobeClusterSizing(1280, 720);
    const specs = buildGlobeClusterPaintSpecs(sizing);

    expect(specs.coreOpacity).toBe(1);
    expect(specs.coreStrokeOpacity).toBe(1);
    expect(specs.haloOpacity).toEqual(["case", ["boolean", ["get", "hovered"], false], 0.38, 0]);

    const style = buildLocalPorcelainFallbackStyle([], { width: 1280, height: 720 });
    const coreLayer = style.layers.find((layer) => layer.id === "seam-clusters-core");
    expect(coreLayer?.type).toBe("circle");
    if (coreLayer && coreLayer.type === "circle" && coreLayer.paint) {
      expect(coreLayer.paint["circle-opacity"]).toBe(1);
      expect(coreLayer.paint["circle-stroke-opacity"]).toBe(1);
      expect(coreLayer.paint["circle-color"]).toEqual([
        "case",
        ["boolean", ["get", "hovered"], false],
        "#997223",
        "#c49a45",
      ]);
      const radiusExpr = coreLayer.paint["circle-radius"] as unknown[];
      expect(radiusExpr[0]).toBe("interpolate");
      // Last two zoom stops plateau at maxCoreRadius
      expect(radiusExpr[radiusExpr.length - 4]).toBe(sizing.plateauZoom);
      expect(radiusExpr[radiusExpr.length - 2]).toBe(MAX_GLOBE_ZOOM);
      expect(radiusExpr[radiusExpr.length - 3]).toEqual(radiusExpr[radiusExpr.length - 1]);
    }
  });
});
