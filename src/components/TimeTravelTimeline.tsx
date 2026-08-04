import React, { useEffect, useState } from "react";
import { UI_TRANSLATIONS } from "../db/translations";

interface TimeTravelTimelineProps {
  activeTimelineYear: number;
  setActiveTimelineYear: React.Dispatch<React.SetStateAction<number>>;
  currentLanguage: "en" | "zh";
}

const TIMELINE_TICKS = [-5000, -4000, -3000, -2000, -1000, 0, 1000, 1500, 2000, 2026];

export const TimeTravelTimeline: React.FC<TimeTravelTimelineProps> = ({
  activeTimelineYear,
  setActiveTimelineYear,
  currentLanguage
}) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [sliderVal, setSliderVal] = useState(activeTimelineYear);

  // Sync local sliderVal when activeTimelineYear changes from outside (e.g. autoplay, tick click)
  useEffect(() => {
    setSliderVal(activeTimelineYear);
  }, [activeTimelineYear]);

  // Snaps logic and timeline autoplay
  useEffect(() => {
    let intervalId: any = null;
    if (isPlaying) {
      intervalId = setInterval(() => {
        setActiveTimelineYear((prevYear) => {
          const currentIndex = TIMELINE_TICKS.indexOf(prevYear);
          if (currentIndex === -1 || currentIndex === TIMELINE_TICKS.length - 1) {
            return TIMELINE_TICKS[0]; // loop back to start
          }
          return TIMELINE_TICKS[currentIndex + 1];
        });
      }, 1500);
    }
    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [isPlaying, setActiveTimelineYear]);

  // Update slider position locally on drag
  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseInt(e.target.value, 10);
    setSliderVal(val);
  };

  // Only commit the snapped year on release
  const handleSliderRelease = () => {
    const closest = TIMELINE_TICKS.reduce((prev, curr) => {
      return Math.abs(curr - sliderVal) < Math.abs(prev - sliderVal) ? curr : prev;
    });
    setSliderVal(closest);
    setActiveTimelineYear(closest);
  };

  const getYearDisplay = (year: number) => {
    if (year < 0) {
      return currentLanguage === "zh"
        ? `公元前${Math.abs(year)}年`
        : `${Math.abs(year)} BCE`;
    } else if (year === 0) {
      return currentLanguage === "zh" ? "公元元年" : "1 CE / Year 0";
    } else {
      return currentLanguage === "zh" ? `公元${year}年` : `${year} CE`;
    }
  };

  // Find the closest tick to show the label correctly during dragging
  const displayedYear = TIMELINE_TICKS.reduce((prev, curr) => {
    return Math.abs(curr - sliderVal) < Math.abs(prev - sliderVal) ? curr : prev;
  });

  return (
    <section className="timeline-overlay" aria-label="Temporal Filter">
      <div className="timeline-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div className="timeline-title-row" style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10" />
            <polyline points="12 6 12 12 16 14" />
          </svg>
          <span id="timeline-label-text">
            {UI_TRANSLATIONS.historicalEpoch[currentLanguage]}
          </span>
        </div>

        {/* Autoplay / Controls */}
        <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
          <button
            type="button"
            className="timeline-control-btn"
            onClick={() => setIsPlaying(!isPlaying)}
            style={{
              padding: "0.2rem 0.6rem",
              fontSize: "0.75rem",
              borderRadius: "4px",
              border: "1.5px solid #2C2C2C",
              backgroundColor: isPlaying ? "#555555" : "#000000",
              color: "white",
              cursor: "pointer"
            }}
          >
            {isPlaying
              ? UI_TRANSLATIONS.travelPause[currentLanguage]
              : UI_TRANSLATIONS.travelPlay[currentLanguage]}
          </button>
          <button
            type="button"
            className="timeline-control-btn"
            onClick={() => {
              setIsPlaying(false);
              setActiveTimelineYear(2026);
            }}
            style={{
              padding: "0.2rem 0.6rem",
              fontSize: "0.75rem",
              borderRadius: "4px",
              border: "1.5px solid #2C2C2C",
              backgroundColor: "white",
              color: "#000000",
              cursor: "pointer"
            }}
          >
            {UI_TRANSLATIONS.travelReset[currentLanguage]}
          </button>
        </div>

        <div className="timeline-range-display" id="timeline-range-display">
          <span id="timeline-single-val">{getYearDisplay(displayedYear)}</span>
        </div>
      </div>

      {/* Single Year Slider */}
      <div className="timeline-slider-container">
        <div className="timeline-track-single"></div>

        <input
          type="range"
          className="range-slider-single"
          id="timeline-slider"
          min="-5000"
          max="2026"
          value={sliderVal}
          onChange={handleSliderChange}
          onMouseUp={handleSliderRelease}
          onTouchEnd={handleSliderRelease}
          step="1"
          aria-label="Selected year"
        />

        {/* Clickable Custom Tick marks */}
        <div className="timeline-tick-marks">
          {TIMELINE_TICKS.map((tick) => (
            <span
              key={tick}
              onClick={() => {
                setIsPlaying(false);
                setActiveTimelineYear(tick);
              }}
              style={{
                fontWeight: activeTimelineYear === tick ? "bold" : "normal",
                color: activeTimelineYear === tick ? "#000000" : "#999999"
              }}
            >
              {tick === 0 && currentLanguage === "zh" ? "公元元年" : tick}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
};
