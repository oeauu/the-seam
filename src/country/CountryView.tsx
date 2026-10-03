import { useEffect, useRef, useState, useMemo } from "react";
import * as d3 from "d3";
import type { FeatureCollection, Polygon } from "geojson";
import type { CountryFeature } from "../geo/geoTypes";
import type { CountryMetadata, CityMetadata } from "../data/countriesMeta";
import type { ArchiveRecord, LocationCluster } from "../types";
import { useApp } from "../state/appContext";
import { loadAdministrativeBorders, getMapCities, canonicalCountryName } from "../geo/worldGeometry";
import { clusterRecords } from "../geo/clustering";

interface CountryViewProps {
  country: CountryFeature;
  meta: CountryMetadata | null;
  records: ArchiveRecord[];
  onBack: () => void;
  onRecordClick: (record: ArchiveRecord) => void;
  onClusterClick: (cluster: LocationCluster) => void;
}

export function CountryView({country,meta,records,onBack,onRecordClick,onClusterClick}: CountryViewProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const zoomRef = useRef<d3.ZoomBehavior<SVGSVGElement, unknown> | null>(null);
  const [dimensions,setDimensions] = useState({width:900,height:600});
  const [transform,setTransform] = useState(d3.zoomIdentity);
  const [borders,setBorders] = useState<FeatureCollection | null>(null);
  const {language} = useApp();
  const name = meta?.name[language] || country.properties.name;

  useEffect(() => {
    const container = containerRef.current;
    if(!container)return;
    const observer=new ResizeObserver(() => setDimensions({width:Math.max(200,container.clientWidth),height:Math.max(200,container.clientHeight)}));
    observer.observe(container);
    return () => observer.disconnect();
  },[]);

  useEffect(() => {
    let active = true;
    setBorders(null);
    void loadAdministrativeBorders(country.properties.name).then(data => {if(active)setBorders(data);});
    return () => {active=false;};
  },[country]);

  useEffect(() => {
    const svg=svgRef.current;
    if(!svg)return;
    const behavior=d3.zoom<SVGSVGElement,unknown>().scaleExtent([0.6,16])
      .on("zoom", (event: d3.D3ZoomEvent<SVGSVGElement,unknown>) => setTransform(event.transform));
    zoomRef.current=behavior;
    const selection=d3.select(svg);
    selection.call(behavior).call(behavior.transform,d3.zoomIdentity);
    return () => {selection.on(".zoom",null);};
  },[country]);

  const countryRecords=useMemo(() => records.filter(record => {
    const coordinates=record.place.coordinates;
    if(!coordinates)return false;
    // Spatial containment follows the actual adopted map outline. Editorial
    // country metadata must not place a point outside the selected polygon.
    return d3.geoContains(country,[coordinates.longitude,coordinates.latitude]);
  }),[records,country]);

  const {path,projection}=useMemo(() => {
    let target: CountryFeature = country;
    if(country.geometry.type === "MultiPolygon") {
      const polygons=country.geometry.coordinates;
      const largest=[...polygons].sort((a,b) => d3.geoArea({type:"Polygon",coordinates:b})-d3.geoArea({type:"Polygon",coordinates:a}))[0];
      if(largest) {const geometry: Polygon = {type:"Polygon",coordinates:largest};target={...country,geometry};}
    }
    const center=d3.geoCentroid(target);
    const projection=d3.geoMercator().rotate([-center[0],0]).fitExtent([[30,30],[dimensions.width-30,dimensions.height-30]],target);
    return {projection,path:d3.geoPath(projection)};
  },[country,dimensions]);

  const clusters=useMemo(() => {
    // Eight screen pixels of separation; exact coordinates remain a picker.
    const kmPerPixel=6371 / projection.scale() / transform.k;
    return clusterRecords(countryRecords, 8 * kmPerPixel);
  },[countryRecords,projection,transform.k]);

  const cities=useMemo(() => {
    const global=getMapCities().filter(city => canonicalCountryName(city.countryName) === canonicalCountryName(country.properties.name) || (meta?.codeAlpha3 && city.countryCode === meta.codeAlpha3));
    const combined: CityMetadata[]=[...(meta?.capital ? [meta.capital] : []),...(meta?.cities || []),...global];
    return combined.filter((city,index) => combined.findIndex(other => other.name.en === city.name.en) === index
      && d3.geoContains(country,city.coordinates));
  },[country,meta]);

  const project=(longitude:number,latitude:number): [number,number] | null => {
    const point=projection([longitude,latitude]);
    return point ? transform.apply(point) : null;
  };
  const activate=(cluster:LocationCluster) => cluster.records.length === 1 ? onRecordClick(cluster.records[0]) : onClusterClick(cluster);
  const adjustZoom=(factor:number) => {
    if(svgRef.current && zoomRef.current)d3.select(svgRef.current).call(zoomRef.current.scaleBy,factor);
  };
  const reset=() => {
    if(svgRef.current && zoomRef.current)d3.select(svgRef.current).call(zoomRef.current.transform,d3.zoomIdentity);
  };

  return <div className="seam-country-view">
    <header className="seam-country-header">
      <button type="button" className="seam-back-button" onClick={onBack}>{language === "zh" ? "← 返回三维地球仪" : "← Return to Globe"}</button>
      <div className="seam-country-title-box"><h1 className="seam-country-name">{name}</h1>
        {meta?.capital && <p className="seam-country-capital">{language === "zh" ? "首都" : "Capital"}：{meta.capital.name[language]}</p>}
      </div>
      <div className="seam-country-stats"><span className="seam-stats-count">{countryRecords.length}</span><span className="seam-stats-label">{language === "zh" ? "条历史档案" : "Records"}</span></div>
    </header>
    <div className="seam-country-svg-container" ref={containerRef}>
      <svg ref={svgRef} className="seam-country-svg" width={dimensions.width} height={dimensions.height} viewBox={`0 0 ${dimensions.width} ${dimensions.height}`} aria-label={language === "zh" ? `${name}详细地图` : `Detailed map of ${name}`}>
        <g transform={transform.toString()}>
          <path d={path(country) || ""} fill="#fff" stroke="#111" strokeWidth={1.5 / transform.k} />
          {transform.k >= 1.4 && borders?.features.map((feature,index) => <path key={index} d={path(feature) || ""} fill="none" stroke="#888" strokeWidth={0.6 / transform.k} />)}
        </g>
        <g className="seam-cities-layer" pointerEvents="none">
          {cities.filter(city => city.isCapital || transform.k >= 1.6).map(city => {
            const point=project(...city.coordinates);
            if(!point || clusters.some(cluster => {const marker=project(cluster.coordinates.longitude,cluster.coordinates.latitude);return marker && Math.hypot(marker[0]-point[0],marker[1]-point[1]) < 45;}))return null;
            return <g key={city.name.en} transform={`translate(${point[0]},${point[1]})`}><circle r={city.isCapital ? 3 : 2} fill="#444" /><text x="7" y="4" fontSize="11" fill="#444">{city.name[language]}</text></g>;
          })}
        </g>
        <g className="seam-markers-layer">
          {clusters.map(cluster => {
            const point=project(cluster.coordinates.longitude,cluster.coordinates.latitude);
            if(!point)return null;
            const count=cluster.records.length;
            return <g key={cluster.id} className="seam-gold-marker-group" transform={`translate(${point[0]},${point[1]})`} role="button" tabIndex={0}
              aria-label={`${cluster.name[language]}: ${count} ${language === "zh" ? "条档案" : "records"}`}
              onClick={event => {event.stopPropagation();activate(cluster);}}
              onKeyDown={event => {if(event.key === "Enter" || event.key === " "){event.preventDefault();activate(cluster);}}}>
              <title>{cluster.records.map(record => record.title[language]).join(" / ")}</title>
              <circle r="15" fill="transparent" />
              <circle r={count > 1 ? 10 : 5} fill="#c49a45" stroke="#fff" strokeWidth="1.5" />
              {count > 1 && <text textAnchor="middle" y="3.5" fill="#fff" fontSize="10" pointerEvents="none">{count}</text>}
              {transform.k >= 2 && <text x="14" y="4" fontSize="11" pointerEvents="none">{cluster.name[language]}</text>}
            </g>;
          })}
        </g>
      </svg>
      <div className="seam-map-controls" aria-label={language === "zh" ? "地图缩放" : "Map zoom"}>
        <button type="button" onClick={() => adjustZoom(1.5)} aria-label={language === "zh" ? "放大地图" : "Zoom in"}>+</button>
        <button type="button" onClick={() => adjustZoom(1/1.5)} aria-label={language === "zh" ? "缩小地图" : "Zoom out"}>−</button>
        <button type="button" onClick={reset}>{language === "zh" ? "适配范围" : "Fit map"}</button>
      </div>
      {countryRecords.length === 0 && <div className="seam-country-empty-hint">{language === "zh" ? "当前时间范围内暂无档案。" : "No records in the selected era."}</div>}
    </div>
  </div>;
}
