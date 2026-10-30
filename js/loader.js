// loader.js：自動掃描 data/ 資料夾，不需要任何手動登記的清單。
// 每批試 20 個編號（001 到 020、021 到 040……）。找不到的檔案靜默略過。
// 一整批都沒有就停，所以編號要連續，缺號不能超過 19 個。
// 這是底層檔案。要改請先開 issue。
(function () {
  "use strict";

  const BATCH = 20;
  const MAX_NUMBER = 999;
  const FOLDERS = ["moves", "monsters", "maps"];

  const pad = (n) => String(n).padStart(3, "0");

  function loadScript(path) {
    return new Promise((resolve) => {
      const el = document.createElement("script");
      el.src = path;
      el.async = false; // 依插入順序執行，編號小的先註冊
      el.onload = () => {
        if (!Game.registeredFiles.has(el.src)) {
          Game.loadErrors.push(path + " 沒有註冊成功，請檢查語法或 id");
        }
        resolve(true);
      };
      el.onerror = () => {
        el.remove();
        resolve(false);
      };
      document.head.appendChild(el);
    });
  }

  async function loadFolder(folder) {
    for (let start = 1; start <= MAX_NUMBER; start += BATCH) {
      const paths = [];
      for (let n = start; n < start + BATCH && n <= MAX_NUMBER; n += 1) {
        paths.push("data/" + folder + "/" + pad(n) + ".js");
      }
      const results = await Promise.all(paths.map(loadScript));
      if (!results.some(Boolean)) return;
    }
  }

  async function boot() {
    for (const folder of FOLDERS) await loadFolder(folder);
    if (!Game.mapIds.length) Game.loadErrors.push("找不到任何地圖");
    if (!Game.monsterIds.some((id) => Game.monsters[id].starter)) {
      Game.loadErrors.push("找不到任何起始星靈");
    }
    Game.showLoadErrors();
    if (Game.mapIds.length && Game.monsterIds.length) Game.start();
  }

  boot();
})();
