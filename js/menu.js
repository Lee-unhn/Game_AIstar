// 教學版冒險選單。由走動場景進入，取消回到上一層。
(function () {
  "use strict";

  const entries = [
    ["隊伍", "party"],
    ["星靈圖鑑", "dex"],
    ["背包", "bag"],
  ];
  const R = Game.Render;
  const I = Game.Input;
  let menuIndex = 0;
  let dexIndex = 0;
  let dexIds = [];
  let itemIndex = 0;
  let targetIndex = null;
  let bagNote = "";

  function navigate(index, count) {
    if (!count) return 0;
    const back = I.pressed("up") || I.pressed("left");
    const forward = I.pressed("down") || I.pressed("right");
    return (index + Number(forward) - Number(back) + count) % count;
  }

  function frame(title, hint) {
    R.rect(0, 0, 480, 320, "#34457a");
    R.text(title, 16, 12, { size: 20, color: "#ffffff" });
    R.text(hint, 16, 292, { size: 14, color: "#ffffff" });
  }

  function list(labels, index, x, y, width, visible = 6) {
    const first = Math.min(Math.max(0, index - 2), Math.max(0, labels.length - visible));
    R.box(x, y, width, 32 + visible * 29);
    labels.slice(first, first + visible).forEach((label, i) => {
      const rowY = y + 16 + i * 29;
      R.text(label, x + 30, rowY, { size: 15 });
      if (i + first === index) R.cursor(x + 12, rowY + 2);
    });
  }

  Game.scenes.fieldMenu = {
    enter() { menuIndex = 0; },
    update() {
      if (I.pressed("cancel")) { Game.go("overworld:resume"); return; }
      menuIndex = navigate(menuIndex, entries.length);
      if (I.pressed("confirm")) Game.go(entries[menuIndex][1]);
    },
    draw() {
      frame("冒險選單", "方向鍵選擇　確認開啟　取消回地圖");
      list(entries.map(([label]) => label), menuIndex, 16, 52, 448, 3);
    },
  };

  Game.scenes.dex = {
    enter() {
      const { caught, seen } = Game.state;
      const rank = (id) => caught.includes(id) ? 0 : seen.includes(id) ? 1 : 2;
      dexIds = [...Game.monsterIds].sort((a, b) => rank(a) - rank(b));
      dexIndex = 0;
    },
    update() {
      if (I.pressed("cancel")) { Game.go("fieldMenu"); return; }
      dexIndex = navigate(dexIndex, dexIds.length);
    },
    draw() {
      const { seen, caught } = Game.state;
      frame("星靈圖鑑", "方向鍵瀏覽　取消回選單");
      R.text("收服 " + caught.length + "　遇過 " + seen.length + " / " + dexIds.length,
        462, 17, { align: "right", size: 14, color: "#d9def2" });
      const first = Math.min(Math.max(0, dexIndex - 2), Math.max(0, dexIds.length - 6));
      R.box(12, 52, 166, 206);
      dexIds.slice(first, first + 6).forEach((id, i) => {
        const y = 63 + i * 30;
        const selected = first + i === dexIndex;
        const known = seen.includes(id);
        const number = String(Game.monsterIds.indexOf(id) + 1).padStart(2, "0");
        if (selected) R.rect(19, y - 3, 152, 26, "#e8dfca");
        R.text(number, 27, y + 3, { size: 12, color: "#656781" });
        R.text(known ? Game.monsters[id].name : "未遇見", 54, y, {
          size: 15, color: known ? R.COLORS.ink : "#6e7285",
        });
        if (caught.includes(id)) R.text("✦", 157, y + 1, { size: 14, color: "#85602e" });
      });
      const id = dexIds[dexIndex];
      const species = Game.monsters[id];
      R.box(188, 52, 280, 206);
      if (!seen.includes(id)) {
        R.text("尚未遇見", 205, 75, { size: 17, color: R.COLORS.ink });
        R.text("遇見這隻星靈後會顯示資料。", 205, 105, { size: 14, color: R.COLORS.inkSoft });
        return;
      }
      R.text(caught.includes(id) ? "已收服" : "已遇見", 205, 69, { size: 12, color: "#80602e" });
      Game.Art.monster(species, 292, 64, 4);
      R.text(species.name, 204, 142);
      R.typeLabel(species.type, 419, 140);
      R.wrap(species.description, 244, 15).slice(0, 3).forEach((line, i) => {
        R.text(line, 204, 174 + 21 * i, { size: 15 });
      });
    },
  };

  Game.scenes.bag = {
    enter() { itemIndex = 0; targetIndex = null; bagNote = ""; },
    update() {
      const ids = Game.itemIds;
      const { party, inventory } = Game.state;
      if (I.pressed("cancel")) {
        if (targetIndex !== null) { targetIndex = null; bagNote = ""; }
        else Game.go("fieldMenu");
        return;
      }
      if (targetIndex === null) {
        itemIndex = navigate(itemIndex, ids.length);
        if (I.pressed("confirm")) {
          if (inventory[ids[itemIndex]] > 0) { targetIndex = 0; bagNote = ""; }
          else bagNote = "這個道具已用完。";
        }
        return;
      }
      targetIndex = navigate(targetIndex, party.length);
      if (!I.pressed("confirm")) return;
      const id = ids[itemIndex];
      const monster = party[targetIndex];
      const restored = Game.Rules.healingAmount(monster.hp, Game.statsOf(monster).maxHp, Game.items[id].heal);
      if (!restored) {
        bagNote = "目標已滿血或已倒下，道具未消耗。";
        return;
      }
      monster.hp += restored;
      inventory[id] -= 1;
      Game.Save.write();
      targetIndex = null;
      bagNote = Game.monsters[monster.species].name + " 恢復 " + restored + " HP。";
    },
    draw() {
      const ids = Game.itemIds;
      const { inventory, crystals, party } = Game.state;
      frame("背包　星晶 " + crystals + " 顆", bagNote || "方向鍵選擇　確認使用　取消返回");
      if (targetIndex === null) {
        list(ids.map((id) => Game.items[id].name + " ×" + inventory[id]), itemIndex, 12, 52, 212, 5);
        R.box(234, 52, 234, 177);
        const item = Game.items[ids[itemIndex]];
        const detail = item?.description || "目前沒有道具。";
        R.wrap(detail, 204).slice(0, 4).forEach((line, i) => R.text(line, 249, 69 + i * 24));
        return;
      }
      list(party.map((m) => Game.monsters[m.species].name + "　" + m.hp + " / " + Game.statsOf(m).maxHp + " HP"),
        targetIndex, 12, 52, 456);
    },
  };
})();
