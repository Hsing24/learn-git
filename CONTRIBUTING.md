# 貢獻指南

歡迎協助修正關卡、改善教學、補充測試與文件。

## 問題回報與聯絡

- Bug、關卡規格不符、功能或教學建議：先搜尋 [GitHub Issues](https://github.com/Hsing24/learn-git/issues)，再使用[問題回報或改善提案模板](https://github.com/Hsing24/learn-git/issues/new/choose)建立 issue。
- 安全漏洞：依 [SECURITY.md](./SECURITY.md) 私下回報。
- 合作或其他私人事項：寄信至 [twrandy24@gmail.com](mailto:twrandy24@gmail.com)。

問題回報請包含關卡 ID、使用 Web 或 CLI、commit、執行環境、重現步驟、預期與實際結果。規格問題請附上 [CURRICULUM_PLAN.md](./plan/CURRICULUM_PLAN.md) 的對應章節。

## 本地開發

支援環境為 macOS、Linux 與 WSL。CLI 需要 Python 3.11+、Git 2.28+；Git 2.28 起支援本專案使用的 `git init -b`，其餘 Python 依賴皆為標準函式庫。執行 Web 引擎測試和 JavaScript 語法檢查另需 Node.js 24+；瀏覽器驗收需透過 npm 安裝 Playwright。部分 hook 關卡需要 Bash。

從你的 fork 複製專案，建立工作分支。在專案根目錄啟動教學網站：

```bash
python3 -m http.server 8000 --directory docs
```

開啟 <http://localhost:8000>。CLI 的操作方式見 [README](./README.md) 與 [LAB_GUIDE](./LAB_GUIDE.md)。

## 修改關卡與引擎

- 課程順序以 `docs/curriculum.js` 為單一來源；內容需保持可由 Python 解析的 JSON 字面值。
- 保留既有關卡 ID，避免破壞使用者進度；新增關卡使用未使用的 ID。
- 新關卡需同時交付 Python CLI 情境、Web 情境、`docs/curriculum.js` manifest 項目、關卡指引與對應測試；若屬 CLI 專屬選修，需在 manifest 標示並於 Web 停用。
- 教學文案與任務應符合實際練習及驗收。本次課綱 v3 已依作者授權更新 00–23 關的受保護文案；後續變更同步說明教學目的並更新基準，避免無意的文案漂移。
- Web 測試將 00–23 關的六個教學欄位與 `tests/fixtures/protected-scenario-text.json` 的授權基準比較。新增 Web 核心關卡可放在 `scenarios-foundations.js`／`command-guides-foundations.js`，並更新載入順序與一致性測試。
- 驗收需涵蓋初始狀態不通過、標準解法通過，以及適用的破壞性捷徑不通過；檢查提交歷史、檔案內容與 refs，避免只檢查指令是否出現。
- 介面修改遵守 [DESIGN.md](./DESIGN.md)；修改 JS 時同步更新 `docs/index.html` 的快取版本參數。

## 驗證修改

在專案根目錄執行：

```bash
python3 tests/test_all_scenarios.py
node tests/web/run_scenarios.mjs
npm ci
npx playwright install chromium
npm run test:browser
for file in docs/*.js tests/web/*.js tests/web/*.mjs playwright.config.mjs; do node --check "$file"; done
git diff --check
```

Python 測試會在一次性暫存專案中執行全部 49 個 CLI 關卡，並使用空白全域 Git 設定、停用系統設定與固定的測試身分；不會刪除專案內的 `workspace/`。Scenario 33 的 `git-filter-repo` 路徑需要選用工具，備援的 `filter-branch` 路徑則會固定測試。完整驗收另需 `git-lfs`、`git-filter-repo` 與支援 SSH signing 的 Git／`ssh-keygen`；`python3 tests/run_cli_ci.py` 將任何略過的測試視為失敗。

Playwright 會自動啟動本機靜態伺服器，以桌面與手機尺寸跑 10 個實際介面關卡流程、終端機鍵盤輸入及版面檢查；本地 JS／CSS 載入失敗或未處理的 JavaScript 錯誤會使測試失敗。Linux 需先執行 `npx playwright install --with-deps chromium` 安裝瀏覽器系統依賴。可設定 `PLAYWRIGHT_BASE_URL=https://hsing24.github.io/learn-git/`，使用相同測試驗證已部署網站。

## CI 與網站部署

[CI workflow](./.github/workflows/ci.yml) 在 PR、推送任一分支或手動執行時驗證：安裝選修工具並跑完整 CLI 驗收、JavaScript 語法、Web 引擎及桌面／手機瀏覽器驗收。保留 `Python CLI acceptance` 與 `Web syntax and scenarios` 的必要檢查名稱；瀏覽器失敗時上傳 trace 與截圖。main 有必要檢查保護，直接推送前需先在工作分支讓同一份 commit 通過 CI。

Pages 使用 GitHub Actions 發布，只有 main 的所有測試通過後才上傳並部署 `docs/`。PR 只驗證；需要重新部署時可在 Actions 手動執行 CI，選擇 main。GitHub 的 Settings → Pages → Source 應設為 GitHub Actions。

## 提交 Pull Request

每個 PR 聚焦一個可審查的問題，說明問題、修改後行為與關聯 issue。使用 [Pull Request 範本](./.github/pull_request_template.md)，附上執行的驗證命令及結果；新增引擎指令需依課綱附 2–3 個手動案例，UI 修改附相關畫面。PR 的 Python CLI、Web 與語法檢查全部通過後才能合併。

新增素材或引用內容請註明來源與授權。專案採 [MIT License](./LICENSE)，授權範圍及第三方素材限制見 README；貢獻內容需具備可納入本專案的授權。版本標籤與變更紀錄流程見 [README](./README.md#版本變更紀錄與發布) 和 [CHANGELOG](./CHANGELOG.md)。
