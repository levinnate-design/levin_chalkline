// All slides: every unit's decks as rows of slide pictures ({{< slide-wall >}}, all-slides.qmd).
// The pictures and slide-pictures.json are made after each full build by scripts/slide_pictures.py.
// Click a picture to open its deck at that slide.
(function () {
  "use strict";
  const SIZES = [["s", "Small"], ["m", "Medium"], ["l", "Large"]];
  const KEY = "chalkline-slide-wall-size";

  function el(tag, attrs, ...kids) {
    const e = document.createElement(tag);
    for (const [k, v] of Object.entries(attrs || {})) {
      if (v === undefined || v === null || v === false) continue;
      if (k === "text") e.textContent = v; else e.setAttribute(k, v);
    }
    for (const k of kids) if (k) e.append(k);
    return e;
  }

  function remembered() {
    try { return localStorage.getItem(KEY) || "m"; } catch (e) { return "m"; }
  }
  function remember(size) {
    try { localStorage.setItem(KEY, size); } catch (e) { /* private window: just don't remember */ }
  }

  function slideLink(root, deck, s) {
    return root + deck.path + "#/" + (s.id ? encodeURIComponent(s.id) : s.h + (s.v ? "/" + s.v : ""));
  }

  function deckRow(root, deck) {
    const count = deck.slides.length + " slide" + (deck.slides.length === 1 ? "" : "s");
    const head = el("div", { class: "sw-deck-head" },
      el("a", { class: "sw-deck-title", href: root + deck.path, text: deck.title }),
      deck.subtitle ? el("span", { class: "sw-deck-sub", text: deck.subtitle }) : null,
      el("span", { class: "sw-deck-count", text: count }),
      deck.pdf ? el("a", { class: "sw-deck-pdf", href: root + deck.pdf, text: "PDF" }) : null);
    const strip = el("div", { class: "sw-strip", style: "--sw-ratio: " + deck.width + " / " + deck.height });
    deck.slides.forEach((s, i) => {
      const label = (i + 1) + (s.title ? " · " + s.title : "");
      strip.append(el("a", { class: "sw-slide", href: slideLink(root, deck, s), title: label },
        el("span", { class: "sw-pic" },
          el("img", { src: root + deck.pictures + s.img, alt: s.title || "Slide " + (i + 1), loading: "lazy" }),
          el("span", { class: "sw-n", text: String(i + 1) })),
        el("span", { class: "sw-cap", text: s.title || "" })));
    });
    return el("div", { class: "sw-deck" }, head, strip);
  }

  function draw(box, data) {
    const root = box.dataset.root || "";
    const units = data.units || [];
    if (!units.length) {
      box.append(el("p", { class: "sw-empty", text: "No slide pictures yet. They're made by a full build " +
        "(python chalkline.py build, or the launcher), which needs Google Chrome or Microsoft Edge." }));
      return;
    }
    const decks = units.reduce((n, u) => n + u.decks.length, 0);
    const slides = units.reduce((n, u) => n + u.decks.reduce((m, d) => m + d.slides.length, 0), 0);
    const seg = el("div", { class: "ui-seg", role: "group", "aria-label": "Picture size" });
    const setSize = (size) => {
      box.dataset.size = size;
      seg.querySelectorAll("button").forEach((b) => b.classList.toggle("ui-on", b.dataset.size === size));
      remember(size);
    };
    for (const [size, label] of SIZES) {
      const b = el("button", { type: "button", "data-size": size, text: label });
      b.addEventListener("click", () => setSize(size));
      seg.append(b);
    }
    const jump = el("nav", { class: "sw-jump", "aria-label": "Units" });
    units.forEach((u, i) => jump.append(el("a", { href: "#sw-unit-" + (i + 1), text: u.title })));
    box.append(el("div", { class: "sw-bar" },
      el("span", { class: "sw-total", text: decks + " decks · " + slides + " slides" }), seg), jump);
    units.forEach((u, i) => {
      const section = el("section", { class: "sw-unit", id: "sw-unit-" + (i + 1) },
        el("h2", { class: "sw-unit-title" }, el("a", { href: root + u.path, text: u.title })));
      u.decks.forEach((d) => section.append(deckRow(root, d)));
      box.append(section);
    });
    setSize(remembered());
  }

  document.querySelectorAll(".slide-wall").forEach((box) => {
    fetch(box.dataset.src)
      .then((r) => (r.ok ? r.json() : { units: [] }))
      .catch(() => ({ units: [] }))
      .then((data) => draw(box, data));
  });
})();
