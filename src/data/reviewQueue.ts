import type { LocalizedString } from "../types";

export interface PendingReviewEntry {
  id: string;
  name: LocalizedString;
  location: LocalizedString;
  claimedYear: number;
  summary: LocalizedString;
  source: LocalizedString;
  contributor: LocalizedString;
  holdReason: {
    en: string;
    zh: string;
  };
}

/**
 * These entries were migrated from the previous demo prototype's `eventsData.ts`.
 * In accordance with Acceptance Criterion 14 ("Unverified historical information must not be fabricated or displayed without vetting"),
 * they are preserved here with explicit review notes, awaiting scholarly verification before public publication.
 */
export const PENDING_REVIEW_QUEUE: PendingReviewEntry[] = [
  {
    id: "review-saqqara-5000bce",
    name: { en: "Prehistoric Rock Art & Gender Fluidity", zh: "史前石刻与身体象征" },
    location: { en: "Saqqara", zh: "萨卡拉" },
    claimedYear: -5000,
    summary: {
      en: "Prehistoric rock art discovered in the Saqqara region depicts figures with dual gender characteristics.",
      zh: "萨卡拉周边墓葬群出土史前石刻壁画，描绘了性别模糊的双性特征崇拜雕像。"
    },
    source: { en: "Egyptian Antiquities Department Reports", zh: "埃及古物局报告" },
    contributor: { en: "Museum Curation", zh: "本馆编撰" },
    holdReason: {
      en: "General citation lacking specific tomb number or archaeological catalog entry; requires confirmation by an Egyptologist.",
      zh: "文献来源缺乏具体墓葬编号或考古发掘编号，待埃及学专业人员核实后再做收录。"
    }
  },
  {
    id: "review-banpo-4000bce",
    name: { en: "Yangshao Culture Androgynous Pottery", zh: "仰韶文化双性陶器" },
    location: { en: "Xi'an", zh: "西安市" },
    claimedYear: -4000,
    summary: {
      en: "Androgynous pottery fragments unearthed at the Banpo Neolithic site feature decorative patterns representing dual-sex figures.",
      zh: "半坡遗址出土仰韶文化陶器，器表纹饰呈现双性同体或无性别分化的图腾符号。"
    },
    source: { en: "Banpo Archaeological Excavation Archives", zh: "半坡遗址考古发掘记录" },
    contributor: { en: "Museum Curation", zh: "本馆编撰" },
    holdReason: {
      en: "Neolithic iconography interpretations are speculative; lacks peer-reviewed publication support for gender claims.",
      zh: "新石器时代陶器纹饰解读存在过度揣测争议，缺乏正式学术期刊论著佐证其性别表征。"
    }
  },
  {
    id: "review-cycladic-3000bce",
    name: { en: "Cycladic Abstract Marble Figures", zh: "基克拉泽斯抽象石雕" },
    location: { en: "Athens", zh: "雅典市" },
    claimedYear: -3000,
    summary: {
      en: "Early Cycladic abstract marble figurines, mostly gender-neutral with arms folded over chests, demonstrate prehistoric body aesthetics.",
      zh: "基克拉泽斯群岛出土大量性别中性、双臂抱胸的扁平大理石偶像雕像，体现史前艺术对身体的抽象理解。"
    },
    source: { en: "National Archaeological Museum Collections", zh: "雅典国家考古博物馆馆藏" },
    contributor: { en: "Museum Curation", zh: "本馆编撰" },
    holdReason: {
      en: "Stylistic abstraction in Cycladic art lacks accompanying textual evidence linking it to social gender categories.",
      zh: "基克拉泽斯大理石人像的几何简化风格属史前雕塑美学，缺乏同期文献可据以判断具体的社会性别分类。"
    }
  },
  {
    id: "review-sappho-event-1000bce",
    name: { en: "Sappho's Lyric Poetry Circle", zh: "萨福创立女子诗社" },
    location: { en: "Lesbos", zh: "莱斯沃斯" },
    claimedYear: -1000,
    summary: {
      en: "Sappho gathered young women in a school of poetry on Lesbos.",
      zh: "女诗人萨福在莱斯沃斯岛聚集年轻女性，写下大量赞美女性亲密的抒情残篇。"
    },
    source: { en: "Surviving Fragments of Sappho's Poems", zh: "《萨福诗集残篇》" },
    contributor: { en: "Museum Curation", zh: "本馆编撰" },
    holdReason: {
      en: "Anachronistic date: entry lists 1000 BCE, but Sappho historically lived c. 630–570 BCE. Consolidated into the vetted Sappho record.",
      zh: "时间严重错位：原记录标注为公元前1000年，而萨福实际生活于公元前7-6世纪。已合并至正式萨福档案。"
    }
  },
  {
    id: "review-hadrian-antinous-0ce",
    name: { en: "Hadrian and the Deification of Antinous", zh: "哈德良大帝设立安提诺乌斯神庙" },
    location: { en: "Rome", zh: "罗马市" },
    claimedYear: 0,
    summary: {
      en: "Roman Emperor Hadrian established temples across the empire to deify his drowned beloved companion Antinous.",
      zh: "哈德良大帝在罗马建立神庙以纪念溺亡的爱侣安提诺乌斯，将其封为神子，并在全帝国树立雕像。"
    },
    source: { en: "Historia Augusta: Life of Hadrian", zh: "罗马帝国历史文献" },
    contributor: { en: "Legacy Dataset", zh: "旧系统初始数据" },
    holdReason: {
      en: "Anachronistic year: listed as year 0, but Hadrian reigned 117–138 CE and Antinous died in 130 CE. Awaiting chronological revision.",
      zh: "时间标注错误：标注为公元0年，实际哈德良在位时间为公元117–138年，安提诺乌斯于公元130年逝世。待校正年代后入库。"
    }
  },
  {
    id: "review-michelangelo-1500",
    name: { en: "Michelangelo's Sistine Chapel Murals", zh: "米开朗基罗绘制西斯廷礼拜堂" },
    location: { en: "Rome", zh: "罗马市" },
    claimedYear: 1500,
    summary: {
      en: "Michelangelo created frescoes in Rome featuring powerful androgynous male figures.",
      zh: "米开朗基罗在罗马为西斯廷礼拜堂创作壁画，画面中充满强健而带中性美的男性裸体。"
    },
    source: { en: "Vasari's Lives of the Artists", zh: "瓦萨里《艺苑名人传》" },
    contributor: { en: "Legacy Dataset", zh: "旧系统初始数据" },
    holdReason: {
      en: "Broad artistic association requires specific archival framing around non-normative intimacy or primary sonnets to Tommaso dei Cavalieri.",
      zh: "宏观艺术作品尚需补充对多马索·卡瓦列里的十四行诗手稿等第一手亲密史料考证，待学术论证深化后入库。"
    }
  },
  {
    id: "review-fujian-qi-xiong-1500",
    name: { en: "Fujian Same-Sex Brotherhood Custom", zh: "闽地契兄契弟风俗风行" },
    location: { en: "Fuzhou", zh: "福州市" },
    claimedYear: 1500,
    summary: {
      en: "Same-Sex brotherhoods (Qi Xiong Qi Di) flourished in Fujian during mid-Ming dynasty.",
      zh: "明代中叶，福建及沿海地区契兄契弟的风俗广泛流行，双方举行仪式结为同性伴侣。"
    },
    source: { en: "Shen Defu's Wanli Yehuo Bian", zh: "沈德符《万历野获编》" },
    contributor: { en: "Legacy Dataset", zh: "旧系统初始数据" },
    holdReason: {
      en: "Custom/sociological entry rather than specific figure/event record. Awaiting full synthesis with late Ming court cases or literature.",
      zh: "该条目属于民俗社会史范畴而非单一人物/事件档案，待结合晚明诉讼档案与文学专论补充入库。"
    }
  }
];
