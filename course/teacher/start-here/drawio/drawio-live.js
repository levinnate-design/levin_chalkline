// Live draw.io infographics: <div class="drawio-live" data-src="drawio/republic.svg"></div>
// Loads a draw.io SVG export into the page itself (not as an <img>), so the boxes can react:
// hover or tap a box and it lifts while everything else fades. Styles: drawio-live.css.
// Make the SVG with scripts/drawio.py (or draw.io's File > Export as > SVG).
(function () {
  document.querySelectorAll(".drawio-live[data-src]").forEach(function (box) {
    fetch(box.dataset.src).then(r => r.text()).then(function (text) {
      box.innerHTML = text.slice(text.indexOf("<svg"));   // drop the XML header
      const svg = box.querySelector("svg");
      svg.removeAttribute("width"); svg.removeAttribute("height");   // scale to the slide
      // A "box" is any shape with a fill (draw.io gives each shape its own <g data-cell-id>);
      // arrows and plain text labels stay as they are.
      svg.querySelectorAll("g[data-cell-id]").forEach(function (g) {
        const id = g.dataset.cellId;
        if (id === "0" || id === "1") return;
        const shape = g.querySelector(":scope > g > rect, :scope > g > path, :scope > rect, :scope > path");
        if (shape && shape.getAttribute("fill") && shape.getAttribute("fill") !== "none") g.classList.add("live-box");
      });
      svg.addEventListener("click", function (e) {   // touch screens: tap a box to focus it, tap again to clear
        const g = e.target.closest(".live-box");
        svg.querySelectorAll(".live-box.focus").forEach(x => { if (x !== g) x.classList.remove("focus"); });
        if (g) { g.classList.toggle("focus"); e.stopPropagation(); }
      });
    }).catch(function () { box.textContent = "(Couldn't load " + box.dataset.src + ")"; });
  });
})();
