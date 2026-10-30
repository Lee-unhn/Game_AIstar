// main.js：狀態機與主迴圈。標題 → 選起始 → 走動 → 對戰 → 走動。
// 這是底層檔案。要改請先開 issue。
(function () {
  "use strict";

  let scene = null;
  let fade = null;
  let lastTime = 0;

  // "overworld:resume" 表示從對話或隊伍回到走動，不重播地名橫幅。
  Game.go = function (name, arg) {
    const resume = name === "overworld:resume";
    const real = resume ? "overworld" : name;
    scene = Game.scenes[real];
    Game.sceneName = real;
    if (!resume && scene.enter) scene.enter(arg);
  };

  // 淡出，切換，淡入。切換期間不吃按鍵。
  Game.fade = function (atMiddle, color = "#000000") {
    fade = { ms: 0, total: 420, color, atMiddle, switched: false };
  };

  Game.isFading = () => !!fade;

  function updateFade(dt) {
    fade.ms += dt;
    if (!fade.switched && fade.ms >= fade.total / 2) {
      fade.switched = true;
      fade.atMiddle();
    }
    if (fade.ms >= fade.total) fade = null;
  }

  function drawFade() {
    const half = fade.total / 2;
    const alpha = fade.ms < half ? fade.ms / half : 1 - (fade.ms - half) / half;
    const ctx = Game.Render.ctx;
    ctx.save();
    ctx.globalAlpha = Math.max(0, Math.min(1, alpha));
    ctx.fillStyle = fade.color;
    ctx.fillRect(0, 0, Game.WIDTH, Game.HEIGHT);
    ctx.restore();
  }

  function frame(now) {
    const dt = Math.min(50, now - lastTime || 16);
    lastTime = now;
    if (fade) updateFade(dt);
    else if (scene.update) scene.update(dt);
    scene.draw();
    if (fade) drawFade();
    Game.Input.endFrame();
    requestAnimationFrame(frame);
  }

  // ---- 標題 ----
  const stars = Array.from({ length: 70 }, (_, i) => ({
    x: (i * 137) % Game.WIDTH,
    y: (i * 89) % 200,
    phase: i * 0.7,
  }));
  let titleItems = [];
  let titleCursor = 0;
  let titleClock = 0;

  Game.scenes.title = {
    enter() {
      titleCursor = 0;
      titleItems = Game.Save.read()
        ? [{ label: "繼續冒險", action: "continue" }, { label: "新的冒險", action: "new" }]
        : [{ label: "開始冒險", action: "new" }];
    },
    update(dt) {
      const I = Game.Input;
      titleClock += dt;
      const count = titleItems.length;
      if (I.pressed("up")) titleCursor = (titleCursor + count - 1) % count;
      if (I.pressed("down")) titleCursor = (titleCursor + 1) % count;
      if (!I.pressed("confirm")) return;
      if (titleItems[titleCursor].action === "continue") {
        Game.state = Game.Save.read() || Game.newState();
        Game.fade(() => Game.go(Game.state.party.length ? "overworld" : "starter"));
      } else {
        Game.state = Game.newState();
        Game.fade(() => Game.go("starter"));
      }
    },
    draw() {
      const R = Game.Render;
      R.rect(0, 0, Game.WIDTH, Game.HEIGHT, "#1a2350");
      R.rect(0, 210, Game.WIDTH, 110, "#26357a");
      stars.forEach((s) => {
        if (Math.sin(titleClock / 400 + s.phase) > -0.2) R.rect(s.x, s.y, 2, 2, "#ffe9a8");
      });
      R.text("AI 星靈物語", Game.WIDTH / 2, 62, { size: 42, align: "center", color: "#ffe27a", shadow: "#8a4b2a" });
      R.text("AI Star", Game.WIDTH / 2, 116, { size: 18, align: "center", color: "#cfe0ff" });

      const boxH = 22 + titleItems.length * 28;
      R.box(160, 158, 160, boxH);
      titleItems.forEach((item, i) => {
        const y = 170 + i * 28;
        R.text(item.label, 198, y);
        if (i === titleCursor) R.cursor(178, y + 3);
      });
      const count = "收錄 星靈 " + Game.monsterIds.length + "　招式 " + Game.moveIds.length + "　地圖 " + Game.mapIds.length;
      R.text(count, Game.WIDTH / 2, 280, { size: 14, align: "center", color: "#cfe0ff" });
    },
  };

  // ---- 選起始 ----
  let starters = [];
  let starterCursor = 0;

  Game.scenes.starter = {
    enter() {
      starters = Game.monsterIds.filter((id) => Game.monsters[id].starter);
      starterCursor = 0;
    },
    update() {
      const I = Game.Input;
      const count = starters.length;
      if (I.pressed("left") || I.pressed("up")) starterCursor = (starterCursor + count - 1) % count;
      if (I.pressed("right") || I.pressed("down")) starterCursor = (starterCursor + 1) % count;
      if (I.pressed("confirm")) {
        Game.state.party = [Game.createMonster(starters[starterCursor], Game.START_LEVEL)];
        Game.Save.write();
        Game.fade(() => Game.go("overworld"));
      }
    },
    draw() {
      const R = Game.Render;
      R.rect(0, 0, Game.WIDTH, Game.HEIGHT, "#d7e6f7");
      R.text("選一隻星靈，一起出發", Game.WIDTH / 2, 18, { size: 20, align: "center", color: "#2c3e66" });

      // 起始星靈超過 3 隻時，畫面捲動，只顯示游標附近 3 隻
      const first = Math.max(0, Math.min(starters.length - 3, starterCursor - 1));
      starters.slice(first, first + 3).forEach((id, offset) => {
        const i = first + offset;
        const species = Game.monsters[id];
        const x = 24 + offset * 148;
        R.box(x, 54, 136, 126);
        if (i === starterCursor) R.rect(x, 54, 136, 4, R.COLORS.select);
        R.sprite(species.sprite, x + 36, 66, 4);
        R.text(species.name, x + 68, 134, { align: "center" });
        R.typeLabel(species.type, x + 55, 155);
      });

      const chosen = Game.monsters[starters[starterCursor]];
      R.messageBox(R.wrap(chosen.description, Game.WIDTH - 40).slice(0, 3));
    },
  };

  // 載入器全部跑完後呼叫這裡
  Game.start = function () {
    Game.Render.resize();
    Game.go("title");
    requestAnimationFrame(frame);
  };

  Game.showLoadErrors = function () {
    if (!Game.loadErrors.length) return;
    const el = document.getElementById("load-errors");
    el.hidden = false;
    el.textContent = "資料檔有問題：" + Game.loadErrors.join("；");
    Game.Render.resize();
  };
})();
