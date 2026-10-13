## 問題與修改後行為

說明要解決的問題，以及使用者會看到或完成的行為。

## 關聯 Issue 與規格

Closes #

- 課綱章節或文件依據：

## 修改內容

-

## 驗證

列出執行的命令與結果；若未執行，說明原因。

- [ ] `python3 tests/test_all_scenarios.py`
- [ ] `node tests/web/run_scenarios.mjs`
- [ ] `for file in docs/*.js; do node --check "$file"; done`
- [ ] `git diff --check`

新增 Git 引擎指令時，附上 2–3 個手動案例，涵蓋初始失敗、標準解法及適用的破壞性捷徑。

UI 修改請附上相關畫面，並說明檢查過的視窗尺寸。

## 關卡修改檢查

新增或修改關卡時填寫：

- [ ] Python CLI 情境與驗收
- [ ] Web 情境與驗收
- [ ] `docs/curriculum.js` manifest、關卡指引與受保護文字檢查
- [ ] CLI 專屬選修已在 Web 標示並停用（若適用）

## 素材與授權

列出新增的第三方素材、來源與授權；若沒有，填「無」。
