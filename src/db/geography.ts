export interface LocalizedString {
  en: string;
  zh: string;
}

export interface ContinentInfo {
  name: LocalizedString;
  center: [number, number];
  countries: string[];
}

export interface CountryInfo {
  name: LocalizedString;
  provinces: string[];
}

export interface ProvinceInfo {
  name: LocalizedString;
  cities: string[];
}

export interface CityInfo {
  name: LocalizedString;
  coords: [number, number];
}

export interface GeographyDatabase {
  continents: Record<string, ContinentInfo>;
  countries: Record<string, CountryInfo>;
  provinces: Record<string, ProvinceInfo>;
  cities: Record<string, CityInfo>;
}

export const GEOGRAPHY_DATABASE: GeographyDatabase = {
  continents: {
    "Asia": {
      name: { en: "Asia", zh: "亚洲" },
      center: [90, 30],
      countries: ["China", "India", "Iraq", "Japan", "Syria", "Turkey", "Israel"]
    },
    "Europe": {
      name: { en: "Europe", zh: "欧洲" },
      center: [20, 50],
      countries: ["Greece", "Italy", "France", "United Kingdom", "Germany", "Spain"]
    },
    "Africa": {
      name: { en: "Africa", zh: "非洲" },
      center: [20, 0],
      countries: ["Egypt", "Tunisia", "Morocco"]
    },
    "North America": {
      name: { en: "North America", zh: "北美洲" },
      center: [-100, 45],
      countries: ["United States", "Canada", "Mexico"]
    },
    "South America": {
      name: { en: "South America", zh: "南美洲" },
      center: [-60, -20],
      countries: ["Brazil", "Argentina", "Peru"]
    },
    "Oceania": {
      name: { en: "Oceania", zh: "大洋洲" },
      center: [135, -25],
      countries: ["Australia", "New Zealand"]
    },
    "Antarctica": {
      name: { en: "Antarctica", zh: "南极洲" },
      center: [0, -80],
      countries: []
    }
  },
  countries: {
    "China": {
      name: { en: "China", zh: "中国" },
      provinces: ["Shaanxi", "Fujian", "Henan", "Hebei", "Taiwan"]
    },
    "Greece": {
      name: { en: "Greece", zh: "希腊" },
      provinces: ["Attica", "Lesbos"]
    },
    "Italy": {
      name: { en: "Italy", zh: "意大利" },
      provinces: ["Lazio", "Tuscany"]
    },
    "Iraq": {
      name: { en: "Iraq", zh: "伊拉克" },
      provinces: ["Baghdad"]
    },
    "Egypt": {
      name: { en: "Egypt", zh: "埃及" },
      provinces: ["Giza"]
    },
    "India": {
      name: { en: "India", zh: "印度" },
      provinces: ["Delhi"]
    },
    "France": {
      name: { en: "France", zh: "法国" },
      provinces: ["Ile-de-France"]
    }
  },
  provinces: {
    "Shaanxi": {
      name: { en: "Shaanxi", zh: "陕西省" },
      cities: ["Xi'an", "Xianyang"]
    },
    "Fujian": {
      name: { en: "Fujian", zh: "福建省" },
      cities: ["Fuzhou", "Xiamen"]
    },
    "Taiwan": {
      name: { en: "Taiwan", zh: "台湾省" },
      cities: ["Taipei"]
    },
    "Attica": {
      name: { en: "Attica", zh: "阿提卡" },
      cities: ["Athens"]
    },
    "Lesbos": {
      name: { en: "Lesbos", zh: "莱斯沃斯" },
      cities: ["Lesbos"]
    },
    "Lazio": {
      name: { en: "Lazio", zh: "拉齐奥" },
      cities: ["Rome"]
    },
    "Tuscany": {
      name: { en: "Tuscany", zh: "托斯卡纳" },
      cities: ["Florence"]
    },
    "Baghdad": {
      name: { en: "Baghdad", zh: "巴格达" },
      cities: ["Baghdad"]
    },
    "Giza": {
      name: { en: "Giza", zh: "吉萨" },
      cities: ["Saqqara"]
    },
    "Delhi": {
      name: { en: "Delhi", zh: "德里" },
      cities: ["Delhi"]
    },
    "Ile-de-France": {
      name: { en: "Ile-de-France", zh: "法兰西岛" },
      cities: ["Paris"]
    }
  },
  cities: {
    "Xi'an": { name: { en: "Xi'an", zh: "西安市" }, coords: [108.9398, 34.3416] },
    "Xianyang": { name: { en: "Xianyang", zh: "咸阳市" }, coords: [108.7051, 34.3334] },
    "Fuzhou": { name: { en: "Fuzhou", zh: "福州市" }, coords: [119.3062, 26.0753] },
    "Xiamen": { name: { en: "Xiamen", zh: "厦门市" }, coords: [118.0894, 24.4798] },
    "Taipei": { name: { en: "Taipei", zh: "台北市" }, coords: [121.5654, 25.0330] },
    "Athens": { name: { en: "Athens", zh: "雅典市" }, coords: [23.7275, 37.9838] },
    "Lesbos": { name: { en: "Lesbos", zh: "莱斯沃斯" }, coords: [26.2716, 39.2089] },
    "Rome": { name: { en: "Rome", zh: "罗马市" }, coords: [12.4964, 41.9028] },
    "Florence": { name: { en: "Florence", zh: "佛罗伦萨" }, coords: [11.2558, 43.7696] },
    "Baghdad": { name: { en: "Baghdad", zh: "巴格达市" }, coords: [44.3661, 33.3152] },
    "Saqqara": { name: { en: "Saqqara", zh: "萨卡拉" }, coords: [31.2197, 29.8713] },
    "Delhi": { name: { en: "Delhi", zh: "德里" }, coords: [77.2090, 28.6139] },
    "Paris": { name: { en: "Paris", zh: "巴黎" }, coords: [2.3522, 48.8566] }
  }
};
