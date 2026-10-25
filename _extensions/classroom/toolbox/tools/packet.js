/*
  Packet: the unit packet as pages in a sidebar at the left edge (P opens and closes it); tap one
  to open it large in the PDF viewer (zoom, pens, arrow keys to turn pages). The student copy, or the teacher edition with the answer keys.
  No shadow root: the PDF viewer expects to be in the page.
*/
(function () {
  const T = window.ChalklineToolbox;
  const { load, save, h, icon, course, unitMenu } = T;

  function build(body, panel) {
    // Starts on this deck's unit; the menu picks another.
    const data = course();
    const units = data ? data.units.filter(function (u) { return u.packet; }) : [];
    if (!units.length) { body.append(h("div", { class: "ui-empty", text: "This course has no unit packets yet." })); return {}; }
    let unit = (units.find(function (u) { return u.id === data.unit; }) || units[0]).id, teacher = false;
    const key = h("button", { class: "ui-btn ui-small ct-packet-key", "aria-pressed": "false", text: "Answer key",
      title: "Show the teacher edition, with the answer keys", onclick: function () {
        teacher = !teacher; key.setAttribute("aria-pressed", String(teacher)); paint();
      } });
    const pages = h("div", { class: "ct-packet-pages ct-nodrag" });
    body.append(h("div", { class: "ct-packet-head" }, unitMenu(units, unit, null, function (v) { unit = v; paint(); }), key), pages);

    function paint() {
      const u = units.find(function (x) { return x.id === unit; });
      const box = h("div", { class: "pdfv pdfv-gallery", "data-layout": "gallery", "data-ink": "true", "data-prevent-swipe": "",
        "data-src": data.root + (teacher ? u.packet.replace(/-packet\.pdf$/, "-teacher-packet.pdf") : u.packet),
        "data-title": u.title + (teacher ? " · Teacher edition" : " · Packet") });
      pages.replaceChildren(box);
      if (window.PdfViewer) window.PdfViewer.start(box);
      else document.addEventListener("pdf-viewer-ready", function () { window.PdfViewer.start(box); }, { once: true });
    }
    paint();
    return {};
  }

  T.tool("packet", {
    title: "Packet", icon: "files", w: 190, minW: 160, maxW: 420, keys: [],
    // A sidebar at the left edge; the slides move over to make room. P opens and closes it.
    dock: "left", key: { keyCode: 80, key: "P" },
  }, class extends T.ToolElement {
    static shadow = false;
    static css = `
/* A sidebar: the unit menu, Answer key, and the pages */
.ct-body.ct-packet { padding: 12px 10px 10px; }
ct-packet { gap: 8px; }
.ct-packet-head { flex: none; display: flex; flex-wrap: wrap; gap: 6px; align-items: center; }
.ct-packet-head .ui-select { flex: 1 1 100%; }
.ct-packet-key { flex: none; font-size: 13px; white-space: nowrap; }
.ct-packet-key[aria-pressed="true"] { border-color: #e07b00; background: #fff7ee; color: #8a4500; }
.ct-packet-pages { flex: 1; min-height: 0; display: flex; }
.ct-packet-pages .pdfv { flex: 1; min-width: 0; min-height: 0; padding: 0; border: 0; border-radius: 0; background: transparent; }
.ct-packet-pages .pdfv-strip { flex: 1; min-height: 0; flex-direction: column; align-items: center; overflow-x: hidden; overflow-y: auto; }
.ct-packet-pages .pdfv-thumb { width: 100%; height: auto !important; aspect-ratio: 0.66; }
.ct-packet-pages .pdfv-bar { flex-wrap: wrap; font-size: 12px; }
.ct-packet-pages .pdfv-title { display: none; }   /* the unit menu above says which */
`;
    build(root) { this.api = build(root, this.panel) || {}; }
    refresh() { if (this.api.refresh) this.api.refresh(); }
    close() { if (this.api.close) this.api.close(); }
  });
})();
