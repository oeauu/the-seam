import type { Language, LocalizedText } from "./types";

function usable(value: string | undefined): value is string {
  return value !== undefined && value.trim().length > 0;
}

export function resolveLocalizedText(
  value: LocalizedText,
  language: Language,
  fallbackLanguage: Language = "en",
): string {
  const candidates: Array<string | undefined> = [
    value[language],
    value[fallbackLanguage],
    value.en,
    value.zh,
    value.original,
  ];

  return candidates.find(usable)?.trim() ?? "";
}

export function getLocalizedText(
  value: LocalizedText,
  language: Language,
): string {
  return resolveLocalizedText(value, language);
}

export function hasLocalizedText(value: LocalizedText, language: Language): boolean {
  return resolveLocalizedText(value, language).length > 0;
}
