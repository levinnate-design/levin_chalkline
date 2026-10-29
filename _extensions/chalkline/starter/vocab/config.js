// Settings for this course's vocab app (vocab/app/). The app itself is the same in every
// Chalkline course; this file holds what's specific to this one. Plain JavaScript, loaded by the app.
window.VOCAB_CONFIG = {
  title: "Course Vocab",

  // Topic names for each domain (the ID prefix in data/vocab.csv), in English and 中文.
  domainNames: { CLS: "Classroom" },
  domainZh: { CLS: "课堂" },

  // 中文 for subdomains, and nicer English names where "daily-life" -> "Daily life" isn't enough.
  subdomainZh: { classroom: "课堂" },
  subdomainZhByDomain: {},
  subdomainNames: {},

  // Quick references in the sidebar: [English, 中文, url, key]; key = true stars it.
  refs: [
    ["Read more", "延伸阅读", [
      ["Simple English Wikipedia", "简单英语维基百科", "https://simple.wikipedia.org/", true],
    ]],
  ],
};
