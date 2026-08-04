import type { Language } from "../types";
import { MEANING_OPTIONS, SOURCE_OPTIONS, taxonomyLabel } from "../data/taxonomy";

interface AtlasFiltersProps {
  language: Language;
  selectedSourceIds: string[];
  selectedMeaningIds: string[];
  onToggleSource: (id: string) => void;
  onToggleMeaning: (id: string) => void;
}

export function AtlasFilters({ language, selectedSourceIds, selectedMeaningIds, onToggleSource, onToggleMeaning }: AtlasFiltersProps) {
  return (
    <div className="atlas-filter-bar" aria-label={language === "zh" ? "馆藏筛选" : "Collection filters"}>
      <fieldset>
        <legend>{language === "zh" ? "来源" : "Source"}</legend>
        <div className="atlas-filter-options">
          {SOURCE_OPTIONS.map(option => (
            <button
              key={option.id}
              type="button"
              className={selectedSourceIds.includes(option.id) ? "is-active" : ""}
              aria-pressed={selectedSourceIds.includes(option.id)}
              onClick={() => onToggleSource(option.id)}
            >
              {option.label[language]}
            </button>
          ))}
        </div>
      </fieldset>
      <fieldset>
        <legend>{language === "zh" ? "文化意义" : "Cultural meaning"}</legend>
        <div className="atlas-filter-options">
          {MEANING_OPTIONS.slice(0, 10).map(option => (
            <button
              key={option.id}
              type="button"
              className={selectedMeaningIds.includes(option.id) ? "is-active" : ""}
              aria-pressed={selectedMeaningIds.includes(option.id)}
              onClick={() => onToggleMeaning(option.id)}
              title={taxonomyLabel(option.id, language)}
            >
              {option.label[language]}
            </button>
          ))}
        </div>
      </fieldset>
    </div>
  );
}
