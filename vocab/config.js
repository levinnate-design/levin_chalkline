// Settings for this course's vocab app (vocab/app/). The app itself is the same in every
// Chalkline course; this file holds what's specific to this one. Plain JavaScript, loaded by the app.
window.VOCAB_CONFIG = {
  title: "History Vocab",

  // Topic names for each domain (the ID prefix in data/vocab.csv), in English and 中文.
  domainNames: { CMD: "Command Terms", RIV: "River Civilizations", GRC: "Ancient Greece", ROM: "Ancient Rome", ECO: "Economics" },
  domainZh: { CMD: "MYP 指令词", RIV: "早期河谷文明", GRC: "古希腊", ROM: "古罗马", ECO: "经济学" },

  // 中文 for subdomains, and nicer English names where "daily-life" -> "Daily life" isn't enough.
  subdomainZh: { geography: "地理与文明要素", government: "政府", culture: "文化", army: "军队",
                 "daily-life": "日常生活", engineering: "工程", systems: "制度",
                 mesopotamia: "美索不达米亚", egypt: "古埃及", indus: "印度河流域",
                 knowing: "标准 A：知识与理解", investigating: "标准 B：调查研究",
                 communicating: "标准 C：交流表达", thinking: "标准 D：批判性思考" },
  subdomainZhByDomain: {},
  subdomainNames: {
    mesopotamia: "Mesopotamia",
    egypt: "Ancient Egypt",
    indus: "Indus Valley",
    knowing: "Criterion A: Knowing",
    investigating: "Criterion B: Investigating",
    communicating: "Criterion C: Communicating",
    thinking: "Criterion D: Thinking Critically"
  },

  // Quick references in the sidebar: [English, 中文, url, key]; key = true stars it.
  refs: [
    ["Curriculum & Command Terms", "课程与指令词", [
      ["Command Terms Reference Sheet", "MYP 指令词参考表", "../../course/references/command-terms.html", true],
      ["Official MYP Command Terms (PDF)", "IB MYP 官方指令词表 (PDF)", "../../course/references/curriculum-building/MYP_Individuals_and_Societies_CommandTerms.pdf", true],
    ]],
    ["Read more", "延伸阅读", [
      ["Ancient Greece (Simple English Wikipedia)", "古希腊（简单英语维基百科）", "https://simple.wikipedia.org/wiki/Ancient_Greece", true],
      ["Ancient Rome (Simple English Wikipedia)", "古罗马（简单英语维基百科）", "https://simple.wikipedia.org/wiki/Ancient_Rome", true],
      ["Athenian democracy (Wikipedia)", "雅典民主（维基百科）", "https://en.wikipedia.org/wiki/Athenian_democracy"],
      ["Roman Republic (Wikipedia)", "罗马共和国（维基百科）", "https://en.wikipedia.org/wiki/Roman_Republic"],
    ]],
  ],
};
