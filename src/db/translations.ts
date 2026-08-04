export interface LocalizedString {
  en: string;
  zh: string;
}

export const UI_TRANSLATIONS: Record<string, LocalizedString> = {
  brandSubtitle: {
    en: "A SPATIOTEMPORAL ARCHIVE OF QUEER FIGURES ACROSS CULTURES",
    zh: "跨越文化与时空的酷儿形象数字档案"
  },
  tabMap: { en: "Globe Map", zh: "时空地球" },
  tabArchive: { en: "Browse Cards", zh: "浏览卡片" },
  tabSubmit: { en: "Contribute", zh: "开放投稿" },
  tabReview: { en: "Review Queue", zh: "审核队列" },
  tabAbout: { en: "Guidelines & About", zh: "原则与关于" },
  searchPlaceholder: { en: "Search archive entries...", zh: "搜索档案记录..." },
  curatorialFilters: { en: "Curatorial Filters", zh: "策展式筛选" },
  sourceCategoriesTitle: { en: "Source Categories", zh: "文献来源大类" },
  culturalMeaningsTitle: { en: "Cultural Meanings", zh: "文化意义标签" },
  objectTypesTitle: { en: "Object Types", zh: "对象类型分类" },
  resultsCount: { en: "Showing {num} entries", zh: "共显示 {num} 个条目" },
  noRecords: { en: "No records found matching filters.", zh: "未找到符合当前筛选条件的条目的记录。" },
  historicalEpoch: { en: "Temporal Epoch", zh: "历史纪元时空" },
  presentLabel: { en: "Present", zh: "当代" },
  detailGeographic: { en: "Geographic Origin", zh: "地理起源" },
  detailGrade: { en: "Evidence Grade", zh: "证据分级" },
  detailEpoch: { en: "Epoch Period", zh: "历史时期" },
  detailSource: { en: "Source System", zh: "文献来源" },
  detailSummaryTitle: { en: "Summary Description", zh: "摘要说明" },
  detailMeaningsTitle: { en: "Cultural Meanings", zh: "文化意义" },
  detailRisksTitle: { en: "Interpretive Risks", zh: "历史解释风险提示" },
  detailSourcesTitle: { en: "Archival & Literary Sources", zh: "参考与文献来源" },
  guidelinesTitle: { en: "Guidelines & Principles", zh: "策展指南与伦理原则" },
  guidelinesSubtitle: { en: "Underlying frameworks of the spatiotemporal archive", zh: "时空档案系统的底层学术与伦理框架" },
  guidelinesSec1Title: { en: "1. Retrospective Labeling & The Ethics of Identity", zh: "1. 追溯性标签与身份的伦理" },
  guidelinesSec1Text: {
    en: "The Queer Archive documents \"queer figures\" without boxing them into static modern categories (e.g. gay, lesbian, trans). We focus on images, narratives, and characters representing fluid bodies, desires, and relationships as they manifested in local histories, literature, and myths. Applying contemporary labels to figures like Sappho or Emperor Ai often misrepresents their original social structures. Therefore, the archive uses <strong>Cultural Meanings</strong> (e.g., <em>transgression</em>, <em>sacredness</em>, <em>favoritism</em>, <em>taboo</em>) instead of identity checkboxes.",
    zh: "本档案记录“酷儿形象”时，避免将其强行归入现代固定的身份标签（如男同性恋、女同性恋、跨性别）。我们关注的是在历史、文学和神话中显影的非规范性别、身体、欲望和亲密关系。直接用现代词汇定义萨福或哀帝往往会误读古人的社会权力结构。因此，本站采用<strong>文化意义</strong>（如：<em>越界</em>、<em>神圣化</em>、<em>宠幸</em>、<em>禁忌</em>）代替身份复选框。"
  },
  guidelinesSec2Title: { en: "2. Evidence Grading System", zh: "2. 证据等级分级系统" },
  guidelinesSec2Text: {
    en: "A global crowdsourced archive must differentiate between historical text, oral traditions, and modern artistic reinterpretation. We categorize records into four distinct tiers:",
    zh: "作为一个开放投稿系统，必须明确区分严格史实、民间传说和现代再诠释。我们设定了四级证据体系："
  },
  gradeTableHeaderGrade: { en: "Grade", zh: "等级" },
  gradeTableHeaderDef: { en: "Definition & Standards", zh: "定义与学术标准" },
  gradeATitle: { en: "Grade A", zh: "A 级" },
  gradeADef: {
    en: "<strong>Strictly Documented:</strong> Original primary sources, legal scrolls, contemporary imperial logs, or direct archeological inscriptions exist and are supported by robust academic research.",
    zh: "<strong>史料明确：</strong> 存在原始出土文献、法案档案、碑铭、同时代历史记载或极为稳定的学术实证论证支持。"
  },
  gradeBTitle: { en: "Grade B", zh: "B 级" },
  gradeBDef: {
    en: "<strong>Adequately Researched:</strong> Primary sources are limited or fragmented, but a stable secondary academic consensus or peer-reviewed literature supports the interpretation.",
    zh: "<strong>研究充分：</strong> 原始史料较少或有残缺，但已有较稳定的同行评议二手学术讨论支撑其酷儿阅读可能。"
  },
  gradeCTitle: { en: "Grade C", zh: "C 级" },
  gradeCDef: {
    en: "<strong>Local Myth / Folklore:</strong> Oral traditions, local religious practices, village legends, and folklore that represent queer characters but lack rigid empirical documentation.",
    zh: "<strong>地方传说/口述传统：</strong> 来源自民间神话、口头文学、地方志野史、庙宇民俗，不作为严格历史事实对待，但极具文化保存价值。"
  },
  gradeDTitle: { en: "Grade D", zh: "D 级" },
  gradeDDef: {
    en: "<strong>Modern Reinterpretation:</strong> Figures who were not historically or textually documented as queer but have been actively reclaimed, re-activated, or celebrated in modern queer art, rights movements, and pop culture.",
    zh: "<strong>现代再阐释：</strong> 该对象在古代或原始文本中未必以同性情欲/性别越界身份出现，但被现代艺术、酷儿运动和现代文学重新阐释和激活为符号。"
  },
  guidelinesSec3Title: { en: "3. Interpretive Risks", zh: "3. 解释风险系统" },
  guidelinesSec3Text: {
    en: "Every historical record carries a risk of distortion. Submissions must acknowledge these issues explicitly:",
    zh: "每一条文献在进入现代视野时都存在解释的偏差风险，投稿必须诚实地标注可能存在的局限："
  },
  risk1Title: { en: "Anachronistic Identity Projection", zh: "现代身份投射" },
  risk1Def: {
    en: "Retrospectively treating ancient homosocial or power-intimacy bonds as modern exclusive sexual orientations.",
    zh: "强行以现代身份归类去裁剪古代的同性社交、皇权男色或政治依附关系。"
  },
  risk2Title: { en: "Asymmetric Documentation", zh: "文献权力偏见" },
  risk2Def: {
    en: "Relying on records created by hostile institutional agents (e.g., inquisitorial logs, medical texts classifying figures as pathological) without noting their biased provenance.",
    zh: "过度依赖由规训者（如宗教裁判所、污名化刑律、医学病理档案）撰写的单向记录而未指明其敌意偏见。"
  },
  risk3Title: { en: "Textual Fragmentation", zh: "文本残缺断片" },
  risk3Def: {
    en: "Reconstructing extensive relationships or identities from highly fragmented remnants (e.g., Sappho's poetry fragments).",
    zh: "仅依据几句残诗或断篇残语（如萨福的残篇）过度推演宏大的亲密关系体系与个人倾向形态。"
  },
  aboutTitle: { en: "About the Project", zh: "关于本项目" },
  aboutText1: {
    en: "<strong>The Queer Archive</strong> is a global digital humanities project. It bridges historical map-making, timeline visualizations, and crowdsourced archival systems to preserve the footprints of non-normative gender, intimacy, and bodies across time and cultures.",
    zh: "<strong>The Queer Archive (酷儿档案)</strong> 是一项全球数字人文协作项目。它通过时空三维地球、动态时间刻度与协作标注系统，记录和呈现人类漫长文明中关于非规范身体、欲望与亲密关系的文化记忆。"
  },
  aboutText2: {
    en: "By establishing a clear cartographic representation of these figures, the project demonstrates that queer narratives are not localized anomalies or modern inventions, but permanent threads woven throughout global human civilization.",
    zh: "通过将这些形象放回它们所处的时空 and 文献体系中，本项目致力于证明：酷儿叙事绝非现代发明的特例，而是千百年来交织在全球人类社会图景中的常态纹理。"
  },
  formHeader: { en: "Add to the Archive", zh: "提交新档案条目" },
  formSubheader: { en: "HELP DOCUMENT GLOBAL QUEER CULTURAL MEMORY", zh: "协助我们记录全球酷儿历史与文化记忆" },
  formAlert: {
    en: "<strong>Submission Standard Warning:</strong> This archive records figures from history, myth, literature, folklore, and institutional records. We do not apply rigid modern identity categories retrospectively, and require at least one verified bibliographical reference.",
    zh: "<strong>投稿规范说明：</strong> 本档案收录历史、神话、文学及民间传说人物。严禁在无依据情况下套用现代标签，且每条投稿必须提供至少一个可查证的参考文献来源。"
  },
  formLabelTitle: { en: "Figure / Entry Title *", zh: "条目/人物标题 *" },
  formLabelRegion: { en: "Geographical Origin *", zh: "地理起源地 *" },
  formLabelPeriod: { en: "Historical Period/Epoch *", zh: "历史时期 *" },
  formLabelSource: { en: "Primary Source System *", zh: "主要文献来源系统 *" },
  formLabelGrade: { en: "Suggested Evidence Grade", zh: "建议证据等级" },
  formLabelDesc: { en: "Summary Description (150-300 words) *", zh: "摘要说明 (150-300字) *" },
  formLabelRefs: { en: "Bibliographical References (Books, Articles, Primary Texts) *", zh: "文献参考资料来源 (书籍、论文、古籍卷册) *" },
  formSubmitBtn: { en: "Submit Entry to Review Queue", zh: "提交条目至审核队列" },
  epochAll: { en: "All Time", zh: "全部历史" },
  epochGreece: { en: "Archaic Greece", zh: "古希腊时期" },
  epochHan: { en: "Western Han", zh: "汉代典故" },
  epochQing: { en: "Qing to Present", zh: "明清至当代" },
  themesTitle: { en: "Curated Themes", zh: "主题策展" },
  roleContributor: { en: "Contributor View", zh: "投稿者视角" },
  roleReviewer: { en: "Reviewer / Editor", zh: "审核者 / 编辑" },
  mySubmissions: { en: "My Submissions", zh: "我的投稿记录" },
  moderationQueue: { en: "Platform Review Queue", zh: "平台待审核队列" },
  mySubmissionsDesc: { en: "Track the review status and editor comments of your submitted entries.", zh: "跟踪您提交条目的审核状态以及编辑意见反馈。" },
  moderationQueueDesc: { en: "Moderate pending submissions, edit metadata to maintain academic rigor, and publish to the live site.", zh: "审核平台待决条目，修改元数据以保持学术严谨性，并发布至时空地球。" },
  analTitleGrades: { en: "Evidence Grades", zh: "证据级别分布" },
  analTitleSources: { en: "Source Materials", zh: "文献来源大类" },
  analTitleRegions: { en: "Geographic Scope", zh: "地理分布范围" },
  regStatCount: { en: "Active Entries:", zh: "区域活跃条目:" },
  regStatSpan: { en: "Temporal Span:", zh: "时间跨度:" },
  regStatSources: { en: "Sources Breakdown", zh: "文献来源构成" },
  regStatEntries: { en: "Representative Figures", zh: "代表人物及条目" },
  btnExamine: { en: "Examine Full Records", zh: "调阅详细档案" },
  travelPlay: { en: "Play", zh: "播放" },
  travelPause: { en: "Pause", zh: "暂停" },
  travelReset: { en: "Reset", zh: "重置" },
  travelLabel: { en: "Time Travel", zh: "历史长河播放器" },
  needsRevisionBadge: { en: "Needs Revision", zh: "需要修改" },
  disputedBadge: { en: "Disputed", zh: "存在争议" },
  resubmitBtn: { en: "Edit & Resubmit", zh: "修改并重新提交" },
  commentsLabel: { en: "Reviewer Feedback:", zh: "审核反馈意见:" },
  levelNovist: { en: "Novice Archivist", zh: "见习记录员" },
  levelVerified: { en: "Verified Contributor", zh: "认证贡献者" },
  levelCurator: { en: "Honorary Curator", zh: "名誉策展人" },
  totalSubmissions: { en: "Total Submissions", zh: "总提交条目" },
  publishedSubmissions: { en: "Approved & Live", zh: "已审核发布" },
  regionsSubmissions: { en: "Regions Explored", zh: "已贡献区域" },
  detailAlias: { en: "Aliases", zh: "历史别名" },
  detailPrecision: { en: "Location Precision", zh: "地理定位精度" },
  detailTypes: { en: "Object Types", zh: "条目对象类型" },
  detailCurator: { en: "Archival Curator", zh: "文献建档人" },
  detailRelatedTitle: { en: "Related Records", zh: "关联历史档案" },
  noRelatedRecords: { en: "No related records found.", zh: "未找到关联的其它档案。" },
  subtabGrid: { en: "Card Grid", zh: "网格卡片" },
  subtabChronology: { en: "Chronological Stream", zh: "年代编年史" },
  subtabSources: { en: "Sources Catalog", zh: "馆藏目录" },
  subtabKeywords: { en: "Curatorial Keywords", zh: "策展释义词典" },
  btnInsights: { en: "Region Insights", zh: "区域分析看板" },
  insightsTitle: { en: "Region Analysis Dashboard", zh: "区域学术分析仪表盘" },
  insightsSubtitle: { en: "Historical & curatorial breakdown for {region}", zh: "{region} 历史形象与文献构成深度剖析" },
  insightsLabelTotal: { en: "Total Figure Records", zh: "区域条目文献数" },
  insightsLabelSpan: { en: "Temporal Span", zh: "时间跨度范围" },
  insightsLabelPrimary: { en: "Primary Source", zh: "主要文献来源" },
  insightsChartTitleTemporal: { en: "Temporal Distribution", zh: "历史纪元频次分布" },
  insightsChartTitleMeanings: { en: "Cultural Meanings Breakdown", zh: "文化意义分类占比" },
  insightsChartTitleSources: { en: "Sources Breakdown", zh: "文献来源大类占比" },
  campaignHeader: { en: "Monthly Curatorial Campaign", zh: "月度主题策展征集" },
  campaignTitle: { en: "Mythological Border Bodies & Deities", zh: "神话中的边界身体与双性神祇" },
  campaignDesc: {
    en: "We are actively seeking entries documenting mythological, folklore, or religious figures that embody gender transformations, intersex traits, or dual-gender roles. Submitting under this theme auto-fills presets.",
    zh: "我们本月重点征集记录神话、民间传说或宗教信仰中体现性别转换、双性化特征或超越规范身体越界的形象。投递此主题可一键填充表单预设值与标签。"
  },
  campaignApplyBtn: { en: "Apply Campaign Preset", zh: "一键投递此主题" },
  campaignToastApplied: { en: "Campaign preset applied! Feel free to fill in details.", zh: "已成功激活本月主题征集预设值！请补充条目细节。" }
};

export const TAXONOMY_TRANSLATIONS: Record<string, LocalizedString> = {
  "Historical Documents": { en: "Historical Documents", zh: "历史文献" },
  "Textual Sources": { en: "Textual Sources", zh: "文本材料" },
  "Cultural Memory": { en: "Cultural Memory", zh: "文化记忆" },
  "Folklore & Folk Beliefs": { en: "Folklore & Folk Beliefs", zh: "民间传说与民俗信仰" },
  "Imperial Chronicles & Records": { en: "Imperial Chronicles & Records", zh: "帝王编年史与正史记载" },
  "Lyric Poetry": { en: "Lyric Poetry", zh: "抒情诗歌" },
  "Dynastic Histories & Classical Drama": { en: "Dynastic Histories & Classical Drama", zh: "正史列传与古典戏剧" },
  "Mythological Texts & Classical Sculpture": { en: "Mythological Texts & Classical Sculpture", zh: "神话文献与古典雕塑" },
  "Historical Figures": { en: "Historical Figures", zh: "历史人物" },
  "Historical Allusion": { en: "Historical Allusion", zh: "历史典故" },
  "Deity": { en: "Deity", zh: "神格" },
  "Mythological Figure": { en: "Mythological Figure", zh: "神话人物" },
  "Modern Reinterpretation": { en: "Modern Reinterpretation", zh: "现代再阐释" },
  "Poet": { en: "Poet", zh: "诗人" },
  "Theatrical Image": { en: "Theatrical Image", zh: "戏剧表演形象" },
  "Sacred": { en: "Sacred", zh: "神圣化" },
  "Taboo": { en: "Taboo", zh: "禁忌" },
  "Guardian": { en: "Guardian", zh: "守护" },
  "Local Memory": { en: "Local Memory", zh: "地方记忆" },
  "Modern Re-activation": { en: "Modern Re-activation", zh: "现代再激活" },
  "Favoritism": { en: "Favoritism", zh: "宠幸" },
  "Power Intimacy": { en: "Power Intimacy", zh: "权力亲密" },
  "Ambiguity": { en: "Ambiguity", zh: "暧昧" },
  "Poetic Desire": { en: "Poetic Desire", zh: "诗性欲望" },
  "Female Intimacy": { en: "Female Intimacy", zh: "女性亲密" },
  "Reclaiming": { en: "Reclaiming", zh: "召回" },
  "Performative Disguise": { en: "Performative Disguise", zh: "戏剧扮演/性别伪装" },
  "Border Body": { en: "Border Body", zh: "边界身体" },
  "Artistic Image": { en: "Artistic Image", zh: "艺术形象" },
  "Legend and Modern Reinterpretation Mixed": { en: "Legend & Modern Reinterpretation Mixed", zh: "传说与现代再阐释交织" },
  "Anachronistic Identity Projection": { en: "Anachronistic Identity Projection", zh: "现代身份投射风险" },
  "Power Asymmetry in Records": { en: "Power Asymmetry in Records", zh: "历史记录权力不对称" },
  "Fragmentary Texts": { en: "Fragmentary Texts", zh: "文本残缺风险" },
  "Strong Modern Reinterpretation": { en: "Strong Modern Reinterpretation", zh: "现代学术阐释叠加" },
  "Translation Disputes": { en: "Translation Disputes", zh: "翻译争议风险" },
  "Cultural Region": { en: "Cultural Region", zh: "文化影响区域" },
  "City": { en: "City", zh: "具体城市/聚落" },
  "Province": { en: "Province", zh: "省份/行政区" },
  "Dynastic Capital": { en: "Dynastic Capital", zh: "朝代都城" },
  "Historic Site": { en: "Historic Site", zh: "历史遗址/庙宇" }
};
