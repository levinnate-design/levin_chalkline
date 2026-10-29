/*
  Quick reference slide (quickref.lua): its decks, printables and PDFs open in a pop-up over the
  slides, not in place of them. The pop-up has the page's name, "Open in new tab" and ×; Esc closes
  it too. Key slides in this deck still just go there, and outside sites open in a new tab (most
  of them refuse to be shown inside another page).
*/
(function () {
  let box = null;

  function close() {
    if (!box) return;
    box.remove();
    box = null;
  }

  function open(href, title) {
    close();
    box = document.createElement("div");
    box.className = "qref-pop";
    box.innerHTML =
      '<div class="qref-pop-card" role="dialog" aria-modal="true">' +
        '<div class="qref-pop-bar"><span class="qref-pop-title"></span>' +
          '<a class="qref-pop-tab" target="_blank" rel="noopener">Open in new tab</a>' +
          '<button class="qref-pop-close" aria-label="Close" title="Close (Esc)">×</button></div>' +
        '<iframe class="qref-pop-frame"></iframe>' +
      '</div>';
    box.querySelector(".qref-pop-title").textContent = title;
    box.querySelector(".qref-pop-tab").href = href;
    box.querySelector(".qref-pop-frame").src = href;
    box.querySelector(".qref-pop-frame").title = title;
    box.querySelector(".qref-pop-close").addEventListener("click", close);
    box.addEventListener("click", function (e) { if (e.target === box) close(); });   // click outside the card
    (document.fullscreenElement || document.body).append(box);
    box.querySelector(".qref-pop-close").focus();
  }

  document.addEventListener("click", function (e) {
    const a = e.target.closest && e.target.closest(".qref a[href]");
    if (!a || e.ctrlKey || e.metaKey || e.shiftKey) return;   // Ctrl/Cmd-click: the browser's own new tab
    const href = a.getAttribute("href");
    if (href.charAt(0) === "#" || /^https?:\/\//.test(href)) return;   // this deck, or an outside site
    e.preventDefault();
    e.stopPropagation();
    const tile = a.closest(".qref-tile, .qref-pin");
    const name = tile && tile.querySelector(".qref-title, b");
    open(href, (name ? name.textContent : a.textContent).trim() + (a.classList.contains("qref-pdf") ? " (PDF)" : ""));
  }, true);

  // Esc closes the pop-up (and only the pop-up: reveal.js would also open the slide overview)
  window.addEventListener("keydown", function (e) {
    if (e.key === "Escape" && box) { e.preventDefault(); e.stopImmediatePropagation(); close(); }
  }, true);
})();
