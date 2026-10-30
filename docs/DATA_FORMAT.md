# 資料格式

資料一物一檔，不需要任何清單。新增檔案後，載入器會自己找到它。

## 共同規則

| 規則 | 說明 |
|---|---|
| 檔名 | 三位數編號加 `.js`，例如 `006.js` |
| 編號 | 取資料夾目前最大編號＋1，開工前在 issue 講好 |
| 缺號 | 不能超過 19 個，不然後面的檔案載入不到 |
| `id` | 英文小寫、數字、底線，全遊戲同類不重複。別的資料用它來引用 |
| 一檔一筆 | 每個檔案只呼叫一次註冊函式 |
| 原創 | 名字和圖都要原創，既有遊戲的內容過不了檢查 |

改完執行 `node tools/check.mjs`。失敗時會寫出哪個檔哪一欄有問題。

屬性只有五種：`焰`、`森`、`潮`、`光`、`影`。焰克森，森克潮，潮克焰，光和影互剋。

## 星靈 `data/monsters/編號.js`

| 欄位 | 必填 | 內容 |
|---|---|---|
| `id` | 是 | 例：`frost_fox` |
| `name` | 是 | 中文名 |
| `type` | 是 | 五種屬性之一 |
| `starter` | 否 | `true` 表示可以當起始星靈，不是就不用寫 |
| `baseStats` | 是 | `hp`、`atk`、`def`、`spd`，都是大於 0 的數字。現有星靈落在 20 到 65 之間 |
| `catchRate` | 是 | 1 到 255，越大越好抓。起始星靈 45，野生 150 到 180 |
| `expYield` | 是 | 被打倒時給的經驗基礎值。現有星靈落在 45 到 60 |
| `learnset` | 是 | 學招式的清單，每筆 `{ level, move }`。至少一招的 `level` 是 1。`move` 要是存在的招式 id |
| `description` | 是 | 一句介紹 |
| `sprite` | 是 | 文字點陣圖，見下方 |

### sprite 文字點陣圖

| 欄位 | 內容 |
|---|---|
| `palette` | 顏色表。鍵是單一字元，值是 `#rrggbb` |
| `rows` | 剛好 16 列，每列剛好 16 個字元。`.` 是透明，其他字元要寫在 `palette` 裡 |

圖要面向左邊。對戰時我方的圖會自動左右翻轉。

### 完整範例

```js
Game.registerMonster({
  id: "frost_fox",
  name: "霜尾狐",
  type: "潮",
  baseStats: { hp: 44, atk: 46, def: 38, spd: 60 },
  catchRate: 160,
  expYield: 50,
  learnset: [
    { level: 1, move: "bubble_rush" },
    { level: 6, move: "tide_slam" },
  ],
  description: "尾巴尖端結著一層薄霜。走過的草地會留下白色腳印。",
  sprite: {
    palette: { a: "#cfe6f5", b: "#3d5a78", c: "#ffffff", d: "#1a2433" },
    rows: [
      "................",
      "..b.......b.....",
      ".bab.....bab....",
      ".baabbbbbaab....",
      ".baaaaaaaaab....",
      ".badaaaadaab..b.",
      ".baaaccaaaab.bab",
      "..baacdcaab..bab",
      "...bbaaabb..baab",
      "..baaaaaaabbaab.",
      ".baacccaaaaaab..",
      ".baacccaaaaab...",
      ".baaaaaaaaab....",
      ".baabaaabaab....",
      "..bb.bbb.bb.....",
      "................",
    ],
  },
});
```

## 招式 `data/moves/編號.js`

| 欄位 | 必填 | 內容 |
|---|---|---|
| `id` | 是 | 例：`frost_bite` |
| `name` | 是 | 中文名 |
| `type` | 是 | 五種屬性之一 |
| `power` | 是 | 威力，大於 0。現有招式落在 35 到 65 |
| `accuracy` | 是 | 命中率，1 到 100 |
| `description` | 是 | 一句介紹 |

### 完整範例

```js
Game.registerMove({
  id: "frost_bite",
  name: "霜咬",
  type: "潮",
  power: 50,
  accuracy: 95,
  description: "用結霜的牙齒咬住對手。",
});
```

招式要有星靈能學才用得到。把 id 加到某隻星靈的 `learnset`。

## 地圖 `data/maps/編號.js`

編號最小的地圖（`001.js`）是起始地圖，也是全滅時回去的地方。

| 欄位 | 必填 | 內容 |
|---|---|---|
| `id` | 是 | 例：`frost_cave` |
| `name` | 是 | 中文名，進地圖時顯示 |
| `tiles` | 是 | 一串字串，每列一樣長，每個字元是一格圖塊 |
| `spawn` | 是 | `{ x, y }` 預設站立位置，要在可走的格子上 |
| `npcs` | 是 | NPC 清單，沒有就寫 `[]` |
| `exits` | 是 | 出口清單，沒有就寫 `[]` |
| `encounters` | 是 | 野生星靈清單，沒有就寫 `[]`。地圖有草叢 `g` 就一定要有 |
| `encounterRate` | 是 | 每踩一步草叢遇怪的機率，0 到 1。一號草徑是 0.2 |

座標從左上角開始，`x` 往右增加，`y` 往下增加，都從 0 算起。

### 圖塊

圖塊定義在 `js/tiles.js`。

| 字元 | 圖塊 | 能走 | 會遇怪 |
|---|---|---|---|
| `.` | 地面 | 能 | 不會 |
| `p` | 小路 | 能 | 不會 |
| `f` | 花 | 能 | 不會 |
| `g` | 草叢 | 能 | 會 |
| `T` | 樹 | 不能 | |
| `w` | 水 | 不能 | |
| `#` | 牆 | 不能 | |
| `r` | 屋頂 | 不能 | |
| `d` | 門（裝飾） | 不能 | |

### NPC 欄位

| 欄位 | 必填 | 內容 |
|---|---|---|
| `x`、`y` | 是 | 位置，要在可走的格子上 |
| `text` | 是 | 對話內容。`\n` 是換行，太長會自動分頁 |
| `heal` | 否 | `true` 表示對話時治療隊伍，並把星晶補滿 |

### 出口欄位

| 欄位 | 內容 |
|---|---|
| `x`、`y` | 踩到這格就換地圖，要在可走的格子上 |
| `toMap` | 目的地圖的 id |
| `toX`、`toY` | 到達的位置，要在目的地圖可走的格子上 |

新地圖要讓玩家走得到，就要在相鄰的地圖加一個出口。這會改到別人的地圖檔，請在 issue 講清楚，並寫在 PR 裡。

### 野生星靈欄位

| 欄位 | 內容 |
|---|---|
| `monster` | 星靈 id，要存在 |
| `minLevel`、`maxLevel` | 等級範圍，`minLevel` 不能比 `maxLevel` 大 |
| `weight` | 出現權重，越大越常見 |

### 完整範例

```js
Game.registerMap({
  id: "frost_cave",
  name: "霜洞",
  tiles: [
    "##########",
    "#..g..g..#",
    "#..g..g..#",
    "#........#",
    "pppp.....#",
    "##########",
  ],
  spawn: { x: 1, y: 4 },
  npcs: [
    { x: 7, y: 3, text: "洞裡比外面冷很多，小心腳下。" },
  ],
  exits: [
    { x: 0, y: 4, toMap: "route_one", toX: 22, toY: 13 },
  ],
  encounters: [
    { monster: "moss_turtle", minLevel: 5, maxLevel: 7, weight: 100 },
  ],
  encounterRate: 0.15,
});
```
