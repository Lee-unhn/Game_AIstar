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
  // 配色只影響畫面，行走和遇敵仍讀原本的圖塊。
  const themes = {
    glimmer_town: { sky: "#26384a", ground: ["#79a567", "#8cb373"], path: ["#d4b57e", "#ae8c60"],
      wall: ["#e3c59f", "#a98770"], roof: ["#b55949", "#773e3d", "#df8261"], water: ["#4d8eae", "#8ec2cc", "#397495"] },
    route_one: { sky: "#263b39", ground: ["#76a46f", "#8ab47a"], path: ["#c6a378", "#a0815c"],
      grass: ["#3c6947", "#63834d", "#2d503b"], water: ["#438092", "#75afac", "#346c83"] },
    route_two: { sky: "#223a43", ground: ["#709f87", "#84af92"], path: ["#c0ae82", "#92876a"],
      grass: ["#376858", "#608556", "#284b46"], water: ["#366c88", "#6aa3a9", "#2c5974"] },
    mist_harbor: { sky: "#25344d", ground: ["#778f93", "#8da2a0"], path: ["#b7a38a", "#877772"],
      wall: ["#c2b29c", "#8b8290"], roof: ["#556989", "#3f4c6e", "#71809e"], water: ["#406381", "#749ba8", "#334c69"] },
    star_tower: { sky: "#25233b", ground: ["#55506e", "#79718f"], path: ["#776a87", "#ae966f"],
      wall: ["#3c3b55", "#28283d"], stone: true },
  };
  const props = { T: "evergreen", g: "tall-grass" };
  const images = new Map();
  const tileStyles = new Map();

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

  function drawFit(image, x, y, width, height, flip = false) {
    if (!image) return false;
    const ratio = Math.min(width / image.naturalWidth, height / image.naturalHeight);
    const w = Math.round(image.naturalWidth * ratio);
    const h = Math.round(image.naturalHeight * ratio);
    const left = Math.round((width - w) / 2);
    const top = Math.round(height - h);
    const ctx = Game.Render.ctx;
    ctx.save();
    ctx.imageSmoothingEnabled = true;
    ctx.translate(Math.round(x) + (flip ? width : 0), Math.round(y));
    if (flip) ctx.scale(-1, 1);
    ctx.drawImage(image, left, top, w, h);
    ctx.restore();
    return true;
  }

  function terrainSprite(mapId, tileKey, tile, style) {
    const cacheKey = mapId + ":" + tileKey;
    if (tileStyles.has(cacheKey)) return tileStyles.get(cacheKey);
    const ground = style.ground;
    const base = Game.Tiles["."].sprite;
    const themed = (sprite, colors) => ({ rows: sprite.rows, palette: { ...sprite.palette, ...colors } });
    const ab = ([a, b]) => ({ a, b });
    const abc = ([a, b, c]) => ({ a, b, c });
    let result = tile.sprite;
    if (tileKey === "." || (tileKey === "p" && style.stone)) {
      result = themed(style.stone ? Game.Tiles["#"].sprite : base, ab(tileKey === "p" ? style.path : ground));
    } else if (tileKey === "p") result = themed(tile.sprite, ab(style.path));
    else if (tileKey === "g" && style.grass) result = themed(tile.sprite, abc(style.grass));
    else if (tileKey === "T" || tileKey === "f") result = themed(tile.sprite, { a: ground[0] });
    else if (tileKey === "w" && style.water) result = themed(tile.sprite, abc(style.water));
    else if (tileKey === "#" && style.wall) result = themed(tile.sprite, ab(style.wall));
    else if (tileKey === "r" && style.roof) result = themed(tile.sprite, abc(style.roof));
    else if (tileKey === "d" && style.wall) result = themed(tile.sprite, { a: style.wall[0] });
    tileStyles.set(cacheKey, result);
    return result;
  }

  Game.Art = {
    worldColor(mapId) { return themes[mapId]?.sky || "#20304a"; },
    terrain(mapId, key, tile, x, y) {
      const style = themes[mapId];
      const R = Game.Render;
      if (!style) { R.sprite(tile.sprite, x, y, 2); return; }
      const size = Game.TILE;
      const prop = props[key];
      const image = prop ? get("props/" + prop) : null;
      if (image) {
        const grass = key === "g";
        R.rect(x, y, size, size, grass ? (style.grass?.[0] || "#3f844f") : style.ground[0]);
        const margin = grass ? 5 : 1;
        drawFit(image, x + margin, y + margin, size - 2 * margin, size - 2 * margin);
        return;
      }
      R.sprite(terrainSprite(mapId, key, tile, style), x, y, 2);
    },
    person(role, x, y, direction, walkFrame = 0) {
      const image = get("people/" + role);
      const size = Game.TILE;
      if (!image) return false;
      const lift = walkFrame === 1 ? 2 : 0;
      return drawFit(image, x, y - lift, size, size - 1, direction === "left");
    },
    marker(name, x, y) {
      return drawFit(get("props/" + name), x, y, Game.TILE, Game.TILE);
    },
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
      drawFit(image, x, y, size, size, options.flip);
    },
  };
})();
