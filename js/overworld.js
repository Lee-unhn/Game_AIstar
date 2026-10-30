// overworld.js：走動、地圖切換、草叢遇怪、NPC 對話、隊伍畫面。
// 這是底層檔案。要改請先開 issue。
(function () {
  "use strict";

  const STEP_MS = 170;
  const VIEW_W = Game.WIDTH;
  const VIEW_H = Game.HEIGHT;
  const DELTAS = {
    up: { x: 0, y: -1 },
    down: { x: 0, y: 1 },
    left: { x: -1, y: 0 },
    right: { x: 1, y: 0 },
  };
  const OPPOSITE = { up: "down", down: "up", left: "right", right: "left" };

  // 角色點陣：H 頭髮、S 皮膚、E 眼睛、C 上衣、P 褲子、B 鞋
  const BODY = [
    "...CCCCCCCCCC...",
    "..SCCCCCCCCCCS..",
    "..SCCCCCCCCCCS..",
    "...CCCCCCCCCC...",
    "...PPPPPPPPPP...",
  ];
  const LEGS = [
    ["...PPP....PPP...", "...BBB....BBB...", "................"],
    ["...PPP.....PP...", "...BBB.....BB...", "..........BB...."],
    ["...PP.....PPP...", "...BB.....BBB...", "....BB.........."],
  ];
  const HEADS = {
    down: [
      "....HHHHHHHH....",
      "...HHHHHHHHHH...",
      "...HHHHHHHHHH...",
      "...HSSSSSSSSH...",
      "...SSESSSSESS...",
      "...SSSSSSSSSS...",
      "....SSSSSSSS....",
    ],
    up: [
      "....HHHHHHHH....",
      "...HHHHHHHHHH...",
      "...HHHHHHHHHH...",
      "...HHHHHHHHHH...",
      "...HHHHHHHHHH...",
      "...HHHHHHHHHH...",
      "....SSSSSSSS....",
    ],
    side: [
      "....HHHHHHHH....",
      "...HHHHHHHHHH...",
      "...HHHHHHHHHH...",
      "...HHHSSSSSSS...",
      "...HHSSSSSESS...",
      "...HSSSSSSSSS...",
      "....SSSSSSSS....",
    ],
  };
  const PALETTES = {
    hero: { H: "#3b2f5c", S: "#f4cfa8", E: "#22202e", C: "#d9483b", P: "#37508f", B: "#26262e" },
    healer: { H: "#e88fb0", S: "#f4cfa8", E: "#22202e", C: "#ffffff", P: "#e88fb0", B: "#8c4d68" },
    villager: { H: "#6b4a2b", S: "#e8bb92", E: "#22202e", C: "#3f9c57", P: "#6b5a3e", B: "#3a2f22" },
  };

  const spriteCache = {};
  function personSprite(paletteName, dir, frame) {
    const key = paletteName + dir + frame;
    if (!spriteCache[key]) {
      const head = HEADS[dir === "left" || dir === "right" ? "side" : dir];
      spriteCache[key] = {
        palette: PALETTES[paletteName],
        rows: [...head, ...BODY, ...LEGS[frame], "................"].slice(0, 16),
      };
    }
    return spriteCache[key];
  }

  let step = null;
  let walkFrame = 0;
  let bannerMs = 0;
  let npcFacing = {};

  const currentMap = () => Game.maps[Game.state.player.mapId];

  function tileAt(map, x, y) {
    if (y < 0 || y >= map.tiles.length) return null;
    const row = map.tiles[y];
    if (x < 0 || x >= row.length) return null;
    return Game.Tiles[row[x]] || null;
  }

  const npcAt = (map, x, y) => (map.npcs || []).find((n) => n.x === x && n.y === y) || null;

  function canStandOn(map, x, y) {
    const tile = tileAt(map, x, y);
    return !!tile && tile.walkable && !npcAt(map, x, y);
  }

  function tryEncounter(map) {
    const list = (map.encounters || []).filter((e) => Game.monsters[e.monster]);
    if (!list.length || Math.random() >= (map.encounterRate || 0)) return false;
    const pick = Game.Rules.pickWeighted(list);
    const level = Game.Rules.randInt(pick.minLevel, pick.maxLevel);
    Game.fade(() => Game.go("battle", Game.createMonster(pick.monster, level)), "#ffffff");
    return true;
  }

  function finishStep() {
    const p = Game.state.player;
    const map = currentMap();
    Game.Save.write();

    const exit = (map.exits || []).find((e) => e.x === p.x && e.y === p.y);
    if (exit && Game.maps[exit.toMap]) {
      Game.fade(() => {
        p.mapId = exit.toMap;
        p.x = exit.toX;
        p.y = exit.toY;
        Game.Save.write();
        Game.go("overworld");
      });
      return;
    }
    const tile = tileAt(map, p.x, p.y);
    if (tile && tile.encounter) tryEncounter(map);
  }

  function interact() {
    const p = Game.state.player;
    const map = currentMap();
    const d = DELTAS[p.dir];
    const npc = npcAt(map, p.x + d.x, p.y + d.y);
    if (!npc) return;
    npcFacing[map.npcs.indexOf(npc)] = OPPOSITE[p.dir];
    let text = npc.text;
    if (npc.heal) {
      Game.healParty();
      Game.Save.write();
      text += "\n（隊伍全部恢復了，星晶補到 " + Game.state.crystals + " 顆。）";
    }
    Game.go("dialog", { text });
  }

  function drawWorld() {
    const R = Game.Render;
    const map = currentMap();
    const p = Game.state.player;
    const t = Game.TILE;
    const mapW = map.tiles[0].length * t;
    const mapH = map.tiles.length * t;

    let px = p.x * t;
    let py = p.y * t;
    if (step) {
      const k = 1 - step.ms / STEP_MS;
      px = (p.x - DELTAS[p.dir].x * (1 - k)) * t;
      py = (p.y - DELTAS[p.dir].y * (1 - k)) * t;
    }

    const camX = mapW <= VIEW_W ? (mapW - VIEW_W) / 2 : Math.max(0, Math.min(mapW - VIEW_W, px + t / 2 - VIEW_W / 2));
    const camY = mapH <= VIEW_H ? (mapH - VIEW_H) / 2 : Math.max(0, Math.min(mapH - VIEW_H, py + t / 2 - VIEW_H / 2));

    R.rect(0, 0, VIEW_W, VIEW_H, "#20304a");
    const firstX = Math.floor(camX / t);
    const firstY = Math.floor(camY / t);
    for (let y = firstY; y <= firstY + 11; y += 1) {
      for (let x = firstX; x <= firstX + 16; x += 1) {
        const tile = tileAt(map, x, y);
        if (tile) R.sprite(tile.sprite, x * t - camX, y * t - camY, 2);
      }
    }

    (map.exits || []).forEach((e) => {
      const ex = e.x * t - camX + t / 2;
      const ey = e.y * t - camY + t / 2;
      R.ctx.fillStyle = "rgba(255,255,255,0.75)";
      R.ctx.fillRect(Math.round(ex - 7), Math.round(ey - 7), 14, 14);
      R.text("出", ex, ey - 7, { size: 13, align: "center", color: "#2c3e66" });
    });

    const people = (map.npcs || []).map((npc, i) => ({
      y: npc.y * t,
      draw() {
        const sprite = personSprite(npc.heal ? "healer" : "villager", npcFacing[i] || "down", 0);
        R.sprite(sprite, npc.x * t - camX, npc.y * t - camY, 2);
      },
    }));
    people.push({
      y: py,
      draw() {
        const frame = step ? (walkFrame % 2) + 1 : 0;
        R.sprite(personSprite("hero", p.dir, frame), px - camX, py - camY, 2, { flip: p.dir === "left" });
      },
    });
    people.sort((a, b) => a.y - b.y).forEach((who) => who.draw());

    if (bannerMs > 0) {
      const width = Math.max(120, R.ctx.measureText(map.name).width + 60);
      R.box(8, 8, width, 38);
      R.text(map.name, 8 + width / 2, 17, { align: "center" });
    }
  }

  Game.Overworld = {
    canStandOn,
    tileAt,
    isMoving: () => !!step,
  };

  Game.scenes.overworld = {
    enter() {
      step = null;
      bannerMs = 1600;
      npcFacing = {};
    },

    update(dt) {
      const I = Game.Input;
      if (bannerMs > 0) bannerMs -= dt;

      if (step) {
        step.ms -= dt;
        if (step.ms <= 0) {
          step = null;
          finishStep();
        }
        return;
      }

      if (I.pressed("confirm")) { interact(); return; }
      if (I.pressed("cancel")) { Game.go("party"); return; }

      const dir = I.dir();
      if (!dir) return;
      const p = Game.state.player;
      p.dir = dir;
      const nx = p.x + DELTAS[dir].x;
      const ny = p.y + DELTAS[dir].y;
      if (canStandOn(currentMap(), nx, ny)) {
        p.x = nx;
        p.y = ny;
        step = { ms: STEP_MS };
        walkFrame += 1;
      }
    },

    draw: drawWorld,
  };

  // 對話：文字框一次顯示 3 行，按確認翻頁。
  let dialogPages = [];
  Game.scenes.dialog = {
    enter({ text }) {
      const lines = Game.Render.wrap(text, Game.WIDTH - 40);
      dialogPages = [];
      for (let i = 0; i < lines.length; i += 3) dialogPages.push(lines.slice(i, i + 3));
    },
    update() {
      const I = Game.Input;
      if (!I.pressed("confirm") && !I.pressed("cancel")) return;
      dialogPages.shift();
      if (!dialogPages.length) Game.go("overworld:resume");
    },
    draw() {
      drawWorld();
      Game.Render.messageBox(dialogPages[0] || []);
    },
  };

  // 隊伍：看狀態、把選到的星靈換到第一位（第一位先上場）。
  let partyCursor = 0;
  let partyNote = "";
  Game.scenes.party = {
    enter() {
      partyCursor = 0;
      partyNote = "按確認把這隻換到第一位，按取消離開。";
    },
    update() {
      const I = Game.Input;
      const party = Game.state.party;
      if (I.pressed("cancel")) { Game.go("overworld:resume"); return; }
      if (I.pressed("left") || I.pressed("up")) partyCursor = (partyCursor + party.length - 1) % party.length;
      if (I.pressed("right") || I.pressed("down")) partyCursor = (partyCursor + 1) % party.length;
      if (I.pressed("confirm")) {
        const chosen = party[partyCursor];
        if (chosen.hp <= 0) {
          partyNote = "這隻已經倒下，先找鎮上的照護員。";
        } else {
          party.splice(partyCursor, 1);
          party.unshift(chosen);
          partyCursor = 0;
          partyNote = Game.monsters[chosen.species].name + " 換到第一位了。";
          Game.Save.write();
        }
      }
    },
    draw() {
      const R = Game.Render;
      R.rect(0, 0, VIEW_W, VIEW_H, "#34457a");
      R.text("我的隊伍", 16, 10, { color: "#ffffff", shadow: "#1b2138", size: 18 });
      R.text("星晶 " + Game.state.crystals + " 顆", VIEW_W - 16, 12, { color: "#ffffff", shadow: "#1b2138", align: "right" });
      Game.state.party.forEach((m, i) => {
        const species = Game.monsters[m.species];
        const stats = Game.statsOf(m);
        const x = 10 + (i % 2) * 234;
        const y = 38 + Math.floor(i / 2) * 76;
        R.box(x, y, 226, 72);
        R.sprite(species.sprite, x + 10, y + 12, 3);
        R.text(species.name, x + 64, y + 10);
        R.text("Lv." + m.level, x + 214, y + 10, { align: "right", size: 14 });
        R.typeLabel(species.type, x + 64, y + 30);
        R.bar(x + 96, y + 35, 118, 8, m.hp / stats.maxHp, R.hpColor(m.hp / stats.maxHp));
        R.text(m.hp + " / " + stats.maxHp, x + 214, y + 47, { align: "right", size: 13 });
        if (i === partyCursor) R.cursor(x - 2, y + 28);
      });
      R.text(partyNote, 16, VIEW_H - 26, { color: "#ffffff", shadow: "#1b2138", size: 14 });
    },
  };
})();
