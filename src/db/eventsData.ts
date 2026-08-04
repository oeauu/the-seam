export interface LocalizedString {
  en: string;
  zh: string;
}

export interface HistoricalEvent {
  name: LocalizedString;
  summary: LocalizedString;
  contributor: LocalizedString;
  source: LocalizedString;
}

export interface MapEventGroup {
  location: LocalizedString;
  year: number;
  yearDisplay: LocalizedString;
  events: HistoricalEvent[];
}

export const EVENTS_DATA: MapEventGroup[] = [
  {
    location: { en: "Xi'an", zh: "西安市" },
    year: -206,
    yearDisplay: { en: "206 BCE", zh: "公元前206年" },
    events: [
      {
        name: { en: "Emperor Gaozu Establishes Capital at Chang'an", zh: "汉高祖定都长安" },
        summary: { en: "After defeating Xiang Yu, Liu Bang established the capital at Chang'an, initiating the Western Han Dynasty.", zh: "刘邦击败项羽后，定都长安，开启西汉王朝。" },
        contributor: { en: "Museum Curation", zh: "本馆编撰" },
        source: { en: "Records of the Grand Historian: Annals of Emperor Gaozu", zh: "《史记·高祖本纪》" }
      },
      {
        name: { en: "Construction of Changle Palace", zh: "修建长乐宫" },
        summary: { en: "Emperor Gaozu ordered Xiao He to supervise the construction of Changle Palace in Chang'an, the first imperial palace of Western Han.", zh: "高祖命萧何在长安主持修建长乐宫，为西汉首座皇宫。" },
        contributor: { en: "User 'History Lover'", zh: "用户「历史爱好者」投稿" },
        source: { en: "Book of Han: Annals of Emperor Gaozu", zh: "《汉书·高帝纪》" }
      },
      {
        name: { en: "Establishment of Chang'an County", zh: "设立长安县" },
        summary: { en: "Chang'an County was established in the Guanzhong region, administered under the Neishi jurisdiction.", zh: "在关中地区设立长安县，隶属内史管辖。" },
        contributor: { en: "Museum Curation", zh: "本馆编撰" },
        source: { en: "Book of Han: Geographic Treatise", zh: "《汉书·地理志》" }
      }
    ]
  },
  {
    location: { en: "Saqqara", zh: "萨卡拉" },
    year: -5000,
    yearDisplay: { en: "5000 BCE", zh: "公元前5000年" },
    events: [
      {
        name: { en: "Prehistoric Rock Art & Gender Fluidity", zh: "史前石刻与身体象征" },
        summary: { en: "Prehistoric rock art discovered in the Saqqara region depicts figures with dual gender characteristics, suggesting early spiritual representations of gender fluidity.", zh: "萨卡拉周边墓葬群出土史前石刻壁画，描绘了性别模糊的双性特征崇拜雕像。" },
        contributor: { en: "Museum Curation", zh: "本馆编撰" },
        source: { en: "Egyptian Antiquities Department Reports", zh: "埃及古物局报告" }
      }
    ]
  },
  {
    location: { en: "Xi'an", zh: "西安市" },
    year: -4000,
    yearDisplay: { en: "4000 BCE", zh: "公元前4000年" },
    events: [
      {
        name: { en: "Yangshao Culture Androgynous Pottery", zh: "仰韶文化双性陶器" },
        summary: { en: "Androgynous pottery fragments unearthed at the Banpo Neolithic site feature decorative patterns representing dual-sex figures or non-differentiated body symbols.", zh: "半坡遗址出土仰韶文化陶器，器表纹饰呈现双性同体或无性别分化的图腾符号。" },
        contributor: { en: "Museum Curation", zh: "本馆编撰" },
        source: { en: "Banpo Archaeological Excavation Archives", zh: "半坡遗址考古发掘记录" }
      }
    ]
  },
  {
    location: { en: "Athens", zh: "雅典市" },
    year: -3000,
    yearDisplay: { en: "3000 BCE", zh: "公元前3000年" },
    events: [
      {
        name: { en: "Cycladic Abstract Marble Figures", zh: "基克拉泽斯抽象石雕" },
        summary: { en: "Early Cycladic abstract marble figurines, mostly gender-neutral with arms folded over chests, demonstrate prehistoric body aesthetics bypassing binary definitions.", zh: "基克拉泽斯群岛出土大量性别中性、双臂抱胸的扁平大理石偶像雕像，体现史前艺术对身体的抽象理解。" },
        contributor: { en: "Museum Curation", zh: "本馆编撰" },
        source: { en: "National Archaeological Museum Collections", zh: "雅典国家考古博物馆馆藏" }
      }
    ]
  },
  {
    location: { en: "Saqqara", zh: "萨卡拉" },
    year: -2000,
    yearDisplay: { en: "2000 BCE", zh: "公元前2000年" },
    events: [
      {
        name: { en: "Tomb of Niankhkhnum and Khnumhotep", zh: "尼安克赫努姆与赫努姆霍特普合葬墓" },
        summary: { en: "The shared tomb of two royal manicurists was completed. Murals depict them embracing nose-to-nose, representing the earliest recorded same-sex intimacy in Ancient Egypt.", zh: "两位皇家美发师合葬墓建成，其壁画中二人紧密贴鼻拥抱，为已知最早描绘同性亲密关系的古埃及文献。" },
        contributor: { en: "Museum Curation", zh: "本馆编撰" },
        source: { en: "Archaeological Report of Saqqara Necropolis", zh: "埃及考古学发掘报告" }
      }
    ]
  },
  {
    location: { en: "Athens", zh: "雅典市" },
    year: -1000,
    yearDisplay: { en: "1000 BCE", zh: "公元前1000年" },
    events: [
      {
        name: { en: "Institutionalization of Same-Sex Social Bonds", zh: "古希腊城邦同性社交制度化" },
        summary: { en: "With the rise of Greek city-states, Athens established institutionalized mentor-mentee relationships between adult men and youths for moral and social guidance.", zh: "随着古希腊城邦的兴起，雅典等城邦逐步确立了成年男子与青少年之间的精神与社交亲密制度。" },
        contributor: { en: "Museum Curation", zh: "本馆编撰" },
        source: { en: "Plato's Symposium", zh: "柏拉图《会饮篇》" }
      }
    ]
  },
  {
    location: { en: "Lesbos", zh: "莱斯沃斯" },
    year: -1000,
    yearDisplay: { en: "1000 BCE", zh: "公元前1000年" },
    events: [
      {
        name: { en: "Sappho's Lyric Poetry Circle", zh: "萨福创立女子诗社" },
        summary: { en: "On the island of Lesbos, Sappho gathered young women in a school of poetry, writing verses celebrating female intimacy, which birthed the historical term 'Lesbian'.", zh: "女诗人萨福在莱斯沃斯岛聚集年轻女性，写下大量赞美女性亲密的抒情残篇，成为Lesbian一词的历史词源。" },
        contributor: { en: "Museum Curation", zh: "本馆编撰" },
        source: { en: "Surviving Fragments of Sappho's Poems", zh: "《萨福诗集残篇》" }
      }
    ]
  },
  {
    location: { en: "Xi'an", zh: "西安市" },
    year: 0,
    yearDisplay: { en: "1 CE / Year 0", zh: "公元元年 / 公元0年" },
    events: [
      {
        name: { en: "The Passion of the Cut Sleeve", zh: "哀帝与董贤断袖之游" },
        summary: { en: "Emperor Ai of Han woke and cut off his imperial sleeve rather than wake his favorite male courtier Dong Xian, establishing the classic allusion of cut-sleeve passion.", zh: "汉哀帝刘欣与董贤在未央宫同床共枕，哀帝为不惊醒董贤而挥剑斩断衣袖，史称‘断袖之癖’。" },
        contributor: { en: "Museum Curation", zh: "本馆编撰" },
        source: { en: "Book of Han: Biography of Dong Xian", zh: "《汉书·董贤传》" }
      }
    ]
  },
  {
    location: { en: "Rome", zh: "罗马市" },
    year: 0,
    yearDisplay: { en: "1 CE / Year 0", zh: "公元元年 / 公元0年" },
    events: [
      {
        name: { en: "Hadrian and the Deification of Antinous", zh: "哈德良大帝设立安提诺乌斯神庙" },
        summary: { en: "Roman Emperor Hadrian established temples across the empire to deify his drowned beloved companion Antinous, placing statues celebrating male beauty in major cities.", zh: "哈德良大帝在罗马建立神庙以纪念溺亡的爱侣安提诺乌斯，将其封为神子，并在全帝国树立雕像。" },
        contributor: { en: "Museum Curation", zh: "本馆编撰" },
        source: { en: "Historia Augusta: Life of Hadrian", zh: "罗马帝国历史文献" }
      }
    ]
  },
  {
    location: { en: "Baghdad", zh: "巴格达市" },
    year: 1000,
    yearDisplay: { en: "1000 CE", zh: "公元1000年" },
    events: [
      {
        name: { en: "Abu Nuwas's Poetry Compilations", zh: "阿布·努瓦斯男风诗集抄本" },
        summary: { en: "Abbasid court scholars hand-copied compilations of Abu Nuwas's lyric poems (Mudhakkarat), celebrating male youths in courtly banquet settings.", zh: "巴格达宫廷学者手抄整理阿布·努瓦斯的抒情男风诗（Mudhakkarat），其辞藻华丽，打破古典禁忌，流传至大马士革。" },
        contributor: { en: "Museum Curation", zh: "本馆编撰" },
        source: { en: "Abbasid Calligraphy Collection Manuscripts", zh: "阿拔斯抄本珍集" }
      }
    ]
  },
  {
    location: { en: "Rome", zh: "罗马市" },
    year: 1500,
    yearDisplay: { en: "1500 CE", zh: "公元1500年" },
    events: [
      {
        name: { en: "Michelangelo's Sistine Chapel Murals", zh: "米开朗基罗绘制西斯廷礼拜堂" },
        summary: { en: "Michelangelo created high Renaissance frescoes in Rome featuring powerful, androgynous male figures, expressing his passionate neo-Platonic queer aesthetics.", zh: "米开朗基罗在罗马为西斯廷礼拜堂创作壁画，画面中充满强健而带中性美的男性裸体，寄托了其强烈的古典酷儿美学。" },
        contributor: { en: "Museum Curation", zh: "本馆编撰" },
        source: { en: "Vasari's Lives of the Artists", zh: "瓦萨里《艺苑名人传》" }
      }
    ]
  },
  {
    location: { en: "Fuzhou", zh: "福州市" },
    year: 1500,
    yearDisplay: { en: "1500 CE", zh: "公元1500年" },
    events: [
      {
        name: { en: "Fujian Same-Sex Brotherhood Custom", zh: "闽地契兄契弟风俗风行" },
        summary: { en: "During the mid-Ming dynasty, Same-Sex brotherhoods (Qi Xiong Qi Di) flourished in Fujian, where couples held ceremonies, lived together, and were recognized by clans.", zh: "明代中叶，福建及沿海地区契兄契弟的风俗广泛流行，双方举行仪式结为同性伴侣，同居共财，甚至为宗族接纳。" },
        contributor: { en: "Museum Curation", zh: "本馆编撰" },
        source: { en: "Shen Defu's Wanli Yehuo Bian", zh: "沈德符《万历野获编》" }
      }
    ]
  },
  {
    location: { en: "Taipei", zh: "台北市" },
    year: 2000,
    yearDisplay: { en: "2000 CE", zh: "公元2000年" },
    events: [
      {
        name: { en: "First Taiwan LGBT Pride & Founding of Wei Ming Temple", zh: "台北首届同志大游行与威明堂建立" },
        summary: { en: "Taiwan held its early pride rallies while Wei Ming Temple was founded in Yonghe District, enshrining Tu'er Shen (the Rabbit God) as a patron deity for queer folk.", zh: "首届台湾同志大游行开幕，同时新北市永和区威明堂建立，供奉‘兔儿神胡天宝’作为守护神，开创全球独特的道教酷儿信仰空间。" },
        contributor: { en: "Museum Curation", zh: "本馆编撰" },
        source: { en: "Contemporary Taiwan Ethnography Records", zh: "当代台湾民俗志" }
      }
    ]
  },
  {
    location: { en: "Xi'an", zh: "西安市" },
    year: 2026,
    yearDisplay: { en: "2026 CE", zh: "公元2026年" },
    events: [
      {
        name: { en: "Launch of Spatiotemporal Time-Map", zh: "数字博物馆时空地图上线" },
        summary: { en: "The Queer Archive launches its 2D drilldown time-map module, incorporating curated entries and crowdsourced UGC contributions for digital humanities studies.", zh: "“The Queer Archive”博物馆时空地图正式上线，收录自有内容并对大众开放UGC投稿，成为数字人文领域的重大成果。" },
        contributor: { en: "Museum Curation", zh: "本馆编撰" },
        source: { en: "Digital Humanities Conference Press Release", zh: "数字人文大会发布" }
      }
    ]
  },
  {
    location: { en: "Taipei", zh: "台北市" },
    year: 2026,
    yearDisplay: { en: "2026 CE", zh: "公元2026年" },
    events: [
      {
        name: { en: "Tu'er Shen Global Pilgrimage Hub", zh: "兔儿神现代国际化朝圣" },
        summary: { en: "Wei Ming Temple receives queer pilgrims from across the globe, recognized as an outstanding integration of traditional Daoism and contemporary LGBTQ+ rights.", zh: "威明堂接待来自全球的多元性别文化朝圣者，兔儿神被作为传统道教与现代酷儿权利完美融合的典范向全球推介。" },
        contributor: { en: "User 'Queer Traveler'", zh: "用户「酷儿旅行者」投稿" },
        source: { en: "Wei Ming Temple Visitor Guestbooks", zh: "威明堂访客记录" }
      }
    ]
  }
];

// Helper mapping for placing anchors onto the D3 map
export const ANCHOR_COORDINATES_MAP: Record<string, [number, number]> = {
  "西安市": [108.9398, 34.3416],
  "Xi'an": [108.9398, 34.3416],
  "萨卡拉": [31.2197, 29.8713],
  "Saqqara": [31.2197, 29.8713],
  "雅典市": [23.7275, 37.9838],
  "Athens": [23.7275, 37.9838],
  "莱斯沃斯": [26.2716, 39.2089],
  "Lesbos": [26.2716, 39.2089],
  "罗马市": [12.4964, 41.9028],
  "Rome": [12.4964, 41.9028],
  "巴格达市": [44.3661, 33.3152],
  "Baghdad": [44.3661, 33.3152],
  "福州市": [119.3062, 26.0753],
  "Fuzhou": [119.3062, 26.0753],
  "台北市": [121.5654, 25.0330],
  "Taipei": [121.5654, 25.0330],
  "德里": [77.2090, 28.6139],
  "Delhi": [77.2090, 28.6139],
  "巴黎": [2.3522, 48.8566],
  "Paris": [2.3522, 48.8566]
};
