import { useEffect, useRef, useState, useMemo } from "react";
import * as d3 from "d3";
import type { CountryFeature } from "../geo/geoTypes";
import type { CountryMetadata } from "../data/countriesMeta";
import type { ArchiveRecord, LocationCluster } from "../types";
import { useApp } from "../state/appContext";
import { loadChinaProvinces } from "../geo/worldGeometry";
import { clusterRecords } from "../geo/clustering";

interface CountryViewProps {
  country: CountryFeature;
  meta: CountryMetadata | null;
  records: ArchiveRecord[];
  onBack: () => void;
  onRecordClick: (record: ArchiveRecord) => void;
  onClusterClick: (cluster: LocationCluster) => void;
}

export function CountryView({
  country,
  meta,
  records,
  onBack,
  onRecordClick,
  onClusterClick,
}: CountryViewProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const [dimensions, setDimensions] = useState({ width: 900, height: 600 });
  const [chinaProvinces, setChinaProvinces] = useState<any>(null);
  const [hoveredCluster, setHoveredCluster] = useState<string | null>(null);

  const { language } = useApp();

  const countryNameEn = meta?.name.en || country.properties?.name || "Country";
  const countryNameZh = meta?.name.zh || countryNameEn;

  // Track window resize
  useEffect(() => {
    function updateSize() {
      if (containerRef.current) {
        const { clientWidth, clientHeight } = containerRef.current;
        setDimensions({
          width: Math.max(300, clientWidth),
          height: Math.max(300, clientHeight),
        });
      }
    }
    updateSize();
    window.addEventListener("resize", updateSize);
    return () => window.removeEventListener("resize", updateSize);
  }, []);

  // Load provincial borders if China
  useEffect(() => {
    const isChina = country.properties?.name === "China" || meta?.id === "156";
    if (isChina) {
      loadChinaProvinces().then(data => {
        if (data) setChinaProvinces(data);
      });
    }
  }, [country, meta]);

  // Filter records belonging to this country or falling inside its bounding box
  const countryRecords = useMemo(() => {
    const cid = String(country.id || "");
    const cName = (country.properties?.name || "").toLowerCase();

    return records.filter(r => {
      if (!r.place.coordinates) return false;
      // Match by country code
      if (r.place.countryCode && (r.place.countryCode === cid || r.place.countryCode === meta?.id)) {
        return true;
      }
      // Match by country name
      const rCountry = (r.place.countryName?.en || "").toLowerCase();
      if (rCountry && (rCountry === cName || cName.includes(rCountry) || rCountry.includes(cName))) {
        return true;
      }
      // Spatial containment test
      try {
        if (d3.geoContains(country as any, [r.place.coordinates.longitude, r.place.coordinates.latitude])) {
          return true;
        }
      } catch {
        // ignore
      }
      return false;
    });
  }, [records, country, meta]);

  const countryClusters = useMemo(() => {
    return clusterRecords(countryRecords);
  }, [countryRecords]);

  // Build D3 projection auto-fitting country
  const { pathGenerator, projection } = useMemo(() => {
    const margin = 50;
    const { width, height } = dimensions;

    // Use Mercator or Azimuthal for flat country map
    const proj = d3.geoMercator();

    // To prevent tiny overseas territories from making mainland tiny,
    // filter geometry to main polygon(s) if MultiPolygon has vast outliers
    let targetGeom: any = country;
    if (country.geometry.type === "MultiPolygon") {
      const coords = country.geometry.coordinates as number[][][][];
      // Keep only polygons with significant number of points (mainland / main islands)
      const sorted = [...coords].sort((a, b) => b[0].length - a[0].length);
      if (sorted.length > 1) {
        targetGeom = {
          type: "Feature",
          properties: country.properties,
          geometry: {
            type: "MultiPolygon",
            coordinates: sorted.slice(0, Math.min(5, sorted.length))
          }
        };
      }
    }

    try {
      proj.fitExtent(
        [[margin, margin + 40], [width - margin, height - margin]],
        targetGeom as any
      );
    } catch (err) {
      console.warn("fitExtent failed, using fallback centering", err);
      proj.center([0, 0]).scale(150).translate([width / 2, height / 2]);
    }

    const path = d3.geoPath().projection(proj);
    return { pathGenerator: path, projection: proj };
  }, [country, dimensions]);

  // Major cities to render
  const cities = meta?.cities || [];

  return (
    <div className="seam-country-view" ref={containerRef}>
      {/* Top Header / Navigation */}
      <header className="seam-country-header">
        <button
          className="seam-back-button"
          onClick={onBack}
          type="button"
          aria-label={language === "zh" ? "返回三维地球仪" : "Return to 3D globe"}
        >
          <span className="seam-back-arrow" aria-hidden="true">←</span>
          <span>{language === "zh" ? "返回三维地球仪" : "Return to Globe"}</span>
        </button>

        <div className="seam-country-title-box">
          <h1 className="seam-country-name">
            {language === "zh" ? countryNameZh : countryNameEn}
            {countryNameZh !== countryNameEn && (
              <span className="seam-country-subname">
                {language === "zh" ? countryNameEn : countryNameZh}
              </span>
            )}
          </h1>
          {meta?.capital && (
            <p className="seam-country-capital">
              {language === "zh"
                ? `首都：${meta.capital.name.zh}`
                : `Capital: ${meta.capital.name.en}`}
            </p>
          )}
        </div>

        <div className="seam-country-stats">
          <span className="seam-stats-count">
            {countryRecords.length}
          </span>
          <span className="seam-stats-label">
            {language === "zh" ? "条历史档案" : "Records"}
          </span>
        </div>
      </header>

      {/* SVG Map Canvas */}
      <div className="seam-country-svg-container">
        <svg
          ref={svgRef}
          className="seam-country-svg"
          width={dimensions.width}
          height={dimensions.height}
          viewBox={`0 0 ${dimensions.width} ${dimensions.height}`}
        >
          {/* Subtle background grid pattern */}
          <defs>
            <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
              <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#f4f4f4" strokeWidth="0.8" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid)" />

          {/* Active Country Outline Fill & Border */}
          <path
            d={pathGenerator(country as any) || ""}
            className="seam-country-path"
            fill="#ffffff"
            stroke="#111111"
            strokeWidth="1.8"
            strokeLinejoin="round"
          />

          {/* Provincial Borders (for China or other states if loaded) */}
          {chinaProvinces && chinaProvinces.features && (
            <g className="seam-provinces-layer">
              {chinaProvinces.features.map((f: any, idx: number) => (
                <path
                  key={`prov-${idx}`}
                  d={pathGenerator(f) || ""}
                  fill="none"
                  stroke="#d8d8d8"
                  strokeWidth="0.8"
                />
              ))}
            </g>
          )}

          {/* Cities & Capitals */}
          <g className="seam-cities-layer">
            {cities.map((city, idx) => {
              const pt = projection(city.coordinates);
              if (!pt || isNaN(pt[0]) || isNaN(pt[1])) return null;
              const [cx, cy] = pt;

              return (
                <g key={`city-${idx}`} className="seam-city-group" transform={`translate(${cx}, ${cy})`}>
                  {city.isCapital ? (
                    <>
                      <circle r="4.5" fill="none" stroke="#111111" strokeWidth="1.2" />
                      <circle r="2" fill="#111111" />
                    </>
                  ) : (
                    <circle r="2.2" fill="#666666" />
                  )}
                  <text
                    x="8"
                    y="3"
                    className="seam-city-label"
                    fontSize={city.isCapital ? "11" : "9.5"}
                    fontWeight={city.isCapital ? "600" : "400"}
                    fill={city.isCapital ? "#111111" : "#555555"}
                  >
                    {city.name[language] || city.name.en}
                  </text>
                </g>
              );
            })}
          </g>

          {/* Gold Coordinate Markers */}
          <g className="seam-markers-layer">
            {countryClusters.map(cluster => {
              const pt = projection([cluster.coordinates.longitude, cluster.coordinates.latitude]);
              if (!pt || isNaN(pt[0]) || isNaN(pt[1])) return null;
              const [cx, cy] = pt;
              const isHovered = hoveredCluster === cluster.id;
              const count = cluster.records.length;

              return (
                <g
                  key={cluster.id}
                  className="seam-gold-marker-group"
                  transform={`translate(${cx}, ${cy})`}
                  onMouseEnter={() => setHoveredCluster(cluster.id)}
                  onMouseLeave={() => setHoveredCluster(null)}
                  onClick={() => {
                    if (count === 1) {
                      onRecordClick(cluster.records[0]);
                    } else {
                      onClusterClick(cluster);
                    }
                  }}
                  style={{ cursor: "pointer" }}
                  role="button"
                  tabIndex={0}
                  aria-label={`${cluster.name[language]}: ${count} record(s)`}
                >
                  {/* Subtle radiating pulse ring */}
                  <circle
                    r={isHovered ? "18" : "12"}
                    fill="#c49a45"
                    fillOpacity={isHovered ? "0.28" : "0.15"}
                    className="seam-pulse-ring"
                  />

                  {/* Gold core marker */}
                  <circle
                    r={isHovered ? "6.5" : "5"}
                    fill={isHovered ? "#dfb53d" : "#c49a45"}
                    stroke="#ffffff"
                    strokeWidth="1.8"
                  />

                  {/* Marker label */}
                  <text
                    x="10"
                    y="4"
                    className="seam-marker-svg-label"
                    fontSize="11.5"
                    fontWeight="600"
                    fill="#111111"
                  >
                    {cluster.name[language] || cluster.name.en}
                    {count > 1 && ` (${count})`}
                  </text>
                </g>
              );
            })}
          </g>
        </svg>

        {/* Empty state hint if country has no records */}
        {countryRecords.length === 0 && (
          <div className="seam-country-empty-hint">
            <p>
              {language === "zh"
                ? "当前时间段内该国家暂无档案记录。"
                : "No archive records found in this country for the selected era."}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
