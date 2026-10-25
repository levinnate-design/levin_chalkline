/*
  Class lists, for the name picker and groups (not a tool of its own): the class menu, the class
  editor, "Who's here?" and the note on privacy. Both tools add classes.css to their own styles.
  Saved as "classes": { current: index, classes: [{ name, names: [...], picked: [...],
  absent: { day, names }, groups: [[...], ...] }] }. Only in this browser: never in the course
  files or on the website.
*/
(function () {
  const T = window.ChalklineToolbox, h = T.h;
  const PRIVACY = "Names are saved only in this browser, on this computer. They are not uploaded, " +
    "and they are not in the course files or on the website.";

  function today() { return new Date().toDateString(); }
  function load() { return T.load("classes", { current: 0, classes: [] }); }
  function save(c) {
    T.save("classes", c);
    T.changed("classes");   // the other class tool shows the change too
  }
  function absentToday(k) { return k.absent && k.absent.day === today() ? k.absent.names : []; }
  function present(k) {
    const away = absentToday(k);
    return k.names.filter(function (n) { return away.indexOf(n) < 0; });
  }
  function shuffle(list) {
    const a = list.slice();
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1)), t = a[i];
      a[i] = a[j]; a[j] = t;
    }
    return a;
  }

  // The class menu at the top of both tools: switch class, add one, or edit this one.
  function bar(c, edit) {
    const select = h("select", { "aria-label": "Class", onchange: function () {
      select.blur();   // so the arrow keys change slides again
      if (select.value === "new") { edit(true); return; }
      const now = load();
      now.current = +select.value;
      save(now);
    } });
    c.classes.forEach(function (k, i) { select.append(h("option", { value: i, text: k.name + " (" + k.names.length + ")" })); });
    select.append(h("option", { value: "new", text: "+ New class…" }));
    select.value = String(c.current);
    return h("div", { class: "class-bar" },
      h("label", { class: "ui-select class-box" }, select, h("span", { class: "ui-select-arrow" }, T.icon("chevron-down"))),
      h("button", { class: "ui-btn ui-small", text: "Edit", onclick: function () { edit(false); } }));
  }

  // No classes yet.
  function none(edit) {
    return h("div", { class: "ui-empty" },
      h("p", { class: "lead", text: "Add a class list to start." }),
      h("button", { class: "ui-btn ui-primary", text: "+ New class", onclick: function () { edit(true); } }),
      h("p", { class: "privacy", text: PRIVACY }));
  }

  // Add a class (isNew) or edit the current one, inside the tool; done() goes back.
  function editor(root, isNew, done) {
    const c = load();
    const i = isNew || !c.classes[c.current] ? -1 : c.current;
    const k = i >= 0 ? c.classes[i] : { name: "", names: [] };
    const name = h("input", { class: "ui-field", placeholder: "Class name, like 7A", maxlength: 30, "aria-label": "Class name" });
    name.value = k.name;
    const list = h("textarea", { class: "ui-field names", "aria-label": "Names",
      placeholder: "One name on each line.\nYou can paste a column from a spreadsheet." });
    list.value = k.names.join("\n");
    const msg = h("p", { class: "privacy", text: PRIVACY });
    const saveBtn = h("button", { class: "ui-btn ui-primary", text: "Save", onclick: function () {
      const names = [];
      list.value.split(/[\r\n\t]+/).forEach(function (n) {
        n = n.trim();
        if (n && names.indexOf(n) < 0) names.push(n);
      });
      if (!names.length) { msg.textContent = "Add at least one name."; msg.classList.add("warn"); return; }
      const now = load();
      const label = name.value.trim() || "Class " + (now.classes.length + (i >= 0 ? 0 : 1));
      if (i >= 0 && now.classes[i]) {
        const old = now.classes[i];
        old.name = label;
        old.names = names;
        old.picked = (old.picked || []).filter(function (n) { return names.indexOf(n) >= 0; });
        old.groups = null;   // the old groups may name students who left
      } else {
        now.classes.push({ name: label, names: names, picked: [] });
        now.current = now.classes.length - 1;
      }
      save(now);
      done();
    } });
    root.replaceChildren(h("div", { class: "edit" }, name, list, msg,
      h("div", { class: "ui-actions" }, saveBtn,
        c.classes.length ? h("button", { class: "ui-btn", text: "Cancel", onclick: done }) : null,
        i >= 0 ? T.sureButton("Delete class", function () {
          const now = load();
          now.classes.splice(i, 1);
          now.current = 0;
          save(now);
          done();
        }) : null)));
    (i >= 0 ? list : name).focus();
  }

  // Who's here today: tap the students who are away (it starts fresh each day).
  function attendance(k, done) {
    const grid = h("div", { class: "here-grid" });
    function paint() {
      const away = absentToday(k);
      grid.textContent = "";
      k.names.forEach(function (n) {
        const out = away.indexOf(n) >= 0;
        grid.append(h("button", { class: "chip" + (out ? " away" : ""), "aria-pressed": String(!out), text: n, onclick: function () {
          const now = load(), cls = now.classes[now.current];
          const list = absentToday(cls).slice(), j = list.indexOf(n);
          if (j >= 0) list.splice(j, 1); else list.push(n);
          cls.absent = { day: today(), names: list };
          k.absent = cls.absent;
          save(now);
          paint();
        } }));
      });
    }
    paint();
    return h("div", { class: "here" },
      h("p", { class: "hint", text: "Tap the students who are away today. This starts fresh tomorrow." }),
      grid,
      h("div", { class: "ui-actions" }, h("button", { class: "ui-btn ui-primary", text: "Done", onclick: done })));
  }

  const css = `
.class-bar { flex: none; display: flex; align-items: center; gap: 6px; padding-bottom: 10px; font-size: clamp(13px, 4.5cqmin, 18px); }
.class-box { flex: 1; min-width: 0; }
.edit, .here { flex: 1; min-height: 0; display: flex; flex-direction: column; gap: 8px; }
.names { flex: 1; min-height: 60px; resize: none; line-height: 1.35; }
.lead { color: var(--ui-ink); font-size: 17px; font-weight: 600; }
.privacy { margin: 0; color: var(--ui-muted); font-size: 13px; line-height: 1.35; }
.privacy.warn { color: var(--ui-alarm); font-weight: 600; }
.hint { flex: none; margin: 0; color: var(--ui-muted); font-size: clamp(13px, 4.5cqmin, 17px); }
.here-grid { flex: 1; min-height: 0; overflow: auto; display: flex; flex-wrap: wrap; align-content: flex-start; gap: 6px; }
.chip {
  padding: 0.3em 0.8em; border: 0; border-radius: 999px; cursor: pointer;
  background: color-mix(in srgb, #2e9e4f 14%, #fff); color: #1d6b35;
  font-size: clamp(14px, 4.5cqmin, 19px); font-weight: 600;
}
.chip.away { background: var(--ui-soft); color: #8a94a3; text-decoration: line-through; }
`;

  T.classes = { load, save, present, shuffle, bar, none, editor, attendance, css };
})();
