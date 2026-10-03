import fs from "fs";
import { MOCK_ENTRIES } from "./temp_mock.mjs";

function slugify(id) {
  return id
    .replace(/^entry_/, "")
    .replace(/_/g, "-")
    .toLowerCase();
}

function precision(str) {
  const s = (str || "").toLowerCase();
  if (s.includes("city")) return "city";
  if (s.includes("region")) return "cultural-region";
  if (s.includes("trans")) return "transregional";
  if (s.includes("exact")) return "exact";
  return "region";
}

function relationForId(id) {
  switch (id) {
    case "entry_niankhkhnum": return "burial-site";
    case "entry_duanxiu": return "court-site";
    case "entry_sappho": return "residence";
    case "entry_lanling_wang": return "activity-area";
    case "entry_david_jonathan": return "activity-area";
    case "entry_chevalier_deon": return "residence";
    case "entry_tuer_shen": return "cultural-origin";
    case "entry_galli_priests": return "cultural-origin";
    case "entry_hermaphroditus": return "cultural-origin";
    case "entry_mulan": return "representative";
    case "entry_hijra": return "representative";
    default: return "activity-area";
  }
}

function countryForId(id) {
  switch (id) {
    case "entry_tuer_shen":
    case "entry_duanxiu":
    case "entry_lanling_wang":
    case "entry_mulan":
      return { name: { en: "China", zh: "中国" }, code: "156" };
    case "entry_sappho":
      return { name: { en: "Greece", zh: "希腊" }, code: "300" };
    case "entry_hermaphroditus":
    case "entry_galli_priests":
      return { name: { en: "Turkey", zh: "土耳其" }, code: "792" };
    case "entry_niankhkhnum":
      return { name: { en: "Egypt", zh: "埃及" }, code: "818" };
    case "entry_david_jonathan":
      return { name: { en: "Israel", zh: "以色列" }, code: "376" };
    case "entry_hijra":
      return { name: { en: "India", zh: "印度" }, code: "356" };
    case "entry_chevalier_deon":
      return { name: { en: "France", zh: "法国" }, code: "250" };
    default:
      return undefined;
  }
}

const records = MOCK_ENTRIES.map(e => {
  const cInfo = countryForId(e.id);
  const sources = [];
  const enRefs = e.references?.en || [];
  const zhRefs = e.references?.zh || [];
  const maxLen = Math.max(enRefs.length, zhRefs.length);
  for (let i = 0; i < maxLen; i++) {
    const en = enRefs[i] || "";
    const zh = zhRefs[i] || "";
    sources.push({
      title: zh || en,
      citation: en || zh
    });
  }

  return {
    id: e.id,
    slug: slugify(e.id),
    title: e.title,
    originalName: e.originalName || undefined,
    aliases: [...(e.alias?.en || []), ...(e.alias?.zh || [])],
    summary: e.summary,
    body: e.description,
    time: {
      startYear: e.startYear,
      endYear: e.endYear,
      label: e.periodLabel,
      certainty: Math.abs(e.endYear - e.startYear) > 100 ? "period" : "approximate"
    },
    place: {
      name: e.region,
      countryName: cInfo?.name,
      countryCode: cInfo?.code,
      coordinates: {
        longitude: e.coordinates[0],
        latitude: e.coordinates[1]
      },
      precision: precision(e.locationPrecision),
      relation: relationForId(e.id)
    },
    historiographyNote: e.riskDetail,
    sources
  };
});

// Add Thomas(ine) Hall
records.unshift({
  id: "entry_thomas_hall",
  slug: "thomas-hall",
  title: {
    en: "Thomas(ine) Hall",
    zh: "托马斯(因)·霍尔"
  },
  originalName: "Thomasine Hall / Thomas Hall",
  aliases: ["Thomas-Thomasine Hall", "Thomas Hall", "Thomasine Hall"],
  summary: {
    en: "An indentured servant in early colonial Virginia whose ambiguous gender led to multiple physical searches and a 1629 General Court ruling declaring them 'both a man and a woeman,' ordering a combined apparel of male clothes with a female coif and apron.",
    zh: "17世纪初北美殖民地的英国契约仆工。因性别身份引发邻里争论并遭受多次身体检查，1629年詹姆斯敦普通法院裁决其“既是男人也是女人”，并命令其同时穿着男女混合服饰。"
  },
  body: {
    en: "Born in Newcastle upon Tyne around 1603, Hall was baptized as Thomasine and raised as a girl. Around age twenty-four, Hall cut their hair, donned men's clothes, and enlisted as a soldier under the name Thomas Hall, serving in the expedition to the Isle of Ré. Returning to England, Hall resumed women's clothing for a period, before once again dressing as a man to embark as an indentured servant aboard the ship James bound for Virginia.\n\nIn Warrosquyoake, Hall's varied apparel and dual skill set—capable of heavy agricultural field labor and delicate needlework—prompted intense suspicion from neighbors. Following several invasive examinations, Hall was brought before the General Court at Jamestown on April 8, 1629. Governor John Pott and the Council declared that Hall was 'a man and a woeman,' ordering Hall to dress in men's apparel, but compelled them to wear a woman's coif and apron at all times.",
    zh: "霍尔约于1603年出生于英格兰纽卡斯尔，自幼受洗为女名托马辛（Thomasine）并作为女孩抚养，擅长蕾丝缝纫。约二十四岁时，霍尔剪发穿男装，以托马斯（Thomas）之名入伍远征法国拉罗谢尔。战后返英一度恢复女装从事缝纫，不久后再次穿着男装，以契约仆工身份前往北美弗吉尼亚殖民地。\n\n在华罗斯夸约克种植园，霍尔既能从事重体力农耕，又擅长缝纫女红，其衣着在男女装束之间的切换引发了邻里种植园主的极大疑虑。在遭受多次非自愿的身体搜查后，霍尔于1629年4月8日被押送至詹姆斯敦普通法院受审。总督约翰·波茨与议员们裁定霍尔“既是男人也是女人”（both a man and a woeman），命令其必须身着男式马裤与短上衣，但同时必须始终佩戴女式的遮耳亚麻软帽（coif）与围裙（apron）。"
  },
  time: {
    startYear: 1603,
    endYear: 1629,
    label: {
      en: "1603 – 1629+",
      zh: "1603年 – 1629年后"
    },
    certainty: "exact"
  },
  place: {
    name: {
      en: "Jamestown, Virginia",
      zh: "詹姆斯敦（弗吉尼亚）"
    },
    countryName: {
      en: "United States of America",
      zh: "美国"
    },
    countryCode: "840",
    coordinates: {
      longitude: -76.7797,
      latitude: 37.2104
    },
    precision: "city",
    relation: "event-site"
  },
  historiographyNote: {
    en: "Court records preserve legal testimony and neighbor examinations, but leave no direct first-person reflection on how Hall personally experienced their identity. Contemporary historians examine the case as an early collision between rigid legal gender definitions and embodied ambiguity. The archive strictly respects the primary court documents without imposing modern labels.",
    zh: "法庭记录保留了审判文书、邻里搜查证词与官员判决，但未曾留下霍尔本人对自己内心情感与身体认同的直接自述。现代史学将此案视为早期北美殖民地法律、劳力制度与性别秩序边界碰撞的重要案例。档案严格基于第一手文献呈现历史细节，不对其强行赋予未经证实的现代身份术语。"
  },
  sources: [
    {
      title: "Minutes of the Council and General Court of Colonial Virginia, 1622–1632",
      author: "Henry Read McIlwaine (ed.)",
      year: 1924,
      citation: "Virginia State Library, pp. 194–195",
      url: "https://archive.org/details/minutesofcouncil00virg"
    },
    {
      title: "'Changed... into the Fashion of a Man': The Politics of Sexual Difference in a Seventeenth-Century Anglo-American Settlement",
      author: "Kathleen M. Brown",
      year: 1995,
      citation: "Journal of the History of Sexuality 6, no. 2, pp. 171–193",
      url: "https://www.jstor.org/stable/3704153"
    },
    {
      title: "Thomas/ine Hall (b. 1603)",
      author: "Encyclopedia Virginia",
      year: 2021,
      url: "https://encyclopediavirginia.org/entries/thomas-in-hall-c-1603-after-april-8-1629/"
    }
  ]
});

// Add Abu Nuwas
records.push({
  id: "entry_abu_nuwas",
  slug: "abu-nuwas",
  title: {
    en: "Abu Nuwas",
    zh: "阿布·努瓦斯"
  },
  originalName: "الحسن بن هانئ الحكمي (Al-Hasan ibn Hani')",
  aliases: ["Father of the Lock of Hair", "卷发之父", "阿布·努瓦斯"],
  summary: {
    en: "One of the greatest classical Arabic poets of the Islamic Golden Age in Baghdad, celebrated for his audacious wine songs and homoerotic love poetry (Mudhakkarat) defying orthodox court conventions.",
    zh: "伊斯兰黄金时代巴格达最著名的阿拉伯古典抒情诗人之一，以打破禁忌的狂放酒诗与咏男童爱情诗（Mudhakkarat）闻名于世。"
  },
  body: {
    en: "Born in Ahvaz of Arab and Persian descent, Abu Nuwas rose to become the preeminent court poet under Abbasid Caliph Harun al-Rashid and his successor al-Amin in Baghdad. Celebrated in the 'One Thousand and One Nights', his poetry revolutionized Arabic verse by rejecting rigid desert pastoral tropes in favor of vibrant urban court life.\n\nHis 'Mudhakkarat' (male homoerotic love lyrics) celebrated youth, wine, and romantic pursuit with unparalleled linguistic virtuosity and emotional candor, earning him both royal admiration and periods of imprisonment.",
    zh: "阿布·努瓦斯出生于阿瓦士，具阿拉伯与波斯血统，是阿拔斯王朝哈里发哈伦·拉希德与阿明统治时期巴格达最负盛名的宫廷诗人，亦作为标志性人物频繁出现在《一千零一夜》中。\n\n他的诗作彻底革新了阿拉伯古典诗歌，摒弃了僵化的沙漠牧歌陈词，热烈吟咏繁华都城的宫廷宴饮、醇酒与美少年（Mudhakkarat）。他的男风诗不仅在词章造诣上登峰造极，更以坦荡纯粹的抒情打破了当时的保守教条，流传整个伊斯兰世界。"
  },
  time: {
    startYear: 756,
    endYear: 814,
    label: {
      en: "756 CE – 814 CE",
      zh: "公元756年 – 公元814年"
    },
    certainty: "exact"
  },
  place: {
    name: {
      en: "Baghdad, Abbasid Caliphate",
      zh: "巴格达（阿拔斯王朝）"
    },
    countryName: {
      en: "Iraq",
      zh: "伊拉克"
    },
    countryCode: "368",
    coordinates: {
      longitude: 44.3661,
      latitude: 33.3152
    },
    precision: "city",
    relation: "residence"
  },
  historiographyNote: {
    en: "Literary scholars emphasize the delicate balance between formal Arabic poetic tropes and historical personal experience. Classical homoerotic desire in Arabic literature operated within distinct patron-courtly contexts that should not be conflated with modern sexual-identity labels.",
    zh: "学者指出，古典阿拉伯诗歌中的男风书写既遵循高度成熟的宫廷颂诗与抒情传统，又融入了诗人真挚的情感。不可脱离阿拔斯都城独特的文学狂欢语境，将其简单比附为现代同性恋身份政治。"
  },
  sources: [
    {
      title: "The Wine Song in Classical Arabic Poetry: Abu Nuwas and the Literary Tradition",
      author: "Philip F. Kennedy",
      year: 1997,
      citation: "Clarendon Press, Oxford"
    },
    {
      title: "Homoeroticism in Classical Arabic Literature",
      author: "J. W. Wright & Everett K. Rowson (eds.)",
      year: 1997,
      citation: "Columbia University Press"
    }
  ]
});

const tsFile = `import type { ArchiveRecord } from "../types";\n\nexport const ARCHIVE_RECORDS: ArchiveRecord[] = ${JSON.stringify(records, null, 2)};\n`;
fs.writeFileSync("src/data/records.ts", tsFile, "utf8");
console.log("src/data/records.ts generated with", records.length, "records");
