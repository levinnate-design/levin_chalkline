/*
  View source (U): how this slide is made. The slide's part of the deck's .qmd file, as it was
  typed (shortcodes, ::: blocks, notes), with colors and line numbers, and it follows you as you
  change slides. Wrap folds long lines to fit (on at first; remembered). Copy puts it on the clipboard, to start a slide of your own from it. On your own
  computer, Open in VS Code opens the file at that line.

  The source comes from toolbox/source.lua (filter.lua puts it in each teacher deck as JSON):
  the file's text and where each slide starts and ends. A slide is matched to its part by its id
  (from its heading). One with no id of its own (a --- slide) takes the next part without one;
  anything else (a slide an include or a game added) shows the part it came from.
*/
(function () {
  const T = window.ChalklineToolbox;

  let data;
  function source() {
    if (data === undefined) {
      const el = document.getElementById("chalkline-source");
      try { data = el ? JSON.parse(el.textContent) : null; } catch (e) { data = null; }
      if (data) data.lines = data.text.split("\n");
    }
    return data;
  }

  // Which part of the file each slide shows: an index into data.slides, for each of Reveal's slides
  function partsFor(slides, parts) {
    const ids = new Set(slides.map(function (s) { return s.id; }).filter(Boolean));
    const byId = new Map();
    parts.forEach(function (p, i) { if (p.id && !byId.has(p.id)) byId.set(p.id, i); });
    let at = -1;
    return slides.map(function (s) {
      if (s.id && byId.has(s.id)) at = byId.get(s.id);
      else if (at + 1 < parts.length && (!parts[at + 1].id || !ids.has(parts[at + 1].id))) at++;
      return Math.max(at, 0);
    });
  }

  /* ---------------- Colors ----------------
     A small highlighter for what a teacher types in a deck: headings, ::: blocks and their
     {.classes}, {{< shortcodes >}}, `code`, **bold**, links, lists, comments, the labels at the
     top, and ``` code blocks (left plain inside). One line at a time; state carries the blocks. */
  const esc = function (s) { return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;"); };
  const span = function (cls, s) { return '<span class="' + cls + '">' + esc(s) + "</span>"; };
  const INLINE = /(\{\{<[\s\S]*?>\}\})|(`[^`]+`)|(\{[^{}\n]*\})|(\*\*[^*]+\*\*)|(<!--[\s\S]*?-->)|(\[[^\]\n]*\]\([^)\n]*\))|(<\/?[A-Za-z][^>]*>)/g;
  const INLINE_CLS = ["sc", "code", "attr", "b", "cm", "link", "html"];
  function inline(s) {
    let out = "", last = 0, m;
    INLINE.lastIndex = 0;
    while ((m = INLINE.exec(s))) {
      out += esc(s.slice(last, m.index));
      for (let g = 1; g < m.length; g++) if (m[g]) { out += span(INLINE_CLS[g - 1], m[0]); break; }
      last = INLINE.lastIndex;
    }
    return out + esc(s.slice(last));
  }
  function colorLine(l, st) {
    if (st.yaml) {
      if (/^(---|\.\.\.)\s*$/.test(l)) { st.yaml = false; return span("rule", l); }
      const m = l.match(/^(\s*-?\s*)([\w-]+)(:)(.*)$/);
      if (!m) return span("val", l);
      const c = m[4].search(/\s#/);   // a # comment after the value
      return esc(m[1]) + span("key", m[2]) + esc(m[3]) + (c < 0 ? span("val", m[4]) : span("val", m[4].slice(0, c)) + span("cm", m[4].slice(c)));
    }
    if (st.fence) {
      if (new RegExp("^\\s*" + st.fence + "\\s*$").test(l)) st.fence = null;
      return span("code", l);
    }
    let m = l.match(/^\s*(`{3,}|~{3,})/);
    if (m) { st.fence = m[1][0] + "{" + m[1].length + ",}"; return span("code", l); }   // closed by as many or more
    if ((m = l.match(/^(#{1,6}\s)(.*)$/))) return '<span class="h">' + esc(m[1]) + inline(m[2]) + "</span>";
    if ((m = l.match(/^(\s*:{3,})(.*)$/))) return span("fence", m[1]) + '<span class="fence-rest">' + inline(m[2]) + "</span>";
    if (/^-{3,}\s*$/.test(l)) return span("rule", l);
    if ((m = l.match(/^(\s*)([-*+]|\d+[.)])(\s.*)$/))) return esc(m[1]) + span("li", m[2]) + inline(m[3]);
    return inline(l);
  }

  T.tool("source", { title: "View source", icon: "code", w: 560, h: 440, minW: 300, minH: 180,
    key: { keyCode: 85, key: "U" }, keys: ["source-wrap"],   // like a browser's Ctrl+U
    start: function () { return { x: Math.max(8, window.innerWidth - 560 - 24), y: 64 }; } },
    class extends T.ToolElement {
      static css = `
.bar { flex: none; display: flex; align-items: center; gap: 8px; margin: -2px 26px 8px 2px; min-width: 0; }
.where { flex: 1; min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
  color: var(--ui-muted); font-size: 13px; font-weight: 600; }
.where b { color: var(--ui-ink); }
.code-box {
  flex: 1; min-height: 0; overflow: auto; margin: 0; padding: 10px 0;
  background: var(--ui-soft); border-radius: var(--ui-r-sm); cursor: text; user-select: text; -webkit-user-select: text;
  font: 500 clamp(12px, 2.6cqw, 22px)/1.5 ui-monospace, SFMono-Regular, Menlo, Consolas, "Liberation Mono", monospace;
  color: var(--ui-ink); tab-size: 2;
}
.row { display: flex; }
.n { flex: none; position: sticky; left: 0; min-width: 3.2em; padding: 0 0.9em 0 0.6em; text-align: right;
  color: var(--ui-line-strong); background: var(--ui-soft); user-select: none; -webkit-user-select: none; }
.t { white-space: pre; padding-right: 1em; }
.code-box.wrap .t { flex: 1; min-width: 0; white-space: pre-wrap; overflow-wrap: anywhere; }
a.ui-btn { text-decoration: none; }
.ui-btn[aria-pressed="true"] { background: var(--ui-accent-soft); color: var(--ui-accent); }
.empty { padding: 1em; color: var(--ui-muted); font-family: inherit; white-space: normal; }
.h { color: var(--ui-accent); font-weight: 800; }
.fence { color: #7b4fc9; font-weight: 700; }
.fence-rest, .attr { color: #7b4fc9; }
.sc { color: #b34d00; font-weight: 600; }
.code { color: #157575; }
.b { font-weight: 800; }
.link { color: var(--ui-focus); }
.li, .rule { color: var(--ui-muted); font-weight: 700; }
.cm { color: var(--ui-muted); font-style: italic; }
.html { color: #157575; }
.key { color: var(--ui-accent); font-weight: 700; }
.val { color: #23824a; }
`;
      build(root) {
        const self = this, h = T.h;
        this.where = h("div", { class: "where" });
        this.copyBtn = h("button", { class: "ui-btn ui-small", title: "Copy this slide's source", onclick: function () { self.copy(); } }, T.icon("copy"), " Copy");
        this.wrapBtn = h("button", { class: "ui-btn ui-small", title: "Fold long lines to fit", text: "Wrap", onclick: function () {
          T.save("source-wrap", !T.load("source-wrap", true)); T.changed("source-wrap"); self.refresh();
        } });
        const d = source();
        // Open in VS Code: on this computer only (the file is here), never on the published site
        const here = d && d.path && /^(localhost|127\.|\[::1\]|0\.0\.0\.0)/.test(location.host);
        this.vscode = here ? h("a", { class: "ui-btn ui-small", title: "Open the file at this slide in VS Code", text: "Open in VS Code" }) : null;
        this.box = h("pre", { class: "code-box ct-nodrag", tabindex: "0", "aria-label": "This slide's source" });
        root.append(h("div", { class: "bar" }, this.where, this.wrapBtn, this.copyBtn, this.vscode), this.box);
        this.refresh();
        this.onSlide = function () { self.paint(); };
        if (window.Reveal) {
          Reveal.on("slidechanged", this.onSlide);
          Reveal.on("ready", this.onSlide);
        }
        this.paint();
      }
      part() {
        const d = source();
        if (!d || !window.Reveal || !Reveal.isReady()) return null;
        const slides = Reveal.getSlides();
        if (!this.map || this.map.length !== slides.length) this.map = partsFor(slides, d.slides);
        const i = slides.indexOf(Reveal.getCurrentSlide());
        return d.slides[this.map[i < 0 ? 0 : i]];
      }
      paint() {
        const d = source(), p = this.part(), box = this.box, h = T.h;
        box.textContent = "";
        this.copyBtn.disabled = !p;
        if (!p) {
          this.where.textContent = "View source";
          box.append(h("div", { class: "empty", text: d ? "…" : "This deck has no source to show. Render it again to add it." }));
          return;
        }
        this.where.innerHTML = "<b>Lines " + p.from + "–" + p.to + "</b> · " + esc(d.file.split("/").pop());
        this.where.title = d.file + ", lines " + p.from + "–" + p.to;
        if (this.vscode) this.vscode.href = "vscode://file/" + encodeURI(d.path.replace(/^\//, "")).replace(/#/g, "%23") + ":" + p.from;
        // The labels at the top are YAML: color them as YAML if this part starts with them
        const st = { yaml: p.from === 1 && /^---\s*$/.test(d.lines[0]) ? "start" : false, fence: null };
        let html = "";
        for (let n = p.from; n <= p.to; n++) {
          const l = d.lines[n - 1];
          let t;
          if (st.yaml === "start") { st.yaml = true; t = span("rule", l); }
          else t = colorLine(l, st);
          html += '<div class="row"><span class="n">' + n + '</span><span class="t">' + (t || " ") + "</span></div>";
        }
        box.innerHTML = html;
        box.scrollTop = 0; box.scrollLeft = 0;
      }
      refresh() {   // Wrap changed (here, or in another deck)
        const on = T.load("source-wrap", true);
        this.box.classList.toggle("wrap", on);
        this.wrapBtn.setAttribute("aria-pressed", on ? "true" : "false");
      }
      text() {
        const d = source(), p = this.part();
        return p ? d.lines.slice(p.from - 1, p.to).join("\n") + "\n" : "";
      }
      copy() {
        const self = this, b = this.copyBtn, t = this.text();
        function done() {
          b.lastChild.textContent = " Copied";
          clearTimeout(self.copied);
          self.copied = setTimeout(function () { b.lastChild.textContent = " Copy"; }, 1500);
        }
        if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(t).then(done, select);
        else select();
        function select() {   // no clipboard here (an older browser, a file:// page): select it to copy by hand
          const r = document.createRange();
          r.selectNodeContents(self.box);
          const sel = self.box.getRootNode().getSelection ? self.box.getRootNode().getSelection() : window.getSelection();
          sel.removeAllRanges(); sel.addRange(r);
        }
      }
      close() {
        if (window.Reveal) { Reveal.off("slidechanged", this.onSlide); Reveal.off("ready", this.onSlide); }
        clearTimeout(this.copied);
      }
    });
})();
