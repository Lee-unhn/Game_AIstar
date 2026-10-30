// core.js：Game 全域物件、資料註冊、遊戲狀態。
// 這是底層檔案。要改請先開 issue。
(function () {
  "use strict";

  const Game = {
    WIDTH: 480,
    HEIGHT: 320,
    TILE: 32,
    START_LEVEL: 5,
    PARTY_MAX: 6,
    CRYSTAL_MAX: 5,

    monsters: {},
    moves: {},
    maps: {},
    monsterIds: [],
    moveIds: [],
    mapIds: [],

    loadErrors: [],
    registeredFiles: new Set(),
    state: null,
    scenes: {},
    sceneName: "",
  };
  window.Game = Game;

  function register(store, order, label, def) {
    const src = document.currentScript ? document.currentScript.src : "";
    if (!def || typeof def.id !== "string" || !def.id) {
      Game.loadErrors.push(label + "資料少了 id：" + src);
      return;
    }
    if (store[def.id]) {
      Game.loadErrors.push(label + "的 id 重複了：" + def.id);
      return;
    }
    store[def.id] = def;
    order.push(def.id);
    if (src) Game.registeredFiles.add(src);
  }

  Game.registerMonster = (def) => register(Game.monsters, Game.monsterIds, "星靈", def);
  Game.registerMove = (def) => register(Game.moves, Game.moveIds, "招式", def);
  Game.registerMap = (def) => register(Game.maps, Game.mapIds, "地圖", def);

  // 編號最小的地圖就是起始地圖，也是全滅時回去的地方。
  Game.startMap = () => Game.maps[Game.mapIds[0]];

  Game.newState = function () {
    const start = Game.startMap();
    return {
      player: { mapId: start.id, x: start.spawn.x, y: start.spawn.y, dir: "down" },
      party: [],
      crystals: Game.CRYSTAL_MAX,
    };
  };

  Game.createMonster = (speciesId, level) =>
    Game.Rules.createInstance(Game.monsters[speciesId], level);

  Game.statsOf = (monster) =>
    Game.Rules.statsFor(Game.monsters[monster.species], monster.level);

  Game.healParty = function () {
    Game.state.party.forEach((m) => { m.hp = Game.statsOf(m).maxHp; });
    Game.state.crystals = Math.max(Game.state.crystals, Game.CRYSTAL_MAX);
  };

  Game.sendToStart = function () {
    const start = Game.startMap();
    const p = Game.state.player;
    p.mapId = start.id;
    p.x = start.spawn.x;
    p.y = start.spawn.y;
    p.dir = "down";
  };
})();
