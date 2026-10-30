// check.mjs：機器人檢查員。只用 Node 內建功能，不用安裝任何東西。
// 用法：node tools/check.mjs          檢查這個 repo
//       node tools/check.mjs <資料夾>  檢查指定資料夾（測試用）
// 全部通過結束碼 0，有問題結束碼 1，並用白話指出哪個檔哪一欄。
import { readFileSync, readdirSync, existsSync, statSync } from "node:fs";
import { dirname, join, relative, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";
import vm from "node:vm";

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(process.argv[2] || join(HERE, ".."));
const MAX_GAP = 19;

const errors = [];
const notes = [];
const fail = (where, message) => errors.push(`${where}：${message}`);

const toPosix = (p) => p.split(sep).join("/");
const rel = (p) => toPosix(relative(ROOT, p));

// ---- 把資料檔放進隔離環境跑一次，收集它註冊的內容 ----
function loadDataFile(path, kind) {
  const registered = [];
  const wrong = (name) => () => fail(rel(path), `這個資料夾的檔案要呼叫 Game.register${kind}，不是 ${name}。`);
  const api = {
    registerMonster: wrong("registerMonster"),
    registerMove: wrong("registerMove"),
    registerMap: wrong("registerMap"),
  };
  api[`register${kind}`] = (def) => registered.push(def);
  try {
    vm.runInNewContext(readFileSync(path, "utf8"), { Game: api }, { filename: path, timeout: 1000 });
  } catch (err) {
    fail(rel(path), `檔案跑不起來，多半是語法寫錯。錯誤訊息：${err.message}`);
    return null;
  }
  if (registered.length !== 1) {
    fail(rel(path), `一個檔案要剛好註冊一筆資料，現在是 ${registered.length} 筆。`);
    return null;
  }
  return JSON.parse(JSON.stringify(registered[0]));
}

function loadFolder(folder, kind) {
  const dir = join(ROOT, "data", folder);
  const label = `data/${folder}`;
  if (!existsSync(dir)) {
    fail(label, "資料夾不見了。");
    return [];
  }
  const items = [];
  const numbers = [];
  for (const name of readdirSync(dir).sort()) {
    const where = `${label}/${name}`;
    if (!/^\d{3}\.js$/.test(name)) {
      fail(where, "檔名要是三位數編號加 .js，例如 006.js。");
      continue;
    }
    numbers.push(Number(name.slice(0, 3)));
    const def = loadDataFile(join(dir, name), kind);
    if (def) items.push({ where, def });
  }
  let previous = 0;
  for (const n of numbers) {
    const gap = n - previous - 1;
    if (gap > MAX_GAP) {
      fail(label, `編號 ${previous} 和 ${n} 之間缺了 ${gap} 號。缺號超過 ${MAX_GAP} 個，後面的檔案載入不到。`);
    } else if (gap > 0) {
      notes.push(`${label}：編號 ${previous} 和 ${n} 之間缺了 ${gap} 號，還載入得到，請記得補上。`);
    }
    previous = n;
  }
  const seen = new Map();
  for (const { where, def } of items) {
    if (typeof def.id !== "string" || !/^[a-z][a-z0-9_]*$/.test(def.id)) {
      fail(where, `id 要用英文小寫、數字和底線，現在是 ${JSON.stringify(def.id)}。`);
      continue;
    }
    if (seen.has(def.id)) fail(where, `id「${def.id}」和 ${seen.get(def.id)} 重複了。`);
    else seen.set(def.id, where);
  }
  return items;
}

const isNumber = (v) => typeof v === "number" && Number.isFinite(v);
const isText = (v) => typeof v === "string" && v.trim().length > 0;

function requireFields(where, def, fields) {
  for (const [field, test, hint] of fields) {
    if (!test(def[field])) fail(where, `欄位 ${field} ${hint}`);
  }
}

// ---- 點陣圖 ----
function checkSprite(where, sprite) {
  if (!sprite || typeof sprite !== "object") {
    fail(where, "欄位 sprite 少了。");
    return;
  }
  const palette = sprite.palette;
  if (!palette || typeof palette !== "object") {
    fail(where, "欄位 sprite.palette 少了。");
    return;
  }
  for (const [ch, color] of Object.entries(palette)) {
    if (ch.length !== 1 || ch === ".") fail(where, `sprite.palette 的鍵「${ch}」要是單一字元，而且不能用「.」。`);
    if (!/^#[0-9a-fA-F]{6}$/.test(String(color))) fail(where, `sprite.palette.${ch} 要是 #rrggbb 這種顏色，現在是 ${color}。`);
  }
  if (!Array.isArray(sprite.rows) || sprite.rows.length !== 16) {
    fail(where, `sprite.rows 要剛好 16 列，現在是 ${Array.isArray(sprite.rows) ? sprite.rows.length : "不是陣列"}。`);
    return;
  }
  sprite.rows.forEach((row, i) => {
    if (typeof row !== "string" || row.length !== 16) {
      fail(where, `sprite.rows 第 ${i + 1} 列要剛好 16 個字元，現在是 ${String(row).length} 個。`);
      return;
    }
    for (const ch of row) {
      if (ch !== "." && !(ch in palette)) fail(where, `sprite.rows 第 ${i + 1} 列的字元「${ch}」沒有寫在 palette 裡。`);
    }
  });
}

// ---- 招式 ----
function checkMoves(items, types) {
  for (const { where, def } of items) {
    requireFields(where, def, [
      ["name", isText, "要寫招式的中文名。"],
      ["type", (v) => types.includes(v), `要是這些屬性之一：${types.join("、")}。`],
      ["power", (v) => isNumber(v) && v > 0, "要是大於 0 的數字。"],
      ["accuracy", (v) => isNumber(v) && v > 0 && v <= 100, "要是 1 到 100 的數字。"],
      ["description", isText, "要寫一句說明。"],
    ]);
  }
}

// ---- 星靈 ----
function checkMonsters(items, moveIds, types) {
  for (const { where, def } of items) {
    requireFields(where, def, [
      ["name", isText, "要寫星靈的中文名。"],
      ["type", (v) => types.includes(v), `要是這些屬性之一：${types.join("、")}。`],
      ["catchRate", (v) => isNumber(v) && v >= 1 && v <= 255, "要是 1 到 255 的數字。"],
      ["expYield", (v) => isNumber(v) && v > 0, "要是大於 0 的數字。"],
      ["description", isText, "要寫一句說明。"],
    ]);
    if ("starter" in def && typeof def.starter !== "boolean") fail(where, "欄位 starter 只能是 true 或 false。");

    const stats = def.baseStats || {};
    for (const key of ["hp", "atk", "def", "spd"]) {
      if (!isNumber(stats[key]) || stats[key] <= 0) fail(where, `欄位 baseStats.${key} 要是大於 0 的數字。`);
    }

    if (!Array.isArray(def.learnset) || def.learnset.length === 0) {
      fail(where, "欄位 learnset 至少要有一個招式。");
    } else {
      if (!def.learnset.some((e) => e && e.level === 1)) fail(where, "learnset 至少要有一個 level 為 1 的招式，不然上場沒招可用。");
      def.learnset.forEach((entry, i) => {
        if (!entry || !isNumber(entry.level) || entry.level < 1) fail(where, `learnset 第 ${i + 1} 筆的 level 要是 1 以上的數字。`);
        if (!entry || !moveIds.has(entry.move)) fail(where, `learnset 第 ${i + 1} 筆的招式「${entry && entry.move}」不存在，data/moves 裡沒有這個 id。`);
      });
    }
    checkSprite(where, def.sprite);
  }
  if (!items.some(({ def }) => def.starter === true)) fail("data/monsters", "至少要有一隻 starter: true 的起始星靈。");
}

// ---- 地圖 ----
function walkable(map, tiles, x, y) {
  const row = map.tiles[y];
  if (row === undefined || x < 0 || x >= row.length) return false;
  const tile = tiles[row[x]];
  return !!tile && tile.walkable === true;
}

function checkPoint(where, label, map, tiles, x, y) {
  if (!isNumber(x) || !isNumber(y)) {
    fail(where, `${label} 的 x、y 要是數字。`);
    return;
  }
  const height = map.tiles.length;
  const width = (map.tiles[0] || "").length;
  if (x < 0 || y < 0 || x >= width || y >= height) {
    fail(where, `${label} 的位置 (${x}, ${y}) 超出地圖範圍。地圖是 ${width} 寬、${height} 高，座標從 0 開始。`);
  } else if (!walkable(map, tiles, x, y)) {
    fail(where, `${label} 的位置 (${x}, ${y}) 是「${map.tiles[y][x]}」，不能走。要放在可走的格子上。`);
  }
}

function checkMaps(items, monsterIds, tiles) {
  const byId = new Map(items.map(({ def }) => [def.id, def]));
  for (const { where, def } of items) {
    if (!isText(def.name)) fail(where, "欄位 name 要寫地圖的中文名。");
    if (!Array.isArray(def.tiles) || def.tiles.length === 0 || !def.tiles.every((r) => typeof r === "string")) {
      fail(where, "欄位 tiles 要是一串字串。");
      continue;
    }
    const width = def.tiles[0].length;
    def.tiles.forEach((row, y) => {
      if (row.length !== width) fail(where, `tiles 第 ${y + 1} 列長度是 ${row.length}，要和第 1 列一樣是 ${width}。`);
      for (const ch of row) {
        if (!tiles[ch]) fail(where, `tiles 第 ${y + 1} 列的字元「${ch}」不是圖塊。圖塊定義在 js/tiles.js。`);
      }
    });

    if (!def.spawn) fail(where, "欄位 spawn 少了。");
    else checkPoint(where, "spawn", def, tiles, def.spawn.x, def.spawn.y);

    if (!Array.isArray(def.npcs)) {
      fail(where, "欄位 npcs 要是陣列，沒有 NPC 就寫 []。");
    } else {
      def.npcs.forEach((npc, i) => {
        checkPoint(where, `npcs 第 ${i + 1} 筆`, def, tiles, npc.x, npc.y);
        if (!isText(npc.text)) fail(where, `npcs 第 ${i + 1} 筆的 text 要寫對話內容。`);
        if ("heal" in npc && typeof npc.heal !== "boolean") fail(where, `npcs 第 ${i + 1} 筆的 heal 只能是 true 或 false。`);
      });
    }

    if (!Array.isArray(def.exits)) {
      fail(where, "欄位 exits 要是陣列，沒有出口就寫 []。");
    } else {
      def.exits.forEach((exit, i) => {
        const label = `exits 第 ${i + 1} 筆`;
        checkPoint(where, label, def, tiles, exit.x, exit.y);
        const target = byId.get(exit.toMap);
        if (!target) fail(where, `${label} 要去的地圖「${exit.toMap}」不存在，data/maps 裡沒有這個 id。`);
        else if (Array.isArray(target.tiles)) checkPoint(where, `${label} 的目的地`, target, tiles, exit.toX, exit.toY);
      });
    }

    if (!Array.isArray(def.encounters)) {
      fail(where, "欄位 encounters 要是陣列，沒有野生星靈就寫 []。");
    } else {
      def.encounters.forEach((e, i) => {
        const label = `encounters 第 ${i + 1} 筆`;
        if (!monsterIds.has(e.monster)) fail(where, `${label} 的星靈「${e.monster}」不存在，data/monsters 裡沒有這個 id。`);
        if (!isNumber(e.minLevel) || !isNumber(e.maxLevel) || e.minLevel < 1 || e.minLevel > e.maxLevel) {
          fail(where, `${label} 的 minLevel、maxLevel 要是 1 以上的數字，而且 minLevel 不能比 maxLevel 大。`);
        }
        if (!isNumber(e.weight) || e.weight <= 0) fail(where, `${label} 的 weight 要是大於 0 的數字。`);
      });
      const hasGrass = def.tiles.some((row) => [...row].some((ch) => tiles[ch] && tiles[ch].encounter));
      if (hasGrass && def.encounters.length === 0) fail(where, "地圖有草叢，但 encounters 是空的，草叢不會遇到任何星靈。");
    }
    if (!isNumber(def.encounterRate) || def.encounterRate < 0 || def.encounterRate > 1) {
      fail(where, "欄位 encounterRate 要是 0 到 1 的數字。");
    }
  }
  if (items.length === 0) fail("data/maps", "至少要有一張地圖。");
}

// ---- 圖塊 ----
function loadTiles() {
  const path = join(ROOT, "js", "tiles.js");
  const context = { module: { exports: {} } };
  vm.runInNewContext(readFileSync(path, "utf8"), context, { filename: path });
  const tiles = JSON.parse(JSON.stringify(context.module.exports));
  for (const [ch, tile] of Object.entries(tiles)) {
    checkSprite(`js/tiles.js 圖塊「${ch}」`, tile.sprite);
  }
  return tiles;
}

function loadTypes() {
  const path = join(ROOT, "js", "rules.js");
  const context = { module: { exports: {} } };
  vm.runInNewContext(readFileSync(path, "utf8"), context, { filename: path });
  return [...context.module.exports.TYPES];
}

// ---- 全 repo 文字掃描 ----
const SKIP_DIRS = new Set([".git", "node_modules", "__pycache__"]);
const SKIP_FILES = new Set(["tools/check.mjs", "tools/banned-words.json"]);

const SECRET_PATTERNS = [
  ["Google API 金鑰", /AIza[0-9A-Za-z_-]{20,}/],
  ["Google OAuth 金鑰", /\bAQ\.[0-9A-Za-z_-]{20,}/],
  ["Discord webhook 網址", /discord(?:app)?\.com\/api\/webhooks\/\d+/i],
  ["GitHub 權杖", /\bghp_[0-9A-Za-z]{20,}/],
];
const HOME_PATTERNS = [/\b[A-Za-z]:\\Users\\[^\\\s"'`]+/, /\/(?:Users|home)\/[A-Za-z0-9_.-]+\//];
// 雙擊 index.html（file://）就要能玩，引擎與資料不能用這些
const FORBIDDEN_CODE = [
  ["fetch(", /\bfetch\s*\(/],
  ["XMLHttpRequest", /\bXMLHttpRequest\b/],
  ["WebSocket", /\bWebSocket\b/],
  ['type="module"', /type\s*=\s*["']module["']/],
];

function walk(dir, out = []) {
  for (const name of readdirSync(dir)) {
    if (SKIP_DIRS.has(name)) continue;
    const full = join(dir, name);
    if (statSync(full).isDirectory()) walk(full, out);
    else out.push(full);
  }
  return out;
}

function wordPattern(word) {
  const escaped = word.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  // 英文字要整個字相符，不然會誤抓到別的單字的一部分
  return /^[\x00-\x7f]+$/.test(word) ? new RegExp(`(?<![A-Za-z0-9])${escaped}(?![A-Za-z0-9])`, "i") : new RegExp(escaped);
}

function scanText() {
  const banned = JSON.parse(readFileSync(join(ROOT, "tools", "banned-words.json"), "utf8")).words.map((w) => [w, wordPattern(w)]);
  for (const path of walk(ROOT)) {
    const where = rel(path);
    if (SKIP_FILES.has(where)) continue;
    const buffer = readFileSync(path);
    if (buffer.includes(0)) continue; // 二進位檔不掃
    const lines = buffer.toString("utf8").split(/\r?\n/);
    const isCode = where === "index.html" || where.startsWith("js/") || where.startsWith("data/");
    lines.forEach((line, i) => {
      const at = `${where} 第 ${i + 1} 行`;
      for (const [label, pattern] of SECRET_PATTERNS) {
        if (pattern.test(line)) fail(at, `看起來有 ${label}。金鑰不能進 repo，請移除。`);
      }
      for (const pattern of HOME_PATTERNS) {
        if (pattern.test(line)) fail(at, "有含使用者名稱的電腦路徑。公開 repo 不能放，請改成相對路徑。");
      }
      for (const [word, pattern] of banned) {
        if (pattern.test(line)) fail(at, `出現既有遊戲的名字「${word}」。本作全部原創，請改掉。`);
      }
      if (isCode) {
        for (const [label, pattern] of FORBIDDEN_CODE) {
          if (pattern.test(line)) fail(at, `用到 ${label}。遊戲要雙擊就能玩，也不連網路，這個不能用。`);
        }
      }
    });
  }
}

// ---- 主流程 ----
function main() {
  let tiles = {};
  let types = [];
  try {
    tiles = loadTiles();
    types = loadTypes();
  } catch (err) {
    fail("js/tiles.js 或 js/rules.js", `讀不起來：${err.message}`);
  }

  const moves = loadFolder("moves", "Move");
  const monsters = loadFolder("monsters", "Monster");
  const maps = loadFolder("maps", "Map");

  checkMoves(moves, types);
  checkMonsters(monsters, new Set(moves.map((m) => m.def.id)), types);
  checkMaps(maps, new Set(monsters.map((m) => m.def.id)), tiles);
  scanText();

  notes.forEach((note) => console.log(`提醒　${note}`));
  if (errors.length) {
    console.log(`\n檢查沒過，共 ${errors.length} 個問題：\n`);
    errors.forEach((e, i) => console.log(`${i + 1}. ${e}`));
    process.exit(1);
  }
  console.log(`檢查通過。星靈 ${monsters.length} 隻，招式 ${moves.length} 個，地圖 ${maps.length} 張。`);
}

main();
