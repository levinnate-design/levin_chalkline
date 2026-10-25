/*
  Name picker: picks each student who's here once, then starts again. The name fills a big tile;
  tap the tile (or Pick) for the next. "Who's here?" marks who is away today. Picked names are
  remembered per class (tools/classes.js), also in the next deck.
*/
(function () {
  const T = window.ChalklineToolbox, C = T.classes;

  T.tool("picker", { title: "Name picker", icon: "hand", w: 400, h: 300, minW: 250, minH: 230, keys: ["classes"] },
    class extends T.ToolElement {
      static css = C.css + `
.stage {
  flex: 1; min-height: 0; width: 100%; padding: 0 0.3em; border: 0; border-radius: 16px; cursor: pointer;
  background: var(--ui-accent); color: #fff;
  font-size: min(32cqh, calc(170cqw / var(--len, 7))); font-weight: 700; line-height: 1.1;
  white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
  transition: background 0.2s;
}
.stage.idle { background: var(--ui-soft); color: var(--ui-muted); font-weight: 600; }
.stage.rolling { background: color-mix(in srgb, var(--ui-accent) 75%, #fff); }
.stage.won { animation: won 0.45s ease-out; }
@keyframes won { 40% { transform: scale(1.04); } }
.info { flex: none; padding-top: 8px; color: var(--ui-muted); text-align: center; font-size: clamp(13px, 4.5cqmin, 17px); }
`;
      build(root) {
        this.root = root;
        this.mode = "pick";
        this.last = null;   // { cls, name } shown on the tile
        this.show("pick");
      }
      show(m, isNew) {
        const self = this, h = T.h, root = this.root;
        this.mode = m;
        clearInterval(this.rolling); this.rolling = 0;
        if (m === "edit") { C.editor(root, isNew, function () { self.show("pick"); }); return; }
        const c = C.load(), k = c.classes[c.current];
        root.textContent = "";
        if (!k) { root.append(C.none(function (n) { self.show("edit", n); })); return; }
        const bar = C.bar(c, function (n) { self.show("edit", n); });
        if (m === "here") { root.append(bar, C.attendance(k, function () { self.show("pick"); })); return; }
        const here = C.present(k), picked = k.picked || [];
        const left = here.filter(function (n) { return picked.indexOf(n) < 0; });
        const name = this.last && this.last.cls === k.name ? this.last.name : "";
        const stage = h("button", { class: "stage" + (name ? "" : " idle"), "aria-live": "polite", onclick: pick });
        set(name || "Tap to pick");
        root.append(bar, stage,
          h("div", { class: "info", text: here.length ? left.length + " of " + here.length + " not picked yet" : "Everyone is away today." }),
          h("div", { class: "ui-actions" },
            h("button", { class: "ui-btn ui-primary", text: "Pick", onclick: pick }),
            h("button", { class: "ui-btn", text: "Start again", onclick: function () {
              const now = C.load();
              now.classes[now.current].picked = [];
              self.last = null;
              C.save(now);
              self.show("pick");
            } }),
            h("button", { class: "ui-btn", text: "Who's here?", onclick: function () { self.show("here"); } })));

        // Long names get a smaller font, so they fit on one line (Chinese characters count double).
        function set(text) {
          stage.textContent = text;
          const len = Array.from(text).reduce(function (a, ch) { return a + (/[⺀-￿]/.test(ch) ? 2 : 1); }, 0);
          stage.style.setProperty("--len", Math.max(len, 7));
        }
        function pick() {
          if (self.rolling || !here.length) return;
          const pool = left.length ? left : here;   // everyone picked: start a new round
          const winner = pool[Math.floor(Math.random() * pool.length)];
          let n = 0;
          stage.classList.remove("idle", "won");
          stage.classList.add("rolling");
          self.rolling = setInterval(function () {
            if (++n < 14) { set(here[Math.floor(Math.random() * here.length)]); return; }
            clearInterval(self.rolling); self.rolling = 0;
            const now = C.load(), cls = now.classes[now.current];
            cls.picked = (left.length ? cls.picked || [] : []).concat([winner]);
            self.last = { cls: cls.name, name: winner };
            C.save(now);
            self.show("pick");
            self.root.querySelector(".stage").classList.add("won");
          }, 70);
        }
      }
      refresh() { if (this.mode !== "edit" && !this.rolling) this.show(this.mode); }
      close() { clearInterval(this.rolling); }
    });
})();
