import type { LocalizedString } from "../types";

export interface CityMetadata {
  name: LocalizedString;
  coordinates: [number, number];
  isCapital?: boolean;
}

export interface CountryMetadata {
  id: string; // ISO 3166-1 numeric
  codeAlpha3?: string;
  name: LocalizedString;
  capital?: CityMetadata;
  center: [number, number]; // [lon, lat]
  cities: CityMetadata[];
}

export const COUNTRIES_META: Record<string, CountryMetadata> = {
  // China
  "156": {
    id: "156",
    codeAlpha3: "CHN",
    name: { en: "China", zh: "中国" },
    center: [104.1954, 35.8617],
    capital: {
      name: { en: "Beijing", zh: "北京市" },
      coordinates: [116.4074, 39.9042],
      isCapital: true
    },
    cities: [
      { name: { en: "Beijing", zh: "北京市" }, coordinates: [116.4074, 39.9042], isCapital: true },
      { name: { en: "Xi'an", zh: "西安市" }, coordinates: [108.9398, 34.3416] },
      { name: { en: "Luoyang", zh: "洛阳市" }, coordinates: [112.4540, 34.6197] },
      { name: { en: "Handan", zh: "邯郸市" }, coordinates: [114.5391, 36.6256] },
      { name: { en: "Taiyuan", zh: "太原市" }, coordinates: [112.5492, 37.8570] },
      { name: { en: "Nanjing", zh: "南京市" }, coordinates: [118.7969, 32.0603] },
      { name: { en: "Hangzhou", zh: "杭州市" }, coordinates: [120.1551, 30.2741] },
      { name: { en: "Zibo", zh: "淄博市" }, coordinates: [118.0548, 36.8131] },
      { name: { en: "Puyang", zh: "濮阳市" }, coordinates: [115.0293, 35.7622] },
      { name: { en: "Linli (Anfu)", zh: "临澧县（清安福）" }, coordinates: [111.6512, 29.4416] },
      { name: { en: "Fuzhou", zh: "福州市" }, coordinates: [119.3062, 26.0753] },
      { name: { en: "Taipei", zh: "台北市" }, coordinates: [121.5654, 25.0330] },
      { name: { en: "Guangzhou", zh: "广州市" }, coordinates: [113.2644, 23.1291] },
      { name: { en: "Chengdu", zh: "成都市" }, coordinates: [104.0668, 30.5728] }
    ]
  },
  // United States
  "840": {
    id: "840",
    codeAlpha3: "USA",
    name: { en: "United States", zh: "美国" },
    center: [-98.5795, 39.8283],
    capital: {
      name: { en: "Washington, D.C.", zh: "华盛顿特区" },
      coordinates: [-77.0369, 38.9072],
      isCapital: true
    },
    cities: [
      { name: { en: "Washington, D.C.", zh: "华盛顿特区" }, coordinates: [-77.0369, 38.9072], isCapital: true },
      { name: { en: "New York", zh: "纽约" }, coordinates: [-74.0060, 40.7128] },
      { name: { en: "Jamestown", zh: "詹姆斯敦" }, coordinates: [-76.7797, 37.2104] },
      { name: { en: "Richmond", zh: "里士满" }, coordinates: [-77.4360, 37.5407] },
      { name: { en: "Boston", zh: "波士顿" }, coordinates: [-71.0589, 42.3601] },
      { name: { en: "Chicago", zh: "芝加哥" }, coordinates: [-87.6298, 41.8781] },
      { name: { en: "San Francisco", zh: "旧金山" }, coordinates: [-122.4194, 37.7749] },
      { name: { en: "Los Angeles", zh: "洛杉矶" }, coordinates: [-118.2437, 34.0522] }
    ]
  },
  // Greece
  "300": {
    id: "300",
    codeAlpha3: "GRC",
    name: { en: "Greece", zh: "希腊" },
    center: [21.8243, 39.0742],
    capital: {
      name: { en: "Athens", zh: "雅典" },
      coordinates: [23.7275, 37.9838],
      isCapital: true
    },
    cities: [
      { name: { en: "Athens", zh: "雅典" }, coordinates: [23.7275, 37.9838], isCapital: true },
      { name: { en: "Corinth", zh: "科林斯" }, coordinates: [22.9322, 37.9386] },
      { name: { en: "Mytilene (Lesbos)", zh: "米蒂利尼（莱斯沃斯）" }, coordinates: [26.5547, 39.1044] },
      { name: { en: "Thessaloniki", zh: "塞萨洛尼基" }, coordinates: [22.9444, 40.6401] },
      { name: { en: "Heraklion", zh: "伊拉克利翁" }, coordinates: [25.1442, 35.3387] }
    ]
  },
  // Egypt
  "818": {
    id: "818",
    codeAlpha3: "EGY",
    name: { en: "Egypt", zh: "埃及" },
    center: [30.8025, 26.8206],
    capital: {
      name: { en: "Cairo", zh: "开罗" },
      coordinates: [31.2357, 30.0444],
      isCapital: true
    },
    cities: [
      { name: { en: "Cairo", zh: "开罗" }, coordinates: [31.2357, 30.0444], isCapital: true },
      { name: { en: "Hawara", zh: "哈瓦拉" }, coordinates: [30.8989, 29.2742] },
      { name: { en: "Saqqara", zh: "萨卡拉" }, coordinates: [31.2197, 29.8713] },
      { name: { en: "Alexandria", zh: "亚历山大" }, coordinates: [29.9187, 31.2001] },
      { name: { en: "Luxor", zh: "卢克索" }, coordinates: [32.6396, 25.6872] }
    ]
  },
  // France
  "250": {
    id: "250",
    codeAlpha3: "FRA",
    name: { en: "France", zh: "法国" },
    center: [2.2137, 46.2276],
    capital: {
      name: { en: "Paris", zh: "巴黎" },
      coordinates: [2.3522, 48.8566],
      isCapital: true
    },
    cities: [
      { name: { en: "Paris", zh: "巴黎" }, coordinates: [2.3522, 48.8566], isCapital: true },
      { name: { en: "Versailles", zh: "凡尔赛" }, coordinates: [2.1301, 48.8014] },
      { name: { en: "Tonnerre", zh: "托内尔" }, coordinates: [3.9744, 47.8561] },
      { name: { en: "Lyon", zh: "里昂" }, coordinates: [4.8357, 45.7640] },
      { name: { en: "Marseille", zh: "马赛" }, coordinates: [5.3698, 43.2965] }
    ]
  },
  // Turkey
  "792": {
    id: "792",
    codeAlpha3: "TUR",
    name: { en: "Turkey", zh: "土耳其" },
    center: [35.2433, 38.9637],
    capital: {
      name: { en: "Ankara", zh: "安卡拉" },
      coordinates: [32.8597, 39.9334],
      isCapital: true
    },
    cities: [
      { name: { en: "Ankara", zh: "安卡拉" }, coordinates: [32.8597, 39.9334], isCapital: true },
      { name: { en: "Istanbul", zh: "伊斯坦布尔" }, coordinates: [28.9550, 41.0150] },
      { name: { en: "Bodrum (Halicarnassus)", zh: "博德鲁姆（哈利卡纳苏斯）" }, coordinates: [27.4287, 37.0344] },
      { name: { en: "Pessinus (Sivrihisar)", zh: "佩辛努斯遗址" }, coordinates: [31.5833, 39.3833] },
      { name: { en: "Izmir", zh: "伊兹密尔" }, coordinates: [27.1428, 38.4237] }
    ]
  },
  // India
  "356": {
    id: "356",
    codeAlpha3: "IND",
    name: { en: "India", zh: "印度" },
    center: [78.9629, 20.5937],
    capital: {
      name: { en: "New Delhi", zh: "新德里" },
      coordinates: [77.2090, 28.6139],
      isCapital: true
    },
    cities: [
      { name: { en: "New Delhi", zh: "新德里" }, coordinates: [77.2090, 28.6139], isCapital: true },
      { name: { en: "Mumbai", zh: "孟买" }, coordinates: [72.8777, 19.0760] },
      { name: { en: "Varanasi", zh: "瓦拉纳西" }, coordinates: [82.9739, 25.3176] },
      { name: { en: "Kolkata", zh: "加尔各答" }, coordinates: [88.3639, 22.5726] }
    ]
  },
  // Iraq
  "368": {
    id: "368",
    codeAlpha3: "IRQ",
    name: { en: "Iraq", zh: "伊拉克" },
    center: [43.6793, 33.2232],
    capital: {
      name: { en: "Baghdad", zh: "巴格达" },
      coordinates: [44.3661, 33.3152],
      isCapital: true
    },
    cities: [
      { name: { en: "Baghdad", zh: "巴格达" }, coordinates: [44.3661, 33.3152], isCapital: true },
      { name: { en: "Basra", zh: "巴士拉" }, coordinates: [47.7835, 30.5081] },
      { name: { en: "Erbil", zh: "埃尔比勒" }, coordinates: [44.0092, 36.1901] },
      { name: { en: "Babylon (Hillah)", zh: "巴比伦遗址" }, coordinates: [44.4225, 32.4883] }
    ]
  },
  // Israel
  "376": {
    id: "376",
    codeAlpha3: "ISR",
    name: { en: "Israel", zh: "以色列" },
    center: [34.8516, 31.0461],
    cities: [
      { name: { en: "Tel Aviv", zh: "特拉维夫" }, coordinates: [34.7818, 32.0853] },
      { name: { en: "Jerusalem", zh: "耶路撒冷" }, coordinates: [35.2137, 31.7683] },
      { name: { en: "Haifa", zh: "海法" }, coordinates: [34.9896, 32.7940] }
    ]
  },
  // Italy
  "380": {
    id: "380",
    codeAlpha3: "ITA",
    name: { en: "Italy", zh: "意大利" },
    center: [12.5674, 41.8719],
    capital: {
      name: { en: "Rome", zh: "罗马" },
      coordinates: [12.4964, 41.9028],
      isCapital: true
    },
    cities: [
      { name: { en: "Rome", zh: "罗马" }, coordinates: [12.4964, 41.9028], isCapital: true },
      { name: { en: "Florence", zh: "佛罗伦萨" }, coordinates: [11.2558, 43.7696] },
      { name: { en: "Venice", zh: "威尼斯" }, coordinates: [12.3155, 45.4408] },
      { name: { en: "Naples", zh: "那不勒斯" }, coordinates: [14.2681, 40.8518] }
    ]
  },
  // United Kingdom
  "826": {
    id: "826",
    codeAlpha3: "GBR",
    name: { en: "United Kingdom", zh: "英国" },
    center: [-3.4360, 55.3781],
    capital: {
      name: { en: "London", zh: "伦敦" },
      coordinates: [-0.1278, 51.5074],
      isCapital: true
    },
    cities: [
      { name: { en: "London", zh: "伦敦" }, coordinates: [-0.1278, 51.5074], isCapital: true },
      { name: { en: "Newcastle upon Tyne", zh: "纽卡斯尔" }, coordinates: [-1.6178, 54.9783] },
      { name: { en: "Oxford", zh: "牛津" }, coordinates: [-1.2577, 51.7520] },
      { name: { en: "Edinburgh", zh: "爱丁堡" }, coordinates: [-3.1883, 55.9533] }
    ]
  },
  // Germany
  "276": {
    id: "276",
    codeAlpha3: "DEU",
    name: { en: "Germany", zh: "德国" },
    center: [10.4515, 51.1657],
    capital: {
      name: { en: "Berlin", zh: "柏林" },
      coordinates: [13.4050, 52.5200],
      isCapital: true
    },
    cities: [
      { name: { en: "Berlin", zh: "柏林" }, coordinates: [13.4050, 52.5200], isCapital: true },
      { name: { en: "Munich", zh: "慕尼黑" }, coordinates: [11.5820, 48.1351] }
    ]
  },
  // Japan
  "392": {
    id: "392",
    codeAlpha3: "JPN",
    name: { en: "Japan", zh: "日本" },
    center: [138.2529, 36.2048],
    capital: {
      name: { en: "Tokyo", zh: "东京" },
      coordinates: [139.6917, 35.6895],
      isCapital: true
    },
    cities: [
      { name: { en: "Tokyo", zh: "东京" }, coordinates: [139.6917, 35.6895], isCapital: true },
      { name: { en: "Osaka", zh: "大阪" }, coordinates: [135.5023, 34.6937] },
      { name: { en: "Kamakura", zh: "镰仓" }, coordinates: [139.5467, 35.3192] },
      { name: { en: "Kyoto", zh: "京都" }, coordinates: [135.7681, 35.0116] },
      { name: { en: "Nara", zh: "奈良" }, coordinates: [135.8048, 34.6851] }
    ]
  },
  // South Korea
  "410": {
    id: "410",
    codeAlpha3: "KOR",
    name: { en: "South Korea", zh: "韩国" },
    center: [127.7669, 35.9078],
    capital: {
      name: { en: "Seoul", zh: "首尔" },
      coordinates: [126.9780, 37.5665],
      isCapital: true
    },
    cities: [
      { name: { en: "Seoul", zh: "首尔" }, coordinates: [126.9780, 37.5665], isCapital: true },
      { name: { en: "Wonju", zh: "原州" }, coordinates: [127.9202, 37.3422] },
      { name: { en: "Busan", zh: "釜山" }, coordinates: [129.0756, 35.1796] }
    ]
  },
  // Spain
  "724": {
    id: "724",
    codeAlpha3: "ESP",
    name: { en: "Spain", zh: "西班牙" },
    center: [-3.7492, 40.4637],
    capital: {
      name: { en: "Madrid", zh: "马德里" },
      coordinates: [-3.7038, 40.4168],
      isCapital: true
    },
    cities: [
      { name: { en: "Madrid", zh: "马德里" }, coordinates: [-3.7038, 40.4168], isCapital: true },
      { name: { en: "Toledo", zh: "托莱多" }, coordinates: [-4.0273, 39.8628] },
      { name: { en: "Córdoba", zh: "科尔多瓦" }, coordinates: [-4.7794, 37.8882] }
    ]
  },
  // Cambodia
  "116": {
    id: "116",
    codeAlpha3: "KHM",
    name: { en: "Cambodia", zh: "柬埔寨" },
    center: [104.9910, 12.5657],
    capital: {
      name: { en: "Phnom Penh", zh: "金边" },
      coordinates: [104.9282, 11.5564],
      isCapital: true
    },
    cities: [
      { name: { en: "Phnom Penh", zh: "金边" }, coordinates: [104.9282, 11.5564], isCapital: true },
      { name: { en: "Siem Reap (Angkor)", zh: "暹粒（吴哥）" }, coordinates: [103.8670, 13.4125] }
    ]
  },
  // Indonesia
  "360": {
    id: "360",
    codeAlpha3: "IDN",
    name: { en: "Indonesia", zh: "印度尼西亚" },
    center: [113.9213, -0.7893],
    capital: {
      name: { en: "Jakarta", zh: "雅加达" },
      coordinates: [106.8456, -6.2088],
      isCapital: true
    },
    cities: [
      { name: { en: "Jakarta", zh: "雅加达" }, coordinates: [106.8456, -6.2088], isCapital: true },
      { name: { en: "Ponorogo", zh: "波诺罗戈" }, coordinates: [111.4667, -7.8667] },
      { name: { en: "Sengkang (South Sulawesi)", zh: "森康（南苏拉威西）" }, coordinates: [120.0320, -4.1260] }
    ]
  },
  // Philippines
  "608": {
    id: "608",
    codeAlpha3: "PHL",
    name: { en: "Philippines", zh: "菲律宾" },
    center: [121.7740, 12.8797],
    capital: {
      name: { en: "Manila", zh: "马尼拉" },
      coordinates: [120.9842, 14.5995],
      isCapital: true
    },
    cities: [
      { name: { en: "Manila", zh: "马尼拉" }, coordinates: [120.9842, 14.5995], isCapital: true },
      { name: { en: "Cebu", zh: "宿务" }, coordinates: [123.8854, 10.3157] }
    ]
  },
  // Thailand
  "764": {
    id: "764",
    codeAlpha3: "THA",
    name: { en: "Thailand", zh: "泰国" },
    center: [100.9925, 15.8700],
    capital: {
      name: { en: "Bangkok", zh: "曼谷" },
      coordinates: [100.5018, 13.7563],
      isCapital: true
    },
    cities: [
      { name: { en: "Bangkok", zh: "曼谷" }, coordinates: [100.5018, 13.7563], isCapital: true },
      { name: { en: "Chiang Mai", zh: "清迈" }, coordinates: [98.9853, 18.7883] }
    ]
  },
  // Singapore
  "702": {
    id: "702",
    codeAlpha3: "SGP",
    name: { en: "Singapore", zh: "新加坡" },
    center: [103.8198, 1.3521],
    capital: {
      name: { en: "Singapore", zh: "新加坡" },
      coordinates: [103.8198, 1.3521],
      isCapital: true
    },
    cities: [
      { name: { en: "Singapore", zh: "新加坡" }, coordinates: [103.8198, 1.3521], isCapital: true }
    ]
  },
  // Myanmar
  "104": {
    id: "104",
    codeAlpha3: "MMR",
    name: { en: "Myanmar", zh: "缅甸" },
    center: [95.9560, 21.9162],
    capital: {
      name: { en: "Naypyidaw", zh: "内比都" },
      coordinates: [96.0785, 19.7633],
      isCapital: true
    },
    cities: [
      { name: { en: "Naypyidaw", zh: "内比都" }, coordinates: [96.0785, 19.7633], isCapital: true },
      { name: { en: "Mandalay", zh: "曼德勒" }, coordinates: [96.0891, 21.9588] },
      { name: { en: "Yangon", zh: "仰光" }, coordinates: [96.1561, 16.8661] }
    ]
  }
};

export function getCountryMetaById(id: string): CountryMetadata | undefined {
  return COUNTRIES_META[id];
}

export function getCountryMetaByName(nameEnOrZh: string): CountryMetadata | undefined {
  const norm = nameEnOrZh.trim().toLowerCase();
  return Object.values(COUNTRIES_META).find(
    c => c.name.en.toLowerCase() === norm || c.name.zh === nameEnOrZh
  );
}
