// 測 js/rules.js。規則是純函式，不用開瀏覽器。
import test from "node:test";
import assert from "node:assert/strict";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const Rules = require("../js/rules.js");

const SPECIES = {
  id: "test_beast",
  baseStats: { hp: 50, atk: 50, def: 50, spd: 50 },
  learnset: [
    { level: 1, move: "a" },
    { level: 1, move: "b" },
    { level: 3, move: "c" },
    { level: 5, move: "d" },
    { level: 7, move: "e" },
  ],
};

test("屬性倍率：焰克森、森克潮、潮克焰", () => {
  assert.equal(Rules.typeMultiplier("焰", "森"), 2);
  assert.equal(Rules.typeMultiplier("森", "潮"), 2);
  assert.equal(Rules.typeMultiplier("潮", "焰"), 2);
});

test("屬性倍率：被剋的一方只有 0.5 倍", () => {
  assert.equal(Rules.typeMultiplier("森", "焰"), 0.5);
  assert.equal(Rules.typeMultiplier("潮", "森"), 0.5);
  assert.equal(Rules.typeMultiplier("焰", "潮"), 0.5);
});

test("屬性倍率：光和影互剋，雙方都是 2 倍", () => {
  assert.equal(Rules.typeMultiplier("光", "影"), 2);
  assert.equal(Rules.typeMultiplier("影", "光"), 2);
});

test("屬性倍率：沒有關係的屬性和同屬性都是 1 倍", () => {
  assert.equal(Rules.typeMultiplier("焰", "焰"), 1);
  assert.equal(Rules.typeMultiplier("焰", "光"), 1);
  assert.equal(Rules.typeMultiplier("光", "潮"), 1);
});

test("傷害下限：再弱的攻擊也至少 1 點", () => {
  const dealt = Rules.damage({ level: 1, power: 1, attack: 1, defense: 999, multiplier: 0.5, rng: () => 0 });
  assert.equal(dealt, 1);
});

test("傷害：屬性倍率確實會放大傷害", () => {
  const base = { level: 10, power: 50, attack: 30, defense: 20, rng: () => 1 };
  const normal = Rules.damage({ ...base, multiplier: 1 });
  const strong = Rules.damage({ ...base, multiplier: 2 });
  const weak = Rules.damage({ ...base, multiplier: 0.5 });
  assert.ok(strong > normal && normal > weak, `${strong} ${normal} ${weak}`);
});

test("傷害：亂數只影響 0.85 到 1 倍的範圍", () => {
  const base = { level: 10, power: 50, attack: 30, defense: 20, multiplier: 1 };
  const low = Rules.damage({ ...base, rng: () => 0 });
  const high = Rules.damage({ ...base, rng: () => 1 });
  assert.ok(low < high);
  assert.ok(low >= Math.floor(high * 0.85) - 1);
});

test("捕捉率：任何輸入都落在 0.05 到 0.95", () => {
  for (const rate of [1, 45, 120, 255]) {
    for (const hp of [0, 1, 10, 50, 100, 999]) {
      const chance = Rules.catchChance(rate, hp, 100);
      assert.ok(chance >= 0.05 && chance <= 0.95, `rate=${rate} hp=${hp} chance=${chance}`);
    }
  }
});

test("捕捉率：血越少越好抓", () => {
  assert.ok(Rules.catchChance(120, 5, 100) > Rules.catchChance(120, 100, 100));
});

test("逃跑率：落在 0.3 到 0.95，跑得快比較容易", () => {
  assert.ok(Rules.fleeChance(100, 10) <= 0.95);
  assert.ok(Rules.fleeChance(1, 100) >= 0.3);
  assert.ok(Rules.fleeChance(50, 20) > Rules.fleeChance(20, 50));
});

test("升級門檻：剛好夠就升，少 1 點就不升", () => {
  for (let level = 2; level <= Rules.MAX_LEVEL; level += 1) {
    assert.equal(Rules.levelForExp(Rules.expForLevel(level)), level);
    assert.equal(Rules.levelForExp(Rules.expForLevel(level) - 1), level - 1);
  }
});

test("升級門檻：等級不會超過上限", () => {
  assert.equal(Rules.levelForExp(Number.MAX_SAFE_INTEGER), Rules.MAX_LEVEL);
});

test("能力值：等級越高越強", () => {
  const low = Rules.statsFor(SPECIES, 5);
  const high = Rules.statsFor(SPECIES, 20);
  for (const key of ["maxHp", "atk", "def", "spd"]) assert.ok(high[key] > low[key], key);
});

test("招式：最多 4 個，學新招時忘掉最舊的", () => {
  assert.deepEqual(Rules.learnedMoves(SPECIES, 1), ["a", "b"]);
  assert.deepEqual(Rules.learnedMoves(SPECIES, 7), ["b", "c", "d", "e"]);
  assert.deepEqual(Rules.addMove(["a", "b", "c", "d"], "e"), ["b", "c", "d", "e"]);
  assert.deepEqual(Rules.addMove(["a", "b"], "a"), ["a", "b"]);
});

test("新建的星靈：血量全滿，經驗對應等級", () => {
  const mon = Rules.createInstance(SPECIES, 5);
  assert.equal(mon.hp, Rules.statsFor(SPECIES, 5).maxHp);
  assert.equal(Rules.levelForExp(mon.exp), 5);
});

test("權重抽選：只抽得到權重大於 0 的項目", () => {
  const list = [{ id: "x", weight: 0 }, { id: "y", weight: 5 }];
  for (const roll of [0, 0.5, 0.999]) {
    assert.equal(Rules.pickWeighted(list, () => roll).id, "y");
  }
});
