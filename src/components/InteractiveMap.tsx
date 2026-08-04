import React, { useEffect, useRef, useState } from "react";
import * as d3 from "d3";
import * as topojson from "topojson-client";
import { GEOGRAPHY_DATABASE } from "../db/geography";
import type { HistoricalEvent } from "../db/eventsData";

interface InteractiveMapProps {
  currentLanguage: "en" | "zh";
  activeTimelineYear: number;
  currentLevel: number;
  setCurrentLevel: (level: number) => void;
  activeContinent: string | null;
  setActiveContinent: (cont: string | null) => void;
  activeCountry: string | null;
  setActiveCountry: (country: string | null) => void;
  activeProvince: string | null;
  setActiveProvince: (prov: string | null) => void;
  onSelectCity: (cityKey: string) => void;
  getCombinedEvents: () => any[];
}

export const InteractiveMap: React.FC<InteractiveMapProps> = ({
  currentLanguage,
  activeTimelineYear,
  currentLevel,
  setCurrentLevel,
  activeContinent,
  setActiveContinent,
  activeCountry,
  setActiveCountry,
  activeProvince,
  setActiveProvince,
  onSelectCity,
  getCombinedEvents
}) => {
  const svgRef = useRef<SVGSVGElement | null>(null);
  const [worldGeoJSON, setWorldGeoJSON] = useState<any>(null);
  const [chinaGeoJSON, setChinaGeoJSON] = useState<any>(null);
  const [zoomBehavior, setZoomBehavior] = useState<any>(null);
  const [popupData, setPopupData] = useState<{
    cityKey: string;
    x: number;
    y: number;
  } | null>(null);
  const [expandedEventIndex, setExpandedEventIndex] = useState<number | null>(null);
  
  // Track previous level for transition animation directions
  const prevLevelRef = useRef<number>(currentLevel);

  // Track active popupData in a ref to avoid stale closures in D3 event handlers
  const popupDataRef = useRef(popupData);
  useEffect(() => {
    popupDataRef.current = popupData;
  }, [popupData]);

  // Fetch GeoJSON data on mount
  useEffect(() => {
    d3.json("/countries-110m.json")
      .then(data => setWorldGeoJSON(data))
      .catch(err => console.error("Failed to load world map:", err));

    d3.json("/china.json")
      .then(data => setChinaGeoJSON(data))
      .catch(err => console.error("Failed to load China map:", err));
  }, []);

  // Initialize Zoom behavior once SVG is available
  useEffect(() => {
    if (!svgRef.current) return;
    const svg = d3.select(svgRef.current);

    const zoom = d3.zoom()
      .scaleExtent([0.5, 8])
      .on("zoom", (event) => {
        // Close popup on zoom/pan to avoid desync
        setPopupData(null);

        d3.select("#map-g").attr("transform", event.transform);
        d3.select("#labels-g").attr("transform", event.transform);
        d3.select("#anchors-g").attr("transform", event.transform);

        // Dynamically adjust stroke width and font sizes
        d3.selectAll(".map-land").style("stroke-width", `${1.5 / event.transform.k}px`);
        d3.selectAll(".map-label-l1").style("font-size", `${18 / event.transform.k}px`);
        d3.selectAll(".map-label-l2").style("font-size", `${16 / event.transform.k}px`);
        d3.selectAll(".map-label-l3").style("font-size", `${14 / event.transform.k}px`);
        d3.selectAll(".map-label-l4").style("font-size", `${12 / event.transform.k}px`);
        
        // Scale anchor circles
        d3.selectAll(".map-anchor-dot").attr("r", 4 / event.transform.k);
      });

    svg.call(zoom as any);
    setZoomBehavior(() => zoom);
  }, [worldGeoJSON, chinaGeoJSON]);

  // Handle ESC key to close event popup
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setPopupData(null);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Reset popup when timeline year or level changes
  useEffect(() => {
    setPopupData(null);
    setExpandedEventIndex(null);
  }, [activeTimelineYear, currentLevel]);

  // Helper function to get events for a specific city at the current year
  const getCityEvents = (cityKey: string): HistoricalEvent[] => {
    const combinedEvents = getCombinedEvents();
    const cityData = GEOGRAPHY_DATABASE.cities[cityKey as keyof typeof GEOGRAPHY_DATABASE.cities];
    if (!cityData) return [];

    const matchedGroups = combinedEvents.filter(ev => {
      if (ev.year !== activeTimelineYear) return false;
      const locName = typeof ev.location === "object" ? ev.location.en : ev.location;
      return (
        cityKey === locName ||
        cityData.name.en === locName ||
        cityData.name.zh === locName ||
        (typeof ev.location === "object" && 
          (cityData.name.zh === ev.location.zh || cityData.name.en === ev.location.en))
      );
    });

    // Flatten all events from matching groups
    const allEvents: HistoricalEvent[] = [];
    matchedGroups.forEach(group => {
      if (group.events) {
        allEvents.push(...group.events);
      }
    });
    return allEvents;
  };

  // Helper functions for back-navigation (drillUp)
  const drillUp = () => {
    setPopupData(null);
    if (currentLevel === 4) {
      if (activeCountry === "China" || activeCountry === "中国") {
        setCurrentLevel(3);
        setActiveProvince(null);
      } else {
        setCurrentLevel(2);
        setActiveCountry(null);
        setActiveProvince(null);
      }
    } else if (currentLevel === 3) {
      setCurrentLevel(2);
      setActiveCountry(null);
      setActiveProvince(null);
    } else if (currentLevel === 2) {
      setCurrentLevel(1);
      setActiveContinent(null);
    }
  };

  const drillDownToContinent = (continent: string) => {
    setActiveContinent(continent);
    setCurrentLevel(2);
  };

  const drillDownToCountry = (countryName: string) => {
    setActiveCountry(countryName);
    if (countryName === "China" || countryName === "中国") {
      setCurrentLevel(3);
    } else {
      // Missing L3, skip directly to L4
      const countryData = GEOGRAPHY_DATABASE.countries[countryName as keyof typeof GEOGRAPHY_DATABASE.countries];
      if (countryData && countryData.provinces.length > 0) {
        setActiveProvince(countryData.provinces[0]);
      } else {
        setActiveProvince(null);
      }
      setCurrentLevel(4);
    }
  };

  const drillDownToProvince = (provKey: string) => {
    setActiveProvince(provKey);
    setCurrentLevel(4);
  };

  const openPopupForCity = (cityKey: string, customX?: number, customY?: number) => {
    if (customX !== undefined && customY !== undefined) {
      setPopupData({ cityKey, x: customX, y: customY });
      setExpandedEventIndex(null);
      onSelectCity(cityKey);
      return;
    }

    const cityData = GEOGRAPHY_DATABASE.cities[cityKey as keyof typeof GEOGRAPHY_DATABASE.cities];
    if (!cityData) return;

    // Calculate position dynamically from projection and zoom
    const width = svgRef.current?.clientWidth || 800;
    const height = svgRef.current?.clientHeight || 500;
    
    // Fit extent boundary projection to calculate correct projected coords
    const projection = d3.geoEquirectangular();
    fitProjectionToLevel(projection, width, height);

    const xy = projection(cityData.coords as [number, number]);
    if (xy && !isNaN(xy[0]) && svgRef.current) {
      const transform = d3.zoomTransform(svgRef.current);
      const screenX = transform.x + transform.k * xy[0];
      const screenY = transform.y + transform.k * xy[1];
      setPopupData({ cityKey, x: screenX, y: screenY });
      setExpandedEventIndex(null);
    } else {
      setPopupData({ cityKey, x: width / 2, y: height / 2 });
      setExpandedEventIndex(null);
    }

    onSelectCity(cityKey);
  };

  // Helper classifier for matching country to continent
  const getContinentByCountry = (countryName: string, feature: any) => {
    for (const [contId, contData] of Object.entries(GEOGRAPHY_DATABASE.continents)) {
      if (contData.countries.includes(countryName)) return contId;
    }
    if (feature) {
      try {
        const tempProj = d3.geoEquirectangular();
        const tempPath = d3.geoPath().projection(tempProj);
        const centroid = tempPath.centroid(feature);
        if (centroid && !isNaN(centroid[0]) && !isNaN(centroid[1])) {
          const [lng, lat] = tempProj.invert ? (tempProj.invert(centroid) || [0, 0]) : [0, 0];
          if (lat < -60) return "Antarctica";
          if (lng < -30) {
            if (lat > 12) return "North America";
            return "South America";
          }
          if (lng > 110 && lat < -10) return "Oceania";
          if (lng > -20 && lng < 52 && lat < 35) {
            if (lng > 34 && lat > 12) return "Asia";
            return "Africa";
          }
          if (lng < 60 && lat >= 35) {
            if (countryName === "Russia" || lng > 35) return "Asia";
            return "Europe";
          }
          return "Asia";
        }
      } catch (e) {
        console.warn(e);
      }
    }
    if (["China", "Taiwan", "Japan", "India", "Iraq", "Israel", "Turkey"].includes(countryName)) return "Asia";
    if (["Greece", "Italy", "France", "United Kingdom", "Germany", "Spain"].includes(countryName)) return "Europe";
    if (countryName === "Egypt") return "Africa";
    if (["United States of America", "Canada", "Mexico"].includes(countryName)) return "North America";
    if (["Brazil", "Argentina"].includes(countryName)) return "South America";
    if (["Australia", "New Zealand"].includes(countryName)) return "Oceania";
    return null;
  };

  const mapChineseProvinceToKey = (zhName: string) => {
    if (zhName.includes("陕西")) return "Shaanxi";
    if (zhName.includes("福建")) return "Fujian";
    if (zhName.includes("台湾")) return "Taiwan";
    if (zhName.includes("河南")) return "Henan";
    if (zhName.includes("河北")) return "Hebei";
    return null;
  };

  // Helper to fit projection based on current active levels
  const fitProjectionToLevel = (proj: d3.GeoProjection, width: number, height: number) => {
    const padding = [[width * 0.05, height * 0.05], [width * 0.95, height * 0.95]] as [[number, number], [number, number]];

    if (currentLevel === 1) {
      const countries = (topojson.feature(worldGeoJSON, worldGeoJSON.objects.countries) as any).features;
      proj.fitExtent(padding, { type: "FeatureCollection", features: countries });
    } 
    else if (currentLevel === 2 && activeContinent) {
      const countries = (topojson.feature(worldGeoJSON, worldGeoJSON.objects.countries) as any).features;
      const continentCountries = countries.filter(
        (d: any) => getContinentByCountry(d.properties.name, d) === activeContinent
      );
      if (continentCountries.length > 0) {
        proj.fitExtent(padding, { type: "FeatureCollection", features: continentCountries });
      }
    } 
    else if (currentLevel === 3 && (activeCountry === "China" || activeCountry === "中国") && chinaGeoJSON) {
      proj.fitExtent(padding, { type: "FeatureCollection", features: chinaGeoJSON.features });
    } 
    else if (currentLevel === 4) {
      if ((activeCountry === "China" || activeCountry === "中国") && chinaGeoJSON && activeProvince) {
        const provinceFeature = chinaGeoJSON.features.find((f: any) => {
          const name = f.properties.name || "";
          const key = mapChineseProvinceToKey(name);
          return key === activeProvince;
        });
        if (provinceFeature) {
          proj.fitExtent(padding, provinceFeature);
          return;
        }
      }
      
      // Fallback: fit to Country boundary if province GeoJSON is missing
      if (activeCountry && worldGeoJSON) {
        const countries = (topojson.feature(worldGeoJSON, worldGeoJSON.objects.countries) as any).features;
        const countryFeature = countries.find((f: any) => {
          const name = f.properties.name || "";
          const cData = GEOGRAPHY_DATABASE.countries[activeCountry as keyof typeof GEOGRAPHY_DATABASE.countries];
          return name === activeCountry || (cData && cData.name.en === name);
        });
        if (countryFeature) {
          proj.fitExtent(padding, countryFeature);
          return;
        }
      }

      // Default fallback
      const countries = (topojson.feature(worldGeoJSON, worldGeoJSON.objects.countries) as any).features;
      proj.fitExtent(padding, { type: "FeatureCollection", features: countries });
    }
  };

  // Main draw loop triggered on prop changes
  useEffect(() => {
    if (!svgRef.current || !worldGeoJSON) return;
    const svg = d3.select(svgRef.current);

    // Reset zoom transform to identity on redraw
    if (zoomBehavior) {
      svg.call(zoomBehavior.transform, d3.zoomIdentity);
    }

    const width = svgRef.current.clientWidth || 800;
    const height = svgRef.current.clientHeight || 500;

    svg.selectAll("*").remove();

    // Background rect to capture clicks on empty space for drillUp and closing popup
    svg.append("rect")
      .attr("width", width)
      .attr("height", height)
      .attr("fill", "transparent")
      .attr("style", "pointer-events: all; cursor: default;")
      .on("click", (e) => {
        e.stopPropagation();
        if (popupDataRef.current) {
          setPopupData(null);
        } else {
          drillUp();
        }
      });

    const g = svg.append("g").attr("id", "map-g");
    const labelsG = svg.append("g").attr("id", "labels-g");
    const anchorsG = svg.append("g").attr("id", "anchors-g");

    const projection = d3.geoEquirectangular();
    const pathGenerator = d3.geoPath().projection(projection);

    // Fit projection coordinates for current view
    fitProjectionToLevel(projection, width, height);

    // RENDER LEVEL 1: World Map
    if (currentLevel === 1) {
      const countries = (topojson.feature(worldGeoJSON, worldGeoJSON.objects.countries) as any).features;
      
      // Pure line art, dashed boundaries
      g.selectAll(".map-land")
        .data(countries)
        .enter()
        .append("path")
        .attr("class", "map-land interactive map-border-dash")
        .attr("d", pathGenerator as any)
        .style("fill", "#FFFFFF")
        .style("stroke", "#2C2C2C")
        .style("stroke-width", "1px")
        .style("stroke-dasharray", "3,3")
        .on("click", (event, d: any) => {
          event.stopPropagation();
          const continent = getContinentByCountry(d.properties.name, d);
          if (continent) drillDownToContinent(continent);
        });

      // Render 7 continents names
      const continentList = Object.entries(GEOGRAPHY_DATABASE.continents);
      labelsG.selectAll(".map-label")
        .data(continentList)
        .enter()
        .append("text")
        .attr("class", "map-label map-label-l1")
        .attr("x", (d: any) => {
          const pt = projection(d[1].center as [number, number]);
          return pt ? pt[0] : width / 2;
        })
        .attr("y", (d: any) => {
          const pt = projection(d[1].center as [number, number]);
          return pt ? pt[1] : height / 2;
        })
        .text((d: any) => d[1].name[currentLanguage])
        .style("cursor", "pointer")
        .style("pointer-events", "auto")
        .style("font-family", "'Noto Sans SC', sans-serif")
        .style("font-size", "18px")
        .style("font-weight", "bold")
        .style("fill", "#000000")
        .on("click", (event, d: any) => {
          event.stopPropagation();
          drillDownToContinent(d[0]);
        });
    }
    // RENDER LEVEL 2: Continent Map
    else if (currentLevel === 2 && activeContinent) {
      const countries = (topojson.feature(worldGeoJSON, worldGeoJSON.objects.countries) as any).features;
      const continentCountries = countries.filter(
        (d: any) => getContinentByCountry(d.properties.name, d) === activeContinent
      );

      if (continentCountries.length > 0) {
        g.selectAll(".map-land")
          .data(continentCountries)
          .enter()
          .append("path")
          .attr("class", "map-land interactive map-border-dash")
          .attr("d", pathGenerator as any)
          .style("fill", "#FFFFFF")
          .style("stroke", "#2C2C2C")
          .style("stroke-width", "1px")
          .style("stroke-dasharray", "3,3")
          .on("click", (event, d: any) => {
            event.stopPropagation();
            drillDownToCountry(d.properties.name);
          });

        // Dynamic country labels
        const labelCountries = continentCountries.filter((d: any) => (pathGenerator.area(d) || 0) > 300);

        labelsG.selectAll(".map-label")
          .data(labelCountries)
          .enter()
          .append("text")
          .attr("class", "map-label map-label-l2")
          .attr("transform", (d: any) => {
            const centroid = pathGenerator.centroid(d);
            return centroid && !isNaN(centroid[0]) ? `translate(${centroid})` : "";
          })
          .text((d: any) => {
            const cId = d.properties.name;
            const cData = GEOGRAPHY_DATABASE.countries[cId as keyof typeof GEOGRAPHY_DATABASE.countries];
            return cData ? cData.name[currentLanguage] : cId;
          })
          .style("cursor", "pointer")
          .style("pointer-events", "auto")
          .style("font-family", "'Noto Sans SC', sans-serif")
          .style("font-size", "16px")
          .style("font-weight", "normal")
          .style("fill", "#000000")
          .on("click", (event, d: any) => {
            event.stopPropagation();
            drillDownToCountry(d.properties.name);
          });
      }
    }
    // RENDER LEVEL 3: Country (China) Map
    else if (currentLevel === 3 && (activeCountry === "China" || activeCountry === "中国") && chinaGeoJSON) {
      const provinces = chinaGeoJSON.features;

      g.selectAll(".map-land")
        .data(provinces)
        .enter()
        .append("path")
        .attr("class", "map-land interactive")
        .attr("d", pathGenerator as any)
        .style("fill", "#FFFFFF")
        .style("stroke", "#2C2C2C")
        .style("stroke-width", "1.5px")
        .on("click", (event, d: any) => {
          event.stopPropagation();
          const key = mapChineseProvinceToKey(d.properties.name);
          if (key) drillDownToProvince(key);
        });

      labelsG.selectAll(".map-label")
        .data(provinces)
        .enter()
        .append("text")
        .attr("class", "map-label map-label-l3")
        .attr("transform", (d: any) => {
          const centroid = pathGenerator.centroid(d);
          return centroid && !isNaN(centroid[0]) ? `translate(${centroid})` : "";
        })
        .text((d: any) => d.properties.name)
        .style("cursor", "pointer")
        .style("pointer-events", "auto")
        .style("font-family", "'Noto Sans SC', sans-serif")
        .style("font-size", "14px")
        .style("font-weight", "normal")
        .style("fill", "#000000")
        .on("click", (event, d: any) => {
          event.stopPropagation();
          const key = mapChineseProvinceToKey(d.properties.name);
          if (key) drillDownToProvince(key);
        });
    }
    // RENDER LEVEL 4: Administrative province/region final level with anchors
    else if (currentLevel === 4) {
      // Draw boundaries
      let hasVectorMap = false;

      if ((activeCountry === "China" || activeCountry === "中国") && chinaGeoJSON && activeProvince) {
        const provinceFeature = chinaGeoJSON.features.find((f: any) => {
          const name = f.properties.name || "";
          const key = mapChineseProvinceToKey(name);
          return key === activeProvince;
        });
        if (provinceFeature) {
          g.append("path")
            .datum(provinceFeature)
            .attr("class", "map-land")
            .attr("d", pathGenerator as any)
            .style("fill", "#FFFFFF")
            .style("stroke", "#2C2C2C")
            .style("stroke-width", "1.5px");
          hasVectorMap = true;
        }
      } 
      else if (activeCountry && worldGeoJSON) {
        const countries = (topojson.feature(worldGeoJSON, worldGeoJSON.objects.countries) as any).features;
        const countryFeature = countries.find((f: any) => {
          const name = f.properties.name || "";
          const cData = GEOGRAPHY_DATABASE.countries[activeCountry as keyof typeof GEOGRAPHY_DATABASE.countries];
          return name === activeCountry || (cData && cData.name.en === name);
        });
        if (countryFeature) {
          g.append("path")
            .datum(countryFeature)
            .attr("class", "map-land")
            .attr("d", pathGenerator as any)
            .style("fill", "#FFFFFF")
            .style("stroke", "#2C2C2C")
            .style("stroke-width", "1.5px");
          hasVectorMap = true;
        }
      }

      if (!hasVectorMap) {
        labelsG.append("text")
          .attr("x", width / 2)
          .attr("y", height / 2)
          .attr("text-anchor", "middle")
          .text(currentLanguage === "zh" 
            ? "⚠️ 地图矢量数据不可用，请使用右侧地点目录浏览" 
            : "⚠️ Map vector data unavailable, please use the sidebar directory")
          .style("font-family", "'Noto Sans SC', sans-serif")
          .style("font-size", "14px")
          .style("fill", "#666666")
          .style("font-weight", "normal");
      }

      // Draw administrative region name inside the background
      let regionName = activeProvince 
        ? (GEOGRAPHY_DATABASE.provinces[activeProvince]?.name[currentLanguage] || activeProvince)
        : (activeCountry ? (GEOGRAPHY_DATABASE.countries[activeCountry]?.name[currentLanguage] || activeCountry) : "");

      labelsG.append("text")
        .attr("x", width / 2)
        .attr("y", height * 0.15)
        .text(regionName)
        .style("font-family", "'Noto Sans SC', sans-serif")
        .style("font-size", "22px")
        .style("font-weight", "bold")
        .style("fill", "#E0E0E0") // Light watermark style
        .style("text-anchor", "middle")
        .style("opacity", 0.5)
        .style("pointer-events", "none");

      // Draw anchors and their names
      const citiesInProv = getCitiesForCurrentLevel4();

      citiesInProv.forEach(cityKey => {
        const cityData = GEOGRAPHY_DATABASE.cities[cityKey as keyof typeof GEOGRAPHY_DATABASE.cities];
        if (!cityData) return;

        const xy = projection(cityData.coords as [number, number]);
        if (!xy || isNaN(xy[0])) return;

        const cityEvents = getCityEvents(cityKey);
        const hasEvents = cityEvents.length > 0;

        const anchorG = anchorsG.append("g")
          .attr("transform", `translate(${xy[0]}, ${xy[1]})`);

        if (hasEvents) {
          // Black solid dot
          anchorG.append("circle")
            .attr("class", "map-anchor-dot")
            .attr("r", 4)
            .attr("fill", "#000000")
            .attr("stroke", "#FFFFFF")
            .attr("stroke-width", "1.5px")
            .style("cursor", "pointer")
            .on("mouseover", function() {
              d3.select(this).transition().duration(200).attr("r", 6);
            })
            .on("mouseout", function() {
              d3.select(this).transition().duration(200).attr("r", 4);
            })
            .on("click", (event) => {
              event.stopPropagation();
              // Calculate screen coordinates dynamically for popup placement
              const transform = d3.zoomTransform(svgRef.current!);
              const screenX = transform.x + transform.k * xy[0];
              const screenY = transform.y + transform.k * xy[1];
              openPopupForCity(cityKey, screenX, screenY);
            });
        }

        // Always display city name
        anchorG.append("text")
          .attr("y", hasEvents ? -10 : 4) // Offset above dot if dot exists
          .text(cityData.name[currentLanguage])
          .attr("text-anchor", "middle")
          .style("font-family", "'Noto Sans SC', sans-serif")
          .style("font-size", "12px")
          .style("fill", "#000000")
          .style("font-weight", hasEvents ? "bold" : "normal")
          .style("pointer-events", "none")
          .style("user-select", "none")
          .style("text-shadow", "1px 1px 0px #FFFFFF, -1px -1px 0px #FFFFFF, 1px -1px 0px #FFFFFF, -1px 1px 0px #FFFFFF");
      });
    }

    // TRANSITION ZOOM/PAN ANIMATION (0.4s, ease-in-out)
    const prevLevel = prevLevelRef.current;
    prevLevelRef.current = currentLevel;
    
    const transition = d3.transition()
      .duration(400)
      .ease(d3.easeCubicInOut);

    if (prevLevel !== currentLevel) {
      let initialTransform = d3.zoomIdentity;
      if (currentLevel > prevLevel) {
        // Zooming in (drill down)
        initialTransform = d3.zoomIdentity
          .translate(width / 2, height / 2)
          .scale(0.9)
          .translate(-width / 2, -height / 2);
      } else {
        // Zooming out (drill up)
        initialTransform = d3.zoomIdentity
          .translate(width / 2, height / 2)
          .scale(1.1)
          .translate(-width / 2, -height / 2);
      }

      g.attr("transform", initialTransform.toString())
        .style("opacity", 0)
        .transition(transition)
        .attr("transform", d3.zoomIdentity.toString())
        .style("opacity", 1);

      labelsG.attr("transform", initialTransform.toString())
        .style("opacity", 0)
        .transition(transition)
        .attr("transform", d3.zoomIdentity.toString())
        .style("opacity", 1);

      anchorsG.attr("transform", initialTransform.toString())
        .style("opacity", 0)
        .transition(transition)
        .attr("transform", d3.zoomIdentity.toString())
        .style("opacity", 1);
    } else {
      // Just fade in on normal updates (e.g. language/timeline changes)
      g.style("opacity", 0).transition(transition).style("opacity", 1);
      labelsG.style("opacity", 0).transition(transition).style("opacity", 1);
      anchorsG.style("opacity", 0).transition(transition).style("opacity", 1);
    }

  }, [
    worldGeoJSON,
    chinaGeoJSON,
    currentLevel,
    activeContinent,
    activeCountry,
    activeProvince,
    activeTimelineYear,
    currentLanguage,
    zoomBehavior
  ]);

  // Zoom control button click handlers
  const handleZoomIn = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!svgRef.current || !zoomBehavior) return;
    d3.select(svgRef.current).transition().duration(300).call(zoomBehavior.scaleBy, 1.3);
  };

  const handleZoomOut = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!svgRef.current || !zoomBehavior) return;
    const svg = d3.select(svgRef.current);
    const currentScale = d3.zoomTransform(svgRef.current).k;

    if (currentLevel > 1 && currentScale <= 1.05) {
      drillUp();
    } else {
      svg.transition().duration(300).call(zoomBehavior.scaleBy, 0.7);
    }
  };

  const handleZoomReset = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!svgRef.current || !zoomBehavior) return;
    d3.select(svgRef.current).transition().duration(300).call(zoomBehavior.transform, d3.zoomIdentity);
  };

  const getCitiesForCurrentLevel4 = (): string[] => {
    if (activeProvince && GEOGRAPHY_DATABASE.provinces[activeProvince]) {
      return GEOGRAPHY_DATABASE.provinces[activeProvince].cities;
    } else if (activeCountry && GEOGRAPHY_DATABASE.countries[activeCountry]) {
      const countryData = GEOGRAPHY_DATABASE.countries[activeCountry];
      const list: string[] = [];
      countryData.provinces.forEach(pKey => {
        const pData = GEOGRAPHY_DATABASE.provinces[pKey];
        if (pData) list.push(...pData.cities);
      });
      return list;
    }
    return [];
  };

  const citiesInProv = getCitiesForCurrentLevel4();

  // Populate events for popup
  const events = popupData ? getCityEvents(popupData.cityKey).sort((a, b) => {
    const nameA = a.name[currentLanguage] || a.name.en || "";
    const nameB = b.name[currentLanguage] || b.name.en || "";
    return nameA.localeCompare(nameB, currentLanguage === "zh" ? "zh-CN" : "en-US");
  }) : [];

  // Calculate position styles for overlay popup
  let popupStyle: React.CSSProperties = {
    position: "absolute",
    zIndex: 100,
    pointerEvents: "auto"
  };

  if (popupData && svgRef.current) {
    const width = svgRef.current.clientWidth || 800;
    const height = svgRef.current.clientHeight || 500;
    const popupWidth = 360;

    let left = popupData.x + 10;
    if (left + popupWidth > width) {
      left = popupData.x - popupWidth - 10;
    }
    if (left < 10) left = 10; // Constrain left boundary

    const popupMaxHeight = 450;
    let top = popupData.y - 50;
    if (top + popupMaxHeight > height) {
      top = height - popupMaxHeight - 10;
    }
    if (top < 10) top = 10;

    popupStyle.left = `${left}px`;
    popupStyle.top = `${top}px`;
  }

  const selectedCityData = popupData ? GEOGRAPHY_DATABASE.cities[popupData.cityKey as keyof typeof GEOGRAPHY_DATABASE.cities] : null;

  return (
    <div id="drilldown-map-viewport" className="drilldown-map-viewport" style={{ backgroundColor: "#FFFFFF", border: "1.5px solid #2C2C2C", borderRadius: "8px", position: "relative" }}>
      <svg ref={svgRef} id="map-svg" width="100%" height="100%" style={{ backgroundColor: "#FFFFFF" }}></svg>

      {/* Level 4 Sidebar Anchors list */}
      {currentLevel === 4 && citiesInProv.length > 0 && (
        <div className="map-anchors-sidebar" style={{ zIndex: 10 }}>
          <div className="sidebar-anchors-title">
            {currentLanguage === "zh" ? "地点档案目录" : "Location Directory"}
          </div>
          <ul className="sidebar-anchors-list">
            {citiesInProv.map(cityKey => {
              const cityData = GEOGRAPHY_DATABASE.cities[cityKey as keyof typeof GEOGRAPHY_DATABASE.cities];
              if (!cityData) return null;
              
              const cityEvents = getCityEvents(cityKey);
              const hasEvents = cityEvents.length > 0;
              const isActive = popupData?.cityKey === cityKey;

              return (
                <li
                  key={cityKey}
                  className={`sidebar-anchor-item ${isActive ? "active" : ""}`}
                  onClick={() => {
                    if (hasEvents) {
                      openPopupForCity(cityKey);
                    }
                  }}
                  style={{
                    cursor: hasEvents ? "pointer" : "default",
                    opacity: hasEvents ? 1 : 0.4,
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    fontWeight: isActive ? "bold" : "normal",
                    backgroundColor: isActive ? "rgba(0,0,0,0.05)" : "transparent",
                    padding: "0.35rem 0.5rem",
                    borderRadius: "4px"
                  }}
                >
                  <span>{cityData.name[currentLanguage]}</span>
                  {hasEvents && <span className="sidebar-anchor-indicator" style={{ width: "6px", height: "6px", backgroundColor: "#000000", borderRadius: "50%" }}></span>}
                </li>
              );
            })}
          </ul>
        </div>
      )}

      {/* Floating Event List Popup overlay */}
      {popupData && selectedCityData && (
        <div className="event-popup-overlay" style={popupStyle}>
          <div className="event-popup-card" style={{ width: "360px", backgroundColor: "#FFFFFF", border: "1px solid #E0E0E0", borderRadius: "8px", boxShadow: "0 8px 30px rgba(0,0,0,0.08)", overflow: "hidden" }}>
            <div className="event-popup-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "0.85rem 1rem", borderBottom: "1px solid #E0E0E0", backgroundColor: "#F9F9F9" }}>
              <span className="event-popup-title" style={{ fontFamily: "var(--font-serif)", fontSize: "0.95rem", fontWeight: "600", color: "#000000" }}>
                📍 {selectedCityData.name[currentLanguage]} · {currentLanguage === "zh" ? (activeTimelineYear < 0 ? `公元前${Math.abs(activeTimelineYear)}年` : activeTimelineYear === 0 ? "公元元年" : `公元${activeTimelineYear}年`) : (activeTimelineYear < 0 ? `${Math.abs(activeTimelineYear)} BCE` : activeTimelineYear === 0 ? "1 CE" : `${activeTimelineYear} CE`)}
              </span>
              <button className="event-popup-close" onClick={() => setPopupData(null)} style={{ background: "none", border: "none", cursor: "pointer", fontSize: "1.25rem", color: "#999", padding: 0 }}>
                &times;
              </button>
            </div>
            
            <div className="event-popup-body" style={{ maxHeight: "350px", overflowY: "auto" }}>
              {events.length === 0 ? (
                <div style={{ padding: "1.5rem", textAlign: "center", color: "#999", fontSize: "0.85rem" }}>
                  {currentLanguage === "zh" ? "该年份暂无事件档案记录" : "No records found for this year"}
                </div>
              ) : (
                events.map((ev, index) => {
                  const isExpanded = expandedEventIndex === index;
                  const name = ev.name[currentLanguage] || ev.name.en;
                  const summary = ev.summary[currentLanguage] || ev.summary.en;
                  const previewText = summary.length > 50 ? summary.substring(0, 50) + "..." : summary;
                  const contributor = typeof ev.contributor === "object" ? ev.contributor[currentLanguage] || ev.contributor.en : ev.contributor;
                  const source = typeof ev.source === "object" ? ev.source[currentLanguage] || ev.source.en : ev.source;

                  return (
                    <div key={index} className="event-item" style={{ borderBottom: index === events.length - 1 ? "none" : "1px solid #F0F0F0", padding: "0.75rem 1rem" }}>
                      <div 
                        className="event-item-name serif-font" 
                        onClick={() => setExpandedEventIndex(isExpanded ? null : index)}
                        style={{ fontSize: "0.9rem", fontWeight: "600", color: "#000000", cursor: "pointer", display: "flex", justifyContent: "space-between", alignItems: "center" }}
                      >
                        <span style={{ flex: 1, paddingRight: "0.5rem" }}>{name}</span>
                        <span className="event-item-arrow" style={{ fontSize: "0.65rem", transition: "transform 0.2s ease", transform: isExpanded ? "rotate(90deg)" : "none", color: "#999" }}>▶</span>
                      </div>
                      
                      {isExpanded ? (
                        <div className="event-item-detail" style={{ paddingTop: "0.5rem", fontSize: "0.8rem", color: "#333", lineHeight: "1.45" }}>
                          <p style={{ margin: "0 0 0.5rem 0" }}>{summary}</p>
                          <div className="event-item-meta" style={{ display: "flex", flexDirection: "column", gap: "0.15rem", borderTop: "1px dashed #E0E0E0", paddingTop: "0.35rem", fontSize: "0.7rem", color: "#666" }}>
                            <div><strong>{currentLanguage === "zh" ? "贡献者" : "Contributor"}:</strong> {contributor}</div>
                            <div><strong>{currentLanguage === "zh" ? "资料来源" : "Source"}:</strong> {source}</div>
                          </div>
                        </div>
                      ) : (
                        <div className="event-item-preview" style={{ paddingTop: "0.25rem", fontSize: "0.75rem", color: "#666", lineHeight: "1.4" }}>
                          {previewText}
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
            
            <div className="event-popup-footer" style={{ padding: "0.6rem 1rem", borderTop: "1px solid #E0E0E0", fontSize: "0.75rem", color: "#666", backgroundColor: "#F9F9F9" }}>
              {currentLanguage === "zh" ? `共 ${events.length} 条记录` : `Total ${events.length} records`}
            </div>
          </div>
        </div>
      )}

      {/* Zoom Controls Overlay */}
      <div
        className="map-zoom-controls"
        style={{
          position: "absolute",
          left: "15px",
          top: "15px",
          display: "flex",
          flexDirection: "column",
          gap: "8px",
          zIndex: 20
        }}
      >
        <button
          id="map-zoom-in"
          className="map-ctrl-btn"
          title="Zoom In"
          onClick={handleZoomIn}
          style={{
            width: "32px",
            height: "32px",
            backgroundColor: "#FFFFFF",
            border: "1.5px solid #2C2C2C",
            color: "#2C2C2C",
            borderRadius: "4px",
            cursor: "pointer",
            fontSize: "1.15rem",
            fontWeight: "bold",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
            transition: "all 0.2s ease"
          }}
        >
          +
        </button>
        <button
          id="map-zoom-out"
          className="map-ctrl-btn"
          title="Zoom Out"
          onClick={handleZoomOut}
          style={{
            width: "32px",
            height: "32px",
            backgroundColor: "#FFFFFF",
            border: "1.5px solid #2C2C2C",
            color: "#2C2C2C",
            borderRadius: "4px",
            cursor: "pointer",
            fontSize: "1.15rem",
            fontWeight: "bold",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
            transition: "all 0.2s ease"
          }}
        >
          −
        </button>
        <button
          id="map-zoom-reset"
          className="map-ctrl-btn"
          title="Reset Zoom"
          onClick={handleZoomReset}
          style={{
            width: "32px",
            height: "32px",
            backgroundColor: "#FFFFFF",
            border: "1.5px solid #2C2C2C",
            color: "#2C2C2C",
            borderRadius: "4px",
            cursor: "pointer",
            fontSize: "0.85rem",
            fontWeight: "bold",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
            transition: "all 0.2s ease"
          }}
        >
          ⟲
        </button>
      </div>
    </div>
  );
};
