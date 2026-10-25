/*
  QR code: a code for this deck on the STUDENT site, for students' tablets; never this (teacher)
  site with its answer keys. The address is the student site's (student-site: in _quarto.yml) plus
  this deck's path in the site. Point at it for Edit link (any other link) and This deck.
*/
(function () {
  const T = window.ChalklineToolbox;
  const BASE = document.currentScript ? document.currentScript.src.replace(/[^/]*$/, "") : "";   // qrcode.js is beside it

  T.tool("qr", { title: "QR code", icon: "qr-code", w: 300, h: 360, minW: 200, minH: 240 },
    class extends T.ToolElement {
      static css = `
.code { flex: 1; min-height: 0; display: grid; place-items: center; width: 100%; text-align: center; }
.code svg { width: min(100cqw, 80cqh); height: min(100cqw, 80cqh); }
.caption {
  flex: none; max-width: 100%; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; text-align: center;
  color: var(--ui-muted); font-size: clamp(12px, 4.5cqmin, 18px); font-weight: 600;
}
.caption.warn { white-space: normal; color: var(--ui-alarm); line-height: 1.25; }
.field { flex: none; width: 100%; margin-top: 6px; }
.field[hidden] { display: none; }
/* The buttons: when you point at it (always, on a touch screen) */
.ui-actions { opacity: 0; transition: opacity 0.15s; font-size: clamp(13px, 5cqmin, 17px); }
:host(:hover) .ui-actions, :host(:focus-within) .ui-actions { opacity: 1; }
@media (hover: none) { .ui-actions { opacity: 1; } }
`;
      build(root) {
        const self = this, h = T.h;
        const meta = function (name) { return (document.querySelector('meta[name="' + name + '"]') || {}).content || ""; };
        const site = meta("chalkline-student-site"), page = meta("chalkline-page");
        this.deckUrl = site && page ? site.replace(/\/?$/, "/") + page.replace(/^\//, "") : "";
        this.url = this.deckUrl;
        this.code = h("div", { class: "code" });
        this.caption = h("div", { class: "caption" });
        const field = this.field = h("input", { class: "ui-field field", type: "url", "aria-label": "Link for the QR code", hidden: true,
          onchange: function () { self.url = field.value.trim() || self.deckUrl; self.paint(); },
          onkeydown: function (e) { if (e.key === "Enter") field.blur(); } });
        root.append(this.code, this.caption, field, h("div", { class: "ui-actions" },
          h("button", { class: "ui-btn", text: "Edit link", onclick: function () {
            field.hidden = !field.hidden; field.value = self.url; if (!field.hidden) field.select();
          } }),
          h("button", { class: "ui-btn", text: "This deck", disabled: !this.deckUrl, title: this.deckUrl ? "This deck on the student site" : "Needs the student site's address",
            onclick: function () { self.url = self.deckUrl; field.value = self.url; self.paint(); } })));
        if (window.qrcode) this.paint();
        else {
          this.code.textContent = "…";
          if (!document.querySelector("script[data-ct-qrcode]")) document.head.append(h("script", { src: BASE + "qrcode.js", "data-ct-qrcode": "" }));
          document.querySelector("script[data-ct-qrcode]").addEventListener("load", function () { self.paint(); });
        }
      }
      paint() {
        const url = this.url, code = this.code, caption = this.caption;
        if (!url) {   // no student site yet: a code for this page would open the teacher site
          code.textContent = "";
          caption.classList.add("warn");
          caption.textContent = "No student site yet: a code for this page would open the teacher site, with the answer keys. "
            + "Add student-site: \"https://…/\" to _quarto.yml, or use Edit link.";
          return;
        }
        if (!window.qrcode) { code.textContent = "…"; return; }
        let qr;
        try {
          qr = window.qrcode(0, "M");
          qr.addData(encodeURI(decodeURI(url)));   // plain ASCII, whatever was typed
          qr.make();
        } catch (e) { code.textContent = "That link is too long for a QR code."; return; }
        const n = qr.getModuleCount(), q = 4;
        let d = "";
        for (let r = 0; r < n; r++) for (let c = 0; c < n; c++) if (qr.isDark(r, c)) d += "M" + (c + q) + " " + (r + q) + "h1v1h-1z";
        code.innerHTML = '<svg viewBox="0 0 ' + (n + 2 * q) + " " + (n + 2 * q) + '" shape-rendering="crispEdges" role="img" aria-label="QR code">' +
          '<rect width="100%" height="100%" fill="#fff"/><path fill="#000" d="' + d + '"/></svg>';
        caption.textContent = url.replace(/^https?:\/\//, "");
        caption.title = url;
        const onlyHere = /^(file:|https?:\/\/(localhost|127\.|\[::1\]|0\.0\.0\.0))/.test(url);
        caption.classList.toggle("warn", onlyHere);
        if (onlyHere) caption.textContent = "This link works only on this computer: students can't open it. Use Edit link.";
      }
    });
})();
