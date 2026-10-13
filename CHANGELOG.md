# 變更紀錄

記錄對使用者有影響的變更。尚未發布的內容放在 `Unreleased`；發布時將對應項目移至版本標題，並附上發布日期。

## Unreleased

### Added

- 加入 Python CLI、Web 情境與 JavaScript 語法的 GitHub Actions 驗證。
- 加入 Pull Request 範本、社群行為準則與版本發布流程。

### Fixed

- 修正 CLI bisect 驗收流程，改用 `git bisect run` 找出第一個錯誤提交，避免依賴 Git 訊息文字。
