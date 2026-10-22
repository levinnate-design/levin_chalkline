// The Odyssey story map: Odysseus's ten-year journey home from Troy, stop by stop.
// Next / Back step through it, Play sails the whole route, and hovering (or tapping) a stop shows
// its story in the strip above the map. Written with an AI assistant from a one-paragraph request. A story map, not real
// geography: the places in Homer's poem are legendary.
// In a slide PDF (?print-pdf) it shows the whole route at once.
(function () {
  const STOPS = [
    { x: 705, y: 112, lx: 705, ly: 145, name: "Troy", zh: "特洛伊", text: "The ten-year Trojan War is over. Odysseus sets sail for home with twelve ships." },
    { x: 392, y: 352, lx: 325, ly: 375, name: "The Cyclops", zh: "独眼巨人", text: "A one-eyed giant traps the men in his cave. Odysseus says his name is \"Nobody\" and they escape." },
    { x: 410, y: 292, lx: 352, ly: 298, name: "Aeolus", zh: "风神", text: "The god of winds gives Odysseus a bag of storm winds. The crew opens it, and they are blown back." },
    { x: 300, y: 158, lx: 300, ly: 190, name: "Circe", zh: "喀耳刻", text: "A witch turns the crew into pigs. Odysseus makes her change them back, and they stay a year." },
    { x: 95, y: 210, lx: 98, ly: 242, name: "The Underworld", zh: "冥界", text: "At the edge of the world, Odysseus speaks with the dead. A prophet tells him how to get home." },
    { x: 352, y: 220, lx: 352, ly: 252, name: "The Sirens", zh: "塞壬", text: "Their song pulls sailors onto the rocks. Odysseus is tied to the mast; his crew blocks their ears with wax." },
    { x: 452, y: 318, lx: 535, ly: 345, name: "Scylla and Charybdis", zh: "斯库拉与卡律布狄斯", text: "A six-headed monster on one side, a giant whirlpool on the other. He sails past Scylla and loses six men." },
    { x: 200, y: 388, lx: 200, ly: 366, name: "Calypso", zh: "卡吕普索", text: "After a shipwreck, only Odysseus is left. The nymph Calypso keeps him on her island for seven years." },
    { x: 545, y: 150, lx: 478, ly: 148, name: "The Phaeacians", zh: "费阿刻斯人", text: "Odysseus tells the king his whole story. The Phaeacians sail him home in a single night." },
    { x: 562, y: 196, lx: 562, ly: 228, name: "Ithaca", zh: "伊萨卡", text: "Home after ten years! Disguised as a beggar, Odysseus defeats the men trying to take his place." },
  ];
  const NS = "http://www.w3.org/2000/svg";
  const el = (tag, attrs, parent) => {
    const e = document.createElementNS(NS, tag);
    for (const [k, v] of Object.entries(attrs || {})) e.setAttribute(k, v);
    if (parent) parent.appendChild(e);
    return e;
  };

  function build(root) {
    const svg = el("svg", { viewBox: "0 0 800 450", role: "img", "aria-label": "Story map of Odysseus's journey" }, root);
    el("rect", { class: "sea", width: 800, height: 450 }, svg);
    // Very rough coastlines, for a sense of place only.
    [
      "M245,0 L335,0 L352,95 L398,165 L445,215 L478,258 L455,283 L420,262 L392,232 L344,182 L300,120 L262,62 Z", // Italy
      "M462,250 L492,262 L470,282 Z",                                                                   // Italy's heel
      "M372,330 L452,326 L418,374 Z",                                                                   // Sicily
      "M528,128 L572,120 L604,150 L612,214 L640,286 L612,330 L584,300 L566,252 L540,208 L522,166 Z",     // Greece
      "M672,52 L800,40 L800,214 L716,226 L684,168 L668,104 Z",                                          // Asia Minor
      "M0,430 Q200,405 420,420 T800,415 L800,450 L0,450 Z",                                             // Africa
      "M0,120 L60,105 L70,250 L0,268 Z",                                                                // the far west
    ].forEach(d => el("path", { class: "land", d: d }, svg));
    const note = el("text", { class: "ody-note", x: 16, y: 26 }, svg);
    note.textContent = "Story map: places from Homer's poem, not to scale";

    const routeLayer = el("g", {}, svg);
    const segments = STOPS.slice(1).map((s, i) => {
      const a = STOPS[i], mx = (a.x + s.x) / 2, my = (a.y + s.y) / 2;
      const bend = (i % 2 ? 1 : -1) * 40;   // gentle curves, alternating sides
      const d = `M${a.x},${a.y} Q${mx + bend},${my - bend} ${s.x},${s.y}`;
      const p = el("path", { class: "route", d: d }, routeLayer);
      const len = p.getTotalLength();
      p.style.strokeDasharray = `${len}`;
      p.style.strokeDashoffset = `${len}`;
      return { path: p, len: len };
    });

    const stopEls = STOPS.map((s, i) => {
      const g = el("g", { class: "stop", tabindex: 0 }, svg);
      el("circle", { cx: s.x, cy: s.y, r: 12 }, g);
      el("text", { x: s.x, y: s.y + 5 }, g).textContent = i + 1;
      const label = el("text", { class: "ody-label", x: s.lx, y: s.ly }, g);
      label.textContent = s.name;
      return g;
    });
    const ship = el("text", { class: "ship", x: STOPS[0].x - 15, y: STOPS[0].y + 10 }, svg);
    ship.textContent = "⛵";

    const card = document.createElement("div");   // the story strip, above the map
    card.className = "ody-card";
    root.insertBefore(card, svg);
    const controls = document.createElement("div");
    controls.className = "ody-controls";
    controls.innerHTML = '<button data-a="back">◀ Back</button><button class="primary" data-a="next">Next ▶</button>' +
      '<button data-a="play">▶ Play the journey</button><button data-a="reset">↺ Start over</button><span class="ody-status"></span>';
    root.appendChild(controls);
    const status = controls.querySelector(".ody-status");

    let at = 0, busy = false, playing = false;

    function showCard(i) {
      const s = STOPS[i];
      card.innerHTML = `<b>${i + 1}. ${s.name}</b><span class="zh">${s.zh}</span> · ${s.text}`;
    }
    function draw() {
      stopEls.forEach((g, i) => { g.classList.toggle("visited", i < at); g.classList.toggle("current", i === at); });
      segments.forEach((seg, i) => { if (i >= at) seg.path.style.strokeDashoffset = `${seg.len}`; });
      status.textContent = `Stop ${at + 1} of ${STOPS.length}`;
    }
    function placeShip(x, y) { ship.setAttribute("x", x - 15); ship.setAttribute("y", y + 10); }
    function sail(i, done) {   // animate segment i (from stop i to stop i+1)
      const seg = segments[i], t0 = performance.now(), dur = 1100;
      busy = true;
      (function frame(t) {
        const k = Math.min(1, (t - t0) / dur), e = k < 0.5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2;
        seg.path.style.strokeDashoffset = `${seg.len * (1 - e)}`;
        const pt = seg.path.getPointAtLength(seg.len * e);
        placeShip(pt.x, pt.y);
        if (k < 1) requestAnimationFrame(frame);
        else { busy = false; done(); }
      })(t0);
    }
    function next(after) {
      if (busy || at >= STOPS.length - 1) { playing = false; return; }
      sail(at, () => { at++; draw(); showCard(at); if (after) after(); });
    }
    function back() {
      if (busy || at === 0) return;
      at--; draw(); placeShip(STOPS[at].x, STOPS[at].y); showCard(at);
    }
    function reset() {
      if (busy) return;
      playing = false; at = 0; draw(); placeShip(STOPS[0].x, STOPS[0].y); showCard(0);
    }
    function play() {
      if (busy) return;
      if (at >= STOPS.length - 1) reset();
      playing = true;
      (function step() { if (playing) setTimeout(() => next(step), 900); })();
    }
    controls.addEventListener("click", e => {
      const a = e.target.dataset.a;
      if (!a) return;
      e.stopPropagation();
      if (a !== "play") playing = false;
      ({ next: () => next(), back: back, play: play, reset: reset })[a]();
    });
    stopEls.forEach((g, i) => {
      g.addEventListener("mouseenter", () => showCard(i));
      g.addEventListener("focus", () => showCard(i));
      g.addEventListener("click", e => { e.stopPropagation(); showCard(i); });
      g.addEventListener("mouseleave", () => showCard(at));
    });

    if (/print-pdf/.test(location.search)) {   // slide PDF: the whole route at once
      at = STOPS.length - 1;
      segments.forEach(seg => (seg.path.style.strokeDashoffset = "0"));
      stopEls.forEach(g => g.classList.add("visited"));
      placeShip(STOPS[at].x, STOPS[at].y);
      controls.style.display = "none";
      card.innerHTML = "<b>Ten years, ten stops:</b> Troy, the Cyclops, Aeolus, Circe, the Underworld, the Sirens, " +
        "Scylla and Charybdis, Calypso, the Phaeacians, and home to Ithaca.";
      return;
    }
    draw(); showCard(0);
  }

  document.querySelectorAll(".odyssey").forEach(build);
})();
