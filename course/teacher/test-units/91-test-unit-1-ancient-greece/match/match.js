// Tap-to-match: tap a word, then tap its meaning. Right pairs turn green and stay; wrong ones shake.
// Any slide can use it: list the pairs in a <div class="match"> and include this file.
//
//   <div class="match">
//     <p data-term="myth">A traditional story about gods and heroes.</p>
//     ...
//   </div>
//
// Review activity, so English only (no 中文: see the vocab rules). In the slide PDF it shows the
// answer key: each word next to its meaning.
(function () {
  const shuffle = a => a.map(x => [Math.random(), x]).sort((p, q) => p[0] - q[0]).map(p => p[1]);
  const COLORS = ["#14d7cd", "#ff8c0f", "#0087ff", "#8cc472", "#f2b630", "#c084fc", "#fb7185", "#38bdf8"];

  function build(root) {
    const pairs = [...root.querySelectorAll("[data-term]")].map((p, i) => ({ id: i, term: p.dataset.term, meaning: p.textContent.trim() }));
    root.innerHTML = "";
    if (/print-pdf/.test(location.search)) {   // slide PDF: the answer key
      root.innerHTML = '<div class="match-key">' + pairs.map(p =>
        `<div class="match-term">${p.term}</div><div class="match-meaning">${p.meaning}</div>`).join("") + "</div>";
      return;
    }
    const board = document.createElement("div");
    board.className = "match-board";
    const left = document.createElement("div"), right = document.createElement("div");
    left.className = "match-col"; right.className = "match-col";
    const card = (p, side) => {
      const b = document.createElement("button");
      b.type = "button"; b.className = "match-card " + side; b.dataset.id = p.id;
      b.textContent = side === "term" ? p.term : p.meaning;
      return b;
    };
    shuffle(pairs).forEach(p => left.appendChild(card(p, "term")));
    shuffle(pairs).forEach(p => right.appendChild(card(p, "meaning")));
    board.append(left, right);
    const bar = document.createElement("div");
    bar.className = "match-bar";
    bar.innerHTML = '<span class="match-score"></span><button type="button" class="match-reset">↺ Shuffle and start again</button>';
    root.append(board, bar);

    let picked = null, done = 0;
    const score = () => (bar.querySelector(".match-score").textContent =
      done === pairs.length ? `🎉 All ${done} matched!` : `${done} of ${pairs.length} matched`);
    score();

    board.addEventListener("click", e => {
      const b = e.target.closest(".match-card");
      if (!b || b.classList.contains("matched")) return;
      e.stopPropagation();
      if (!picked || picked.classList.contains(b.classList.contains("term") ? "term" : "meaning")) {
        if (picked) picked.classList.remove("picked");
        picked = b; b.classList.add("picked");
        return;
      }
      if (picked.dataset.id === b.dataset.id) {   // a right pair
        const color = COLORS[done % COLORS.length];
        [picked, b].forEach(x => { x.classList.remove("picked"); x.classList.add("matched"); x.style.setProperty("--pair", color); });
        done++; score();
      } else {                                      // a wrong pair: shake, then let go
        [picked, b].forEach(x => { x.classList.remove("picked"); x.classList.add("wrong"); setTimeout(() => x.classList.remove("wrong"), 450); });
      }
      picked = null;
    });
    bar.querySelector(".match-reset").addEventListener("click", e => {
      e.stopPropagation();
      root.innerHTML = pairs.map(p => `<p data-term="${p.term}">${p.meaning}</p>`).join("");
      build(root);
    });
  }

  document.querySelectorAll(".match").forEach(build);
})();
