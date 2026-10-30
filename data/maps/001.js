// 圖塊字元的意思寫在 js/tiles.js。編號最小的地圖是起始地圖。
Game.registerMap({
  id: "glimmer_town",
  name: "微光鎮",
  tiles: [
    "TTTTTTTTTTTTTTTTTTTT",
    "T..f...........f...T",
    "T..rrrrr....rrrrr..T",
    "T..#####....#####..T",
    "T..##d##....##d##..T",
    "T....p........p....T",
    "T....p........p....T",
    "T....ppppppppppppppp",
    "T....p.............T",
    "T.f..p....www...f..T",
    "T....p....www......T",
    "T.........www......T",
    "T...f..............T",
    "TTTTTTTTTTTTTTTTTTTT",
  ],
  spawn: { x: 5, y: 7 },
  npcs: [
    {
      x: 6,
      y: 5,
      heal: true,
      text: "我是鎮上的星靈照護員。來，讓我看看你的夥伴。\n好了，大家都精神了。",
    },
    {
      x: 13,
      y: 8,
      text: "往右走出鎮，就是一號草徑。草叢裡有野生星靈。先削弱牠，再丟星晶比較容易收服。",
    },
    {
      x: 16,
      y: 5,
      text: "屬性要記好。焰克森，森克潮，潮克焰。光和影互相克制。",
    },
  ],
  exits: [{ x: 19, y: 7, toMap: "route_one", toX: 1, toY: 8 }],
  encounters: [],
  encounterRate: 0,
});
