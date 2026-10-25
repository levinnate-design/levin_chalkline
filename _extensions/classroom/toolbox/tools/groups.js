/*
  Groups: random groups from the students who are here, as groups of n or as n groups. Each group is
  a tile in its own color; the text is as big as the panel allows. The groups are kept per class
  (tools/classes.js), also in the next deck.
  Settings saved as "groups": { by: "size" (groups of n) or "count" (n groups), n }.
*/
(function () {
  const T = window.ChalklineToolbox, C = T.classes;

  T.tool("groups", { title: "Groups", icon: "users", w: 480, h: 340, minW: 300, minH: 240, keys: ["classes", "groups"] },
    class extends T.ToolElement {
      static css = C.css + `
.cards {
  flex: 1; min-height: 0; overflow: auto; display: grid; grid-template-columns: repeat(var(--cols, 1), 1fr); align-content: start; gap: 8px;
  font-size: clamp(12px, min(calc(80cqw / var(--cols, 1) / 9), calc(62cqh / var(--grid-rows, 1) / (var(--most, 3) + 1.8))), 44px);
}
.cards > .hint { grid-column: 1 / -1; padding-top: 1em; text-align: center; }
.group {
  min-width: 0; overflow-wrap: anywhere; padding: 0.3em 0.55em 0.4em; border-radius: 0.45em;
  background: color-mix(in srgb, var(--team) 11%, #fff);
}
.group-title { display: inline-block; margin-bottom: 0.15em; padding: 0 0.45em; border-radius: 999px; background: var(--team); color: #fff; font-size: 0.75em; font-weight: 700; }
.group ul { margin: 0; padding: 0; list-style: none; line-height: 1.25; color: var(--ui-ink); font-weight: 600; }
.mode { min-width: 7.5em; }
`;
      build(root) { this.root = root; this.mode = "groups"; this.show("groups"); }
      show(m, isNew) {
        const self = this, h = T.h, root = this.root;
        this.mode = m;
        if (m === "edit") { C.editor(root, isNew, function () { self.show("groups"); }); return; }
        const c = C.load(), k = c.classes[c.current];
        root.textContent = "";
        if (!k) { root.append(C.none(function (n) { self.show("edit", n); })); return; }
        const bar = C.bar(c, function (n) { self.show("edit", n); });
        if (m === "here") { root.append(bar, C.attendance(k, function () { self.show("groups"); })); return; }
        const s = T.load("groups", { by: "size", n: 4 });
        const cards = h("div", { class: "cards" });
        // Columns and rows from the number of groups, so the text can be as big as the panel allows.
        const count = (k.groups || []).length, cols = count <= 4 ? Math.max(count, 1) : count <= 6 ? 3 : count <= 8 ? 4 : 5;
        cards.style.setProperty("--cols", cols);
        cards.style.setProperty("--grid-rows", Math.max(1, Math.ceil(count / cols)));
        cards.style.setProperty("--most", Math.max.apply(null, (k.groups || [[]]).map(function (g) { return g.length; })));
        (k.groups || []).forEach(function (g, i) {
          cards.append(h("div", { class: "group", style: "--team:" + T.COLORS[i % T.COLORS.length] },
            h("div", { class: "group-title", text: "Group " + (i + 1) }),
            h("ul", null, ...g.map(function (n) { return h("li", { text: n }); }))));
        });
        if (!k.groups) cards.append(h("p", { class: "hint", text: C.present(k).length + " students here. Press Make groups." }));
        function setting(by, n) { T.save("groups", { by: by, n: Math.max(by === "size" ? 2 : 1, Math.min(n, 12)) }); self.show("groups"); }
        root.append(bar, cards, h("div", { class: "ui-actions" },
          h("button", { class: "ui-btn ui-primary", text: "Make groups", onclick: make }),
          h("button", { class: "ui-btn ui-small", "aria-label": "Fewer", text: "−", onclick: function () { setting(s.by, s.n - 1); } }),
          h("button", { class: "ui-btn ui-small mode", title: "Tap to switch", onclick: function () { setting(s.by === "size" ? "count" : "size", s.n); },
            text: s.by === "size" ? "Groups of " + s.n : s.n + " groups" }),
          h("button", { class: "ui-btn ui-small", "aria-label": "More", text: "+", onclick: function () { setting(s.by, s.n + 1); } }),
          h("button", { class: "ui-btn", text: "Who's here?", onclick: function () { self.show("here"); } })));

        function make() {
          const names = C.shuffle(C.present(k));
          if (!names.length) return;
          // Groups of n: no group bigger than n, and sizes differ by at most one.
          const count = Math.min(names.length, s.by === "size" ? Math.ceil(names.length / s.n) : s.n);
          const groups = [];
          for (let i = 0; i < count; i++) groups.push([]);
          names.forEach(function (n, i) { groups[i % count].push(n); });
          const now = C.load();
          now.classes[now.current].groups = groups;
          C.save(now);
          self.show("groups");
        }
      }
      refresh() { if (this.mode !== "edit") this.show(this.mode); }
    });
})();
