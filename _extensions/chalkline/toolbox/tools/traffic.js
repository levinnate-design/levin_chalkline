/*
  Traffic light: red (Stop), yellow (Get ready), green (Go). Tap a light to turn it on, tap it again
  to turn it off. The tool is the light's dark case, with no card around it. Tall, the lights are
  one above the other; drag it wide and they line up side by side.
  Saved as "traffic": "red", "yellow", "green" or "" (all off).
*/
(function () {
  const T = window.ChalklineToolbox;
  const LIGHTS = [
    { id: "red", label: "Stop", color: "#ff3b30" },
    { id: "yellow", label: "Get ready", color: "#ffcc00" },
    { id: "green", label: "Go", color: "#30d158" },
  ];

  T.tool("traffic", { title: "Traffic light", icon: "traffic-cone", w: 190, h: 420, minW: 110, minH: 150, keys: ["traffic"], free: true },
    class extends T.ToolElement {
      static css = `
:host { flex: 1; min-height: 0; display: flex; container-type: size; }
.case {
  flex: 1; min-width: 0; display: flex; flex-direction: column; align-items: center; justify-content: space-evenly;
  padding: 6cqmin;
  border-radius: min(16cqmin, 36px);
  background: linear-gradient(#2a303b, #15191f);
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.1), 0 2px 6px rgba(0, 0, 0, 0.25), 0 18px 44px rgba(0, 0, 0, 0.38);
}
.lights { display: flex; flex-direction: column; align-items: center; gap: 4cqh; }
.light {
  --c: #888;
  flex: none; width: min(22cqh, 76cqw); aspect-ratio: 1; padding: 0; border: 0; border-radius: 50%; cursor: pointer;
  background: color-mix(in srgb, var(--c) 20%, #14181e);
  box-shadow: inset 0 0.4cqh 1.6cqh rgba(0, 0, 0, 0.55);
  transition: background 0.2s, box-shadow 0.2s, transform 0.08s;
}
.light:active { transform: scale(0.96); }
.light.on {
  background: radial-gradient(circle at 50% 35%, color-mix(in srgb, var(--c) 45%, #fff), var(--c) 60%);
  box-shadow: 0 0 7cqmin color-mix(in srgb, var(--c) 75%, transparent), inset 0 -0.6cqh 1.5cqh rgba(0, 0, 0, 0.2);
}
.label {
  flex: none; min-height: 1.2em; color: var(--c, #fff); text-align: center;
  font-size: min(8cqh, 17cqw); font-weight: 700; line-height: 1.2;
}
/* Wide: the lights side by side */
@container (min-aspect-ratio: 5/4) {
  .lights { flex-direction: row; gap: 5cqw; }
  .light { width: min(24cqw, 58cqh); }
  .label { font-size: min(14cqh, 8cqw); }
}
`;
      build(root) {
        const self = this;
        this.lights = LIGHTS.map(function (l) {
          return T.h("button", { class: "light", style: "--c:" + l.color, "aria-label": l.label, title: l.label, onclick: function () {
            T.save("traffic", T.load("traffic", "") === l.id ? "" : l.id);
            self.refresh();
          } });
        });
        this.label = T.h("div", { class: "label", "aria-live": "polite" });
        root.append(T.h("div", { class: "case" }, T.h("div", { class: "lights" }, ...this.lights), this.label));
        this.refresh();
      }
      refresh() {
        const on = T.load("traffic", "");
        const l = LIGHTS.find(function (x) { return x.id === on; });
        this.lights.forEach(function (b, i) { b.classList.toggle("on", LIGHTS[i].id === on); });
        this.label.textContent = l ? l.label : "";
        this.label.style.setProperty("--c", l ? l.color : "#fff");
      }
    });
})();
