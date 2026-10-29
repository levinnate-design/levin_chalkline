/*
  Timelines and Label it, for slides. These add three games to games.js (window.ChalklineGames):

  timeline           for teaching: a big card for one event above a timeline. ‹ › go through the
                     events in order; tap an event (or drag along the line) to jump to it; tap the
                     card to zoom in (the whole picture and everything written about it). An event
                     can link to its own slide (slide="..."): that slide gets a timeline strip at the
                     bottom (filter.lua adds it), and the zoomed card has "Go to this slide".
  timeline-activity  for students: the events without their dates. Drag each one onto the line at
                     its year (or tap it, then tap the line). Check marks each one, and the order.
  label-it           a picture with numbered dots and a bank of labels: drag (or tap, then tap) each
                     label onto its dot. Press L on the slide to find a dot's place (x,y) to write down.

  Settings come from filter.lua (::: {.timeline-interactive}, {.timeline-activity}, {.label-it}).
*/
(function () {
  const G = window.ChalklineGames;
  if (!G) return;
  const h = G.h, list = G.list, button = G.button, shuffle = G.shuffle, beep = G.beep, cheer = G.cheer;

  /* ---------------- Shared ---------------- */

  // "509 BC" → -509, "AD 117" → 117, "c. 9600 BC" → -9600, "1453" → 1453 (or the event's year=).
  function yearOf(e) {
    if (e.year !== undefined && e.year !== "" && !isNaN(+e.year)) return +e.year;
    const s = String(e.date || "").replace(/,/g, "");
    const m = s.match(/\d+(\.\d+)?/);
    if (!m) return 0;
    return /\bB\.?C\.?E?\b/i.test(s) ? -m[0] : +m[0];
  }
  function fmtYear(y, bc) {
    y = Math.round(y);
    if (y === 0 && bc) return "AD 1";   // there was no year 0: 1 BC was followed by AD 1
    return y < 0 ? -y + " BC" : bc ? "AD " + y : String(y);
  }
  function sorted(cfg) {
    return list(cfg.events).map(function (e, i) { return Object.assign({}, e, { y: yearOf(e), n: i }); })
      .sort(function (a, b) { return a.y - b.y; });
  }
  // Where each event sits on the line (0 to 1). By time, unless some are too close to read:
  // then evenly spaced (spacing="time" or "even" decides).
  function positions(events, spacing) {
    const min = events[0].y, span = (events[events.length - 1].y - min) || 1;
    let pos = events.map(function (e) { return (e.y - min) / span; });
    const tight = pos.some(function (p, i) { return i && p - pos[i - 1] < 0.07; });
    if (spacing === "even" || (spacing !== "time" && tight) || events.length < 2) {
      pos = events.map(function (_, i) { return events.length < 2 ? 0.5 : i / (events.length - 1); });
    }
    return pos.map(function (p) { return 0.05 + p * 0.9; });
  }
  function goToSlide(id) {
    const sec = id && document.getElementById(id);
    if (sec && window.Reveal) { const i = Reveal.getIndices(sec); Reveal.slide(i.h, i.v); }
  }
  // Drag with a mouse, a pen or a finger; a short tap stays a tap (a click).
  function draggable(el, on) {
    el.addEventListener("pointerdown", function (e) {
      if (e.button !== 0) return;
      e.preventDefault();   // no browser drag of a picture, which would take the pointer away (taps still click)
      const sx = e.clientX, sy = e.clientY;
      let moving = false;
      function move(ev) {
        if (!moving && Math.abs(ev.clientX - sx) + Math.abs(ev.clientY - sy) < 6) return;
        if (!moving) { moving = true; if (on.start) on.start(); }
        ev.preventDefault();
        on.move(ev.clientX, ev.clientY, ev.clientX - sx, ev.clientY - sy);
      }
      function up(ev) {
        window.removeEventListener("pointermove", move);
        window.removeEventListener("pointerup", up);
        window.removeEventListener("pointercancel", up);
        if (moving) {
          el.dataset.dragged = "1";   // the click that follows a drag is ignored
          setTimeout(function () { delete el.dataset.dragged; }, 50);
          on.end(ev.clientX, ev.clientY);
        }
      }
      window.addEventListener("pointermove", move, { passive: false });
      window.addEventListener("pointerup", up);
      window.addEventListener("pointercancel", up);
    });
  }
  function slideScale(el) { return el.getBoundingClientRect().width / (el.offsetWidth || 1) || 1; }

  /* ---------------- Timeline (teaching) ---------------- */

  function timeline(root, cfg) {
    const events = sorted(cfg);
    if (!events.length) { root.textContent = "No events."; return null; }
    const bc = events.some(function (e) { return e.y < 0; });
    const pos = positions(events, cfg.spacing);
    let cur = 0;
    const card = h("div", { class: "tl-card", title: "Tap to zoom in" });
    const axis = h("div", { class: "tl-axis" });
    const zoom = h("div", { class: "tl-zoom", hidden: true });
    root.append(
      h("div", { class: "tl-stage" },
        button("‹", function () { go(cur - 1); }, "tl-nav"), card, button("›", function () { go(cur + 1); }, "tl-nav")),
      axis, zoom);
    card.addEventListener("click", function (e) { if (!e.target.closest("button")) open(); });

    // The line: one marker per event; the line fills up to the current one. Drag along it to scrub.
    const fill = h("div", { class: "tl-fill" });
    axis.append(h("div", { class: "tl-line" }), fill);
    const markers = events.map(function (e, i) {
      const m = h("button", { class: "tl-marker", style: "left:" + pos[i] * 100 + "%", title: e.title,
        onclick: function () { if (axis.dataset.dragged) return; if (i === cur) open(); else go(i); } },
        h("span", { class: "tl-dot" }), h("span", { class: "tl-date", text: e.date }));
      axis.append(m);
      return m;
    });
    draggable(axis, {
      move: function (x) {
        const r = axis.getBoundingClientRect(), f = (x - r.left) / r.width;
        let best = 0;
        pos.forEach(function (p, i) { if (Math.abs(p - f) < Math.abs(pos[best] - f)) best = i; });
        if (best !== cur) go(best);
      },
      end: function () {},
    });

    function go(i) {
      cur = Math.max(0, Math.min(events.length - 1, i));
      const e = events[cur];
      card.textContent = "";
      card.append(
        e.image ? h("div", { class: "tl-photo" }, h("img", { src: e.image, alt: "" })) : "",
        h("div", { class: "tl-text" },
          h("div", { class: "tl-when", text: e.date }),
          h("div", { class: "tl-title", text: e.title }),
          e.summary ? h("p", { class: "tl-summary", text: e.summary }) : "",
          h("div", { class: "tl-more" }, h("span", { text: "Tap to zoom in" }),
            h("span", { class: "tl-count", text: cur + 1 + " of " + events.length }))));
      card.classList.toggle("tl-no-photo", !e.image);
      card.classList.remove("tl-in"); void card.offsetWidth; card.classList.add("tl-in");
      markers.forEach(function (m, k) { m.classList.toggle("tl-on", k === cur); m.classList.toggle("tl-past", k < cur); });
      fill.style.width = pos[cur] * 100 + "%";
      zoom.hidden = true;
    }
    // Zoom in: the picture big, and everything written about the event.
    function open() {
      const e = events[cur];
      zoom.textContent = "";
      const body = h("div", { class: "tl-zoom-body" });
      body.innerHTML = e.html || "";
      if (!body.textContent.trim() && e.summary) body.append(h("p", { text: e.summary }));
      zoom.append(
        e.image ? h("div", { class: "tl-zoom-photo" }, h("img", { src: e.image, alt: "" })) : "",
        h("div", { class: "tl-zoom-text" },
          h("div", { class: "tl-when", text: e.date }),
          h("div", { class: "tl-title", text: e.title }),
          body,
          h("div", { class: "cg-tools cg-tools-left" },
            e.slide && document.getElementById(e.slide) ? button("Go to this slide", function () { goToSlide(e.slide); }, "cg-primary") : "",
            button("Back to the timeline", function () { zoom.hidden = true; }))));
      zoom.classList.toggle("tl-no-photo", !e.image);
      zoom.hidden = false;
    }
    // A strip on another slide can ask for an event: "Back to the timeline".
    document.addEventListener("chalkline:timeline", function (ev) {
      if (ev.detail.id !== cfg.id) return;
      go(ev.detail.index);
      goToSlide(root.closest("section") && root.closest("section").id);
    });
    go(0);
    return function () { go(0); };
  }

  // The strip at the bottom of a slide that an event links to: where this slide is on the timeline.
  // Tap another event for its card, then go to its slide, or back to the timeline.
  function strips() {
    const configs = {};
    document.querySelectorAll('.cg-game[data-game="timeline"]').forEach(function (el) {
      try { const c = JSON.parse(el.dataset.config); configs[c.id] = { cfg: c, home: el.closest("section") }; } catch (e) { /* skip */ }
    });
    document.querySelectorAll(".cg-strip").forEach(function (strip) {
      const t = configs[strip.dataset.timeline];
      if (!t) return;
      strip.classList.add("cg-plain");   // the calm button style, like the games
      const events = sorted(t.cfg), pos = positions(events, t.cfg.spacing);
      const here = events.findIndex(function (e) { return e.n === +strip.dataset.event; });
      const pop = h("div", { class: "tl-pop", hidden: true });
      const line = h("div", { class: "tl-strip-line" }, h("div", { class: "tl-fill", style: "width:" + pos[here] * 100 + "%" }));
      strip.append(line, pop);
      if (t.cfg.title) strip.prepend(h("button", { class: "tl-strip-title", text: t.cfg.title, title: "Back to the timeline",
        onclick: function () { home(here); } }));
      events.forEach(function (e, i) {
        line.append(h("button", { class: "tl-marker" + (i === here ? " tl-on" : i < here ? " tl-past" : ""), style: "left:" + pos[i] * 100 + "%",
          title: e.date + " · " + e.title, onclick: function (ev) { ev.stopPropagation(); show(i); } },
          h("span", { class: "tl-dot" }), h("span", { class: "tl-date", text: i === here ? e.date + " · " + e.title : e.date })));
      });
      function home(i) { document.dispatchEvent(new CustomEvent("chalkline:timeline", { detail: { id: t.cfg.id, index: i } })); }
      function show(i) {
        const e = events[i];
        pop.textContent = "";
        pop.append(
          e.image ? h("img", { src: e.image, alt: "" }) : "",
          h("div", null,
            h("div", { class: "tl-when", text: e.date }),
            h("div", { class: "tl-title", text: e.title }),
            e.summary ? h("p", { text: e.summary }) : "",
            h("div", { class: "cg-tools cg-tools-left" },
              e.slide && i !== here && document.getElementById(e.slide) ? button("Go to this slide", function () { pop.hidden = true; goToSlide(e.slide); }, "cg-primary") : "",
              button("The timeline", function () { pop.hidden = true; home(i); }),
              button("Close", function () { pop.hidden = true; }))));
        pop.style.left = Math.min(Math.max(pos[i] * 100, 18), 82) + "%";
        pop.hidden = false;
      }
      document.addEventListener("pointerdown", function (ev) { if (!strip.contains(ev.target)) pop.hidden = true; });
      // Keep the strip at the bottom of the slide, wherever the slide's content ends.
      function place() {
        const sec = strip.closest("section");
        if (!sec || !window.Reveal) return;
        strip.style.top = (Reveal.getConfig().height - sec.offsetTop - strip.offsetHeight - 10) + "px";
      }
      if (window.Reveal) { Reveal.on("slidechanged", place); Reveal.on("ready", place); Reveal.on("resize", place); }
      setTimeout(place, 0);
    });
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", strips);
  else setTimeout(strips, 0);

  /* ---------------- Timeline activity (students) ---------------- */

  function niceStep(span) {   // a round step for the year marks: 1, 2, 5, 10, 20, 50 …
    const raw = span / 8, p = Math.pow(10, Math.floor(Math.log10(raw)));
    return [1, 2, 5, 10].map(function (k) { return k * p; }).find(function (s) { return s >= raw; }) || p * 10;
  }

  function timelineActivity(root, cfg) {
    const events = sorted(cfg);
    if (!events.length) { root.textContent = "No events."; return null; }
    const bc = events.some(function (e) { return e.y < 0; });
    const lo0 = events[0].y, hi0 = events[events.length - 1].y, span0 = (hi0 - lo0) || 100;
    const lo = cfg.start ? yearOf({ date: cfg.start }) : lo0 - span0 * 0.12;
    const hi = cfg.end ? yearOf({ date: cfg.end }) : hi0 + span0 * 0.12;
    const step = niceStep(hi - lo);
    const snap = cfg.snap || Math.max(1, step / 5);
    const tolerance = cfg.tolerance || Math.max(snap, Math.round((hi0 - lo0) * 0.05));
    let items, sel;
    const bank = h("div", { class: "tl-bank" });
    const lane = h("div", { class: "tl-lane" });
    const track = h("div", { class: "tl-track", title: "Tap to place the chosen event here" });
    const status = h("div", { class: "cg-status" });
    root.append(bank, h("div", { class: "tl-board" }, lane, track), status,
      h("div", { class: "cg-tools" }, button("Check", check, "cg-primary"), button("Show the answers", showAll), button("Start again", start)));
    const at = function (y) { return (y - lo) / (hi - lo); };
    const yearAt = function (x) {
      const r = track.getBoundingClientRect();
      const y = lo + Math.max(0, Math.min(1, (x - r.left) / r.width)) * (hi - lo);
      return Math.round(y / snap) * snap;
    };
    // The marks under the line
    for (let y = Math.ceil(lo / step) * step; y <= hi; y += step) {
      track.append(h("span", { class: "tl-tick", style: "left:" + at(y) * 100 + "%" }, h("span", { text: fmtYear(y, bc) })));
    }
    track.addEventListener("click", function (e) { if (sel) { sel.y = yearAt(e.clientX); sel.mark = ""; sel = null; paint(); } });

    function start() {
      items = shuffle(events).map(function (e) { return { e: e, y: null, mark: "" }; });
      sel = null;
      paint();
    }
    function cardFor(it) {
      const el = h("button", { class: "tl-item" + (it === sel ? " cg-selected" : "") + (it.mark ? " cg-" + it.mark : ""),
        onclick: function () { if (el.dataset.dragged) return; sel = sel === it ? null : it; paint(); } },
        it.e.image ? h("img", { src: it.e.image, alt: "" }) : "",
        h("span", { class: "tl-item-title", text: it.e.title }),
        it.y !== null ? h("span", { class: "tl-item-year", text: (it.mark === "no" ? "✗ " : "") + fmtYear(it.y, bc) }) : "",
        it.mark === "no" ? h("span", { class: "tl-item-answer", text: "✓ " + it.e.date }) : "");
      draggable(el, {
        start: function () { sel = null; el.classList.add("tl-dragging"); },
        move: function (x) { it.y = yearAt(x); it.mark = ""; paintLane(); },
        end: function () { paint(); },
      });
      return el;
    }
    function paint() {
      bank.textContent = "";
      const left = items.filter(function (it) { return it.y === null; });
      if (!left.length) bank.append(h("span", { class: "cg-sort-empty", text: "All placed. Press Check, or drag them again." }));
      left.forEach(function (it) { bank.append(cardFor(it)); });
      paintLane();
      if (!status.dataset.keep) {
        status.textContent = sel ? "Now tap the timeline where “" + sel.e.title + "” goes (or drag it there)."
          : "Placed: " + (items.length - left.length) + " of " + items.length + ". Drag each event to its year.";
      }
      delete status.dataset.keep;
    }
    // Placed events sit above the line, at their year, in up to four rows so they don't cover each other.
    function paintLane() {
      lane.textContent = "";
      const rows = [[], [], [], []];
      const room = 128 / (track.offsetWidth || 900);   // a placed card's width, as a share of the line
      items.filter(function (it) { return it.y !== null; }).sort(function (a, b) { return a.y - b.y; }).forEach(function (it) {
        const f = at(it.y);
        let r = rows.findIndex(function (row) { return row.every(function (g) { return Math.abs(g - f) > room; }); });
        if (r < 0) r = rows.reduce(function (best, row, k) { return row.length < rows[best].length ? k : best; }, 0);
        rows[r].push(f);
        if (it.mark === "no") lane.append(h("span", { class: "tl-ghost", style: "left:" + at(it.e.y) * 100 + "%" }));
        const el = cardFor(it);
        el.classList.add("tl-placed");
        el.style.left = f * 100 + "%";
        el.style.bottom = r * 56 + "px";
        el.style.setProperty("--stem", r * 56 + 8 + "px");
        lane.append(el);
      });
    }
    function check() {
      const placed = items.filter(function (it) { return it.y !== null; });
      let right = 0;
      placed.forEach(function (it) { it.mark = Math.abs(it.y - it.e.y) <= tolerance ? "ok" : "no"; if (it.mark === "ok") right++; });
      const byPlace = placed.slice().sort(function (a, b) { return a.y - b.y; });
      const inOrder = byPlace.every(function (it, i) { return !i || byPlace[i - 1].e.y <= it.e.y; });
      const all = right === items.length;
      status.dataset.keep = "1";
      status.textContent = all ? "All in the right place! ✓"
        : right + " of " + items.length + " at the right time" + (placed.length > 1 ? " · the order is " + (inOrder ? "right ✓" : "not right yet") : "") +
          (placed.length < items.length ? " · " + (items.length - placed.length) + " still to place" : "") + ".";
      if (all) cheer(); else beep(330, 0.2, 0.1);
      paint();
    }
    function showAll() { items.forEach(function (it) { it.y = it.e.y; it.mark = "ok"; }); sel = null; paint(); }
    start();
    return start;
  }

  /* ---------------- Label it ---------------- */

  function labelIt(root, cfg) {
    const labels = list(cfg.labels).map(function (l, i) { return Object.assign({}, l, { i: i }); });
    let chips, sel, mistakes;
    const img = h("img", { class: "li-img", src: cfg.image, alt: "" });
    const figure = h("div", { class: "li-figure" }, img);
    const bank = h("div", { class: "li-bank" });
    const why = h("div", { class: "cg-sort-why", hidden: true });
    const status = h("div", { class: "cg-status" });
    const where = h("div", { class: "li-where", hidden: true });
    root.append(h("div", { class: "li-wrap" }, figure, h("div", { class: "li-side" }, bank, why, status,
      h("div", { class: "cg-tools cg-tools-left" }, button("Show the answers", showAll), button("Start again", start)), where)));

    // A wide picture (a panorama) uses the whole width, with the labels in a row under it.
    img.addEventListener("load", function () { root.classList.toggle("li-wide", img.naturalWidth / img.naturalHeight > 1.6); });
    if (img.complete && img.naturalWidth) root.classList.toggle("li-wide", img.naturalWidth / img.naturalHeight > 1.6);

    const dots = labels.map(function (l) {
      const d = h("button", { class: "li-dot", style: "left:" + l.x + "%;top:" + l.y + "%", text: l.i + 1, "aria-label": "Place " + (l.i + 1),
        onclick: function (e) { e.stopPropagation(); drop(l.i); } });
      figure.append(d);
      return d;
    });

    function start() {
      chips = shuffle(labels).map(function (l) { return { l: l, on: false }; });
      sel = null; mistakes = 0; why.hidden = true;
      figure.querySelectorAll(".li-tag").forEach(function (t) { t.remove(); });
      dots.forEach(function (d) { d.classList.remove("li-done"); });
      paint();
    }
    function paint() {
      bank.textContent = "";
      const left = chips.filter(function (c) { return !c.on; });
      left.forEach(function (c) {
        const el = h("button", { class: "cg-sort-chip" + (c === sel ? " cg-selected" : ""), text: c.l.text,
          onclick: function () { if (el.dataset.dragged) return; sel = sel === c ? null : c; paint(); } });
        let dx = 0, dy = 0;
        draggable(el, {
          start: function () { sel = c; el.classList.add("li-dragging"); },
          move: function (x, y, mx, my) { const s = slideScale(el); dx = mx / s; dy = my / s; el.style.transform = "translate(" + dx + "px," + dy + "px)"; },
          end: function (x, y) {
            el.style.transform = "";
            // the nearest dot to where it was let go (close enough)
            let best = -1, bestD = 1e9;
            dots.forEach(function (d, i) {
              const r = d.getBoundingClientRect(), cx = r.left + r.width / 2, cy = r.top + r.height / 2;
              const dist = Math.hypot(cx - x, cy - y);
              if (dist < bestD) { bestD = dist; best = i; }
            });
            if (best >= 0 && bestD < 60 * slideScale(figure)) drop(best); else { sel = null; paint(); }
          },
        });
        bank.append(el);
      });
      status.textContent = sel ? "Now tap the dot for “" + sel.l.text + "”." :
        "Labelled: " + (chips.length - left.length) + " of " + chips.length + (mistakes ? "  ·  Mistakes: " + mistakes : "");
    }
    function drop(i) {
      if (!sel) return;
      const c = sel;
      sel = null;
      if (c.l.i === i) {
        c.on = true;
        why.hidden = true;
        dots[i].classList.add("li-done");
        const right = c.l.x > 62;   // the tag goes on the side with room
        figure.append(h("span", { class: "li-tag" + (right ? " li-left" : ""), style: "left:" + c.l.x + "%;top:" + c.l.y + "%", text: c.l.text }));
        beep(660, 0.12, 0.1);
        paint();
        if (chips.every(function (x) { return x.on; })) { status.textContent = "All labelled! ✓" + (mistakes ? "  (" + mistakes + (mistakes === 1 ? " mistake)" : " mistakes)") : ""); cheer(); }
        return;
      }
      mistakes++;
      why.textContent = "";
      why.append(h("b", { text: "✗ “" + c.l.text + "” doesn't go at " + (i + 1) + "." }), h("span", { text: " " + (c.l.why || "Try another place.") }));
      why.hidden = false;
      dots[i].classList.remove("li-wrong"); void dots[i].offsetWidth; dots[i].classList.add("li-wrong");
      beep(220, 0.2, 0.1);
      paint();
    }
    function showAll() { chips.forEach(function (c) { if (!c.on) { sel = c; drop(c.l.i); } }); }

    // L: find places. Tap the picture to see where you tapped, as "x,y" to write after a label.
    let finding = false;
    G.keyHandlers.push({ el: root, fn: function (e) {
      if (e.key !== "l" && e.key !== "L") return false;
      finding = !finding;
      root.classList.toggle("li-finding", finding);
      where.hidden = !finding;
      where.textContent = finding ? "Finding places: tap the picture. (Press L again to stop.)" : "";
      return true;
    } });
    figure.addEventListener("click", function (e) {
      if (!finding || e.target.closest(".li-dot")) return;
      const r = img.getBoundingClientRect();
      const x = Math.round((e.clientX - r.left) / r.width * 100), y = Math.round((e.clientY - r.top) / r.height * 100);
      where.textContent = "This place: " + x + "," + y + "   (write: - Label | " + x + "," + y + ")";
      try { navigator.clipboard.writeText(x + "," + y); } catch (err) { /* no clipboard */ }
      figure.querySelectorAll(".li-mark").forEach(function (m) { m.remove(); });
      figure.append(h("span", { class: "li-mark", style: "left:" + x + "%;top:" + y + "%" }));
    });
    start();
    return start;
  }

  G.draggable = draggable;   // activities.js uses these too
  G.slideScale = slideScale;
  G.add("timeline", timeline);
  G.add("timeline-activity", timelineActivity);
  G.add("label-it", labelIt);
})();
