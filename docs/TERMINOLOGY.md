# 專案用語規範與對照表 (Terminology & Localization Guidelines)

本專案（learn-git / git-lab）為面向開發者與學習者的 Git 教學與實作平台。本文件規範全專案的文字表達標準。

## 核心準則 (Core Principles)

1. **正體中文 / 台灣用語 (Traditional Chinese / Taiwan Locales)**
   - 全面使用繁體（正體中文），禁止使用簡體字。
   - 使用台灣開發與科技慣用語（例如：`專案` 而非 `項目`、`程式碼` 而非 `代碼`、`伺服器` 而非 `服務器`、`終端機` 而非 `終端`、`檔案` 而非 `文件`）。
2. **專業名詞與技術用語維持英文 (Technical & Git Terms in English)**
   - Git 指令、概念與專業名詞（如 `commit`, `branch`, `merge`, `rebase`, `pull request` 等）保持英文，避免過度中文化導致與實際開發工作環境脫節。
   - 一般日常動詞或修飾詞，依語境採用自然的英文名詞或動詞（如「建立新的 commit」、「切換 branch」、「執行 rebase」）。

---

## 1. Git 與版本控制專業名詞對照表 (Git & Version Control Terms)

以下專業術語在專案所有文件、說明、提示（hints）與介面 UI 中**維持英文**（大小寫視語境與指令格式決定，行內通常使用小寫 code block 或英文原文）：

| 英文術語 (規範維持英文) | 常見中文化（需替換） | 說明與用法範例 |
| :--- | :--- | :--- |
| **commit** | 提交 | 「產生一筆新的 commit」、「將變更 commit 到本地」 |
| **branch** | 分支 | 「切換到 `feature` branch」、「建立新的 branch」 |
| **merge** | 合併 | 「將 PR merge 進 main」、「執行 fast-forward merge」 |
| **rebase** | 變基、衍合 | 「使用 interactive rebase (`rebase -i`) 整理 commit」 |
| **cherry-pick** | 挑選、挑揀 | 「cherry-pick 特定的 commit 到當前 branch」 |
| **checkout** | 檢出 | 「checkout 指定的 tag 或 commit」 |
| **switch / restore** | 切換 / 還原 | 現代 Git 指令，維持原指令英文 |
| **stash** | 暫存、貯藏 | 「將未完成的工作 stash 起來」 |
| **staging area / stage** | 暫存區、索引區、快取區 | 「加入 staging area (`git add`)」、「已 stage 的檔案」 |
| **working tree / working directory** | 工作區、工作樹、工作目錄 | 「working tree 乾淨」、「未追蹤的檔案存在於 working directory」 |
| **repository / repo** | 倉庫、儲存庫、代碼庫 | 「本地 repository」、「clone 遠端 repo」 |
| **remote** | 遠端、遠程 | 「設定 remote origin」、「fetch 遠端的更新」 |
| **push** | 推送 | 「push 到 remote」、「force push」 |
| **fetch** | 抓取、拉取 | 「fetch 最新參照」 |
| **pull** | 拉取 | 「pull 等同於 fetch + merge」 |
| **pull request / PR** | 拉取請求、合併請求 (MR) | 「發起 PR」、「審查 PR」 |
| **issue** | 議題、問題單 | 「追蹤 issue」 |
| **tag** | 標籤 | 「標記 lightweight tag 或 annotated tag」 |
| **HEAD** | HEAD、指針 | 「處於 detached HEAD 狀態」 |
| **diff** | 差異、補丁差異 | 「檢視 diff」 |
| **patch** | 補丁 | 「產生 patch 檔」、「套用 patch」 |
| **hook / Git hooks** | 鉤子 | 「設定 pre-commit hook」 |
| **submodule** | 子模組、子模塊 | 「初始化 submodule」 |
| **worktree** | 工作樹、工作區 | 「新增 git worktree」 |
| **reflog** | 參照日誌 | 「透過 reflog 救回遺失的 commit」 |
| **fast-forward** | 快進 | 「fast-forward merge」 |
| **conflict** | 衝突 | 「解決 merge conflict」 |
| **squash** | 擠壓、壓扁合併 | 「squash commits」 |
| **amend** | 修訂、修補 | 「使用 `--amend` 修改前一筆 commit」 |

---

## 2. 兩岸資訊科技用語對照表 (IT & Developer Phrasing Mappings)

非 Git 專屬名詞，但屬於電腦資訊科技詞彙者，必須統一使用台灣正體用語：

| 台灣正體用語 (標準) | 中國大陸用語 / 不建議用語 | 說明 |
| :--- | :--- | :--- |
| **程式碼 / code** | 代碼 | 禁止單獨使用「代碼」，應作「程式碼」或直接寫 `code` |
| **專案** | 項目 | 軟體專案一律作「專案」 |
| **檔案** | 文件 (指 file 時) | file 為「檔案」；文檔/說明文件方可作「文件」或「文件說明」 |
| **資料夾 / 目錄** | 文件夾 | directory 譯為「目錄」，folder 譯為「資料夾」 |
| **伺服器 / 伺服端** | 服務器 / 服務端 | server 譯為「伺服器」或保持 `server` |
| **終端機** | 終端 | terminal 譯為「終端機」 |
| **預設** | 默認 | default 譯為「預設」 |
| **支援** | 支持 | support 譯為「支援」 |
| **資訊 / 訊息** | 信息 | message 譯為「訊息」，information 譯為「資訊」 |
| **儲存** | 保存 | save 譯為「儲存」 |
| **資料** | 數據 | data 譯為「資料」 |
| **資料庫** | 數據庫 | database 譯為「資料庫」 |
| **連結** | 鏈接 | link 譯為「連結」 |
| **螢幕** | 屏幕 | screen 譯為「螢幕」 |
| **選單** | 菜單 | menu 譯為「選單」 |
| **登入 / 登出** | 登錄 / 註銷 | log in / log out |
| **處理程序** | 進程 | process |
| **執行緒** | 線程 | thread |
| **記憶體** | 內存 | memory |
| **硬碟** | 硬盤 | hard drive |
| **網路** | 網絡 | network |
| **介面** | 接口 (指 UI/interface 時) | interface 視上下文譯為「介面」或 API「介面」 |
| **互動式** | 交互式 | interactive 譯為「互動式」 |
| **透過** | 通過 | via / through 譯為「透過」 |

---

## 3. 常見簡繁混淆字與錯別字檢核 (Character Check)

避免任何簡體字型或未轉換字形混入正體中文文件：

| 正體標準字 | 錯誤簡體或異體字 |
| :--- | :--- |
| **單獨** | 單独 ❌ |
| **檢查** | 检查 ❌ |
| **區分** | 区分 ❌ |
| **拼錯** | 拼错 ❌ |
| **步數** | 步数 ❌ |
| **連接** | 连结、连接 ❌ |
| **衝突** | 冲突 ❌ |
| **儲存** | 储存 ❌ |

---

## 4. 寫作風格範例 (Style Guide Examples)

### ✅ 正確示範：
- 「在 feature branch 上完成修改後，請先將變更加入 staging area，再執行 commit。」
- 「當 remote 有新的 commit 時，請先執行 fetch 或 pull，若產生 merge conflict 需手動解衝突。」
- 「使用 `git rebase -i` 可以整理尚未 push 到 remote 的 commit 紀錄。」
- 「在終端機中執行指令，並透過網頁介面確認 repository 狀態。」

### ❌ 錯誤示範：
- 「在 feature 分支上完成修改後，請先將代碼提交到暫存區。」 *(問題：使用了分支、代碼、提交、暫存區)*
- 「當遠端有新的提交時，請拉取更新，若有衝突請變基。」 *(問題：遠端、提交、拉取、變基)*
- 「該項目支持在服務器終端默認保存數據。」 *(問題：項目、支持、服務器、終端、默認、保存、數據)*
