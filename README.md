# 🚀 Git Scenario Lab

> **專為單人開發者打造的現代 Git 實戰情境實驗室。**
> 
> 🌐 **瀏覽器互動式終端機 & 可視化 Commit 樹狀圖**: [https://hsing24.github.io/learn-git/](https://hsing24.github.io/learn-git/)
> 
> 具備類似 LearnGitBranching 的直覺介面，但**大幅強化真實職場工程情境**（涵蓋身分配置、Merge Conflict、Rebase、Worktree、Reflog、Bisect、Hooks、Atomic Patch、Stacked PR、密鑰清除等 36 大專案現場）。免安裝任何套件，打開瀏覽器即可敲指令實戰！
> 
> 本專案同時支援：
> 1. 🌐 **Web 線上模擬器**：瀏覽器即時 SVG DAG 樹狀圖、檔案衝突檢視器、8 大章節課程地圖與章節結業卡。
> 2. 💻 **本地終端機 CLI (`./git-lab`)**：在自己的 macOS / Linux 終端機與真實 Git 沙盒環境中實戰練習。

Git 最關鍵的核心技能（例如 **帳號配置與 SSH 免密連線**、**Merge Conflict 衝突解決**、**Rebase 歷史整容**、**Git Worktree 雙軌並行**、**Git Bisect 二分除錯**、**Reflog 災難救援**），通常都需要「第二個同事」或「龐大交錯的歷史紀錄」。

一個人在本機自學時很難製造這些逼真的情境。**Git Scenario Lab** 讓你只要一行指令，就能在獨立的練習目錄中自動搭建出最真實的專案現場！

---

## ⚡ 快速開始 (Quick Start)

```bash
# 1. 複製專案
git clone https://github.com/Hsing24/learn-git.git
cd learn-git

# 2. 列出所有 36 個實戰關卡（依 8 大章節分組）
./git-lab list

# 3. 進入第 00 關：配備身分、SSH 免密金鑰與自動建立遠端分支
./git-lab start 00

# 4. 進入工作區操作
cd workspace

# 5. 完成任務後驗收成果
./git-lab verify
```

---

## 📚 36 大實戰關卡課綱地圖 (8 大章節 + 選修實戰)

### 第 0 章：環境就緒 (Environment Setup)
*設定身分與連線，之後的每個 commit 都會記錄這些資訊*
| ID | 難度 | 關卡名稱 | 實戰重點 |
| :---: | :---: | :--- | :--- |
| **00** | ★ | 起點裝備：Git 身分、SSH 憑證與 Auto-Push | `user.name/email`, `push.autoSetupRemote`, SSH 免密配置 |

### 第 1 章：單機日常循環 (Local Daily Cycle)
*修改 ➜ 檢視 ➜ 暫存 ➜ 提交 ➜ 反悔*
| ID | 難度 | 關卡名稱 | 實戰重點 |
| :---: | :---: | :--- | :--- |
| **01** | ★ | 工作區、暫存區與第一個 Commit | `git status`, `git add`, `git commit` |
| **24** | ★ | 檢視變更：搞懂 diff 工作區、暫存區與歷史 | `git diff`, `git diff --staged`, `git show`, `git log -p` |
| **13** | ★★ | 亡羊補牢：.gitignore 追蹤失效救援與 git rm --cached | `.gitignore` 生效原理、`git rm --cached` 索引除名保全本地檔案 |
| **20** | ★★ | 乾淨俐落：git mv 檔案更名與 git clean -fd 清理雜物 | `git mv` 一步更名暫存、`git clean -fd` 徹底剷除未追蹤垃圾 |
| **25** | ★★ | 現代復原四部曲：git restore 與 reset 三模式 | `git restore`, `git restore --staged`, `git reset (--soft/mixed/hard)` |
| **18** | ★★ | 完美補完：git commit --amend 追補漏檔與修改最後提交 | `git commit --amend -m`、追加檔案免碎提交、保持乾淨歷史 |

### 第 2 章：分支與整合 (Branching & Merging)
*建立、合併、衝突處理與工作區暫存*
| ID | 難度 | 關卡名稱 | 實戰重點 |
| :---: | :---: | :--- | :--- |
| **02** | ★★ | 分支流動：建立、切換與 Fast-Forward 合併 | `git branch`, `git switch -c`, `git merge` (Fast-forward) |
| **26** | ★★ | 合併策略三部曲：Fast-forward、--no-ff 與 --squash | `git merge --no-ff`, `git merge --squash`, `git branch -d/-D` |
| **03** | ★★★ | 迎戰衝突：手動解決 Merge Conflict | 雙分支修改同一檔案、解讀衝突標記、完成合併 |
| **19** | ★★ | 救急暫存：Git Stash 工作區暫存、彈出與清理 | `git stash -u`、`git stash list`、`git stash pop`、多任務切換神技 |
| **27** | ★★ | 分離 HEAD：查看舊版本並救回在上面做的 commit | `git switch --detach`, 救回 orphan commit, `git switch -c` |
| **22** | ★★ | 移花接木：錯在 main 提交的救星 (Branch & Reset 平移救援) | 原地開分支貼紙、`git reset --hard HEAD~2`、零損平移救援主線 |

### 第 3 章：遠端協作基礎 (Remote Collaboration)
*同步遠端、追蹤分支與推送防護*
| ID | 難度 | 關卡名稱 | 實戰重點 |
| :---: | :---: | :--- | :--- |
| **28** | ★★ | Clone、首次推送與追蹤分支 | `git clone`, `git push -u origin <branch>`, `git branch -vv` |
| **21** | ★★★ | 遠端全貌：git remote 管理與 git fetch vs git pull 深度解密 | `git remote add upstream`、`git fetch` 先觀後合、Fork 協作工作流 |
| **06** | ★★★ | 模擬協作：遠端衝突與 Non-Fast-Forward 推送被拒 | 本地 Mock Remote、體驗推送被拒、`git pull --rebase` |

### 第 4 章：打造乾淨歷史 (Clean History & Rebase)
*局部暫存、變基與修飾提交*
| ID | 難度 | 關卡名稱 | 實戰重點 |
| :---: | :---: | :--- | :--- |
| **12** | ★★★ | 精準原子暫存：git add -p 局部區塊暫存 (Patch Staging) | `git add -p` (hunk split, y/n), `git diff --staged` 實現 Atomic Commit |
| **04** | ★★★ | 變基藝術：使用 git rebase 保持線性歷史 | 保持分支歷史整潔一條線，消除多餘 merge commit |
| **29** | ★★★ | Rebase 中途衝突：continue / abort / skip | Rebase 狀態機、解讀暫停節點、手動解衝突後 `rebase --continue` |
| **05** | ★★★ | 歷史整形：Interactive Rebase 整理零碎 Commit | `git rebase -i`、真正互動 Todo 視窗、`squash` 與 `fixup` |
| **30** | ★★★ | 精準修補歷史中的某個 commit | `git commit --fixup <target-hash>`, `git rebase -i --autosquash` |
| **07** | ★★★ | 精準挑選：跨分支 Cherry-pick 偷渡關鍵 Commit | `git cherry-pick` 單獨摘取特定修復 Commit |

### 第 5 章：團隊工作流與發布 (Team Workflow & Releases)
*PR 生命週期、標籤發布、緊急復原與鉤子防線*
| ID | 難度 | 關卡名稱 | 實戰重點 |
| :---: | :---: | :--- | :--- |
| **31** | ★★★★ | 一個 PR 從開到收：變基最新主線與安全強推 | `git fetch origin`, `git rebase origin/main`, `git push --force-with-lease` |
| **15** | ★★ | 版本里程碑：Git Tag 與語意化版號發布 (Semantic Versioning) | 輕量標籤 vs 附註標籤 (`git tag -a`), 歷史補簽, `git push --tags` |
| **14** | ★★★★ | 線上緊急回滾：解救生產事故的 Revert Merge (git revert -m 1) | Merge Commit 雙親拓撲、`-m 1` 基準線指定、Re-revert 心法 |
| **11** | ★★★ | 守門神器：Git Hooks 自動化品管與敏感金鑰攔截 | `pre-commit`, `commit-msg`, `core.hooksPath` 敏感詞防護 |

### 第 6 章：救援與除錯 (Rescue & Debugging)
*時光倒流、代碼考古與二分除錯*
| ID | 難度 | 關卡名稱 | 實戰重點 |
| :---: | :---: | :--- | :--- |
| **08** | ★★★ | 起死回生：Git Reflog 拯救失蹤的 Commit | 救回 `git reset --hard` 誤刪的心血程式碼、`HEAD@{1}` |
| **16** | ★★★ | 代碼考古學：git log -S 語意搜尋與 git blame 責任溯源 | `git log -S` (Pickaxe) 增減檢索、`git blame -w` 忽略格式排版 |
| **10** | ★★★★ | 時光偵探：Git Bisect 二分搜尋秒殺神秘 Bug | `git bisect start/bad/good` 在 O(log N) 步內找出元凶 |

### 第 7 章：進階工程 (Advanced Engineering)
*平行工作區、衝突記憶、進階變基與密鑰清除*
| ID | 難度 | 關卡名稱 | 實戰重點 |
| :---: | :---: | :--- | :--- |
| **09** | ★★★★ | 雙軌並行：Git Worktree 免 Stash 零干擾平行開發 | `git worktree add/list/remove` 享受多目錄並行檢出 |
| **17** | ★★★★ | 重複衝突終結者：git rerere 記錄與自動重用解法 | `git config rerere.enabled true`, 自動記憶衝突解法、Rebase 省時黑魔法 |
| **32** | ★★★★★ | Stacked PR：基底分支被 squash merge 之後 | `git rebase --onto main feature/api feature/ui` 精確搬移 |
| **33** | ★★★★★ | 密鑰已經推上遠端的事故處理 | `git filter-repo --path .env --invert-paths`, `git push --force-with-lease` |
| **23** | ★★★★ | 底層透視：.git 水管底層物件解密 (Plumbing: cat-file & SHA-1) | `git cat-file -t / -p`、解密 blob / tree / commit 四大內部物件 |

### 選修主題 (Electives - 僅 CLI 專屬實戰)
| ID | 難度 | 關卡名稱 | 實戰重點 |
| :---: | :---: | :--- | :--- |
| **34** | ★★★★ | 跨專案代碼復用：Git Submodule 子模組 | `git submodule add`, `git submodule update --init` |
| **35** | ★★★★ | 超大型 Monorepo 救星：Sparse Checkout 局部檢出 | `git sparse-checkout init --cone`, `git sparse-checkout set` |

---

## 🛠️ 現代 Git 指令演進與更優替代方案

現代 Git（2.23+）針對許多容易混淆或過載的舊指令進行了專門化升級：

- **切換分支**：`git checkout` ➜ 推薦 **`git switch`**（安全專注切分支）
- **放棄修改**：`git checkout -- <file>` ➜ 推薦 **`git restore <file>`**（直觀精確還原）
- **移出暫存**：`git reset HEAD <file>` ➜ 推薦 **`git restore --staged <file>`**（無危險性取消暫存）
- **查看舊版 / 游標脫離**：`git checkout <hash>` ➜ 推薦 **`git switch --detach <hash>`**（明確宣告游標分離）
- **覆寫推送至遠端**：`git push --force` ➜ 推薦 **`git push --force-with-lease`**（安全租約比對，不蓋同事新代碼）
- **微調修正歷史提交**：手動 `rebase -i` ➜ 推薦 **`git commit --fixup` + `--autosquash`**（全自動嫁接合併）
- **跨分支平行開發**：`git stash` ➜ 推薦 **`git worktree`**（實體目錄隔離，避免編譯快取失效與 pop 衝突）
- **新分支推送**：`--set-upstream` ➜ 推薦 **`push.autoSetupRemote true`**（一次配置，直接 `git push`）
- **局部暫存 / 拆分**：盲目 `git add .` ➜ 推薦 **`git add -p`**（依代碼塊精準組織 Atomic Commit）
- **停止追蹤敏感檔**：刪除本地檔 ➜ 推薦 **`git rm --cached`**（保全本地檔案同時自 Git 索引除名）
- **緊急回滾 Merge PR**：暴力 force push ➜ 推薦 **`git revert -m 1`**（向前推進產生反轉提交，保留審計紀錄）
- **重複衝突免解**：每次手動重解 ➜ 推薦 **`git config --global rerere.enabled true`**（自動記憶並重用解法）
- **精準代碼考古**：盲翻提交訊息 ➜ 推薦 **`git log -S "<字串>" --oneline`**（鶴嘴鎬只看次數變動）
- **拉取遠端最新**：預設 `git pull` ➜ 推薦 **`git pull --rebase`**（避免產生多餘菱形 Merge Commit）
- **Hook 團隊共享**：手動貼 `.git/hooks` ➜ 推薦 **`core.hooksPath` / Husky / Lefthook**（納入版本控制自動同步）

完整深入解說請參閱 [LAB_GUIDE.md](./LAB_GUIDE.md)。

---

## 🧪 執行自動化測試

本專案自帶完整的雙引擎自動化測試套件：

```bash
# 1. Python CLI 驗收測試（涵蓋全部 36 關，使用暫存專案與隔離 Git 設定）
python3 tests/test_all_scenarios.py

# 2. Web 虛擬引擎全關卡驗收與捷徑防護測試（90 項檢查）
node tests/web/run_scenarios.mjs
```

Python 測試會以真實 Git 驗證各關卡的初始狀態、標準解法與相關捷徑，並在一次性暫存專案中執行，不會清理專案內的 `workspace/`。Scenario 33 的 `git-filter-repo` 路徑會在安裝該選用工具時一併測試；無論是否安裝，`filter-branch` 備援路徑都會測試。

---

## 📄 License
[MIT License](./LICENSE)。歡迎自由學習、修改與分享！

## 🤝 貢獻與聯絡

- Bug、功能與教學建議：使用 [GitHub Issues 模板](https://github.com/Hsing24/learn-git/issues/new/choose)。
- 開發與提交 PR：參閱 [貢獻指南](./CONTRIBUTING.md)。
- 安全漏洞：依 [安全回報政策](./SECURITY.md) 透過 email 私下回報。
- 合作或其他私人事項：[twrandy24@gmail.com](mailto:twrandy24@gmail.com)。
