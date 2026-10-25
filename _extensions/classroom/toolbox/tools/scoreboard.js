/*
  Scoreboard: points for teams, in one card split into a band of color for each team: its name (tap to change it),
  − and +, and the score, big. A crown marks the one team in the lead. Point at the scoreboard for
  its buttons: + Team, − Team, Reset and the sound. Narrow (a column in the slide's margin), each
  team stacks: the name on top, − score + under it.
  Saved as "scores": { sound, teams: [{ name, score }] }, so the scores carry on into the next deck.
*/
(function () {
  const T = window.ChalklineToolbox;

  T.tool("scoreboard", { title: "Scoreboard", icon: "trophy", w: 360, h: 300, minW: 150, minH: 180, keys: ["scores"], free: true },
    class extends T.ToolElement {
      static css = `
:host { flex: 1; min-height: 0; display: flex; flex-direction: column; container-type: size; }
/* One card; each team is a band of its color, with a thin line between */
.rows {
  flex: 1; min-height: 0; display: flex; flex-direction: column; overflow: hidden;
  border-radius: min(9cqmin, 22px);
  box-shadow: var(--ui-shadow-float);
}
.row {
  flex: 1; min-height: 0; display: flex; align-items: center; gap: 0.35em; padding: 0 0.35em 0 0.25em;
  background: color-mix(in srgb, var(--team) 86%, #000); color: #fff;
  font-size: min(calc(60cqh / var(--rows)), 9cqw);
}
.row + .row { box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.22); }
.name {
  flex: 1; min-width: 0; padding: 0.05em 0.2em; border: 0; border-radius: 0.2em;
  background: transparent; color: #fff; font: inherit; font-size: 0.6em; font-weight: 700;
}
.name:focus { outline: 2px solid rgba(255, 255, 255, 0.85); background: rgba(255, 255, 255, 0.15); }
.crown { display: inline-flex; font-size: 0.55em; color: #ffe27a; }
.score { min-width: 1.4em; text-align: center; font-weight: 800; font-variant-numeric: tabular-nums; line-height: 1; }
.score.pop { animation: pop 0.35s ease-out; }
@keyframes pop { 40% { transform: scale(1.3); } }
.round {
  flex: none; width: 1.1em; height: 1.1em; display: grid; place-items: center; padding: 0; border: 0; border-radius: 50%; cursor: pointer;
  background: rgba(255, 255, 255, 0.2); color: #fff; font-size: 0.75em;
  transition: background 0.12s, transform 0.06s;
}
.round:hover { background: rgba(255, 255, 255, 0.32); }
.round:active { transform: scale(0.92); }
.round.plus { background: #fff; color: color-mix(in srgb, var(--team) 86%, #000); }
.round .ui-icon { font-size: 0.7em; }
/* The scoreboard's buttons: when you point at it (always, on a touch screen) */
.bar {
  flex: none; display: flex; justify-content: center; flex-wrap: wrap; gap: 6px; padding-top: 8px;
  font-size: clamp(12px, 5cqmin, 16px); opacity: 0; transition: opacity 0.15s;
}
:host(:hover) .bar, :host(:focus-within) .bar { opacity: 1; }
@media (hover: none) { .bar { opacity: 1; } }
.bar .ui-btn { background: #fff; box-shadow: 0 2px 8px rgba(16, 35, 63, 0.25); }
.bar .ui-btn:hover { background: var(--ui-soft); }
.bar .ui-btn.ui-armed { background: var(--ui-alarm); color: #fff; }
/* Narrow: each team stacks, the name on top and − score + under it */
@container (max-width: 250px) {
  .row {
    display: grid; grid-template-columns: auto 1fr auto; grid-template-areas: "name name name" "minus score plus";
    align-items: center; justify-items: center; row-gap: 0.05em; column-gap: 0.15em; padding: 0.15em 0.3em;
    font-size: min(calc(40cqh / var(--rows)), 24cqw);
  }
  .name { grid-area: name; width: 100%; text-align: center; font-size: 0.5em; }
  .crown { grid-area: name; justify-self: end; font-size: 0.42em; }
  .minus { grid-area: minus; }
  .score { grid-area: score; }
  .plus { grid-area: plus; }
  .bar { gap: 4px; font-size: 12px; }
}
`;
      build(root) {
        const self = this;
        this.rows = T.h("div", { class: "rows" });
        this.soundBtn = T.h("button", { class: "ui-btn", title: "Sound on/off", "aria-label": "Sound on/off", onclick: function () {
          self.s.sound = !self.s.sound; self.keep(); self.paint();
        } });
        const add = T.h("button", { class: "ui-btn", text: "+ Team", onclick: function () {
          if (self.s.teams.length >= 8) return;
          self.s.teams.push({ name: "Team " + (self.s.teams.length + 1), score: 0 }); self.keep(); self.paint();
        } });
        const remove = T.sureButton("− Team", function () {
          if (self.s.teams.length <= 1) return;
          self.s.teams.pop(); self.keep(); self.paint();
        });
        const reset = T.sureButton("Reset", function () { self.s.teams.forEach(function (t) { t.score = 0; }); self.keep(); self.paint(); });
        root.append(this.rows, T.h("div", { class: "bar" }, add, remove, reset, this.soundBtn));
        this.refresh();
      }
      state() {
        return T.load("scores", { sound: true, teams: [1, 2, 3, 4].map(function (n) { return { name: "Team " + n, score: 0 }; }) });
      }
      keep() { T.save("scores", this.s); }
      change(i, by) {
        this.s.teams[i].score += by;
        this.keep();
        if (this.s.sound) T.beep(by > 0 ? 880 : 330, 0.25, 0.12);
        this.paint();
        const el = this.rows.children[i] && this.rows.children[i].querySelector(".score");
        if (el) { el.classList.remove("pop"); void el.offsetWidth; el.classList.add("pop"); }
      }
      paint() {
        const self = this, s = this.s;
        this.rows.textContent = "";
        this.rows.style.setProperty("--rows", s.teams.length);
        const top = Math.max.apply(null, s.teams.map(function (t) { return t.score; }));
        const leaders = s.teams.filter(function (t) { return t.score === top; }).length;
        s.teams.forEach(function (t, i) {
          const name = T.h("input", { class: "name", maxlength: 24, "aria-label": "Team name",
            onchange: function () { t.name = name.value.trim() || "Team " + (i + 1); self.keep(); },
            onkeydown: function (e) { if (e.key === "Enter") name.blur(); } });
          name.value = t.name;
          self.rows.append(T.h("div", { class: "row", style: "--team:" + T.COLORS[i % T.COLORS.length] },
            T.h("button", { class: "round minus", "aria-label": "Minus one", onclick: function () { self.change(i, -1); } }, T.icon("minus")),
            name,
            T.h("span", { class: "crown" }, top > 0 && leaders === 1 && t.score === top ? T.icon("crown") : ""),
            T.h("span", { class: "score", text: t.score }),
            T.h("button", { class: "round plus", "aria-label": "Plus one", onclick: function () { self.change(i, 1); } }, T.icon("plus"))));
        });
        this.soundBtn.replaceChildren(T.icon(s.sound ? "bell" : "bell-off"));
      }
      refresh() { this.s = this.state(); this.paint(); }
    });
})();
