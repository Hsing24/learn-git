# 🚀 Git Scenario Lab 使用手冊 & 現代實戰指南

歡迎來到 **Git Scenario Lab**！這是一套專為「單人自學 Git」量身打造的本地終端機實戰情境實驗室。
你可以直接在真實的終端機環境中，像玩闖關遊戲一樣鍛鍊 Git 肌肉記憶，掌握個人與團隊開發的必備技能。

---

## 🎯 為什麼需要這套工具？

學習 Git 最困難的往往不是基本指令，而是當面對以下情境時的無助感：
- **第一次使用 Git 不知道怎麼配帳號、每次 push 都要輸密碼、每次新分支都要加 `--set-upstream`**
- **多人協作時的分支衝突 (Merge Conflict)**
- **保持歷史乾淨整齊的變基 (Git Rebase)**
- **整理雜亂 commits 的互動式變基 (Interactive Rebase `rebase -i`)**
- **推送被遠端拒絕 (Non-Fast-Forward Push Rejection)**
- **手滑誤刪 commit 後的起死回生 (Git Reflog)**
- **不想 stash、避免中斷 IDE 與編譯快取的平行開發 (Git Worktree)**
- **在龐大歷史中秒殺神秘問題 (Git Bisect)**

**Git Scenario Lab** 只要一行指令，就能在獨立的練習目錄中自動搭建出最真實的專案現場！

---

## ⚡ 快速上手指令

在專案目錄下直接執行：

```bash
# 1. 查看所有關卡清單
./git-lab list

# 2. 啟動指定關卡 (例如啟動第 00 關或第 03 關)
./git-lab start 00
# 啟動後切換到練習目錄：
cd workspace

# 3. 查看當前關卡的任務簡報與目標
./git-lab status

# 4. 遇到瓶頸時獲取逐步提示
./git-lab hint

# 5. 完成操作後驗收成果
./git-lab verify

# 6. 如果不小心把分支弄得一團糟，一鍵重設該關卡
./git-lab reset

# 7. 查看當前 Commit 樹狀拓撲圖
./git-lab tree
```

---

## 📚 18 大實戰關卡地圖 (Curriculum)

| 關卡 ID | 難度 | 關卡名稱 | 核心學習技能 |
| :---: | :---: | :--- | :--- |
| **00** | 新手必備 🔰 | 起點裝備：Git 身分、SSH 憑證與自動建立遠端分支 | `user.name/email`, `push.autoSetupRemote`, SSH 免密金鑰 |
| **01** | 入門 ⭐ | 工作區、暫存區與第一個 Commit | `git status`, `git add`, `git commit` |
| **02** | 初階 ⭐⭐ | 分支流動：建立、切換與 Fast-Forward 合併 | `git branch`, `git switch`, `git merge` |
| **03** | 進階 ⭐⭐⭐ | 迎戰衝突：手動解決 Merge Conflict | 雙分支修改同一檔案、解讀衝突標記、完成合併 |
| **04** | 進階 ⭐⭐⭐ | 變基藝術：使用 git rebase 保持線性歷史 | 保持分支歷史整潔一條線，避免多餘 merge commit |
| **05** | 進階 ⭐⭐⭐ | 歷史整形：Interactive Rebase 整理零碎 Commit | `git rebase -i`、`squash` 與 `fixup` 整理提交訊息 |
| **06** | 實戰 ⭐⭐⭐⭐ | 模擬協作：遠端衝突與 Non-Fast-Forward 推送被拒 | 本地 Mock Remote、體驗推送被拒、`git pull --rebase` |
| **07** | 實戰 ⭐⭐⭐ | 精準挑選：跨分支 Cherry-pick 偷渡關鍵 Commit | `git cherry-pick` 單獨摘取特定修復 Commit |
| **08** | 實戰 ⭐⭐⭐⭐ | 起死回生：Git Reflog 拯救失蹤的 Commit | 救回 `git reset --hard` 誤刪的心血程式碼 |
| **09** | 實戰 ⭐⭐⭐⭐ | 雙軌並行：Git Worktree 免 Stash 零干擾平行開發 | `git worktree add/list/remove` 享受多目錄並行檢出 |
| **10** | 實戰 ⭐⭐⭐⭐⭐ | 時光偵探：Git Bisect 二分搜尋秒殺神秘 Bug | `git bisect start/bad/good` 在 O(log N) 步內找出元凶 |
| **11** | 實戰 ⭐⭐⭐⭐ | 守門神器：Git Hooks 自動化品管與敏感金鑰攔截 | `pre-commit`, `commit-msg`, `core.hooksPath` 敏感詞防護 |
| **12** | 進階 ⭐⭐⭐ | 精準原子暫存：git add -p 局部區塊暫存 (Patch Staging) | `git add -p` (hunk split, y/n), `git diff --staged` 實現 Atomic Commit |
| **13** | 初階 ⭐⭐ | 亡羊補牢：.gitignore 追蹤失效救援與 git rm --cached | `.gitignore` 生效原理、`git rm --cached` 索引除名保全本地檔案 |
| **14** | 實戰 ⭐⭐⭐⭐ | 線上緊急回滾：解救生產事故的 Revert Merge (git revert -m 1) | Merge Commit 雙親拓撲、`-m 1` 基準線指定、Re-revert 心法 |
| **15** | 初階 ⭐⭐ | 版本里程碑：Git Tag 與語意化版號發布 (Semantic Versioning) | 輕量標籤 vs 附註標籤 (`git tag -a`), 歷史補簽, `git push --tags` |
| **16** | 進階 ⭐⭐⭐ | 代碼考古學：git log -S 語意搜尋與 git blame 責任溯源 | `git log -S` (Pickaxe) 增減檢索、`git blame -w` 忽略格式排版 |
| **17** | 實戰 ⭐⭐⭐⭐ | 重複衝突終結者：git rerere 記錄與自動重用解法 | `git config rerere.enabled true`, 自動記憶衝突解法、Rebase 省時黑魔法 |

---

## 🛠️ 現代 Git 指令演進：經典舊指令 vs. 現代更優實現速查表

許多早期的教學書籍充斥著容易混淆、承擔過多職責的舊指令。現代 Git（2.23+）進行了大幅現代化升級，以下為業界推薦的現代更優替代方案：

| 功能情境 | 傳統舊指令 | 現代更優替代指令 | 為什麼現代實現更好？ |
| :--- | :--- | :--- | :--- |
| **切換分支** | `git checkout <branch>` | `git switch <branch>` | `checkout` 承擔太多功能（切分支/復原檔案），打錯容易覆蓋檔案；`switch` 專注於分支切換，安全明確。 |
| **建立並切換新分支** | `git checkout -b <new>` | `git switch -c <new>` | 語意清晰對稱（`-c` 代表 create），避免混淆。 |
| **放棄工作區檔案修改** | `git checkout -- <file>` | `git restore <file>` | `checkout --` 語法晦澀難記；`restore` 顧名思義就是還原，直觀自然。 |
| **將檔案移出暫存區 (Unstage)**| `git reset HEAD <file>` | `git restore --staged <file>` | 不再需要搬出危險的 `reset` 指令，`restore --staged` 語意精準。 |
| **跨分支平行任務 (Hotfix)** | `git stash` ➜ 切換 ➜ pop | `git worktree add <dir> <branch>` | `stash` 會破壞 node_modules、編譯快取與 IDE 索引，且 pop 容易衝突；`worktree` 目錄實體隔離，平行開發互不干擾。 |
| **新分支首次推送** | `git push -u origin <branch>` | `git config --global push.autoSetupRemote true` 後直接 `git push` | 設定一次一勞永逸，任何新分支直接敲 `git push`，Git 自動在遠端建同名分支並追蹤。 |
| **同檔局部暫存 (Atomic)** | 盲目整檔 `git add .` | `git add -p <file>` | 依 Hunk 逐塊選擇（y/n/s），確保每個 Commit 具備單一職責，大幅提升 Code Review 品質。 |
| **停止追蹤敏感檔案** | 刪除本機實體檔案再加 ignore | `git rm --cached <file>` | 僅從 Git 索引除名，完全保全本機開發所需的配置資料與環境變數。 |
| **線上回滾 Merge PR** | 覆蓋歷史的危險 force push | `git revert -m 1 <merge_hash>` | 向前推進產生反轉提交，清楚保留審計紀錄，不破壞團隊他人歷史。 |
| **重用衝突解法 (Rebase)** | 每次 rebase 手動解 10 次 | `git config --global rerere.enabled true` | Git 自動記憶衝突解決方案，後續相同衝突區塊 0 秒全自動填入！ |
| **代碼精確考古** | 盲翻數百個 log 提交訊息 | `git log -S "<字串>" --oneline` | 鶴嘴鎬 (Pickaxe) 只列出『變更該字串出現次數』的提交，精準度百倍。 |
| **修復前次 Commit (Typo)** | 手動 `rebase -i` 逐行改 squash | `git commit --fixup <hash>`<br>+ `git rebase -i --autosquash` | Git 自動將 fixup 提交搬移到目標下方並自動合併，零手動編輯風險。修補最後一筆更可直接用 `git commit --amend --no-edit`。 |
| **拉取遠端最新代碼** | `git pull`（預設 merge） | `git pull --rebase`<br>（或 `git config --global pull.rebase true`） | 消除團隊中雜亂無章的 "Merge branch 'main' of github.com" 交叉菱形節點，保持乾淨線性歷史。 |
| **二分搜尋定位 Bug** | 手動反覆測試打 `good/bad` | `git bisect run <測試腳本>` | 例如 `git bisect run pytest`，Git 全自動在幾秒內執行腳本並鎖定第一個壞掉的 Commit。 |
| **Git Hooks 團隊共享** | 手動複製腳本至 `.git/hooks/` | `git config core.hooksPath .githooks`<br>或使用 Husky / Lefthook | `.git/hooks` 屬於本地私有目錄無法納入版本控制；`core.hooksPath` 或現代工具能將 hooks 一併納入 repo 追蹤，團隊成員自動生效。 |
| **安全的後悔藥** | 危險的 `git reset --hard` | 團隊協作用 `git revert`；<br>本地重整用 `git reset --soft` | `reset --hard` 會直接拋棄代碼；`revert` 安全向前推進，`reset --soft` 保留改動在暫存區以供重組。 |
| **分支樹狀圖檢視** | 密密麻麻長指令 `git log --graph...` | `git config --global alias.lg "log --graph --all --decorate --oneline"` | 設定別名後隨時敲 `git lg`，一秒看清所有分支交錯關係。 |

---

## ⚡ 深入剖析：Git Worktree vs. Git Stash 的正確分工

### 該用 `git worktree` 的時機：
1. **緊急 Hotfix 插單**：當前正在開發大功能，工作區檔案正在被本地伺服器監聽，不想重開 Dev Server 或刷新編譯快取。
2. **Code Review 同事的分支**：在獨立目錄打開同事的 PR 分支，甚至能同時跑兩個 port 進行行為對比。
3. **避免建構快取失效**：在大型前端 (React/Vite) 或後端 (Java/Rust/Go) 專案中，切換分支往往需要重新執行 `npm install` 或整包 rebuild，worktree 完全避免了這項耗時操作。

### 什麼時候 `git stash` 依然是好工具？
1. **同分支短暫暫存 (< 5 分鐘)**：例如你寫了兩行除錯用的 `console.log`，想暫存起來看一下原本的效果，確認完馬上 `git stash pop`。
2. **快速拉取遠端最新代碼**：本地有未提交的草稿，同事推了新版，快速 `git stash` ➜ `git pull --rebase` ➜ `git stash pop`。

---

## 🛡️ 深入剖析：Git Hooks 自動化防護與團隊工程化實踐

### 什麼是 Git Hooks？
Git Hooks 是 Git 在特定生命週期事件觸發時（如 commit 前、產生提交訊息後、push 前）自動調用的自訂腳本。最常見的三大守門員：
1. **`pre-commit`**：在建立 commit 之前執行。適合用來執行代碼排版 (Prettier/Black)、語法檢查 (ESLint/Flake8)、快速單元測試，以及**攔截 API Key、Private Key 等敏感機密**。
2. **`commit-msg`**：在編寫完 commit 訊息後執行。常用於強制要求團隊符合 Conventional Commits 規範（例如必須包含 `feat:`, `fix:`, `docs:` 等開頭）。
3. **`pre-push`**：在推送至遠端伺服器前執行全量測試，防止壞掉的代碼污染遠端 CI/CD pipeline。

### 團隊痛點與現代解決方案：
- **傳統痛點**：預設的 `.git/hooks/` 目錄**不會被 Git 版本控管追蹤**！若每位工程師都需要手動複製貼上腳本，極易遺漏且無法隨代碼庫一起更新。
- **現代最佳實踐 1（Git 原生免依賴）**：
  在專案中建立 `.githooks/` 目錄並放入腳本，執行：
  ```bash
  git config core.hooksPath .githooks
  ```
  即可讓該倉庫自動使用 `.githooks` 目錄中的鉤子，並隨 Git 庫一同版本控管與分發！
- **現代最佳實踐 2（團隊生態系工具）**：
  - **Husky + lint-staged**（前端 Node.js 生態標配）：自動在 `npm install` 時註冊 hooks，且 `lint-staged` 只檢查 Staged（暫存區）中的檔案，避免全量檢查拖慢提交速度。
  - **Lefthook**（Go 撰寫、極速多語言支援）：設定簡潔、支援多任務平行執行 (Parallel runs)，適合各類大型多語言專案。
  - **pre-commit**（Python 生態首選）：基於 Python 的通用 hook 框架，可自動下載與管理隔離環境中的檢查工具。

### 緊急繞過方式：
在極少數突發狀況或緊急 Hotfix 下，可加上 `--no-verify` 參數繞過 hook 檢查：
```bash
git commit -m "hotfix: emergency patch" --no-verify
```
> [!CAUTION]
> `--no-verify` 會跳過所有守門員驗證，可能導致未檢查的代碼或敏感金鑰漏出，非緊急情況切勿隨意濫用！

---

## 🧩 深度探索：`git add -p` 與原子提交 (Atomic Commits)

### 為什麼工程師討厭「巨大混合提交」？
當一個 Commit 同時包含：1 個 Bug 修復、1 個新功能、3 處縮排排版修改時，Code Reviewer 很難看出哪個改動屬於哪項需求。更可怕的是：日後若該新功能出問題想要 `git revert`，你會連同 Bug 修復一起被撤銷！

### `git add -p` 的威力：
以代碼塊 (Hunk) 為單位互動暫存：
- `y`：暫存此區塊 (Stage this hunk)
- `n`：跳過此區塊 (Do not stage this hunk)
- `s`：拆分區塊 (Split into smaller hunks)
- `q`：退出 (Quit)
- `e`：手動編輯區塊 (Manually edit hunk)

搭配 `git diff --staged` 審查，確保進入暫存區的只有單一職責的變更，這就是頂尖工程師的「原子提交藝術」。

---

## ⚠️ 深度探索：`.gitignore` 追蹤失效與 `git rm --cached`

### 核心真相：
**`.gitignore` 只能忽略「未被追蹤 (Untracked)」的檔案！**
若一個檔案（如 `.env`）在加入 `.gitignore` 之前就已經被 `git add` 或 `commit`，它就已經進入了 Git 的索引 (Index/Stage)。後續即使修改 `.gitignore`，Git 依然會持續追蹤其變更。

### 正確處方籤：
```bash
# 1. 僅從 Git 索引除名（硬碟本機實體檔案完好無損）
git rm --cached .env

# 2. 確保 .gitignore 包含該檔案
echo ".env" >> .gitignore

# 3. 提交變更
git commit -m "chore: stop tracking .env and add to .gitignore"
```

> [!WARNING]
> 切勿使用一般系統指令 `rm .env` 或直接執行 `git rm .env`（沒有 `--cached`），那會連同你本機辛苦配置的資料庫連線密碼一併永久刪除！

---

## 🚨 深度探索：Revert Merge Commit (`git revert -m 1`) 與 Re-Revert 難題

### 為什麼回滾 Merge Commit 需要 `-m 1`？
一般 Commit 只有 1 個父節點，回滾只需直接還原該變更。
但 Merge Commit 具有 **雙親 (Two Parents)**：
- **Parent 1 (`-m 1`)**：合併前你原本所在的主線分支（例如 `main`）
- **Parent 2 (`-m 2`)**：被合併進來的特徵分支（例如 `feature`）

Git 必須知道你想以誰作為基準線。因此：
```bash
git revert -m 1 <merge-commit-hash>
```
意思是：「以主線為基準，將該次合併所引入的所有差異完全反轉！」

### 「Re-revert 難題」：日後修好 bug 想要重新合回該分支？
如果你日後修好 feature 分支想再次 `git merge feature`，你會震驚地發現：先前被 revert 掉的代碼**不會被合進來**！因為 Git 認為那些 commit 早已存在於歷史中。
**正確解法**：先對當時的 Revert Commit 做一次 Revert（即 Re-revert）：
```bash
git revert <revert-commit-hash>
git merge feature
```

---

## 🧙‍♂️ 深度探索：`git rerere` 重用已記錄的衝突解決方案

### 什麼是 rerere？
`rerere` 全名為 **Reuse Recorded Resolution**（重用已記錄的衝突解法）。
當你在一個包含多個 Commit 的特徵分支上進行 Rebase 時，同一個衝突可能會在每個 Step 不斷重複出現，迫使你反覆手動解 10 次一模一樣的衝突！

### 一鍵啟用黑魔法：
```bash
git config --global rerere.enabled true
```
啟用後：
1. 第一次遇到衝突時，Git 在背景自動記錄衝突前的代碼外觀 (Preimage)。
2. 你手動解決並提交後，Git 自動記錄你的最終解法 (Recorded resolution)。
3. 下一次（甚至幾週後）遇到完全相同的衝突區塊時，Git 自動套用你的解法：`Resolved 'file' using previous resolution`！

---

## 🛡️ 系統特點與沙盒防護

1. **純本地零依賴**：完全採用系統內建 Python 3，不需安裝任何額外套件。
2. **完全獨立的 Workspace**：所有關卡練習均在 `workspace/` 目錄中進行，絕不破壞外部專案本身。
3. **隨時重來不怕壞**：任何時候只要迷失方向或操作失誤，輸入 `./git-lab reset` 即可秒速恢復至該關卡的起始狀態。
