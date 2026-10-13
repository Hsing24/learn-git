# 貢獻指南

歡迎協助修正關卡、改善教學、補充測試與文件。

## 問題回報與聯絡

- Bug、關卡規格不符、功能或教學建議：先搜尋 [GitHub Issues](https://github.com/Hsing24/learn-git/issues)，再使用[問題回報或改善提案模板](https://github.com/Hsing24/learn-git/issues/new/choose)建立 issue。
- 安全漏洞：依 [SECURITY.md](./SECURITY.md) 私下回報。
- 合作或其他私人事項：寄信至 [twrandy24@gmail.com](mailto:twrandy24@gmail.com)。

問題回報請包含關卡 ID、使用 Web 或 CLI、commit、執行環境、重現步驟、預期與實際結果。規格問題請附上 [CURRICULUM_PLAN.md](./plan/CURRICULUM_PLAN.md) 的對應章節。

## 本地開發

支援環境為 macOS、Linux 與 WSL。CLI 需要 Python 3.11+、Git 2.28+；Git 2.28 起支援本專案使用的 `git init -b`，其餘 Python 依賴皆為標準函式庫。執行 Web 引擎測試和 JavaScript 語法檢查另需 Node.js 24+。不需安裝 npm 套件；部分 hook 關卡需要 Bash。

從你的 fork 複製專案，建立工作分支。在專案根目錄啟動教學網站：

```bash
python3 -m http.server 8000 --directory docs
```

開啟 <http://localhost:8000>。CLI 的操作方式見 [README](./README.md) 與 [LAB_GUIDE](./LAB_GUIDE.md)。

## 修改關卡與引擎

- 課程順序以 `docs/curriculum.js` 為單一來源；內容需保持可由 Python 解析的 JSON 字面值。
- 保留既有關卡 ID，避免破壞使用者進度；新增關卡使用未使用的 ID。
- 新關卡需同時交付 Python CLI 情境、Web 情境、`docs/curriculum.js` manifest 項目、關卡指引與對應測試；若屬 CLI 專屬選修，需在 manifest 標示並於 Web 停用。
- 遵守課綱的舊文字保護限制。既有 `scenarios-data.js` 的 title、story、goals、hints、difficulty、category 由作者維護；04 / 05 / 06 的 setup、checkGoal 修正已獲准。其他超出規格的修改請先在 issue 說明。
- Web 測試會將 00–23 關的六個受保護欄位與 `tests/fixtures/protected-scenario-text.json` 的歷史基準比較；經核准的文案變更需在獨立提案中更新基準。
- 驗收需涵蓋初始狀態不通過、標準解法通過，以及適用的破壞性捷徑不通過；檢查提交歷史、檔案內容與 refs，避免只檢查指令是否出現。
- 介面修改遵守 [DESIGN.md](./DESIGN.md)；修改 JS 時同步更新 `docs/index.html` 的快取版本參數。

## 驗證修改

在專案根目錄執行：

```bash
python3 tests/test_all_scenarios.py
node tests/web/run_scenarios.mjs
for file in docs/*.js; do node --check "$file"; done
git diff --check
```

Python 測試會在一次性暫存專案中執行全部 36 個 CLI 關卡，並使用空白全域 Git 設定、停用系統設定與固定的測試身分；不會刪除專案內的 `workspace/`。Scenario 33 的 `git-filter-repo` 路徑需要選用工具，備援的 `filter-branch` 路徑則會固定測試。

## 提交 Pull Request

每個 PR 聚焦一個可審查的問題，說明問題、修改後行為與關聯 issue。使用 [Pull Request 範本](./.github/pull_request_template.md)，附上執行的驗證命令及結果；新增引擎指令需依課綱附 2–3 個手動案例，UI 修改附相關畫面。PR 的 Python CLI、Web 與語法檢查全部通過後才能合併。

新增素材或引用內容請註明來源與授權。專案採 [MIT License](./LICENSE)，授權範圍及第三方素材限制見 README；貢獻內容需具備可納入本專案的授權。版本標籤與變更紀錄流程見 [README](./README.md#版本變更紀錄與發布) 和 [CHANGELOG](./CHANGELOG.md)。
