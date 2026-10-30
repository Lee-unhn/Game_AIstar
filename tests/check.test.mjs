// 證明 tools/check.mjs 真的會擋壞東西，不是空跑的綠燈。
// 做法：把 repo 複製到暫存資料夾，弄壞一個地方，確認 check 失敗並指出那個檔。
import test from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { appendFileSync, cpSync, mkdtempSync, readFileSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { basename, dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import vm from "node:vm";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const CHECK = join(ROOT, "tools", "check.mjs");

function runCheck(dir) {
  const result = spawnSync(process.execPath, [CHECK, dir], { encoding: "utf8" });
  return { code: result.status, out: result.stdout + result.stderr };
}

function withCopy(fn) {
  const dir = mkdtempSync(join(tmpdir(), "aistar-check-"));
  try {
    cpSync(ROOT, dir, {
      recursive: true,
      filter: (src) => !["node_modules", ".git"].includes(basename(src)),
    });
    fn(dir);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}

function readData(dir, folder, kind, name) {
  let def;
  const Game = { [`register${kind}`]: (d) => { def = d; } };
  vm.runInNewContext(readFileSync(join(dir, "data", folder, name), "utf8"), { Game });
  return JSON.parse(JSON.stringify(def));
}

const nextName = (dir, folder) => {
  const last = readdirSync(join(dir, "data", folder)).sort().pop();
  return String(Number(last.slice(0, 3)) + 1).padStart(3, "0") + ".js";
};

function addMonster(dir, def, name = nextName(dir, "monsters")) {
  writeFileSync(join(dir, "data", "monsters", name), `Game.registerMonster(${JSON.stringify(def)});\n`);
  return name;
}

test("沒弄壞的副本會通過（確認下面的失敗不是別的原因造成）", () => {
  withCopy((dir) => {
    const { code, out } = runCheck(dir);
    assert.equal(code, 0, out);
    assert.match(out, /檢查通過/);
  });
});

test("壞 sprite：某一列少一個字元會被擋", () => {
  withCopy((dir) => {
    const def = readData(dir, "monsters", "Monster", "001.js");
    def.id = "broken_sprite";
    def.sprite.rows[4] = def.sprite.rows[4].slice(1);
    const name = addMonster(dir, def);
    const { code, out } = runCheck(dir);
    assert.equal(code, 1, out);
    assert.match(out, new RegExp(`data/monsters/${name}`));
    assert.match(out, /第 5 列要剛好 16 個字元/);
  });
});

test("壞 sprite：用了 palette 沒有的字元會被擋", () => {
  withCopy((dir) => {
    const def = readData(dir, "monsters", "Monster", "001.js");
    def.id = "broken_palette";
    def.sprite.rows[0] = "Q" + def.sprite.rows[0].slice(1);
    addMonster(dir, def);
    const { code, out } = runCheck(dir);
    assert.equal(code, 1, out);
    assert.match(out, /字元「Q」沒有寫在 palette/);
  });
});

test("重複 id 會被擋", () => {
  withCopy((dir) => {
    const def = readData(dir, "monsters", "Monster", "001.js");
    const name = addMonster(dir, def);
    const { code, out } = runCheck(dir);
    assert.equal(code, 1, out);
    assert.match(out, new RegExp(`data/monsters/${name}`));
    assert.match(out, new RegExp(`id「${def.id}」和 data/monsters/001.js 重複`));
  });
});

test("黑名單字會被擋", () => {
  withCopy((dir) => {
    const word = JSON.parse(readFileSync(join(ROOT, "tools", "banned-words.json"), "utf8")).words[0];
    appendFileSync(join(dir, "README.md"), `\n${word}\n`);
    const { code, out } = runCheck(dir);
    assert.equal(code, 1, out);
    assert.match(out, /README\.md 第 \d+ 行/);
    assert.ok(out.includes(`「${word}」`), out);
  });
});

test("黑名單裡的英文字不分大小寫", () => {
  withCopy((dir) => {
    const words = JSON.parse(readFileSync(join(ROOT, "tools", "banned-words.json"), "utf8")).words;
    const english = words.find((w) => /^[A-Za-z]+$/.test(w));
    writeFileSync(join(dir, "notes.txt"), english.toUpperCase() + "\n");
    const { code, out } = runCheck(dir);
    assert.equal(code, 1, out);
    assert.match(out, /notes\.txt 第 1 行/);
  });
});

test("假金鑰會被擋", () => {
  const samples = [
    "AI" + "za" + "Sy" + "A".repeat(33),
    "ghp" + "_" + "b".repeat(36),
    "AQ" + "." + "c".repeat(40),
    "https://discord.com/api/" + "webhooks/123456789/abcdef",
  ];
  for (const sample of samples) {
    withCopy((dir) => {
      writeFileSync(join(dir, "notes.txt"), `key = ${sample}\n`);
      const { code, out } = runCheck(dir);
      assert.equal(code, 1, `${sample}\n${out}`);
      assert.match(out, /notes\.txt 第 1 行/);
    });
  }
});

test("招式引用不存在的 id 會被擋", () => {
  withCopy((dir) => {
    const def = readData(dir, "monsters", "Monster", "001.js");
    def.id = "broken_ref";
    def.learnset[0].move = "no_such_move";
    addMonster(dir, def);
    const { code, out } = runCheck(dir);
    assert.equal(code, 1, out);
    assert.match(out, /招式「no_such_move」不存在/);
  });
});

test("地圖 spawn 放在不能走的格子會被擋", () => {
  withCopy((dir) => {
    const def = readData(dir, "maps", "Map", "001.js");
    def.spawn = { x: 0, y: 0 };
    writeFileSync(join(dir, "data", "maps", "001.js"), `Game.registerMap(${JSON.stringify(def)});\n`);
    const { code, out } = runCheck(dir);
    assert.equal(code, 1, out);
    assert.match(out, /spawn 的位置 \(0, 0\)/);
  });
});

test("缺號超過 19 個會被擋，19 個以內只提醒", () => {
  withCopy((dir) => {
    const def = readData(dir, "monsters", "Monster", "001.js");
    def.id = "far_away";
    const last = Number(nextName(dir, "monsters").slice(0, 3)) - 1;
    const tooFar = String(last + 21).padStart(3, "0") + ".js";
    addMonster(dir, def, tooFar);
    const { code, out } = runCheck(dir);
    assert.equal(code, 1, out);
    assert.match(out, /缺號超過 19 個/);
  });
  withCopy((dir) => {
    const def = readData(dir, "monsters", "Monster", "001.js");
    def.id = "near_enough";
    const last = Number(nextName(dir, "monsters").slice(0, 3)) - 1;
    addMonster(dir, def, String(last + 20).padStart(3, "0") + ".js");
    const { code, out } = runCheck(dir);
    assert.equal(code, 0, out);
    assert.match(out, /缺了 19 號/);
  });
});

test("語法錯誤的資料檔會被擋", () => {
  withCopy((dir) => {
    const name = nextName(dir, "moves");
    writeFileSync(join(dir, "data", "moves", name), "Game.registerMove({ id: ");
    const { code, out } = runCheck(dir);
    assert.equal(code, 1, out);
    assert.match(out, new RegExp(`data/moves/${name}.*語法`));
  });
});

test("引擎用 fetch 會被擋，因為雙擊開啟時沒有網路請求可用", () => {
  withCopy((dir) => {
    const call = "fet" + "ch('x.json');\n";
    appendFileSync(join(dir, "js", "main.js"), call);
    const { code, out } = runCheck(dir);
    assert.equal(code, 1, out);
    assert.match(out, /js\/main\.js 第 \d+ 行/);
  });
});
