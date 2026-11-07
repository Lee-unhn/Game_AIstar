Game.registerMonster({
  "id": "lantern_sprite",
  "name": "笑燈靈",
  "type": "焰",
  "baseStats": {
    "hp": 39,
    "atk": 49,
    "def": 39,
    "spd": 61
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
  "description": "像一盞飄浮的小燈，人們一笑，牠就亮起來。",
  "sprite": {
    "palette": {
      "o": "#542e50",
      "a": "#d76761",
      "b": "#ff9a66",
      "c": "#ffe892",
      "e": "#fff8cd"
    },
    "rows": [
      "................",
      "................",
      ".......oo.......",
      "......occo......",
      ".....oooooo.....",
      "....oaaaaaao....",
      "...oabccccbao...",
      "...oabceccbao...",
      "...oabcccebao...",
      "...oabccccbao...",
      "....oaaaaaao....",
      ".....oooooo.....",
      ".......bb.......",
      "......b..b......",
      ".....b....b.....",
      "................"
    ]
  }
});
