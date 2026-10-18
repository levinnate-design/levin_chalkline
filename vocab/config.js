// Settings for this course's vocab app (vocab/app/). The app itself is the same in every
// Chalkline course; this file holds what's specific to this one. Plain JavaScript, loaded by the app.
window.VOCAB_CONFIG = {
  title: "History Vocab",

  // Topic names for each domain (the ID prefix in data/vocab.csv), in English and 中文.
  domainNames: { GRC: "Ancient Greece", ROM: "Ancient Rome", ECO: "Economics" },
  domainZh: { GRC: "古希腊", ROM: "古罗马", ECO: "经济学" },

  // 中文 for subdomains, and nicer English names where "daily-life" -> "Daily life" isn't enough.
  subdomainZh: { geography: "地理", government: "政府", culture: "文化", army: "军队",
                 "daily-life": "日常生活", engineering: "工程", systems: "制度" },
  subdomainZhByDomain: {},
  subdomainNames: {},

  // Quick references in the sidebar: [English, 中文, url, key]; key = true stars it.
  refs: [
    ["Read more", "延伸阅读", [
      ["Ancient Greece (Simple English Wikipedia)", "古希腊（简单英语维基百科）", "https://simple.wikipedia.org/wiki/Ancient_Greece", true],
      ["Ancient Rome (Simple English Wikipedia)", "古罗马（简单英语维基百科）", "https://simple.wikipedia.org/wiki/Ancient_Rome", true],
      ["Athenian democracy (Wikipedia)", "雅典民主（维基百科）", "https://en.wikipedia.org/wiki/Athenian_democracy"],
      ["Roman Republic (Wikipedia)", "罗马共和国（维基百科）", "https://en.wikipedia.org/wiki/Roman_Republic"],
    ]],
  ],
};
