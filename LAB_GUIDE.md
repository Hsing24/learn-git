# 🚀 Git Scenario Lab 使用手冊 & 實戰指南

歡迎來到 **Git Scenario Lab**！這是一套專為「單人自學 Git」量身打造的本地終端機實戰情境實驗室。
你可以直接在真實的終端機環境中，像玩闖關遊戲一樣鍛鍊 Git 肌肉記憶，掌握個人與團隊開發的必備技能。

---

## 🎯 為什麼需要這套工具？

學習 Git 最困難的往往不是基本指令，而是當面對以下情境時的無助感：
- **多人協作時的分支衝突 (Merge Conflict)**
- **保持歷史乾淨整齊的變基 (Git Rebase)**
- **整理雜亂 commits 的互動式變基 (Interactive Rebase `rebase -i`)**
- **推送被遠端拒絕 (Non-Fast-Forward Push Rejection)**
- **手滑誤刪 commit 後的起死回生 (Git Reflog)**
- **不想 stash、避免中斷 IDE 與編譯快取的平行開發 (Git Worktree)**
- **在龐大歷史中秒殺神秘問題 (Git Bisect)**

平常一個人自學時，很難體會這些需要「第二個同事」或「龐大歷史拓撲」的情境。
**Git Scenario Lab** 只要一行指令，就能在獨立的練習目錄中自動搭建出最真實的專案現場！

---

## ⚡ 快速上手指令

在專案目錄下直接執行：

```bash
# 1. 查看所有關卡清單
./git-lab list

# 2. 啟動指定關卡 (例如啟動第 1 關或第 9 關)
./git-lab start 01
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

## 📚 10 大實戰關卡地圖 (Curriculum)

| 關卡 ID | 難度 | 關卡名稱 | 核心學習技能 |
| :---: | :---: | :--- | :--- |
| **01** | 入門 ⭐ | 工作區、暫存區與第一個 Commit | `git status`, `git add`, `git commit` |
| **02** | 初階 ⭐⭐ | 分支流動：建立、切換與 Fast-Forward 合併 | `git branch`, `git checkout` / `switch`, `git merge` |
| **03** | 進階 ⭐⭐⭐ | 迎戰衝突：手動解決 Merge Conflict | 雙分支修改同一檔案、解讀衝突標記、完成合併 |
| **04** | 進階 ⭐⭐⭐ | 變基藝術：使用 git rebase 保持線性歷史 | 保持分支歷史整潔一條線，避免多餘 merge commit |
| **05** | 進階 ⭐⭐⭐ | 歷史整形：Interactive Rebase 整理零碎 Commit | `git rebase -i`、`squash` 與 `fixup` 整理提交訊息 |
| **06** | 實戰 ⭐⭐⭐⭐ | 模擬協作：遠端衝突與 Non-Fast-Forward 推送被拒 | 本地 Mock Remote、體驗推送被拒、`git pull --rebase` |
| **07** | 實戰 ⭐⭐⭐ | 精準挑選：跨分支 Cherry-pick 偷渡關鍵 Commit | `git cherry-pick` 單獨摘取特定修復 Commit |
| **08** | 實戰 ⭐⭐⭐⭐ | 起死回生：Git Reflog 拯救失蹤的 Commit | 救回 `git reset --hard` 誤刪的心血程式碼 |
| **09** | 實戰 ⭐⭐⭐⭐ | 雙軌並行：Git Worktree 免 Stash 零干擾平行開發 | `git worktree add/list/remove` 享受多目錄並行檢出 |
| **10** | 實戰 ⭐⭐⭐⭐⭐ | 時光偵探：Git Bisect 二分搜尋秒殺神秘 Bug | `git bisect start/bad/good` 在 O(log N) 步內找出元凶 |

---

## 深入探討：工作中個人與團隊高頻使用的 Git 核心技能

### 1. 深度解析：Git Worktree vs Git Stash

在日常工作中，工程師經常會遇到這種緊急狀況：
> 「你正在分支 `feature-ai` 上開發新功能，寫到一半尚未 commit，本地跑著 dev server 與編譯快取；突然線上伺服器出現緊急 P0 故障，需要你立即在 `main` 開分支修復！」

這時候工程師有兩種選擇：

#### 傳統做法：`git stash`
```bash
git stash push -m "wip feature ai"
git checkout main
git checkout -b hotfix-p0
# ... 修復、測試、commit、push ...
git checkout feature-ai
git stash pop # 容易發生衝突！
```
- **缺點**：
  - 切換分支會刷新工作區檔案，導致 Node.js (`node_modules`)、Docker 或 C++/Rust 的**編譯快取失效**，切換回來時必須重新 build 很久。
  - `git stash pop` 若與分支有重疊改動容易爆發衝突。
  - 多個 stash 容易被遺忘在堆疊裡。

#### 現代做法：`git worktree`（雙軌並行）
```bash
# 在獨立資料夾檢出 main 分支
git worktree add ../project-hotfix -b hotfix-p0 main

# 開另一個終端機分頁或新 IDE 視窗進入修復
cd ../project-hotfix
# ... 修復、commit、push ...

# 修完後乾淨移除
cd ../project
git worktree remove ../project-hotfix
```
- **優勢**：
  - **完全不打擾原分支**：原本的 feature 分支、未存檔的檔案、運行中的 Dev Server 絲毫不受影響！
  - **平行測試**：可以兩個分支各自開著服務對比行為。
  - **零硬碟浪費**：兩個目錄共享底層同一個 `.git` 儲存庫，不需要像 `git clone` 一樣重複下載完整歷史。

---

### 2. 個人與團隊必備高階指令速查

| 指令 | 情境與用途 |
| :--- | :--- |
| **`git worktree add <dir> <branch>`** | 並行檢出多個分支到不同目錄，零干擾處理 Hotfix 或 Code Review。 |
| **`git bisect start / bad / good`** | 二分搜尋排查 Bug，在數百個 Commit 中幾步內找出是誰引入了錯誤。 |
| **`git switch <branch>`** | 現代 Git 取代 `git checkout` 切換分支的專門指令。 |
| **`git restore <file>`** | 現代 Git 取代 `git checkout -- <file>` 放棄工作區修改的指令。 |
| **`git restore --staged <file>`** | 將暫存區檔案移回工作區（取消 `git add`）。 |
| **`git commit --amend`** | 快速修改剛提交的最後一個 Commit（修改訊息或追加漏掉的檔案）。 |
| **`git pull --rebase origin <branch>`** | 同步遠端更新時保持歷史線性，避免產生雜亂的 Merge Commit。 |
| **`git log -S "<關鍵字>"`** | （鶴嘴鋤搜尋 Pickaxe）搜尋在歷史中**何時新增或刪除**了某個特定的函數或字串。 |
| **`git blame -L 10,20 <file>`** | 追查特定行號是哪一個 Commit、由誰在何時修改的。 |
| **`git reflog`** | 終端黑盒子，記錄本機所有 HEAD 移動軌跡，救回被 hard reset 或刪除的 commit。 |

---

## 🛡️ 系統特點與沙盒防護

1. **純本地零依賴**：完全採用系統內建 Python 3，不需安裝任何額外套件。
2. **完全獨立的 Workspace**：所有關卡練習均在 `workspace/` 目錄中進行，絕不破壞外部專案本身。
3. **隨時重來不怕壞**：任何時候只要迷失方向或操作失誤，輸入 `./git-lab reset` 即可秒速恢復至該關卡的起始狀態。
