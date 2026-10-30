// render.js：畫面工具。點陣圖、文字、文字框、血條、整數倍放大。
// 這是底層檔案。要改請先開 issue。
(function () {
  "use strict";

  const FONT_FAMILY = '"Microsoft JhengHei", "PingFang TC", "Noto Sans CJK TC", sans-serif';
  const COLORS = {
    ink: "#2a3350",
    inkSoft: "#5c6a90",
    paper: "#f8f6ec",
    border: "#2c3e66",
    borderSoft: "#7f97c7",
    select: "#d94f4f",
  };
  const TYPE_COLORS = { 焰: "#d9602f", 森: "#3f9c57", 潮: "#3a84c7", 光: "#c9a227", 影: "#6a55a8" };

  const canvas = document.getElementById("screen");
  const ctx = canvas.getContext("2d");
  ctx.imageSmoothingEnabled = false;

  const spriteCache = new WeakMap();

  // 把文字點陣轉成一張原尺寸小圖，之後重複使用。
  function bake(sprite) {
    let baked = spriteCache.get(sprite);
    if (baked) return baked;
    baked = document.createElement("canvas");
    baked.width = 16;
    baked.height = 16;
    const c = baked.getContext("2d");
    sprite.rows.forEach((row, y) => {
      for (let x = 0; x < row.length; x += 1) {
        const color = sprite.palette[row[x]];
        if (row[x] !== "." && color) {
          c.fillStyle = color;
          c.fillRect(x, y, 1, 1);
        }
      }
    });
    spriteCache.set(sprite, baked);
    return baked;
  }

  const Render = {
    ctx,
    COLORS,
    TYPE_COLORS,

    sprite(sprite, x, y, scale, options = {}) {
      const baked = bake(sprite);
      const size = 16 * scale;
      ctx.save();
      ctx.imageSmoothingEnabled = false;
      if (options.alpha !== undefined) ctx.globalAlpha = options.alpha;
      if (options.flip) {
        ctx.translate(Math.round(x) + size, Math.round(y));
        ctx.scale(-1, 1);
        ctx.drawImage(baked, 0, 0, size, size);
      } else {
        ctx.drawImage(baked, Math.round(x), Math.round(y), size, size);
      }
      ctx.restore();
    },

    rect(x, y, w, h, color) {
      ctx.fillStyle = color;
      ctx.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h));
    },

    font: (size, bold = true) => (bold ? "bold " : "") + size + "px " + FONT_FAMILY,

    text(str, x, y, options = {}) {
      const size = options.size || 16;
      ctx.font = Render.font(size, options.bold !== false);
      ctx.textAlign = options.align || "left";
      ctx.textBaseline = "top";
      if (options.shadow) {
        ctx.fillStyle = options.shadow;
        ctx.fillText(str, Math.round(x) + 1, Math.round(y) + 1);
      }
      ctx.fillStyle = options.color || COLORS.ink;
      ctx.fillText(str, Math.round(x), Math.round(y));
    },

    // 依寬度斷行，中文可以在任何字之間斷開。
    wrap(str, maxWidth, size = 16) {
      ctx.font = Render.font(size);
      const lines = [];
      String(str).split("\n").forEach((paragraph) => {
        let line = "";
        for (const ch of paragraph) {
          if (ctx.measureText(line + ch).width > maxWidth && line) {
            lines.push(line);
            line = ch;
          } else {
            line += ch;
          }
        }
        lines.push(line);
      });
      return lines;
    },

    // 復古雙層邊框的文字框
    box(x, y, w, h) {
      Render.rect(x, y, w, h, COLORS.border);
      Render.rect(x + 3, y + 3, w - 6, h - 6, COLORS.borderSoft);
      Render.rect(x + 5, y + 5, w - 10, h - 10, COLORS.paper);
    },

    messageBox(lines) {
      const top = Game.HEIGHT - 92;
      Render.box(0, top, Game.WIDTH, 92);
      lines.forEach((line, i) => Render.text(line, 20, top + 16 + i * 24));
    },

    // 選單游標（小三角形）
    cursor(x, y) {
      ctx.fillStyle = COLORS.select;
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x + 9, y + 6);
      ctx.lineTo(x, y + 12);
      ctx.closePath();
      ctx.fill();
    },

    bar(x, y, w, h, ratio, color) {
      Render.rect(x, y, w, h, COLORS.border);
      Render.rect(x + 1, y + 1, w - 2, h - 2, "#d9d9d0");
      const fill = Math.round((w - 2) * Math.min(1, Math.max(0, ratio)));
      if (fill > 0) Render.rect(x + 1, y + 1, fill, h - 2, color);
    },

    hpColor(ratio) {
      if (ratio > 0.5) return "#3fb060";
      if (ratio > 0.2) return "#e0b030";
      return "#d9483b";
    },

    typeLabel(type, x, y) {
      const w = 26;
      Render.rect(x, y, w, 18, TYPE_COLORS[type] || COLORS.inkSoft);
      Render.text(type, x + w / 2, y + 2, { size: 13, color: "#ffffff", align: "center" });
    },

    // 畫面以整數倍放大。比 480 還窄的手機才退回等比縮小。
    resize() {
      const hint = document.getElementById("hint");
      const touch = document.getElementById("touch");
      const errors = document.getElementById("load-errors");
      const below = [hint, touch, errors].reduce(
        (sum, el) => sum + (el && el.offsetHeight ? el.offsetHeight + 10 : 0), 0);
      const availW = window.innerWidth - 8;
      const availH = window.innerHeight - below - 24;
      const scale = Math.floor(Math.min(availW / Game.WIDTH, availH / Game.HEIGHT));
      if (scale >= 1) {
        canvas.style.width = Game.WIDTH * Math.min(scale, 4) + "px";
        canvas.style.height = Game.HEIGHT * Math.min(scale, 4) + "px";
      } else {
        const ratio = Math.max(0.5, Math.min(availW / Game.WIDTH, 1));
        canvas.style.width = Math.floor(Game.WIDTH * ratio) + "px";
        canvas.style.height = Math.floor(Game.HEIGHT * ratio) + "px";
      }
    },
  };
  Game.Render = Render;

  window.addEventListener("resize", Render.resize);
  window.addEventListener("orientationchange", Render.resize);
})();
