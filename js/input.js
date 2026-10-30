// input.js：鍵盤與觸控按鈕統一成同一組按鍵。
// 這是底層檔案。要改請先開 issue。
(function () {
  "use strict";

  const KEY_MAP = {
    ArrowUp: "up", KeyW: "up",
    ArrowDown: "down", KeyS: "down",
    ArrowLeft: "left", KeyA: "left",
    ArrowRight: "right", KeyD: "right",
    KeyZ: "confirm", Enter: "confirm", NumpadEnter: "confirm",
    KeyX: "cancel", Escape: "cancel",
  };
  const DIRS = ["up", "down", "left", "right"];

  const held = {};
  const pressed = {};
  let lastDir = null;

  const Input = {
    // 這一格畫面裡有沒有「剛按下」
    pressed: (btn) => !!pressed[btn],
    held: (btn) => !!held[btn],

    // 現在要走的方向。快速點一下也算，不會因為放開太快而漏掉。
    dir() {
      if (lastDir && (held[lastDir] || pressed[lastDir])) return lastDir;
      return DIRS.find((d) => held[d] || pressed[d]) || null;
    },

    press(btn) {
      if (!held[btn]) pressed[btn] = true;
      held[btn] = true;
      if (DIRS.includes(btn)) lastDir = btn;
    },

    release(btn) {
      held[btn] = false;
    },

    endFrame() {
      Object.keys(pressed).forEach((k) => { pressed[k] = false; });
    },

    clear() {
      Object.keys(held).forEach((k) => { held[k] = false; });
      Input.endFrame();
    },
  };
  Game.Input = Input;

  window.addEventListener("keydown", (e) => {
    const btn = KEY_MAP[e.code];
    if (!btn) return;
    e.preventDefault();
    if (!e.repeat) Input.press(btn);
  });

  window.addEventListener("keyup", (e) => {
    const btn = KEY_MAP[e.code];
    if (btn) Input.release(btn);
  });

  window.addEventListener("blur", Input.clear);

  document.querySelectorAll("#touch button").forEach((el) => {
    const btn = el.dataset.btn;
    const down = (e) => {
      e.preventDefault();
      el.classList.add("active");
      Input.press(btn);
    };
    const up = (e) => {
      e.preventDefault();
      el.classList.remove("active");
      Input.release(btn);
    };
    el.addEventListener("pointerdown", down);
    el.addEventListener("pointerup", up);
    el.addEventListener("pointercancel", up);
    el.addEventListener("pointerleave", up);
  });
})();
