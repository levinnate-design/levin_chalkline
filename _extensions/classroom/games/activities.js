/*
  Learning activities: Sentence builder, Fill in the blanks, Put it in order. These add three games
  to games.js (window.ChalklineGames), with the drag helper from timeline.js. Everything works by
  dragging, or by tapping one thing and then where it goes (for boards that drag badly).

  sentence-builder  one sentence at a time, its words mixed up: put them in order, then Check.
  fill-blanks       a text with gaps and a word bank: put each word in its gap, then Check.
  put-in-order      cards to put in order (steps, events, a story), then Check.

  Settings come from filter.lua (::: {.sentence-builder}, {.fill-blanks}, {.put-in-order}).
*/
(function () {
  const G = window.ChalklineGames;
  if (!G || !G.draggable) return;
  const h = G.h, list = G.list, button = G.button, shuffle = G.shuffle, beep = G.beep, cheer = G.cheer;
  const draggable = G.draggable, slideScale = G.slideScale;

  // Mixed up, but never in the right order (when there's another order to have).
  function mixed(items, same) {
    let out = shuffle(items);
    for (let i = 0; i < 8 && items.length > 1 && same(out); i++) out = shuffle(items);
    return out;
  }
  // Follow the pointer while dragging (the slide may be scaled).
  function follow(el) {
    return function (x, y, mx, my) { const s = slideScale(el); el.style.transform = "translate(" + mx / s + "px," + my / s + "px)"; };
  }
  function inside(el, x, y) {
    const r = el.getBoundingClientRect();
    return x >= r.left && x <= r.right && y >= r.top && y <= r.bottom;
  }
  // Where to put something let go at (x, y) among these elements: the index to insert before.
  function insertAt(els, x, y) {
    let best = els.length, bestD = 1e9;
    els.forEach(function (el, i) {
      const r = el.getBoundingClientRect();
      const d = Math.hypot(r.left + r.width / 2 - x, (r.top + r.height / 2 - y) * 2);   // rows count more than columns
      if (d < bestD) { bestD = d; best = x > r.left + r.width / 2 && Math.abs(r.top + r.height / 2 - y) < r.height ? i + 1 : i; }
    });
    return best;
  }

  /* ---------------- Sentence builder ---------------- */

  // "The Romans built roads." → tiles "The", "Romans", "built", "roads" and the end "."
  // With slashes, the parts stay together: "The Romans / built / long roads."
  function tilesOf(text) {
    let s = String(text).trim();
    const end = (s.match(/[.?!]+$/) || [""])[0];
    s = s.slice(0, s.length - end.length).trim();
    const parts = s.indexOf("/") >= 0 ? s.split("/") : s.split(/\s+/);
    return { tiles: parts.map(function (p) { return p.trim(); }).filter(Boolean), end: end };
  }

  function sentenceBuilder(root, cfg) {
    const sentences = list(cfg.sentences);
    if (!sentences.length) { root.textContent = "No sentences."; return null; }
    let cur, tiles, line, sel, done;
    const count = h("div", { class: "ca-count" });
    const pic = h("img", { class: "ca-pic", alt: "" });
    const hint = h("div", { class: "ca-hint" });
    const answer = h("div", { class: "ca-line", onclick: function (e) { if (e.target === answer || e.target === endMark) put(line.length); } });
    const endMark = h("span", { class: "ca-end" });
    const bank = h("div", { class: "ca-bank", onclick: function (e) { if (e.target === bank && sel && line.indexOf(sel) >= 0) back(sel); } });
    const status = h("div", { class: "cg-status" });
    const next = button("Next sentence →", function () { show(cur + 1); }, "cg-primary");
    const tools = h("div", { class: "cg-tools" }, button("Check", check, "cg-primary"), next, button("Show the answer", showAnswer), button("Start again", function () { show(0); }));
    root.append(count, h("div", { class: "ca-sb-top" }, pic, hint), answer, bank, status, tools);

    function show(i) {
      cur = (i + sentences.length) % sentences.length;
      const s = sentences[cur];
      const t = tilesOf(s.text);
      const right = function (order) { return order.map(function (x) { return x.text; }).join(" ") === t.tiles.join(" "); };
      tiles = mixed(t.tiles.map(function (w, k) { return { text: w, k: k, mark: "" }; }), right);
      line = []; sel = null; done = false;
      endMark.textContent = t.end;
      pic.hidden = !s.image; if (s.image) pic.src = s.image;
      hint.textContent = s.hint || ""; hint.hidden = !s.hint;
      root.classList.toggle("ca-has-pic", !!s.image);
      count.textContent = sentences.length > 1 ? "Sentence " + (cur + 1) + " of " + sentences.length : "";
      next.hidden = sentences.length < 2;
      paint("Put the words in order to make a sentence.");
    }
    function tile(t) {
      const el = h("button", { class: "ca-tile" + (t === sel ? " cg-selected" : "") + (t.mark ? " cg-" + t.mark : ""), text: t.text,
        onclick: function (e) {
          e.stopPropagation();
          if (el.dataset.dragged || done) return;
          if (line.indexOf(t) < 0) { sel = t; put(line.length); return; }   // from the bank: to the end of the sentence
          if (sel && sel !== t) { put(line.indexOf(t)); return; }            // one picked: it goes here
          sel = sel === t ? null : t;                                         // in the sentence: pick it (tap again: back to the bank)
          if (!sel) back(t); else paint();
        } });
      draggable(el, {
        start: function () { if (done) return; sel = t; el.classList.add("ca-dragging"); },
        move: follow(el),
        end: function (x, y) {
          el.style.transform = "";
          if (done) return;
          if (inside(answer, x, y)) {
            const others = Array.from(answer.querySelectorAll(".ca-tile")).filter(function (o) { return o !== el; });
            const at = insertAt(others, x, y);
            sel = t;
            put(at, true);
          } else if (line.indexOf(t) >= 0 && inside(bank, x, y)) back(t);
          else { sel = null; paint(); }
        },
      });
      return el;
    }
    // Put the chosen tile at place i in the sentence (i counts the other tiles if it's moving within the line).
    function put(i, without) {
      if (!sel || done) return;
      const t = sel;
      const from = line.indexOf(t);
      if (from >= 0) { line.splice(from, 1); if (!without && from < i) i--; }
      line.splice(Math.max(0, Math.min(i, line.length)), 0, t);
      sel = null;
      tiles.forEach(function (x) { x.mark = ""; });
      beep(520, 0.05, 0.05);
      paint();
    }
    function back(t) {
      const i = line.indexOf(t);
      if (i >= 0) line.splice(i, 1);
      sel = null;
      tiles.forEach(function (x) { x.mark = ""; });
      paint();
    }
    function paint(msg) {
      answer.textContent = "";
      line.forEach(function (t) { answer.append(tile(t)); });
      if (!line.length) answer.append(h("span", { class: "ca-placeholder", text: "Tap the words in order, or drag them here." }));
      answer.append(endMark);
      bank.textContent = "";
      tiles.filter(function (t) { return line.indexOf(t) < 0; }).forEach(function (t) { bank.append(tile(t)); });
      if (msg) status.textContent = msg;
      else if (!done) status.textContent = line.length < tiles.length ? (tiles.length - line.length) + " words to go." : "All the words are in. Press Check!";
    }
    function check() {
      if (done) return;
      const want = tilesOf(sentences[cur].text).tiles;
      if (line.length < tiles.length) { status.textContent = "Use all the words first: " + (tiles.length - line.length) + " to go."; beep(330, 0.15, 0.08); return; }
      let right = 0;
      line.forEach(function (t, i) { t.mark = t.text === want[i] ? "ok" : "no"; if (t.mark === "ok") right++; });
      if (right === want.length) {
        done = true;
        paint("✓ Well done! " + (sentences.length > 1 && cur < sentences.length - 1 ? "Press Next sentence." : ""));
        cheer();
      } else {
        paint("Not yet: " + right + " of " + want.length + " words are in the right place (green). Move the red ones.");
        beep(220, 0.2, 0.1);
      }
    }
    function showAnswer() {
      const want = tilesOf(sentences[cur].text).tiles;
      const left = tiles.slice();
      line = want.map(function (w) { const k = left.findIndex(function (t) { return t.text === w; }); return left.splice(k, 1)[0]; });
      line.forEach(function (t) { t.mark = "ok"; });
      done = true; sel = null;
      paint("Here's the sentence.");
    }
    show(0);
    return function () { show(0); };
  }

  /* ---------------- Fill in the blanks ---------------- */

  function fillBlanks(root, cfg) {
    const text = h("div", { class: "ca-text" });
    text.innerHTML = cfg.html || "";
    // [word] in the text becomes a gap
    const gaps = [];
    const walker = document.createTreeWalker(text, NodeFilter.SHOW_TEXT);
    const nodes = [];
    while (walker.nextNode()) if (/\[[^\[\]]+\]/.test(walker.currentNode.nodeValue)) nodes.push(walker.currentNode);
    nodes.forEach(function (node) {
      const frag = document.createDocumentFragment();
      node.nodeValue.split(/(\[[^\[\]]+\])/).forEach(function (part) {
        const m = part.match(/^\[([^\[\]]+)\]$/);
        if (!m) { frag.append(part); return; }
        const g = { word: m[1].trim(), el: h("button", { class: "ca-gap" }), chip: null, mark: "" };
        g.el.addEventListener("click", function (e) { e.stopPropagation(); tapGap(g); });
        gaps.push(g);
        frag.append(g.el);
      });
      node.replaceWith(frag);
    });
    if (!gaps.length) { root.textContent = "No gaps: write the missing words in [square brackets]."; return null; }
    const extra = String(cfg.extra || "").split(",").map(function (s) { return s.trim(); }).filter(Boolean);
    let chips, sel;
    const bank = h("div", { class: "ca-bank ca-wordbank", onclick: function (e) { if (e.target === bank && sel && sel.gap) { empty(sel.gap); sel = null; paint(); } } });
    const status = h("div", { class: "cg-status" });
    root.append(h("div", { class: "ca-bank-label", text: "Word bank" }), bank, text, status,
      h("div", { class: "cg-tools" }, button("Check", check, "cg-primary"), button("Show the answers", showAll), button("Start again", start)));

    function start() {
      chips = shuffle(gaps.map(function (g) { return g.word; }).concat(extra)).map(function (w) { return { word: w, gap: null }; });
      gaps.forEach(function (g) { g.chip = null; g.mark = ""; });
      sel = null;
      paint();
    }
    function empty(g) { if (g.chip) { g.chip.gap = null; g.chip = null; } g.mark = ""; }
    function place(c, g) {
      if (c.gap) empty(c.gap);
      if (g.chip) empty(g);
      c.gap = g; g.chip = c; g.mark = "";
      sel = null;
      beep(520, 0.05, 0.05);
      paint();
    }
    function tapGap(g) {
      if (sel) { place(sel, g); return; }
      if (g.chip) { empty(g); paint(); }   // tap a filled gap: its word goes back to the bank
    }
    function gapAt(x, y) { return gaps.find(function (g) { return inside(g.el, x, y); }); }
    function chipEl(c) {
      const el = h("button", { class: "ca-tile" + (c === sel ? " cg-selected" : ""), text: c.word,
        onclick: function (e) { e.stopPropagation(); if (el.dataset.dragged) return; sel = sel === c ? null : c; paint(); } });
      draggable(el, {
        start: function () { sel = c; el.classList.add("ca-dragging"); },
        move: follow(el),
        end: function (x, y) { el.style.transform = ""; const g = gapAt(x, y); if (g) place(c, g); else { sel = null; paint(); } },
      });
      return el;
    }
    function paint() {
      bank.textContent = "";
      chips.filter(function (c) { return !c.gap; }).forEach(function (c) { bank.append(chipEl(c)); });
      if (!bank.children.length) bank.append(h("span", { class: "cg-sort-empty", text: "All the words are used. Press Check!" }));
      gaps.forEach(function (g) {
        g.el.textContent = g.chip ? g.chip.word : "";
        g.el.className = "ca-gap" + (g.chip ? " ca-filled" : "") + (sel ? " cg-target" : "") + (g.mark ? " cg-" + g.mark : "");
        g.el.setAttribute("aria-label", g.chip ? g.chip.word : "Gap");
      });
      if (status.dataset.keep) { delete status.dataset.keep; return; }
      const filled = gaps.filter(function (g) { return g.chip; }).length;
      status.textContent = sel ? "Now tap the gap for “" + sel.word + "”." : "Filled: " + filled + " of " + gaps.length + ".";
    }
    function same(a, b) { return a.toLowerCase() === b.toLowerCase(); }
    function check() {
      let right = 0;
      gaps.forEach(function (g) { g.mark = g.chip ? (same(g.chip.word, g.word) ? "ok" : "no") : ""; if (g.mark === "ok") right++; });
      const all = right === gaps.length;
      status.dataset.keep = "1";
      const blank = gaps.filter(function (g) { return !g.chip; }).length;
      status.textContent = all ? "All right! ✓" : right + " of " + gaps.length + " right" + (blank ? " · " + blank + " still empty" : "") + ". Tap a red word to take it out.";
      if (all) cheer(); else beep(220, 0.2, 0.1);
      paint();
    }
    function showAll() {
      chips.forEach(function (c) { c.gap = null; });
      gaps.forEach(function (g) {
        const c = chips.find(function (x) { return !x.gap && same(x.word, g.word); });
        g.chip = c; c.gap = g; g.mark = "ok";
      });
      sel = null;
      status.dataset.keep = "1";
      status.textContent = "Here are the answers.";
      paint();
    }
    start();
    return start;
  }

  /* ---------------- Put it in order ---------------- */

  function putInOrder(root, cfg) {
    const items = list(cfg.items).map(function (it, i) { return Object.assign({}, it, { n: i }); });
    if (items.length < 2) { root.textContent = "Add at least two things to put in order."; return null; }
    const row = items.every(function (it) { return it.image; }) && items.length <= 6;   // all pictures: side by side
    root.classList.toggle("ca-row", row);
    let order, sel, done;
    const first = h("div", { class: "ca-ends", text: cfg.first || "First" });
    const box = h("div", { class: "ca-order" });
    const last = h("div", { class: "ca-ends", text: cfg.last || "Last" });
    const status = h("div", { class: "cg-status" });
    root.append(row ? h("div", { class: "ca-ends-row" }, first, last) : first, box, row ? "" : last, status,
      h("div", { class: "cg-tools" }, button("Check", check, "cg-primary"), button("Show the answer", showAll), button("Start again", start)));

    function start() {
      order = mixed(items, function (o) { return o.every(function (it, i) { return it.n === i; }); }).map(function (it) { return { it: it, mark: "" }; });
      sel = null; done = false;
      paint("Put them in order, from first to last.");
    }
    function moveTo(c, i) {
      const from = order.indexOf(c);
      order.splice(from, 1);
      order.splice(Math.max(0, Math.min(i, order.length)), 0, c);
      order.forEach(function (x) { x.mark = ""; });
      sel = null; done = false;
      beep(520, 0.05, 0.05);
      paint();
    }
    function card(c, i) {
      const el = h("button", { class: "ca-card" + (c === sel ? " cg-selected" : "") + (c.mark ? " cg-" + c.mark : ""),
        onclick: function () {
          if (el.dataset.dragged) return;
          if (sel && sel !== c) { moveTo(sel, i); return; }   // one picked: it goes to this place
          sel = sel === c ? null : c;
          paint();
        } },
        h("span", { class: "ca-num", text: i + 1 }),
        c.it.image ? h("img", { src: c.it.image, alt: "" }) : "",
        h("span", { class: "ca-card-text" }, h("span", { text: c.it.text }),
          done && c.it.why ? h("small", { text: c.it.why }) : ""));
      draggable(el, {
        start: function () { sel = null; el.classList.add("ca-dragging"); },
        move: follow(el),
        end: function (x, y) {
          el.style.transform = "";
          const others = Array.from(box.children).filter(function (o) { return o !== el; });
          moveTo(c, row ? insertAt(others, x, y) : others.filter(function (o) { const r = o.getBoundingClientRect(); return r.top + r.height / 2 < y; }).length);
        },
      });
      return el;
    }
    function paint(msg) {
      box.textContent = "";
      order.forEach(function (c, i) { box.append(card(c, i)); });
      if (msg) status.textContent = msg;
      else if (!done) status.textContent = sel ? "Now tap the place where it goes." : "Drag a card to move it, or tap it and then its new place. Then press Check.";
    }
    function check() {
      let right = 0;
      order.forEach(function (c, i) { c.mark = c.it.n === i ? "ok" : "no"; if (c.mark === "ok") right++; });
      done = right === order.length;
      paint(done ? "All in order! ✓" : right + " of " + order.length + " in the right place (green). Move the red ones.");
      if (done) cheer(); else beep(220, 0.2, 0.1);
    }
    function showAll() {
      order.sort(function (a, b) { return a.it.n - b.it.n; });
      order.forEach(function (c) { c.mark = "ok"; });
      done = true; sel = null;
      paint("Here's the right order.");
    }
    start();
    return start;
  }

  G.add("sentence-builder", sentenceBuilder);
  G.add("fill-blanks", fillBlanks);
  G.add("put-in-order", putInOrder);
})();
