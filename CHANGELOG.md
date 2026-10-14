# 變更紀錄

記錄對使用者有影響的變更。尚未發布的內容放在 `Unreleased`；發布時將對應項目移至版本標題，並附上發布日期。

## Unreleased

### Added

- 課綱擴充為 49 關：41 個 Web／CLI 核心關卡與 8 個 CLI 選修，補上暫存快照、一般 revert、同步方式、認證診斷、ignore 規則、版本範圍及工程工具。
- Web 增加手動檔案編輯、逐區塊暫存、獨立 worktree 目錄與明確 PR 模擬合併。
- 加入完整 PR 平台選修指南、跨平台換行、拆分提交、bisect run、partial／shallow clone、LFS 與 SSH 簽章練習。

- 加入 Python CLI、Web 情境與 JavaScript 語法的 GitHub Actions 驗證。
- 加入 Pull Request 範本、社群行為準則與版本發布流程。

### Fixed

- 修正關卡名稱與內容落差，調整課程前置順序，統一 Web、CLI 與文件的名稱。
- Hooks 主線要求修正敏感資料後正常提交；修正 sparse-checkout、restore、reflog、GitHub 合併方式與租約推送的說明。
- 驗收檢查提交內容、拓撲與完成狀態，阻止只建立分支、只啟用設定或只標記搜尋範圍就通關。

- 修正 CLI bisect 驗收流程，改用 `git bisect run` 找出第一個錯誤提交，避免依賴 Git 訊息文字。
