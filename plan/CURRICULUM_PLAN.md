> 2026-10-14 課綱 v3 更新：作者已授權修正本文件下述舊文案保護範圍，並全面補強教材、引擎與驗收。最新順序以 `docs/curriculum.js` 為準；49 關的範圍與平台限制見 [README](../README.md) 與 [LAB_GUIDE](../LAB_GUIDE.md)。以下保留原始規劃供追溯，不作為 v3 的驗收規格。

# Git Scenario Lab — 課綱 v2 規劃書（實作交接文件）

> **給實作者（Gemini）的說明**：本文件是規格書。請照「§8 實作分期」的順序做，每一期做完都要跑 `python3 tests/test_all_scenarios.py`，而且 Web 版要能從頭玩到尾。
>
> **硬性限制**：`docs/scenarios-data.js` 裡**現有關卡**的 `title / story / goals / hints / difficulty / category` 文字**不要改**（作者還在調整）。排序、章節、難度覆寫、預設分頁這些都放進新的 manifest（§4）。唯一的例外是 §6.2 列出的 04 / 05 / 06 這三關：它們的 `setup` / `checkGoal`（程式邏輯）**已經獲准修改**，但文字欄位一樣不要動。

---

## 1. 現況診斷

### 1.1 學習動線問題
| # | 問題 | 例子 |
|---|------|------|
| A | **關卡順序是照建立時間排，不是照教學順序** | `amend`(18)、`stash`(19)、`mv/clean`(20)、「誤 commit 到 main」(22) 都是第一週就該會的，卻排在 `bisect`(10)、`hooks`(11) 後面 |
| B | **難度曲線上下亂跳** | 06 ⭐⭐⭐⭐ → 13 ⭐⭐ → 14 ⭐⭐⭐⭐ → 15 ⭐⭐ → 18–20 ⭐⭐ |
| C | **分類標籤太碎** | 一共 11 種 category，其中 6 種只有 1 關（提交修飾、上下文切換、工作區維護、遠端協作、災難平移、底層解密） |
| D | **文件數字對不起來** | README 同時寫了「18 大」和「24 個」；LAB_GUIDE 表格只列 18 關；`scenarios-data.js` 檔頭寫「18 大」；README 測試段落寫「18 關」 |

### 1.2 專業工程師每天都在用、但課綱缺少的技能
| 缺口 | 為什麼重要 |
|------|-----------|
| **看懂變更**：`diff` / `diff --staged` / `log --graph` / `show` / `HEAD~n`、`A..B` | 所有操作的前提。現在 Web 的 `diff --staged` 是寫死的假輸出 |
| **後悔藥對照**：`restore`、`restore --staged`、`reset --soft/--mixed/--hard` | README 有推薦 `git restore`，**但 Web 引擎根本不支援 `restore`** |
| **Clone 與追蹤分支**：`clone`、`push -u`、`branch -vv`、ahead/behind | 06 直接跳到「push 被拒」，少了最基本的遠端心智模型 |
| **完整 PR 生命週期**：rebase 後要 `push --force-with-lease`，merge 後要清分支（`fetch --prune`、`push origin --delete`） | 職場最常用的一套流程，`--force-with-lease` 目前**完全沒教** |
| **Rebase 中途衝突**：`--continue / --abort / --skip` | 04 的 rebase 不會遇到衝突，學員第一次真的遇到就卡住 |
| **合併策略**：`--no-ff`、`--squash`（GitHub 三個 merge 按鈕的差別）、`branch -d` vs `-D` | 跟平台協作時一定會碰到 |
| **Detached HEAD** | 切到 tag、bisect、checkout hash 都會進入這個狀態，初學者會很慌 |
| **`commit --fixup` + `rebase --autosquash`** | 速查表有寫，但沒有關卡可以練 |
| 進階：`rebase --onto`（Stacked PR）、外洩密鑰清除（`filter-repo`）、submodule / sparse-checkout | 從中階往進階走的代表性技能 |

### 1.3 佈局 / UX 問題
1. 關卡選單是 24 項平鋪清單，沒有章節分組，也看不到各章進度。
2. 沒有「課程地圖」，第一次進站就直接掉進第 00 關，看不到整體路線。
3. **DAG 樹狀圖是 Git 學習的核心視覺，卻藏在第 3 個分頁**。分支類關卡應該預設顯示，或常駐顯示。
4. Header 有 6 顆按鈕；「🎯 關卡情境」跟「關卡任務」分頁的功能重複。
5. 下一關快捷鍵 `Ctrl/Cmd+N`：macOS 上 `Cmd+N` 會開新視窗，Windows/Linux 的 Chrome 也保留 `Ctrl+N`，**沒辦法可靠攔截**。
6. 「現代指令速查」整份寫死在 `index.html`，沒跟關卡連結，也很難維護。

---

## 2. 設計原則
1. **先單機、再分支、再遠端、再改寫歷史、再團隊流程、最後救援與進階**。每一章只用到前面章節教過的指令。
2. **每關只教 1 個核心概念**，相關變化放在「推薦可選 / variations」。
3. **相容既有資料**：現有關卡的 `id`（`'00'`–`'23'`）是 localStorage 進度和測試的 key，**一律不改**。新關卡從 `'24'` 開始編號。畫面上顯示的編號由 manifest 的順序決定（例如 `2-3`）。
4. **CLI 與 Web 共用同一份課程順序**（§4）。

---

## 3. 新課綱（8 章、33 關核心 + 2 關選修）

> 「來源」欄：`既有 NN` = 沿用現有關卡（文字不動）；`🆕` = 新增關卡（規格在 §5）。
> 「顯示難度」放在 manifest 的 `difficulty` 欄位覆寫，不改原檔。

### Ch0 環境就緒
| 顯示 | slug | 來源 | 顯示難度 | 預設分頁 |
|---|---|---|---|---|
| 0-1 | `setup-identity` | 既有 00 | ★ | mission |

### Ch1 單機日常循環（修改 → 檢視 → 暫存 → 提交 → 反悔）
| 顯示 | slug | 來源 | 顯示難度 | 預設分頁 |
|---|---|---|---|---|
| 1-1 | `first-commit` | 既有 01 | ★ | files |
| 1-2 | `inspect-changes` | 🆕 24 | ★ | mission |
| 1-3 | `gitignore-untrack` | 既有 13 | ★★ | files |
| 1-4 | `mv-clean` | 既有 20 | ★★ | files |
| 1-5 | `undo-matrix` | 🆕 25 | ★★ | files |
| 1-6 | `amend` | 既有 18 | ★★ | graph |

### Ch2 分支與整合
| 顯示 | slug | 來源 | 顯示難度 | 預設分頁 |
|---|---|---|---|---|
| 2-1 | `branch-ff` | 既有 02 | ★★ | graph |
| 2-2 | `merge-strategies` | 🆕 26 | ★★ | graph |
| 2-3 | `merge-conflict` | 既有 03 | ★★★ | files |
| 2-4 | `stash` | 既有 19 | ★★ | mission |
| 2-5 | `detached-head` | 🆕 27 | ★★ | graph |
| 2-6 | `accidental-main` | 既有 22 | ★★★ | graph |

### Ch3 遠端協作基礎
| 顯示 | slug | 來源 | 顯示難度 | 預設分頁 |
|---|---|---|---|---|
| 3-1 | `clone-and-track` | 🆕 28 | ★★ | graph |
| 3-2 | `remote-fetch` | 既有 21 | ★★★ | graph |
| 3-3 | `push-rejected` | 既有 06 | ★★★ | graph |

### Ch4 打造乾淨歷史
| 顯示 | slug | 來源 | 顯示難度 | 預設分頁 |
|---|---|---|---|---|
| 4-1 | `patch-add` | 既有 12 | ★★★ | files |
| 4-2 | `rebase-linear` | 既有 04 | ★★★ | graph |
| 4-3 | `rebase-conflict` | 🆕 29 | ★★★ | files |
| 4-4 | `interactive-rebase` | 既有 05 | ★★★ | graph |
| 4-5 | `fixup-autosquash` | 🆕 30 | ★★★ | graph |
| 4-6 | `cherry-pick` | 既有 07 | ★★★ | graph |

### Ch5 團隊工作流與發布
| 顯示 | slug | 來源 | 顯示難度 | 預設分頁 |
|---|---|---|---|---|
| 5-1 | `pr-lifecycle` | 🆕 31 | ★★★★ | graph |
| 5-2 | `tags-release` | 既有 15 | ★★ | graph |
| 5-3 | `revert-merge` | 既有 14 | ★★★★ | graph |
| 5-4 | `hooks` | 既有 11 | ★★★ | mission |

### Ch6 救援與除錯
| 顯示 | slug | 來源 | 顯示難度 | 預設分頁 |
|---|---|---|---|---|
| 6-1 | `reflog-rescue` | 既有 08 | ★★★ | graph |
| 6-2 | `archaeology` | 既有 16 | ★★★ | mission |
| 6-3 | `bisect` | 既有 10 | ★★★★ | graph |

### Ch7 進階工程
| 顯示 | slug | 來源 | 顯示難度 | 預設分頁 |
|---|---|---|---|---|
| 7-1 | `worktree` | 既有 09 | ★★★★ | graph |
| 7-2 | `rerere` | 既有 17 | ★★★★ | files |
| 7-3 | `rebase-onto` | 🆕 32 | ★★★★★ | graph |
| 7-4 | `secret-purge` | 🆕 33 | ★★★★★ | graph |
| 7-5 | `plumbing` | 既有 23 | ★★★★ | mission |
| 選修 | `submodule` | 🆕 34（P2） | ★★★★ | files |
| 選修 | `sparse-checkout` | 🆕 35（P2） | ★★★★ | files |

**排序理由重點**
- `stash` 排在 `merge-conflict` 之後、`detached-head` 之前：學員已經會切分支，才體會得到「切換前要先收拾工作區」。
- `accidental-main` 需要「開分支 + `reset --hard`」，所以排在 `undo-matrix` 和 `branch-ff` 之後。
- `patch-add` 移到 Ch4 開頭：它是「打造好 commit」的起點，跟 rebase 整理歷史是同一個主題。
- `pr-lifecycle` 是 Ch3 + Ch4 的總複習，所以放在 Ch5 第一關。
- `plumbing` 放最後當作「揭開黑盒子」的畢業關。

---

## 4. 單一課程來源：`docs/curriculum.js`

新增這個檔案，內容是**純 JSON 字面值**，讓 Python 也能讀：

```js
// docs/curriculum.js — 不要在這裡寫 JS 邏輯；Python 會把「=」後面的內容剝出來用 json.loads 解析
window.CURRICULUM = {
  "version": 2,
  "chapters": [
    {
      "key": "ch0", "title": "環境就緒", "summary": "設定身分與連線，之後的每個 commit 都會記錄這些資訊",
      "levels": [
        { "id": "00", "slug": "setup-identity", "difficulty": "★", "defaultTab": "mission" }
      ]
    },
    {
      "key": "ch1", "title": "單機日常循環", "summary": "修改 → 檢視 → 暫存 → 提交 → 反悔",
      "levels": [
        { "id": "01", "slug": "first-commit",     "difficulty": "★",  "defaultTab": "files" },
        { "id": "24", "slug": "inspect-changes",  "difficulty": "★",  "defaultTab": "mission" }
        // ... 依 §3 表格填完
      ]
    }
  ],
  "optional": [
    { "id": "34", "slug": "submodule", "difficulty": "★★★★", "defaultTab": "files" }
  ]
};
```
> 上面的 `//` 註解只是說明用，實際檔案**不要放註解**，否則 Python 的 `json.loads` 會失敗。

### 4.1 Web 端整合（`app.js`）
- 在 `index.html` 裡，`curriculum.js` 要在 `scenarios-data.js` 之後、`app.js` 之前載入。
- 新增 `ORDERED_SCENARIOS`：照 manifest 順序，用 `id` 對應到 `SCENARIOS` 裡的物件，並合併 `difficulty / defaultTab / slug / chapter`。**所有用到 `SCENARIOS[index]` 的地方都改用 `ORDERED_SCENARIOS`**（像 `nextScenario`、選單、通關訊息裡的「24 關」）。
- 關卡總數一律用 `ORDERED_SCENARIOS.length`，不要寫死數字。
- 新關卡放在新檔 **`docs/scenarios-extra.js`**，內容是 `SCENARIOS.push({...})`，**不要修改 `scenarios-data.js`**。對應的教學內容放 `docs/command-guides-extra.js`，用 `Object.assign(COMMAND_GUIDES, {...})` 合併進去。
- 開機時做一次檢查：manifest 裡每個 id 都要在 `SCENARIOS` 找得到，反過來也一樣；不一致就 `console.error`。

### 4.2 CLI 端整合（`lab/`）
- `lab/curriculum.py`：讀取 `docs/curriculum.js`，剝掉 `window.CURRICULUM =` 和結尾的 `;`，再 `json.loads`。
- `lab/scenarios/__init__.py`：`SCENARIOS` 依 manifest 排序；`ALIASES` 自動加入每關的 `slug` 和顯示編號（例如 `2-3`），保留舊的別名。
- `./git-lab list`：依章節分組顯示，格式例如 `[2-3] (id 03) 迎戰衝突…  ✔`。
- `./git-lab verify` 通過後，「下一關」照 manifest 順序走。
- 新增 `lab/scenarios/s24_inspect_changes.py` … `s35_sparse_checkout.py`。

### 4.3 測試
- `tests/test_all_scenarios.py` 為每個新關卡加 1 個 test（setup → 執行標準解法 → verify 通過；另外驗證「什麼都不做」時 verify **不能**通過）。
- 新增 `test_curriculum_consistency`：manifest 的 id 集合 = Python 的 `SCENARIO_MAP` keys = `scenarios-data.js` + `scenarios-extra.js` 裡的 id（用 regex 擷取 `id: 'NN'`）。

---

## 5. 新關卡規格

> 每關都要做齊：Python 關卡類別（真實 git）、Web 關卡（`scenarios-extra.js`）、教學內容（`command-guides-extra.js`，包含 `guidedSteps`（標 required / optional）與 `variations`）、測試。
> 故事語氣請參考現有關卡（「菜雞」、主管、同事 Alice）。下面的 story 是草稿，作者之後會再潤飾。

### 🆕 24 `inspect-changes` — 看懂變更：status / diff / log / show
- **故事草稿**：接手同事的半成品，工作區有改過的檔案、也有已暫存的檔案。commit 前，先搞清楚「改了什麼、哪些已經暫存、歷史長怎樣」。
- **初始狀態**：3 個 commit 的線性歷史；`app.js` 有未暫存的修改；`utils.js` 有已暫存的修改；另外有 1 個未追蹤的 `notes.txt`。
- **必做步驟**：
  1. `git status -s`（看懂 `M `、` M`、`??` 這兩欄代表的意思）
  2. `git diff`（工作區 vs 暫存區）
  3. `git diff --staged`（暫存區 vs HEAD）
  4. `git log --oneline --graph`
  5. `git show HEAD~1`（學會相對參照 `HEAD~n`）
- **可選步驟**：`git diff HEAD~2 HEAD --stat`、`git log -p -1`、`git log main..feature`（範圍語法）、設定別名 `git config alias.lg "log --graph --oneline --all"`。
- **驗收**：這是「觀察型」關卡，用指令紀錄判斷：必須依序執行過 `diff`、`diff --staged`、`log`，以及 `show <含 ~ 或 ^ 的參照>`。CLI 端在 workspace 設一個 `~/.git-lab` 指令紀錄或 shell wrapper 不實際，所以 CLI 改成問答：verify 時問「`utils.js` 現在是已暫存還是未暫存？」並比對答案（可以用 `input()`，或讓學員把答案寫進 `ANSWER.txt`）。

### 🆕 25 `undo-matrix` — 後悔藥對照：restore / reset 三種模式
- **故事草稿**：一個下午同時犯了三個錯：改壞了檔案、把不該暫存的 debug 檔加進暫存區、太早 commit 了半成品。
- **初始狀態**：`config.js` 工作區被改壞（還沒暫存）；`debug.log` 已經 `add`；HEAD 是一個訊息為 `wip: half done` 的 commit。
- **必做步驟**：
  1. `git restore config.js` → 放棄工作區修改
  2. `git restore --staged debug.log` → 移出暫存區（檔案還留在硬碟上）
  3. `git reset --soft HEAD~1` → 撤銷 commit，變更保留在暫存區
  4. 重新 `git commit -m "feat: ..."`
- **教學重點**（放在 guide）：做一張表，說明 `--soft / --mixed / --hard` 分別會動到 HEAD、Index、Working Tree 中的哪幾個；並且強調 `--hard` 會丟資料，提醒還有 reflog（Ch6）可以救。
- **驗收**：`config.js` 跟 HEAD 一致；`debug.log` 是未追蹤狀態而且檔案還在；歷史中沒有 `wip:` 開頭的 commit；HEAD 的 parent 是原本那個 `wip` commit 的 parent。

### 🆕 26 `merge-strategies` — Fast-forward / --no-ff / --squash 與清理分支
- **故事草稿**：GitHub 上有三個合併按鈕（Create a merge commit / Squash and merge / Rebase and merge），主管要你在本機親手做一遍，搞懂差別。
- **初始狀態**：`main` 加上兩條可以 fast-forward 的分支：`feature/a`（2 個 commit）、`feature/b`（3 個零碎 commit）。
- **必做步驟**：
  1. `git merge --no-ff feature/a` → 產生 merge commit，保留分支的形狀
  2. `git merge --squash feature/b` + `git commit -m "feat: b"` → 壓成單一 commit
  3. `git branch -d feature/a`（成功）
  4. `git branch -d feature/b` → **會被拒絕**（因為 squash 之後 Git 不認為它已經合併）→ 了解原因後改用 `git branch -D feature/b`
- **驗收**：`main` 上有一個 parents 為 2 的 merge commit，而且裡面包含 feature/a 的 commit；`main` 的最新 commit 是單一 parent，內容包含 feature/b 的所有變更；兩條分支都已經刪除。

### 🆕 27 `detached-head` — 分離 HEAD：查看舊版本並救回在上面做的 commit
- **故事草稿**：PM 要你看一下 `v1.0` 那時候的畫面。你切過去順手修了一個東西還 commit 了，切回 main 時 Git 警告你「有 commit 被留下了」。
- **初始狀態**：有 tag `v1.0` 的歷史，`main` 已經往前走了 3 個 commit。
- **必做步驟**：
  1. `git switch --detach v1.0`（觀察提示字元變成 `(HEAD detached at v1.0)`）
  2. 修改檔案並 commit
  3. `git switch -c hotfix/v1-legacy` → 替這個 commit 建分支保住它
  4. `git switch main`
- **可選步驟**：故意先 `git switch main`，再用 `git reflog` 或 Git 警告訊息裡的 hash 把 commit 找回來。
- **驗收**：`hotfix/v1-legacy` 存在，它的 parent 是 `v1.0` 指向的 commit，而且多了一個新 commit；HEAD 停在 `main`。

### 🆕 28 `clone-and-track` — Clone、首次推送與追蹤分支
- **故事草稿**：第一天要從公司 GitHub clone 專案、開分支、推上去，並看懂 `ahead 1, behind 2` 是什麼意思。
- **初始狀態**：一個模擬的 bare remote（可參考 06 的 `.git-lab-remote` 作法），裡面有 main（3 個 commit）；workspace 是空的。
- **必做步驟**：
  1. `git clone <remote> app && cd app`（Web 版：`git clone origin`，直接載入）
  2. `git switch -c feature/profile`，commit 1 次
  3. `git push -u origin feature/profile`（如果 00 有開 `push.autoSetupRemote`，可以直接 `git push`）
  4. `git branch -vv` → 看懂 `[origin/feature/profile]` 和 ahead/behind 的意思
- **可選步驟**：`git remote -v`、`git log origin/main..main`、`git status` 裡的「Your branch is ahead of…」。
- **驗收**：remote 上有 `feature/profile`，而且跟本地一致；本地分支的 upstream 設定為 `origin/feature/profile`。
- **CLI 備註**：clone 出來的目錄放在 `workspace/app`，verify 時從這個目錄讀取。

### 🆕 29 `rebase-conflict` — Rebase 中途衝突：continue / abort / skip
- **故事草稿**：照主管說的 rebase main，結果第 2 個 commit 衝突，終端機停在一半。
- **初始狀態**：`feature` 有 3 個 commit，其中第 2 個跟 `main` 改到同一行。
- **必做步驟**：
  1. `git rebase main` → 停在第 2 個 commit
  2. `git status`（看懂 `rebase in progress`）
  3. 編輯並解決衝突 → `git add <file>`
  4. `git rebase --continue` → 完成
- **可選步驟**：先試一次 `git rebase --abort` 回到原本狀態，再重來一次；了解 `--skip` 的用途（直接丟掉這個 commit）。
- **教學重點**：rebase 衝突中的 `ours / theirs` 跟 merge 時**是反過來的**。
- **驗收**：`main` 是 `feature` 的祖先；`feature` 上依然有 3 個 commit（訊息跟原本一樣）；檔案裡沒有衝突標記；目前沒有進行中的 rebase。

### 🆕 30 `fixup-autosquash` — 精準修補歷史中的某個 commit
- **故事草稿**：PR 有 4 個 commit，Reviewer 指出第 2 個 commit 有 typo。不要另外加一個「fix typo」commit，而是把修正融進原本那個 commit。
- **初始狀態**：`feature` 有 4 個 commit，其中 `feat: add validator` 的 `validator.js` 有 typo。
- **必做步驟**：
  1. 修正 typo 後 `git add validator.js`
  2. `git commit --fixup <validator 那個 commit 的 hash>`（會產生 `fixup! feat: add validator`）
  3. `git rebase -i --autosquash main`（Web 版自動套用；CLI 用 `GIT_SEQUENCE_EDITOR=:`，或在提示中教學員直接存檔離開）
- **可選步驟**：`git config --global rebase.autoSquash true`。
- **驗收**：歷史中沒有 `fixup!` 開頭的 commit；commit 數量還是 4 個；`feat: add validator` 那個 commit 的 `validator.js` 已經是修正後的內容。

### 🆕 31 `pr-lifecycle` — 一個 PR 從開到收（Ch3–4 總複習）
- **故事草稿**：你的 PR 等 review 的時候，main 被別人合了 2 個 PR。主管要求「rebase 到最新的 main 再推」，合併之後還要把分支清乾淨。
- **初始狀態**：remote 上有 `main`；remote 和本地都有 `feature/cart`（本地已經 push 過）；remote 的 `main` 多了 2 個本地還沒有的 commit。
- **必做步驟**：
  1. `git fetch origin`
  2. `git rebase origin/main`
  3. `git push` → **被拒絕**（因為 rebase 改寫了歷史）
  4. `git push --force-with-lease` → 成功
  5. （系統模擬 PR 已經在 remote 被 merge，並刪除了 remote 的 `feature/cart`）`git switch main && git pull`
  6. `git branch -d feature/cart` 和 `git fetch --prune`
- **教學重點**：`--force-with-lease` vs `--force`。可以加一段可選情境：同事在你 fetch 之後又推了 commit 到同一條分支，這時 `--force-with-lease` 會拒絕推送，`--force` 則會蓋掉同事的 commit。
- **驗收**：remote 的 `main` 包含 feature 的 commit；本地沒有 `feature/cart`；沒有 `origin/feature/cart` 這個 remote-tracking ref；本地 `main` 跟 `origin/main` 一致。
- **實作注意**：步驟 5 的「遠端 merge」需要一個觸發點。建議在 force-with-lease 成功後自動執行，並在終端機印出 `🤖 [模擬] Reviewer 已核准，PR #42 已合併並刪除遠端分支`。

### 🆕 32 `rebase-onto` — Stacked PR：基底分支被 squash merge 之後
- **故事草稿**：`feature/api` 還在 review，你又從它開了 `feature/ui` 繼續做。後來 `feature/api` 被 squash merge 進 main，`feature/ui` 一 rebase main 就跑出一堆重複的 commit 和衝突。
- **初始狀態**：`main ← feature/api（3 個 commit）← feature/ui（2 個 commit）`；`main` 上多了一個 squash 過的 `feat: api`（內容等於 feature/api 的 3 個 commit）。
- **必做步驟**：`git rebase --onto main feature/api feature/ui`
- **驗收**：`feature/ui` 只比 `main` 多 2 個 commit（訊息跟原本一樣），parent 鏈直接接在 `main` 上。

### 🆕 33 `secret-purge` — 密鑰已經推上遠端的事故處理
- **故事草稿**：3 個 commit 之前把 `.env`（含 AWS key）commit 並 push 了。光用 `git rm` 沒有用，歷史裡還找得到。
- **初始狀態**：歷史中有一個 commit 新增了 `.env`，之後還有 2 個 commit；已經推到 remote。
- **必做步驟**：
  1. （guide 強調：**第一步是到雲端 rotate / 撤銷這把 key**，用一個 checkbox 讓學員確認）
  2. `git filter-repo --path .env --invert-paths`（CLI：先檢查有沒有安裝，沒有的話 fallback 用 `git filter-branch --index-filter 'git rm --cached --ignore-unmatch .env' -- --all`，並在提示中說明這是舊做法）
  3. 把 `.env` 加進 `.gitignore`
  4. `git push --force-with-lease`，並通知團隊重新 clone
- **驗收**：`git log --all -- .env` 是空的；`.gitignore` 裡有 `.env`；remote 的 main 跟本地一致。

### 🆕 34 `submodule`（P2 選修）／🆕 35 `sparse-checkout`（P2 選修）
- `submodule`：`git submodule add`、clone 時加 `--recurse-submodules`、`git submodule update --init`。驗收：`.gitmodules` 存在，而且子模組指向指定的 commit。
- `sparse-checkout`：`git clone --filter=blob:none --sparse`、`git sparse-checkout set packages/web`。驗收：工作目錄裡只有指定的子目錄。
- Web 引擎的實作成本高，**可以先只做 CLI 版**，Web 選單上標示「僅 CLI」。

---

## 6. Web 引擎工作清單（`git-engine.js` / `app.js`）

### 6.1 新關卡需要的能力
| 代號 | 能力 | 需要的關卡 |
|---|---|---|
| E1 | 新增 `restore`（`<file>`、`--staged`、`--source=<rev>`） | 25 |
| E2 | 真正的 `diff`（工作區/暫存區/HEAD，簡單的逐行 LCS）、`diff A B`、`--stat`、`status -s`、`show <rev>` 附上 diff。**移除寫死的 `shopping.py` 輸出** | 24、全域 |
| E3 | 版本參照解析器：`HEAD~n`、`HEAD^`、`^2`、短 hash、branch、tag、`origin/x`、`@{u}`、`A..B`（給 log 用） | 24、25、27、30、全域 |
| E4 | **真實的遠端模型**：push 遇到 non-FF 要拒絕；支援 `--force`、`--force-with-lease`（跟 remote-tracking ref 比對）、`push origin --delete`、`fetch --prune`、upstream 設定、`branch -vv` 的 ahead/behind、`clone`；**`pull --rebase` 要真的把本地 commit 重放上去** | 06、28、31、33 |
| E5 | `merge --no-ff`（確認既有支援）、`merge --squash`、`merge --abort`；`branch -d` 遇到未合併的分支要拒絕 | 26、03 |
| E6 | Rebase 狀態機：遇到衝突要停下來、支援 `--continue/--abort/--skip`、`status` 顯示 rebase in progress；`--onto`；`commit --fixup` + `--autosquash` | 29、30、32 |
| E7 | Detached HEAD：提示字元顯示、離開時如果有孤兒 commit 要警告 | 27 |
| E8 | 模擬 `filter-repo --path X --invert-paths`（改寫所有 commit 的 tree，產生新的 hash） | 33 |
| E9 | 樹狀圖：remote-tracking ref（`origin/main`）用虛線或不同顏色標示；detached HEAD 要能看出來 | 27、28、31 |

### 6.2 既有關卡的 Bug 修正（作者已同意，屬於 P1，要最先做）

> 修改範圍：`docs/scenarios-data.js` 裡 04 / 05 / 06 的 **`setup` 和 `checkGoal`**（程式邏輯），以及 `docs/git-engine.js`、`docs/app.js`。
> 這三關的 `title / story / goals / hints / difficulty / category` **仍然不要動**，描述由作者之後自己補。

#### 6.2.0 共用前置修改（04/05/06 都會用到）

**(a) 讓 setup 能把關鍵 commit id 傳給 checkGoal**
- `git-engine.js` 的 `resetAll()` 裡加上 `this.scenarioMeta = {};`。
- setup 中把需要的 id 存進 `git.scenarioMeta`。checkGoal 一律從這裡讀，**禁止再寫死 `'c1'` 這類 id**，因為 `generateHash()` 產生的是 hash，不是 `c1`。

**(b) 修正 rebase / cherry-pick 的重放方式（引擎正確性 bug）**
- 現狀：`rebase()` 重放 commit 時用的是 `tree: new Map(c.tree)`，也就是**整份快照**。這樣 upstream 新增的檔案會在重放後消失。例如 06 重放「我的 commit」時，同事新增的檔案就被蓋掉了。
- 修法：新增兩個 helper，並讓 `rebase()`（非 interactive 的路徑）和 `cherryPick()` 都改用它們：
  ```js
  // 算出 commit 相對於它第一個 parent 的變更
  diffTrees(parentTree, tree) {
    const changes = { upsert: new Map(), remove: [] };
    for (const [f, v] of tree) if (parentTree.get(f) !== v) changes.upsert.set(f, v);
    for (const f of parentTree.keys()) if (!tree.has(f)) changes.remove.push(f);
    return changes;
  }
  // 把變更套到新的 base tree 上
  applyChanges(baseTree, changes) {
    const t = new Map(baseTree);
    for (const [f, v] of changes.upsert) t.set(f, v);
    for (const f of changes.remove) t.delete(f);
    return t;
  }
  ```
  重放時：`newTree = applyChanges(newBase.tree, diffTrees(parent.tree, c.tree))`。
  （這裡先不做衝突偵測；衝突狀態機留到 E6 再做。）

**(c) 把 pull / push 從 `app.js` 搬進引擎**
- 新增 `git.pull(args)` 和 `git.push(args)`，回傳 `{ code, output }`。`app.js` 的 `case 'pull'` / `case 'push'` 只負責呼叫並印出結果。這樣邏輯才能被 Node 測試覆蓋（見 6.2.4）。

**(d) 讓 `merge()` 也接受 commit id**
- `git-engine.js` 的 `merge()` 目前寫的是 `const targetCommitId = this.branches.get(targetBranch);`，改成 `this.branches.get(targetBranch) || this.resolveCommit(targetBranch)`，這樣 pull 時可以直接拿遠端的 commit 來合併。

---

#### 6.2.1 Bug：04 一開場就自動通關

- **原因**：`checkGoal` 裡的 `fCommit.parents[0] !== 'c1'` 永遠為真，因為 parent 是 hash 而不是 `'c1'`；而 `git.commits.has(...)` 也是真，所以載入關卡就算通過。
- **setup 修改**：在現有 setup 結尾加上
  ```js
  git.scenarioMeta = { baseId: c1.id, mainTipId: c2.id, featureTipId: c3.id };
  ```
- **checkGoal 改寫**：照順序檢查，回傳第一個沒通過的訊息
  ```js
  const { mainTipId, featureTipId } = git.scenarioMeta;
  const mainId = git.branches.get('main');
  const featureId = git.branches.get('feature');
  if (!featureId) return { passed: false, message: 'feature 分支不見了！請按「重設」重來。' };
  if (featureId === featureTipId) return { passed: false, message: 'feature 尚未 rebase！請在 feature 上執行 git rebase main。' };
  if (!git.isAncestor(mainTipId, featureId)) return { passed: false, message: 'feature 還沒接到 main 的最新 commit 後面。' };
  // 從 featureId 沿著 parents[0] 走到 mainTipId：
  //   - 途中任一 commit 的 parents.length > 1 → 失敗：「出現了 merge commit，這關要用 rebase 保持線性」
  //   - 途中找不到 message === 'feat: feature step 1' → 失敗：「你的 feature commit 不見了，可以用 git reflog 找回」
  if (mainId !== featureId) return { passed: false, message: 'rebase 完成！最後一步：git switch main && git merge feature（會是 fast-forward）。' };
  return { passed: true, message: /* 保留原本的成功訊息 */ };
  ```
- **驗證**：
  1. 剛載入時不能通過。
  2. 只做 `git rebase main` 時，要停在提示 merge 的訊息。
  3. 依序執行 `rebase main` → `switch main` → `merge feature` 後通過。
  4. 在 main 上執行 `merge feature`（產生 merge commit）時不能通過。

---

#### 6.2.2 Bug：06 的 pull --rebase 把學員自己的 commit 丟掉，push 也一律成功

- **原因**：
  1. `app.js` 的 `pull --rebase` 直接執行 `git.branches.set(current, remote main)`，本地的 commit 就消失了。
  2. 沒加 `--rebase` 的 `pull` 只印一行字，實際上什麼都沒做。
  3. `push` 沒有 non-fast-forward 檢查，**一開場直接 push 就能通關**。
  4. `checkGoal` 只比較 local 和 remote 是否相等。
- **setup 修改**：結尾加上
  ```js
  git.scenarioMeta = { baseId: c1.id, colleagueId: c2.id, mineMessage: 'feat: my local feature' };
  ```
  建議同時給 c1/c2/c3 加上 `tree`（例如 c1 `app.js`、c2 新增 `notice.txt`、c3 新增 `points.js`），檔案總管才看得出「兩邊的變更都保留了」。
- **`git.pull(args)` 規格**：
  ```text
  branch = 目前所在分支；如果是 detached HEAD → fatal
  remote = 第 1 個非旗標參數，預設 'origin'；remoteBranch = 第 2 個非旗標參數，預設等於 branch
  remoteId = this.remotes[remote].branches.get(remoteBranch)；找不到 → fatal: couldn't find remote ref
  useRebase = args 有 --rebase，或 config['pull.rebase'] === 'true'
  if isAncestor(remoteId, localId)         → "Already up to date."
  else if isAncestor(localId, remoteId)    → fast-forward：移動分支，同步 workingTree/index，印出 "Fast-forward"
  else if useRebase                        → this.rebase(remoteId)（使用 6.2.0(b) 修好的重放），印出 "Successfully rebased and updated refs/heads/<branch>."
  else                                     → this.merge(remoteId)，產生 merge commit，印出 "Merge made by the 'ort' strategy."
  ```
- **`git.push(args)` 規格**：
  ```text
  remote = 第 1 個非旗標參數，預設 'origin'；branch = 第 2 個非旗標參數，預設目前分支
  force = 有 --force 或 -f；lease = 有 --force-with-lease
  remoteId 不存在                → 建立遠端分支，印出 " * [new branch]      main -> main"
  remoteId === localId           → "Everything up-to-date"
  isAncestor(remoteId, localId)  → 更新遠端，印出 "   abc1234..def5678  main -> main"
  force || lease                 → 更新遠端，印出 " + abc1234...def5678 main -> main (forced update)"
                                   （真正的 lease 比對等 E4 做出 remote-tracking ref 後再補）
  其他情況                        → code 1，印出真實 Git 的拒絕訊息：
     To https://github.com/Hsing24/learn-git.git
      ! [rejected]        main -> main (fetch first)
     error: failed to push some refs to 'https://github.com/Hsing24/learn-git.git'
     hint: Updates were rejected because the remote contains work that you do not
     hint: have locally. This is usually caused by another repository pushing to
     hint: the same ref. If you want to integrate the remote changes, use
     hint: 'git pull' before pushing again.
  ```
- **checkGoal 改寫**（照順序檢查）：
  ```js
  const { colleagueId, mineMessage } = git.scenarioMeta;
  const localId = git.branches.get('main');
  const remoteId = git.remotes.origin.branches.get('main');
  const firstParentChain = /* 從 localId 沿著 parents[0] 走到 root 的 commit 陣列 */;
  const hasMine = firstParentChain.some(c => c.message === mineMessage);
  const hasColleague = git.isAncestor(colleagueId, localId);
  const hasMerge = firstParentChain.some(c => c.parents.length > 1);

  if (!hasColleague && remoteId === localId)
    return fail('同事的 commit 被你的 force push 蓋掉了！真實團隊裡這會造成事故，請按「重設」重來，不要用 --force。');
  if (!hasMine)       return fail('你的本地 commit 不見了！可以用 git reflog 找到它的 hash，再用 git reset --hard <hash> 救回來。');
  if (!hasColleague)  return fail('還沒同步遠端上同事的 commit，請執行 git pull --rebase。');
  if (hasMerge)       return fail('出現了 merge commit（你用了沒加 --rebase 的 pull）。請用 git reset --hard HEAD~1 退回去，再改用 git pull --rebase。');
  if (remoteId !== localId) return fail('本地已經整理好了，最後一步：git push origin main。');
  return pass(/* 保留原本的成功訊息 */);
  ```
- **驗證**：
  1. 一開場直接 `push` 要被拒絕，而且不能通過。
  2. `pull --rebase` → `push` 要通過，main 上要同時有兩人的 commit，而且是線性歷史。
  3. `push --force` 要觸發「蓋掉同事」的訊息。
  4. `pull`（不加 --rebase）→ `push` 要觸發「merge commit」的訊息。

---

#### 6.2.3 Bug：05 的 rebase -i 是假的，驗收也太寬鬆

- **原因**：
  1. 引擎的 `rebase(..., {interactive})` 會直接把所有 commit 壓成一個，並使用**寫死的訊息** `'feat: complete payment form feature'`。學員根本沒有操作 todo 清單。
  2. `checkGoal` 只看 HEAD 訊息有沒有 `wip` / `typo`，沒有檢查 commit 數量和內容。
  3. setup 的 commit 都沒有 `tree`，所以就算 squash 時把變更丟掉也看不出來。
- **setup 修改**：
  ```js
  const c1 = git.createCommit({ message: 'feat: scaffold', tree: new Map([['payment.js', '// payment module\n']]) });
  const c2 = git.createCommit({ message: 'wip: payment form', parents: [c1.id],
    tree: new Map([['payment.js', '// payment module\nfunction renderForm() { cardNumbr(); }\n']]) });
  const c3 = git.createCommit({ message: 'fix: typo in card input', parents: [c2.id],
    tree: new Map([['payment.js', '// payment module\nfunction renderForm() { cardNumber(); }\n']]) });
  // 同步 workingTree / index 為 c3.tree（照原本 setup 的寫法）
  git.scenarioMeta = { baseId: c1.id, finalContent: c3.tree.get('payment.js') };
  ```
- **引擎：實作真正的互動式 rebase（這就是 E6 的第一部分，提前在這裡做）**
  - 新增 `git.rebaseInteractivePlan(upstream)`：回傳要重放的 commit 清單（由舊到新）。如果是空的，回傳 `"nothing to do"`。
  - 新增 `git.rebaseInteractiveApply(upstreamId, todo)`，其中 `todo = [{ id, action: 'pick'|'reword'|'squash'|'fixup'|'drop', message? }]`：
    - `pick`：用 6.2.0(b) 的 diff 方式重放。
    - `reword`：重放，並使用新的 message。
    - `squash` / `fixup`：把變更併入前一個結果 commit。squash 用使用者在第二步編輯的訊息；fixup 沿用前一個 commit 的訊息。
    - `drop`：跳過。
    - 驗證規則跟真實 Git 一樣：第一行不能是 squash/fixup，否則回傳錯誤 `error: cannot 'squash' without a previous commit`。
    - 完成後更新分支、workingTree、index、reflog，印出 `Successfully rebased and updated refs/heads/<branch>.`
  - **刪除**寫死的 `'feat: complete payment form feature'`。`options.interactive` 的舊路徑也要移除，避免繞過 todo 清單。
- **UI（`app.js` + `index.html` + `style.css`）**：輸入 `git rebase -i <upstream>`（支援 `HEAD~n`）時：
  1. 終端機先印出仿真的 todo 文字（例如 `pick a1b2c3d wip: payment form`），讓學員認識真實格式。
  2. 開啟「Rebase Todo」modal：每列一個 commit，左邊是動作下拉選單（pick / reword / squash / fixup / drop），右邊是短 hash 和訊息。下方有「開始 rebase」和「取消（等同 --abort）」兩顆按鈕。
  3. 如果有 squash 或 reword，進入第二步：一個 textarea，預設內容照真實 Git 的格式（`# This is a combination of 2 commits.` 加上各 commit 的訊息），讓學員自己編輯最終訊息。以 `#` 開頭的行在送出時要去掉。
  4. 按取消時印出 `rebase aborted`，狀態完全不變。
  5. 視覺遵守 `DESIGN.md`，並重用現有 modal 的樣式 class。
- **checkGoal 改寫**：
  ```js
  const { baseId, finalContent } = git.scenarioMeta;
  const head = git.getHeadCommit();
  // 從 head 沿著 parents[0] 數到 baseId 為止的 commit 數 = n
  if (n !== 1) return fail(`scaffold 之上應該只剩 1 個 commit，目前有 ${n} 個。試試 git rebase -i HEAD~2，把第 2 行改成 squash 或 fixup。`);
  if (/^wip\b|typo/i.test(head.message)) return fail('commit 已經合併了，但訊息還是零碎的 wip / typo，請用 squash 編輯訊息，或用 reword 改掉。');
  if (head.tree.get('payment.js') !== finalContent) return fail('payment.js 的內容不對，可能是用了 drop 把變更丟掉了。請按「重設」再試一次。');
  return pass(/* 保留原本的成功訊息 */);
  ```
  > `reset --soft HEAD~2` 加上重新 commit 也能滿足以上條件，所以也會通過。這是刻意保留的替代解法。作者之後改 hints 時，會把 `rebase -i` 列為主要解法。
- **驗證**：
  1. 剛載入時不能通過。
  2. `rebase -i HEAD~2` 時第 2 行選 fixup → 訊息還是 `wip: payment form`，所以要失敗並提示要改訊息。
  3. 第 2 行選 squash 並把訊息改成 `feat: payment form` → 通過。
  4. 第 2 行選 drop → 觸發「內容不對」的訊息。
  5. 在 modal 按取消 → 歷史不變。
- **CLI 版（`lab/scenarios/s05_rebase_interactive.py`）**：用的是真實 git，邏輯大致正確。唯一要改的是訊息判斷 `"user authentication" not in msg and "auth" not in msg` 太寬鬆，改成要求最新訊息**不能**以 `wip` / `fix typo` / `really fix` 開頭，並且 `auth.py` 的內容要等於 `AUTH_FINAL_CODE`。

---

#### 6.2.4 防止同類 bug 再發生：Web 關卡的 Node 測試
- 新增 `tests/web/run_scenarios.mjs`（不需要安裝套件，用 `node:vm` 載入 `git-engine.js`、`scenarios-data.js`、`scenarios-extra.js`）。
- 每關定義三個情境：
  1. **fresh**：setup 完立刻執行 `checkGoal`，**每一關都必須是 false**，沒有例外（00 的 setup 會清空 name/email，本來就不會通過）。
  2. **solution**：照標準解法呼叫引擎方法後，必須是 true。
  3. **shortcut**（如果有的話）：用破壞性捷徑（force push、drop、merge 取代 rebase）後，必須是 false。
- 在 README 測試段落加上 `node tests/web/run_scenarios.mjs`。如果日後加上 CI，兩套測試（Python 和 Node）都要跑。

---

## 7. 佈局與 UX 調整

### 7.1 課程地圖（新增）
- 第一次造訪（localStorage 裡沒有進度）時，顯示**課程地圖頁 / overlay**：8 章卡片，每張有章名、一句話摘要、關卡數、完成進度條。點卡片就跳到該章第一個還沒完成的關卡。
- Header 的品牌區或選單最上方放「🗺 課程地圖」入口，可以隨時打開。

### 7.2 關卡選單
- 改成**依章節分組**：章名、`3/6` 進度，下面是關卡清單，每項顯示編號 `2-3`、標題、★ 難度、完成打勾。
- 選修關卡放在最底下，Web 不支援的標「僅 CLI」並設為 disabled。
- 不鎖關（自學者可以跳著玩），但在下一個建議關卡旁標一個小小的「建議下一關」。

### 7.3 右側面板
- 切換關卡時，依 manifest 的 `defaultTab` 自動切換分頁。
- 寬螢幕（≥ 1440px）：**樹狀圖常駐在右側上半部**，下半部是「任務 / 解說 / 檔案」分頁；窄螢幕維持現在的 4 個分頁。
- 把 `story` 卡片放進「關卡任務」分頁最上方（可以收合），**拿掉 Header 的「🎯 關卡情境」按鈕**。進入關卡時的 modal 保留，但加一個「不再自動彈出」的選項。

### 7.4 Header 精簡
- 保留：💡 提示、🔄 重設、✅ 驗收（主要按鈕）。
- 移到右上角的 `⋯` 選單：📖 現代指令速查、🗺 課程地圖、GitHub。

### 7.5 快捷鍵
- 下一關改成 **`Alt+→`**（macOS 上是 `⌥→`），或在通關橫條出現時按 `Enter`。終端機裡輸入 `next` 的方式保留。同步更新 `index.html` 裡的 `kbd` 提示文字。

### 7.6 章節結業卡
- 通過每章最後一關時，除了原本的通關框，再顯示一張「本章學到的指令」卡片（從該章各關 `guidedSteps` 中 required 的指令自動整理出來），附一個「前往下一章」按鈕。

### 7.7 速查手冊改成資料驅動
- 把 `index.html` 裡寫死的表格搬到 `docs/cheatsheet-data.js`（陣列：`{ scene, legacy, modern, why, levelId }`），由 `app.js` 渲染。每列加一個「去練習 →」連結，跳到對應關卡。
- 新增幾列：`push --force` → `push --force-with-lease`（31）、`reset --hard` 拿來撤銷暫存 → `restore --staged`（25）、`checkout <hash>` → `switch --detach`（27）。

---

## 8. 實作分期（請照順序，每期各自一個 commit / PR）

| 期 | 內容 | 完成條件 |
|---|---|---|
| **P0 骨架** | §4 manifest + Web/CLI 整合 + 一致性測試；文件數字改成動態或統一；快捷鍵（§7.5） | 現有 24 關照新順序都能玩，進度沒有遺失，測試全部通過 |
| **P0.5 Bug 修正** | §6.2 全部（6.2.0 共用修改 → 04 → 06 → 05 → 6.2.4 Node 測試） | 6.2.1–6.2.3 每關的「驗證」清單都要通過；`node tests/web/run_scenarios.mjs` 全部通過 |
| **P1 引擎** | E1–E5、E7、E9（6.2 已經做掉的部分不用重做） | 每個新指令都有 2–3 個手動測試案例並記在 PR 描述 |
| **P2 核心新關** | 24、25、26、27、28、31 | CLI + Web + guide + 測試都齊全 |
| **P3 歷史新關** | E6 + 29、30、32 | 同上 |
| **P4 UX** | §7.1–7.4、7.6、7.7 | 新使用者第一次進站看到課程地圖；寬螢幕的樹狀圖常駐 |
| **P5 進階** | E8 + 33；34、35（僅 CLI） | 同上 |
| **P6 文件** | 照新課綱重寫 README / LAB_GUIDE 的關卡表（依章節分組）；LAB_GUIDE 加「reset 三種模式」「force-with-lease」「rebase 衝突中 ours/theirs 會反轉」三個深度專題 | 文件裡的關卡數跟 manifest 一致 |

### 實作守則
- **不要改** `scenarios-data.js` 現有關卡的文字欄位；新關卡寫在 `scenarios-extra.js`。
- 每次修改 JS 都要更新 `index.html` 裡 `?v=` 的快取版本號。
- 視覺遵守 `DESIGN.md` 的 tokens（綠色只當輔助色，不要拿來當主要 CTA 的顏色）。
- 新關卡的 `checkGoal` 一定要能擋住「什麼都沒做」和「用破壞性捷徑」（例如直接 `reset --hard` 到目標狀態）這兩種情況，測試要涵蓋。
