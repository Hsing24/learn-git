# PR 平台實作：建立、Review、CI 與合併

這份選修練習補足第 31 關的本機更新與合併後收尾。PR、review、CI 狀態與權限是託管平台功能；Web 模擬器與 CLI 沙盒不會替你建立真實 PR，也不會冒充已驗證的平台成果。

使用自己的 GitHub 練習 repository；公開專案先 fork，請不要把練習 PR 送到無關的正式專案。可邀請已同意參與的同伴 review，或用自己的練習帳號檢視 diff；自己不能滿足某些要求他人批准的保護規則。

## 建立 PR

1. Clone 自己的練習 repository，確認 origin URL。
2. 建立 feature 分支，完成一筆小而可測試的修改，檢視 `git diff --staged` 後提交並 push -u。
3. 在 GitHub 建立 PR，確認 base／head repository 和分支。
4. 寫明問題、改動後行為、驗證方式；在 Files changed 自行審查內容。

## 回應 Review 與 CI

1. 配置與專案相符的測試 workflow，確認 Pull Request 事件能觸發；CI 不會因開 PR 就憑空存在。
2. 查看 Checks 的失敗日誌，修復問題並建立提交，再 push 到同一個 PR 分支。
3. 回應 review 意見，確認討論已解決；若改寫原提交，先檢查影響並協調，再依第 31 關使用 lease。
4. 更新主線後確認測試仍通過，檢查 repository 的 required checks、review 與分支保護限制。

## 選擇合併方式與收尾

Merge commit 保留分支提交及整合節點；Squash and merge 合成一筆；Rebase and merge 保留各筆變更但重寫成線性提交。選擇符合團隊政策及提交品質的方式，不要求所有團隊固定使用 rebase。

平台合併後刪除遠端功能分支。在本機切回 main，`git pull --ff-only` 同步，確認內容與 tests，再刪除本機分支並 `git fetch --prune`。Squash／rebase 合併後本機 -d 可能不認為原分支已合併；先比較內容，再決定是否 -D，避免直接丟棄未整合工作。

## 自行驗收

- PR 的 base／head 正確，描述讓別人能理解與驗證改動。
- Review 意見與 CI 失敗已處理；要求的檢查及批准確實符合 repository 政策。
- 合併後 main 包含功能；本機與遠端進度同步，分支已清理。
- 能解釋採用的合併方式如何影響提交歷史。

[GitHub 官方 PR 文件](https://docs.github.com/en/pull-requests)、[PR 合併方式](https://docs.github.com/en/pull-requests/reference/pull-request-merges)。
