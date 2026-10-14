# Agent Operational Guidelines (AGENTS.md)

本檔案為 AI Agent、協作者與開發工具在本專案（learn-git / git-lab）中運作時必須嚴格遵守的語言與術語標準。

## 語言與用語準則 (Language & Terminology Policy)

1. **正體中文（台灣繁體，zh-TW）**
   - 所有繁體中文文本必須符合台灣用語習慣。
   - 嚴格禁止使用簡體中文（如：`检`, `错`, `独`, `区`, `数` 等皆須修正為 `檢`, `錯`, `獨`, `區`, `數`）。
   - 禁止使用中國大陸 IT 用語：
     - 代碼 ➔ **程式碼** / **code**
     - 項目 ➔ **專案**
     - 服務器 / 服務端 ➔ **伺服器** / **伺服端** / **server**
     - 終端 ➔ **終端機**
     - 默認 ➔ **預設**
     - 支持 ➔ **支援**
     - 數據 ➔ **資料**
     - 數據庫 ➔ **資料庫**
     - 保存 ➔ **儲存**
     - 文件 (file) ➔ **檔案**
     - 網絡 ➔ **網路**
     - 鏈接 ➔ **連結**

2. **專業名詞與技術用語維持英文 (Technical & Git Terms in English)**
   - 版本控制與 Git 領域之專業術語**禁止中文化**，一律維持英文原文（如行內格式或代碼風格）：
     - commit（禁止寫成「提交」）
     - branch（禁止寫成「分支」）
     - merge（禁止寫成「合併」）
     - rebase（禁止寫成「變基」、「衍合」）
     - cherry-pick（禁止寫成「挑選」、「挑揀」）
     - staging area / stage（禁止寫成「暫存區」、「暫存」）
     - stash（禁止寫成「貯藏」；指 `git stash` 操作時一律稱 stash）
     - repository / repo（禁止寫成「倉庫」或「儲存庫」）
     - remote（禁止寫成「遠端」、「遠程」）
     - push（禁止寫成「推送」）
     - fetch / pull（禁止寫成「拉取」）
     - pull request / PR（禁止寫成「拉取請求」）
     - tag（禁止寫成「標籤」）
     - checkout / switch / restore
     - diff, HEAD, conflict, submodule, worktree, hook

3. **規範與對照表參照**
   - 詳細名詞與字詞對照請參閱 [`docs/TERMINOLOGY.md`](docs/TERMINOLOGY.md)。
   - 在產生或修改 Markdown 文件、Web 前端腳本（`docs/*.js`、`docs/index.html`）、CLI 工具（`git-lab`）或 Python 關卡腳本（`lab/**/*.py`）時，皆須主動檢查並遵循本標準。
