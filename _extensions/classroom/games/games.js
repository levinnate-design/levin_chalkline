/*
  Slide games: Snowman, Picture reveal, Jeopardy, Quick-fire, Matching, Memory, Word Blitz and more. Each one is a
  <div class="cg-game" data-game="..." data-config="{json}"> made by shortcodes.lua
  (words from the vocab list) or filter.lua (questions you write in a ::: div).

  config.words   [{ word, hint, image, example }] from the vocab list, or your own word
  config.random  true: a random word (🔀 picks a new one); false: always the same word or questions

  The games keep their own score (if any). They don't use the classroom toolbox's scoreboard,
  so they work the same whether or not it's open.
*/
(function () {
  const BASE = document.currentScript ? document.currentScript.src.replace(/[^/]*$/, "") : "";   // pdf-lib sits next to this file
  const COLORS = ["#0087ff", "#ff8c0f", "#2e9e4f", "#7b4fc9", "#e5383b", "#1a9e9e", "#d6458f", "#e0a800"];

  // Tiny element builder: h("div", {class: "x", onclick: fn}, child, "text", ...)
  function h(tag, attrs) {
    const el = document.createElement(tag);
    for (const k in attrs || {}) {
      const v = attrs[k];
      if (v == null || v === false) continue;
      if (k.startsWith("on")) el.addEventListener(k.slice(2), v);
      else if (k === "text") el.textContent = v;
      else if (k === "style") el.style.cssText = v;
      else el.setAttribute(k, v === true ? "" : v);
    }
    for (let i = 2; i < arguments.length; i++) {
      const c = arguments[i];
      if (c != null && c !== false) el.append(c);
    }
    return el;
  }
  function list(x) { return Array.isArray(x) ? x : []; }   // an empty Lua table arrives as {}
  function shuffle(a) {
    a = a.slice();
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1)), t = a[i];
      a[i] = a[j]; a[j] = t;
    }
    return a;
  }
  // A random word, not the same as last time when there's a choice.
  function picker(words) {
    let last = -1;
    return function () {
      if (words.length < 2) return words[0];
      let i;
      do { i = Math.floor(Math.random() * words.length); } while (i === last);
      last = i;
      return words[i];
    };
  }
  function beep(freq, length, volume, delay) {
    try {
      const ctx = beep.ctx || (beep.ctx = new (window.AudioContext || window.webkitAudioContext)());
      const o = ctx.createOscillator(), g = ctx.createGain(), t = ctx.currentTime + (delay || 0);
      o.frequency.value = freq;
      g.gain.setValueAtTime(volume, t);
      g.gain.exponentialRampToValueAtTime(0.001, t + length);
      o.connect(g); g.connect(ctx.destination);
      o.start(t); o.stop(t + length);
    } catch (e) { /* no sound available */ }
  }
  function cheer() { [523, 659, 784, 1047].forEach(function (f, i) { beep(f, 0.25, 0.15, i * 0.09); }); }
  function button(text, onclick, cls) { return h("button", { class: "cg-btn" + (cls ? " " + cls : ""), text: text, onclick: onclick }); }
  function onCurrentSlide(el) {
    return !window.Reveal || (Reveal.getCurrentSlide() && Reveal.getCurrentSlide().contains(el));
  }
  // Clicked buttons give the focus back to the slides, so Space and the arrows still change slides.
  document.addEventListener("click", function (e) {
    const b = e.target.closest && e.target.closest(".cg-game button");
    if (b) b.blur();
  });

  // Letters typed on the keyboard go to the game on the current slide (not to reveal.js's shortcuts).
  const keyHandlers = [];
  window.addEventListener("keydown", function (e) {
    if (e.ctrlKey || e.metaKey || e.altKey || /input|textarea|select/i.test((document.activeElement || {}).tagName)) return;
    for (const k of keyHandlers) {
      if (k.el.isConnected && onCurrentSlide(k.el) && k.fn(e)) { e.preventDefault(); e.stopImmediatePropagation(); return; }
    }
  }, true);

  /* ---------------- Snowman (hangman, but a snowman melts) ---------------- */

  // The parts that melt away, one for each wrong letter; the last wrong letter melts the rest.
  const PARTS = ["hat", "arm-left", "arm-right", "scarf", "buttons", "nose", "face"];
  const SNOWMAN_SVG =
    '<svg viewBox="0 0 220 290" aria-hidden="true">' +
    '<ellipse class="cg-puddle" cx="110" cy="272" rx="92" ry="12"/>' +
    '<g class="cg-body">' +
      '<circle cx="110" cy="222" r="54" class="cg-snow"/>' +
      '<circle cx="110" cy="140" r="40" class="cg-snow"/>' +
      '<circle cx="110" cy="76" r="30" class="cg-snow"/>' +
      '<g class="cg-part" data-part="buttons"><circle cx="110" cy="124" r="4.5"/><circle cx="110" cy="142" r="4.5"/><circle cx="110" cy="160" r="4.5"/></g>' +
      '<g class="cg-part" data-part="face"><circle cx="99" cy="70" r="4"/><circle cx="121" cy="70" r="4"/>' +
        '<path d="M98 88 Q110 96 122 88" fill="none" stroke="#22262e" stroke-width="3" stroke-linecap="round"/></g>' +
      '<path class="cg-part" data-part="nose" d="M110 78 L136 83 L110 86 Z" fill="#ff8c0f"/>' +
      '<g class="cg-part" data-part="scarf" fill="#e5383b"><rect x="80" y="100" width="60" height="12" rx="6"/><rect x="118" y="104" width="12" height="34" rx="5"/></g>' +
      '<path class="cg-part" data-part="arm-left" d="M74 132 L32 104 M46 113 L36 96 M46 113 L28 116" stroke="#7a4b24" stroke-width="5" stroke-linecap="round" fill="none"/>' +
      '<path class="cg-part" data-part="arm-right" d="M146 132 L188 104 M174 113 L184 96 M174 113 L192 116" stroke="#7a4b24" stroke-width="5" stroke-linecap="round" fill="none"/>' +
      '<g class="cg-part" data-part="hat" fill="#22262e"><rect x="82" y="44" width="56" height="8" rx="3"/><rect x="92" y="8" width="36" height="40" rx="4"/>' +
        '<rect x="92" y="36" width="36" height="7" fill="#0087ff"/></g>' +
    '</g></svg>';

  function snowman(root, cfg) {
    const words = list(cfg.words), next = picker(words);
    let w, guessed, wrong, over;
    const figure = h("div", { class: "cg-snowman-figure" });
    figure.innerHTML = SNOWMAN_SVG;
    const word = h("div", { class: "cg-word" });
    const status = h("div", { class: "cg-status" });
    const hint = h("div", { class: "cg-hint", hidden: true });
    const keys = h("div", { class: "cg-keys" });
    const hintBtn = button("💡 Hint", function () { hint.hidden = !hint.hidden; });
    const tools = h("div", { class: "cg-tools" }, hintBtn, button("Show the word", function () { finish(false, true); }),
      cfg.random ? button("🔀 New word", start, "cg-new") : "");
    "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("").forEach(function (L) {
      keys.append(h("button", { class: "cg-key", text: L, "data-key": L, onclick: function () { guess(L); } }));
    });
    root.append(figure, h("div", { class: "cg-snowman-play" }, word, status, keys, hint, tools));

    function letters() { return w.word.toUpperCase(); }
    function isLetter(ch) { return /\p{L}/u.test(ch); }
    function start() {
      w = next();
      if (!w) { status.textContent = "No words."; return; }
      guessed = new Set(); wrong = 0; over = false;
      root.classList.remove("cg-won", "cg-lost");
      figure.querySelectorAll(".cg-part").forEach(function (p) { p.classList.remove("cg-gone"); });
      hint.hidden = true;
      hint.textContent = "";
      if (w.image) hint.append(h("img", { src: w.image, alt: "" }));
      hint.append(h("span", { text: w.hint || "No hint for this one." }));
      keys.querySelectorAll(".cg-key").forEach(function (k) { k.disabled = false; k.className = "cg-key"; });
      paint();
    }
    function paint(reveal) {
      word.textContent = "";
      letters().split(" ").forEach(function (part) {
        const group = h("span", { class: "cg-word-part" });
        Array.from(part).forEach(function (ch) {
          const shown = !isLetter(ch) || guessed.has(ch) || reveal;
          group.append(h("span", { class: "cg-letter" + (isLetter(ch) ? "" : " cg-mark") + (reveal && !guessed.has(ch) && isLetter(ch) ? " cg-missed" : ""),
            text: shown ? ch : "" }));
        });
        word.append(group);
      });
      const left = PARTS.length - wrong;
      status.textContent = over ? status.textContent : left + (left === 1 ? " wrong guess left" : " wrong guesses left");
    }
    function guess(L) {
      if (over || !w || guessed.has(L)) return;
      guessed.add(L);
      const key = keys.querySelector('[data-key="' + L + '"]');
      const hit = letters().indexOf(L) >= 0;
      if (key) { key.disabled = true; key.classList.add(hit ? "cg-hit" : "cg-miss"); }
      if (!hit) {
        const part = figure.querySelector('[data-part="' + PARTS[wrong] + '"]');
        if (part) part.classList.add("cg-gone");
        wrong++;
        beep(220, 0.2, 0.12);
      } else beep(660, 0.12, 0.1);
      paint();
      if (Array.from(letters()).every(function (ch) { return !isLetter(ch) || guessed.has(ch); })) finish(true);
      else if (wrong >= PARTS.length) finish(false);
    }
    function finish(won, shown) {
      if (over || !w) return;
      over = true;
      root.classList.add(won ? "cg-won" : "cg-lost");
      if (!won) figure.querySelectorAll(".cg-part").forEach(function (p) { p.classList.add("cg-gone"); });
      status.textContent = won ? "You saved the snowman! ⛄" : shown ? "The word was:" : "Oh no, it melted! The word was:";
      paint(!won);
      if (won) cheer();
    }
    keyHandlers.push({ el: root, fn: function (e) {
      if (e.key.length !== 1 || !/[a-z]/i.test(e.key)) return false;
      guess(e.key.toUpperCase());
      return true;
    } });
    start();
    return start;   // reset: a fresh game (a new word if it's random)
  }

  /* ---------------- Picture reveal ---------------- */

  function pictureReveal(root, cfg) {
    const words = list(cfg.words), next = picker(words);
    const n = Math.round(Math.sqrt(cfg.tiles || 16)) || 4;   // 9, 16 or 25 tiles: 3, 4 or 5 a side
    let w, opened;
    const img = h("img", { class: "cg-reveal-img", alt: "" });
    const tiles = h("div", { class: "cg-tiles", style: "--n:" + n });
    const answer = h("div", { class: "cg-answer" });
    const count = h("div", { class: "cg-status" });
    root.append(h("div", { class: "cg-reveal-box" }, img, tiles),
      h("div", { class: "cg-reveal-side" }, count, answer,
        h("div", { class: "cg-tools cg-tools-column" },
          button("Show the answer", function () { showAnswer(); }, "cg-primary"),
          button("Show the whole picture", function () { tiles.querySelectorAll(".cg-tile").forEach(function (t) { t.classList.add("cg-open"); }); }),
          cfg.random ? button("🔀 New picture", start, "cg-new") : "")));

    function start() {
      w = next();
      if (!w) { count.textContent = "No pictures."; return; }
      opened = 0;
      img.src = w.image;
      answer.textContent = "";
      answer.classList.remove("cg-shown");
      tiles.textContent = "";
      for (let i = 0; i < n * n; i++) {
        tiles.append(h("button", { class: "cg-tile", text: i + 1, style: "--tile:" + COLORS[(i + Math.floor(i / n)) % COLORS.length],
          onclick: function (e) {
            if (e.currentTarget.classList.contains("cg-open")) return;
            e.currentTarget.classList.add("cg-open");
            opened++;
            paint();
          } }));
      }
      paint();
    }
    function paint() { count.textContent = "Tiles opened: " + opened + " of " + n * n; }
    function showAnswer() {
      if (!w) return;
      answer.textContent = w.word;
      answer.classList.add("cg-shown");
      tiles.querySelectorAll(".cg-tile").forEach(function (t) { t.classList.add("cg-open"); });
      cheer();
    }
    start();
    return start;
  }

  /* ---------------- Jeopardy ---------------- */

  // From the vocab list: three kinds of clue, one column each, a different word in every square.
  function vocabBoard(words, rows) {
    function gap(w) {   // the example sentence with the word blanked out, or "" if it isn't in there
      if (!w.example) return "";
      const re = new RegExp(w.word.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
      return re.test(w.example) ? w.example.replace(re, "_____") : "";
    }
    const pool = shuffle(words);
    const take = function (ok) {
      const i = pool.findIndex(ok);
      return i < 0 ? null : pool.splice(i, 1)[0];
    };
    rows = Math.max(1, Math.min(rows || 4, Math.floor(words.length / 3)));
    const cols = [
      { name: "What's the word?", make: function (w) { return { q: w.hint, a: w.word }; }, ok: function (w) { return !!w.hint; } },
      { name: "Picture", make: function (w) { return { q: "What is this?", image: w.image, a: w.word }; }, ok: function (w) { return !!w.image; } },
      { name: "Fill the gap", make: function (w) { return { q: gap(w), a: w.word }; }, ok: function (w) { return !!gap(w); } },
    ];
    return cols.map(function (c) {
      const clues = [];
      for (let r = 0; r < rows; r++) {
        const w = take(c.ok) || take(function () { return true; });
        if (w) clues.push(c.ok(w) ? c.make(w) : { q: w.hint, a: w.word });
      }
      return { name: c.name, clues: clues };
    });
  }

  // Teams (2 to 4, or teams=0 for none) take turns: the team whose turn it is chooses a square,
  // answers, and the teacher marks it right (the points go to that team) or wrong (no points).
  // Either way the turn passes to the next team. Tap a team to give it the turn.
  const TEAM_COLORS = ["#0087ff", "#ff8c0f", "#2e9e4f", "#7b4fc9"];

  function jeopardy(root, cfg) {
    const useTeams = cfg.teams !== 0;
    let teams = [], turn = 0, cells = 0, used = 0;
    const bar = h("div", { class: "cg-teams" });
    const board = h("div", { class: "cg-board" });
    const card = h("div", { class: "cg-clue", hidden: true });
    // The board on top; the scores below it, after a dividing line. The clue covers the board, not the scores.
    root.append(h("div", { class: "cg-board-wrap" }, board, card),
      useTeams ? h("div", { class: "cg-divider", "aria-hidden": "true" }, h("span", { text: "Scores" })) : "",
      useTeams ? bar : "",
      !useTeams && cfg.random ? h("div", { class: "cg-tools" }, button("🔀 New board", start, "cg-new")) : "");

    function setTeams(n) {
      n = Math.max(2, Math.min(4, n));
      while (teams.length < n) teams.push({ name: "Team " + (teams.length + 1), score: 0 });
      teams.length = n;
      turn = turn % n;
      paintTeams();
    }
    // Each team: tap its name to rename it, tap its score to change it, tap anywhere else to give it the turn.
    function paintTeams() {
      if (!useTeams) return;
      bar.textContent = "";
      const top = Math.max.apply(null, teams.map(function (t) { return t.score; }));
      teams.forEach(function (t, i) {
        const name = h("button", { class: "cg-team-name", title: "Tap to rename", text: t.name });
        const score = h("button", { class: "cg-team-score", title: "Tap to change the score", text: t.score });
        name.addEventListener("click", function (e) {
          e.stopPropagation();
          edit(name, t.name, "text", function (v) { t.name = v.trim().slice(0, 20) || t.name; });
        });
        score.addEventListener("click", function (e) {
          e.stopPropagation();
          edit(score, t.score, "number", function (v) { const n = parseInt(v, 10); if (!isNaN(n)) t.score = n; });
        });
        bar.append(h("div", { class: "cg-team" + (i === turn ? " cg-turn" : ""), style: "--team:" + TEAM_COLORS[i],
          title: "Tap to give this team the turn", onclick: function () { turn = i; paintTeams(); } },
          h("span", { class: "cg-team-mark", text: i === turn ? "▶" : "" }), name,
          h("span", { class: "cg-team-crown", text: top > 0 && t.score === top ? "👑" : "" }), score));
      });
      bar.append(h("span", { class: "cg-team-tools" },
        h("button", { class: "cg-btn cg-small", text: "−", title: "Fewer teams", onclick: function () { setTeams(teams.length - 1); } }),
        h("button", { class: "cg-btn cg-small", text: "+", title: "More teams", onclick: function () { setTeams(teams.length + 1); } }),
        cfg.random ? button("🔀", start, "cg-new cg-small") : ""));
    }
    // Swap a name or score for a box to type in; Enter (or tapping away) keeps it, Esc cancels.
    function edit(el, value, type, keep) {
      const box = h("input", { class: "cg-team-input", type: type, value: value, "aria-label": type === "number" ? "Score" : "Team name" });
      box.value = value;
      let done = false;
      function finish(save) {
        if (done) return;
        done = true;
        if (save) keep(box.value);
        paintTeams();
      }
      box.addEventListener("click", function (e) { e.stopPropagation(); });
      box.addEventListener("keydown", function (e) {
        if (e.key === "Enter") finish(true);
        else if (e.key === "Escape") { e.stopPropagation(); finish(false); }
      });
      box.addEventListener("blur", function () { finish(true); });
      el.replaceWith(box);
      box.focus();
      box.select();
    }
    function start() {
      const cats = cfg.random ? vocabBoard(list(cfg.words), cfg.rows) : list(cfg.categories);
      const rows = Math.max.apply(null, cats.map(function (c) { return list(c.clues).length; }).concat([0]));
      const points = list(cfg.points);
      board.textContent = "";
      board.style.setProperty("--cols", Math.max(cats.length, 1));
      cats.forEach(function (c, i) { board.append(h("div", { class: "cg-cat", style: "--cat:" + COLORS[i % COLORS.length], text: c.name })); });
      cells = 0; used = 0;
      for (let r = 0; r < rows; r++) {
        cats.forEach(function (c, i) {
          const clue = list(c.clues)[r];
          const value = points[r] || (r + 1) * 100;
          if (clue) cells++;
          board.append(clue
            ? h("button", { class: "cg-cell", style: "--cat:" + COLORS[i % COLORS.length], text: value,
                onclick: function (e) { open(e.currentTarget, c.name, value, clue); } })
            : h("div", { class: "cg-cell cg-empty" }));
        });
      }
      teams.forEach(function (t) { t.score = 0; });
      turn = 0;
      card.hidden = true;
      paintTeams();
    }
    function open(cell, cat, value, clue) {
      const team = teams[turn];
      const answer = h("div", { class: "cg-clue-answer", hidden: true, text: clue.a });
      const marking = h("div", { class: "cg-tools", hidden: true },
        button("✓ Right  +" + value, function () { done(cell, true, value); }, "cg-right-btn"),
        button("✗ Wrong", function () { done(cell, false, value); }, "cg-wrong-btn"));
      const tools = h("div", { class: "cg-tools" });
      const show = button("Show the answer", function () {
        answer.hidden = false; show.hidden = true; cheer();
        if (useTeams) { marking.hidden = false; tools.hidden = true; }
        else cell.classList.add("cg-done");
      }, "cg-primary");
      tools.append(show, button("Back to the board", function () { card.hidden = true; }));
      card.textContent = "";
      card.style.setProperty("--team", useTeams ? TEAM_COLORS[turn] : "transparent");
      card.append(h("div", { class: "cg-clue-head", text: (useTeams ? team.name + " · " : "") + cat + " · " + value }),
        clue.image ? h("img", { class: "cg-clue-img", src: clue.image, alt: "" }) : "",
        h("div", { class: "cg-clue-q", text: clue.q }), answer, tools, marking);
      card.classList.toggle("cg-team-card", useTeams);
      card.hidden = false;
    }
    function done(cell, right, value) {
      if (!cell.classList.contains("cg-done")) used++;
      cell.classList.add("cg-done");
      if (right) { teams[turn].score += value; beep(880, 0.15, 0.12); } else beep(196, 0.25, 0.12);
      turn = (turn + 1) % teams.length;
      card.hidden = true;
      paintTeams();
      if (used >= cells) finish();
    }
    function finish() {
      const top = Math.max.apply(null, teams.map(function (t) { return t.score; }));
      const winners = teams.filter(function (t) { return t.score === top; });
      card.textContent = "";
      card.style.setProperty("--team", winners.length === 1 ? TEAM_COLORS[teams.indexOf(winners[0])] : "#ffc61a");
      card.append(h("div", { class: "cg-clue-head", text: "Game over" }),
        h("div", { class: "cg-clue-q cg-winner", text: winners.length === 1 ? winners[0].name + " wins! 🏆" : "It's a tie! 🤝" }),
        h("div", { class: "cg-final" }, ...teams.map(function (t, i) {
          return h("span", { class: "cg-final-team", style: "--team:" + TEAM_COLORS[i], text: t.name + ": " + t.score });
        })),
        h("div", { class: "cg-tools" }, button("Play again", start, "cg-primary"), button("Back to the board", function () { card.hidden = true; })));
      card.classList.add("cg-team-card");
      card.hidden = false;
      cheer();
    }
    if (useTeams) setTeams(cfg.teams || 2);
    start();
    return start;   // reset: scores to 0, turn to team 1, every square back (a new board if it's random)
  }

  /* ---------------- Quick-fire (trivia) ---------------- */

  // A question pops up with a countdown; the teacher points to a student, who answers out loud.
  // Show the answer, then mark it right or wrong. The score is kept here, for this game only.
  const BACKS = [["#ff5f6d", "#ffc371"], ["#2193b0", "#6dd5ed"], ["#8e2de2", "#4a00e0"], ["#11998e", "#38ef7d"],
    ["#fc4a1a", "#f7b733"], ["#ee0979", "#ff6a00"], ["#0575e6", "#00f260"], ["#c94b4b", "#4b134f"]];

  function trivia(root, cfg) {
    const pick = picker(list(cfg.words));
    let qs, i, marks, timer = 0;
    const stage = h("div", { class: "cg-quiz-stage" });
    const dots = h("div", { class: "cg-dots" });
    const score = h("div", { class: "cg-score" });
    root.append(h("div", { class: "cg-quiz-top" }, dots, score), stage);

    function questions() {
      if (!cfg.random) return list(cfg.questions);
      const out = [], seen = new Set(), n = Math.min(cfg.count || 5, list(cfg.words).length);
      while (out.length < n) {
        const w = pick();
        if (seen.has(w.word)) continue;
        seen.add(w.word);
        out.push(w.image && out.length % 2 ? { q: "What is this?", image: w.image, a: w.word } : { q: "Which word means: " + w.hint, a: w.word });
      }
      return out;
    }
    function begin(fresh) {
      if (fresh || !qs) qs = questions();
      i = -1; marks = [];
      stop();
      stage.textContent = "";
      stage.style.background = "linear-gradient(135deg, #003477, #0087ff)";
      stage.append(h("div", { class: "cg-quiz-title", text: cfg.title || "Quick-fire!" }),
        h("div", { class: "cg-quiz-sub", text: qs.length + " questions" + (cfg.seconds ? " · " + cfg.seconds + " seconds each" : "") }),
        h("div", { class: "cg-tools" }, button("Start ▶", next, "cg-big")));
      paintTop();
    }
    function stop() { clearInterval(timer); timer = 0; }
    function paintTop() {
      dots.textContent = "";
      (qs || []).forEach(function (_, j) {
        dots.append(h("span", { class: "cg-dot" + (marks[j] === true ? " cg-right" : marks[j] === false ? " cg-wrong" : j === i ? " cg-now" : "") }));
      });
      const right = marks.filter(function (m) { return m === true; }).length;
      score.textContent = "✓ " + right + "   ✗ " + (marks.length - right);
    }
    function next() {
      stop();
      i++;
      if (i >= qs.length) { end(); return; }
      const q = qs[i], back = BACKS[i % BACKS.length];
      const bar = h("div", { class: "cg-timer-fill" });
      const answer = h("div", { class: "cg-quiz-answer", hidden: true, text: q.a });
      const marking = h("div", { class: "cg-tools", hidden: true },
        button("✓ Right", function () { mark(true); }, "cg-right-btn"),
        button("✗ Wrong", function () { mark(false); }, "cg-wrong-btn"));
      const show = button("Show the answer", function () {
        stop(); show.hidden = true; answer.hidden = false; marking.hidden = false;
      }, "cg-big");
      stage.textContent = "";
      stage.style.background = "linear-gradient(135deg, " + back[0] + ", " + back[1] + ")";
      stage.append(h("div", { class: "cg-quiz-num", text: "Question " + (i + 1) + " of " + qs.length }),
        q.image ? h("img", { class: "cg-quiz-img", src: q.image, alt: "" }) : "",
        h("div", { class: "cg-quiz-q", text: q.q }),
        cfg.seconds ? h("div", { class: "cg-timer" }, bar) : "",
        answer, h("div", { class: "cg-tools" }, show), marking);
      stage.classList.remove("cg-pop"); void stage.offsetWidth; stage.classList.add("cg-pop");
      paintTop();
      if (cfg.seconds) {
        const endAt = Date.now() + cfg.seconds * 1000;
        timer = setInterval(function () {
          const left = Math.max(0, endAt - Date.now());
          bar.style.width = (100 * left / (cfg.seconds * 1000)) + "%";
          bar.parentNode.classList.toggle("cg-hurry", left < 3000);
          if (!left) {
            stop();
            bar.parentNode.classList.add("cg-out");
            beep(330, 0.35, 0.2); beep(262, 0.5, 0.2, 0.3);
          }
        }, 50);
      }
    }
    function mark(ok) {
      marks[i] = ok;
      if (ok) beep(880, 0.15, 0.12); else beep(196, 0.25, 0.12);
      next();
    }
    function end() {
      const right = marks.filter(function (m) { return m === true; }).length;
      stage.textContent = "";
      stage.style.background = "linear-gradient(135deg, #003477, #7b4fc9)";
      stage.append(h("div", { class: "cg-quiz-title", text: right + " of " + qs.length + " right!" }),
        h("div", { class: "cg-quiz-sub", text: right === qs.length ? "Perfect! 🎉" : right >= qs.length / 2 ? "Great work! 👏" : "Good try! Let's review. 💪" }),
        h("div", { class: "cg-tools" }, button("Start over", function () { begin(false); }),
          cfg.random ? button("🔀 New questions", function () { begin(true); }, "cg-new") : ""));
      paintTop();
      if (right === qs.length) cheer();
    }
    begin(true);
    return function () { begin(!!cfg.random); };   // reset: back to Start (new questions if random)
  }

  /* ---------------- Matching and Memory: pairs ----------------
     A pair is a word and its partner: its meaning (with="meaning") or its picture (with="picture").
     From the vocab list (random, count pairs), or written: ::: {.matching} / {.memory} with "a | b" lines. */

  function makePairs(cfg, prefer) {
    if (!cfg.random) return list(cfg.pairs).map(function (p, i) { return { id: i, a: p.q, b: p.a, image: "" }; });
    const usePicture = (cfg.with || prefer) === "picture";
    const pool = shuffle(list(cfg.words).filter(function (w) { return usePicture ? w.image : w.hint; }));
    return pool.slice(0, cfg.count || 6).map(function (w, i) {
      return { id: i, a: w.word, b: usePicture ? "" : w.hint, image: usePicture ? w.image : "" };
    });
  }
  function partner(p) {   // the other side of a pair: its picture, or its words
    return p.image ? h("img", { src: p.image, alt: "" }) : h("span", { text: p.b });
  }

  // Matching: tap a word, then its partner (or the other way round). A right pair locks in, in its
  // own color; a wrong one shakes. It counts the tries.
  function matching(root, cfg) {
    let pairs, matched, tries, sel;
    const left = h("div", { class: "cg-match-col" });
    const right = h("div", { class: "cg-match-col cg-match-right" });
    const status = h("div", { class: "cg-status" });
    root.append(h("div", { class: "cg-match" }, left, right), status,
      h("div", { class: "cg-tools" }, button("Show the answers", showAll),
        cfg.random ? button("🔀 New words", start, "cg-new") : ""));

    function item(p, side) {
      return h("button", { class: "cg-match-item cg-side-" + side, "data-id": p.id, onclick: function (e) { tap(e.currentTarget, side, p.id); } },
        side === "a" ? h("span", { text: p.a }) : partner(p));
    }
    function start() {
      pairs = makePairs(cfg, "meaning");
      matched = 0; tries = 0; sel = null;
      left.textContent = ""; right.textContent = "";
      pairs.forEach(function (p) { left.append(item(p, "a")); });
      shuffle(pairs).forEach(function (p) { right.append(item(p, "b")); });
      root.classList.toggle("cg-match-pictures", pairs.some(function (p) { return p.image; }));
      paint();
    }
    function paint() {
      status.textContent = matched === pairs.length && pairs.length
        ? "All matched in " + tries + (tries === 1 ? " try!" : " tries!")
        : "Matched " + matched + " of " + pairs.length + "  ·  Tries: " + tries;
    }
    function lock(id) {
      root.querySelectorAll('.cg-match-item[data-id="' + id + '"]').forEach(function (el) {
        el.classList.add("cg-matched");
        el.classList.remove("cg-selected");
        el.style.setProperty("--pair", COLORS[id % COLORS.length]);
        el.disabled = true;
      });
    }
    function tap(el, side, id) {
      if (!sel || sel.side === side) {   // first pick (or a new pick on the same side)
        if (sel) sel.el.classList.remove("cg-selected");
        sel = { el: el, side: side, id: id };
        el.classList.add("cg-selected");
        return;
      }
      tries++;
      if (sel.id === id) { lock(id); matched++; beep(660, 0.12, 0.1); if (matched === pairs.length) cheer(); }
      else {
        const a = sel.el;
        [a, el].forEach(function (x) { x.classList.add("cg-wrong-pair"); });
        setTimeout(function () { [a, el].forEach(function (x) { x.classList.remove("cg-wrong-pair", "cg-selected"); }); }, 600);
        beep(220, 0.2, 0.1);
      }
      sel.el.classList.remove("cg-selected");
      sel = null;
      paint();
    }
    function showAll() { pairs.forEach(function (p) { lock(p.id); }); matched = pairs.length; paint(); }
    start();
    return start;
  }

  // Memory: cards face down; turn over two. A word and its partner stay face up; two that don't
  // match turn back over. It counts the turns.
  function memory(root, cfg) {
    let pairs, open, found, turns, busy;
    const grid = h("div", { class: "cg-memory-grid" });
    const status = h("div", { class: "cg-status" });
    root.append(grid, status, h("div", { class: "cg-tools" }, button("Show all the cards", showAll),
      cfg.random ? button("🔀 New cards", start, "cg-new") : ""));

    function start() {
      pairs = makePairs(cfg, "picture");
      open = []; found = 0; turns = 0; busy = false;
      grid.textContent = "";
      const cards = [];
      pairs.forEach(function (p) {
        cards.push({ id: p.id, face: h("span", { class: "cg-card-word", text: p.a }) });
        cards.push({ id: p.id, face: partner(p) });
      });
      grid.style.setProperty("--cols", cards.length > 12 ? 5 : 4);
      shuffle(cards).forEach(function (c, i) {
        const card = h("button", { class: "cg-card", "data-id": c.id, "aria-label": "Card " + (i + 1) },
          h("span", { class: "cg-card-inner" },
            h("span", { class: "cg-card-back", text: i + 1 }),
            h("span", { class: "cg-card-front" }, c.face)));
        card.addEventListener("click", function () { flip(card); });
        grid.append(card);
      });
      paint();
    }
    function paint() {
      status.textContent = found === pairs.length && pairs.length
        ? "All pairs found in " + turns + (turns === 1 ? " turn!" : " turns!")
        : "Pairs found: " + found + " of " + pairs.length + "  ·  Turns: " + turns;
    }
    function flip(card) {
      if (busy || card.classList.contains("cg-up")) return;
      card.classList.add("cg-up");
      open.push(card);
      if (open.length < 2) return;
      turns++;
      const [a, b] = open;
      open = [];
      if (a.dataset.id === b.dataset.id) {
        [a, b].forEach(function (c) { c.classList.add("cg-found"); c.style.setProperty("--pair", COLORS[+c.dataset.id % COLORS.length]); });
        found++;
        beep(660, 0.12, 0.1);
        if (found === pairs.length) cheer();
      } else {
        busy = true;
        setTimeout(function () { a.classList.remove("cg-up"); b.classList.remove("cg-up"); busy = false; }, 1300);
      }
      paint();
    }
    function showAll() { grid.querySelectorAll(".cg-card").forEach(function (c) { c.classList.add("cg-up"); }); }
    start();
    return start;
  }

  /* ---------------- Word scramble ---------------- */

  // The letters of a word, mixed up. Tap them (or type them) in order to spell the word; tap a
  // placed letter (or press Backspace) to take it back. Same words as Snowman.
  function scramble(root, cfg) {
    const words = list(cfg.words), next = picker(words);
    let w, tiles, placed, over;
    const slots = h("div", { class: "cg-word cg-scramble-slots" });
    const bank = h("div", { class: "cg-scramble-bank" });
    const status = h("div", { class: "cg-status" });
    const hint = h("div", { class: "cg-hint", hidden: true });
    root.append(slots, status, bank, hint, h("div", { class: "cg-tools" },
      button("Hint", function () { hint.hidden = !hint.hidden; }),
      button("Mix again", function () { if (!over) { takeAll(); mix(); paint(); } }),
      button("Show the word", function () { finish(false); }),
      cfg.random ? button("New word", start, "cg-new") : ""));

    function isLetter(ch) { return /\p{L}/u.test(ch); }
    function start() {
      w = next();
      if (!w) { status.textContent = "No words."; return; }
      over = false;
      root.classList.remove("cg-won");
      tiles = Array.from(w.word.toUpperCase()).filter(isLetter).map(function (ch, i) { return { ch: ch, i: i, used: false }; });
      placed = [];
      hint.hidden = true;
      hint.textContent = "";
      if (w.image) hint.append(h("img", { src: w.image, alt: "" }));
      hint.append(h("span", { text: w.hint || "No hint for this one." }));
      mix();
      paint();
    }
    function mix() {   // a new order, never the word itself (when there's a choice)
      const word = tiles.map(function (t) { return t.ch; }).join("");
      for (let k = 0; k < 10; k++) {
        tiles = shuffle(tiles);
        if (tiles.map(function (t) { return t.ch; }).join("") !== word || new Set(word).size < 2) break;
      }
    }
    function takeAll() { tiles.forEach(function (t) { t.used = false; }); placed = []; }
    function paint(reveal) {
      slots.textContent = "";
      let p = 0;
      w.word.toUpperCase().split(" ").forEach(function (part) {
        const group = h("span", { class: "cg-word-part" });
        Array.from(part).forEach(function (ch) {
          if (!isLetter(ch)) { group.append(h("span", { class: "cg-letter cg-mark", text: ch })); return; }
          const t = placed[p++];
          const slot = h("button", { class: "cg-letter cg-slot" + (t ? " cg-filled" : ""), text: reveal ? ch : t ? t.ch : "",
            onclick: function () { if (t && !over) { takeBack(t); } } });
          group.append(slot);
        });
        slots.append(group);
      });
      bank.textContent = "";
      tiles.forEach(function (t) {
        bank.append(h("button", { class: "cg-key cg-tile-letter" + (t.used ? " cg-used" : ""), text: t.ch, disabled: t.used || over,
          onclick: function () { put(t); } }));
      });
      if (!over) status.textContent = "Spell the word: " + tiles.length + " letters";
    }
    function put(t) {
      if (over || t.used) return;
      t.used = true;
      placed.push(t);
      paint();
      if (placed.length === tiles.length) check();
    }
    function takeBack(t) {
      const k = placed.indexOf(t);
      placed.splice(k, 1);
      t.used = false;
      paint();
    }
    function check() {
      const spelled = placed.map(function (t) { return t.ch; }).join("");
      const answer = Array.from(w.word.toUpperCase()).filter(isLetter).join("");
      if (spelled === answer) { finish(true); return; }
      slots.classList.remove("cg-shake"); void slots.offsetWidth; slots.classList.add("cg-shake");
      status.textContent = "Not quite. Tap a letter to take it back.";
      beep(220, 0.2, 0.1);
    }
    function finish(won) {
      if (over || !w) return;
      over = true;
      root.classList.toggle("cg-won", won);
      status.textContent = won ? "Well done! ✓" : "The word is:";
      paint(true);
      if (won) cheer();
    }
    keyHandlers.push({ el: root, fn: function (e) {
      if (over || !tiles) return false;
      if (e.key === "Backspace" && placed.length) { takeBack(placed[placed.length - 1]); return true; }
      if (e.key.length !== 1 || !/\p{L}/u.test(e.key)) return false;
      const t = tiles.find(function (x) { return !x.used && x.ch === e.key.toUpperCase(); });
      if (t) put(t);
      return true;
    } });
    start();
    return start;
  }

  /* ---------------- Sort it ---------------- */

  // Items in a bank, and groups to sort them into (2 to 4). Tap an item, then its group (or an item
  // already in that group). Written: ::: {.sort} with each group in bold and its items under it; an
  // item can have a picture (![Camel](images/camel.jpg)) and a reason after a | ("Camel | Camels
  // need little water."). From the vocab list: one unit's words sort into their topics, several
  // units' words into their units; the reason is the word's meaning; with="picture" shows pictures.
  // Feedback straight away (the usual): a right item locks in green; a wrong one goes back to the
  // bank, and the reason shows. feedback="end": items stay where they're put until Check.
  function sortGroups(cfg) {
    if (!cfg.random) {
      return list(cfg.groups).map(function (g) {
        return { name: g.name, items: list(g.items).map(function (it) { return typeof it === "string" ? { text: it } : it; }) };
      });
    }
    const words = shuffle(list(cfg.words)), units = list(cfg.units), pictures = cfg.with === "picture";
    const byUnit = {}, byTopic = {};
    words.forEach(function (w) {
      if (pictures && !w.image) return;
      const item = { text: w.word, why: w.word + ": " + w.hint, image: pictures ? w.image : "" };
      list(w.units).forEach(function (u) { (byUnit[u] = byUnit[u] || []).push(item); });
      if (w.topic) (byTopic[w.topic] = byTopic[w.topic] || []).push(item);
    });
    let groups = Object.keys(byUnit).length > 1
      ? Object.keys(byUnit).map(function (u) {
          const t = units.find(function (x) { return String(x.unit) === u; });
          return { name: t ? t.title : "Unit " + u, items: byUnit[u] };
        })
      : Object.keys(byTopic).map(function (k) { return { name: k, items: byTopic[k] }; });
    groups = shuffle(groups.filter(function (g) { return g.items.length >= 2; })).slice(0, 3);
    const each = groups.length === 2 ? 5 : 4;
    return groups.map(function (g) { return { name: g.name, items: g.items.slice(0, each) }; });
  }

  function sortIt(root, cfg) {
    const atEnd = cfg.feedback === "end";
    let groups, chips, sel, mistakes;
    const bank = h("div", { class: "cg-sort-bank", onclick: function (e) { if (e.target === bank) drop(-1); } });
    const cols = h("div", { class: "cg-sort-cols" });
    const why = h("div", { class: "cg-sort-why", hidden: true });
    const status = h("div", { class: "cg-status" });
    root.append(bank, cols, why, status, h("div", { class: "cg-tools" },
      atEnd ? button("Check", check, "cg-primary") : "", button("Show the answers", showAll),
      cfg.random ? button("New words", start, "cg-new") : ""));

    function start() {
      groups = sortGroups(cfg);
      chips = [];
      groups.forEach(function (g, gi) {
        list(g.items).forEach(function (it) { chips.push({ text: it.text || "", why: it.why || "", image: it.image || "", group: gi, at: -1, mark: "" }); });
      });
      chips = shuffle(chips);
      sel = null; mistakes = 0;
      why.hidden = true;
      cols.style.setProperty("--cols", Math.max(groups.length, 1));
      // layout="venn": two circles that overlap; the middle group is "both"
      const venn = cfg.layout === "venn" && groups.length === 3;
      cols.classList.toggle("cg-venn", venn);
      root.classList.toggle("cg-sort-is-venn", venn);
      root.classList.toggle("cg-sort-pictures", chips.some(function (c) { return c.image; }));
      paint();
    }
    function chip(c) {
      const el = h("button", { class: "cg-sort-chip" + (c.image ? " cg-has-pic" : "") + (c === sel ? " cg-selected" : "") + (c.mark ? " cg-" + c.mark : ""),
        disabled: c.mark === "ok" && !atEnd, title: c.text,
        onclick: function (e) {
          e.stopPropagation();
          if (sel && sel !== c && c.at !== -1) { drop(c.at); return; }   // an item is picked: tapping a group's item drops it there
          sel = sel === c ? null : c;
          paint();
        } },
        c.image ? h("img", { src: c.image, alt: c.text }) : "",
        c.image && !c.text ? "" : h("span", { text: c.text }));
      return el;
    }
    function paint() {
      bank.textContent = "";
      const left = chips.filter(function (c) { return c.at === -1; });
      if (!left.length) bank.append(h("span", { class: "cg-sort-empty", text: atEnd ? "All sorted. Press Check!" : "All sorted!" }));
      left.forEach(function (c) { bank.append(chip(c)); });
      cols.textContent = "";
      if (cols.classList.contains("cg-venn")) {
        cols.append(h("span", { class: "cg-venn-circle cg-venn-a", style: "--cat:" + COLORS[0] }),
          h("span", { class: "cg-venn-circle cg-venn-b", style: "--cat:" + COLORS[2] }));
      }
      groups.forEach(function (g, gi) {
        const col = h("div", { class: "cg-sort-col" + (sel ? " cg-target" : ""), style: "--cat:" + COLORS[gi % COLORS.length],
          onclick: function () { drop(gi); } },
          h("div", { class: "cg-sort-head", text: g.name }));
        chips.filter(function (c) { return c.at === gi; }).forEach(function (c) { col.append(chip(c)); });
        cols.append(col);
      });
      if (status.dataset.keep) { delete status.dataset.keep; return; }
      const placed = chips.filter(function (c) { return c.at !== -1 && c.mark !== "no"; }).length;   // not the wrong one on its way back
      status.textContent = sel ? "Now tap a group for “" + (sel.text || "this picture") + "”."
        : "Sorted: " + placed + " of " + chips.length + (atEnd || !mistakes ? "" : "  ·  Mistakes: " + mistakes);
    }
    function explain(c, gi) {   // the feedback box: what went wrong, and why
      why.textContent = "";
      why.append(h("b", { text: "✗ " + (c.text ? "“" + c.text + "”" : "That picture") + " doesn't go in " + groups[gi].name + "." }),
        c.why ? h("span", { text: " " + c.why }) : h("span", { text: " Try another group." }));
      why.hidden = false;
      why.classList.remove("cg-pop"); void why.offsetWidth; why.classList.add("cg-pop");
    }
    function drop(gi) {
      if (!sel) return;
      const c = sel;
      sel = null;
      if (atEnd || gi === -1) { c.at = gi; c.mark = ""; paint(); return; }
      if (gi === c.group) {   // right: it locks in
        c.at = gi; c.mark = "ok"; why.hidden = true;
        beep(660, 0.12, 0.1);
        paint();
        if (chips.every(function (x) { return x.mark === "ok"; })) {
          status.dataset.keep = "1";
          status.textContent = "All sorted! ✓" + (mistakes ? "  (" + mistakes + (mistakes === 1 ? " mistake)" : " mistakes)") : "");
          paint();
          cheer();
        }
        return;
      }
      // wrong: it shows in that group for a moment, in red, then goes back to the bank
      mistakes++;
      c.at = gi; c.mark = "no";
      explain(c, gi);
      beep(220, 0.2, 0.1);
      paint();
      setTimeout(function () { if (c.mark === "no") { c.at = -1; c.mark = ""; paint(); } }, 900);
    }
    function check() {
      let right = 0, wrong = 0;
      chips.forEach(function (c) {
        if (c.at === -1) { c.mark = ""; return; }
        c.mark = c.at === c.group ? "ok" : "no";
        if (c.mark === "ok") right++; else wrong++;
      });
      const all = right === chips.length, left = chips.length - right - wrong;
      // the reasons for the wrong ones
      const wrongs = chips.filter(function (c) { return c.mark === "no" && c.why; });
      why.textContent = "";
      wrongs.slice(0, 3).forEach(function (c) { why.append(h("div", null, h("b", { text: "✗ " + (c.text || "Picture") + ": " }), c.why)); });
      why.hidden = !wrongs.length;
      status.dataset.keep = "1";
      status.textContent = all ? "All right! ✓"
        : right + " right" + (wrong ? ", " + wrong + " wrong (move the red ones)" : "") + (left ? ", " + left + " still to sort" : "") + ".";
      if (all) cheer(); else beep(330, 0.2, 0.1);
      paint();
    }
    function showAll() { chips.forEach(function (c) { c.at = c.group; c.mark = "ok"; }); sel = null; why.hidden = true; paint(); }
    start();
    return start;
  }

  /* ---------------- Bingo ----------------
     Two steps. Before class, Make cards: choose the grid (3 × 3 to 5 × 5), a free middle square and
     how many cards, and download them as a PDF to print (made in the browser by pdf-lib, which loads
     only then). In class, Call: show one meaning at a time; students cross out the word. Check a
     card by its number to see if it really has a bingo.
     Every card is different. A game code (like 1-4F-2831: unit, grid, free square, number) is printed
     on each card; the same code always makes the same cards, so the caller can check any card, on
     any computer. Typing a code from a printed card brings that game back. */

  function seeded(seed) {   // a repeatable random number generator (mulberry32)
    let a = seed >>> 0;
    return function () {
      a = (a + 0x6D2B79F5) | 0;
      let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  function seededShuffle(items, random) {
    const a = items.slice();
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(random() * (i + 1)), t = a[i];
      a[i] = a[j]; a[j] = t;
    }
    return a;
  }

  function bingo(root, cfg) {
    // The words in a fixed order (by word), so a game code always makes the same cards.
    const pool = list(cfg.words).slice().sort(function (a, b) { return a.word.localeCompare(b.word); });
    const unit = cfg.unit || 0;
    const key = "chalkline-games:bingo:" + unit;
    const fits = function (n, free) { return n * n - (free ? 1 : 0) <= pool.length; };
    let g = null;
    try { g = JSON.parse(localStorage.getItem(key)); } catch (e) { /* none yet */ }
    if (!g || !fits(g.size, g.free)) g = newGame(fits(4, true) ? 4 : 3, true);
    function newGame(size, free) {
      return { size: size, free: free && size % 2 === 1, cards: 30, seed: 1000 + Math.floor(Math.random() * 9000), called: [] };
    }
    function saveGame() { try { localStorage.setItem(key, JSON.stringify(g)); } catch (e) { /* private window */ } }
    function code() { return unit + "-" + g.size + (g.free ? "F" : "N") + "-" + g.seed; }
    function cardWords(n) {   // card n (1, 2, …): its words, row by row; "" is the free square
      const k = g.size * g.size - (g.free ? 1 : 0);
      const words = seededShuffle(pool, seeded(g.seed * 1000 + n)).slice(0, k).map(function (w) { return w.word; });
      if (g.free) words.splice(Math.floor(g.size * g.size / 2), 0, "");
      return words;
    }
    function callOrder() { return seededShuffle(pool, seeded(g.seed)); }

    const tabs = h("div", { class: "cg-bingo-tabs" });
    const panel = h("div", { class: "cg-bingo-panel" });
    root.append(tabs, panel);
    let step = g.called.length ? "call" : "make";

    function paint() {
      tabs.textContent = "";
      [["make", "1  Make cards", "before class"], ["call", "2  Call", "in class"]].forEach(function (t) {
        tabs.append(h("button", { class: "cg-bingo-tab" + (step === t[0] ? " cg-on" : ""), onclick: function () { step = t[0]; paint(); } },
          h("b", { text: t[1] }), h("span", { text: t[2] })));
      });
      tabs.append(h("span", { class: "cg-bingo-code", title: "Printed on every card" }, "Game code ", h("b", { text: code() })));
      panel.textContent = "";
      if (step === "make") make(); else call();
    }

    // ---- Step 1: make the cards ----
    function make() {
      const sizes = h("div", { class: "cg-seg" });
      [3, 4, 5].forEach(function (n) {
        const ok = fits(n, n % 2 === 1 && g.free) || fits(n, false);
        sizes.append(h("button", { class: "cg-seg-btn" + (g.size === n ? " cg-on" : ""), disabled: !ok,
          title: ok ? "" : "Not enough words in this unit", text: n + " × " + n,
          onclick: function () { change({ size: n, free: n % 2 === 1 && g.free !== false ? g.free : false }); } }));
      });
      const free = h("input", { type: "checkbox", disabled: g.size % 2 === 0 });
      free.checked = g.free;
      free.addEventListener("change", function () { change({ free: free.checked }); });
      const count = h("input", { type: "number", min: 1, max: 99, value: g.cards, class: "cg-bingo-count" });
      count.addEventListener("change", function () { g.cards = Math.max(1, Math.min(99, parseInt(count.value, 10) || 30)); count.value = g.cards; saveGame(); });
      const msg = h("p", { class: "cg-bingo-note" });
      const download = button("Download the cards (PDF)", function () { makePdf(msg); }, "cg-primary");
      panel.append(
        h("div", { class: "cg-bingo-form" },
          h("label", { class: "cg-field" }, h("span", { text: "Grid" }), sizes),
          h("label", { class: "cg-field" }, h("span", { text: "Free middle square" }), free),
          h("label", { class: "cg-field" }, h("span", { text: "Number of cards" }), count),
          h("div", { class: "cg-field" }, h("span", { text: "Words" }), h("b", { text: pool.length + (unit ? " from this unit" : " from all units") }))),
        h("div", { class: "cg-tools cg-tools-left" }, download,
          sureButton("New game code", function () { g = newGame(g.size, g.free); saveGame(); paint(); })),
        msg,
        h("p", { class: "cg-bingo-note", text: "Every card is different. Print them before class, two cards on each page. The game code on the cards lets you check a winner. " +
          "A new game code makes new cards (print them again)." }));
      function change(c) {
        Object.assign(g, c);
        if (g.size % 2 === 0) g.free = false;
        if (!fits(g.size, g.free)) g.free = false;
        g.called = [];
        saveGame(); paint();
      }
    }

    async function makePdf(msg) {
      msg.textContent = "Making the cards…";
      try {
        const lib = await import(BASE + "pdf-lib.esm.min.js");
        const doc = await lib.PDFDocument.create();
        const bold = await doc.embedFont(lib.StandardFonts.HelveticaBold);
        const regular = await doc.embedFont(lib.StandardFonts.Helvetica);
        const navy = lib.rgb(0, 52 / 255, 119 / 255), grey = lib.rgb(0.55, 0.6, 0.67), light = lib.rgb(0.93, 0.95, 0.98);
        const W = 595.28, H = 841.89, M = 42;   // A4, in points
        const safe = function (font, text) {   // the built-in PDF fonts can't show every letter: swap those for ?
          return Array.from(text).map(function (ch) { try { font.encodeText(ch); return ch; } catch (e) { return "?"; } }).join("");
        };
        const title = (cfg.title || "Vocab") + " Bingo";
        for (let n = 1; n <= g.cards; n++) {
          const top = n % 2 === 1;
          if (top) doc.addPage([W, H]);
          const page = doc.getPages()[doc.getPageCount() - 1];
          const y0 = top ? H - M : H / 2 - 18;   // the top of this card
          page.drawText(safe(bold, title), { x: M, y: y0 - 22, size: 22, font: bold, color: navy });
          page.drawText("Name: ______________________", { x: W - M - 220, y: y0 - 20, size: 12, font: regular, color: navy });
          page.drawText("Card " + n + "   ·   Game " + code(), { x: M, y: y0 - 40, size: 10, font: regular, color: grey });
          const gridTop = y0 - 56, room = H / 2 - M - 80;
          const cell = Math.min((W - 2 * M) / g.size, room / g.size);
          const x0 = (W - cell * g.size) / 2;
          cardWords(n).forEach(function (word, i) {
            const r = Math.floor(i / g.size), c = i % g.size;
            const x = x0 + c * cell, y = gridTop - (r + 1) * cell;
            page.drawRectangle({ x: x, y: y, width: cell, height: cell, borderColor: navy, borderWidth: 1.5, color: word ? undefined : light });
            const text = word ? safe(bold, word) : "FREE";
            const font = word ? bold : regular;
            // Fit the word: wrap at spaces, then shrink until each line fits the square.
            let size = Math.min(22, cell / 4.2), lines;
            for (;;) {
              lines = [];
              text.split(" ").forEach(function (part) {
                const last = lines[lines.length - 1];
                if (last && font.widthOfTextAtSize(last + " " + part, size) < cell - 12) lines[lines.length - 1] = last + " " + part;
                else lines.push(part);
              });
              if (size <= 8 || lines.every(function (l) { return font.widthOfTextAtSize(l, size) < cell - 12; }) && lines.length * size * 1.2 < cell - 10) break;
              size -= 1;
            }
            lines.forEach(function (l, k) {
              const lw = font.widthOfTextAtSize(l, size);
              page.drawText(l, { x: x + (cell - lw) / 2, y: y + cell / 2 + (lines.length / 2 - k - 0.8) * size * 1.2, size: size, font: font, color: word ? navy : grey });
            });
          });
          if (top && n < g.cards) {   // a dashed cut line between the two cards
            page.drawLine({ start: { x: M / 2, y: H / 2 }, end: { x: W - M / 2, y: H / 2 }, thickness: 0.8, color: grey, dashArray: [6, 5] });
          }
        }
        const bytes = await doc.save();
        const a = h("a", { href: URL.createObjectURL(new Blob([bytes], { type: "application/pdf" })),
          download: "bingo-" + code() + ".pdf" });
        document.body.append(a); a.click(); a.remove();
        msg.textContent = "Downloaded: " + g.cards + " cards, game " + code() + ". Print them, then use step 2 in class.";
      } catch (e) {
        msg.textContent = "Couldn't make the PDF (" + e.message + ").";
      }
    }

    // ---- Step 2: call the words ----
    function call() {
      const order = callOrder();
      const now = g.called.length ? pool.find(function (w) { return w.word === g.called[g.called.length - 1]; }) : null;
      const card = h("div", { class: "cg-bingo-clue" });
      if (now) {
        if (now.image) card.append(h("img", { src: now.image, alt: "" }));
        card.append(h("div", { class: "cg-bingo-meaning", text: now.hint || now.word }),
          h("details", { class: "cg-bingo-word" }, h("summary", { text: "Show the word" }), h("b", { text: now.word })));
      } else card.append(h("div", { class: "cg-bingo-meaning cg-idle", text: "Press Next to call the first word." }));
      const done = g.called.length >= order.length;
      const checkBox = h("input", { type: "number", min: 1, max: g.cards, placeholder: "Card no.", class: "cg-bingo-count" });
      const result = h("div", { class: "cg-bingo-check" });
      checkBox.addEventListener("keydown", function (e) { if (e.key === "Enter") checkCard(); });
      function checkCard() {
        const n = parseInt(checkBox.value, 10);
        result.textContent = "";
        if (!(n >= 1)) return;
        const words = cardWords(n);
        const hit = words.map(function (w) { return w === "" || g.called.indexOf(w) >= 0; });
        const lines = [];
        for (let i = 0; i < g.size; i++) {
          lines.push(Array.from({ length: g.size }, function (_, k) { return i * g.size + k; }));   // a row
          lines.push(Array.from({ length: g.size }, function (_, k) { return k * g.size + i; }));   // a column
        }
        lines.push(Array.from({ length: g.size }, function (_, k) { return k * g.size + k; }));
        lines.push(Array.from({ length: g.size }, function (_, k) { return k * g.size + g.size - 1 - k; }));
        const win = lines.find(function (l) { return l.every(function (i) { return hit[i]; }); });
        const grid = h("div", { class: "cg-bingo-mini", style: "--n:" + g.size });
        words.forEach(function (w, i) {
          grid.append(h("span", { class: (hit[i] ? "cg-hit" : "") + (win && win.indexOf(i) >= 0 ? " cg-line" : ""), text: w || "FREE" }));
        });
        result.append(h("b", { class: win ? "cg-yes" : "cg-no", text: win ? "Card " + n + ": BINGO! ✓" : "Card " + n + ": not yet" }), grid);
        if (win) cheer();
      }
      panel.append(h("div", { class: "cg-bingo-call" },
        h("div", { class: "cg-bingo-main" }, card,
          h("div", { class: "cg-tools cg-tools-left" },
            button(done ? "All called" : "Next", function () {
              if (done) return;
              g.called.push(order[g.called.length].word); saveGame(); paint();
            }, "cg-primary cg-big"),
            sureButton("Start over", function () { g.called = []; saveGame(); paint(); })),
          h("div", { class: "cg-status", text: "Called: " + g.called.length + " of " + order.length })),
        h("div", { class: "cg-bingo-side" },
          h("div", { class: "cg-bingo-label", text: "Check a card" }),
          h("div", { class: "cg-tools cg-tools-left" }, checkBox, button("Check", checkCard)),
          result,
          h("div", { class: "cg-bingo-label", text: "Called so far" }),
          h("div", { class: "cg-bingo-called" }, ...g.called.slice().reverse().map(function (w) { return h("span", { text: w }); })),
          h("label", { class: "cg-bingo-load" }, "Cards from another game? Type their code: ",
            (function () {
              const box = h("input", { placeholder: "1-4F-2831", class: "cg-bingo-codebox" });
              box.addEventListener("change", function () {
                const m = box.value.trim().toUpperCase().match(/^(\d+)-(\d)([FN])-(\d+)$/);
                if (!m || +m[1] !== unit) { box.value = ""; box.placeholder = "Not a code for this unit"; return; }
                g = { size: +m[2], free: m[3] === "F", cards: g.cards, seed: +m[4], called: [] };
                saveGame(); paint();
              });
              return box;
            })()))));
    }

    paint();
    return function () { g.called = []; saveGame(); step = "make"; paint(); };   // reset: a fresh call (the same cards)
  }

  // A button that needs a second tap within 3 seconds ("Start over" → "Sure?").
  function sureButton(label, action) {
    let armed = null;
    const b = h("button", { class: "cg-btn", text: label, onclick: function () {
      if (armed) { clearTimeout(armed); armed = null; b.textContent = label; action(); return; }
      b.textContent = "Sure?";
      armed = setTimeout(function () { armed = null; b.textContent = label; }, 3000);
    } });
    return b;
  }

  /* ---------------- Word Blitz (like Kahoot, for one player) ----------------
     A picture and four words, or a word and four pictures. A right answer scores 600 to 1,000
     points (the faster, the more), times the streak: ×1.2 for two right in a row, ×1.3 for three,
     ×1.4 for four, then levels: ×1.5 from 5 in a row (STRAIGHT FIRE), ×2 from 10 (COLD FIRE) and
     ×2.5 from 15 (SUPERNOVA). Reaching a level adds 2,000 points. A wrong answer ends the streak.
     A heat bar along the bottom grows toward the next level; at 4 in a row it shakes and the game
     turns orange; from 5, a fire burns along the bottom, in each level's colors.
     Two modes, each with its own high scores: Classic (20 questions, or 10 if the whole course has
     fewer than 20 words) and Survival (3 lives, and a life back at each new level, up to 3; the
     clock gets faster every 5 questions).
     Every word is asked once before any comes back; a word comes back the other way round
     (picture or word), and a missed word comes back sooner.
     Of the four answers, three are from the right word's unit and one from another unit, when
     there is one. The high scores are kept in this browser only, so one computer can be a station
     for the class, or a student can play at home.
     config: words (the questions), all (every word: the wrong answers), mode ("classic" or
     "survival": the one it starts on), count (Classic's questions), seconds, ask ("both", "picture":
     show a picture, choose the word; "word": show a word, choose the picture), unit, title.
     The pictures are inline SVG with class names, and games.css colors them (the --blitz-… values,
     one set for each level), so a different look is a change to games.css only. */
  const BLITZ_TOP = 10;   // high scores kept
  const BLITZ_LIVES = 3, BLITZ_BONUS = 2000, BLITZ_MIN_SECONDS = 5;
  const BLITZ_LEVELS = { fire: "STRAIGHT FIRE!", cold: "COLD FIRE!", nova: "SUPERNOVA!" };
  function blitzMultiplier(n) { return n >= 15 ? 2.5 : n >= 10 ? 2 : n >= 5 ? 1.5 : n >= 2 ? 1 + n / 10 : 1; }
  function blitzLevel(n) { return n >= 15 ? "nova" : n >= 10 ? "cold" : n >= 5 ? "fire" : n >= 4 ? "warm" : ""; }
  const BLITZ_HEART = '<svg viewBox="0 0 24 22"><path d="M12 21C5 15.5 1 12 1 7a5.5 5.5 0 0 1 11-1 5.5 5.5 0 0 1 11 1c0 5-4 8.5-11 14z"/></svg>';

  // The fire: soft glowing dots that rise from the bottom of the game, drawn on a canvas (no library).
  // They add up where they overlap ("lighter"), so the thick of the fire burns bright and its edges
  // stay red, as a flame does; a few embers float higher. Its colors are the level's --blitz-fire…
  // values, so cold fire is blue. Nothing moves for people whose computer asks for less movement.
  function blitzFire(root, canvas) {
    const still = window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches;
    const ctx = canvas.getContext && canvas.getContext("2d");
    let parts = [], level = "", sprites = [], raf = 0, t = 0;
    function rgb(hex) {
      hex = (hex || "#ff9f1c").trim().replace("#", "");
      if (hex.length === 3) hex = hex.replace(/./g, "$&$&");
      const n = parseInt(hex, 16);
      return [n >> 16 & 255, n >> 8 & 255, n & 255];
    }
    // One soft round dot for each color, drawn once and then stamped.
    function sprite(hex) {
      const c = document.createElement("canvas"), g = c.getContext("2d"), v = rgb(hex).join(",");
      c.width = c.height = 64;
      const r = g.createRadialGradient(32, 32, 0, 32, 32, 32);
      r.addColorStop(0, "rgba(" + v + ",1)"); r.addColorStop(0.45, "rgba(" + v + ",0.75)"); r.addColorStop(1, "rgba(" + v + ",0)");
      g.fillStyle = r; g.fillRect(0, 0, 64, 64);
      return c;
    }
    function frame() {
      raf = 0;
      if (!root.isConnected) return;
      if (document.hidden || !onCurrentSlide(root)) { parts = []; ctx.clearRect(0, 0, canvas.width, canvas.height); if (level) setTimeout(go, 400); return; }
      const w = canvas.width, hgt = canvas.height;
      t++;
      if (level && parts.length < 900) {
        const rate = level === "nova" ? 13 : level === "cold" ? 12 : 11;
        for (let k = 0; k < rate; k++) {
          const ember = Math.random() < 0.06;
          parts.push({ x: Math.random() * w, y: hgt + 10, vx: (Math.random() - 0.5) * 0.6, vy: -(ember ? 2 + Math.random() * 2 : 1.8 + Math.random() * 2.4),
            size: ember ? 5 + Math.random() * 5 : 44 + Math.random() * 40, age: 0, life: ember ? 90 + Math.random() * 60 : 30 + Math.random() * 34,
            ember: ember, seed: Math.random() * 6 });
        }
      }
      ctx.clearRect(0, 0, w, hgt);
      ctx.globalCompositeOperation = "lighter";
      parts = parts.filter(function (p) { return p.age < p.life; });
      parts.forEach(function (p) {
        p.age++;
        const a = p.age / p.life;
        p.x += p.vx + Math.sin(t / 7 + p.seed) * (p.ember ? 0.9 : 0.4);
        p.y += p.vy;
        const s = p.ember ? p.size : p.size * (1 - a * 0.7);
        ctx.globalAlpha = p.ember ? 1 - a : (1 - a) * 0.55;
        ctx.drawImage(sprites[p.ember || a < 0.2 ? 2 : a < 0.5 ? 1 : 0], p.x - s / 2, p.y - s / 2, s, s);
      });
      ctx.globalCompositeOperation = "source-over";
      ctx.globalAlpha = 1;
      if (level || parts.length) go();
    }
    function go() { if (!raf) raf = requestAnimationFrame(frame); }
    return {
      // level: "fire", "cold" or "nova" burns in its colors; "" lets the fire die down.
      set: function (next) {
        if (still || !ctx) return;
        if (next && next !== level) {
          canvas.width = canvas.offsetWidth || 1000;
          canvas.height = canvas.offsetHeight || 260;
          const css = getComputedStyle(root);
          sprites = ["--blitz-fire1", "--blitz-fire2", "--blitz-fire3"].map(function (v) { return sprite(css.getPropertyValue(v)); });
        }
        level = next;
        if (level) go();
      },
      clear: function () { level = ""; parts = []; if (ctx) ctx.clearRect(0, 0, canvas.width, canvas.height); },
    };
  }

  // The pictures.
  const BLITZ_ART = {
    flame: '<svg viewBox="0 0 24 32" class="cg-blitz-svg-flame"><path class="cg-f1" d="M12 1c1.5 6 9 9 9 18.5A9 9 0 0 1 3 19.5C3 14 6 12 7 8c1.5 2.5 2.5 3.5 4 4C10 8 10.5 4 12 1z"/>' +
      '<path class="cg-f2" d="M12 10c1.2 3.5 6 5.5 6 10.5a6 6 0 0 1-12 0c0-3 1.5-4.5 2.5-6.5.8 1.4 1.6 2 2.6 2.3C10.6 14 11 12 12 10z"/>' +
      '<path class="cg-f3" d="M12 18c.8 2 3 3 3 5.2a3 3 0 0 1-6 0c0-1.6.8-2.4 1.4-3.4.4.7.9 1 1.4 1.1.4-.9.8-1.9.2-2.9z"/></svg>',
    sparkle: '<svg viewBox="0 0 24 24" class="cg-blitz-svg-sparkle"><path d="M12 0c1 6.5 5.5 11 12 12-6.5 1-11 5.5-12 12-1-6.5-5.5-11-12-12C6.5 11 11 6.5 12 0z"/></svg>',
    star: '<svg viewBox="0 0 24 24" class="cg-blitz-svg-star"><path d="M12 1.8l3.1 6.6 7.2.9-5.3 5 1.4 7.1L12 17.9l-6.4 3.5 1.4-7.1-5.3-5 7.2-.9z"/></svg>',
    trophy: '<svg viewBox="0 0 64 64" class="cg-blitz-svg-trophy"><path class="cg-t-handle" d="M18 14H9c0 10 5 15 12 15M46 14h9c0 10-5 15-12 15" fill="none" stroke-width="4" stroke-linecap="round"/>' +
      '<path class="cg-t-cup" d="M16 8h32v12c0 12-7 20-16 20S16 32 16 20z"/><path class="cg-t-shine" d="M21 12v8c0 5 2 9 5 12" fill="none" stroke-width="3" stroke-linecap="round"/>' +
      '<rect class="cg-t-cup" x="28" y="39" width="8" height="9"/><rect class="cg-t-base" x="18" y="47" width="28" height="9" rx="3"/>' +
      '<path class="cg-t-star" d="M32 14l2.4 5 5.4.6-4 3.7 1.1 5.3L32 26l-4.9 2.6 1.1-5.3-4-3.7 5.4-.6z"/></svg>',
  };
  function art(name, cls) {
    const s = h("span", { class: "cg-blitz-art" + (cls ? " " + cls : ""), "aria-hidden": "true" });
    s.innerHTML = BLITZ_ART[name];
    return s;
  }
  // A starburst: n points around (50, 50), out to r1 and in to r2.
  function burst(n, r1, r2) {
    const pts = [];
    for (let k = 0; k < n * 2; k++) {
      const r = k % 2 ? r2 : r1, a = Math.PI * k / n - Math.PI / 2;
      pts.push((50 + r * Math.cos(a)).toFixed(1) + "," + (50 + r * Math.sin(a)).toFixed(1));
    }
    return '<polygon class="cg-blitz-burst" points="' + pts.join(" ") + '"/>';
  }
  // The game's badge: a lightning bolt on a spinning starburst, with a flame on each side.
  function logo() {
    const s = h("div", { class: "cg-blitz-logo", "aria-hidden": "true" });
    s.innerHTML = '<svg viewBox="0 0 100 100" class="cg-blitz-logo-burst">' + burst(14, 49, 38) + "</svg>" +
      '<svg viewBox="0 0 100 100" class="cg-blitz-logo-face"><circle class="cg-blitz-disc" cx="50" cy="50" r="33"/>' +
      '<path class="cg-blitz-bolt" d="M55 18L33 54h14l-5 28 25-38H52z"/></svg>';
    s.prepend(art("flame", "cg-blitz-logo-left"));
    s.append(art("flame", "cg-blitz-logo-right"));
    return s;
  }
  // Sparkles that twinkle on a panel: [left %, top %, size].
  const BLITZ_TWINKLES = [[6, 10, 26], [90, 14, 18], [13, 78, 16], [84, 74, 28], [48, 6, 12], [95, 46, 12], [3, 44, 14], [70, 90, 14], [28, 92, 10]];
  function twinkles() {
    return BLITZ_TWINKLES.map(function (t, k) {
      const s = art("sparkle", "cg-blitz-twinkle");
      s.style.cssText = "left:" + t[0] + "%;top:" + t[1] + "%;width:" + t[2] + "px;height:" + t[2] + "px;animation-delay:" + (k * 0.37).toFixed(2) + "s";
      return s;
    });
  }
  // Rank 1 to 3: a medal with its number; the rest: the number.
  function medal(rank) {
    if (rank > 3) return h("span", { class: "cg-blitz-rank", text: rank });
    const s = h("span", { class: "cg-blitz-rank cg-blitz-medal cg-blitz-medal-" + rank, "aria-label": "Number " + rank });
    s.innerHTML = '<svg viewBox="0 0 24 30" aria-hidden="true"><path class="cg-m-ribbon-l" d="M6 0h6l-3 13H3z"/><path class="cg-m-ribbon-r" d="M12 0h6l3 13h-6z"/>' +
      '<circle class="cg-m-disc" cx="12" cy="19" r="10"/><circle class="cg-m-ring" cx="12" cy="19" r="7.2"/>' +
      '<text x="12" y="23.2" text-anchor="middle">' + rank + "</text></svg>";
    return s;
  }

  function wordBlitz(root, cfg) {
    const all = list(cfg.all).length ? list(cfg.all) : list(cfg.words);
    const words = list(cfg.words);
    const base = cfg.seconds || 10;
    const count = cfg.count || (all.length >= 20 ? 20 : 10);   // Classic: 20 questions, or 10 for a small course
    let mode = cfg.mode === "survival" ? "survival" : "classic";
    try { mode = localStorage.getItem("chalkline-games:blitz-mode") || mode; } catch (e) { /* first visit */ }
    let i, total, right, streak, bestStreak, lives, answered, started, seconds, q;
    let deck, due, asked, timer = 0, wait = 0, phase = "start", entry = null;
    const canvas = h("canvas", { class: "cg-blitz-fire", "aria-hidden": "true" });
    const heatFill = h("div", { class: "cg-blitz-heat-fill" });
    const heat = h("div", { class: "cg-blitz-heat", "aria-hidden": "true" }, heatFill);
    const stage = h("div", { class: "cg-blitz-stage" });
    const fx = h("div", { class: "cg-blitz-fx", "aria-hidden": "true" });   // the banners, over the whole game
    root.append(canvas, stage, heat, fx);
    const fire = blitzFire(root, canvas);

    function key() { return "chalkline-games:blitz:" + (cfg.unit || "all") + ":" + mode; }
    function scores() {
      try { return list(JSON.parse(localStorage.getItem(key()))); } catch (e) { return []; }
    }
    function saveScores(s) {
      try { localStorage.setItem(key(), JSON.stringify(s)); } catch (e) { /* private window: just for now */ }
    }
    function ranked(s) { return s.slice().sort(function (a, b) { return b.score - a.score || a.at - b.at; }).slice(0, BLITZ_TOP); }

    // Three wrong answers: two from the word's own unit and one from another unit (when there is one).
    function options(w, pictures) {
      const others = shuffle(all.filter(function (x) { return x.word !== w.word && (!pictures || x.image); }));
      const home = list(w.units);
      const inHome = function (x) { return list(x.units).some(function (u) { return home.indexOf(u) >= 0; }); };
      const same = others.filter(inHome), away = others.filter(function (x) { return !inHome(x); });
      const picks = same.slice(0, away.length ? 2 : 3).concat(away.slice(0, 1));
      others.forEach(function (x) { if (picks.length < 3 && picks.indexOf(x) < 0) picks.push(x); });
      return shuffle(picks.concat([w]));
    }
    // The next question: a missed word that's due again, or the next word from the deck (every
    // word once, then a fresh shuffle). A word asked before comes back the other way round.
    function nextQuestion() {
      let w = null;
      const d = due.findIndex(function (x) { return x.at <= i; });
      if (d >= 0) w = due.splice(d, 1)[0].w;
      else {
        if (!deck.length) {
          deck = shuffle(words);
          if (deck.length > 1 && q && deck[deck.length - 1] === q.w) deck.unshift(deck.pop());   // not the same word twice
        }
        w = deck.pop();
      }
      const ask = cfg.ask || "both", before = asked.get(w.word);
      let m = !w.image ? "meaning" : ask === "picture" ? "picture" : ask === "word" ? "word"
        : before ? (before === "word" ? "picture" : "word") : i % 2 ? "word" : "picture";
      if (m === "word" && all.filter(function (x) { return x.image; }).length < 4) m = "picture";
      asked.set(w.word, m);
      return { w: w, mode: m, options: options(w, m === "word") };
    }
    function stop() { clearInterval(timer); clearTimeout(wait); timer = wait = 0; }
    function table(mine) {
      const s = ranked(scores());
      const box = h("div", { class: "cg-blitz-board" }, h("div", { class: "cg-blitz-board-title" }, art("trophy"), "High scores",
        h("span", { class: "cg-blitz-board-mode", text: mode === "survival" ? "Survival" : "Classic" })));
      if (!s.length) box.append(h("div", { class: "cg-blitz-empty" }, art("star"), h("span", { text: "No scores yet. Be the first!" })));
      else {
        const ol = h("ol", { class: "cg-blitz-list" });
        s.forEach(function (e, j) {
          ol.append(h("li", { class: mine && e.at === mine.at ? "cg-blitz-mine" : "" },
            medal(j + 1), h("span", { class: "cg-blitz-name", text: e.name }),
            h("span", { class: "cg-blitz-pts", text: e.score.toLocaleString("en-US") })));
        });
        box.append(ol);
      }
      box.append(h("div", { class: "cg-blitz-note", text: "Saved on this computer only." }),
        s.length ? h("div", { class: "cg-tools" }, sureButton("Clear the scores", function () { saveScores([]); paintBoard(); })) : "");
      return box;
    }
    function paintBoard() {
      const old = stage.querySelector(".cg-blitz-board");
      if (old) old.replaceWith(table(entry));
    }
    // A colorful panel with twinkling sparkles.
    function panel(cls) {
      const p = h("div", { class: "cg-blitz-panel " + cls });
      p.append(...twinkles());
      return p;
    }
    // The level, the heat bar and the fire, from the streak.
    function paintHeat() {
      const lit = streak ? (streak >= 15 ? 5 : (streak - 1) % 5 + 1) : 0;
      const level = blitzLevel(streak);
      if (level) root.dataset.level = level; else delete root.dataset.level;
      if (phase !== "question" && phase !== "feedback") root.classList.remove("cg-blitz-playing");
      root.style.setProperty("--heat", lit / 5);
      fire.set(level === "warm" ? "" : level);
    }

    function begin() {
      stop();
      phase = "start"; entry = null; streak = 0;
      fx.textContent = "";
      fire.clear();
      paintHeat();
      stage.textContent = "";
      stage.className = "cg-blitz-stage cg-blitz-home";
      const modes = h("div", { class: "cg-blitz-modes", role: "tablist", "aria-label": "Mode" });
      [["classic", "Classic"], ["survival", "Survival"]].forEach(function (m) {
        modes.append(h("button", { class: "cg-blitz-mode" + (m[0] === mode ? " cg-on" : ""), role: "tab", "aria-selected": m[0] === mode ? "true" : "false",
          onclick: function () {
            mode = m[0];
            try { localStorage.setItem("chalkline-games:blitz-mode", mode); } catch (e) { /* private window */ }
            begin();
          } }, m[1]));
      });
      const intro = panel("cg-blitz-intro");
      intro.append(logo(),
        h("div", { class: "cg-blitz-title", text: cfg.title || "Word Blitz" }),
        modes,
        h("div", { class: "cg-blitz-sub", text: mode === "survival" ? BLITZ_LIVES + " lives · win one back at 5, 10 and 15 in a row"
          : count + " questions · " + base + " seconds each" }),
        h("div", { class: "cg-blitz-how" }, art("flame"), h("span", { text: "Get answers right in a row! 5 in a row: ×1.5. 10: ×2. 15: ×2.5." })),
        h("div", { class: "cg-tools" }, words.length ? button("Start!", countdown, "cg-big cg-blitz-go") : h("span", { text: "No words yet." })));
      stage.append(intro, table());
    }
    function countdown() {
      stop();
      phase = "count";
      total = 0; right = 0; streak = 0; bestStreak = 0; lives = BLITZ_LIVES; i = -1; q = null;
      deck = []; due = []; asked = new Map();
      paintHeat();
      let n = 3;
      const num = h("div", { class: "cg-blitz-count", text: n });
      const ring = h("div", { class: "cg-blitz-count-burst", "aria-hidden": "true" });
      ring.innerHTML = '<svg viewBox="0 0 100 100">' + burst(16, 49, 40) + "</svg>";
      stage.textContent = "";
      stage.className = "cg-blitz-stage cg-blitz-ready";
      const p = panel("cg-blitz-intro cg-blitz-ready-panel");
      p.append(h("div", { class: "cg-blitz-sub", text: "Get ready!" }), h("div", { class: "cg-blitz-count-box" }, ring, num));
      stage.append(p);
      beep(660, 0.12, 0.1);
      timer = setInterval(function () {
        n--;
        if (n > 0) { num.textContent = n; num.classList.remove("cg-pop"); void num.offsetWidth; num.classList.add("cg-pop"); beep(660, 0.12, 0.1); }
        else next();
      }, 800);
    }
    function over() { return mode === "survival" ? lives <= 0 : i + 1 >= count; }
    function heart(cls) {
      const s = h("span", { class: "cg-blitz-heart" + (cls ? " " + cls : "") });
      s.innerHTML = BLITZ_HEART;
      return s;
    }
    // lost: the heart that just broke; gained: the one that just came back (or -1).
    function hearts(lost, gained) {
      const box = h("span", { class: "cg-blitz-hearts", "aria-label": lives + " lives" });
      for (let k = 0; k < BLITZ_LIVES; k++) {
        box.append(heart((k >= lives ? "cg-blitz-gone" : "") + (k === lost ? " cg-blitz-break" : "") + (k === gained ? " cg-blitz-gain" : "")));
      }
      return box;
    }
    function topLeft(lost, gained) {
      return h("span", { class: "cg-blitz-left-top" },
        h("span", { class: "cg-blitz-num", text: mode === "survival" ? "Question " + (i + 1) : (i + 1) + " / " + count }),
        mode === "survival" ? hearts(lost, gained) : "");
    }
    function next() {
      stop();
      if (i >= 0 && over()) { end(); return; }
      i++;
      phase = "question"; answered = false;
      q = nextQuestion();
      const w = q.w;
      seconds = mode === "survival" ? Math.max(BLITZ_MIN_SECONDS, base - Math.floor(i / 5)) : base;
      const fill = h("div", { class: "cg-blitz-fuse-fill" }, art("sparkle", "cg-blitz-spark"));
      const fuse = h("div", { class: "cg-blitz-fuse" }, fill);
      const left = h("span", { class: "cg-blitz-left", text: seconds });
      const grid = h("div", { class: "cg-blitz-grid" + (q.mode === "word" ? " cg-blitz-pictures" : "") });
      q.options.forEach(function (o, j) {
        grid.append(h("button", { class: "cg-blitz-opt cg-blitz-opt-" + (j + 1), "data-n": j,
          "aria-label": q.mode === "word" ? "Picture " + (j + 1) : o.word, onclick: function () { choose(j); } },
          q.mode === "word" ? h("img", { src: o.image, alt: "" }) : h("span", { class: "cg-blitz-word", text: o.word })));
      });
      const prompt = q.mode === "picture" ? h("img", { class: "cg-blitz-img", src: w.image, alt: "" })
        : q.mode === "word" ? h("div", { class: "cg-blitz-term", text: w.word })
        : h("div", { class: "cg-blitz-def", text: w.hint });
      stage.textContent = "";
      stage.className = "cg-blitz-stage cg-blitz-play cg-blitz-mode-" + q.mode;
      root.classList.add("cg-blitz-playing");
      stage.append(
        h("div", { class: "cg-blitz-top" }, topLeft(),
          h("span", { class: "cg-blitz-ask", text: q.mode === "word" ? "Which picture is it?" : "Which word is it?" }),
          h("span", { class: "cg-blitz-score" }, streakMeter(), h("span", { class: "cg-blitz-total", text: total.toLocaleString("en-US") }))),
        h("div", { class: "cg-blitz-prompt" }, prompt),
        h("div", { class: "cg-blitz-clock" }, fuse, left),
        h("div", { class: "cg-blitz-feedback", hidden: true }),
        grid);
      started = Date.now();
      const length = seconds * 1000;
      timer = setInterval(function () {
        const rest = Math.max(0, length - (Date.now() - started));
        fill.style.width = (100 * rest / length) + "%";
        fuse.classList.toggle("cg-blitz-hurry", rest < 3000);
        left.textContent = Math.ceil(rest / 1000);
        if (!rest) choose(-1);
      }, 50);
    }
    function times(m) { return "×" + (Math.round(m * 10) / 10); }
    // The streak meter in the top bar: five flames that light up toward the next level, and the
    // multiplier the next right answer gets.
    function streakMeter() {
      const lit = streak ? (streak >= 15 ? 5 : (streak - 1) % 5 + 1) : 0;
      const meter = h("span", { class: "cg-blitz-meter" + (streak >= 3 ? " cg-blitz-hot" : ""), title: streak + " in a row" });
      for (let k = 0; k < 5; k++) meter.append(art("flame", k < lit ? "cg-blitz-lit" + (k === lit - 1 ? " cg-blitz-new" : "") : "cg-blitz-out"));
      if (streak) meter.append(h("span", { class: "cg-blitz-next", text: "next " + times(blitzMultiplier(streak + 1)) }));
      return meter;
    }
    // Sparkles fly out of the right answer.
    function sparkleBurst(el) {
      for (let k = 0; k < 10; k++) {
        const a = Math.PI * 2 * k / 10 + Math.random() * 0.4, d = 90 + Math.random() * 60;
        const s = art("sparkle", "cg-blitz-pop");
        s.style.cssText = "--dx:" + Math.round(Math.cos(a) * d) + "px;--dy:" + Math.round(Math.sin(a) * d) + "px;animation-delay:" + (Math.random() * 0.08).toFixed(2) + "s";
        el.append(s);
      }
    }
    // A new level: its banner sweeps across the game, and flames rise from the bottom.
    function levelUp(level, m, bonus, life) {
      fx.textContent = "";
      fx.append(h("div", { class: "cg-blitz-glow" }), h("div", { class: "cg-blitz-band" },
        art("flame", "cg-blitz-band-flame"),
        h("span", { class: "cg-blitz-band-big", text: BLITZ_LEVELS[level] }),
        art("flame", "cg-blitz-band-flame"),
        h("span", { class: "cg-blitz-band-small", text: streak + " in a row  " + times(m) + "  +" + bonus.toLocaleString("en-US") + (life ? "  +1 life" : "") })));
      for (let k = 0; k < 22; k++) {
        const f = art("flame", "cg-blitz-flame"), size = 40 + Math.random() * 50;
        f.style.cssText = "left:" + (k * 4.6 + Math.random() * 3 - 2).toFixed(1) + "%;width:" + size.toFixed(0) + "px;height:" + (size * 1.33).toFixed(0) +
          "px;animation-delay:" + (Math.random() * 0.6).toFixed(2) + "s";
        fx.append(f);
      }
      fx.classList.remove("cg-blitz-burn"); void fx.offsetWidth; fx.classList.add("cg-blitz-burn");
      const notes = level === "cold" ? [1319, 1047, 1568, 1319, 2093] : level === "nova" ? [523, 784, 1047, 1568, 2093, 2637] : [392, 523, 659, 784, 1047, 1319];
      notes.forEach(function (f, k) { beep(f, 0.22, 0.12, k * 0.07); });
    }
    // j: the button chosen, or -1 when the time ran out.
    function choose(j) {
      if (phase !== "question" || answered) return;
      answered = true;
      stop();
      const ok = j >= 0 && q.options[j] === q.w;
      const elapsed = Math.min(Date.now() - started, seconds * 1000);
      const points0 = ok ? Math.round(1000 - 400 * elapsed / (seconds * 1000)) : 0;   // 600 to 1,000
      const before = blitzLevel(streak);
      streak = ok ? streak + 1 : 0;
      bestStreak = Math.max(bestStreak, streak);
      const level = blitzLevel(streak), m = blitzMultiplier(streak);
      const bonus = ok && BLITZ_LEVELS[level] && level !== before ? BLITZ_BONUS : 0;
      const points = Math.round(points0 * m) + bonus;
      const life = bonus > 0 && mode === "survival" && lives < BLITZ_LIVES;   // Survival: a life back at each new level
      if (life) lives++;
      total += points;
      if (ok) right++;
      else {
        due.push({ w: q.w, at: i + 3 });   // a missed word comes back soon
        if (mode === "survival") lives--;
      }
      stage.querySelectorAll(".cg-blitz-opt").forEach(function (b, k) {
        b.disabled = true;
        if (q.options[k] === q.w) { b.classList.add("cg-blitz-right"); if (ok) sparkleBurst(b); }
        else if (k === j) b.classList.add("cg-blitz-wrong");
        else b.classList.add("cg-blitz-dim");
        if (q.mode === "word" && q.options[k] === q.w) b.append(h("span", { class: "cg-blitz-label", text: q.w.word }));
      });
      const fb = stage.querySelector(".cg-blitz-feedback");
      fb.hidden = false;
      fb.className = "cg-blitz-feedback " + (ok ? "cg-blitz-yes" : "cg-blitz-no");
      fb.append(h("span", { text: ok ? "Correct!  +" + points.toLocaleString("en-US") : j < 0 ? "Time's up!" : "Not quite." }),
        ok && m > 1 ? h("span", { class: "cg-blitz-times", text: times(m) + (bonus ? " + bonus" : "") }) : "",
        life ? h("span", { class: "cg-blitz-life" }, heart("cg-blitz-gain"), "+1 life") : "",
        ok ? "" : h("span", { class: "cg-blitz-was", text: "It's: " + q.w.word }),
        button(over() ? (mode === "survival" && lives <= 0 ? "Game over" : "See my score") : "Next", next, "cg-primary"));
      stage.querySelector(".cg-blitz-clock").hidden = true;
      stage.querySelector(".cg-blitz-left-top").replaceWith(topLeft(!ok && mode === "survival" ? lives : -1, life ? lives - 1 : -1));
      const score = stage.querySelector(".cg-blitz-score");
      score.textContent = "";
      score.append(streakMeter(), h("span", { class: "cg-blitz-total" + (ok ? " cg-blitz-up" : ""), text: total.toLocaleString("en-US") }));
      paintHeat();
      if (bonus) levelUp(level, m, bonus, life);
      else if (ok) beep(880, 0.15, 0.12);
      else beep(196, 0.25, 0.12);
      phase = "feedback";
      wait = setTimeout(next, bonus ? 3000 : ok ? 2000 : 3200);   // on by itself; Next goes straight on
    }
    function end() {
      stop();
      phase = "end";
      streak = 0;
      paintHeat();
      const played = i + 1;
      const s = ranked(scores());
      const makesIt = total > 0 && (s.length < BLITZ_TOP || total > s[s.length - 1].score);
      const best = !s.length || total > s[0].score;
      const name = h("input", { class: "cg-blitz-input", type: "text", maxlength: "16", placeholder: "Your name",
        "aria-label": "Your name", autocomplete: "off", spellcheck: "false" });
      const save = function () {
        const n = name.value.trim().slice(0, 16);
        if (!n) { name.focus(); return; }
        entry = { name: n, score: total, right: right, of: played, streak: bestStreak, mode: mode, at: Date.now() };
        saveScores(ranked(scores().concat([entry])));
        const place = ranked(scores()).findIndex(function (e) { return e.at === entry.at; }) + 1;
        form.replaceWith(h("div", { class: "cg-blitz-saved", text: place ? "Saved! You're number " + place + "." : "Saved!" }));
        again.classList.add("cg-primary");
        phase = "saved";
        paintBoard();
      };
      name.addEventListener("keydown", function (e) { if (e.key === "Enter") { e.preventDefault(); save(); } e.stopPropagation(); });
      const again = button("Play again", begin, makesIt ? "" : "cg-primary");
      const form = makesIt ? h("div", { class: "cg-blitz-form" },
        h("div", { class: "cg-blitz-made" }, art("trophy"), h("span", { text: best && s.length ? "A new top score!" : "You made the high scores!" })),
        h("div", { class: "cg-blitz-entry" }, name, button("Save", save, "cg-primary"))) : "";
      // Stars. Classic: half right, most right, all right. Survival: 10, 20, 30 right.
      const won = mode === "survival" ? Math.min(3, Math.floor(right / 10))
        : right === played ? 3 : right >= played * 0.7 ? 2 : right >= played * 0.4 ? 1 : 0;
      const stars = h("div", { class: "cg-blitz-stars" });
      for (let k = 0; k < 3; k++) {
        const st = art("star", k < won ? "cg-blitz-won" : "");
        st.style.animationDelay = (0.25 + k * 0.25) + "s";
        stars.append(st);
      }
      stage.textContent = "";
      stage.className = "cg-blitz-stage cg-blitz-home cg-blitz-end";
      const p = panel("cg-blitz-intro");
      p.append(stars,
        h("div", { class: "cg-blitz-sub", text: mode === "survival" ? "Out of lives! Your score" : "Your score" }),
        h("div", { class: "cg-blitz-final", text: total.toLocaleString("en-US") }),
        h("div", { class: "cg-blitz-sub", text: right + (mode === "survival" ? " right" : " of " + played + " right") +
          (mode !== "survival" && right === played ? ". Perfect!" : "") + (bestStreak > 1 ? " · best streak " + bestStreak : "") }),
        form,
        h("div", { class: "cg-tools" }, again));
      stage.append(p, table());
      if (won === 3) cheer();
      if (makesIt) setTimeout(function () { name.focus(); }, 50);
    }

    keyHandlers.push({ el: root, fn: function (e) {
      if (phase === "question" && /^[1-4]$/.test(e.key)) { choose(+e.key - 1); return true; }
      if (e.key === "Enter" && (phase === "start" || phase === "feedback")) { phase === "start" ? countdown() : next(); return true; }
      return false;
    } });
    begin();
    return begin;   // reset: back to the start; the high scores stay
  }

  /* ---------------- Review games page: choose a game and a unit, then play ----------------
     config: { words: every vocab word, with its units; units: [{ unit, title }]; home: the overview }.
     The last choice is remembered in this browser. */

  // Simple line icons (24 × 24, drawn in the text color), so the header looks the same everywhere.
  const PICKS = [
    { id: "snowman", label: "Snowman", icon: '<circle cx="12" cy="7" r="3.5"/><circle cx="12" cy="16" r="5"/><path d="M4 11l4 2M20 11l-4 2"/>' },
    { id: "scramble", label: "Scramble", icon: '<rect x="2.5" y="8" width="5.5" height="8" rx="1"/><rect x="9.25" y="8" width="5.5" height="8" rx="1"/><rect x="16" y="8" width="5.5" height="8" rx="1"/><path d="M5 5c2-2 5-2 7 0M19 19c-2 2-5 2-7 0"/>' },
    { id: "picture-reveal", label: "Picture", icon: '<rect x="3" y="4" width="18" height="16" rx="2"/><path d="M3 15l5-5 4 4 3-3 6 6"/><circle cx="15.5" cy="8.5" r="1.5"/>' },
    { id: "matching", label: "Matching", icon: '<circle cx="5" cy="6" r="2"/><circle cx="5" cy="18" r="2"/><circle cx="19" cy="6" r="2"/><circle cx="19" cy="18" r="2"/><path d="M7 6.8l10 10.4M7 17.2L17 6.8"/>' },
    { id: "memory", label: "Memory", icon: '<rect x="2.5" y="5" width="9" height="14" rx="1.5"/><rect x="12.5" y="5" width="9" height="14" rx="1.5"/><path d="M7 10.5v3M17 10.5v3"/>' },
    { id: "sort", label: "Sort it", icon: '<path d="M4 4v16h16"/><path d="M8 15V10M12 15V7M16 15v-3"/>' },
    { id: "jeopardy", label: "Jeopardy", icon: '<rect x="3" y="3" width="7.5" height="7.5" rx="1.5"/><rect x="13.5" y="3" width="7.5" height="7.5" rx="1.5"/><rect x="3" y="13.5" width="7.5" height="7.5" rx="1.5"/><rect x="13.5" y="13.5" width="7.5" height="7.5" rx="1.5"/>' },
    { id: "trivia", label: "Quick-fire", icon: '<path d="M13 2L4.5 13.5H12L11 22l8.5-11.5H12L13 2z"/>' },
    { id: "blitz", label: "Word Blitz", icon: '<path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.07-2.14-.22-4.05 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.15.43-2.29 1-3a2.5 2.5 0 0 0 2.5 2.5z"/>' },
    { id: "bingo", label: "Bingo", icon: '<rect x="3" y="3" width="18" height="18" rx="2"/><path d="M9 3v18M15 3v18M3 9h18M3 15h18"/><circle cx="12" cy="12" r="1.6"/>' },
  ];
  function icon(paths) {
    const span = h("span", { class: "cg-pick-icon", "aria-hidden": "true" });
    span.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">' + paths + "</svg>";
    return span;
  }

  function gamePicker(root, cfg) {
    const words = list(cfg.words), units = list(cfg.units);
    // games: only these, in this order (the Play page); every game if it's empty.
    const picks = list(cfg.games).length ? list(cfg.games).map(function (id) { return PICKS.find(function (g) { return g.id === id; }); }).filter(Boolean) : PICKS;
    const store = "chalkline-games:picker" + (list(cfg.games).length ? ":" + list(cfg.games).join(",") : "");
    let choice = { game: picks[0].id, unit: 0 }, reset = null;
    try { choice = Object.assign(choice, JSON.parse(localStorage.getItem(store)) || {}); } catch (e) { /* first visit */ }
    // The header: the games as one segmented control, then the unit menu and a link back to the overview.
    const gameRow = h("div", { class: "cg-pick-games", role: "tablist", "aria-label": "Game" });
    const unitMenu = h("select", { class: "cg-pick-select", "aria-label": "Unit", onchange: function () {
      unitMenu.blur();   // so the arrow keys don't change the unit by accident
      choose({ unit: +unitMenu.value });
    } });
    const unitRow = h("div", { class: "cg-pick-side" },
      unitMenu,   // its first choice, "All units", says what it is
      cfg.home ? h("a", { class: "cg-pick-home", href: cfg.home, text: "← Overview" }) : "");
    const stage = h("div", { class: "cg-pick-stage" });
    root.append(h("div", { class: "cg-pick-bar" }, gameRow, unitRow), stage);

    function choose(change) {
      Object.assign(choice, change);
      try { localStorage.setItem(store, JSON.stringify(choice)); } catch (e) { /* private window */ }
      play();
    }
    function paintBar() {
      gameRow.textContent = "";
      picks.forEach(function (g) {
        const on = g.id === choice.game;
        gameRow.append(h("button", { class: "cg-pick" + (on ? " cg-on" : ""), role: "tab", "aria-selected": on ? "true" : "false",
          onclick: function () { choose({ game: g.id }); } }, icon(g.icon), g.label));
      });
      unitMenu.textContent = "";
      [{ unit: 0, title: "All units" }].concat(units).forEach(function (u) {
        unitMenu.append(h("option", { value: u.unit, text: u.unit ? u.unit + " · " + u.title : u.title }));
      });
      unitMenu.value = String(choice.unit);
    }
    function play() {
      if (!picks.some(function (g) { return g.id === choice.game; })) choice.game = picks[0].id;
      if (choice.unit && !units.some(function (u) { return u.unit === choice.unit; })) choice.unit = 0;
      paintBar();
      const pool = words.filter(function (w) {
        return (!choice.unit || list(w.units).indexOf(choice.unit) >= 0) && (!/picture-reveal|memory/.test(choice.game) || w.image);
      });
      const unit = units.find(function (u) { return u.unit === choice.unit; });
      const el = h("div", { class: "cg-game cg-" + choice.game, "data-prevent-swipe": true });
      stage.textContent = "";
      stage.append(el);
      fit(el, choice.game);
      if (!pool.length) { el.textContent = "No words for this unit yet."; reset = null; return; }
      reset = GAMES[choice.game](el, { words: pool, all: words, random: true, rows: 4, teams: 2, seconds: 10, tiles: 16,
        count: /match|memory/.test(choice.game) ? 6 : choice.game === "blitz" ? undefined : 5,
        units: units, unit: choice.unit,
        title: (unit ? unit.title : "Vocab") + ({ bingo: "", blitz: " Word Blitz" }[choice.game] || " quick-fire") });
    }
    play();
    return function () { play(); };   // "Reset for the next class": the same game and unit, from the start
  }

  /* ---------------- Start every game on the page ---------------- */

  // On a web page (not slides), a game without its own phone layout is drawn at slide size
  // (1050 pixels wide) and scaled down to fit the page. Word Blitz lays itself out for any width.
  const FITS_ITSELF = { blitz: true, picker: true };
  function fit(el, kind) {
    if (el.closest(".reveal") || FITS_ITSELF[kind] || !window.ResizeObserver) return;
    const inner = h("div", { class: "cg-fit-inner" }), box = h("div", { class: "cg-fit" });
    el.replaceWith(box);
    box.append(inner);
    inner.append(el);
    function size() {
      const scale = Math.min(1, box.clientWidth / 1050);
      inner.style.transform = "scale(" + scale + ")";
      box.style.height = Math.ceil(inner.offsetHeight * scale) + "px";
    }
    const watch = new ResizeObserver(size);
    watch.observe(box);
    watch.observe(inner);
  }

  const GAMES = { "snowman": snowman, "picture-reveal": pictureReveal, "jeopardy": jeopardy, "trivia": trivia,
    "matching": matching, "memory": memory, "scramble": scramble, "sort": sortIt, "bingo": bingo, "blitz": wordBlitz,
    "picker": gamePicker };
  // A calm look: buttons are plain words. Take off a leading emoji ("🔀 New word" -> "New word"),
  // also on buttons a game adds later (the clue card, the end of a quick-fire).
  function calm(root) {
    function plain() {
      root.querySelectorAll("button").forEach(function (b) {
        const first = b.firstChild;
        if (first && first.nodeType === 3 && /^[\p{Extended_Pictographic}\uFE0F\u200D]/u.test(first.textContent)) {
          const text = first.textContent.replace(/^[\p{Extended_Pictographic}\uFE0F\u200D]+\s*/u, "");
          first.textContent = text || "New board";   // a button that was only an emoji (Jeopardy's 🔀)
        }
      });
    }
    root.classList.add("cg-plain");
    plain();
    new MutationObserver(plain).observe(root, { childList: true, subtree: true });
  }

  // Other files add games too (timeline.js: timelines and Label it), with these helpers.
  window.ChalklineGames = {
    h: h, list: list, shuffle: shuffle, button: button, beep: beep, cheer: cheer, COLORS: COLORS,
    keyHandlers: keyHandlers, onCurrentSlide: onCurrentSlide,
    add: function (name, fn) { GAMES[name] = fn; },
  };

  // Start the games once every game file has loaded (they all load at the end of the page).
  const resets = [];
  function startAll() {
    document.querySelectorAll(".cg-game").forEach(function (el) {
      let cfg = {};
      try { cfg = JSON.parse(el.dataset.config || "{}"); } catch (e) { /* leave it empty */ }
      if (GAMES[el.dataset.game]) {
        fit(el, el.dataset.game);
        resets.push(GAMES[el.dataset.game](el, cfg));
        calm(el);
      }
    });
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", startAll);
  else setTimeout(startAll, 0);
  // The toolbox's "Reset for the next class" starts every game in the deck again.
  document.addEventListener("chalkline:reset", function (e) {
    if (e.detail && e.detail.games) resets.forEach(function (r) { if (r) r(); });
  });
})();
