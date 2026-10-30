// save.js：存檔到瀏覽器的 localStorage。
// 讀不到、壞掉、裡面的星靈已經不存在，都不能讓遊戲當掉，一律當成沒有存檔或修掉壞的部分。
// 這是底層檔案。要改請先開 issue。
(function () {
  "use strict";

  const KEY = "aistar.save.v1";

  function storage() {
    try {
      return window.localStorage;
    } catch (err) {
      return null;
    }
  }

  // 只留下目前遊戲認得的內容
  function sanitizeMonster(raw) {
    if (!raw || !Game.monsters[raw.species]) return null;
    const level = Math.min(Game.Rules.MAX_LEVEL, Math.max(1, Math.floor(Number(raw.level)) || 1));
    const species = Game.monsters[raw.species];
    const maxHp = Game.Rules.statsFor(species, level).maxHp;
    let moves = Array.isArray(raw.moves) ? raw.moves.filter((id) => Game.moves[id]) : [];
    if (!moves.length) moves = Game.Rules.learnedMoves(species, level);
    if (!moves.length) return null;
    const hp = Number(raw.hp);
    const exp = Number(raw.exp);
    return {
      species: raw.species,
      level,
      exp: Number.isFinite(exp) ? exp : Game.Rules.expForLevel(level),
      hp: Number.isFinite(hp) ? Math.min(maxHp, Math.max(0, Math.floor(hp))) : maxHp,
      moves: moves.slice(-Game.Rules.MAX_MOVES),
    };
  }

  function sanitize(raw) {
    if (!raw || !Array.isArray(raw.party)) return null;
    const party = raw.party.map(sanitizeMonster).filter(Boolean).slice(0, Game.PARTY_MAX);
    if (!party.length) return null;

    const state = Game.newState();
    state.party = party;
    const crystals = Number(raw.crystals);
    state.crystals = Number.isFinite(crystals) ? Math.max(0, Math.floor(crystals)) : Game.CRYSTAL_MAX;

    const p = raw.player || {};
    if (Game.maps[p.mapId] && Game.Overworld.canStandOn(Game.maps[p.mapId], p.x, p.y)) {
      state.player = {
        mapId: p.mapId,
        x: p.x,
        y: p.y,
        dir: ["up", "down", "left", "right"].includes(p.dir) ? p.dir : "down",
      };
    }
    // 全隊都倒下的舊存檔要救回來，不然一開場就卡住
    if (!party.some((m) => m.hp > 0)) {
      party.forEach((m) => { m.hp = Game.Rules.statsFor(Game.monsters[m.species], m.level).maxHp; });
    }
    return state;
  }

  Game.Save = {
    write() {
      const store = storage();
      if (!store || !Game.state) return false;
      try {
        store.setItem(KEY, JSON.stringify(Game.state));
        return true;
      } catch (err) {
        return false;
      }
    },

    read() {
      const store = storage();
      if (!store) return null;
      try {
        const text = store.getItem(KEY);
        return text ? sanitize(JSON.parse(text)) : null;
      } catch (err) {
        return null;
      }
    },

    clear() {
      const store = storage();
      if (!store) return;
      try {
        store.removeItem(KEY);
      } catch (err) {
        // 瀏覽器不給動存檔區時，當作沒有存檔繼續玩
      }
    },
  };
})();
