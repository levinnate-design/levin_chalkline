/*
  Stopwatch: counts up. One tile with the time, big; it turns dark blue while it runs, so the room
  can see from far away that it's going. ▶ starts and pauses, ↺ sets it back to 0.
  Saved as "stopwatch": { since: start time while running, or 0; done: ms counted before that },
  so it keeps counting in the next deck.
*/
(function () {
  const T = window.ChalklineToolbox;

  T.tool("stopwatch", { title: "Stopwatch", icon: "timer", w: 300, h: 170, minW: 170, minH: 100, keys: ["stopwatch"], free: true },
    class extends T.ToolElement {
      static css = `
:host { flex: 1; min-height: 0; display: flex; container-type: size; }
.tile {
  flex: 1; min-width: 0; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 5cqh;
  border-radius: min(14cqmin, 28px);
  background: #fff; color: var(--ui-ink);
  box-shadow: 0 1px 3px rgba(16, 35, 63, 0.1), 0 18px 44px rgba(16, 35, 63, 0.3);
  transition: background 0.25s, color 0.25s;
}
.tile.running { background: var(--ui-accent); color: #fff; }
.time { font-size: min(46cqh, 22cqw); font-weight: 700; font-variant-numeric: tabular-nums; line-height: 1; letter-spacing: -0.02em; }
.tenths { font-size: 0.55em; opacity: 0.5; }
.controls { display: flex; gap: 0.5em; font-size: clamp(14px, 11cqh, 30px); }
.round {
  width: 2em; height: 2em; display: grid; place-items: center; padding: 0; border: 0; border-radius: 50%; cursor: pointer;
  background: var(--ui-soft); color: inherit; font-size: inherit;
  transition: background 0.12s, transform 0.06s;
}
.round:hover { background: var(--ui-soft-hover); }
.round:active { transform: scale(0.94); }
.round.go { background: var(--ui-accent); color: #fff; }
.round .ui-icon { font-size: 0.85em; }
.round.go svg { fill: currentColor; }
.running .round { background: rgba(255, 255, 255, 0.16); }
.running .round:hover { background: rgba(255, 255, 255, 0.26); }
.running .round.go { background: #fff; color: var(--ui-accent); }
/* Short: the time and the buttons side by side */
@container (max-height: 130px) {
  .tile { flex-direction: row; gap: 6cqw; }
  .time { font-size: min(60cqh, 18cqw); }
  .controls { font-size: clamp(13px, 22cqh, 26px); }
}
`;
      build(root) {
        const self = this;
        const state = function () { return T.load("stopwatch", { since: 0, done: 0 }); };
        this.time = T.h("div", { class: "time" });
        this.go = T.h("button", { class: "round go", onclick: function () {
          const s = state();
          if (s.since) T.save("stopwatch", { since: 0, done: s.done + Date.now() - s.since });
          else T.save("stopwatch", { since: Date.now(), done: s.done });
          self.refresh();
        } });
        const reset = T.h("button", { class: "round", "aria-label": "Reset", title: "Reset", onclick: function () {
          const s = state();
          T.save("stopwatch", { since: s.since ? Date.now() : 0, done: 0 });
          self.refresh();
        } }, T.icon("rotate-ccw"));
        this.tile = T.h("div", { class: "tile" }, this.time, T.h("div", { class: "controls" }, this.go, reset));
        root.append(this.tile);
        this.state = state;
        this.refresh();
        this.timer = setInterval(function () { self.refresh(); }, 100);
      }
      refresh() {
        const s = this.state();
        const ms = s.done + (s.since ? Date.now() - s.since : 0);
        const sec = Math.floor(ms / 1000), hrs = Math.floor(sec / 3600), min = Math.floor(sec / 60) % 60;
        const main = (hrs ? hrs + ":" + String(min).padStart(2, "0") : min) + ":" + String(sec % 60).padStart(2, "0");
        const tenths = "." + Math.floor(ms / 100) % 10;
        if (this.shown !== main + tenths) {
          this.shown = main + tenths;
          this.time.replaceChildren(main, T.h("span", { class: "tenths", text: tenths }));
        }
        const running = !!s.since;
        if (this.running !== running) {   // only when it changes, not ten times a second
          this.running = running;
          this.tile.classList.toggle("running", running);
          this.go.replaceChildren(T.icon(running ? "pause" : "play"));
          this.go.setAttribute("aria-label", running ? "Pause" : "Start");
          this.go.title = running ? "Pause" : "Start";
        }
      }
      close() { clearInterval(this.timer); }
    });
})();
