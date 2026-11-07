# 教學基礎與學員接手表

「七成」以每個系統有一條可玩的示範和清楚的擴充點來定義。學員可以決定新增內容的樣子，並用一張 issue 的驗收條件檢查結果。

先確認 [PR #38](https://github.com/Lee-unhn/Game_AIstar/pull/38) 已合併，再更新 `main` 做表中的任務。原有星靈、招式與試玩題依各自 issue 的依賴執行。

| 部分 | 基礎版可操作的示範 | 學員要設計的部分 |
|---|---|---|
| 世界、地圖和對話 | 五張地圖可往返。照護員能補給，NPC 對話可快轉 | [#40 霧港支線](https://github.com/Lee-unhn/Game_AIstar/issues/40) |
| 對戰和招式 | 野戰可打、逃、收服。星塔固定隊伍可通關，血條動畫後才繼續 | [#41 相剋預覽](https://github.com/Lee-unhn/Game_AIstar/issues/41)、[#12–17 原創招式](https://github.com/Lee-unhn/Game_AIstar/issues?q=is%3Aissue+label%3A%E6%8B%9B%E5%BC%8F) |
| 收集和圖鑑 | 圖鑑分未遇、遇過和收服，可看圖像及描述，紀錄可讀回 | [#42 圖鑑篩選](https://github.com/Lee-unhn/Game_AIstar/issues/42) |
| 背包和補給 | 星晶有數量。凝露瓶可在走動時替一隻未倒下的星靈回血 | [#43 第二種恢復道具](https://github.com/Lee-unhn/Game_AIstar/issues/43) |
| 星靈和進化 | 苔石龜升到 Lv.6 進化為林冠龜，保留等級、經驗與招式 | [#44 第二組進化](https://github.com/Lee-unhn/Game_AIstar/issues/44)、[#2–11 原創星靈](https://github.com/Lee-unhn/Game_AIstar/issues?q=is%3Aissue+label%3A%E6%98%9F%E9%9D%88) |
| 音樂和音效 | 標題、探索、對戰有配樂。操作後啟動，可靜音並記住設定 | [#45 星塔旋律](https://github.com/Lee-unhn/Game_AIstar/issues/45) |
| 原創美術 | 原創封面、角色和 16×16 星靈點陣已能離線載入 | [#46 星塔地板](https://github.com/Lee-unhn/Game_AIstar/issues/46) |
| 操作和畫面 | 鍵盤與直向手機共用移動、確認、取消，冒險選單可返回 | [#47 短橫向版面](https://github.com/Lee-unhn/Game_AIstar/issues/47) |
| 存檔和復原 | 保存隊伍、通關、圖鑑與道具。舊存檔補預設值，重開先確認 | [#48 顯示存檔狀態](https://github.com/Lee-unhn/Game_AIstar/issues/48) |
| 隊伍管理 | 看血量、等級、招式名稱，可調整隊首並保存 | [#49 隊伍詳情](https://github.com/Lee-unhn/Game_AIstar/issues/49) |

## 每張 issue 的交付紀錄

1. 寫下 issue 編號、允許改的檔案，以及你要自行設計的項目。
2. 按 [AI 工作守則](../AGENTS.md) 執行兩條 Node 檢查。資料題先用 [資料格式](DATA_FORMAT.md) 核對編號、引用和點陣。
3. 雙擊 `index.html`，用正常操作走到 issue 指定畫面。PR 寫出起點、按鍵或路線、看到的結果。若有拒絕或取消分支，補測一次並記錄。
4. 影響手機、音效、存檔時，分別核對觸控和畫面邊界、首次操作與靜音、重開後的結果。需要測試準備資料時，只在測試環境設定，遊戲檔不加入捷徑。
5. 使用 `Closes #編號` 只連這次驗收完成的任務。還有問題時用草稿 PR 寫清楚卡點。

星靈 `006`–`015` 和招式 `009`–`014` 由原任務分配。講師星靈示例使用 `016`–`018`。已有認領或 PR 的任務保持原負責人。進化、地圖或招式需要跨檔時，先在 issue 寫出檔名及會碰到的其他任務。
