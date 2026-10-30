// battle.js：對戰畫面。流程是一串「步驟」：每步顯示一句話，順便做一件事。
// 計算全部交給 rules.js，這裡只管順序和畫面。
// 這是底層檔案。要改請先開 issue。
(function () {
  "use strict";

  const Rules = Game.Rules;
  const CAPTURE_MS = 1100;
  const MENU_ITEMS = ["戰鬥", "星晶", "逃跑"];

  const B = {
    phase: "idle",
    message: "",
    queue: [],
    me: null,
    enemy: null,
    menuCursor: 0,
    moveCursor: 0,
    myHpShown: 0,
    enemyHpShown: 0,
    shakeMs: 0,
    shakeSide: "",
    enemyVisible: true,
    captureMs: 0,
    captureWorks: false,
    ended: false,
  };
  Game.Battle = B;

  const speciesOf = (m) => Game.monsters[m.species];
  const nameOf = (m) => speciesOf(m).name;
  const firstAlive = () => Game.state.party.find((m) => m.hp > 0) || null;

  const say = (text, fn) => ({ text, fn });
  const act = (fn) => ({ text: null, fn });
  const pushFront = (steps) => { B.queue = steps.concat(B.queue); };

  function next() {
    while (B.queue.length) {
      const step = B.queue.shift();
      if (step.text !== null) B.message = step.text;
      if (step.fn) step.fn();
      if (B.ended) return;
      if (step.text !== null) return;
    }
    if (!B.ended) {
      B.phase = "menu";
      B.message = nameOf(B.me) + " 要怎麼做？";
    }
  }

  // 預設留在原地圖繼續走。全滅時換了地圖，要重新進場。
  function finish(nextScene = "overworld:resume") {
    B.ended = true;
    B.phase = "ended";
    Game.Save.write();
    Game.fade(() => Game.go(nextScene));
  }

  function attackStep(attacker, defender, moveId) {
    const move = Game.moves[moveId];
    return say(nameOf(attacker) + " 使出了「" + move.name + "」！", () => {
      if (!Rules.rollHit(move.accuracy)) {
        pushFront([say("可是沒有打中。")]);
        return;
      }
      const multiplier = Rules.typeMultiplier(move.type, speciesOf(defender).type);
      const dealt = Rules.damage({
        level: attacker.level,
        power: move.power,
        attack: Game.statsOf(attacker).atk,
        defense: Game.statsOf(defender).def,
        multiplier,
      });
      defender.hp = Math.max(0, defender.hp - dealt);
      B.shakeMs = 280;
      B.shakeSide = defender === B.enemy ? "enemy" : "me";

      const follow = [];
      if (multiplier > 1) follow.push(say("效果很好！"));
      if (multiplier < 1) follow.push(say("效果不太好。"));
      if (defender.hp <= 0) {
        B.queue = [];
        follow.push(...(defender === B.enemy ? winSteps() : faintSteps()));
      }
      pushFront(follow);
    });
  }

  function enemyTurnStep() {
    return act(() => {
      pushFront([attackStep(B.enemy, B.me, Rules.pickRandom(B.enemy.moves))]);
    });
  }

  function chooseMove(moveId) {
    B.phase = "message";
    const enemyMove = Rules.pickRandom(B.enemy.moves);
    const myFirst = Game.statsOf(B.me).spd >= Game.statsOf(B.enemy).spd;
    const mine = attackStep(B.me, B.enemy, moveId);
    const theirs = attackStep(B.enemy, B.me, enemyMove);
    B.queue = myFirst ? [mine, theirs] : [theirs, mine];
    next();
  }

  function winSteps() {
    const enemy = B.enemy;
    const gain = Rules.expGain(speciesOf(enemy).expYield, enemy.level);
    return [
      say(nameOf(enemy) + " 倒下了。", () => { B.enemyVisible = false; }),
      say(nameOf(B.me) + " 得到 " + gain + " 點經驗。", () => {
        pushFront(applyExp(B.me, gain));
      }),
      act(() => finish()),
    ];
  }

  function applyExp(monster, gain) {
    const steps = [];
    const species = speciesOf(monster);
    const before = monster.level;
    const oldMax = Game.statsOf(monster).maxHp;
    monster.exp += gain;
    monster.level = Rules.levelForExp(monster.exp);
    if (monster.level <= before) return steps;

    monster.hp += Game.statsOf(monster).maxHp - oldMax;
    steps.push(say(nameOf(monster) + " 升到 Lv." + monster.level + " 了！"));
    for (let level = before + 1; level <= monster.level; level += 1) {
      Rules.movesLearnedAt(species, level).forEach((moveId) => {
        if (!Game.moves[moveId] || monster.moves.includes(moveId)) return;
        monster.moves = Rules.addMove(monster.moves, moveId);
        steps.push(say(nameOf(monster) + " 學會了「" + Game.moves[moveId].name + "」！"));
      });
    }
    return steps;
  }

  function faintSteps() {
    const fallen = B.me;
    const steps = [say(nameOf(fallen) + " 倒下了。")];
    const backup = Game.state.party.find((m) => m !== fallen && m.hp > 0);
    if (backup) {
      steps.push(say("上吧，" + nameOf(backup) + "！", () => {
        B.me = backup;
        B.myHpShown = backup.hp;
        B.moveCursor = 0;
      }));
      return steps;
    }
    steps.push(say("隊伍全倒了。"));
    steps.push(say("醒來時，你已經回到鎮上，隊伍也恢復了。", () => {
      Game.healParty();
      Game.sendToStart();
    }));
    steps.push(act(() => finish("overworld")));
    return steps;
  }

  function useCrystal() {
    const state = Game.state;
    if (state.party.length >= Game.PARTY_MAX) {
      B.phase = "message";
      B.queue = [say("隊伍已經滿 " + Game.PARTY_MAX + " 隻，帶不下了。")];
      next();
      return;
    }
    if (state.crystals <= 0) {
      B.phase = "message";
      B.queue = [say("星晶用完了。回鎮上找照護員補。")];
      next();
      return;
    }
    state.crystals -= 1;
    const chance = Rules.catchChance(speciesOf(B.enemy).catchRate, B.enemy.hp, Game.statsOf(B.enemy).maxHp);
    B.captureWorks = Math.random() < chance;
    B.captureMs = CAPTURE_MS;
    B.phase = "capture";
    B.enemyVisible = false;
    B.message = "丟出星晶！";
  }

  function finishCapture() {
    B.phase = "message";
    if (B.captureWorks) {
      B.queue = [
        say("收服了 " + nameOf(B.enemy) + "！", () => { Game.state.party.push(B.enemy); }),
        act(() => finish()),
      ];
    } else {
      B.enemyVisible = true;
      B.queue = [say("星晶裂開了，" + nameOf(B.enemy) + " 跑了出來。"), enemyTurnStep()];
    }
    next();
  }

  function tryFlee() {
    B.phase = "message";
    const chance = Rules.fleeChance(Game.statsOf(B.me).spd, Game.statsOf(B.enemy).spd);
    B.queue = Math.random() < chance
      ? [say("順利逃走了。"), act(() => finish())]
      : [say("沒能逃走。"), enemyTurnStep()];
    next();
  }

  function updateMenu(I) {
    const count = MENU_ITEMS.length;
    if (I.pressed("up") || I.pressed("left")) B.menuCursor = (B.menuCursor + count - 1) % count;
    if (I.pressed("down") || I.pressed("right")) B.menuCursor = (B.menuCursor + 1) % count;
    if (!I.pressed("confirm")) return;
    if (B.menuCursor === 0) {
      B.phase = "moves";
      B.moveCursor = Math.min(B.moveCursor, B.me.moves.length - 1);
    } else if (B.menuCursor === 1) {
      useCrystal();
    } else {
      tryFlee();
    }
  }

  function updateMoves(I) {
    const count = B.me.moves.length;
    if (I.pressed("cancel")) { B.phase = "menu"; return; }
    if (I.pressed("left") || I.pressed("up")) B.moveCursor = (B.moveCursor + count - 1) % count;
    if (I.pressed("right") || I.pressed("down")) B.moveCursor = (B.moveCursor + 1) % count;
    if (I.pressed("confirm")) chooseMove(B.me.moves[B.moveCursor]);
  }

  function approach(shown, target, dt) {
    const speed = (dt / 1000) * 40;
    return shown < target ? Math.min(target, shown + speed) : Math.max(target, shown - speed);
  }

  function drawInfo(monster, x, y, shownHp, showExp) {
    const R = Game.Render;
    const stats = Game.statsOf(monster);
    const h = showExp ? 76 : 56;
    R.box(x, y, 206, h);
    R.text(nameOf(monster), x + 14, y + 10);
    R.text("Lv." + monster.level, x + 192, y + 11, { size: 14, align: "right" });
    const ratio = shownHp / stats.maxHp;
    R.text("HP", x + 14, y + 31, { size: 12, color: R.COLORS.inkSoft });
    R.bar(x + 36, y + 33, 156, 9, ratio, R.hpColor(ratio));
    if (showExp) {
      R.text(Math.ceil(shownHp) + " / " + stats.maxHp, x + 192, y + 45, { size: 13, align: "right" });
      const low = Rules.expForLevel(monster.level);
      const high = Rules.expForLevel(monster.level + 1);
      R.bar(x + 14, y + 62, 178, 6, (monster.exp - low) / (high - low), "#4f8fe0");
    }
  }

  function drawCrystal(cx, cy) {
    const ctx = Game.Render.ctx;
    const wobble = Math.sin((CAPTURE_MS - B.captureMs) / 90) * 5;
    ctx.save();
    ctx.translate(Math.round(cx + wobble), Math.round(cy));
    ctx.fillStyle = "#2c3e66";
    ctx.fillRect(-4, -14, 8, 28);
    ctx.fillRect(-10, -8, 20, 16);
    ctx.fillStyle = "#8fe0ff";
    ctx.fillRect(-2, -12, 4, 24);
    ctx.fillRect(-8, -6, 16, 12);
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(-5, -4, 4, 4);
    ctx.restore();
  }

  function drawBottom() {
    const R = Game.Render;
    if (B.phase === "menu") {
      R.messageBox(R.wrap(B.message, 250).slice(0, 3));
      R.box(290, Game.HEIGHT - 92, 190, 92);
      MENU_ITEMS.forEach((item, i) => {
        const label = i === 1 ? item + "（" + Game.state.crystals + "）" : item;
        const y = Game.HEIGHT - 82 + i * 25;
        R.text(label, 324, y);
        if (i === B.menuCursor) R.cursor(306, y + 3);
      });
      return;
    }
    if (B.phase === "moves") {
      R.box(0, Game.HEIGHT - 92, 330, 92);
      B.me.moves.forEach((moveId, i) => {
        const x = 34 + (i % 2) * 150;
        const y = Game.HEIGHT - 76 + Math.floor(i / 2) * 32;
        R.text(Game.moves[moveId].name, x, y);
        if (i === B.moveCursor) R.cursor(x - 16, y + 3);
      });
      const chosen = Game.moves[B.me.moves[B.moveCursor]];
      R.box(330, Game.HEIGHT - 92, 150, 92);
      R.typeLabel(chosen.type, 346, Game.HEIGHT - 78);
      R.text("威力 " + chosen.power, 346, Game.HEIGHT - 54, { size: 14 });
      R.text("命中 " + chosen.accuracy, 346, Game.HEIGHT - 34, { size: 14 });
      return;
    }
    R.messageBox(R.wrap(B.message, Game.WIDTH - 40).slice(0, 3));
  }

  Game.scenes.battle = {
    enter(enemy) {
      B.enemy = enemy;
      B.me = firstAlive();
      B.phase = "message";
      B.ended = false;
      B.enemyVisible = true;
      B.menuCursor = 0;
      B.moveCursor = 0;
      B.shakeMs = 0;
      B.myHpShown = B.me.hp;
      B.enemyHpShown = enemy.hp;
      B.queue = [
        say("野生的 " + nameOf(enemy) + " 跳出來了！"),
        say("上吧，" + nameOf(B.me) + "！"),
      ];
      next();
    },

    update(dt) {
      const I = Game.Input;
      B.myHpShown = approach(B.myHpShown, B.me.hp, dt);
      B.enemyHpShown = approach(B.enemyHpShown, B.enemy.hp, dt);
      if (B.shakeMs > 0) B.shakeMs -= dt;

      if (B.phase === "menu") updateMenu(I);
      else if (B.phase === "moves") updateMoves(I);
      else if (B.phase === "capture") {
        B.captureMs -= dt;
        if (B.captureMs <= 0) finishCapture();
      } else if (B.phase === "message" && I.pressed("confirm")) {
        next();
      }
    },

    draw() {
      const R = Game.Render;
      R.rect(0, 0, Game.WIDTH, 132, "#bfe6f5");
      R.rect(0, 132, Game.WIDTH, 96, "#a7dc8a");
      R.rect(0, 128, Game.WIDTH, 4, "#8ccf7a");

      R.ctx.fillStyle = "#86c763";
      R.ctx.beginPath();
      R.ctx.ellipse(366, 122, 78, 18, 0, 0, Math.PI * 2);
      R.ctx.ellipse(116, 214, 92, 18, 0, 0, Math.PI * 2);
      R.ctx.fill();

      const jitter = B.shakeMs > 0 ? (Math.floor(B.shakeMs / 40) % 2 ? 4 : -4) : 0;
      if (B.enemyVisible) {
        const dx = B.shakeSide === "enemy" ? jitter : 0;
        R.sprite(speciesOf(B.enemy).sprite, 326 + dx, 44, 5);
      }
      if (B.phase === "capture") drawCrystal(366, 104);
      const myDx = B.shakeSide === "me" ? jitter : 0;
      R.sprite(speciesOf(B.me).sprite, 68 + myDx, 124, 6, { flip: true });

      drawInfo(B.enemy, 16, 18, B.enemyHpShown, false);
      drawInfo(B.me, 262, 142, B.myHpShown, true);
      drawBottom();
    },
  };
})();
