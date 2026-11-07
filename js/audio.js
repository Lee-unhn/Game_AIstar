// 原創晶片風樂句。只在玩家操作後啟動 Web Audio。
(function () {
  "use strict";

  const themes = {
    title: { beat: 0.33, notes: [60, 67, 72, 76, 74, 72, 67, 0, 57, 64, 69, 72, 71, 67, 64, 0], bass: [48, 45] },
    field: { beat: 0.28, notes: [67, 69, 72, 0, 76, 74, 72, 69, 65, 67, 69, 0, 72, 69, 67, 0], bass: [48, 53] },
    battle: { beat: 0.18, notes: [64, 64, 67, 71, 64, 72, 71, 67, 62, 62, 65, 69, 62, 71, 69, 65], bass: [40, 38] },
  };
  const effects = { select: [76], hit: [58, 43], crystal: [72, 76, 81], win: [67, 72, 76, 84], level: [72, 74, 76, 79] };
  const muteButton = document.getElementById("mute");
  const key = "aistar.muted";
  let muted = false;
  let context;
  let master;
  let theme = "title";
  let step = 0;
  let next = 0;
  try { muted = localStorage.getItem(key) === "true"; } catch {}

  function tone(note, at, length, volume, type) {
    if (!note) return;
    const oscillator = context.createOscillator();
    const envelope = context.createGain();
    oscillator.type = type;
    oscillator.frequency.value = 440 * 2 ** ((note - 69) / 12);
    envelope.gain.setValueAtTime(volume, at);
    envelope.gain.exponentialRampToValueAtTime(0.0001, at + length);
    oscillator.connect(envelope).connect(master);
    oscillator.start(at);
    oscillator.stop(at + length);
  }

  function tick() {
    if (context.state !== "running") return;
    const { beat, notes, bass } = themes[theme];
    next = Math.max(next, context.currentTime);
    while (next < context.currentTime + 0.12) {
      tone(notes[step], next, beat * 0.83, 0.05, "triangle");
      if (step % 2 === 0) tone(bass[Math.floor(step / 8)], next, beat * 1.3, 0.025, "square");
      next += beat;
      step = (step + 1) % notes.length;
    }
  }

  function activate() {
    const Audio = window.AudioContext || window.webkitAudioContext;
    if (!Audio) return;
    if (!context) {
      context = new Audio();
      master = context.createGain();
      master.gain.value = muted ? 0 : 0.55;
      master.connect(context.destination);
      setInterval(tick, 70);
    }
    if (context.state === "suspended") context.resume().catch(() => {});
  }

  function updateMute() {
    muteButton.textContent = muted ? "配樂與音效：關" : "配樂與音效：開";
    muteButton.setAttribute("aria-pressed", String(muted));
    if (master) master.gain.setTargetAtTime(muted ? 0 : 0.55, context.currentTime, 0.02);
  }

  window.addEventListener("keydown", activate);
  window.addEventListener("pointerdown", (event) => {
    if (event.pointerType === "mouse") activate();
  });
  window.addEventListener("pointerup", activate);
  muteButton.addEventListener("click", (event) => {
    muted = !muted;
    try { localStorage.setItem(key, String(muted)); } catch {}
    updateMute();
    if (event.detail > 0) muteButton.blur();
  });
  updateMute();

  Game.Audio = {
    scene(name) {
      const nextTheme = name === "battle" ? "battle" : name === "title" || name === "starter" ? "title" : "field";
      if (theme !== nextTheme) {
        theme = nextTheme;
        step = 0;
      }
    },
    play(name) {
      if (!context || context.state !== "running" || muted) return;
      effects[name].forEach((note, i) => tone(note, context.currentTime + i * 0.085, 0.14, 0.085, "triangle"));
    },
  };
})();
