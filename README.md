# Git Scenario Lab

為初學到進階使用者設計的 Git 情境練習。從版本庫、暫存快照與日常復原，逐步學習遠端協作、歷史整理、除錯及工程工具。

[開啟 Web 模擬器](https://hsing24.github.io/learn-git/)。目前共 **49 關：41 個 Web／CLI 核心關卡、8 個 CLI 選修**，依 8 個章節排列。關卡 ID 保留；課程順序調整不會重新編號既有進度。

- **Web**：免安裝的模擬終端機、提交圖、可編輯檔案、逐區塊暫存與獨立 worktree 工作區。
- **CLI**：在 `workspace/` 內呼叫真實 Git；每關自動建立本機練習情境及模擬遠端。

## 快速開始

```bash
git clone https://github.com/Hsing24/learn-git.git
cd learn-git
./git-lab list
./git-lab start 00
cd workspace
# 依任務設定提交作者；完成後驗收
./git-lab verify
```

從零建立版本庫的練習是 `./git-lab start 36`。下一關依課程順序進行，不必按照 ID 大小。切換或重設關卡會重建練習目錄，請先保存要保留的練習成果。

## 平台與版本

| 使用方式 | 需求 |
| :--- | :--- |
| Web | 支援 JavaScript、SVG、localStorage 的現代瀏覽器。 |
| CLI | macOS、Linux 或 WSL；Python 3.11+、Git 2.28+。部分 hooks 需要 Bash。 |
| SSH 簽章選修 48 | Git 2.34+、`ssh-keygen`。金鑰在練習沙盒內產生。 |
| Git LFS 選修 47 | 另行安裝 `git-lfs`；缺少工具時會明確提示，不會模擬成功。 |
| 測試 | Python 3.11+、Node.js 24+、Git；無需 npm 套件。 |

`push.autoSetupRemote` 是 Git 2.37+ 的選用設定。關卡 33 優先使用 `git-filter-repo`；未安裝時保留僅供沙盒的 `filter-branch` 備援，真實專案建議安裝前者，並符合該工具自身的 Git 版本需求。

Web 只模擬課程支援的操作，不會啟動系統 Git、修改本機檔案或連線至 GitHub。連線診斷使用預先建立的錯誤案例；真正的 SSH／HTTPS 登入設定見 [LAB_GUIDE](./LAB_GUIDE.md)。CLI 選修使用真實工具，Web 會標示平台限制。

## 課程地圖

### 第 0 章：環境與版本庫

設定提交作者，從零建立版本庫並認識 Git 快照

| ID | 難度 | 關卡 | 學習範圍 |
| :---: | :---: | :--- | :--- |
| 00 | ★ | 入職設定：提交作者身分 | 作者姓名、信箱、設定來源；作者資訊與登入認證分開 |
| 36 | ★ | 建立倉庫：Git Init 與三區模型 | git init -b main、.git、快照、HEAD 與三區模型 |

### 第 1 章：單機日常循環

修改、檢視、精準暫存、提交與安全復原

| ID | 難度 | 關卡 | 學習範圍 |
| :---: | :---: | :--- | :--- |
| 01 | ★ | 首次存檔：工作區、暫存區與提交 | status、add、commit 與提交後工作區 |
| 37 | ★ | 提交快照：暫存後再修改 | add 後再次修改；commit 儲存 index 而非目前工作區 |
| 24 | ★ | 接手專案：Status、Diff、Log 與 Show | 雙欄狀態、diff／--staged、log／show |
| 12 | ★★ | 拆分變更：Patch 局部暫存 | add -p 選擇區塊、staged diff、原子提交 |
| 41 | ★★ | 排除檔案：Ignore 模式與例外 | 目錄、萬用字元、例外規則與 check-ignore -v |
| 13 | ★★ | 停止追蹤：Gitignore 與移除索引 | ignore 不影響已追蹤檔案、rm --cached、提交除名 |
| 20 | ★★ | 整理檔案：更名與清理預覽 | git mv、先 clean -nd 預覽再 clean -fd |
| 08 | ★★ | 誤刪提交：Reflog 救援 | 本機 reflog、建立救援參照、找回已提交快照與期限 |
| 25 | ★★ | 撤銷操作：Restore 與三種 Reset | restore 預設來源 index；soft／mixed／hard 的三區差異 |
| 38 | ★★ | 共享歷史：Revert 一般提交 | 一般提交 revert、新增反向提交並保留共享歷史 |
| 18 | ★★ | 補上漏檔：Amend 最新提交 | 追加漏檔、修改訊息、amend 改變提交 ID |

### 第 2 章：分支與整合

分支指標、合併、衝突、stash 與版本參照

| ID | 難度 | 關卡 | 學習範圍 |
| :---: | :---: | :--- | :--- |
| 02 | ★★ | 功能開發：分支與快進合併 | 分支指標、switch、建立功能提交、快進合併 |
| 26 | ★★ | 整合功能：Merge、Squash 與分支清理 | no-ff／squash、祖先關係與分支刪除 |
| 03 | ★★★ | 同時修改：解決合併衝突 | 衝突標記、手動決定內容、add、commit；merge --abort |
| 19 | ★★ | 切換任務：Stash 保留與衝突 | stash -u、apply --index、pop 衝突、保留與清理 |
| 44 | ★★★ | 閱讀歷史：修訂參照與範圍 | HEAD^／HEAD~、A..B／A...B 的 log 與 diff 語意 |
| 27 | ★★ | 維護舊版：Detached HEAD 與分支救援 | 分離 HEAD、舊版本修復與新分支保全 |
| 22 | ★★★ | 移走誤提交：分支與 Reset | 先建立分支保存提交，再 reset 未共享的 main |

### 第 3 章：遠端協作基礎

區分作者與認證，理解追蹤分支並選擇同步方式

| ID | 難度 | 關卡 | 學習範圍 |
| :---: | :---: | :--- | :--- |
| 40 | ★★ | 連線排查：作者、驗證與權限 | 作者／認證／權限、SSH／HTTPS URL 與錯誤診斷 |
| 28 | ★★ | 加入協作：Clone 與追蹤分支 | clone、首次 push -u、branch -vv |
| 21 | ★★★ | 觀察遠端：Fetch 與 Pull | remote、fetch 更新追蹤參照、檢視後整合 |
| 39 | ★★★ | 遠端分歧：FF-only 與整合策略 | FF-only 拒絕分歧；比較 merge／rebase 並同步遠端 |
| 06 | ★★★ | 推送被拒：同步遠端並保留雙方提交 | non-fast-forward 拒絕、pull --rebase、保留雙方提交 |

### 第 4 章：整理提交歷史

變基、衝突處理、互動整理與精準移植

| ID | 難度 | 關卡 | 學習範圍 |
| :---: | :---: | :--- | :--- |
| 04 | ★★★ | 主線更新：Rebase 與線性歷史 | 重放提交、保留新主線內容與線性歷史 |
| 29 | ★★★ | 變基中斷：Continue、Abort 與 Skip | 衝突續行、中止還原、略過可捨棄提交 |
| 05 | ★★★ | 整理草稿：互動式 Rebase | 互動 todo、squash／fixup／reword 與內容保留 |
| 30 | ★★★ | 修補舊提交：Fixup 與 Autosquash | fixup 指定提交、autosquash、內容放回正確歷史位置 |
| 07 | ★★★ | 挑選修復：Cherry-pick 與衝突處理 | 單獨摘取修復、衝突處理、continue／abort |

### 第 5 章：團隊工作流與發布

更新 PR、合併後收尾、標籤、回滾與 hooks

| ID | 難度 | 關卡 | 學習範圍 |
| :---: | :---: | :--- | :--- |
| 31 | ★★★★ | PR 更新與合併後收尾：Rebase 與租約推送 | fetch、rebase、租約推送、模擬 PR 合併、同步與清理 |
| 15 | ★★ | 版本標記：附註標籤 | 附註／輕量標籤、指定歷史提交、SemVer 與推送 |
| 14 | ★★★★ | 撤銷合併：Revert 的主線選擇 | merge 雙親、-m 選擇主線、revert 後再次合併 |
| 11 | ★★★ | 提交檢查：Hooks 攔截與修正 | pre-commit 攔截、修正後正常提交、hooks 安裝與限制 |

### 第 6 章：歷史調查與除錯

追查字串與作者，找出引入問題的提交

| ID | 難度 | 關卡 | 學習範圍 |
| :---: | :---: | :--- | :--- |
| 16 | ★★★ | 追溯變更：Pickaxe 與 Blame | log -S／-G、blame -w、作者與變更背景 |
| 10 | ★★★★ | 定位回歸：Bisect 二分搜尋 | 實際測試版本、縮小範圍、找出 first bad commit、reset |

### 第 7 章：進階工程

平行工作區、衝突重用、分支搬移與敏感資料清除

| ID | 難度 | 關卡 | 學習範圍 |
| :---: | :---: | :--- | :--- |
| 09 | ★★★★ | 平行修復：Worktree 獨立工作區 | 獨立 HEAD／index／工作區、保留原草稿、修復與清理 |
| 17 | ★★★★ | 重複衝突：Rerere 記錄與重用 | 第一次記錄、第二次重用、檢查內容後再暫存提交 |
| 32 | ★★★★★ | 堆疊分支：Rebase Onto 搬移範圍 | --onto 精確搬移堆疊分支中的提交範圍 |
| 33 | ★★★★★ | 憑證外洩：輪替與歷史清理 | 先撤銷輪替，再清歷史、明確租約、團隊與平台收尾 |
| 23 | ★★★★ | 探索物件：Commit、Tree 與 Blob | cat-file、commit／tree／blob／tag、內容定址與物件 ID |

### CLI 選修

| ID | 難度 | 關卡 | 學習範圍 |
| :---: | :---: | :--- | :--- |
| 34 | ★★★★ | 引用專案：Submodule 固定版本 | gitlink 固定版本、clone 後初始化、更新子模組 |
| 35 | ★★★★ | 大型專案：Sparse Checkout 工作區範圍 | cone 局部檢出、工作區範圍與 partial clone 的區別 |
| 42 | ★★★ | 跨平台協作：Attributes 與換行 | .gitattributes、LF／CRLF、check-attr 與正規化 |
| 43 | ★★★★ | 調整提交：Split Commit 與 Range-diff | rebase -i edit、拆分提交、range-diff 檢查 |
| 45 | ★★★★ | 自動定位：Bisect Run | bisect run、測試退出碼、skip、reset |
| 46 | ★★★★ | 縮減複製：Partial Clone 與 Shallow Clone | partial／shallow／sparse 的分工與受限歷史 |
| 47 | ★★★★ | 大型資產：Git LFS 指標與工具 | LFS 指標、大型二進位檔與獨立工具／物件儲存 |
| 48 | ★★★★ | 驗證來源：SSH 提交與標籤簽章 | SSH 簽章、commit -S、tag -s、驗證信任設定 |

## 學習與驗收方式

先看任務、操作並檢查結果，再閱讀補充解說。Web 可在檔案總管編輯並儲存工作區內容；`git add -p` 依序輸入 `y`、`n`，以 `q` 結束。Worktree 使用 `cd <path>` 進入獨立目錄，`cd ..` 返回主工作區。

驗收檢查提交內容、祖先關係、工作區與操作狀態。建立普通分支不等於完成 worktree；設定 bisect 邊界不等於找到問題；啟用 rerere 不等於已重用解法。初始狀態及破壞性捷徑必須被拒絕。

[LAB_GUIDE](./LAB_GUIDE.md) 說明操作選擇、Git 概念與限制。[PR 平台實作](./docs/PR_PLATFORM_GUIDE.md) 補充在 GitHub 建立 PR、處理 review 與檢查 CI 的完整流程；第 31 關練習本機更新及模擬合併後收尾。

## 本地驗證

```bash
python3 tests/test_all_scenarios.py
node tests/web/run_scenarios.mjs
for file in docs/*.js; do node --check "$file"; done
git diff --check
```

CLI 測試在一次性暫存專案執行，隔離 Git 設定，不清理你的 `workspace/`。選修工具確實不存在時才跳過對應工具測試，並回報原因。Web 測試覆蓋核心關卡、錯誤捷徑、導覽與 Python／JavaScript 課綱一致性。

## 版本、發布與貢獻

目前沒有已發布的版本化 release；[CHANGELOG](./CHANGELOG.md) 記錄尚未發布變更。發布時依 SemVer 使用 `vMAJOR.MINOR.PATCH` 附註標籤。CI 通過後更新變更紀錄、建立並推送標籤，再建立 GitHub Release。推送 tag 本身不會自動建立 Release；自動建置需要設定相應 workflow。

GitHub Pages 從 `main/docs` 發布；合併到 main 會更新網站，標籤不會建立舊版網站。

- 回報問題：[GitHub Issues](https://github.com/Hsing24/learn-git/issues/new/choose)。
- 開發與提交 PR：[貢獻指南](./CONTRIBUTING.md)。
- 安全問題：[安全回報政策](./SECURITY.md)。
- 社群互動：[行為準則](./CODE_OF_CONDUCT.md)。
- 私人聯絡：[twrandy24@gmail.com](mailto:twrandy24@gmail.com)。

[MIT License](./LICENSE) 適用於本專案原創內容。第三方字型、商標、素材及外部資源依各自授權。
