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

## 📚 11 大實戰關卡地圖 (Curriculum)

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
| **修復前次 Commit (Typo)** | 手動 `rebase -i` 逐行改 squash | `git commit --fixup <hash>`<br>+ `git rebase -i --autosquash` | Git 自動將 fixup 提交搬移到目標下方並自動合併，零手動編輯風險。修補最後一筆更可直接用 `git commit --amend --no-edit`。 |
| **拉取遠端最新代碼** | `git pull`（預設 merge） | `git pull --rebase`<br>（或 `git config --global pull.rebase true`） | 消除團隊中雜亂無章的 "Merge branch 'main' of github.com" 交叉菱形節點，保持乾淨線性歷史。 |
| **二分搜尋定位 Bug** | 手動反覆測試打 `good/bad` | `git bisect run <測試腳本>` | 例如 `git bisect run pytest`，Git 全自動在幾秒內執行腳本並鎖定第一個壞掉的 Commit。 |
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

## 🛡️ 系統特點與沙盒防護

1. **純本地零依賴**：完全採用系統內建 Python 3，不需安裝任何額外套件。
2. **完全獨立的 Workspace**：所有關卡練習均在 `workspace/` 目錄中進行，絕不破壞外部專案本身。
3. **隨時重來不怕壞**：任何時候只要迷失方向或操作失誤，輸入 `./git-lab reset` 即可秒速恢復至該關卡的起始狀態。
