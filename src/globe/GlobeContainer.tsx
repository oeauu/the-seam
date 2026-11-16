import { useEffect, useState } from "react";
import { GlobeScene } from "./GlobeScene";
import { loadWorldData } from "../geo/worldGeometry";
import type { WorldData, CountryFeature } from "../geo/geoTypes";
import type { LocationCluster } from "../types";
import { useApp } from "../state/useApp";
import { GlobeBoundary } from "./GlobeBoundary";

let webglAvailable: boolean | undefined;
function supportsWebGL(): boolean {
  if (webglAvailable !== undefined) return webglAvailable;
  try {
    const context = document.createElement("canvas").getContext("webgl2");
    webglAvailable = !!context;
    context?.getExtension("WEBGL_lose_context")?.loseContext();
  } catch { webglAvailable = false; }
  return webglAvailable;
}

export function GlobeContainer() {
  const [worldData, setWorldData] = useState<WorldData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const {
    selectCountry,
    openRecord,
    selectCluster,
    language,
    setIndexOpen
  } = useApp();

  useEffect(() => {
    let active = true;
    loadWorldData()
      .then(data => {
        if (active) {
          setWorldData(data);
          setLoading(false);
        }
      })
      .catch(err => {
        if (active) {
          console.error("Failed to load world data:", err);
          setError("Failed to load world geometry data.");
          setLoading(false);
        }
      });
    return () => { active = false; };
  }, []);

  const handleCountryClick = (country: CountryFeature) => {
    selectCountry(country);
  };

  const handleClusterClick = (cluster: LocationCluster) => {
    if (cluster.records.length === 1) {
      openRecord(cluster.records[0]);
    } else {
      selectCluster(cluster);
    }
  };

  if (loading) {
    return (
      <div className="seam-globe-loading" role="status" aria-live="polite">
        <div className="seam-spinner" />
        <p>{language === "zh" ? "加载世界地理轮廓与坐标..." : "Loading world coordinates..."}</p>
      </div>
    );
  }

  if (error || !worldData) {
    return (
      <div className="seam-globe-error" role="alert">
        <p>{error || "Error initializing globe."}</p>
        <button type="button" onClick={() => setIndexOpen(true)}>{language === "zh" ? "通过档案索引浏览" : "Browse archive index"}</button>
      </div>
    );
  }

  const fallback = <div className="seam-accessible-map">
    <p>{language === "zh" ? "二维地图与档案浏览" : "2D maps and archive browsing"}</p>
    <label>{language === "zh" ? "选择国家或地区" : "Choose a country or region"}
      <select defaultValue="" onChange={event => {const country = worldData.features.find(f => String(f.id) === event.target.value);if(country)selectCountry(country);}}>
        <option value="" disabled>{language === "zh" ? "请选择" : "Choose…"}</option>
        {worldData.features.map(country => <option key={country.id} value={String(country.id)}>{country.properties.name}</option>)}
      </select>
    </label>
    <button type="button" onClick={() => setIndexOpen(true)}>{language === "zh" ? "浏览全部档案（含地点待考）" : "Browse all records (including locations pending)"}</button>
  </div>;

  return (
    <div className="seam-globe-container">
      {!supportsWebGL() ? fallback : <GlobeBoundary fallback={fallback}><GlobeScene
        worldData={worldData}
        onCountryClick={handleCountryClick}
        onClusterClick={handleClusterClick}
      /></GlobeBoundary>}
    </div>
  );
}
