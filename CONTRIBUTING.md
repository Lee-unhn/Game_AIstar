# 協作流程

這份寫給人看，用 GitHub Desktop 的按鈕說明。流程來自多人黑客松的實際做法：先認領再開工，一人一條分支，每個 PR 都有人審。

## 一次任務的完整流程

### 1. 認領

1. 到 [任務板](https://github.com/Lee-unhn/Game_AIstar/issues?q=is%3Aissue+is%3Aopen+label%3A任務) 找一張沒人認領的便條。
2. 讀完最新留言，確認沒有人接。
3. 留言「認領」，右側 Assignees 選你自己。

認領超過 2 小時沒有進度，別人可以留言接手。

### 2. 拿最新的正本

1. 打開 GitHub Desktop。
2. 上方 `Current Branch` 選 `main`。
3. 按 `Fetch origin`，出現 `Pull origin` 就按下去。

### 3. 開一條自己的分支

1. 按 `Current Branch → New Branch`。
2. 名稱寫 `名字/任務編號-短描述`，例如 `amy/12-add-frost-fox`。
3. 按 `Create Branch`，再按 `Publish branch`。

一人一條分支，一條分支一件事。

### 4. 叫 AI 改

把 [docs/PROMPTS.md](docs/PROMPTS.md) 裡的提示詞貼給 AI。改完雙擊 `index.html` 玩一次，確認遊戲打得開。

### 5. 存檔並上傳

1. GitHub Desktop 左下寫一句說明。
2. 按 `Commit to 你的分支`。
3. 按 `Push origin`。

### 6. 開 PR

1. 按 `Create Pull Request`，瀏覽器會打開 GitHub。
2. 填四段：

| 段落 | 寫什麼 |
|---|---|
| 做了什麼 | 這次改了哪些東西 |
| 怎麼測的 | 你實際做了什麼確認它能動 |
| 沒做的 | 任務裡還沒完成的部分 |
| 要誰決定 | 需要講師決定的事 |

3. 內文加一行 `Closes #任務編號`，合併時任務會自動關閉。

**草稿 PR：** 還沒做完也可以先開。綠色按鈕旁的箭頭選 `Create draft pull request`。做好了按 `Ready for review` 交給講師。

### 7. 等機器人和講師

機器人檢查員會自動跑。亮紅燈就點進去看訊息，訊息會寫哪個檔哪一欄有問題。把訊息貼給 AI 修，修完再 commit、push，同一個 PR 會自動更新。

講師核准後蓋章，遊戲自動上線。

## 審查留言三類

| 類別 | 意思 | 你要做什麼 |
|---|---|---|
| 要修 | 這裡要改 | 改完回覆「已修」 |
| 要問 | 講師想知道原因 | 回答問題 |
| 要等 | 這件事要等別的東西 | 先不動，做別的 |

## 問題分級

| 等級 | 意思 | 怎麼處理 |
|---|---|---|
| 重大 | 遊戲壞掉、存檔壞掉、洩漏資料 | 不合併，修好再說 |
| 一般 | 影響使用 | 這個 PR 修，或另開 issue |
| 僅記錄 | 不影響使用 | 留紀錄就好 |

## 追平

別人的 PR 合併後，你的草稿會落後正本。交 PR 前要追平：

1. GitHub Desktop 切到你的分支。
2. 選單 `Branch → Update from main`。
3. 沒有衝突就按 `Push origin`。

## 解衝突

衝突是兩人在同一行寫不同字。追平時跳出衝突視窗就照這樣做：

1. 按檔案旁的 `Open in Visual Studio Code`，或把提示詞「解衝突」貼給 AI。
2. 檔案裡會看到 `<<<<<<<`、`=======`、`>>>>>>>` 三種記號，中間是兩邊的版本。
3. 兩邊要留的都留下，三種記號全部刪掉。
4. 回 GitHub Desktop 按 `Continue merge`，再 `Push origin`。

新資料一物一檔，只要編號不撞，就不會衝突。所以開工前要先在 issue 講好編號。

## 提意見

**人提意見：** 到 [issue 表單](https://github.com/Lee-unhn/Game_AIstar/issues/new/choose) 選「我的意見」。

**AI 提意見：** 選「AI 修改意見」，把 AI 整理好的內容貼上。要附這幾項：哪個 AI、看到什麼、在哪個檔、建議怎麼改、嚴重度。

看到問題不要順手改。先提出來，由講師決定要不要開成任務。

## 不能碰的地方

`js/`、`.github/`、`tools/` 是底層。任務沒有明寫就不要改，想改先開 issue。

遊戲全部原創。既有遊戲的名字、圖像、音樂、地圖、文字都不能用，機器人會掃 `tools/banned-words.json` 裡的字。
