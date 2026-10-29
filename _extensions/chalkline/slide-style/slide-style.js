/*
  TO BE REMOVED with slide-style.lua (see there).
  Slide style, in the browser (every deck with a styled slide, student site too):
    - click a card or a paragraph to select it: it takes the scheme's highlight colour and grows a little.
      Click it again, click the slide, or press Esc to clear. Tab and Enter (or Space) work too.
    - the slide's colour fills the whole screen, not just the 1280 x 720 box, and follows a scheme change.
    - a quiet switch in the slide's top-right corner:  EN · 文A · 中  (English, both, 中文) and ⇅ (which
      language is large). Remembered in this browser, for every deck. Not on a slide written in one
      language only. In the teacher site it also has Style…, which opens the Slide style panel
      (toolbox/tools/style.js: colours, look and layout; an experiment, for trying looks).
  The settings themselves (data-ss-*) come from the deck's file; the switch and the panel change them live.
*/
(function () {
  var SEL = ".ss-card, .ss-narr > p";
  function items(root) { return [].slice.call(root.querySelectorAll(SEL)); }
  function clear(root, except) {
    items(root).forEach(function (it) {
      if (it !== except && it.classList.contains("ss-selected")) { it.classList.remove("ss-selected"); it.setAttribute("aria-pressed", "false"); }
    });
  }
  function toggle(it) {
    var root = it.closest("section.ss");
    var on = !it.classList.contains("ss-selected");
    clear(root, it);
    it.classList.toggle("ss-selected", on);
    it.setAttribute("aria-pressed", on ? "true" : "false");
  }
  function wire(slide) {
    items(slide).forEach(function (it) { it.setAttribute("tabindex", "0"); it.setAttribute("role", "button"); it.setAttribute("aria-pressed", "false"); });
    slide.addEventListener("click", function (e) {
      var it = e.target.closest(SEL);
      if (it && slide.contains(it)) toggle(it); else clear(slide);
    });
    slide.addEventListener("keydown", function (e) {
      var it = e.target.closest ? e.target.closest(SEL) : null;
      if ((e.key === "Enter" || e.key === " ") && it) { e.preventDefault(); e.stopPropagation(); toggle(it); }
      else if (e.key === "Escape" && slide.querySelector(".ss-selected")) { e.stopPropagation(); clear(slide); }
    });
  }

  // reveal.js draws each slide's background in its own layer, over the whole screen
  function paintBackground(slide) {
    if (!window.Reveal || !Reveal.getSlideBackground) return;
    var bg = Reveal.getSlideBackground(slide);
    if (bg) bg.style.background = getComputedStyle(slide).getPropertyValue("--bg").trim();
  }
  window.ChalklineSlideStyle = Object.assign(window.ChalklineSlideStyle || {}, { paintBackground: paintBackground, clear: clear });

  // ---------- the language switch, in the corner ----------
  var LANG_KEY = "chalkline-slide-lang";
  var lang = {};
  try { lang = JSON.parse(localStorage.getItem(LANG_KEY)) || {}; } catch (e) { /* private window */ }
  function svg(paths) {
    return '<svg viewBox="0 0 24 24" width="1em" height="1em" fill="none" stroke="currentColor" stroke-width="2" ' +
      'stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + paths + "</svg>";
  }
  var BOTH = svg('<path d="m5 8 6 6"/><path d="m4 14 6-6 2-3"/><path d="M2 5h12"/><path d="M7 2h1"/><path d="m22 22-5-10-5 10"/><path d="M14 18h6"/>');
  var SWAP = svg('<path d="m21 16-4 4-4-4"/><path d="M17 20V4"/><path d="m3 8 4-4 4 4"/><path d="M7 4v16"/>');
  var corner = null;
  function bilingual() {
    return [].filter.call(document.querySelectorAll("section.ss"), function (s) { return s.dataset.ssLangs === "both"; });
  }
  function applyLang() {
    bilingual().forEach(function (s) {
      if (lang.show) s.dataset.ssShow = lang.show;
      if (lang.primary) s.dataset.ssPrimary = lang.primary;
    });
  }
  function setLang(k, v) {
    lang[k] = v;
    try { localStorage.setItem(LANG_KEY, JSON.stringify(lang)); } catch (e) { /* private window */ }
    applyLang();
    paintCorner();
  }
  function button(cls, html, title, onclick) {
    var b = document.createElement("button");
    b.type = "button"; b.className = cls; b.innerHTML = html; b.title = title; b.setAttribute("aria-label", title);
    b.addEventListener("click", function (e) { e.stopPropagation(); onclick(); b.blur(); });
    return b;
  }
  function buildCorner() {
    corner = document.createElement("div");
    corner.className = "ss-corner";
    corner.setAttribute("role", "group");
    corner.setAttribute("aria-label", "Languages");
    var seg = document.createElement("span");
    seg.className = "ss-corner-seg";
    [["en", "EN", "English only"], ["both", BOTH, "English and 中文"], ["zh", "中", "中文 only"]].forEach(function (c) {
      var b = button("ss-corner-btn", c[1], c[2], function () { setLang("show", c[0]); });
      b.dataset.show = c[0];
      seg.append(b);
    });
    corner.append(seg);
    corner.swap = button("ss-corner-btn ss-corner-swap", SWAP + '<span class="ss-corner-big"></span>', "", function () {
      var s = current();
      setLang("primary", (s && s.dataset.ssPrimary) === "zh" ? "en" : "zh");
    });
    corner.append(corner.swap);
    var T = window.ChalklineToolbox;
    if (T && T.active && T.tools && T.tools.style) {   // teacher site: the style panel (toolbox/tools/style.js)
      corner.append(button("ss-corner-btn ss-corner-style", "Style…", "Colours, look and layout (an experiment)", function () {
        if (window.ChalklineSlideStyle.togglePanel) ChalklineSlideStyle.togglePanel();
      }));
    }
    corner.addEventListener("keydown", function (e) { e.stopPropagation(); });
  }
  function current() {
    var s = window.Reveal && Reveal.getCurrentSlide ? Reveal.getCurrentSlide() : null;
    return s && s.classList.contains("ss") ? s : null;
  }
  function paintCorner() {
    var s = current();
    if (!s || s.dataset.ssLangs !== "both") { if (corner && corner.parentNode) corner.remove(); return; }
    if (!corner) buildCorner();
    if (corner.parentNode !== s) s.append(corner);
    var show = s.dataset.ssShow, primary = s.dataset.ssPrimary;
    [].forEach.call(corner.querySelectorAll("[data-show]"), function (b) {
      var on = b.dataset.show === show;
      b.classList.toggle("ss-on", on);
      b.setAttribute("aria-pressed", on ? "true" : "false");
    });
    corner.swap.disabled = show !== "both";
    corner.swap.querySelector(".ss-corner-big").textContent = primary === "zh" ? "中" : "EN";
    corner.swap.title = "Large: " + (primary === "zh" ? "中文" : "English") + ". Click to swap";
    corner.swap.setAttribute("aria-label", corner.swap.title);
  }

  function start() {
    [].forEach.call(document.querySelectorAll("section.ss"), function (s) { wire(s); paintBackground(s); });
    if (/[?&]print-pdf/.test(location.search)) return;   // the PDF is as the file says
    applyLang();
    if (/[?&]receiver/.test(location.search)) return;   // speaker view's previews: no switch
    paintCorner();
    if (window.Reveal) Reveal.on("slidechanged", paintCorner);
  }
  if (window.Reveal && Reveal.isReady && Reveal.isReady()) start();
  else if (window.Reveal) Reveal.on("ready", start);
  else document.addEventListener("DOMContentLoaded", start);
  if (window.Reveal) Reveal.on("slidechanged", function (e) { if (e.previousSlide) clear(e.previousSlide); });
})();
