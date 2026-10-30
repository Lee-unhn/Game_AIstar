// rules.js：遊戲規則，全部是純函式。
// 不碰畫面、不碰 Game.state，所以能在 Node 直接測（tests/rules.test.mjs）。
// 需要亂數的函式都收一個 rng 參數，測試時傳固定值進來。
// 這是底層檔案。要改請先開 issue。
(function (root) {
  "use strict";

  const TYPES = ["焰", "森", "潮", "光", "影"];
  const STRONG_AGAINST = {
    焰: ["森"],
    森: ["潮"],
    潮: ["焰"],
    光: ["影"],
    影: ["光"],
  };
  const MAX_LEVEL = 50;
  const MAX_MOVES = 4;

  const clamp = (n, low, high) => Math.min(high, Math.max(low, n));

  // 屬性倍率：剋對方 2 倍，被對方剋 0.5 倍，其餘 1 倍。光和影互剋，雙方都是 2 倍。
  function typeMultiplier(moveType, defenderType) {
    if ((STRONG_AGAINST[moveType] || []).includes(defenderType)) return 2;
    if ((STRONG_AGAINST[defenderType] || []).includes(moveType)) return 0.5;
    return 1;
  }

  function statsFor(species, level) {
    const b = species.baseStats;
    const stat = (base) => Math.floor((base * level) / 25) + 5;
    return {
      maxHp: Math.floor((b.hp * level) / 25) + level + 10,
      atk: stat(b.atk),
      def: stat(b.def),
      spd: stat(b.spd),
    };
  }

  // 傷害：等級、威力、攻防比決定基礎值，再乘上屬性倍率和 0.85 到 1 的亂數。最少 1 點。
  function damage({ level, power, attack, defense, multiplier = 1, rng = Math.random }) {
    const base = Math.floor(((2 * level) / 5 + 2) * power * (attack / Math.max(1, defense)) / 50) + 2;
    const roll = 0.85 + 0.15 * rng();
    return Math.max(1, Math.floor(base * multiplier * roll));
  }

  function rollHit(accuracy, rng = Math.random) {
    return rng() * 100 < accuracy;
  }

  // 捕捉率：血越少越好抓。結果固定落在 0.05 到 0.95 之間。
  function catchChance(catchRate, hp, maxHp) {
    const hpRatio = clamp(hp / Math.max(1, maxHp), 0, 1);
    return clamp((catchRate / 255) * (1 - (2 / 3) * hpRatio) + 0.05, 0.05, 0.95);
  }

  function fleeChance(mySpeed, enemySpeed) {
    return clamp((0.5 * mySpeed) / Math.max(1, enemySpeed) + 0.25, 0.3, 0.95);
  }

  // 經驗：升到第 n 級所需的累積經驗是 n 的三次方。
  const expForLevel = (level) => level * level * level;

  function levelForExp(exp) {
    let level = 1;
    while (level < MAX_LEVEL && expForLevel(level + 1) <= exp) level += 1;
    return level;
  }

  const expGain = (expYield, enemyLevel) => Math.floor((expYield * enemyLevel) / 5) + 1;

  function learnedMoves(species, level) {
    const known = species.learnset
      .filter((entry) => entry.level <= level)
      .sort((a, b) => a.level - b.level)
      .map((entry) => entry.move);
    return known.slice(-MAX_MOVES);
  }

  const movesLearnedAt = (species, level) =>
    species.learnset.filter((entry) => entry.level === level).map((entry) => entry.move);

  // 招式滿 4 個時，忘掉最舊的那個。
  function addMove(moves, moveId) {
    if (moves.includes(moveId)) return moves.slice();
    return moves.concat(moveId).slice(-MAX_MOVES);
  }

  function createInstance(species, level) {
    return {
      species: species.id,
      level,
      exp: expForLevel(level),
      hp: statsFor(species, level).maxHp,
      moves: learnedMoves(species, level),
    };
  }

  function pickRandom(list, rng = Math.random) {
    return list[Math.floor(rng() * list.length)];
  }

  function randInt(min, max, rng = Math.random) {
    return min + Math.floor(rng() * (max - min + 1));
  }

  function pickWeighted(list, rng = Math.random) {
    const total = list.reduce((sum, item) => sum + item.weight, 0);
    let roll = rng() * total;
    for (const item of list) {
      roll -= item.weight;
      if (roll < 0) return item;
    }
    return list[list.length - 1];
  }

  const Rules = {
    TYPES,
    STRONG_AGAINST,
    MAX_LEVEL,
    MAX_MOVES,
    typeMultiplier,
    statsFor,
    damage,
    rollHit,
    catchChance,
    fleeChance,
    expForLevel,
    levelForExp,
    expGain,
    learnedMoves,
    movesLearnedAt,
    addMove,
    createInstance,
    pickRandom,
    randInt,
    pickWeighted,
  };

  if (typeof module !== "undefined" && module.exports) module.exports = Rules;
  if (root && root.Game) root.Game.Rules = Rules;
})(typeof window !== "undefined" ? window : null);
