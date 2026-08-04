import type { Language, LocalizedText } from "../types";

export interface TaxonomyOption {
  id: string;
  label: LocalizedText;
  description?: LocalizedText;
  parentId?: string;
}

export const SOURCE_OPTIONS: TaxonomyOption[] = [
  { id: "textual", label: { zh: "文本材料", en: "Textual sources" } },
  { id: "institutional", label: { zh: "制度与历史档案", en: "Institutional records" } },
  { id: "cultural-memory", label: { zh: "文化记忆", en: "Cultural memory" } },
  { id: "modern-research", label: { zh: "现代研究", en: "Modern research" } },
  { id: "modern-reinterpretation", label: { zh: "现代再阐释", en: "Modern reinterpretation" } },
];

export const MEANING_OPTIONS: TaxonomyOption[] = [
  { id: "transgression", label: { zh: "越界", en: "Transgression" } },
  { id: "transformation", label: { zh: "变形", en: "Transformation" } },
  { id: "sacredness", label: { zh: "神圣化", en: "Sacredness" } },
  { id: "stigma", label: { zh: "污名化", en: "Stigma" } },
  { id: "guardianship", label: { zh: "守护", en: "Guardianship" } },
  { id: "concealment", label: { zh: "隐匿", en: "Concealment" } },
  { id: "reclamation", label: { zh: "召回", en: "Reclamation" } },
  { id: "performance", label: { zh: "表演", en: "Performance" } },
  { id: "power-intimacy", label: { zh: "权力亲密", en: "Power and intimacy" } },
  { id: "non-institutional-intimacy", label: { zh: "非制度性亲密", en: "Non-institutional intimacy" } },
  { id: "local-memory", label: { zh: "地方记忆", en: "Local memory" } },
  { id: "legal-regulation", label: { zh: "法律规训", en: "Legal regulation" } },
  { id: "medical-naming", label: { zh: "医学命名", en: "Medical naming" } },
  { id: "colonial-naming", label: { zh: "殖民命名", en: "Colonial naming" } },
  { id: "modern-reactivation", label: { zh: "现代再激活", en: "Modern reactivation" } },
  { id: "literary-symbolization", label: { zh: "文学象征", en: "Literary symbolization" } },
  { id: "mythologization", label: { zh: "神话化", en: "Mythologization" } },
  { id: "mourning", label: { zh: "哀悼", en: "Mourning" } },
  { id: "exile", label: { zh: "流亡", en: "Exile" } },
  { id: "ambiguity", label: { zh: "歧义", en: "Ambiguity" } },
];

export const OBJECT_TYPE_OPTIONS: TaxonomyOption[] = [
  { id: "historical-person", label: { zh: "历史人物", en: "Historical person" } },
  { id: "historical-allusion", label: { zh: "历史典故", en: "Historical allusion" } },
  { id: "event", label: { zh: "事件", en: "Event" } },
  { id: "mythological-figure", label: { zh: "神话人物", en: "Mythological figure" } },
  { id: "religious-figure", label: { zh: "宗教人物", en: "Religious figure" } },
  { id: "literary-character", label: { zh: "文学角色", en: "Literary character" } },
  { id: "performance-figure", label: { zh: "表演形象", en: "Performance figure" } },
  { id: "folklore-figure", label: { zh: "民间传说人物", en: "Folklore figure" } },
  { id: "social-role", label: { zh: "社会角色", en: "Social role" } },
  { id: "local-term", label: { zh: "地方称谓", en: "Local term" } },
  { id: "visual-artwork", label: { zh: "视觉作品", en: "Visual artwork" } },
  { id: "legal-object", label: { zh: "法律对象", en: "Legal object" } },
  { id: "medical-object", label: { zh: "医学对象", en: "Medical object" } },
  { id: "place", label: { zh: "地点", en: "Place" } },
  { id: "organization", label: { zh: "组织", en: "Organization" } },
  { id: "modern-reinterpretation", label: { zh: "现代再阐释", en: "Modern reinterpretation" } },
];

const SOURCE_ALIASES: Record<string, string> = {
  "historical documents": "institutional",
  "textual sources": "textual",
  "cultural memory": "cultural-memory",
  "modern research": "modern-research",
  "modern reinterpretation": "modern-reinterpretation",
};

const MEANING_ALIASES: Record<string, string> = {
  sacred: "sacredness",
  taboo: "stigma",
  guardian: "guardianship",
  "local memory": "local-memory",
  "modern re-activation": "modern-reactivation",
  favoritism: "power-intimacy",
  "power intimacy": "power-intimacy",
  "poetic desire": "literary-symbolization",
  "female intimacy": "non-institutional-intimacy",
  reclaiming: "reclamation",
  "performative disguise": "performance",
  "border body": "transformation",
  "artistic image": "visual-artwork",
};

const OBJECT_ALIASES: Record<string, string> = {
  "historical figures": "historical-person",
  "historical figure": "historical-person",
  "historical allusion": "historical-allusion",
  deity: "religious-figure",
  "mythological figure": "mythological-figure",
  "modern reinterpretation": "modern-reinterpretation",
  poet: "literary-character",
  "literary character": "literary-character",
  "theatrical image": "performance-figure",
  "social identity": "social-role",
};

export function taxonomyId(value: string): string {
  return value.trim().toLowerCase().replace(/[–—]/g, "-").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

export function sourceTypeId(value: string): string {
  const key = value.trim().toLowerCase();
  return SOURCE_ALIASES[key] ?? taxonomyId(value);
}

export function meaningId(value: string): string {
  const key = value.trim().toLowerCase();
  return MEANING_ALIASES[key] ?? taxonomyId(value);
}

export function objectTypeId(value: string): string {
  const key = value.trim().toLowerCase();
  return OBJECT_ALIASES[key] ?? taxonomyId(value);
}

function allOptions(): TaxonomyOption[] {
  return [...SOURCE_OPTIONS, ...MEANING_OPTIONS, ...OBJECT_TYPE_OPTIONS];
}

export function taxonomyLabel(id: string, language: Language): string {
  const option = allOptions().find(item => item.id === id);
  if (option) return option.label[language];
  return id.replace(/-/g, " ").replace(/\b\w/g, character => character.toUpperCase());
}
