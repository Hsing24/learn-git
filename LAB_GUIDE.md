# 🚀 Git Scenario Lab 使用手冊 & 現代實戰指南

歡迎來到 **Git Scenario Lab**！這是一套專為「單人自學 Git」量身打造的現代終端機與 Web 互動實戰情境實驗室。
你可以直接在真實的終端機環境中，像玩闖關遊戲一樣鍛鍊 Git 肌肉記憶，掌握個人與團隊開發的必備技能。

---

## 🎯 為什麼需要這套工具？

學習 Git 最困難的往往不是基本指令，而是當面對以下職場真實情境時的無助感：
- **第一次使用 Git 不知道怎麼配帳號、每次 push 都要輸密碼、每次新分支都要加 `--set-upstream`**
- **多人協作時的分支衝突 (Merge Conflict) 與菱形歷史**
- **保持歷史乾淨整齊的變基 (Git Rebase) 與中途衝突 (continue / abort / skip)**
- **整理雜亂 commits 的精準修補 (Interactive Rebase `rebase -i`、`--fixup` + `--autosquash`)**
- **推送被遠端拒絕 (Non-Fast-Forward Push Rejection) 與安全強制推送 (`--force-with-lease`)**
- **手滑誤刪 commit 後的起死回生 (Git Reflog)**
- **不想 stash、避免中斷 IDE 與編譯快取的平行開發 (Git Worktree)**
- **Stacked PR 遭遇前置分支被 squash merge 後的完美搬移 (`git rebase --onto`)**
- **不小心把包含 AWS 金鑰的 `.env` 推上遠端後的徹底抹除 (`git filter-repo`)**
- **在龐大歷史中秒殺神秘問題 (Git Bisect)**

**Git Scenario Lab** 只要一行指令，就能在獨立的練習目錄中自動搭建出最真實的專案現場！

---

## ⚡ 快速上手指令

在專案目錄下直接執行：

```bash
# 1. 查看所有 36 個關卡清單（依 8 大章節分組）
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

## 📚 36 大實戰關卡地圖 (Curriculum)

### 第 0 章：環境就緒 (Environment Setup)
*設定身分與連線，之後的每個 commit 都會記錄這些資訊*
| 關卡 ID | 難度 | 關卡名稱 | 核心學習技能 |
| :---: | :---: | :--- | :--- |
| **00** | ★ | 起點裝備：Git 身分、SSH 憑證與 Auto-Push | `user.name/email`, `push.autoSetupRemote`, SSH 免密金鑰 |

### 第 1 章：單機日常循環 (Local Daily Cycle)
*修改 ➜ 檢視 ➜ 暫存 ➜ 提交 ➜ 反悔*
| 關卡 ID | 難度 | 關卡名稱 | 核心學習技能 |
| :---: | :---: | :--- | :--- |
| **01** | ★ | 工作區、暫存區與第一個 Commit | `git status`, `git add`, `git commit` |
| **24** | ★ | 檢視變更：搞懂 diff 工作區、暫存區與歷史 | `git diff`, `git diff --staged`, `git show`, `git log -p` |
| **13** | ★★ | 亡羊補牢：.gitignore 追蹤失效救援與 git rm --cached | `.gitignore` 生效原理、`git rm --cached` 索引除名保全本地檔案 |
| **20** | ★★ | 乾淨俐落：git mv 檔案更名與 git clean -fd 清理雜物 | `git mv` 一步更名暫存、`git clean -fd` 徹底剷除未追蹤垃圾 |
| **25** | ★★ | 現代復原四部曲：git restore 與 reset 三模式 | `git restore`, `git restore --staged`, `git reset` 軟硬模式 |
| **18** | ★★ | 完美補完：git commit --amend 追補漏檔與修改最後提交 | `git commit --amend -m`、追加檔案免碎提交、保持乾淨歷史 |

### 第 2 章：分支與整合 (Branching & Merging)
*建立、合併、衝突處理與工作區暫存*
| 關卡 ID | 難度 | 關卡名稱 | 核心學習技能 |
| :---: | :---: | :--- | :--- |
| **02** | ★★ | 分支流動：建立、切換與 Fast-Forward 合併 | `git branch`, `git switch -c`, `git merge` (Fast-forward) |
| **26** | ★★ | 合併策略三部曲：Fast-forward、--no-ff 與 --squash | `git merge --no-ff`, `git merge --squash`, `git branch -d/-D` |
| **03** | ★★★ | 迎戰衝突：手動解決 Merge Conflict | 雙分支修改同一檔案、解讀衝突標記、完成合併 |
| **19** | ★★ | 救急暫存：Git Stash 工作區暫存、彈出與清理 | `git stash -u`、`git stash list`、`git stash pop`、多任務切換神技 |
| **27** | ★★ | 分離 HEAD：查看舊版本並救回在上面做的 commit | `git switch --detach`, 救回 orphan commit, `git switch -c` |
| **22** | ★★ | 移花接木：錯在 main 提交的救星 (Branch & Reset 平移救援) | 原地開分支貼紙、`git reset --hard HEAD~2`、零損平移救援主線 |

### 第 3 章：遠端協作基礎 (Remote Collaboration)
*同步遠端、追蹤分支與推送防護*
| 關卡 ID | 難度 | 關卡名稱 | 核心學習技能 |
| :---: | :---: | :--- | :--- |
| **28** | ★★ | Clone、首次推送與追蹤分支 | `git clone`, `git push -u origin <branch>`, `git branch -vv` |
| **21** | ★★★ | 遠端全貌：git remote 管理與 git fetch vs git pull 深度解密 | `git remote add upstream`、`git fetch` 先觀後合、Fork 協作工作流 |
| **06** | ★★★ | 模擬協作：遠端衝突與 Non-Fast-Forward 推送被拒 | 本地 Mock Remote、體驗推送被拒、`git pull --rebase` |

### 第 4 章：打造乾淨歷史 (Clean History & Rebase)
*局部暫存、變基與修飾提交*
| 關卡 ID | 難度 | 關卡名稱 | 核心學習技能 |
| :---: | :---: | :--- | :--- |
| **12** | ★★★ | 精準原子暫存：git add -p 局部區塊暫存 (Patch Staging) | `git add -p` (hunk split, y/n), `git diff --staged` 實現 Atomic Commit |
| **04** | ★★★ | 變基藝術：使用 git rebase 保持線性歷史 | 保持分支歷史整潔一條線，消除多餘 merge commit |
| **29** | ★★★ | Rebase 中途衝突：continue / abort / skip | Rebase 狀態機、解讀暫停節點、手動解衝突後 `rebase --continue` |
| **05** | ★★★ | 歷史整形：Interactive Rebase 整理零碎 Commit | `git rebase -i`、真正互動 Todo 視窗、`squash` 與 `fixup` |
| **30** | ★★★ | 精準修補歷史中的某個 commit | `git commit --fixup <target-hash>`, `git rebase -i --autosquash` |
| **07** | ★★★ | 精準挑選：跨分支 Cherry-pick 偷渡關鍵 Commit | `git cherry-pick` 單獨摘取特定修復 Commit |

### 第 5 章：團隊工作流與發布 (Team Workflow & Releases)
*PR 生命週期、標籤發布、緊急復原與鉤子防線*
| 關卡 ID | 難度 | 關卡名稱 | 核心學習技能 |
| :---: | :---: | :--- | :--- |
| **31** | ★★★★ | 一個 PR 從開到收：變基最新主線與安全強推 | `git fetch origin`, `git rebase origin/main`, `git push --force-with-lease` |
| **15** | ★★ | 版本里程碑：Git Tag 與語意化版號發布 (Semantic Versioning) | 輕量標籤 vs 附註標籤 (`git tag -a`), 歷史補簽, `git push --tags` |
| **14** | ★★★★ | 線上緊急回滾：解救生產事故的 Revert Merge (git revert -m 1) | Merge Commit 雙親拓撲、`-m 1` 基準線指定、Re-revert 心法 |
| **11** | ★★★ | 守門神器：Git Hooks 自動化品管與敏感金鑰攔截 | `pre-commit`, `commit-msg`, `core.hooksPath` 敏感詞防護 |

### 第 6 章：救援與除錯 (Rescue & Debugging)
*時光倒流、代碼考古與二分除錯*
| 關卡 ID | 難度 | 關卡名稱 | 核心學習技能 |
| :---: | :---: | :--- | :--- |
| **08** | ★★★ | 起死回生：Git Reflog 拯救失蹤的 Commit | 救回 `git reset --hard` 誤刪的心血程式碼、`HEAD@{1}` |
| **16** | ★★★ | 代碼考古學：git log -S 語意搜尋與 git blame 責任溯源 | `git log -S` (Pickaxe) 增減檢索、`git blame -w` 忽略格式排版 |
| **10** | ★★★★ | 時光偵探：Git Bisect 二分搜尋秒殺神秘 Bug | `git bisect start/bad/good` 在 O(log N) 步內找出元凶 |

### 第 7 章：進階工程 (Advanced Engineering)
*平行工作區、衝突記憶、進階變基與密鑰清除*
| 關卡 ID | 難度 | 關卡名稱 | 核心學習技能 |
| :---: | :---: | :--- | :--- |
| **09** | ★★★★ | 雙軌並行：Git Worktree 免 Stash 零干擾平行開發 | `git worktree add/list/remove` 享受多目錄並行檢出 |
| **17** | ★★★★ | 重複衝突終結者：git rerere 記錄與自動重用解法 | `git config rerere.enabled true`, 自動記憶衝突解法、Rebase 省時黑魔法 |
| **32** | ★★★★★ | Stacked PR：基底分支被 squash merge 之後 | `git rebase --onto main feature/api feature/ui` 精確搬移 |
| **33** | ★★★★★ | 密鑰已經推上遠端的事故處理 | `git filter-repo --path .env --invert-paths`, `git push --force-with-lease` |
| **23** | ★★★★ | 底層透視：.git 水管底層物件解密 (Plumbing: cat-file & SHA-1) | `git cat-file -t / -p`、解密 blob / tree / commit 四大內部物件 |

### 選修主題 (Electives - 僅 CLI 專屬實戰)
| 關卡 ID | 難度 | 關卡名稱 | 核心學習技能 |
| :---: | :---: | :--- | :--- |
| **34** | ★★★★ | 跨專案代碼復用：Git Submodule 子模組 | `git submodule add`, `git submodule update --init` |
| **35** | ★★★★ | 超大型 Monorepo 救星：Sparse Checkout 局部檢出 | `git sparse-checkout init --cone`, `git sparse-checkout set` |

---

## 🛠️ 現代 Git 指令演進：經典舊指令 vs. 現代更優實現速查表

| 功能情境 | 傳統舊指令 | 現代更優替代指令 | 為什麼現代實現更好？ |
| :--- | :--- | :--- | :--- |
| **切換分支** | `git checkout <branch>` | `git switch <branch>` | `checkout` 承擔太多功能（切分支/復原檔案），打錯容易覆蓋檔案；`switch` 專注於分支切換，安全明確。 |
| **建立並切換新分支** | `git checkout -b <new>` | `git switch -c <new>` | 語意清晰對稱（`-c` 代表 create），避免混淆。 |
| **放棄工作區檔案修改** | `git checkout -- <file>` | `git restore <file>` | `checkout --` 語法晦澀難記；`restore` 顧名思義就是還原，直觀自然。 |
| **將檔案移出暫存區 (Unstage)**| `git reset HEAD <file>` | `git restore --staged <file>` | 不再需要搬出危險的 `reset` 指令，`restore --staged` 語意精準。 |
| **跨分支平行任務 (Hotfix)** | `git stash` ➜ 切換 ➜ pop | `git worktree add <dir> <branch>` | `stash` 會破壞 node_modules、編譯快取與 IDE 索引，且 pop 容易衝突；`worktree` 目錄實體隔離，平行開發互不干擾。 |
| **新分支首次推送** | `git push -u origin <branch>` | `git config --global push.autoSetupRemote true` 後直接 `git push` | 設定一次一勞永逸，任何新分支直接敲 `git push`，Git 自動在遠端建同名分支並追蹤。 |
| **強制推送更新遠端** | `git push --force` (或 `-f`) | `git push --force-with-lease` | `--force` 會無條件覆蓋他人進度；`--force-with-lease` 先比對本地 tracking ref，若同事推了新提交則安全拒絕。 |
| **同檔局部暫存 (Atomic)** | 盲目整檔 `git add .` | `git add -p <file>` | 依 Hunk 逐塊選擇（y/n/s），確保每個 Commit 具備單一職責，大幅提升 Code Review 品質。 |
| **停止追蹤敏感檔案** | 刪除本機實體檔案再加 ignore | `git rm --cached <file>` | 僅從 Git 索引除名，完全保全本機開發所需的配置資料與環境變數。 |
| **線上回滾 Merge PR** | 覆蓋歷史的危險 force push | `git revert -m 1 <merge_hash>` | 向前推進產生反轉提交，清楚保留審計紀錄，不破壞團隊他人歷史。 |
| **重用衝突解法 (Rebase)** | 每次 rebase 手動解 10 次 | `git config --global rerere.enabled true` | Git 自動記憶衝突解決方案，後續相同衝突區塊 0 秒全自動填入！ |
| **代碼精確考古** | 盲翻數百個 log 提交訊息 | `git log -S "<字串>" --oneline` | 鶴嘴鎬 (Pickaxe) 只列出『變更該字串出現次數』的提交，精準度百倍。 |
| **修復前次 Commit (Typo)** | 手動 `rebase -i` 逐行改 squash | `git commit --fixup <hash>`<br>+ `git rebase -i --autosquash` | Git 自動將 fixup 提交搬移到目標下方並自動合併，零手動編輯風險。修補最後一筆更可直接用 `git commit --amend --no-edit`。 |
| **拉取遠端最新代碼** | `git pull`（預設 merge） | `git pull --rebase`<br>（或 `git config --global pull.rebase true`） | 消除團隊中雜亂無章的 "Merge branch 'main' of github.com" 交叉菱形節點，保持乾淨線性歷史。 |
| **二分搜尋定位 Bug** | 手動反覆測試打 `good/bad` | `git bisect run <測試腳本>` | 例如 `git bisect run pytest`，Git 全自動在幾秒內執行腳本並鎖定第一個壞掉的 Commit。 |
| **Git Hooks 團隊共享** | 手動複製腳本至 `.git/hooks/` | `git config core.hooksPath .githooks`<br>或使用 Husky / Lefthook | `.git/hooks` 屬於本地私有目錄無法納入版本控制；`core.hooksPath` 或現代工具能將 hooks 一併納入 repo 追蹤，團隊成員自動生效。 |

---

## ⚡ 深度專題 1：Git Reset 的三種模式 (`--soft` / `--mixed` / `--hard`) 與暫存區流動

Git 內部維護三個關鍵區域：
1. **HEAD**：當前分支最新提交的指標（快照）。
2. **Index（暫存區 / Staging Area）**：準備進入下一個 Commit 的內容。
3. **Working Tree（工作目錄）**：你在編輯器中實際看得到、摸得著的檔案。

`git reset <commit>` 本質上是**將 HEAD 指標移動到指定的 commit**。它提供了三種主要模式，決定 Index 與 Working Tree 如何跟隨變動：

```
       HEAD 指標移動        Index (暫存區) 更新       Working Tree 更新
--soft       ✔                    ✘ (保留原樣)             ✘ (保留原樣)
--mixed      ✔                    ✔ (重設為目標狀態)        ✘ (保留原樣)
--hard       ✔                    ✔ (重設為目標狀態)        ✔ (重設為目標狀態 - 危險！)
```

### 1. `--soft`（溫和模式）：重組 Commit 的神技
- **效果**：HEAD 移動了，但暫存區和工作目錄**完全不動**。
- **經典場景**：你剛剛一口氣 commit 了 3 個零碎提交，想要合成 1 個乾淨的提交發 PR：
  ```bash
  git reset --soft HEAD~3
  git commit -m "feat: complete entire checkout flow"
  ```
  原本 3 個 commit 的所有改動依然完好保留在暫存區，直接一鍵重新 commit！

### 2. `--mixed`（預設模式）：重新整理暫存區
- **效果**：HEAD 移動，暫存區被重設回目標版本，但工作目錄中的修改**完好保留**（變成未暫存狀態）。
- **經典場景**：你不小心 `git add .` 包了太多不想 commit 的檔案，或者想把剛剛的 commit 拆開重新挑選：
  ```bash
  git reset HEAD~1
  git add -p  # 重新按區塊挑選暫存
  ```

### 3. `--hard`（強硬模式）：徹底推倒重來（不可逆！）
- **效果**：HEAD、暫存區、工作目錄全部抹除並強制同步回目標版本。所有未提交的修改將永久遺失！
- **救命稻草**：如果不小心敲錯了 `git reset --hard`，第一時間敲 `git reflog` 找回丟失前的那筆 SHA-1，再用 `git reset --hard HEAD@{1}` 即可起死回生！

---

## 🛡️ 深度專題 2：`git push --force-with-lease` 安全租約推送的底層防護

在 GitHub PR 工作流中，為了保持歷史線性，團隊通常要求在 merge 前先 `rebase origin/main`。變基之後本地分支與遠端產生了分歧，直接 push 會被 Git 拒絕（Non-Fast-Forward）。

### 為什麼千萬不要用 `git push --force`（或 `-f`）？
`--force` 是**盲目的暴力覆蓋**。想像以下職場災難：
1. 你在 `feature` 分支開了 PR，正在本機 rebase。
2. 與此同時，同事小明 review 你的代碼，發現了一個安全弱點，順手幫你 push 了一個修正 commit 到遠端 `feature` 分支。
3. 你不知道小明推了 commit，在本地敲下 `git push --force`。
4. **小明的修復 commit 在遠端瞬間被蒸發抹除！** 團隊毫無警覺地將有漏洞的代碼合進主線。

### `--force-with-lease` 的安全租約機制：
`--force-with-lease` 要求 Git 在覆寫遠端分支前先做一項檢查：
> **「遠端分支真正的目前位置，是否跟我本地上一次 fetch 下來的遠端追蹤參照 (remote-tracking ref, 如 origin/feature) 一致？」**

- **情境 A（安全）**：自從你上次 fetch 以來，沒有人動過遠端分支。租約比對通過，Git 允許覆寫。
- **情境 B（保護觸發）**：小明推了新 commit，遠端 branch tip 已經前進，與你本地的 `origin/feature` 不一致。Git 立刻拒絕推送：
  ```text
  error: failed to push some refs to 'https://github.com/company/repo.git'
  hint: Updates were rejected because the remote contains work that you do
  hint: not have locally.
  ```
- **正確因應**：執行 `git fetch origin` 看到小明的變更，再 `rebase origin/feature` 整合後推送。全員平安！

---

## 🔀 深度專題 3：Rebase 衝突中 ours 與 theirs 的「逆轉陷阱」

許多資深工程師在處理 `git rebase` 衝突時，常常困惑地發現：**「為什麼在 rebase 衝突中，`ours` 和 `theirs` 跟我認知的剛好反過來？」**

### 1. `git merge` 時的視角（正常認知）：
在 `git merge feature` 時：
- `ours`（HEAD）：是你當前所在的主線分支（如 `main`）。
- `theirs`：是被合併進來的外部分支（如 `feature`）。

### 2. `git rebase` 時的底層實作（逆轉真相！）：
當你在 `feature` 分支執行 `git rebase main` 時，Git 在底層執行的動作是：
1. **先把 HEAD 悄悄切換到目標基底 `main`！**
2. 將 `feature` 上專屬的 commits 一個一個做成 patch。
3. 依序把 patch 拿去套在新的 HEAD（也就是 `main`）之上。

因此，在 Rebase 重放中途發生衝突時：
- **`ours`（HEAD）**：指的是**你正在重放上去的目標基底**（即 `main` 的代碼）！
- **`theirs`**：指的是**正在被套用的 patch**（即你自己在 `feature` 分支上寫的改動）！

### 實戰建議：
- 若在 VS Code 或 IDE 衝突編輯器中看到 `Current Change (ours)` 與 `Incoming Change (theirs)`，請牢記：
  **在 Rebase 期間，`Incoming Change` 才是你自己在特徵分支上的修改！**
- 切勿盲目直覺地點選 "Accept Current"，否則會把自己的心血給丟棄！

---

## ⚡ 深度專題 4：Git Worktree vs. Git Stash 的正確分工

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
