/*
  Voice level: 0 Silent to 4 Presenter. One card: the level, big, in its own color; under it a white
  strip with the five levels to tap and the microphone button. The microphone button adds a noise
  meter at the bottom of the card: the room's sound level, with a "too loud" line set by the voice
  level (Silent is strict, Presenter allows the most). Over the line for a second, the card flashes
  red, it beeps (if the bell is on) and the count goes up. Narrow (a column in the slide's margin),
  everything stacks and the meter stands up.
  Saved: "voice" (the level), "noise-on", "noise-sense" (−3 to +3), "noise-beep", "noise-count".
  The microphone's sound is only measured, in this browser: never recorded or sent anywhere.
*/
(function () {
  const T = window.ChalklineToolbox;
  const LEVELS = [
    { icon: "🤫", label: "Silent", color: "var(--ui-alarm)", limit: 22 },
    { icon: "💬", label: "Whisper", color: "#e8740c", limit: 34 },
    { icon: "🧑‍🤝‍🧑", label: "Partner talk", color: "#c99700", limit: 47 },
    { icon: "👥", label: "Group talk", color: "#2e9e4f", limit: 60 },
    { icon: "🎤", label: "Presenter", color: "#0087ff", limit: 74 },
  ];
  const NOISE_HEIGHT = 150;   // the panel grows by this much when the noise meter is turned on
  const MIC = '<svg viewBox="0 0 24 24" width="1em" height="1em" fill="none" stroke="currentColor" stroke-width="2.2" ' +
    'stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="9" y="3" width="6" height="11" rx="3"/>' +
    '<path d="M5.5 11a6.5 6.5 0 0013 0M12 17.5V21"/></svg>';

  T.tool("voice", { title: "Voice level", icon: "volume-2", w: 400, h: 250, minW: 150, minH: 200, keys: ["voice", "noise-count", "noise-sense"], free: true },
    class extends T.ToolElement {
      static css = `
.card {
  position: relative; flex: 1; min-height: 0; display: flex; flex-direction: column; overflow: hidden;
  border-radius: min(9cqmin, 22px); background: #fff;
  box-shadow: var(--ui-shadow-float);
}
/* The level, big, in its color */
.level {
  flex: 1; min-height: 0; display: flex; align-items: center; justify-content: center; gap: 0.3em; padding: 0 0.4em;
  background: var(--lvl); color: #fff; font-size: min(22cqh, 10cqw); font-weight: 700; line-height: 1;
  transition: background 0.3s;
}
.num { flex: none; display: grid; place-items: center; width: 1.5em; height: 1.5em; border-radius: 50%; background: #fff; color: var(--lvl); }
.emoji { font-size: 1.15em; }
.label { text-align: center; }
/* The five levels and the microphone */
.picks { flex: none; display: flex; justify-content: center; align-items: center; gap: 2.5cqw; padding: 3cqh 8px; }
.pick {
  display: grid; place-items: center; width: min(15cqh, 12cqw); height: min(15cqh, 12cqw); min-width: 30px; min-height: 30px;
  padding: 0; border: 0; border-radius: 50%; cursor: pointer;
  background: color-mix(in srgb, var(--c) 12%, #fff); color: var(--c);
  font-size: clamp(14px, 7cqmin, 30px); font-weight: 700;
  transition: background 0.15s, color 0.15s, transform 0.06s;
}
.pick:hover { background: color-mix(in srgb, var(--c) 22%, #fff); }
.pick:active { transform: scale(0.94); }
.pick.on { background: var(--c); color: #fff; }
.mic { --c: #5b6b80; position: relative; margin-left: 3cqw; }
.mic::before { content: ""; position: absolute; left: calc(-1.5cqw - 2px); top: 15%; bottom: 15%; width: 1px; background: #d6dee8; }
.mic.on { --c: var(--ui-accent); }
/* With the noise meter on, the level takes less room */
.card.noisy .level { font-size: min(11cqh, 10cqw); }
.card.noisy .pick { width: min(9cqh, 12cqw); height: min(9cqh, 12cqw); }

/* The noise meter */
.noise {
  flex: 1; min-height: 0; display: flex; flex-direction: column; justify-content: center; gap: 4px;
  container-type: size; padding: 4px 12px 10px; border-top: 1px solid #eef1f5;
}
.noise[hidden] { display: none; }
.meter-row { flex: 1; min-height: 0; display: flex; align-items: center; gap: 3cqw; }
.face { font-size: min(36cqh, 13cqw); line-height: 1; }
.meter {
  --pct: 0%; --limit: 50%;
  position: relative; flex: 1; height: min(30cqh, 40px); min-height: 18px; border-radius: 999px;
  background: linear-gradient(to right, color-mix(in srgb, var(--lvl) 14%, #fff) var(--limit), #fbe3e3 var(--limit));
}
.fill { position: absolute; left: 0; top: 0; bottom: 0; width: var(--pct); border-radius: inherit; background: var(--lvl); }
.meter[data-zone="near"] .fill { background: #f0a020; }
.meter[data-zone="loud"] .fill { background: var(--ui-alarm); }
.line { position: absolute; top: -5px; bottom: -5px; left: var(--limit); width: 4px; margin-left: -2px; border-radius: 2px; background: var(--ui-ink); transition: left 0.4s; }
.flag { position: absolute; bottom: 100%; left: 50%; transform: translate(-50%, -2px); font-size: 18px; line-height: 1; }
.info { flex: none; display: flex; align-items: center; flex-wrap: wrap; gap: 6px; font-size: clamp(12px, min(11cqh, 4cqw), 20px); }
.chip { display: inline-flex; align-items: center; gap: 0.3em; padding: 0.2em 0.7em; border-radius: 999px; background: var(--ui-soft); font-weight: 700; white-space: nowrap; }
.card.loud .status { background: var(--ui-alarm); color: #fff; }
.buttons { display: inline-flex; gap: 4px; margin-left: auto; }
.mini {
  display: inline-grid; place-items: center; width: 1.8em; height: 1.8em; padding: 0; border: 0; border-radius: 50%; cursor: pointer;
  background: var(--ui-soft); color: var(--ui-ink); font-size: 0.9em; line-height: 1;
}
.chip .mini { width: 1.4em; height: 1.4em; background: rgba(16, 35, 63, 0.08); }
.mini:hover { background: var(--ui-soft-hover); }
.mini.go { background: var(--ui-accent); color: #fff; }
.stop { width: 0.6em; height: 0.6em; border-radius: 2px; background: #fff; }
.settings { flex: none; display: flex; align-items: center; justify-content: center; gap: 6px; font-size: 13px; font-weight: 600; }
.settings[hidden] { display: none; }
.sense { min-width: 1.6em; text-align: center; }

/* Too loud: the card flashes red */
.card::after { content: ""; position: absolute; inset: 0; border-radius: inherit; background: var(--ui-alarm); opacity: 0; pointer-events: none; }
.card.loud::after { animation: flash 0.7s ease-in-out infinite; }
.card.loud { box-shadow: 0 0 0 5px var(--ui-alarm), 0 16px 40px rgba(16, 35, 63, 0.3); }
@keyframes flash { 0%, 100% { opacity: 0.12; } 50% { opacity: 0.55; } }

/* Narrow (a column in the slide margin): everything stacks, and the meter stands up */
@container (max-width: 260px) {
  .level { flex-direction: column; gap: 0.15em; font-size: min(11cqh, 20cqw); }
  .label { font-size: 0.7em; }
  .picks { display: grid; grid-template-columns: repeat(3, auto); justify-content: center; gap: 6px; }
  .pick { width: min(12cqh, 22cqw); height: min(12cqh, 22cqw); }
  .mic { margin-left: 0; }
  .mic::before { display: none; }
  .card.noisy .level { font-size: min(6cqh, 20cqw); }
  .card.noisy .pick { width: min(7cqh, 22cqw); height: min(7cqh, 22cqw); }
  .noise { flex: 1.6; }
  .meter-row { justify-content: center; gap: 10px; }
  .face { font-size: min(12cqh, 26cqw); }
  .meter { flex: none; width: min(26cqw, 44px); height: 100%; background: linear-gradient(to top, color-mix(in srgb, var(--lvl) 14%, #fff) var(--limit), #fbe3e3 var(--limit)); }
  .fill { top: auto; right: 0; width: auto; height: var(--pct); }
  .line { top: auto; right: -5px; bottom: var(--limit); left: -5px; width: auto; height: 4px; margin: 0 0 -2px; transition: bottom 0.4s; }
  .flag { bottom: auto; left: 100%; top: 50%; transform: translate(4px, -50%); }
  .info { flex-direction: column; font-size: clamp(12px, 9cqw, 15px); }
  .buttons { margin-left: 0; }
  .settings { flex-wrap: wrap; }
}
`;
      build(root) {
        const self = this, h = T.h;
        this.level = h("div", { class: "level" });
        this.picks = h("div", { class: "picks" });
        LEVELS.forEach(function (l, i) {
          self.picks.append(h("button", { class: "pick", style: "--c:" + l.color, title: l.label, "aria-label": i + " " + l.label, text: i,
            onclick: function () { T.save("voice", i); self.paint(); } }));
        });
        this.noiseOn = T.load("noise-on", false);
        this.mic = h("button", { class: "pick mic", title: "Noise meter on/off", "aria-label": "Noise meter", onclick: function () {
          self.noiseOn = !self.noiseOn;
          T.save("noise-on", self.noiseOn);
          if (self.grow) self.grow(self.noiseOn ? NOISE_HEIGHT : -NOISE_HEIGHT);
          if (self.noiseOn) self.start(); else self.stop();
          self.paint();
        } });
        this.mic.innerHTML = MIC;
        this.picks.append(this.mic);

        // Microphones differ: "sensitivity" (−3 to +3) moves every level's line together.
        this.sense = T.load("noise-sense", 0); this.alarmOn = T.load("noise-beep", true); this.times = T.load("noise-count", 0);
        this.face = h("span", { class: "face", text: "🙂" });
        this.flag = h("span", { class: "flag" });
        this.meter = h("div", { class: "meter" }, h("div", { class: "fill" }), h("div", { class: "line" }, this.flag));
        this.status = h("span", { class: "chip status", text: "Microphone off" });
        this.count = h("span", {});   // how many times the class went over the line (kept until reset, also in the next deck)
        const resetCount = h("button", { class: "mini", title: "Count from 0 again", "aria-label": "Reset the count",
          onclick: function () { self.times = 0; T.save("noise-count", 0); self.paintCount(); } }, T.icon("rotate-ccw"));
        this.go = h("button", { class: "mini go", title: "Microphone on/off", onclick: function () { self.stream ? self.stop() : self.start(); } });
        this.alarmBtn = h("button", { class: "mini", title: "Beep when too loud", onclick: function () {
          self.alarmOn = !self.alarmOn; T.save("noise-beep", self.alarmOn); self.paintButtons();
        } });
        this.senseLabel = h("span", { class: "sense" });
        const settings = h("div", { class: "settings", hidden: true },
          h("span", { text: "Microphone sensitivity" }),
          h("button", { class: "mini", text: "−", "aria-label": "Less sensitive", onclick: function () { self.setSense(self.sense - 1); } }),
          this.senseLabel,
          h("button", { class: "mini", text: "+", "aria-label": "More sensitive", onclick: function () { self.setSense(self.sense + 1); } }));
        const gear = h("button", { class: "mini", title: "Microphone sensitivity", onclick: function () { settings.hidden = !settings.hidden; } }, T.icon("settings"));
        this.noise = h("div", { class: "noise" },
          h("div", { class: "meter-row" }, this.face, this.meter),
          h("div", { class: "info" }, this.status, h("span", { class: "chip" }, this.count, resetCount), h("span", { class: "buttons" }, this.go, this.alarmBtn, gear)),
          settings);
        this.card = h("div", { class: "card" }, this.level, this.picks, this.noise);
        root.append(this.card);
        this.paint(); this.paintCount();
        if (this.noiseOn) this.paintButtons();
      }
      setSense(n) { this.sense = Math.max(-3, Math.min(3, n)); T.save("noise-sense", this.sense); this.paint(); }
      paint() {
        const i = T.load("voice", 0), l = LEVELS[i] || LEVELS[0], h = T.h, self = this;
        // More sensitive = a lower line (each step is 6 on the meter's 0 to 100 scale).
        this.limit = Math.max(8, Math.min(95, l.limit - this.sense * 6));
        this.card.style.setProperty("--lvl", l.color);
        this.level.replaceChildren(h("span", { class: "num", text: i }), h("span", { class: "emoji", text: l.icon }), h("span", { class: "label", text: l.label }));
        Array.prototype.forEach.call(this.picks.children, function (b, j) { b.classList.toggle("on", j === i || (b === self.mic && self.noiseOn)); });
        this.meter.style.setProperty("--limit", this.limit + "%");
        this.flag.textContent = l.icon;
        this.senseLabel.textContent = this.sense > 0 ? "+" + this.sense : String(this.sense);
        this.noise.hidden = !this.noiseOn;
        this.card.classList.toggle("noisy", this.noiseOn);
        this.paintButtons();
      }
      paintButtons() {
        this.go.innerHTML = this.stream ? '<span class="stop"></span>' : MIC;
        this.alarmBtn.replaceChildren(T.icon(this.alarmOn ? "bell" : "bell-off"));
      }
      paintCount() { this.count.textContent = "Too loud: " + this.times; }
      async start() {
        const self = this;
        if (this.stream) return;
        if (!window.isSecureContext || !navigator.mediaDevices) { this.status.textContent = "Needs localhost or https://"; return; }
        try {
          this.stream = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: false, noiseSuppression: false, autoGainControl: false } });
        } catch (e) {
          this.status.textContent = e.name === "NotAllowedError" ? "Microphone blocked: allow it in the address bar" : "No microphone found";
          return;
        }
        if (!this.noiseOn) { this.stop(); return; }   // turned off while the browser was asking
        this.ctx = new (window.AudioContext || window.webkitAudioContext)();
        const analyser = this.ctx.createAnalyser();
        analyser.fftSize = 2048;
        this.ctx.createMediaStreamSource(this.stream).connect(analyser);
        const data = new Float32Array(analyser.fftSize);
        let level = 0, loudSince = 0, quietSince = Date.now(), loud = false;
        this.paintButtons();
        const fmt = function (ms) { const s = Math.floor(ms / 1000); return Math.floor(s / 60) + ":" + String(s % 60).padStart(2, "0"); };
        function frame() {
          analyser.getFloatTimeDomainData(data);
          let sum = 0;
          for (let i = 0; i < data.length; i++) sum += data[i] * data[i];
          const db = 20 * Math.log10(Math.sqrt(sum / data.length) || 1e-6);   // about −60 (quiet) to 0 (very loud)
          const now = Math.min(100, Math.max(0, (db + 60) / 60 * 100));
          level = now > level ? level * 0.6 + now * 0.4 : level * 0.94 + now * 0.06;   // rise fast, fall slowly
          const t = Date.now();
          if (level > self.limit) {
            if (!loudSince) loudSince = t;
            if (!loud && t - loudSince > 1000) {
              loud = true;
              self.times = T.load("noise-count", 0) + 1;
              T.save("noise-count", self.times);
              self.paintCount();
              if (self.alarmOn) [0, 0.22, 0.44].forEach(function (d) { T.beep(988, 0.18, 0.5, "square", d); });
            }
          } else {
            loudSince = 0;
            if (loud) { loud = false; quietSince = t; }
          }
          self.meter.style.setProperty("--pct", level + "%");
          const zone = level > self.limit ? "loud" : level > self.limit * 0.8 ? "near" : "ok";
          self.meter.dataset.zone = zone;
          self.face.textContent = loud ? "😣" : zone === "near" ? "😐" : "🙂";
          self.card.classList.toggle("loud", loud);
          self.status.textContent = loud ? "Too loud!" : "Quiet for " + fmt(t - quietSince);
          self.raf = requestAnimationFrame(frame);
        }
        frame();
      }
      stop() {
        cancelAnimationFrame(this.raf);
        if (this.stream) this.stream.getTracks().forEach(function (tr) { tr.stop(); });
        if (this.ctx) this.ctx.close();
        this.stream = this.ctx = null;
        this.meter.style.setProperty("--pct", "0%");
        this.meter.dataset.zone = "ok";
        this.face.textContent = "🙂";
        this.card.classList.remove("loud");
        this.status.textContent = "Microphone off";
        this.paintButtons();
      }
      refresh() { this.times = T.load("noise-count", 0); this.sense = T.load("noise-sense", 0); this.paintCount(); this.paint(); }
      close() { this.stop(); }
    });
})();
