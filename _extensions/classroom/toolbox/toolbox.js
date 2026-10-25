/*
  Classroom tools for reveal.js slides: a toolbox button in the bottom-left corner (or press W)
  opens a menu of tools. Each tool floats on top of the slides, not on one slide, so it stays where
  you put it while you change slides.

  This file is the frame: the panels (drag, resize, ×), the menu, and remembering which tools are
  open and where. The tools themselves are web components, one file each, in tools/ (see kit.js):

    People      picker.js (Name picker), groups.js (Groups), scoreboard.js; classes.js is their class lists
    Attention   voice.js (Voice level and the noise meter), traffic.js (Traffic light), spotlight.js
    Time        clock.js (open unless you close it; K shows and hides it), stopwatch.js
    This unit   vocab.js, packet.js, qr.js (QR code for this deck on the student site)
    More        music.js (YouTube), dice.js, slide.js (Slide size)

  Vocab and Packet are sidebars instead (dock in their file): the screen's full height, at its
  right and left edge, and the slides move over to make room. V and P open and close them.

  A tool has no title bar: the tool is the message. Point at it for × on its corner. Drag a tool by
  any empty part of it; drag the corner to make it bigger (everything inside grows). Which tools are
  open, where they are, the scores and the other settings are remembered in this browser, so they
  come back in the next slide deck. Nothing is sent anywhere. Class lists too: they stay in this
  browser, never in the course files or on the website.
*/
(function () {
  // Speaker view previews, the slide PDF export and pop-ups get no tools (kit.js says which)
  if (!window.ChalklineToolbox.active) return;

  const PREFIX = "chalkline-tools:";

  // The shared kit (kit.js), and the tools: each in its own file in tools/, a web component
  const { load, save, h, icon } = window.ChalklineToolbox;
  const TOOLS = window.ChalklineToolbox.tools;

  /* ---------------- Panels ---------------- */

  const layer = h("div", { id: "ct-layer" });
  document.body.append(layer);
  let zTop = 1;
  const open = {};   // tool id -> { panel, api }
  const layout = load("layout", { open: [], pos: {} });

  function saveLayout() {
    layout.open = Object.keys(open);
    save("layout", layout);
  }

  function clampPos(p, tool) {
    const W = window.innerWidth, H = window.innerHeight;
    p.w = Math.max(tool.minW, Math.min(p.w, W - 8));
    p.h = Math.max(tool.minH, Math.min(p.h, H - 8));
    p.x = Math.max(4 - p.w + 120, Math.min(p.x, W - 120));   // keep part of the title bar reachable
    p.y = Math.max(4, Math.min(p.y, H - 48));
    return p;
  }
  function place(panel, p) {
    panel.style.left = p.x + "px"; panel.style.top = p.y + "px";
    panel.style.width = p.w + "px"; panel.style.height = p.h + "px";
  }

  // Move a panel by dragging any empty part of it (not a button, field or list that scrolls);
  // the drag starts after a few pixels, so taps still work. Resize it with the corner grip.
  const NO_DRAG = "button, input, select, textarea, label, a, .ct-nodrag, .ct-grip";
  function fromControl(e) {   // the path, not just the target: inside a tool's web component too
    return e.composedPath().some(function (n) { return n.nodeType === 1 && n.matches(NO_DRAG); });
  }
  function dragger(panel, id, handle, resize) {
    handle.addEventListener("pointerdown", function (e) {
      if (e.button !== 0 || (!resize && fromControl(e))) return;
      e.preventDefault();
      const p = layout.pos[id], sx = e.clientX, sy = e.clientY, start = Object.assign({}, p);
      let dragging = resize;
      function move(ev) {
        if (!dragging) {
          if (Math.abs(ev.clientX - sx) + Math.abs(ev.clientY - sy) < 6) return;
          dragging = true;
          panel.classList.add("ct-dragging");
        }
        if (resize) {   // the corner stays on the screen
          p.w = Math.min(start.w + ev.clientX - sx, window.innerWidth - p.x - 4);
          p.h = Math.min(start.h + ev.clientY - sy, window.innerHeight - p.y - 4);
        }
        else { p.x = start.x + ev.clientX - sx; p.y = start.y + ev.clientY - sy; }
        place(panel, clampPos(p, TOOLS[id]));
      }
      function up() {
        window.removeEventListener("pointermove", move);
        window.removeEventListener("pointerup", up);
        window.removeEventListener("pointercancel", up);
        panel.classList.remove("ct-dragging");
        if (dragging) { delete p.auto; saveLayout(); }   // moved or resized on purpose: it stays that way
      }
      window.addEventListener("pointermove", move);
      window.addEventListener("pointerup", up);
      window.addEventListener("pointercancel", up);
    });
  }

  /* ---------------- Sidebars ----------------
     A tool with dock: "left" or "right" (Packet, Vocab) is a sidebar the screen's full height,
     not a floating panel. The slides move over to make room, and their logo, buttons and slide
     number move with them, so the sidebar covers nothing. Drag its inner edge to make it wider.
     One sidebar on each side. */
  const docked = { left: null, right: null };   // side -> tool id
  const root = document.documentElement;
  function dockWidth(tool, w) {
    return Math.round(Math.max(tool.minW, Math.min(w || tool.w, tool.maxW || 460, window.innerWidth * 0.4)));
  }
  // Make room for the sidebars: toolbox.css moves the slides (.reveal) and the buttons around them
  // by --ct-dock-left and --ct-dock-right. reveal.js only sizes the slide when the window changes,
  // so it's asked again on every frame while the room opens or closes (and while an edge is dragged).
  let settle = 0;
  function makeRoom(instant) {
    ["left", "right"].forEach(function (side) {
      const id = docked[side];
      root.style.setProperty("--ct-dock-" + side, id ? layout.pos[id].w + "px" : "0px");
    });
    root.classList.toggle("ct-docked", !!(docked.left || docked.right));
    root.classList.toggle("ct-dock-instant", !!instant);
    if (!window.Reveal || !Reveal.isReady()) return;
    const until = performance.now() + (instant ? 0 : 260);   // the transition in toolbox.css is 0.22s
    cancelAnimationFrame(settle);
    (function frame() {
      Reveal.layout();
      if (performance.now() < until) settle = requestAnimationFrame(frame);
      else reseatClock();
    })();
  }
  function placeDock(panel, id) {
    const tool = TOOLS[id], p = layout.pos[id];
    p.w = dockWidth(tool, p.w);
    panel.style.cssText = "top:0;bottom:0;width:" + p.w + "px;" + tool.dock + ":0;z-index:" + panel.style.zIndex;
  }
  function edgeDragger(panel, id, edge) {
    const tool = TOOLS[id];
    edge.addEventListener("pointerdown", function (e) {
      if (e.button !== 0) return;
      e.preventDefault();
      panel.classList.add("ct-dragging");
      function move(ev) {
        layout.pos[id].w = tool.dock === "right" ? window.innerWidth - ev.clientX : ev.clientX;
        placeDock(panel, id);
        makeRoom(true);
      }
      function up() {
        window.removeEventListener("pointermove", move);
        window.removeEventListener("pointerup", up);
        window.removeEventListener("pointercancel", up);
        panel.classList.remove("ct-dragging");
        root.classList.remove("ct-dock-instant");
        saveLayout();
      }
      window.addEventListener("pointermove", move);
      window.addEventListener("pointerup", up);
      window.addEventListener("pointercancel", up);
    });
  }
  window.addEventListener("resize", function () {   // a sidebar is at most 40% of the screen
    ["left", "right"].forEach(function (side) { if (docked[side]) placeDock(open[docked[side]].panel, docked[side]); });
    if (docked.left || docked.right) makeRoom(true);
  });

  function openTool(id) {
    const tool = TOOLS[id];
    if (!tool) return;
    if (open[id]) { open[id].panel.style.zIndex = ++zTop; return; }
    if (tool.dock) return openDock(id);
    const n = Object.keys(open).length;
    const saved = layout.pos[id];
    if (tool.start && (!saved || saved.auto || (tool.oldDefault && tool.oldDefault(saved)))) {
      layout.pos[id] = Object.assign({ w: tool.w, h: tool.h }, tool.start(), { auto: true });   // until it's dragged (start may size it too)
    }
    const p = layout.pos[id] || (layout.pos[id] = { x: 80 + 36 * n, y: 70 + 36 * n, w: tool.w, h: tool.h });
    const close = h("button", { class: "ct-ctrl ct-close", "aria-label": "Close " + tool.title, title: "Close", onclick: function () { closeTool(id); } }, icon("x"));
    const body = h("div", { class: "ct-body ct-" + id });
    const grip = h("div", { class: "ct-grip", title: "Drag to resize" });
    // No title bar: the tool is the message. × (and a tool's own extras) show when you point at it.
    // A free tool draws its own card (the traffic light's case), so it has no white card around it.
    const panel = h("div", { class: "ct-panel" + (tool.free ? " ct-free" : ""), role: "dialog", "aria-label": tool.title },
      body, h("div", { class: "ct-ctrls" }, close), grip);
    panel.addEventListener("pointerdown", function () { panel.style.zIndex = ++zTop; });
    place(panel, clampPos(p, tool));
    panel.style.zIndex = ++zTop;
    layer.append(panel);
    dragger(panel, id, panel, false);
    dragger(panel, id, grip, true);
    function grow(dh) {   // a tool that shows more (the noise meter) makes its panel taller, or shorter again
      p.h = Math.max(tool.minH, p.h + dh);
      place(panel, clampPos(p, tool));
      saveLayout();
    }
    // The tool's web component fills the panel; it can reach its panel, and grow it
    const el = document.createElement(tool.element);
    el.panel = panel;
    el.grow = grow;
    body.append(el);
    open[id] = { panel: panel, api: el };
    if (id === "clock") save("clock-off", false);
    saveLayout();
    paintMenu();
  }

  function openDock(id) {
    const tool = TOOLS[id], side = tool.dock;
    if (docked[side]) closeTool(docked[side]);   // one sidebar on each side
    const p = layout.pos[id] || (layout.pos[id] = {});
    // A floating panel from before, or a sidebar sized when the default was different: start fresh
    if (p.dock !== tool.w) { p.dock = tool.w; p.w = tool.w; }
    const close = h("button", { class: "ct-ctrl ct-close", "aria-label": "Close " + tool.title,
      title: "Close" + (tool.key ? " (" + tool.key.key + ")" : ""), onclick: function () { closeTool(id); } }, icon("x"));
    const body = h("div", { class: "ct-body ct-" + id });
    const edge = h("div", { class: "ct-edge", title: "Drag to make it wider" });
    const panel = h("div", { class: "ct-panel ct-dock ct-dock-" + side, role: "complementary", "aria-label": tool.title },
      body, h("div", { class: "ct-ctrls" }, close), edge);
    panel.style.zIndex = ++zTop;
    placeDock(panel, id);
    layer.append(panel);
    edgeDragger(panel, id, edge);
    const el = document.createElement(tool.element);
    el.panel = panel;
    el.grow = function () {};
    body.append(el);
    open[id] = { panel: panel, api: el };
    docked[side] = id;
    makeRoom();
    saveLayout();
    paintMenu();
  }

  function closeTool(id, keep) {   // keep: the clock closes for this deck only
    const o = open[id];
    if (!o) return;
    o.api.close();
    o.panel.remove();
    delete open[id];
    const side = TOOLS[id].dock;
    if (side && docked[side] === id) { docked[side] = null; makeRoom(); }
    if (id === "clock" && !keep) save("clock-off", true);   // closed on purpose: it stays closed in the next deck
    saveLayout();
    paintMenu();
  }

  // Clicked buttons give the focus back to the slides, so Space and the arrows still change slides.
  layer.addEventListener("click", function (e) {
    const b = e.composedPath().find(function (n) { return n.tagName === "BUTTON"; });   // inside a web component too
    if (b) b.blur();
  });

  // Redraw the open tools that show a saved setting (key) after it changed.
  function refreshTools(key) {
    for (const id in open) {
      if (TOOLS[id].keys.indexOf(key) >= 0) open[id].api.refresh();
    }
  }
  // A tool saved something another tool shows (a class list): that one redraws too.
  window.addEventListener("chalkline-tools-changed", function (e) { refreshTools(e.detail); });
  // Another tab (say, the next deck) changed a score or setting: show it here too.
  window.addEventListener("storage", function (e) {
    if (e.key && e.key.indexOf(PREFIX) === 0) refreshTools(e.key.slice(PREFIX.length));
  });

  /* ---------------- The toolbox button and its menu ---------------- */

  const menu = h("div", { id: "ct-menu", role: "menu", hidden: true });
  const launch = h("button", { id: "ct-launch", title: "Classroom tools (W)", "aria-label": "Classroom tools",
    "aria-haspopup": "menu", onclick: function () { toggleMenu(); } });
  launch.innerHTML = '<svg viewBox="0 0 24 24" width="26" height="26" fill="none" stroke="currentColor" stroke-width="1.8" ' +
    'stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3" y="3" width="7" height="7" rx="1.5"/>' +
    '<rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/>' +
    '<path d="M17.5 14v7M14 17.5h7"/></svg>';
  layer.append(launch, menu);

  // The menu: the tools as tiles, in groups
  const MENU = [
    ["People", ["picker", "groups", "scoreboard"]],
    ["Attention", ["voice", "traffic", "spotlight"]],
    ["Time", ["clock", "stopwatch"]],
    ["This unit", ["vocab", "packet", "qr"]],
    ["More", ["music", "dice", "slide"]],
  ];
  // Slides: reveal.js's own tools, which are otherwise only in the slide menu's Tools tab. Each tile
  // shows its key, so it's quicker next time. A tile shows only when this deck has that tool.
  const RC = function () { return window.RevealChalkboard; };
  const SLIDES = [
    { title: "Full screen", icon: "maximize", key: "F", run: function () {
      if (document.fullscreenElement) document.exitFullscreen();
      else if (document.documentElement.requestFullscreen) document.documentElement.requestFullscreen();
    } },
    { title: "All slides", icon: "layout-grid", key: "O", run: function () { Reveal.toggleOverview(true); } },
    { title: "Speaker view", icon: "monitor", key: "S", has: function () { return Reveal.getPlugin("notes"); },
      run: function () { Reveal.getPlugin("notes").open(); } },
    { title: "Whiteboard", icon: "presentation", key: "B", has: RC, run: function () { RC().toggleChalkboard(); } },
    { title: "Draw on slide", icon: "pen-line", key: "C", has: RC, run: function () { RC().toggleNotesCanvas(); } },
    { title: "Shortcuts", icon: "keyboard", key: "?", run: function () { Reveal.toggleHelp(true); } },
  ];
  function paintSlides() {
    if (!window.Reveal) return;
    const items = SLIDES.filter(function (a) { return !a.has || a.has(); });
    menu.append(h("div", { class: "ct-menu-group", text: "Slides" }));
    const grid = h("div", { class: "ct-menu-grid ct-menu-compact" });
    items.forEach(function (a) {
      grid.append(h("button", { class: "ct-menu-item", role: "menuitem", title: a.title + " (" + a.key + ")",
        onclick: function () { toggleMenu(false); a.run(); } },
        h("span", { class: "ct-menu-icon" }, icon(a.icon)), h("span", { class: "ct-menu-name", text: a.title }),
        h("kbd", { class: "ct-menu-key ct-tile-key", text: a.key })));
    });
    menu.append(grid);
  }
  function paintMenu() {
    menu.textContent = "";
    menu.append(h("div", { class: "ct-menu-title" }, "Classroom tools", h("kbd", { class: "ct-menu-key", title: "Press W to open and close this menu", text: "W" })));
    const listed = [].concat.apply([], MENU.map(function (g) { return g[1]; }));
    const groups = MENU.map(function (g) { return [g[0], g[1].slice()]; });
    Object.keys(TOOLS).forEach(function (id) { if (listed.indexOf(id) < 0) groups[groups.length - 1][1].push(id); });   // a new tool goes under More
    groups.forEach(function (g) {
      const ids = g[1].filter(function (id) { return TOOLS[id]; });
      if (!ids.length) return;
      menu.append(h("div", { class: "ct-menu-group", text: g[0] }));
      const grid = h("div", { class: "ct-menu-grid" });
      ids.forEach(function (id) {
        const t = TOOLS[id];
        grid.append(h("button", { class: "ct-menu-item" + (open[id] ? " ct-on" : ""), role: "menuitemcheckbox",
          "aria-checked": open[id] ? "true" : "false", title: t.key ? t.title + " (" + t.key.key + ")" : null,
          onclick: function () { open[id] ? closeTool(id) : openTool(id); } },
          h("span", { class: "ct-menu-icon" }, icon(t.icon)), h("span", { class: "ct-menu-name", text: t.title }),
          t.key ? h("kbd", { class: "ct-menu-key ct-tile-key", text: t.key.key }) : null,
          open[id] ? h("span", { class: "ct-check" }, icon("check")) : null));
      });
      menu.append(grid);
    });
    paintSlides();
    const foot = h("div", { class: "ct-menu-foot" });
    if (Object.keys(open).length) {
      foot.append(h("button", { class: "ct-menu-action",
        onclick: function () { Object.keys(open).forEach(function (id) { closeTool(id); }); toggleMenu(false); } },
        icon("x"), h("span", { text: "Close all" })));
    }
    foot.append(h("button", { class: "ct-menu-action", onclick: function () { toggleMenu(false); showReset(); } },
      icon("rotate-ccw"), h("span", { text: "Reset for the next class…" })));
    menu.append(foot);
  }

  /* ---------------- Reset for the next class ----------------
     Starts this deck's games, polls and timers again (and, if ticked, clears the pen marks on its
     PDFs and the toolbox scores). Each part listens for the "chalkline:reset" event and resets
     itself; event.detail says which parts: { games, polls, timers, ink }. */

  function showReset() {
    const has = function (sel) { return !!document.querySelector(sel); };
    const items = [
      { key: "games", label: "Games: Snowman, Jeopardy, quick-fire…", on: true, show: has(".cg-game") },
      { key: "polls", label: "Poll votes", on: true, show: has(".poll") },
      { key: "timers", label: "Timers", on: true, show: has(".countdown") },
      { key: "ink", label: "Pen marks on this deck's PDFs (worksheets)", on: false, show: has(".pdfv") },
      { key: "tools", label: "Toolbox: scores, noise count, stopwatch, picked names", on: false, show: true },
      { key: "first", label: "Go back to the first slide", on: true, show: !!window.Reveal },
    ].filter(function (i) { return i.show; });
    const boxes = {};
    const dialog = h("div", { class: "ct-reset", role: "dialog", "aria-label": "Reset for the next class" },
      h("div", { class: "ct-reset-title", text: "Reset for the next class" }),
      h("p", { class: "ct-reset-hint", text: "Start this deck again, fresh for a new class." }),
      ...items.map(function (i) {
        boxes[i.key] = h("input", { type: "checkbox" });
        boxes[i.key].checked = i.on;
        return h("label", { class: "ct-reset-item" }, boxes[i.key], h("span", { text: i.label }));
      }),
      h("div", { class: "ui-actions" },
        h("button", { class: "ui-btn ui-primary", onclick: function () {
          const pick = {};
          items.forEach(function (i) { pick[i.key] = boxes[i.key].checked; });
          resetAll(pick);
          close();
        } }, icon("rotate-ccw"), " Reset"),
        h("button", { class: "ui-btn", text: "Cancel", onclick: close })));
    const shade = h("div", { class: "ct-shade", onclick: function (e) { if (e.target === shade) close(); } }, dialog);
    function esc(e) {   // Esc closes it (and not reveal.js's slide overview)
      if (e.key === "Escape") { e.preventDefault(); e.stopImmediatePropagation(); close(); }
    }
    function close() { shade.remove(); window.removeEventListener("keydown", esc, true); }
    window.addEventListener("keydown", esc, true);
    layer.append(shade);
  }

  function resetAll(pick) {
    document.dispatchEvent(new CustomEvent("chalkline:reset", { detail: pick }));
    if (pick.tools) {
      const scores = load("scores", null);
      if (scores) { scores.teams.forEach(function (t) { t.score = 0; }); save("scores", scores); }
      save("noise-count", 0);
      save("stopwatch", { since: 0, done: 0 });
      const c = window.ChalklineToolbox.classes.load();   // classes.js: the class lists
      c.classes.forEach(function (k) { k.picked = []; k.groups = null; });
      save("classes", c);
      ["scores", "noise-count", "stopwatch", "classes"].forEach(refreshTools);
    }
    if (pick.first && window.Reveal) Reveal.slide(0, 0);
  }
  function toggleMenu(show) {
    menu.hidden = show === undefined ? !menu.hidden : !show;
    if (!menu.hidden) paintMenu();
  }
  document.addEventListener("pointerdown", function (e) {
    if (!menu.hidden && !menu.contains(e.target) && !launch.contains(e.target)) toggleMenu(false);
  });
  // Esc closes the menu (and only the menu: reveal.js would also open the slide overview).
  window.addEventListener("keydown", function (e) {
    if (e.key === "Escape" && !menu.hidden) {
      e.preventDefault(); e.stopImmediatePropagation();
      toggleMenu(false);
    }
  }, true);
  if (window.Reveal) {
    Reveal.addKeyBinding({ keyCode: 87, key: "W", description: "Classroom tools" }, function () { toggleMenu(); });
    // A tool's own key opens and closes it: K the clock, P the Packet, V Vocab. P and V replace
    // reveal.js's own (P: the previous slide, as ← does; V: a black screen, as B and . do).
    Object.keys(TOOLS).forEach(function (id) {
      const k = TOOLS[id].key;
      if (k) Reveal.addKeyBinding({ keyCode: k.keyCode, key: k.key, description: "Show/hide " + TOOLS[id].title }, function () { open[id] ? closeTool(id) : openTool(id); });
    });
  }

  // Fullscreen shows only one element: take the tools along into it, and back out again.
  document.addEventListener("fullscreenchange", function () {
    const fs = document.fullscreenElement;
    const home = fs && fs !== document.documentElement && fs !== document.body ? fs : document.body;
    if (layer.parentNode !== home) home.append(layer);
  });

  // Bring back the panels that were open in the last deck (the old noise meter is now in Voice level).
  (layout.open || []).map(function (id) { return id === "noise" ? "voice" : id; })
    .filter(function (id) { return id !== "spotlight"; })   // the spotlight is for one moment: not in the next deck
    .forEach(openTool);
  // The clock is on unless it was closed (or the old corner clock was hidden with K), or this deck
  // turns it off (clock: false).
  let clockOff = load("clock-off", null);
  if (clockOff === null) { try { clockOff = localStorage.getItem("slide-clock-visible") === "0"; } catch (e) { clockOff = false; } }
  const deckOff = (document.querySelector('meta[name="chalkline-clock"]') || {}).content === "off";
  if (deckOff) closeTool("clock", true);   // just this deck: it comes back in the next one
  else if (!clockOff) openTool("clock");
  // The slide's size settles once the deck is ready, and changes with the window: a clock that
  // hasn't been dragged follows the space beside the slide.
  function reseatClock() {
    const p = layout.pos.clock;
    if (!open.clock || !p || !p.auto) return;
    Object.assign(p, TOOLS.clock.start());
    place(open.clock.panel, clampPos(p, TOOLS.clock));
  }
  if (Reveal.isReady()) reseatClock(); else Reveal.on("ready", reseatClock);
  Reveal.on("resize", reseatClock);
  paintMenu();
})();
