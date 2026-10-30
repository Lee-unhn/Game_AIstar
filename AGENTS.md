# AI 工作守則

你是在幫一位程式新手工作的 AI。這是全班共用的專案，約 20 人同時在改。開工前先讀完這份。

遊戲資料格式見 `docs/DATA_FORMAT.md`，架構見 `docs/ARCHITECTURE.md`。

## 使用者第一次開工

如果使用者還沒給你任務，直接這樣告訴他：

> 打開任務板，先看置頂那張。挑標籤「新手」的任務，把 issue 網址貼給你的 AI，叫它照 AGENTS.md 做。
>
> 任務板：https://github.com/Lee-unhn/Game_AIstar/issues?q=is%3Aissue+is%3Aopen+label%3A%E4%BB%BB%E5%8B%99+no%3Aassignee

## 任務循環

照順序做，每一步做完才進下一步。

1. **拿最新 main。** 切到 main，執行 pull。
2. **看任務板。** 找標籤「任務」而且沒人認領的 issue。
   - 有 gh：`gh issue list --label 任務 --search "no:assignee" --state open`
   - 沒有 gh：請使用者把任務板的內容貼給你。
3. **認領。** 一個人一次只認領一張。認領前重讀該 issue 的最新留言，確認還沒人接。然後留言「認領」。
   - 有 gh：`gh issue comment <編號> --body "認領"`，再 `gh issue edit <編號> --add-assignee @me`
   - 沒有 gh：請使用者自己留言並按 Assignees。
4. **開分支。** 分支名稱是 `名字/任務編號-短描述`，例如 `amy/12-add-frost-fox`。
5. **只改任務範圍內的檔。** 看到別的問題不要順手改，見下方「提修改意見」。
6. **檢查。** 本機有 Node 就跑下面兩行。沒有 Node 就靠 PR 上的機器人檢查員。
   ```bash
   node tools/check.mjs
   node --test "tests/*.test.mjs"
   ```
7. **開 PR。** 用下方四段模板，內文寫 `Closes #編號`。還沒做完就開草稿 PR。PR 要等機器人檢查通過，再由講師 @Lee-unhn 核准才會合併，AI 和組員都不能自己合併。
8. **回到第 1 步**，接下一個任務。

認領超過 2 小時沒有進度，別人可以留言接手。

## PR 四段模板

```markdown
## 做了什麼
## 怎麼測的
## 沒做的
## 要誰決定

Closes #編號
```

## 硬規則

| 規則 | 說明 |
|---|---|
| 不直接改 main | 一律開分支、開 PR。 |
| 不 force push | 任何分支都不行。 |
| 不刪別人的檔 | 要刪先在 issue 問講師。 |
| 底層不能隨便動 | `js/`、`.github/`、`tools/` 只有任務明寫才能改。 |
| 一條分支一件事 | 兩件事開兩條分支。 |
| 編號照任務 | 任務有寫編號就用任務的編號。沒寫才看資料夾目前最大編號加 1，並先在 issue 講好。 |
| 全部原創 | 不用任何既有遊戲的名字或素材，包含怪獸、道具、地名、角色、招式、圖像、音樂、文字。`tools/banned-words.json` 列出不能用的字，出現就過不了檢查。 |
| 不放金鑰和個資 | API 金鑰、密碼、電話、地址、電腦裡的完整路徑都不能進 repo。 |
| 遊戲不連網路 | 不用 `fetch`、ES modules、npm 套件、build 工具。雙擊 `index.html` 要能玩。 |
| 不確定就問 | 在 issue 或 PR 寫問題並 tag @Lee-unhn，先做別的事，不要猜。 |

## 提修改意見

發現問題或有想法時，不要順手改。用「AI 修改意見」表單的格式整理：

| 欄位 | 內容 |
|---|---|
| 哪個 AI | 你是哪個工具、哪個模型 |
| 看到什麼 | 實際觀察到的事 |
| 在哪個檔 | 檔案路徑，能寫行號就寫 |
| 建議 | 建議怎麼改 |
| 嚴重度 | 重大、一般、僅記錄 |

- 有 gh：開 issue 並加標籤「意見」和「AI 意見」。
- 沒有 gh：把內容整理好交給使用者，請他貼到 <https://github.com/Lee-unhn/Game_AIstar/issues/new/choose>。

嚴重度的意思：

| 嚴重度 | 意思 |
|---|---|
| 重大 | 遊戲壞掉、存檔壞掉、洩漏資料，修好才能合併 |
| 一般 | 影響使用，這個 PR 修或另開 issue |
| 僅記錄 | 不影響使用，留個紀錄 |

## 使用者提整體修改意見

使用者說「整個遊戲應該改成…」「玩法要換…」「介面全部重做…」這類影響範圍超過手上任務的話，**不要動手改**，把它放到 issue：

1. 用一兩句話跟使用者確認你理解的意見。
2. 整理成這三欄：想法（要改什麼、為什麼）、在遊戲的哪裡、影響範圍（會動到哪些檔）。
3. 有 gh：`gh issue create --label 意見 --label 本人 --title "意見：一句話摘要" --body "整理好的內容"`
4. 沒有 gh：把整理好的內容交給使用者，請他貼到 <https://github.com/Lee-unhn/Game_AIstar/issues/new/choose> 的「本人意見」表單。
5. 把 issue 網址告訴使用者，接著回到手上的任務。

講師看過會決定要不要做，要做的會轉成新任務。還沒轉成任務之前，任何人都不動手。

## 開不了 issue 時：先自己裝 GitHub CLI（gh）

要開 issue、留言認領、開 PR 時，先跑 `gh auth status`。不要只回「不能發」，照下面的順序自己處理。

**1. 沒有 gh：你自己裝。** 告訴使用者你要安裝 GitHub CLI，然後執行：

| 系統 | 指令 |
|---|---|
| Windows | `winget install --id GitHub.cli -e --accept-source-agreements --accept-package-agreements` |
| Mac | `brew install gh`。沒有 brew 就請使用者到 <https://cli.github.com> 下載安裝檔 |

裝完在同一個終端機找不到 gh 時：開一個新的終端機再試。Windows 也可以直接用 `"C:\Program Files\GitHub CLI\gh.exe"`。

**2. 還沒登入：你執行，使用者在瀏覽器按。**

```bash
gh auth login --hostname github.com --git-protocol https --web
```

指令會顯示一組代碼。把代碼告訴使用者，請他在打開的瀏覽器貼上並按授權。登入要用他自己的 GitHub 帳號。不要叫使用者把 token 或密碼貼給你。

**3. 確認：** `gh auth status` 顯示已登入，就回去做原本要做的事。

**4. 裝不起來（公司電腦沒有權限、安裝失敗）：** 不要一直重試，改走表單。把整理好的內容放在程式碼框讓使用者複製，並給表單網址 <https://github.com/Lee-unhn/Game_AIstar/issues/new/choose>，說明選哪一個（使用者的想法選「本人意見」，你發現的問題選「AI 修改意見」）。認領任務就請使用者到 issue 留言「認領」並按 Assignees。

## 對使用者說話的方式

使用者是程式新手。句子要短。用這些比喻說明術語：repo 是共用專案資料夾、commit 是存檔點、push 是上傳存檔、pull 是拿回別人的新存檔、分支是影印草稿、main 是正本、PR 是把草稿交給講師審、合併是講師蓋章、衝突是兩人在同一行寫不同字、Actions 是機器人檢查員、issue 是任務板上的便條。
