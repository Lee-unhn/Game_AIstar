// 選用美術。圖片還沒載入或讀不到時，場景照常用文字點陣繪製。
(function () {
  "use strict";

  const root = "art/classroom/";
  const portraits = new Set([
    "ember_marten", "tide_otter", "sprout_deer", "night_moth",
    "moss_turtle", "coal_gecko", "grove_turtle", "lantern_sprite",
  ]);
  const backdrops = {
    glimmer_town: "glimmer-town",
    route_one: "trail-woods",
    route_two: "trail-woods",
    mist_harbor: "mist-harbor",
    star_tower: "star-tower",
  };
  const images = new Map();

  function get(path) {
    if (!images.has(path)) {
      const image = new Image();
      image.src = root + path + ".png";
      images.set(path, image);
    }
    const image = images.get(path);
    return image.complete && image.naturalWidth ? image : null;
  }

  function backdrop(name) {
    const image = get("scenes/" + name);
    if (!image) return false;
    Game.Render.ctx.drawImage(image, 0, 0, Game.WIDTH, Game.HEIGHT);
    return true;
  }

  Game.Art = {
    title() { return backdrop("star-harbor-title"); },
    battle(mapId) {
      const scene = backdrops[mapId];
      return scene ? backdrop(scene) : false;
    },
    monster(species, x, y, scale, options = {}) {
      const image = portraits.has(species.id) ? get("creatures/" + species.id) : null;
      if (!image) {
        Game.Render.sprite(species.sprite, x, y, scale, options);
        return;
      }
      const size = 16 * scale;
      const ratio = size / Math.max(image.naturalWidth, image.naturalHeight);
      const w = Math.round(image.naturalWidth * ratio);
      const h = Math.round(image.naturalHeight * ratio);
      const ctx = Game.Render.ctx;
      ctx.save();
      ctx.imageSmoothingEnabled = true;
      if (options.flip) {
        ctx.translate(x + size, y);
        ctx.scale(-1, 1);
        ctx.drawImage(image, Math.round((size - w) / 2), size - h, w, h);
      } else {
        ctx.drawImage(image, x + Math.round((size - w) / 2), y + size - h, w, h);
      }
      ctx.restore();
    },
  };
})();
