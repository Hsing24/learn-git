# 🚀 Git Scenario Lab

> **專為單人開發者打造的 Git 本地終端機實戰情境實驗室。**
> 
> 🌐 **線上教學網站**: [https://hsing24.github.io/learn-git/](https://hsing24.github.io/learn-git/)

---

## 🎯 為什麼需要它？

Git 最關鍵的核心技能（例如 **Merge Conflict 衝突解決**、**Rebase 歷史整容**、**Git Worktree 雙軌並行**、**Git Bisect 二分除錯**、**Reflog 災難救援**），通常都需要「第二個同事」或「龐大交錯的歷史紀錄」。

一個人在本機自學時很難製造這些逼真的情境。**Git Scenario Lab** 讓你只要一行指令，就能在獨立的練習目錄中自動搭建出最真實的專案現場！

---

## ⚡ 快速開始 (Quick Start)

```bash
# 1. 複製專案
git clone https://github.com/Hsing24/learn-git.git
cd learn-git

# 2. 列出所有實戰關卡
./git-lab list

# 3. 進入指定關卡 (例如第 3 關：解決衝突)
./git-lab start 03

# 4. 進入工作區操作
cd workspace

# 5. 完成任務後驗收成果
./git-lab verify
```

---

## 📚 10 大實戰關卡

| ID | 難度 | 關卡名稱 | 實戰重點 |
| :---: | :---: | :--- | :--- |
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

---

## 💡 深入閱讀：Git Worktree vs Git Stash

在真實團隊開發中，當遇到「緊急 Hotfix」或「需同時對比兩個分支」時，`git worktree` 能提供比 `git stash` 更優雅的平行工作流：

- **零干擾原分支**：原本未完成的改動與運行中的 Dev Server 絲毫不受影響。
- **避免編譯快取重置**：各目錄獨立，不會因為切換分支而刷新 node_modules 或重編譯快取。
- **免除 Stash 衝突**：實體目錄隔離，完全沒有 `git stash pop` 引發衝突的風險。

詳細指令與團隊工作流教學請參閱 [LAB_GUIDE.md](./LAB_GUIDE.md)。

---

## 🧪 執行自動化測試

本專案自帶完整的 10 關自動化測試套件：

```bash
python3 tests/test_all_scenarios.py
```

---

## 📄 License
MIT License. 歡迎自由學習、修改與分享！
