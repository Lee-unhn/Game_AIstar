Game.registerMonster({
  "id": "coal_gecko",
  "name": "炭尾蜥",
  "type": "焰",
  "baseStats": {
    "hp": 51,
    "atk": 55,
    "def": 50,
    "spd": 39
  },
  "catchRate": 155,
  "expYield": 54,
  "learnset": [
    {
      "level": 1,
      "move": "ember_bite"
    },
    {
      "level": 7,
      "move": "ash_burst"
    }
  ],
  "description": "從熔岩石縫孵出，尾巴是暖暖的火炭。",
  "sprite": {
    "palette": {
      "o": "#2e243a",
      "a": "#6b4e68",
      "b": "#ab746e",
      "c": "#ffb264",
      "e": "#fff3bd"
    },
    "rows": [
      "................",
      "................",
      ".............c..",
      "...oo.......cc..",
      "..oaao.....cco..",
      ".oaebao...ocoa..",
      ".oabbboo.ocoao..",
      "..oabbbbooaao...",
      "...obbbbaaao....",
      "...oabbaaaao....",
      "....oaaooao.....",
      "...oaao.oao.....",
      "...ooo...oo.....",
      "................",
      "................",
      "................"
    ]
  }
});
