import { useEffect, useState } from "react";
import { GlobeScene } from "./GlobeScene";
import { loadWorldData } from "../geo/worldGeometry";
import type { WorldData, CountryFeature } from "../geo/geoTypes";
import type { LocationCluster } from "../types";
import { useApp } from "../state/appContext";

export function GlobeContainer() {
  const [worldData, setWorldData] = useState<WorldData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const {
    clusters,
    selectCountry,
    openRecord,
    selectCluster,
    language
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
      </div>
    );
  }

  return (
    <div className="seam-globe-container">
      <GlobeScene
        worldData={worldData}
        clusters={clusters}
        onCountryClick={handleCountryClick}
        onClusterClick={handleClusterClick}
      />
      
      {/* Discreet interaction hint */}
      <div className="seam-globe-hint" aria-hidden="true">
        <span>{language === "zh" ? "拖动旋转 · 滚轮缩放 · 点击国家进入详细地图" : "Drag to rotate · Scroll to zoom · Click country for 2D map"}</span>
      </div>
    </div>
  );
}
