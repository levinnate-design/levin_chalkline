/*
  Bilingual text in the browser (bilingual.lua writes the spans, bilingual.css the look).
    - puts the deck's or page's settings (its `bilingual:` labels) on <html>: data-bi-primary, data-bi-show.
    - on slides: a quiet switch in the top-right corner, on any slide with [English | 中文]{.bi} text:
      EN · 文A · 中 (English, both, 中文) and ⇅ (which language is large). Remembered in this browser,
      for every deck. Not in the slide PDF or speaker view's previews.
  Other tools can call ChalklineBilingual.set("show" | "primary", value).
*/
(function () {
  var KEY = "chalkline-slide-lang";   // shared with slide-style.js (the old experiment), so both follow one switch
  var cfgEl = document.getElementById("chalkline-bilingual");
  var cfg = {};
  try { cfg = JSON.parse(cfgEl ? cfgEl.textContent : "{}"); } catch (e) { /* none */ }
  var html = document.documentElement;
  var state = { primary: cfg.primary || "en", show: cfg.show || "both" };
  var printing = /[?&]print-pdf/.test(location.search);

  if (cfg.slides && !printing) {   // the viewer's own choice, on slides only (pages keep their labels)
    try {
      var saved = JSON.parse(localStorage.getItem(KEY)) || {};
      if (saved.primary === "en" || saved.primary === "zh") state.primary = saved.primary;
      if (saved.show === "both" || saved.show === "en" || saved.show === "zh") state.show = saved.show;
    } catch (e) { /* private window */ }
  }
  function apply() {
    html.classList.toggle("bi-slides", !!cfg.slides);   // a hidden language keeps its room (bilingual.css)
    html.dataset.biPrimary = state.primary;
    html.dataset.biShow = state.show;
  }
  apply();

  function set(k, v) {
    state[k] = v;
    apply();
    try {
      var saved = JSON.parse(localStorage.getItem(KEY)) || {};
      saved[k] = v;
      localStorage.setItem(KEY, JSON.stringify(saved));
    } catch (e) { /* private window */ }
    paint();
    if (window.Reveal && Reveal.layout) Reveal.layout();
  }
  window.ChalklineBilingual = { set: set, get: function () { return Object.assign({}, state); } };

  if (!cfg.slides || printing || /[?&]receiver/.test(location.search)) return;

  // ---------- the switch ----------
  function svg(paths) {
    return '<svg viewBox="0 0 24 24" width="1em" height="1em" fill="none" stroke="currentColor" stroke-width="2" ' +
      'stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + paths + "</svg>";
  }
  var BOTH = svg('<path d="m5 8 6 6"/><path d="m4 14 6-6 2-3"/><path d="M2 5h12"/><path d="M7 2h1"/><path d="m22 22-5-10-5 10"/><path d="M14 18h6"/>');
  var SWAP = svg('<path d="m21 16-4 4-4-4"/><path d="M17 20V4"/><path d="m3 8 4-4 4 4"/><path d="M7 4v16"/>');
  var box, swap;
  function button(htmlText, title, onclick) {
    var b = document.createElement("button");
    b.type = "button"; b.innerHTML = htmlText; b.title = title; b.setAttribute("aria-label", title);
    b.addEventListener("click", function (e) { e.stopPropagation(); onclick(); b.blur(); });
    return b;
  }
  function build() {
    box = document.createElement("div");
    box.className = "bi-switch";
    box.setAttribute("role", "group");
    box.setAttribute("aria-label", "Languages");
    var seg = document.createElement("span");
    seg.className = "bi-switch-seg";
    [["en", "EN", "English only"], ["both", BOTH, "English and 中文"], ["zh", "中", "中文 only"]].forEach(function (c) {
      var b = button(c[1], c[2], function () { set("show", c[0]); });
      b.dataset.show = c[0];
      seg.append(b);
    });
    swap = button("", "", function () { set("primary", state.primary === "zh" ? "en" : "zh"); });
    swap.className = "bi-swap";
    box.append(seg, swap);
    box.addEventListener("keydown", function (e) { e.stopPropagation(); });
    (document.querySelector(".reveal") || document.body).append(box);
  }
  function paint() {
    if (!box) return;
    var s = window.Reveal && Reveal.getCurrentSlide ? Reveal.getCurrentSlide() : null;
    box.hidden = !(s && s.querySelector(".bil-en"));
    [].forEach.call(box.querySelectorAll("[data-show]"), function (b) {
      b.setAttribute("aria-pressed", b.dataset.show === state.show ? "true" : "false");
    });
    swap.disabled = state.show !== "both";
    swap.innerHTML = SWAP + "<span>" + (state.primary === "zh" ? "中" : "EN") + "</span>";
    swap.title = "Large: " + (state.primary === "zh" ? "中文" : "English") + ". Click to swap";
    swap.setAttribute("aria-label", swap.title);
  }
  function start() { build(); paint(); Reveal.on("slidechanged", paint); }
  if (!window.Reveal) return;
  if (Reveal.isReady && Reveal.isReady()) start(); else Reveal.on("ready", start);
})();
