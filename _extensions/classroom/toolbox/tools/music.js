/*
  Music: classroom music from YouTube, as YouTube's own player (its play, pause and volume) filling
  the tool, with rounded corners. ⋯ by the × (or a right-click on its edge) opens a menu: change the
  song (a link to a song or a playlist), the last songs, and Pop out. The video stays at least
  200 × 200: YouTube's rules for embedded players don't allow hiding it or playing only its sound.
  No shadow root: YouTube's player code expects to be in the page.
*/
(function () {
  const T = window.ChalklineToolbox;
  const { load, save, h, icon, course, unitMenu } = T;

  function build(body, panel) {
    // Remembered in this browser: { link, recent: [links], titles: {link: title} }.
    const state = function () { return Object.assign({ link: "", recent: [], titles: {} }, load("music", {})); };
    const screen = h("div", { class: "ct-music-screen" });
    const menu = h("div", { class: "ct-music-menu", role: "menu", hidden: true });
    const more = h("button", { class: "ct-ctrl ct-music-more", "aria-label": "Music menu", title: "Change the song, recent songs, pop out",
      onclick: function (e) { e.stopPropagation(); showMenu(menu.hidden); } }, icon("ellipsis"));
    const ctrls = panel.querySelector(".ct-ctrls");
    ctrls.insertBefore(more, ctrls.lastChild);
    body.append(screen, menu);
    panel.addEventListener("contextmenu", function (e) { e.preventDefault(); showMenu(true); });
    function outside(e) { if (!menu.hidden && !menu.contains(e.target) && !more.contains(e.target)) showMenu(false); }
    document.addEventListener("pointerdown", outside);

    let player = null;

    // A box for a link: in the menu, and in the middle of the panel before the first song
    function linkBox(focus) {
      const field = h("input", { class: "ui-field ct-music-field", type: "url", value: state().link,
        placeholder: "Paste a YouTube link: a song or a playlist", "aria-label": "YouTube link",
        onkeydown: function (e) { if (e.key === "Enter") use(field.value); } });
      if (focus) setTimeout(function () { field.select(); }, 0);
      return h("div", { class: "ct-music-link" }, field, h("button", { class: "ui-btn ui-primary ui-small", text: "Play", onclick: function () { use(field.value); } }));
    }
    function showMenu(on) {
      if (!on) { menu.hidden = true; return; }
      const s = state();
      menu.replaceChildren(h("div", { class: "ct-music-menu-label", text: "Change song" }), linkBox(true));
      const others = s.recent.filter(function (x) { return x !== s.link; });
      if (others.length) {
        menu.append(h("div", { class: "ct-music-menu-label", text: "Last songs" }));
        others.forEach(function (link) {
          menu.append(h("button", { class: "ct-music-item", role: "menuitem", title: link,
            text: s.titles[link] || link.replace(/^https?:\/\/(www\.)?/, ""), onclick: function () { use(link); } }));
        });
      }
      if (s.link) menu.append(h("button", { class: "ct-music-item ct-music-pop", role: "menuitem",
        title: "Opens the song on YouTube in its own small window: minimize it and the music keeps playing",
        text: "Pop out to a small YouTube window", onclick: popOut }));
      menu.hidden = false;
    }

    // A YouTube link to { id, list }: watch?v=, youtu.be/, shorts/, embed/, a playlist (list=), or a bare video id
    function parse(link) {
      link = (link || "").trim();
      if (/^[\w-]{11}$/.test(link)) return { id: link, list: null };
      try {
        const u = new URL(/^\w+:\/\//.test(link) ? link : "https://" + link);
        if (!/(^|\.)(youtube\.com|youtu\.be|youtube-nocookie\.com)$/.test(u.hostname)) return null;
        const id = /youtu\.be$/.test(u.hostname) ? u.pathname.slice(1, 12)
          : u.searchParams.get("v") || (u.pathname.match(/\/(shorts|embed|live)\/([\w-]{11})/) || [])[2] || null;
        const list = u.searchParams.get("list");
        return id || list ? { id: id, list: list } : null;
      } catch (e) { return null; }
    }

    // YouTube's player code, loaded once for the page
    function api(then) {
      if (window.YT && window.YT.Player) return then();
      const wait = window.chalklineYT = window.chalklineYT || [];
      wait.push(then);
      if (wait.length > 1) return;
      const before = window.onYouTubeIframeAPIReady;
      window.onYouTubeIframeAPIReady = function () {
        if (before) before();
        wait.splice(0).forEach(function (f) { f(); });
      };
      document.head.append(h("script", { src: "https://www.youtube.com/iframe_api", onerror: function () {
        wait.length = 0;
        note("Can't reach YouTube from here.");
      } }));
    }
    function note(text) { screen.replaceChildren(h("div", { class: "ct-music-note", text: text })); }

    // Play a link (start: false when the panel comes back in the next deck: ready, not playing)
    function use(link, start) {
      const v = parse(link);
      if (!v) { showMenu(true); menu.prepend(h("div", { class: "ct-music-error", text: "That isn't a YouTube link." })); return; }
      const s = state();
      s.link = link.trim();
      s.recent = [s.link].concat(s.recent.filter(function (x) { return x !== s.link; })).slice(0, 5);
      save("music", s);
      showMenu(false);
      note("…");
      api(function () {
        // a new link gets a new player: simplest for switching between songs and playlists
        if (player && player.destroy) player.destroy();
        const holder = h("div", {});   // YouTube's player replaces this
        screen.replaceChildren(holder);
        const vars = { playsinline: 1, rel: 0, autoplay: start === false ? 0 : 1 };
        if (v.list) { vars.listType = "playlist"; vars.list = v.list; }
        player = new YT.Player(holder, {
          width: "100%", height: "100%", videoId: v.id || undefined, playerVars: vars,
          events: {
            onStateChange: function () {   // remember the song's name for the menu
              const d = player.getVideoData && player.getVideoData(), now = state();
              if (d && d.title && now.titles[now.link] !== d.title) { now.titles[now.link] = d.title; save("music", now); }
            },
            onError: function () { note("YouTube won't play this one here (it may not allow playing on other sites). Try another link: ⋯"); },
          },
        });
      });
    }
    function popOut() {
      const v = parse(state().link);
      showMenu(false);
      if (!v) return;
      const url = "https://www.youtube.com/" + (v.id ? "watch?v=" + v.id + (v.list ? "&list=" + v.list : "") : "playlist?list=" + v.list);
      if (player && player.pauseVideo) player.pauseVideo();   // one at a time
      window.open(url, "chalkline-music", "width=520,height=380");
    }

    if (state().link) use(state().link, false);   // ready to go, not playing yet
    else screen.replaceChildren(h("div", { class: "ct-music-ask" },
      h("div", { class: "ct-music-note", text: "Music from YouTube" }), linkBox(true)));
    return { close: function () {
      document.removeEventListener("pointerdown", outside);
      if (player && player.destroy) player.destroy();
      player = null;
    } };
  }

  T.tool("music", {
    title: "Music", icon: "music", w: 340, h: 220, minW: 200, minH: 200, keys: [], free: true
  }, class extends T.ToolElement {
    static shadow = false;
    static css = `
/* YouTube's own player is the card (never under 200 × 200, YouTube's rule), and a ⋯ menu */
.ct-music-screen {
  flex: 1; min-width: 200px; min-height: 200px; display: grid; overflow: hidden;
  border-radius: 20px; background: #000; box-shadow: var(--ui-shadow-float);
}
.ct-music-screen iframe, .ct-music-screen > div:only-child:not(.ct-music-ask):not(.ct-music-note) { display: block; width: 100%; height: 100%; border: 0; }
.ct-music-ask, .ct-music-note { align-self: center; justify-self: center; width: 100%; padding: 12px; color: #fff; text-align: center; font-size: 14px; }
.ct-music-ask { display: flex; flex-direction: column; gap: 8px; }
.ct-music-ask .ct-music-note { padding: 0; font-weight: 600; font-size: 15px; }
.ct-music-more { font-size: 18px !important; }   /* beside the × */
.ct-music-menu {
  position: absolute; top: 6px; right: 8px; z-index: 3; width: min(300px, calc(100% - 16px)); max-height: calc(100% - 30px); overflow: auto;
  display: flex; flex-direction: column; gap: 4px; padding: 8px;
  border-radius: var(--ui-r); background: var(--ui-surface); box-shadow: var(--ui-shadow); font-size: 14px;
}
.ct-music-menu[hidden] { display: none; }
.ct-music-menu-label { margin-top: 2px; color: var(--ui-muted); font-size: 11px; font-weight: 700; letter-spacing: 0.06em; text-transform: uppercase; }
.ct-music-link { display: flex; gap: 6px; }
.ct-music-field { flex: 1; min-width: 0; font-size: 13px; }
.ct-music-item {
  display: block; width: 100%; padding: 5px 8px; border: 0; border-radius: var(--ui-r-sm); background: transparent;
  color: var(--ui-ink); text-align: left; font: inherit; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; cursor: pointer;
}
.ct-music-item:hover { background: var(--ui-accent-soft); }
.ct-music-pop { margin-top: 4px; border-top: 1px solid var(--ui-line); border-radius: 0 0 var(--ui-r-sm) var(--ui-r-sm); padding-top: 7px; color: var(--ui-accent); font-weight: 600; }
.ct-music-error { color: var(--ui-bad); font-weight: 600; }
`;
    build(root) { this.api = build(root, this.panel) || {}; }
    refresh() { if (this.api.refresh) this.api.refresh(); }
    close() { if (this.api.close) this.api.close(); }
  });
})();
