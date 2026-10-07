# 🚀 Git Scenario Lab

> **專為單人開發者打造的 Git 本地終端機實戰情境實驗室。**
> 
> 🌐 **線上教學網站與速查表**: [https://hsing24.github.io/learn-git/](https://hsing24.github.io/learn-git/)

---

## 🎯 為什麼需要它？

Git 最關鍵的核心技能（例如 **帳號配置與 SSH 免密連線**、**Merge Conflict 衝突解決**、**Rebase 歷史整容**、**Git Worktree 雙軌並行**、**Git Bisect 二分除錯**、**Reflog 災難救援**），通常都需要「第二個同事」或「龐大交錯的歷史紀錄」。

一個人在本機自學時很難製造這些逼真的情境。**Git Scenario Lab** 讓你只要一行指令，就能在獨立的練習目錄中自動搭建出最真實的專案現場！

---

## ⚡ 快速開始 (Quick Start)

```bash
# 1. 複製專案
git clone https://github.com/Hsing24/learn-git.git
cd learn-git

# 2. 列出所有 12 個實戰關卡
./git-lab list

# 3. 進入第 00 關：配備身分、SSH 免密金鑰與自動建立遠端分支
./git-lab start 00

# 4. 進入工作區操作
cd workspace

# 5. 完成任務後驗收成果
./git-lab verify
```

---

## 📚 12 大實戰關卡

| ID | 難度 | 關卡名稱 | 實戰重點 |
| :---: | :---: | :--- | :--- |
| **00** | 新手必備 🔰 | 起點裝備：Git 身分、SSH 憑證與自動建立遠端分支 | `user.name/email`, `push.autoSetupRemote`, SSH 免密金鑰 |
| **01** | 入門 ⭐ | 工作區、暫存區與第一個 Commit | `git status`, `git add`, `git commit` |
| **02** | 初階 ⭐⭐ | 分支流動：建立、切換與 Fast-Forward 合併 | `git branch`, `git switch`, `git merge` |
| **03** | 進階 ⭐⭐⭐ | 迎戰衝突：手動解決 Merge Conflict | 雙分支修改同一檔案、解讀衝突標記、完成合併 |
| **04** | 進階 ⭐⭐⭐ | 變基藝術：使用 git rebase 保持線性歷史 | 保持分支歷史整潔一條線，消除多餘 merge commit |
| **05** | 進階 ⭐⭐⭐ | 歷史整形：Interactive Rebase 整理零碎 Commit | `git rebase -i`、`squash` 與 `fixup` |
| **06** | 實戰 ⭐⭐⭐⭐ | 模擬協作：遠端衝突與 Non-Fast-Forward 推送被拒 | 本地 Mock Remote、體驗推送被拒、`git pull --rebase` |
| **07** | 實戰 ⭐⭐⭐ | 精準挑選：跨分支 Cherry-pick 偷渡關鍵 Commit | `git cherry-pick` 單獨摘取特定修復 Commit |
| **08** | 實戰 ⭐⭐⭐⭐ | 起死回生：Git Reflog 拯救失蹤的 Commit | 救回 `git reset --hard` 誤刪的心血程式碼 |
| **09** | 實戰 ⭐⭐⭐⭐ | 雙軌並行：Git Worktree 免 Stash 零干擾平行開發 | `git worktree add/list/remove` 享受多目錄並行檢出 |
| **10** | 實戰 ⭐⭐⭐⭐⭐ | 時光偵探：Git Bisect 二分搜尋秒殺神秘 Bug | `git bisect start/bad/good` 在 O(log N) 步內找出元凶 |
| **11** | 實戰 ⭐⭐⭐⭐ | 守門神器：Git Hooks 自動化品管與敏感金鑰攔截 | `pre-commit`, `commit-msg`, `core.hooksPath` 敏感詞防護 |

---

## 🛠️ 現代 Git 指令演進與更優替代方案

現代 Git（2.23+）針對許多容易混淆或過載的舊指令進行了專門化升級：

- **切換分支**：`git checkout` ➜ 推薦 **`git switch`**（安全專注切分支）
- **放棄修改**：`git checkout -- <file>` ➜ 推薦 **`git restore <file>`**（直觀精確還原）
- **移出暫存**：`git reset HEAD <file>` ➜ 推薦 **`git restore --staged <file>`**（無危險性取消暫存）
- **跨分支平行開發**：`git stash` ➜ 推薦 **`git worktree`**（實體目錄隔離，避免編譯快取失效與 pop 衝突）
- **新分支推送**：`--set-upstream` ➜ 推薦 **`push.autoSetupRemote true`**（一次配置，直接 `git push`）
- **修正歷史提交**：手動 `rebase -i` ➜ 推薦 **`git commit --fixup` + `--autosquash`**（全自動嫁接合併）
- **拉取遠端最新**：預設 `git pull` ➜ 推薦 **`git pull --rebase`**（避免產生多餘菱形 Merge Commit）
- **Hook 團隊共享**：手動貼 `.git/hooks` ➜ 推薦 **`core.hooksPath` / Husky / Lefthook**（納入版本控制自動同步）

完整深入解說請參閱 [LAB_GUIDE.md](./LAB_GUIDE.md)。

---

## 🧪 執行自動化測試

本專案自帶完整的 12 關自動化測試套件：

```bash
python3 tests/test_all_scenarios.py
```

---

## 📄 License
MIT License. 歡迎自由學習、修改與分享！
