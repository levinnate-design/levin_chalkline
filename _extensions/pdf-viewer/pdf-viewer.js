// PDF viewer: draws PDFs with pdf.js into the boxes that the pdf-viewer shortcode leaves
// (see pdf-viewer.lua), or that other code adds later and starts with window.PdfViewer.start(box). Three parts:
//   Viewer   one page at a time, with ‹ › buttons, zoom and pens (layout="viewer")
//   Gallery  every page as a thumbnail                       (layout="gallery")
//   Popup    one big page in a window you can drag and resize; opened from either
// Ink is saved per PDF page in this browser (localStorage) and shows wherever that page is
// shown, until someone presses Clear.

import * as pdfjs from "./pdf.min.mjs";

pdfjs.GlobalWorkerOptions.workerSrc = new URL("./pdf.worker.min.mjs", import.meta.url).href;

const PRINT = /print-pdf/i.test(location.search);   // reveal.js print layout (slide PDFs)

// ---- Loading PDFs: each one once, however many viewers show it ----

const docs = new Map();
function loadPdf(url) {
  if (!docs.has(url)) docs.set(url, pdfjs.getDocument({ url, isEvalSupported: false }).promise);
  return docs.get(url);
}

// The box's PDF: the preferred version (data-prefer, e.g. a student copy) if it's there, else data-src
async function openPdf(root) {
  if (root.dataset.prefer) {
    const url = new URL(root.dataset.prefer, document.baseURI).href;
    try { return [url, await loadPdf(url)]; } catch (e) { /* not there: use the usual file */ }
  }
  const url = new URL(root.dataset.src, document.baseURI).href;
  return [url, await loadPdf(url)];
}

// ---- Ink: a list of strokes per PDF page. Points are fractions of the page (0–1), so the
// same ink fits a thumbnail, a slide and the big popup. ----

const PENS = {
  red:   { label: "Red pen",     color: "#d62828", width: 0.004 },
  blue:  { label: "Blue pen",    color: "#1d4ed8", width: 0.004 },
  black: { label: "Black pen",   color: "#111827", width: 0.004 },
  hi:    { label: "Highlighter", color: "#facc15", width: 0.024, alpha: 0.4 },
};
const TEXT_SIZE = 0.028;        // typed text: letter height as a fraction of the page width
const ZOOMS = [1, 1.25, 1.5, 2, 2.5, 3, 4];   // 1 = the whole page fits
const STORE = "pdf-viewer-ink:";
const inkMemory = new Map();   // works even where localStorage is blocked
const pageViews = new Set();   // every page on screen, to redraw ink drawn somewhere else

const inkKey = (url, n) => STORE + new URL(url).pathname + "#" + n;
function readInk(url, n) {
  const key = inkKey(url, n);
  if (!inkMemory.has(key)) {
    let strokes = [];
    try { strokes = JSON.parse(localStorage.getItem(key)) || []; } catch (e) { /* blocked or bad */ }
    inkMemory.set(key, strokes);
  }
  return inkMemory.get(key);
}
function writeInk(url, n, strokes) {
  const key = inkKey(url, n);
  inkMemory.set(key, strokes);
  try {
    if (strokes.length) localStorage.setItem(key, JSON.stringify(strokes));
    else localStorage.removeItem(key);
  } catch (e) { /* kept in memory only */ }
  for (const view of pageViews) if (view.url === url && view.n === n) view.drawInk();
}

// The classroom toolbox's "Reset for the next class" (with "pen marks" ticked) clears the ink on
// every page of the PDFs this deck shows, not only the pages on screen.
document.addEventListener("chalkline:reset", (e) => {
  if (!e.detail || !e.detail.ink) return;
  const prefixes = new Set([...pageViews].map((v) => STORE + new URL(v.url).pathname + "#"));
  for (const el of document.querySelectorAll(".pdfv")) {   // viewers on slides not shown yet
    for (const src of [el.dataset.src, el.dataset.prefer]) {
      if (src) prefixes.add(STORE + new URL(src, location.href).pathname + "#");
    }
  }
  const mine = (key) => [...prefixes].some((p) => key.startsWith(p));
  for (const key of [...inkMemory.keys()]) if (mine(key)) inkMemory.set(key, []);
  try {
    for (let i = localStorage.length - 1; i >= 0; i--) {
      const key = localStorage.key(i);
      if (key && mine(key)) localStorage.removeItem(key);
    }
  } catch (err) { /* blocked: memory is cleared */ }
  for (const view of pageViews) view.drawInk();
});

// ---- Icons (simple line drawings, so they match on every computer) ----

const ICONS = {
  prev: '<path d="M15 5l-7 7 7 7"/>',
  next: '<path d="M9 5l7 7-7 7"/>',
  hand: '<path d="M7 11V6.5a1.5 1.5 0 013 0V11m0-1V4.5a1.5 1.5 0 013 0V10m0 0V5.5a1.5 1.5 0 013 0V11m0 0V8.5a1.5 1.5 0 013 0V14a7 7 0 01-7 7h-1a7 7 0 01-6-3.4L4 14.5a1.5 1.5 0 012.6-1.5L8 15"/>',
  eraser: '<path d="M4 16l9-9 6 6-7 7H8z"/><path d="M12 20h8"/>',
  undo: '<path d="M9 14L4 9l5-5"/><path d="M4 9h11a5 5 0 010 10h-3"/>',
  clear: '<path d="M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3"/>',
  big: '<path d="M14 4h6v6M10 20H4v-6M20 4l-7 7M4 20l7-7"/>',
  open: '<path d="M14 4h6v6M20 4L10 14"/><path d="M18 14v6H4V6h6"/>',
  close: '<path d="M6 6l12 12M18 6L6 18"/>',
  download: '<path d="M12 4v11M7 10l5 5 5-5M5 19h14"/>',
  pen: '<path d="M4 20l1-4L16 5l3 3L8 19z"/><path d="M14 7l3 3"/>',
  text: '<path d="M5 7V5h14v2M12 5v14M9 19h6"/>',
  zoomIn: '<circle cx="10.5" cy="10.5" r="6.5"/><path d="M20 20l-4.5-4.5M7.5 10.5h6M10.5 7.5v6"/>',
  zoomOut: '<circle cx="10.5" cy="10.5" r="6.5"/><path d="M20 20l-4.5-4.5M7.5 10.5h6"/>',
};
function button(icon, label, onClick, cls = "") {
  const b = document.createElement("button");
  b.type = "button";
  b.className = "pdfv-btn " + cls;
  b.title = label;
  b.setAttribute("aria-label", label);
  b.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true">' + (ICONS[icon] || "") + "</svg>";
  b.addEventListener("click", (e) => { e.stopPropagation(); onClick(e); });
  return b;
}
function el(tag, cls, text) {
  const e = document.createElement(tag);
  if (cls) e.className = cls;
  if (text) e.textContent = text;
  return e;
}

// ---- One PDF page on screen: the page itself, with an ink layer on top ----

class PageView {
  // owner: the viewer or popup whose pen bar says what a touch does (owner.tool: a pen,
  // "text", "eraser" or null = drawing off; owner.color: the text color). null: no drawing.
  constructor(url, owner) {
    this.url = url;
    this.n = 0;
    this.owner = owner;
    this.el = el("div", "pdfv-page");
    this.pdf = el("canvas", "pdfv-pdf");
    this.ink = el("canvas", "pdfv-ink");
    this.el.append(this.pdf, this.ink);
    pageViews.add(this);
    if (owner) this.listen();
  }

  // Fit page n into a box of w × h (layout pixels), times `zoom`, and draw it sharp at the real screen size.
  async show(doc, n, w, h, zoom = 1) {
    this.n = n;
    const page = await doc.getPage(n);
    const base = page.getViewport({ scale: 1 });
    const fit = Math.max(0.05, Math.min(w / base.width, h / base.height)) * zoom;
    this.w = Math.round(base.width * fit);
    this.h = Math.round(base.height * fit);
    this.el.style.width = this.w + "px";
    this.el.style.height = this.h + "px";
    // reveal.js scales the whole slide, so the page can be bigger on screen than its layout size
    const scale = (this.el.getBoundingClientRect().width / this.w) || 1;
    const px = Math.min(4, scale * (window.devicePixelRatio || 1), 4096 / Math.max(this.w, this.h));   // browsers limit canvas size
    const viewport = page.getViewport({ scale: fit * px });
    for (const c of [this.pdf, this.ink]) {
      c.width = Math.round(viewport.width);
      c.height = Math.round(viewport.height);
    }
    this.drawInk();
    if (this.task) this.task.cancel();
    this.task = page.render({ canvasContext: this.pdf.getContext("2d"), viewport });
    try { await this.task.promise; } catch (e) { if (e.name !== "RenderingCancelledException") throw e; }
  }

  drawInk() {
    const c = this.ink, ctx = c.getContext("2d");
    ctx.clearRect(0, 0, c.width, c.height);
    if (!this.n) return;
    ctx.lineCap = ctx.lineJoin = "round";
    ctx.textBaseline = "top";
    for (const s of readInk(this.url, this.n)) {
      if (s.s != null) {   // typed text
        ctx.globalAlpha = 1;
        ctx.fillStyle = s.c;
        ctx.font = this.font(s.f * c.width);
        ctx.fillText(s.s, s.p[0] * c.width, s.p[1] * c.height);
        continue;
      }
      ctx.globalAlpha = s.a || 1;
      ctx.strokeStyle = s.c;
      ctx.lineWidth = Math.max(1, s.w * c.width);
      ctx.beginPath();
      ctx.moveTo(s.p[0] * c.width, s.p[1] * c.height);
      if (s.p.length === 2) ctx.lineTo(s.p[0] * c.width + 0.1, s.p[1] * c.height);   // a dot
      for (let i = 2; i < s.p.length; i += 2) ctx.lineTo(s.p[i] * c.width, s.p[i + 1] * c.height);
      ctx.stroke();
    }
    ctx.globalAlpha = 1;
  }

  font(size) {
    return "600 " + size + "px " + getComputedStyle(this.el).fontFamily;
  }

  // Text tool: a box to type in where the page was tapped. Enter (or tapping elsewhere) keeps it.
  typeAt(e) {
    const [x, y] = this.spot(e), color = this.owner.color, f = TEXT_SIZE;
    const box = el("input", "pdfv-text");
    box.type = "text";
    box.setAttribute("aria-label", "Type on the page");
    Object.assign(box.style, { left: x * 100 + "%", top: y * 100 + "%", color, fontSize: f * this.w + "px" });
    this.el.append(box);
    let done = false;
    const finish = (keep) => {
      if (done) return;
      done = true;
      const text = box.value.trim();
      box.remove();
      if (!keep || !text) return;
      const ctx = this.ink.getContext("2d");
      ctx.font = this.font(f * this.ink.width);
      const tw = ctx.measureText(text).width / this.ink.width;
      const strokes = readInk(this.url, this.n);
      strokes.push({ c: color, f, p: [+x.toFixed(4), +y.toFixed(4)], s: text, tw: +tw.toFixed(4) });
      writeInk(this.url, this.n, strokes);
    };
    box.addEventListener("keydown", (ev) => {
      ev.stopPropagation();   // typing isn't a slide shortcut
      if (ev.key === "Enter") finish(true);
      else if (ev.key === "Escape") finish(false);
    });
    box.addEventListener("blur", () => finish(true));
    box.focus();
  }

  // Where a pointer is on the page, as fractions
  spot(e) {
    const r = this.ink.getBoundingClientRect();
    return [(e.clientX - r.left) / r.width, (e.clientY - r.top) / r.height];
  }

  listen() {
    const ink = this.ink;
    let stroke = null, erasing = false, frame = 0;
    const redraw = () => { if (!frame) frame = requestAnimationFrame(() => { frame = 0; this.drawInk(); }); };
    let last = null;   // where the eraser was a moment ago: a fast swipe skips over lines otherwise
    const erase = (e) => {
      const ratio = this.h / this.w, reach = 0.02;
      const [x, y] = this.spot(e), [x0, y0] = last || [x, y];
      last = [x, y];
      const steps = Math.ceil(Math.hypot(x - x0, (y - y0) * ratio) / reach) || 1;
      const spots = [];
      for (let k = 1; k <= steps; k++) spots.push([x0 + (x - x0) * k / steps, (y0 + (y - y0) * k / steps) * ratio]);
      const strokes = readInk(this.url, this.n);
      const kept = strokes.filter((s) => {
        if (s.s != null) {   // typed text: rub anywhere over it
          const tx = s.p[0], ty = s.p[1] * ratio;
          return !spots.some(([ex, ey]) => ex > tx - reach && ex < tx + s.tw + reach && ey > ty - reach && ey < ty + s.f * 1.2 + reach);
        }
        for (let i = 0; i < s.p.length; i += 2) {   // near any part of the line, not just its points
          const j = Math.max(0, i - 2);
          for (const [ex, ey] of spots) {
            if (nearLine(ex, ey, s.p[j], s.p[j + 1] * ratio, s.p[i], s.p[i + 1] * ratio) < reach + s.w / 2) return false;
          }
        }
        return true;
      });
      if (kept.length !== strokes.length) { inkMemory.set(inkKey(this.url, this.n), kept); redraw(); }
    };
    ink.addEventListener("pointerdown", (e) => {
      const tool = this.owner.tool;
      if (!tool || !this.n) return;
      e.preventDefault();
      e.stopPropagation();
      if (tool === "text") { this.typeAt(e); return; }
      ink.setPointerCapture(e.pointerId);
      if (tool === "eraser") { erasing = true; last = null; erase(e); return; }
      const pen = PENS[tool];
      stroke = { c: pen.color, w: pen.width, p: this.spot(e).map((v) => +v.toFixed(4)) };
      if (pen.alpha) stroke.a = pen.alpha;
      readInk(this.url, this.n).push(stroke);
      redraw();
    });
    ink.addEventListener("pointermove", (e) => {
      if (erasing) { erase(e); return; }
      if (!stroke) return;
      for (const ev of (e.getCoalescedEvents ? e.getCoalescedEvents() : [e])) {
        stroke.p.push(...this.spot(ev).map((v) => +v.toFixed(4)));
      }
      redraw();
    });
    const finish = () => {
      if (!stroke && !erasing) return;
      stroke = null;
      erasing = false;
      writeInk(this.url, this.n, readInk(this.url, this.n));
    };
    ink.addEventListener("pointerup", finish);
    ink.addEventListener("pointercancel", finish);
  }
}

// How far point (x, y) is from the line from (ax, ay) to (bx, by)
function nearLine(x, y, ax, ay, bx, by) {
  const dx = bx - ax, dy = by - ay, len = dx * dx + dy * dy;
  const t = len ? Math.max(0, Math.min(1, ((x - ax) * dx + (y - ay) * dy) / len)) : 0;
  return Math.hypot(x - (ax + t * dx), y - (ay + t * dy));
}

// ---- The pen toolbar (viewer and popup each have one) ----

function penBar(owner) {
  const bar = el("div", "pdfv-pens");
  const buttons = {};
  owner.tool = null;
  owner.color = PENS.red.color;
  const pick = (tool) => {
    owner.tool = owner.tool === tool ? null : tool;   // tap the same pen again: drawing off
    if (PENS[tool] && !PENS[tool].alpha) owner.color = PENS[tool].color;   // text is in the last pen's color
    buttons.text.style.setProperty("--pen", owner.color);
    for (const [name, b] of Object.entries(buttons)) b.setAttribute("aria-pressed", String(name === (owner.tool || "hand")));
    owner.root.classList.toggle("pdfv-drawing", !!owner.tool);
    owner.root.dataset.tool = owner.tool || "";
  };
  buttons.hand = button("hand", "Drawing off", () => pick(null));
  bar.append(buttons.hand);
  for (const [name, pen] of Object.entries(PENS)) {
    const b = button("", pen.label, () => pick(name), "pdfv-swatch" + (pen.alpha ? " pdfv-hi" : ""));
    b.style.setProperty("--pen", pen.color);
    buttons[name] = b;
    bar.append(b);
  }
  buttons.text = button("text", "Text: tap the page, then type (in the last pen's color)", () => pick("text"), "pdfv-textbtn");
  buttons.eraser = button("eraser", "Eraser: rub out a line or text", () => pick("eraser"));
  bar.append(buttons.text);
  bar.append(buttons.eraser,
    button("undo", "Undo the last line", () => {
      const strokes = readInk(owner.url, owner.n);
      if (strokes.length) writeInk(owner.url, owner.n, strokes.slice(0, -1));
    }),
    button("clear", "Clear the ink on this page", () => {
      if (readInk(owner.url, owner.n).length && confirm("Clear all the ink on page " + owner.n + "?")) writeInk(owner.url, owner.n, []);
    }));
  pick(null);
  return bar;
}

function showError(root, title) {
  root.replaceChildren(el("p", "pdfv-error", "This PDF isn't available here: " + title + "."));
}

// ---- Zoom (viewer and popup): − 100% + buttons, Ctrl/⌘ + scroll or a trackpad pinch; drag to move around ----

function zoomBar(owner) {
  const bar = el("div", "pdfv-zoom");
  owner.zoom = 1;
  const out = button("zoomOut", "Zoom out", () => step(-1));
  const label = el("button", "pdfv-btn pdfv-zoom-label", "100%");
  label.type = "button";
  label.title = "Fit the whole page";
  label.addEventListener("click", (e) => { e.stopPropagation(); set(1); });
  const inn = button("zoomIn", "Zoom in", () => step(1));
  const step = (d) => {
    const i = ZOOMS.findIndex((z) => z >= owner.zoom - 1e-6);
    set(ZOOMS[Math.min(Math.max(0, i + d), ZOOMS.length - 1)]);
  };
  const set = async (z) => {
    if (z === owner.zoom || !owner.doc) return;
    const st = owner.stage;   // keep the middle of what's showing in the middle
    const fx = (st.scrollLeft + st.clientWidth / 2) / st.scrollWidth, fy = (st.scrollTop + st.clientHeight / 2) / st.scrollHeight;
    owner.zoom = z;
    label.textContent = Math.round(z * 100) + "%";
    out.disabled = z === ZOOMS[0];
    inn.disabled = z === ZOOMS[ZOOMS.length - 1];
    owner.root.classList.toggle("pdfv-zoomed", z > 1);
    await owner.go(owner.n);
    st.scrollLeft = fx * st.scrollWidth - st.clientWidth / 2;
    st.scrollTop = fy * st.scrollHeight - st.clientHeight / 2;
  };
  owner.zoomStep = step;
  owner.zoomTo = set;
  out.disabled = true;
  let wait = 0;
  owner.stage.addEventListener("wheel", (e) => {
    if (!e.ctrlKey && !e.metaKey) return;   // a trackpad pinch arrives as Ctrl + scroll
    e.preventDefault();
    if (Date.now() - wait < 150) return;
    wait = Date.now();
    step(e.deltaY < 0 ? 1 : -1);
  }, { passive: false });
  // Zoomed in with drawing off: drag with the mouse to move around (fingers scroll by themselves)
  owner.stage.addEventListener("pointerdown", (e) => {
    if (owner.zoom === 1 || owner.tool || e.pointerType !== "mouse") return;
    const st = owner.stage, start = { x: e.clientX, y: e.clientY, l: st.scrollLeft, t: st.scrollTop };
    st.setPointerCapture(e.pointerId);
    st.classList.add("pdfv-panning");
    const move = (ev) => { st.scrollLeft = start.l - (ev.clientX - start.x); st.scrollTop = start.t - (ev.clientY - start.y); };
    const up = () => { st.classList.remove("pdfv-panning"); st.removeEventListener("pointermove", move); st.removeEventListener("pointerup", up); };
    st.addEventListener("pointermove", move);
    st.addEventListener("pointerup", up);
  });
  bar.append(out, label, inn);
  return bar;
}

// ---- Viewer: one page at a time ----

class Viewer {
  constructor(root) {
    this.root = root;
    this.title = root.dataset.title;
    this.n = parseInt(root.dataset.page, 10) || 1;
    this.stage = el("div", "pdfv-stage");
    this.page = new PageView(null, this);
    this.stage.append(this.page.el);
    this.prev = button("prev", "Previous page", () => this.go(this.n - 1));
    this.next = button("next", "Next page", () => this.go(this.n + 1));
    this.count = el("span", "pdfv-count");
    const nav = el("div", "pdfv-bar");
    nav.append(this.prev, this.count, this.next, zoomBar(this), el("span", "pdfv-title", this.title),
      button("big", "Open large", () => popup.open(this.url, this.title, this.n)),
      downloadMenu(() => this.url));
    root.replaceChildren(...(root.dataset.ink === "false" ? [] : [penBar(this)]), this.stage, nav);
  }
  async start() {
    [this.url, this.doc] = await openPdf(this.root);
    this.page.url = this.url;
    await this.go(this.n);
  }
  async go(n) {
    if (!this.doc) return;
    this.n = Math.min(Math.max(1, n), this.doc.numPages);
    this.count.textContent = this.n + " / " + this.doc.numPages;
    this.prev.disabled = this.n === 1;
    this.next.disabled = this.n === this.doc.numPages;
    await this.page.show(this.doc, this.n, this.stage.clientWidth, this.stage.clientHeight, this.zoom);
  }
  refresh() { return this.go(this.n); }
}

// "⬇ Download": a menu with the choices spelled out (with my notes / original / open in a new tab)
function downloadMenu(getUrl) {
  const b = button("download", "Download: with my notes, or the original", () => (menu.isConnected ? close() : open()));
  b.setAttribute("aria-haspopup", "menu");
  const menu = el("div", "pdfv-menu");
  menu.setAttribute("role", "menu");
  const item = (icon, label, note, act) => {
    const i = el("button", "pdfv-menu-item");
    i.type = "button";
    i.setAttribute("role", "menuitem");
    i.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true">' + ICONS[icon] + "</svg>";
    const words = el("span");
    words.append(el("strong", "", label), el("small", "", note));
    i.append(words);
    i.addEventListener("click", async (e) => {
      e.stopPropagation();
      close();
      try { await act(getUrl()); } catch (err) {
        console.warn("pdf-viewer: download", err);
        alert("Sorry, this PDF couldn't be saved: " + err.message);
      }
    });
    menu.append(i);
  };
  item("pen", "With my notes", "The PDF with everything drawn or typed on it", downloadWithInk);
  item("download", "Original", "The PDF as printed, without notes", (url) => saveFile(url, fileName(url) + ".pdf"));
  item("open", "Open in a new tab", "To read or print it in the browser", (url) => window.open(url, "_blank", "noopener"));
  const outside = (e) => { if (!menu.contains(e.target) && !b.contains(e.target)) close(); };
  const esc = (e) => { if (e.key === "Escape") { e.stopImmediatePropagation(); close(); } };
  function open() {
    menu.style.fontFamily = getComputedStyle(document.querySelector(".reveal") || document.body).fontFamily;
    document.body.append(menu);
    const r = b.getBoundingClientRect(), m = menu.getBoundingClientRect();
    const up = r.top - m.height - 6 > 0 && r.bottom + m.height + 6 > innerHeight;   // above the button if there's no room below
    menu.style.left = Math.max(8, Math.min(r.right - m.width, innerWidth - m.width - 8)) + "px";
    menu.style.top = (up ? r.top - m.height - 6 : r.bottom + 6) + "px";
    b.setAttribute("aria-expanded", "true");
    document.addEventListener("pointerdown", outside, true);
    addEventListener("keydown", esc, true);
  }
  function close() {
    menu.remove();
    b.setAttribute("aria-expanded", "false");
    document.removeEventListener("pointerdown", outside, true);
    removeEventListener("keydown", esc, true);
  }
  return b;
}

const fileName = (url) => decodeURIComponent(new URL(url).pathname.split("/").pop()).replace(/\.pdf$/i, "");
function saveFile(href, name) {
  const a = el("a");
  a.href = href;
  a.download = name;
  document.body.append(a);
  a.click();
  a.remove();
}

// ---- Download: the PDF with the ink added to its pages, made in the browser by pdf-lib (MIT,
// pdf-lib.esm.min.js), which loads only when someone presses Download. Lines stay lines and
// typed English stays text; typed text the PDF fonts can't show (Chinese) goes in as a picture. ----

const hex = (c, lib) => lib.rgb(parseInt(c.slice(1, 3), 16) / 255, parseInt(c.slice(3, 5), 16) / 255, parseInt(c.slice(5, 7), 16) / 255);

async function downloadWithInk(url) {
  const lib = await import("./pdf-lib.esm.min.js");
  const bytes = await (await fetch(url)).arrayBuffer();
  const pdf = await lib.PDFDocument.load(bytes, { ignoreEncryption: true });
  const font = await pdf.embedFont(lib.StandardFonts.HelveticaBold);
  const pages = pdf.getPages();
  for (let i = 0; i < pages.length; i++) {
    const strokes = readInk(url, i + 1);
    if (strokes.length) await inkOnPage(pdf, pages[i], strokes, font, lib);
  }
  const href = URL.createObjectURL(new Blob([await pdf.save()], { type: "application/pdf" }));
  saveFile(href, fileName(url) + "-with-notes.pdf");
  setTimeout(() => URL.revokeObjectURL(href), 10000);
}

// The ink is stored as fractions of the page as shown (pdf.js shows the crop box, turned by the page's
// rotation). Draw it in "shown" points: start at the shown top-left corner, turn with the page, y down.
async function inkOnPage(pdf, page, strokes, font, lib) {
  const box = page.getCropBox(), rot = ((page.getRotation().angle % 360) + 360) % 360;
  const W = rot % 180 ? box.height : box.width, H = rot % 180 ? box.width : box.height;
  const [ox, oy] = { 0: [box.x, box.y + box.height], 90: [box.x, box.y], 180: [box.x + box.width, box.y],
                     270: [box.x + box.width, box.y + box.height] }[rot] || [box.x, box.y + box.height];
  const t = rot * Math.PI / 180, cos = Math.cos(t), sin = Math.sin(t);
  const at = (u, v) => ({ x: ox + u * cos + v * sin, y: oy + u * sin - v * cos });   // shown point -> PDF point
  page.pushOperators(lib.pushGraphicsState(), lib.setLineJoin(lib.LineJoinStyle.Round));
  for (const s of strokes) {
    if (s.s != null) {   // typed text
      const size = s.f * W, x = s.p[0] * W, y = s.p[1] * H;
      let fits = true;
      try { font.encodeText(s.s); } catch (e) { fits = false; }
      if (fits) {
        page.drawText(s.s, { ...at(x, y + font.heightAtSize(size, { descender: false })), size, font,
                             color: hex(s.c, lib), rotate: lib.degrees(rot) });
      } else {
        const png = await pdf.embedPng(textPicture(s.s, s.c, size * 4));
        const h = size * 1.25, w = h * png.width / png.height;
        page.drawImage(png, { ...at(x, y + h), width: w, height: h, rotate: lib.degrees(rot) });
      }
      continue;
    }
    let path = "M" + (s.p[0] * W).toFixed(2) + " " + (s.p[1] * H).toFixed(2);
    if (s.p.length === 2) path += "l0.01 0";   // a dot
    for (let k = 2; k < s.p.length; k += 2) path += "L" + (s.p[k] * W).toFixed(2) + " " + (s.p[k + 1] * H).toFixed(2);
    page.drawSvgPath(path, { ...at(0, 0), rotate: lib.degrees(rot), borderColor: hex(s.c, lib), borderWidth: s.w * W,
                             borderOpacity: s.a || 1, borderLineCap: lib.LineCapStyle.Round });
  }
  page.pushOperators(lib.popGraphicsState());
}

// Typed text as a PNG, for letters the built-in PDF fonts don't have
function textPicture(text, color, px) {
  const c = el("canvas"), ctx = c.getContext("2d");
  const font = "600 " + px + "px " + getComputedStyle(document.querySelector(".reveal") || document.body).fontFamily;
  ctx.font = font;
  c.width = Math.ceil(ctx.measureText(text).width) + 4;
  c.height = Math.ceil(px * 1.25);
  ctx.font = font;
  ctx.fillStyle = color;
  ctx.textBaseline = "top";
  ctx.fillText(text, 2, px * 0.1);
  return c.toDataURL("image/png");
}

// ---- Gallery: every page as a thumbnail ----

class Gallery {
  constructor(root) {
    this.root = root;
    this.title = root.dataset.title;
    this.strip = el("div", "pdfv-strip");
    this.thumbs = [];
    const head = el("div", "pdfv-bar");
    this.count = el("span", "pdfv-count");
    head.append(el("span", "pdfv-title", this.title), this.count, downloadMenu(() => this.url));
    root.replaceChildren(this.strip, head);
  }
  async start() {
    [this.url, this.doc] = await openPdf(this.root);
    const pages = this.doc.numPages;
    this.count.textContent = pages + (pages === 1 ? " page" : " pages") + " · tap one to open it";
    for (let n = 1; n <= pages; n++) {
      const view = new PageView(this.url, null);
      const thumb = el("button", "pdfv-thumb");
      thumb.type = "button";
      thumb.setAttribute("aria-label", "Open page " + n);
      thumb.append(view.el, el("span", "pdfv-num", String(n)));
      thumb.addEventListener("click", () => popup.open(this.url, this.title, n));
      this.strip.append(thumb);
      this.thumbs.push(view);
    }
    await this.refresh();
  }
  async refresh() {
    if (!this.doc) return;
    const h = this.thumbs[0] ? this.thumbs[0].el.parentElement.clientHeight - 28 : 160;
    for (let n = 1; n <= this.thumbs.length; n++) await this.thumbs[n - 1].show(this.doc, n, 1000, h);
  }
}

// ---- Popup: one big page, movable and resizable; arrow keys turn its pages while it's open ----

const popup = {
  build() {
    const root = this.root = el("div", "pdfv-popup");
    root.setAttribute("role", "dialog");
    root.dataset.preventSwipe = "";
    this.title = el("span", "pdfv-title");
    this.count = el("span", "pdfv-count");
    this.prev = button("prev", "Previous page", () => this.go(this.n - 1));
    this.next = button("next", "Next page", () => this.go(this.n + 1));
    const head = el("div", "pdfv-bar pdfv-head");
    head.append(this.title, this.prev, this.count, this.next, button("close", "Close (Esc)", () => this.close()));
    this.stage = el("div", "pdfv-stage");
    this.page = new PageView(null, this);
    this.stage.append(this.page.el);
    head.insertBefore(zoomBar(this), head.lastChild);
    head.insertBefore(downloadMenu(() => this.url), head.lastChild);
    const grip = el("div", "pdfv-grip");
    grip.title = "Drag to resize";
    root.append(head, penBar(this), this.stage, grip);
    document.body.append(root);

    // drag by the title bar, resize by the corner
    const track = (handle, move) => {
      handle.addEventListener("pointerdown", (e) => {
        if (e.target.closest("button")) return;
        e.preventDefault();
        handle.setPointerCapture(e.pointerId);
        const start = { x: e.clientX, y: e.clientY, r: root.getBoundingClientRect() };
        const onMove = (ev) => move(ev.clientX - start.x, ev.clientY - start.y, start.r);
        const onUp = () => {
          handle.removeEventListener("pointermove", onMove);
          handle.removeEventListener("pointerup", onUp);
          handle.removeEventListener("pointercancel", onUp);
          this.go(this.n);
        };
        handle.addEventListener("pointermove", onMove);
        handle.addEventListener("pointerup", onUp);
        handle.addEventListener("pointercancel", onUp);
      });
    };
    track(head, (dx, dy, r) => {
      root.style.left = Math.min(Math.max(r.left + dx, 60 - r.width), innerWidth - 60) + "px";
      root.style.top = Math.min(Math.max(r.top + dy, 0), innerHeight - 60) + "px";
    });
    let later = 0;
    track(grip, (dx, dy, r) => {
      root.style.width = Math.max(300, r.width + dx) + "px";
      root.style.height = Math.max(320, r.height + dy) + "px";
      clearTimeout(later);
      later = setTimeout(() => this.go(this.n), 150);
    });

    addEventListener("keydown", (e) => {
      if (!this.isOpen || e.target.closest("input, textarea") || document.querySelector(".pdfv-menu")) return;   // typing, or the Download menu is open
      const zoomKey = { "+": 1, "=": 1, "-": -1 }[e.key];
      if (zoomKey || e.key === "0") {
        if (zoomKey) this.zoomStep(zoomKey);
        else this.zoomTo(1);
        e.preventDefault();
        e.stopImmediatePropagation();
        return;
      }
      const step = { ArrowLeft: -1, ArrowUp: -1, PageUp: -1, ArrowRight: 1, ArrowDown: 1, PageDown: 1, " ": 1 }[e.key];
      if (step) this.go(this.n + step);
      else if (e.key === "Escape") this.close();
      else return;
      e.preventDefault();
      e.stopImmediatePropagation();   // reveal.js doesn't change slides meanwhile
    }, true);
  },
  async open(url, title, n) {
    if (!this.root) this.build();
    const root = this.root;
    if (!this.isOpen) {   // large and in the middle each time it opens
      const h = innerHeight * 0.9, w = Math.min(innerWidth * 0.94, h * 0.8);
      Object.assign(root.style, { width: w + "px", height: h + "px", left: (innerWidth - w) / 2 + "px", top: (innerHeight - h) / 2 + "px" });
    }
    // it sits outside the slides, so borrow their font
    root.style.fontFamily = getComputedStyle(document.querySelector(".reveal") || document.body).fontFamily;
    root.classList.add("pdfv-open");
    this.isOpen = true;
    this.url = this.page.url = url;
    this.title.textContent = title;
    this.doc = await loadPdf(url);
    this.go(n);
  },
  close() {
    this.isOpen = false;
    this.root.classList.remove("pdfv-open");
  },
  async go(n) {
    if (!this.doc || !this.isOpen) return;
    this.n = Math.min(Math.max(1, n), this.doc.numPages);
    this.count.textContent = this.n + " / " + this.doc.numPages;
    this.prev.disabled = this.n === 1;
    this.next.disabled = this.n === this.doc.numPages;
    await this.page.show(this.doc, this.n, this.stage.clientWidth, this.stage.clientHeight, this.zoom);
  },
};

// ---- Start each box when it first comes into view (all at once when printing) ----

const started = [];
async function start(root) {
  if (root.dataset.started) return;   // a box starts once (the page's boxes, or one the toolbox adds)
  root.dataset.started = "1";
  const part = root.dataset.layout === "gallery" ? new Gallery(root) : new Viewer(root);
  try {
    await part.start();
    started.push(part);
  } catch (e) {
    console.warn("pdf-viewer:", root.dataset.src, e);
    showError(root, part.title);
  }
  root.removeAttribute("data-pending");   // scripts/slides_pdf.py waits for this when printing
}

const boxes = [...document.querySelectorAll(".pdfv")];
if (PRINT || !("IntersectionObserver" in window)) {
  boxes.forEach(start);
} else {
  const seen = new IntersectionObserver((entries) => {
    for (const entry of entries) {
      if (entry.isIntersecting) { seen.unobserve(entry.target); start(entry.target); }
    }
  });
  boxes.forEach((box) => seen.observe(box));
}

// Boxes added later (the classroom toolbox's Packet) start through this
window.PdfViewer = { start: start };
document.dispatchEvent(new Event("pdf-viewer-ready"));

// Redraw sharp after the window (and so reveal.js's slide scale) changes size
let resizing = 0;
addEventListener("resize", () => {
  clearTimeout(resizing);
  resizing = setTimeout(() => {
    started.forEach((part) => part.refresh());
    if (popup.isOpen) popup.go(popup.n);
  }, 200);
});
