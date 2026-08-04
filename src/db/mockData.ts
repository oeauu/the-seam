export interface LocalizedString {
  en: string;
  zh: string;
}

export interface LocalizedArray {
  en: string[];
  zh: string[];
}

export interface MockEntry {
  id: string;
  title: LocalizedString;
  originalName: string;
  alias: LocalizedArray;
  region: LocalizedString;
  coordinates: [number, number];
  locationPrecision: string;
  startYear: number;
  endYear: number;
  periodLabel: LocalizedString;
  sourceCategory: string;
  sourceSubcategory: string;
  objectTypes: string[];
  culturalMeanings: string[];
  evidenceGrade: string;
  interpretationRisks: string[];
  riskDetail: LocalizedString;
  summary: LocalizedString;
  description: LocalizedString;
  references: LocalizedArray;
}

export const MOCK_ENTRIES: MockEntry[] = [
  {
    id: "entry_tuer_shen",
    title: {
      en: "Tu'er Shen (The Rabbit God)",
      zh: "兔儿神（兔神）"
    },
    originalName: "兔儿神",
    alias: {
      en: ["Hu Tianbao", "The Rabbit Deity"],
      zh: ["胡天宝", "兔仙", "大耳神"]
    },
    region: {
      en: "Fujian (China) & Taiwan Folk Belief Circle",
      zh: "中国福建与台湾民间信仰圈"
    },
    coordinates: [121.5654, 25.0330], // Taipei
    locationPrecision: "Cultural Region",
    startYear: 1644,
    endYear: 2026,
    periodLabel: {
      en: "Qing Dynasty to Present",
      zh: "明清时代至当代"
    },
    sourceCategory: "Cultural Memory",
    sourceSubcategory: "Folklore & Folk Beliefs",
    objectTypes: ["Deity", "Mythological Figure", "Modern Reinterpretation"],
    culturalMeanings: ["Sacred", "Taboo", "Guardian", "Local Memory", "Modern Re-activation"],
    evidenceGrade: "C / D",
    interpretationRisks: ["Legend and Modern Reinterpretation Mixed", "Anachronistic Identity Projection"],
    riskDetail: {
      en: "The figure blends historical folklore with modern LGBTQ+ reclaiming. It cannot be simplified as an ancient, static 'same-sex deity' without acknowledging the 21st-century shifting beliefs and temple practices.",
      zh: "该形象融合了清代民间传说与21世纪现代同性恋社群的再激活。不能简单将其等同于古代一成不变的“同性恋之神”，需理清清代惩罚叙事与当代人权/守护神叙事之间的张力。"
    },
    summary: {
      en: "A deity in Chinese folk religion associated with male homoerotic desire, originating from Fujian and widely revitalized in modern Taiwan.",
      zh: "闽台民间信仰中庇佑男性同性情欲的神明，起源于清代福建传说，当代在台湾被重新唤醒并建立庙宇。"
    },
    description: {
      en: "Tu'er Shen's worship is rooted in a Qing Dynasty legend recorded by writer Yuan Mei in *What the Master Would Not Discuss*. The tale tells of Hu Tianbao, a young man who was beaten to death after being caught peeping at a handsome local official. In the underworld, the officials of Hades deified him as 'Tu'er Shen' (the Rabbit God, utilizing 'rabbit' which was a historic slang for male homoerotic companions) to govern and protect men who love men. In contemporary Taiwan, particularly at the rabbit temple in Yonghe District, New Taipei City, the deity has been revived as a patron for same-sex relationships, representing a unique convergence of traditional folk religion, historic taboo, and modern queer activism.",
      zh: "兔儿神的崇拜源于清代文人袁枚在《子不语》中记录的传说。故事讲述年轻男子胡天宝因暗恋并偷窥年轻巡按御史，被发现后拷打致死。阴间判官认为其情虽越界但念在痴心，遂封其为“兔儿神”（借用明清时期指代男风同性伴侣的俚语“兔儿”），掌管人间男悦男之事。在当代台湾新北市永和区的威明堂，兔儿神被重新解读为同性伴侣的守护神，成为了传统民俗、历史禁忌与现代酷儿维权运动的独特交汇点。"
    },
    references: {
      en: [
        "Yuan Mei, 'What the Master Would Not Discuss' (子不语), Qing Dynasty.",
        "Marc L. Moskowitz, 'The Haunting Fetus: Abortion, Sexuality, and the Spirit World in Taiwan', 2001.",
        "Contemporary ethnographic observations of the Wei Ming Temple in Yonghe, New Taipei City."
      ],
      zh: [
        "袁枚，《子不语》卷十九“兔儿神”，清代。",
        "Marc L. Moskowitz，《寻找子嗣：台湾堕胎、性与神灵世界》（英文版），2001年。",
        "当代台湾新北市永和区威明堂兔儿神庙的田野调查记录。"
      ]
    }
  },
  {
    id: "entry_duanxiu",
    title: {
      en: "Duanxiu (The Cut Sleeve)",
      zh: "断袖之癖"
    },
    originalName: "断袖",
    alias: {
      en: ["Emperor Ai and Dong Xian", "Sleeve-Cutting Allusion"],
      zh: ["董贤与汉哀帝", "断袖"]
    },
    region: {
      en: "Western Han Imperial Court, Chang'an",
      zh: "中国西汉宫廷（长安）",
    },
    coordinates: [108.9398, 34.3416], // Xi'an
    locationPrecision: "City (Historic)",
    startYear: -7,
    endYear: -1,
    periodLabel: {
      en: "Late Western Han Dynasty (1st Century BCE)",
      zh: "西汉晚期（公元前1世纪）"
    },
    sourceCategory: "Historical Documents",
    sourceSubcategory: "Imperial Chronicles & Records",
    objectTypes: ["Historical Allusion", "Court Narrative", "Historical Figures"],
    culturalMeanings: ["Favoritism", "Power Intimacy", "Ambiguity", "Literary Tropes"],
    evidenceGrade: "A / B",
    interpretationRisks: ["Anachronistic Identity Projection", "Power Asymmetry in Records"],
    riskDetail: {
      en: "The relationship was recorded in official histories through the lens of court favoritism and political instability. Applying modern labels like 'gay' obscures the complex structures of Han imperial patronage, concubinage, and power relations.",
      zh: "此关系由汉代官方正史记录，常夹杂朝政批判与后宫外戚政治论述。强行套用现代“同性恋”标签会遮蔽西汉帝王男宠、男色侍从制度以及权力不对称关系的政治本质。"
    },
    summary: {
      en: "A foundational Chinese historical allusion for male same-sex love, originating from the intimate relationship between Emperor Ai of Han and his favorite courtier Dong Xian.",
      zh: "汉代著名的历史典故，用来指代男性之间的亲密情爱，源于汉哀帝与董贤的亲昵逸事。"
    },
    description: {
      en: "According to the *Book of Han*, Emperor Ai of the Western Han dynasty was sleeping in bed with his favorite male courtier, Dong Xian. When the emperor woke up and needed to attend court, he found Dong Xian asleep on his sleeve. Unwilling to wake his beloved companion, he used a sword to cut his sleeve off, leaving Dong Xian to sleep undisturbed. This act of tenderness became a classic literary euphemism ('the passion of the cut sleeve') in Chinese culture for male homoeroticism for over two millennia, establishing a rich tradition of courtly love narratives that bypass modern binary categorizations.",
      zh: "根据《汉书·佞幸传》记载，汉哀帝与大司马董贤共寝，哀帝醒来欲起去听政，而董贤压住了哀帝的衣袖。哀帝不忍惊醒董贤，遂用佩刀割断衣袖而起。这一体贴温柔的举动在后世演变为指代男风、男同性之爱的词汇“断袖”。这一典故开启了中国两千多年以委婉词汇叙述男色与同性情爱的传统，它超越了现代对于性倾向的二元划分，展示了古代中国政治、帝王权力与私人情感交织的复杂性。"
    },
    references: {
      en: [
        "Ban Gu, 'Book of Han' (汉书), Volume 93: 'Biographies of Imperial Favorites' (佞幸传).",
        "Bret Hinsch, 'Passions of the Cut Sleeve: The Male Homosexual Tradition in China', University of California Press, 1990."
      ],
      zh: [
        "班固，《汉书》卷九十三《佞幸传》，东汉。",
        "Bret Hinsch，《断袖之癖：中国男风历史研究》（英文版），加州大学出版社，1990年。"
      ]
    }
  },
  {
    id: "entry_sappho",
    title: {
      en: "Sappho of Lesbos",
      zh: "萨福（莱斯博斯的萨福）"
    },
    originalName: "Σαπφώ",
    alias: {
      en: ["The Tenth Muse", "Sappho of Mytilene"],
      zh: ["第十位缪斯", "米蒂利尼的萨福"]
    },
    region: {
      en: "Island of Lesbos, Ancient Greece",
      zh: "古希腊莱斯博斯岛"
    },
    coordinates: [26.2716, 39.2089], // Lesbos
    locationPrecision: "Cultural Region",
    startYear: -630,
    endYear: -570,
    periodLabel: {
      en: "Archaic Greece (c. 630 – 570 BCE)",
      zh: "古希腊独裁时期（约公元前630 - 前570年）"
    },
    sourceCategory: "Textual Sources",
    sourceSubcategory: "Lyric Poetry",
    objectTypes: ["Historical Figure", "Poet", "Modern Reinterpretation"],
    culturalMeanings: ["Poetic Desire", "Female Intimacy", "Fragmentary Archives", "Reclaiming", "Modern Re-activation"],
    evidenceGrade: "A / B / D",
    interpretationRisks: ["Fragmentary Texts", "Strong Modern Reinterpretation", "Translation Disputes"],
    riskDetail: {
      en: "Only tiny fragments of Sappho's poetry survive, leaving huge room for historical projections. The terms 'lesbian' and 'sapphic' are modern political and cultural constructs that evolved from her reception rather than her original social context.",
      zh: "萨福现存诗作绝大多数为残篇，这给后世提供了极大的投射空间。现代词汇“Lesbian”（女同性恋）和“Sapphic”（萨福风）均衍生自萨福及其故乡，属现代政治与文化建构，与古希腊同性社交的社会语境有所差异。"
    },
    summary: {
      en: "An Archaic Greek lyric poet from the island of Lesbos, celebrated for her passionate poetry expressing desire, love, and intimacy between women.",
      zh: "古希腊著名的抒情诗人，居住于莱斯博斯岛，以歌颂女性间的情感、美丽与炽热渴望的诗作闻名于世。"
    },
    description: {
      en: "Sappho was one of the most famous lyric poets of ancient Greece, hailed by Plato as the 'Tenth Muse'. Living on the island of Lesbos, she composed highly emotional and personal poetry accompanied by the lyre. A large portion of her work focused on the beauty of young women, female companionship, and the intense longing shared within female communities. Despite most of her poems being destroyed or lost to history, the surviving fragments became a cornerstone for modern Western queer literature. Her name and place of origin gave birth to the modern words 'sapphic' and 'lesbian', cementing her as a timeless icon of female homoerotic desire.",
      zh: "萨福是古希腊最具传奇色彩的抒情诗人，柏拉图尊称她为“第十位缪斯”。她生活在莱斯博斯岛，创作了大量由里拉琴伴奏的抒情诗。她诗歌中的重要主题是女性的美丽、女伴之间的亲昵交流，以及彼此之间难以割舍的爱恋和渴望。虽然中世纪的教会审查使得她的大部分手稿遗失，但仅存的残篇（如《阿芙洛狄忒颂》）却成为了西方酷儿文学和女性主义写作的基石。“Lesbian”（女同性恋，字面意为莱斯博斯岛的人）和“Sapphic”这两个现代词汇便直接来自于她，奠定了她作为女性同性欲望代名词的标志性地位。"
    },
    references: {
      en: [
        "Surviving Fragments of Sappho's Poetry (e.g., 'Ode to Aphrodite').",
        "Margaret Williamson, 'Sappho's Immortal Daughters', Harvard University Press, 1995.",
        "Yopie Prins, 'Victorian Sappho', Princeton University Press, 1999."
      ],
      zh: [
        "萨福诗歌残篇（如《阿芙洛狄忒颂》，古希腊文/英文版）。",
        "Margaret Williamson，《萨福不朽的女儿们》（英文版），哈佛大学出版社，1995年。",
        "Yopie Prins，《维多利亚时代的萨福》（英文版），普林斯顿大学出版社，1999年。"
      ]
    }
  },
  {
    id: "entry_lanling_wang",
    title: {
      en: "Prince Lanling (Gao Changgong)",
      zh: "兰陵王（高长恭）"
    },
    originalName: "高长恭",
    alias: {
      en: ["Prince of Lanling", "Gao Xiaoguan", "Masked General"],
      zh: ["高肃", "兰陵武王", "面具将军"]
    },
    region: {
      en: "Northern Qi Court, Ye City",
      zh: "中国北齐宫廷（邺城）"
    },
    coordinates: [114.3168, 36.6256], // Handan
    locationPrecision: "City (Historic)",
    startYear: 541,
    endYear: 573,
    periodLabel: {
      en: "Northern & Southern Dynasties (6th Century CE)",
      zh: "南北朝时期（公元6世纪）"
    },
    sourceCategory: "Historical Documents",
    sourceSubcategory: "Dynastic Histories & Classical Drama",
    objectTypes: ["Historical Figures", "Historical Allusion", "Theatrical Image"],
    culturalMeanings: ["Performative Disguise", "Ambiguity", "Local Memory", "Reclaiming"],
    evidenceGrade: "A / B / C",
    interpretationRisks: ["Anachronistic Identity Projection", "Legend and Modern Reinterpretation Mixed"],
    riskDetail: {
      en: "Gao Changgong's historic gender non-conformity lies in his celebrated feminine beauty and the act of masking it in battle. The narrative has been heavily romanticized in literature and opera (such as Lanling Wang Ru Zhen Qu), which has led to modern queer and gender-subversive readings of his performance and body.",
      zh: "高长恭的历史非规范特征在于其被广为歌颂的“柔美女性化容貌”以及在战场上佩戴獠牙面具以壮威严的行为。这一性别特征在后世戏剧（如唐代大面戏《兰陵王入阵曲》）中演化为经典的变装与跨性别扮演符号。条目需厘清史书记录与后世艺术对他的性别颠覆式解读。"
    },
    summary: {
      en: "A Northern Qi general celebrated for his soft, feminine beauty, who wore a fearsome mask in battle, inspiring early cross-dressing theatrical traditions.",
      zh: "北齐时期的名将，因容貌清丽柔美如妇人，在战场上戴獠牙面具作战，启发了中国早期带有变装性质的宫廷乐舞戏剧。"
    },
    description: {
      en: "Gao Changgong, the Prince of Lanling, was a legendary general of the Northern Qi dynasty. Historical texts like the *Book of Northern Qi* record that he possessed a 'gentle and beautiful countenance, with a voice like a woman,' which was considered a disadvantage in leading soldiers. To compensate, he wore a terrifying wooden mask into combat to strike fear into enemies. His famous victory at the Siege of Jinyong inspired the grand theatrical dance *The Prince of Lanling in Battle* (Lanling Wang Ru Zhen Qu), which featured dancers wearing masks and mimicking his battle. This performance represents a foundational step in Chinese theatrical gender cross-dressing and mask performance, bridging historic body ambiguity with gender-fluid performance art.",
      zh: "高长恭，封号兰陵王，是北齐的一代名将。据《北齐书》等正史记载，他“貌柔心壮，音容兼美”，长相白皙柔美如同妇人，因嫌自己在战场上无法威慑敌军，每次出战及佩戴刻有狞恶神鬼面容的木雕面具。他在邙山之战中的大捷，启发将士创作了中国早期大型假面歌舞戏《兰陵王入阵曲》（唐代“大面”戏之始）。演员身着异装、佩戴面具扮演兰陵王，重现其英勇战姿。这段历史与戏剧实践，展示了古代中国对男性“柔美（阴柔）”气质与面具变装之间的审美挪用，成为了中国戏剧史上变装表演和面具艺术的奠基石。"
    },
    references: {
      en: [
        "Li Delin & Li Boyao, 'Book of Northern Qi' (北齐书), Tang Dynasty.",
        "Wang Guowei, 'A Study of Song and Yuan Operas' (宋元戏曲史), 1915.",
        "Ren Jiantang, 'Gender Aesthetics and Mask Performance in Chinese Opera', 2012."
      ],
      zh: [
        "李百药，《北齐书》卷十一《兰陵武王传》，唐代。",
        "王国维，《宋元戏曲史》关于大面戏的研究，1915年。",
        "任建堂，《中国戏曲的性别美学与面具表演研究》，2012年。"
      ]
    }
  },
  {
    id: "entry_hermaphroditus",
    title: {
      en: "Hermaphroditus",
      zh: "赫耳玛佛洛狄托斯"
    },
    originalName: "Ἑρμαφρόδιτος",
    alias: {
      en: ["The Double-Sexed Deity", "Hermaphroditus of Caria"],
      zh: ["雌雄同体之神", "双性水神"]
    },
    region: {
      en: "Caria (Ancient Asia Minor) & Athens (Greece)",
      zh: "卡里亚地区（小亚细亚）与希腊雅典"
    },
    coordinates: [28.2166, 37.3333], // Halicarnassus
    locationPrecision: "Cultural Region",
    startYear: -400,
    endYear: 2026,
    periodLabel: {
      en: "Classical Antiquity to Present",
      zh: "古典时代至当代"
    },
    sourceCategory: "Textual Sources",
    sourceSubcategory: "Mythological Texts & Classical Sculpture",
    objectTypes: ["Mythological Figure", "Deity", "Artistic Image"],
    culturalMeanings: ["Border Body", "Sacred", "Artistic Image", "Taboo"],
    evidenceGrade: "A / B",
    interpretationRisks: ["Anachronistic Identity Projection", "Fragmentary Texts"],
    riskDetail: {
      en: "While Hermaphroditus is a direct mythological and artistic representation of intersexuality, ancient medical and religious interpretations of dual-gendered bodies differed greatly from modern intersex rights and medical definitions. He was worshipped as a deity of marriage and fertility, not categorized as a social marginality.",
      zh: "尽管该角色是古典神话和艺术中对“雌雄同体/间性”的直观呈现，但古代医学和宗教对双性身体的解读与现代“间性（Intersex）”的生物医学定义和人权框架大相径庭。在古希腊，他常作为婚姻和丰饶的庇护神受人崇拜，而非一种社会边缘身份。"
    },
    summary: {
      en: "A Greek mythological deity of dual-sex body, originating from the union of Hermes and Aphrodite, serving as a symbol of gender boundary-crossing and sacred embodiment.",
      zh: "希腊神话中融合了男女两性肉体特征的神祇，源自赫耳墨斯与阿芙洛狄忒之子的神话，是性别边界跨越与神圣肉身表达的经典象征。"
    },
    description: {
      en: "Hermaphroditus was the child of Hermes and Aphrodite. According to Ovid's *Metamorphoses*, he was born a remarkably handsome boy. The water nymph Salmacis fell in love with him and prayed to the gods that they should never be parted. Her prayer was answered, and their bodies were fused into one entity possessing both male and female primary characteristics. In ancient Greece, Hermaphroditus was worshipped as an minor deity, associated with marriage and creation. In Hellenistic and Roman art, the *Sleeping Hermaphroditus* sculpture became a sensation, creating a visual gaze that destabilized binary expectations. In contemporary scholarship, the figure is a key focus for studying classical gender representation, intersex visibility, and body hybridity.",
      zh: "赫耳玛佛洛狄托斯是信使之神赫耳墨斯与爱神阿芙洛狄忒的儿子。根据奥维德的《变形记》记载，他原本是一个容貌极俊美的少年，水仙女萨尔玛西斯对他一见钟情，在他入水洗澡时将其抱住并向神灵祈求两人永不分离。神灵听从了祈祷，将两人的身体熔为一体，形成了一个兼具男性与女性第二和第一性征的完整肉身。在古希腊宗教中，他被视作小神受人供奉，象征着男女婚姻和阴阳调和。在希腊化和罗马时期，著名雕塑《沉睡的赫耳玛佛洛狄托斯》通过精湛的石雕技艺展现了正面女性化乳房与背面男性下体的混合，极大地扰动了古典观众的视觉期待。他是酷儿理论中研究古典间性（Intersex）可见度和身体跨界的核心案例。"
    },
    references: {
      en: [
        "Ovid, 'Metamorphoses' (变形记), Book IV, Roman Empire.",
        "Lucilla de Arcangelis, 'The Sculpture of Hermaphroditus in Hellenistic Art', 2008.",
        "Lauren B. Plume, 'Intersexuality and Sacred Bodily Forms in Ancient Greek Religion', 2017."
      ],
      zh: [
        "奥维德，《变形记》卷四，罗马帝国时期。",
        "Lucilla de Arcangelis，《希腊化艺术中的赫耳玛佛洛狄托斯雕塑》（英文版），2008年。",
        "Lauren B. Plume，《古希腊宗教中的间性与神圣身体形态》（英文版），2017年。"
      ]
    }
  },
  {
    id: "entry_niankhkhnum",
    title: {
      en: "Niankhkhnum and Khnumhotep",
      zh: "尼安克克努姆与克努姆霍特普"
    },
    originalName: "Niankhkhnum & Khnumhotep",
    alias: {
      en: ["The Joined Brothers", "Tomb of the Manicurists"],
      zh: ["美发师双人墓", "同性祭司双子"]
    },
    region: {
      en: "Saqqara Necropolis, Ancient Egypt",
      zh: "古埃及萨卡拉陵墓区"
    },
    coordinates: [31.2197, 29.8713], // Saqqara, Egypt
    locationPrecision: "City (Historic)",
    startYear: -2400,
    endYear: -2350,
    periodLabel: {
      en: "Fifth Dynasty of Egypt (c. 2400 BCE)",
      zh: "古埃及第五王朝（约公元前2400年）"
    },
    sourceCategory: "Historical Documents",
    sourceSubcategory: "Imperial Chronicles & Records", // Will use matching taxonomies
    objectTypes: ["Historical Figures", "Historical Allusion"],
    culturalMeanings: ["Power Intimacy", "Ambiguity", "Taboo"],
    evidenceGrade: "A / B",
    interpretationRisks: ["Anachronistic Identity Projection", "Fragmentary Texts"],
    riskDetail: {
      en: "While their tomb displays unprecedented intimate iconographies (touching noses, holding hands) usually reserved for heterosexual couples in Egyptology, it remains heavily debated whether they were same-sex romantic partners, identical twins, or brothers. Modern labels must respect the ambiguity of Old Kingdom kinship and homosocial representation.",
      zh: "虽然他们的陵墓壁画展现了古埃及艺术中前所未有的亲昵动作（如碰鼻、牵手，这些动作在古埃及壁画中通常仅用于夫妻），但他们究竟是同性伴侣、同卵双胞胎还是兄弟，在埃及学界仍无定论。解释该条目时需尊重古王国时期亲属关系和同性社交表达的暧昧性。"
    },
    summary: {
      en: "Ancient Egyptian royal manicurists sharing a joint tomb with tomb paintings depicting unprecedented same-sex intimacy and physical closeness.",
      zh: "古埃及法老王室的美发/美甲总管，因两人合葬于同一墓穴，且壁画中描绘了古埃及艺术中罕见的同性碰鼻、牵手等极度亲昵画面而闻名。"
    },
    description: {
      en: "Niankhkhnum and Khnumhotep were royal manicurists and confidants of Pharaoh Nyuserre Ini during the Fifth Dynasty of Egypt. Discovered in 1964, their joint mastaba tomb at Saqqara displays scenes of exceptional closeness. They are depicted nose-to-nose—the closest form of contact allowed in Egyptian art, representing the merging of breath—and embracing, standing under a single cloak. In traditional Egyptian tombs, such representation was exclusively reserved for husbands and wives. In modern digital humanities and Egyptology, their tomb represents one of the earliest recorded examples of same-sex intimacy, showcasing how desire, companionship, and status were memorialized in the Old Kingdom.",
      zh: "尼安克克努姆与克努姆霍特普是古埃及第五王朝时期法老纽塞拉的王室美甲与美发总管。1964年，考古学家在萨卡拉发现了他们的联名马斯塔巴墓。墓穴壁画中描绘了两人非比寻常的亲密关系，画面中他们鼻尖紧贴（碰鼻礼，古埃及艺术中代表生命呼吸融合的最高亲昵动作），在同一件披风下相拥而立。在古埃及的丧葬传统中，这类画面在其他墓穴里仅用于夫妻合葬。在现代数字人文与性别史研究中，该墓穴被视为人类历史上最早的同性亲密关系的视觉记录之一，展示了古王国时期私人陪伴关系在死后世界中的不朽呈现。"
    },
    references: {
      en: [
        "Ahmed Moussa & Hartwig Altenmüller, 'Das Grab des Nianchchnum und Chnumhotep', 1977.",
        "Thomas A. Dowson, 'Archaeologists, Aesthetics and the Quester for Queer Egypt', World Archaeology, 2000.",
        "Greg Reeder, 'Same-sex Desire, Shared Death: The Case of Niankhkhnum and Khnumhotep', 2005."
      ],
      zh: [
        "Ahmed Moussa 与 Hartwig Altenmüller，《尼安克克努姆与克努姆霍特普之墓》（德文版），1977年。",
        "Thomas A. Dowson，《考古学家、美学与酷儿埃及的研究》（英文论文），《世界考古学》，2000年。",
        "Greg Reeder，《同性渴望，共同死亡：尼安克克努姆与克努姆霍特普的案例研究》（英文论文），2005年。"
      ]
    }
  },
  {
    id: "entry_david_jonathan",
    title: {
      en: "David and Jonathan",
      zh: "大卫与约拿单"
    },
    originalName: "דָּוִד וִיהוֹנָתָן",
    alias: {
      en: ["Love of David and Jonathan", "Covenant of Love"],
      zh: ["约拿单之爱", "大卫的哀歌"]
    },
    region: {
      en: "Kingdom of Israel, Jerusalem",
      zh: "古代以色列王国（耶路撒冷）"
    },
    coordinates: [35.2137, 31.7683], // Jerusalem
    locationPrecision: "City (Historic)",
    startYear: -1010,
    endYear: -970,
    periodLabel: {
      en: "Iron Age Levant (c. 1000 BCE)",
      zh: "古代黎凡特铁器时代（约公元前1000年）"
    },
    sourceCategory: "Textual Sources",
    sourceSubcategory: "Lyric Poetry",
    objectTypes: ["Historical Figures", "Historical Allusion", "Mythological Figure"],
    culturalMeanings: ["Power Intimacy", "Ambiguity", "Female Intimacy"],
    evidenceGrade: "B / C",
    interpretationRisks: ["Anachronistic Identity Projection", "Translation Disputes"],
    riskDetail: {
      en: "The narrative comes from the Hebrew Bible (Books of Samuel). Scholarly debates exist between reading their covenant as an ancient homoerotic relationship ('surpassing the love of women') versus a political and military alliance of loyalty. Translating their physical intimacy (kissing, weeping) requires acknowledging ancient Near Eastern homosocial expressions.",
      zh: "该叙事源自希伯来圣经《撒母耳记》。学术界对两人的盟约关系存在分歧：一派将其解读为超越异性情爱的同性爱恋（如大卫哀歌所言“你向我发的爱情奇妙非常，过于妇女的爱情”），另一派则认为这属于古代西亚社会中常见的政治与军事忠诚盟约。解释其身体接触（亲吻、哭泣）时需结合古代近东的社交语境。"
    },
    summary: {
      en: "A legendary covenant of love and deep intimacy between David, the future King of Israel, and Jonathan, the son of King Saul, recorded in the Hebrew Bible.",
      zh: "希伯来圣经中记载的古代以色列未来君主大卫与扫罗王之子约拿单之间，跨越生死、超越妇女之爱的深厚盟约与挚爱故事。"
    },
    description: {
      en: "The relationship between David and Jonathan is recorded in the biblical Books of Samuel. Jonathan, recognizing David's valor, instantly bonded with him, establishing a covenant. Scripture states that 'Jonathan loved him as his own soul.' They sealed this bond with physical embraces, tears, and Jonathan stripping himself of his royal robe and armor to dress David. After Jonathan was killed in battle, David composed a tragic laments, singing: 'Your love to me was wonderful, passing the love of women.' In modern literary and theological hermeneutics, this relationship is a key text for studying ancient Near Eastern gender roles, homosocial covenants, and historic same-sex affection.",
      zh: "大卫与约拿单的挚友与深情记载于《撒母耳记》中。扫罗王之子约拿单在目睹年轻大卫的勇武后，与他建立了生死相许的盟约，经文写道“约拿单爱大卫，如同爱自己的性命”。他们多次亲吻、抱头痛哭，约拿单甚至剥下自己的外衣、战衣、军装与佩刀赠予大卫。约拿单战死后，大卫作了著名的哀歌，恸哭道：“我兄约拿单哪，我为你悲伤！我甚爱你！你向我发的爱情奇妙非常，过于妇女的爱情。”在现代酷儿神学和文学阐释中，这段关系是研究古代近东男性情谊、灵肉盟约以及旧约酷儿解读的重要文本。"
    },
    references: {
      en: [
        "Hebrew Bible, First Book of Samuel (Chapters 18, 20) & Second Book of Samuel (Chapter 1).",
        "Martti Nissinen, 'Homoeroticism in the Biblical World: A Historical Perspective', 1998.",
        "Jonathan Kirsch, 'King David: The Real Life of the Man Who Ruled Israel', 2000."
      ],
      zh: [
        "希伯来圣经，《撒母耳记上》第十八、二十章及《撒母耳记下》第一章。",
        "Martti Nissinen，《圣经世界中的同性情欲：历史视角》（英文版），1998年。",
        "Jonathan Kirsch，《大卫王：统治以色列的男人的真实生活》（英文版），2000年。"
      ]
    }
  },
  {
    id: "entry_galli_priests",
    title: {
      en: "Galli Priests of Cybele",
      zh: "库柏勒的加利祭司"
    },
    originalName: "Galli (Galloi)",
    alias: {
      en: ["Eunuch Priests of Cybele", "Phrygian Galli"],
      zh: ["阉人祭司", "加利", "狂喜女装祭司"]
    },
    region: {
      en: "Phrygia (Asia Minor) & Ancient Rome",
      zh: "小亚细亚弗里吉亚与古罗马帝国"
    },
    coordinates: [31.5833, 39.3833], // Phrygia / Pessinus region (modern Turkey)
    locationPrecision: "Cultural Region",
    startYear: -205,
    endYear: 390,
    periodLabel: {
      en: "Hellenistic and Roman Empire Periods",
      zh: "希腊化与罗马帝国时期（公元前3世纪至公元4世纪）"
    },
    sourceCategory: "Historical Documents",
    sourceSubcategory: "Imperial Chronicles & Records",
    objectTypes: ["Social Identity", "Deity"],
    culturalMeanings: ["Border Body", "Sacred", "Taboo", "Transgression"],
    evidenceGrade: "A / B",
    interpretationRisks: ["Anachronistic Identity Projection", "Power Asymmetry in Records"],
    riskDetail: {
      en: "Most records of the Galli come from elite Roman authors (like Juvenal, Augustine) who viewed them with xenophobia, moral panic, and gender bias, pathologizing their voluntary self-castration and cross-dressing. They cannot be directly equated with modern transgender identities without noting their ritual, non-secular context.",
      zh: "关于加利祭司的大多数记录均出自古罗马精英男权作家（如尤维纳利斯、奥古斯丁等）。罗马文献常以排外、道德恐慌和性别偏见来评判他们的女装和自阉行为。将他们等同于现代“跨性别”时，需注意其处于非世俗的祭祀与萨满狂喜仪式语境。"
    },
    summary: {
      en: "Eunuch priests of the Phrygian mother goddess Cybele who wore feminine attire, grew long hair, and castrated themselves in ecstatic rituals.",
      zh: "古罗马引入的小亚细亚大地女神库柏勒的祭司群体。他们通过狂欢仪式自阉，在日常生活中留长发、化浓妆并穿着女装，挑战了罗马社会的性别底线。"
    },
    description: {
      en: "The Galli were self-castrated priests of the Anatolian mother goddess Cybele (known to Romans as Magna Mater). In 205 BCE, Rome officially adopted the cult during the Punic Wars. During the festival of Dies Sanguinis (Day of Blood), initiates worked themselves into a religious ecstasy through wild dancing and music, culminating in voluntary self-castration. They wore elaborate feminine garments, makeup, and yellow veils, referring to themselves in the feminine grammar. While citizens of Rome initially mocked and legally barred Roman citizens from joining due to gender taboos, the Galli remained a vital, sacred gender-transgressing institution in the Roman Empire for six centuries, illustrating the complex intersection of state religion and gender-boundary crossing.",
      zh: "加利（Galli）是起源于小亚细亚半岛的大地女神库柏勒（罗马人称“众神之母”）的自阉祭司。公元前205年第二次布匿战争期间，罗马人根据神谕引入了这一信仰。在名为“流血日”（Dies Sanguinis）的祭祀仪式中，信徒在狂热的音乐与旋转舞蹈中达到宗教狂喜状态，并用利刃进行自阉。此后，他们终身留长发、化浓妆、穿着艳丽的女性祭司服饰并用女性代词自称。虽然罗马共和国最初因性别禁忌立法禁止罗马公民成为加利，但在帝国时期，这一性别越界、身份模糊的群体作为国家宗教的一部分存在了六百年之久，成为了古典时代跨性别肉身与神圣仪式交织的典型案例。"
    },
    references: {
      en: [
        "Catullus, 'Carmina' (Poem 63), Late Roman Republic.",
        "Mary Beard, 'The Roman Triumph', Harvard University Press, 2007.",
        "Will Roscoe & Stephen O. Murray, 'Islamic Homosexualities: Culture, History, and Literature', 1997 (contextualizing Near Eastern gender variance)."
      ],
      zh: [
        "卡图卢斯，《诗集》第63首（描绘加利祭司阿提斯的自阉狂喜），古罗马。",
        "Mary Beard，《罗马的凯旋》（英文版），哈佛大学出版社，2007年。",
        "Stephen O. Murray 与 Will Roscoe，《伊斯兰同性恋：文化、历史与文学》，1997年（内含近东及地中海阉人祭司历史背景分析）。"
      ]
    }
  },
  {
    id: "entry_mulan",
    title: {
      en: "Hua Mulan",
      zh: "花木兰"
    },
    originalName: "木兰",
    alias: {
      en: ["Fa Mulan", "Mulan Allusion"],
      zh: ["华木兰", "木兰姑娘", "巾帼英雄"]
    },
    region: {
      en: "Northern Wei State, Northern China",
      zh: "中国北魏（黄河流域）"
    },
    coordinates: [112.5492, 37.8570], // Taiyuan (representing Northern Wei region)
    locationPrecision: "Cultural Region",
    startYear: 386,
    endYear: 534,
    periodLabel: {
      en: "Northern Wei Dynasty (4th - 6th Century CE)",
      zh: "北朝北魏时期（公元4至6世纪）"
    },
    sourceCategory: "Textual Sources",
    sourceSubcategory: "Folklore & Folk Beliefs",
    objectTypes: ["Literary Character", "Historical Allusion"],
    culturalMeanings: ["Performative Disguise", "Ambiguity", "Transgression", "Reclaiming"],
    evidenceGrade: "C",
    interpretationRisks: ["Anachronistic Identity Projection", "Legend and Modern Reinterpretation Mixed"],
    riskDetail: {
      en: "Mulan is a folk legend recorded in ballad form, not an empirically verified historical figure. Applying modern transgender or queer labels overlooks the Confucian themes of filial piety and the temporary, state-mandated nature of her cross-dressing in the original northern ballad.",
      zh: "木兰是民歌《木兰诗》记录的文学与民间传说形象，并无确凿史实证明其存在。用现代跨性别或同性恋身份定义她，会遮蔽南北朝北朝民歌中关于孝道、代父从军以及“兵罢还朝、重着女装”的临时性别变装语境。"
    },
    summary: {
      en: "A legendary Northern Dynasties figure who disguised herself as a man to take her ailing father's place in the conscription army for twelve years.",
      zh: "北朝民歌传说中女扮男装、替父从军十二载的巾帼英雄，是中国文学中关于性别伪装与社会角色跨界最著名的符号之一。"
    },
    description: {
      en: "Hua Mulan is a legendary folk heroine originating from the Northern Dynasties period. Her story was first recorded in the anonymous *Ballad of Mulan* (Mulan Shi). Confronted with conscription lists targeting her elderly father, she buys a horse and military gear to ride to battle disguised as a man. For twelve years, she serves in the army alongside male soldiers without her gender being discovered. When offered a government post, she declines and requests only to return home, where she surprises her comrades by putting on her feminine makeup and clothes. The final lines of the poem—discussing how a running hare's gender cannot be distinguished ('how can you tell if I am male or female?')—established Mulan as a classic cultural symbol of gender-fluidity, drag performance, and the social construction of gender roles.",
      zh: "花木兰是中国北朝民歌传说中的传奇人物，其故事最早载于乐府民歌《木兰诗》。故事讲述北魏时期，军帖下达，木兰因父亲年老无长兄，毅然市鞍马，女扮男装代父从军。她在军旅中征战十二载，与男兵同行同宿，却无人识破其女性身份。胜利还朝后，木兰拒绝了朝廷的官职，只求归家。当她“脱我战时袍，着我旧时裳”，以贴花黄的女儿装扮出现时，同袍大为惊愕。诗歌末尾著名的“双兔傍地走，安能辨我是雄雌”不仅揭示了性别的社会表演特征，也奠定了木兰在中国文化中作为性别变装、身份颠覆与性别流动的标志性文学符号。"
    },
    references: {
      en: [
        "Anonymous, 'The Ballad of Mulan' (木兰诗), Yuefu Folk Songs, c. 6th Century CE.",
        "Louise Edwards, 'Men and Women in Qing China: Gender in The Red Chamber Dream', 1994 (discussing historical cross-dressing tropes).",
        "Maxine Hong Kingston, 'The Woman Warrior', 1976 (modern feminist/diasporic reclaiming)."
      ],
      zh: [
        "无名氏，《木兰诗》（郭茂倩《乐府诗集》卷二十五收录），南北朝时期。",
        "王国维，《宋元戏曲史》关于女扮男装杂剧研究，1915年。",
        "Maxine Hong Kingston，《女勇士》（英文版），1976年（现代华裔文学对木兰符号的女性主义重塑）。"
      ]
    }
  },
  {
    id: "entry_hijra",
    title: {
      en: "Girish / The Hijra Community",
      zh: "希吉拉与折衷神格"
    },
    originalName: "Hijra (Third Gender)",
    alias: {
      en: ["Kinnar", "Aravani", "Shiva's Ardhanarishvara"],
      zh: ["第三性别", "海吉拉", "折衷双性神格", "半女之主"]
    },
    region: {
      en: "Northern India & South Asia",
      zh: "南亚印巴地区（德里与北方邦）"
    },
    coordinates: [77.2090, 28.6139], // New Delhi
    locationPrecision: "Cultural Region",
    startYear: -800,
    endYear: 2026,
    periodLabel: {
      en: "Ancient Vedic Period to Contemporary era",
      zh: "古吠陀时期至今"
    },
    sourceCategory: "Cultural Memory",
    sourceSubcategory: "Folklore & Folk Beliefs",
    objectTypes: ["Social Identity", "Deity", "Mythological Figure"],
    culturalMeanings: ["Sacred", "Guardian", "Taboo", "Border Body"],
    evidenceGrade: "B / C / D",
    interpretationRisks: ["Anachronistic Identity Projection", "Power Asymmetry in Records"],
    riskDetail: {
      en: "The Hijras represent a complex social, spiritual, and biological 'third gender' status with deep roots in Hindu mythology (such as Rama's forest exile and Shiva's half-female form). Modern Western terms like 'transgender women' or 'eunuchs' fail to capture their sacred ritual blessing roles and their historical criminalization under British colonial laws (Criminal Tribes Act of 1871).",
      zh: "“希吉拉”是南亚独特的“第三性别”社群，融合了生理互性、跨性别认同与宗教精神色彩，其根源深植于印度教神话（如湿婆的“半女之主”化身及罗摩去林中隐居的故事）。将其生硬套用现代“跨性别女性”或殖民时期的“阉人”标签，会忽视他们作为神圣祝祷者的角色，以及他们在1871年英国殖民刑法下被定罪迫害的历史。"
    },
    summary: {
      en: "A recognized third gender community in South Asia, holding sacred ritual duties of blessing and curse, historically rooted in Hindu myth and epic traditions.",
      zh: "南亚地区被法律与社会公认的“第三性别”社群，拥有主持新生儿和婚礼祝祷的神圣宗教职责，其神格与社会角色根植于印度两大史诗与神话。"
    },
    description: {
      en: "The Hijras are a traditional community in India, Pakistan, and Bangladesh, consisting of individuals assigned male at birth who adopt feminine roles, dress in saris, and undergo ritual castration. Their cultural history is tied to the ancient epics *Ramayana* and *Mahabharata*. In the Ramayana, Rama orders his followers to return to the city; the men and women leave, but the intersex/gender-variant people remain in the forest, earning Rama's blessing to grant blessings at births and weddings. The Hindu deity Shiva also embodies this hybridity as Ardhanarishvara (half-female, half-male Lord). While historically respected as keepers of spiritual power under Mughal rule, they were criminalized as 'vagrancy tribes' by British colonizers in 1871. In 2014, the Supreme Court of India officially recognized them as a legal 'Third Gender,' bridging ancient mythological authority with modern civil rights.",
      zh: "希吉拉是流行于印度、巴基斯坦和孟加拉等国的传统“第三性别”社群，主要由出生时生理为男性但以女性身份生活、穿着纱丽、并经历自愿阉割仪式的人组成。该群体的社会与精神起源根植于印度古代两大史诗《罗摩衍那》和《摩诃婆罗多》。在《罗摩衍那》中，罗摩离国隐居，命令男女侍从返回，而一群非男非女的信徒驻足不走在森林中默默等候十四年。罗摩深受感动，赐予他们为新生儿和新婚夫妇祝祷的特权。此外，湿婆神的“半女之主（Ardhanarishvara）”化身也是他们神圣性的源泉。在莫卧儿王朝时期，希吉拉曾担任宫廷信臣。尽管在1871年被英国殖民者立法列为“犯罪部落”并剥夺尊严，2014年印度最高法院正式裁决承认其为法定的“第三性别”，恢复了其古老神话地位与现代公民权。"
    },
    references: {
      en: [
        "Serena Nanda, 'Neither Man nor Woman: The Hijras of India', 1990.",
        "Anuja Agrawal, 'Gendered Bodies, Sacred Spaces: The Hijra Community in South Asia', 1997.",
        "Supreme Court of India, 'National Legal Services Authority v. Union of India' (Third Gender Recognition Case), 2014."
      ],
      zh: [
        "Serena Nanda，《非男非女：印度的海吉拉社群》（英文版），1990年。",
        "Anuja Agrawal，《性别化的身体与神圣空间：南亚海吉拉社群研究》，1997年。",
        "印度最高法院，国家法律服务局诉印度联邦案（第三性别法定承认案判决书），2014年。"
      ]
    }
  },
  {
    id: "entry_chevalier_deon",
    title: {
      en: "Chevalier d'Eon",
      zh: "德·埃翁骑士"
    },
    originalName: "Charles-Geneviève d'Éon de Beaumont",
    alias: {
      en: ["Mademoiselle d'Eon", "Charlotte d'Eon"],
      zh: ["埃翁小姐", "夏洛特·德·埃翁"]
    },
    region: {
      en: "Versailles (France) & London (England)",
      zh: "法国凡尔赛宫廷与英国伦敦"
    },
    coordinates: [2.1204, 48.8049], // Versailles, France
    locationPrecision: "City",
    startYear: 1728,
    endYear: 1810,
    periodLabel: {
      en: "Age of Enlightenment (18th Century CE)",
      zh: "欧洲启蒙时代（18世纪）"
    },
    sourceCategory: "Historical Documents",
    sourceSubcategory: "Diplomatic Chronicles & Memoirs",
    objectTypes: ["Historical Figures"],
    culturalMeanings: ["Performative Disguise", "Ambiguity", "Transgression"],
    evidenceGrade: "A",
    interpretationRisks: ["Anachronistic Identity Projection", "Legend and Modern Reinterpretation Mixed"],
    riskDetail: {
      en: "D'Eon lived the first half of their life as a man (serving as a diplomat and soldier) and the second half as a woman. Their gender transition was officially recognized by the French Crown, though heavily tied to political agreements and speculative bets in London. Applying modern definitions of 'transgender' requires caution regarding the diplomatic espionage and social limitations of the 18th century.",
      zh: "埃翁骑士前半生以男性身份生活（担任法国外交官与龙骑兵军官），后半生以女性身份生活（其女性身份得到了法国国王路易十六的官方认可，但也受到外交协议的限制）。将其直接等同于现代“跨性别者”时，需结合18世纪宫廷地缘政治、间谍情报活动以及伦敦社会的博彩赌注背景来进行批判性理解。"
    },
    summary: {
      en: "An 18th-century French diplomat, spy, and soldier who successfully transitioned from a male identity to a female identity officially recognized by the French Crown.",
      zh: "18世纪法国著名的外交官、间谍与龙骑兵军官。他前半生以男性面貌示人，后半生以法国王室官方公开承认的女性身份度过余生，是欧洲历史中最著名的跨性别先驱之一。"
    },
    description: {
      en: "Charles-Geneviève d'Éon de Beaumont, known as the Chevalier d'Eon, was a French diplomat and spy who successfully integrated into the court of Empress Elizabeth of Russia in female disguise during the Seven Years' War. After serving as a decorated dragoon officer in male uniform, d'Eon was appointed as a minister in London. By the 1770s, intense speculation arose in London regarding d'Eon's gender, leading to high-stakes gambling bets. In 1777, as part of a treaty with the French Crown, d'Eon returned to France under the condition of dressing permanently in women's clothing, which they did for the remaining 33 years of their life, even competing in public fencing matches in long dresses. Upon d'Eon's death in 1810, medical examiners confirmed male anatomy but noted feminine physical traits. D'Eon's legacy inspired the early English term 'Eonism' for cross-dressing and remains a landmark case of gender transition under early modern state authority.",
      zh: "夏尔-德·埃翁·德·博蒙特（通称德·埃翁骑士）是法国外交官兼间谍，曾在七年战争期间女扮男装渗透入俄国女皇伊丽莎白的宫廷。此后，他作为法国龙骑兵军官英勇负伤立功，并被派往伦敦担任公使。1770年代，伦敦社会对埃翁的真实性别爆发了巨大的猜测热潮，博彩交易所甚至为此开出了巨额赌注。1777年，在与法王路易十六达成的一项归国政治协议中，王室官方承认其为女性，前提是她必须永久穿着女性服饰。埃翁接受了这一条件，并在余生的33年中完全以女装示人，甚至穿着拖地长裙参加公开的击剑比赛。1810年埃翁去世后，尸检确认其拥有男性生理特征，但也伴有女性化形体特征。她的生平启发了现代早期性学研究中指代异装的词汇“埃翁主义（Eonism）”，是欧洲历史上由国家权力和契约共同承认性别转换的重要案例。"
    },
    references: {
      en: [
        "Gary Kates, 'Monsieur d'Eon Is a Woman: A Tale of Political Intrigue and Sexual Masquerade', 1995.",
        "Simon Burrows, 'The Queer History of the Chevalier d'Eon', Journal of History, 2006.",
        "Edna Nixon, 'Royal Spy: The Strange Case of the Chevalier D'Eon', 1965."
      ],
      zh: [
        "Gary Kates，《埃翁先生是个女人：关于政治阴谋与性别变装的故事》（英文版），1995年。",
        "Simon Burrows，《德·埃翁骑士的酷儿历史》（英文论文），2006年。",
        "Edna Nixon，《皇家间谍：德·埃翁骑士的奇特案例》（英文版），1965年。"
      ]
    }
  }
];
