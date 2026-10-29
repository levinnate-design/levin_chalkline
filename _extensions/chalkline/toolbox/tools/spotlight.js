/*
  Spotlight: darkens the screen except a circle. Drag the light (or tap where it should go) to show
  the class where to look; the slider (or the mouse wheel on the dark part) sets its size. Close
  the tool to end it. It isn't brought back in the next deck: it's for one moment.
  Saved: "spotlight-size" (6 to 45, % of the screen).
*/
(function () {
  const T = window.ChalklineToolbox;

  T.tool("spotlight", { title: "Spotlight", icon: "flashlight", w: 240, h: 92, minW: 180, minH: 80 },
    class extends T.ToolElement {
      static css = `
.row { flex: 1; display: flex; align-items: center; gap: 10px; }
.icon { flex: none; display: grid; place-items: center; width: 36px; height: 36px; border-radius: 50%; background: #fff4d6; color: #b07800; font-size: 18px; }
.col { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 4px; }
.label { color: var(--ui-muted); font-size: 13px; font-weight: 600; }
input { width: 100%; margin: 0; accent-color: var(--ui-accent); }
`;
      build(root) {
        const self = this, h = T.h;
        this.spot = { x: window.innerWidth / 2, y: window.innerHeight / 2, r: T.load("spotlight-size", 18) };
        // The dark screen with a hole in it: in the tools' layer, under the tools, over the slides
        const shade = this.shade = h("div", { title: "Drag the light, or tap where it should go",
          style: "position:fixed;inset:0;z-index:0;cursor:move;touch-action:none" });
        document.getElementById("ct-layer").prepend(shade);
        this.slider = h("input", { type: "range", min: 6, max: 45, "aria-label": "Size of the light", oninput: function () { self.size(+self.slider.value); } });
        root.append(h("div", { class: "row" }, h("span", { class: "icon" }, T.icon("flashlight")),
          h("div", { class: "col" }, h("span", { class: "label", text: "Size of the light" }), this.slider)));
        shade.addEventListener("pointerdown", function (e) {
          e.preventDefault();
          shade.setPointerCapture(e.pointerId);
          function to(ev) { self.spot.x = ev.clientX; self.spot.y = ev.clientY; self.paint(); }
          to(e);
          shade.onpointermove = to;
          shade.onpointerup = shade.onpointercancel = function () { shade.onpointermove = null; };
        });
        shade.addEventListener("wheel", function (e) { e.preventDefault(); self.size(self.spot.r + (e.deltaY < 0 ? 2 : -2)); }, { passive: false });
        this.onResize = function () { self.paint(); };
        window.addEventListener("resize", this.onResize);
        this.paint();
      }
      size(v) { this.spot.r = Math.max(6, Math.min(45, v)); T.save("spotlight-size", this.spot.r); this.paint(); }
      paint() {
        const s = this.spot, r = s.r / 100 * Math.min(window.innerWidth, window.innerHeight);
        this.shade.style.background = "radial-gradient(circle at " + s.x + "px " + s.y + "px, transparent " + r + "px, rgba(8, 14, 26, 0.86) " + (r + 3) + "px)";
        this.slider.value = s.r;
      }
      close() { this.shade.remove(); window.removeEventListener("resize", this.onResize); }
    });
})();
