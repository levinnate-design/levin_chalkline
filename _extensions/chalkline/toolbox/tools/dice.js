/*
  Dice: 1 to 6 dice, straight on the slide. Tap the dice (or Roll) to roll them; the total shows
  under them. Point at the dice for the buttons: Roll, and − / + for how many.
  Saved as "dice": { values: [...] }.
*/
(function () {
  const T = window.ChalklineToolbox;
  const PIPS = [[], [4], [0, 8], [0, 4, 8], [0, 2, 6, 8], [0, 2, 4, 6, 8], [0, 2, 3, 5, 6, 8]];

  T.tool("dice", { title: "Dice", icon: "dices", w: 340, h: 240, minW: 200, minH: 170, keys: ["dice"], free: true },
    class extends T.ToolElement {
      static css = `
.tray {
  flex: 1; min-height: 0; display: flex; flex-wrap: wrap; align-content: center; justify-content: center; gap: 5cqmin;
  cursor: pointer;
}
.die {
  --size: min(calc(56cqh / var(--rows)), calc(78cqw / var(--cols)));
  display: grid; grid-template: repeat(3, 1fr) / repeat(3, 1fr);
  width: var(--size); height: var(--size); padding: calc(var(--size) * 0.13);
  border-radius: 22%;
  background: linear-gradient(#fff, #f1f4f8);
  box-shadow: inset 0 -0.35em 0 rgba(16, 35, 63, 0.06), 0 1px 3px rgba(16, 35, 63, 0.18), 0 12px 28px rgba(16, 35, 63, 0.32);
  font-size: calc(var(--size) / 10);
}
.die span { display: block; margin: 15%; border-radius: 50%; }
.die .pip { background: var(--ui-ink); box-shadow: inset 0 0.08em 0.1em rgba(0, 0, 0, 0.35); }
.die.spin { animation: tumble 0.14s linear infinite; }
.die.spin:nth-child(even) { animation-direction: reverse; }
@keyframes tumble { 0% { transform: rotate(-9deg) translateY(-2%); } 50% { transform: rotate(9deg) translateY(2%); } 100% { transform: rotate(-9deg) translateY(-2%); } }
.die.land { animation: land 0.25s ease-out; }
@keyframes land { 40% { transform: scale(1.06); } }
.total {
  flex: none; align-self: center; min-height: 1.6em; margin-top: 4cqh; padding: 0.15em 0.8em; border-radius: 999px;
  background: #fff; color: var(--ui-ink); box-shadow: 0 2px 10px rgba(16, 35, 63, 0.3);
  font-size: clamp(14px, 9cqh, 30px); font-weight: 700; font-variant-numeric: tabular-nums;
}
.total:empty { visibility: hidden; }
/* The buttons: when you point at the dice (always, on a touch screen) */
.bar {
  flex: none; display: flex; justify-content: center; align-items: center; gap: 6px; padding-top: 8px;
  font-size: clamp(12px, 5.5cqmin, 18px); opacity: 0; transition: opacity 0.15s;
}
:host(:hover) .bar, :host(:focus-within) .bar { opacity: 1; }
@media (hover: none) { .bar { opacity: 1; } }
.bar .ui-btn { box-shadow: 0 2px 8px rgba(16, 35, 63, 0.25); }
.bar .ui-btn:not(.ui-primary) { background: #fff; }
.count { min-width: 4.2em; padding: 0.3em 0.6em; border-radius: 999px; background: #fff; text-align: center; font-weight: 600; box-shadow: 0 2px 8px rgba(16, 35, 63, 0.25); }
`;
      build(root) {
        const self = this, h = T.h;
        this.tray = h("div", { class: "tray", title: "Tap to roll", onclick: function () { self.roll(); } });
        this.total = h("div", { class: "total", "aria-live": "polite" });
        this.count = h("span", { class: "count" });
        root.append(this.tray, this.total, h("div", { class: "bar" },
          h("button", { class: "ui-btn ui-primary", text: "Roll", onclick: function () { self.roll(); } }),
          h("button", { class: "ui-btn", "aria-label": "Fewer dice", text: "−", onclick: function () { self.setCount(-1); } }),
          this.count,
          h("button", { class: "ui-btn", "aria-label": "More dice", text: "+", onclick: function () { self.setCount(1); } })));
        this.paint();
      }
      state() { return T.load("dice", { values: [6, 6] }); }
      setCount(by) {
        const s = this.state(), n = Math.min(6, Math.max(1, s.values.length + by));
        while (s.values.length < n) s.values.push(1 + Math.floor(Math.random() * 6));
        s.values.length = n;
        T.save("dice", s); this.paint(s.values);
      }
      roll() {
        const self = this;
        if (this.rolling) return;
        const n = this.state().values.length;
        let k = 0;
        this.rolling = setInterval(function () {
          const v = [];
          for (let i = 0; i < n; i++) v.push(1 + Math.floor(Math.random() * 6));
          self.paint(v, "spin");
          if (++k === 10) { clearInterval(self.rolling); self.rolling = 0; T.save("dice", { values: v }); self.paint(v, "land"); }
        }, 70);
      }
      paint(values, how) {
        const h = T.h;
        values = values || this.state().values;
        this.tray.textContent = "";
        this.tray.style.setProperty("--cols", Math.min(values.length, 3));
        this.tray.style.setProperty("--rows", Math.ceil(values.length / 3));
        values.forEach(function (v) {
          const die = h("div", { class: "die" + (how ? " " + how : ""), role: "img", "aria-label": String(v) });
          for (let i = 0; i < 9; i++) die.append(h("span", { class: PIPS[v].indexOf(i) >= 0 ? "pip" : "" }));
          this.tray.append(die);
        }, this);
        this.total.textContent = values.length > 1 && how !== "spin" ? "Total: " + values.reduce(function (a, b) { return a + b; }, 0) : "";
        this.count.textContent = values.length + (values.length === 1 ? " die" : " dice");
      }
      refresh() { if (!this.rolling) this.paint(); }
      close() { clearInterval(this.rolling); }
    });
})();
