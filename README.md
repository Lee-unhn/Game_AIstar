# AI 星靈物語（AI Star）

[English](README.en.md)

全班一起用 AI 蓋出來的原創怪獸收集 RPG。走進草叢遇到星靈，對戰、用星晶收服、組隊變強。

**線上玩：** <https://lee-unhn.github.io/Game_AIstar/>

也可以把專案抓回電腦後，雙擊 `index.html` 直接玩。不用安裝任何東西。

## 操作鍵

| 動作 | 鍵盤 | 手機 |
|---|---|---|
| 移動 | 方向鍵或 WASD | 左下方向鈕 |
| 確認、對話 | Z 或 Enter | Z 鈕 |
| 取消、開隊伍 | X 或 Esc | X 鈕 |

## 三步加入

1. 把你的 GitHub 帳號給講師。
2. 到信箱或 GitHub 通知按「接受邀請」。
3. 打開 GitHub Desktop，按 `File → Clone repository`，選 `Lee-unhn/Game_AIstar`。

## 接任務、提意見

- **接任務：** 到 [任務板](https://github.com/Lee-unhn/Game_AIstar/issues?q=is%3Aissue+is%3Aopen+label%3A任務) 挑一張沒人認領的便條，留言「認領」。
- **提意見、開任務、回報錯誤：** 到 [issue 表單](https://github.com/Lee-unhn/Game_AIstar/issues/new/choose) 選一種填寫。你的 AI 想提修改意見，也走這裡的「AI 修改意見」表單。

完整步驟寫在 [CONTRIBUTING.md](CONTRIBUTING.md)。

## 最重要的規則

| 誰 | 可以做 | 不可以做 |
|---|---|---|
| 講師 | 直接改 main、審 PR、合併 | |
| 學員和學員的 AI | 開分支、在分支上改、開 PR | 直接改 main、force push、刪別人的檔 |
| 機器人檢查員 | 檢查每個 PR，沒過就亮紅燈 | |

所有 PR 都要機器人檢查通過，再由講師核准才會合併。合併後遊戲自動上線。

## 比喻對照表

| 術語 | 把它想成 |
|---|---|
| repo | 共用專案資料夾 |
| commit | 存檔點 |
| push | 上傳存檔 |
| pull | 拿回別人的新存檔 |
| 分支（branch） | 影印草稿 |
| main | 正本 |
| PR（pull request） | 把草稿交給講師審 |
| 合併（merge） | 講師蓋章 |
| 衝突（conflict） | 兩人在同一行寫不同字 |
| Actions | 機器人檢查員 |
| issue | 任務板上的便條 |

## 其他文件

| 文件 | 內容 |
|---|---|
| [CONTRIBUTING.md](CONTRIBUTING.md) | 完整協作流程，用 GitHub Desktop 的按鈕一步步說明 |
| [AGENTS.md](AGENTS.md) | 給 AI 看的工作守則 |
| [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) | 底層架構圖、想蓋什麼要改哪裡 |
| [docs/DATA_FORMAT.md](docs/DATA_FORMAT.md) | 星靈、招式、地圖的資料格式 |
| [docs/PROMPTS.md](docs/PROMPTS.md) | 可以直接複製給 AI 的提示詞 |
| [NOTICE.md](NOTICE.md) | 原創聲明與授權 |

## 可以直接貼給你的 AI 的開工提示詞

```text
這是全班協作的遊戲專案。請先讀 AGENTS.md，照裡面的任務循環工作。
第一步先拿最新的 main，再看任務板有哪些還沒人認領的任務，列給我選。
我選好之後，你替我認領、開分支、只改任務範圍內的檔、跑檢查、開 PR。
遇到不確定的事，不要猜，寫成問題留在 issue 或 PR 上。
```

## 授權

MIT 授權，見 [LICENSE](LICENSE)。講師：JasonLee。
