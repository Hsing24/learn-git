# Git Scenario Lab：練習與判斷指南

課程涵蓋 49 關：41 個 Web／CLI 核心關卡與 8 個 CLI 選修。關卡 ID 用來保存進度，學習順序以 `docs/curriculum.js` 的章節排列為準。

## 先建立正確的模型

Git 保存檔案的快照及快照之間的關係。工作區是你正在編輯的內容；index（暫存區）是下一筆提交的候選快照；commit 將該快照及作者、時間、父提交、訊息保存為物件。分支是指向提交的參照，HEAD 通常指向目前分支。

`git add` 複製當下內容到 index。add 後再修改檔案，index 與工作區會不同；commit 保存 index，因此仍可能留下未暫存修改。`git commit -a` 只處理已追蹤檔案，不會加入新檔案。

commit 是本機操作，不需要網路，也不等於 push。作者姓名與信箱不授予遠端存取權；SSH／HTTPS 認證及 repository 權限是另外兩層問題。

第 36 關從尚未初始化的目錄開始；第 37 關實際提交暫存後的舊內容，讓較新的修改留在工作區。第 12 關提前練習原子提交，避免把無關修改包成一筆。

## Web 操作

- 在檔案總管選擇檔案、按「編輯檔案」，完成後「儲存至工作區」。保存不會自動 add 或 commit。
- 解決衝突時自行決定保留內容並移除標記，儲存後 add。Merge 使用 commit；rebase 使用 rebase --continue；cherry-pick 使用 cherry-pick --continue。
- `git add -p <file>` 顯示真實內容差異區塊；輸入 y 暫存、n 略過、q 結束。Web 支援逐區塊選擇，CLI 另可使用 s／e 拆分或編輯 patch。
- `echo -e "第一行\n第二行" > file`、`cat file`、`touch file`、`rm file` 可操作虛擬工作區。引號外的 `&&` 會依序執行，前一個操作失敗就停止。
- `git worktree add -b hotfix ../hotfix main` 後使用 `cd ../hotfix`。該目錄有獨立 HEAD、index、工作區；`cd ..` 返回原目錄。提交共用物件資料庫，但未提交內容不共用。

Web 是教學模擬器，支援的指令見 help。它不執行任意 shell、測試程式、SSH 或真實 GitHub 操作。CLI 選修不會被算入 Web 完成進度。

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

## 復原前先選擇要改動哪一層

| 意圖 | 操作 | 結果 |
| :--- | :--- | :--- |
| 捨棄未暫存的檔案修改 | `git restore <file>` | 預設由 index 還原工作區。 |
| 取消暫存 | `git restore --staged <file>` | 預設由 HEAD 還原 index，工作區保留。 |
| 從歷史取回單一檔案 | `git restore --source=<commit> <file>` | 指定來源快照，修改工作區，不移動分支。 |
| 撤銷本機提交、保留 index | `git reset --soft <commit>` | 移動目前分支，index 和工作區保持原樣。 |
| 撤銷本機提交、重新選擇內容 | `git reset --mixed <commit>` | 移動分支、重設 index，工作區保留。mixed 是預設。 |
| 捨棄追蹤檔案修改並回到快照 | `git reset --hard <commit>` | 分支、index、追蹤檔案工作區同步到目標；會失去未保存修改，阻擋檢出的未追蹤路徑也可能被刪除。 |
| 反轉已共享的提交 | `git revert <commit>` | 新增反向提交，保留原歷史。 |

第 25 關包含三種 reset 的獨立實作。第 38 關先練一般 revert，第 14 關再練 merge revert。`git revert -m 1 <merge>` 選擇第一親代為主線，並不是所有 merge 都應盲目選 1；先查看父提交。再次合併已 revert 的功能時，是否 re-revert 取決於修正方式與分支歷史。

Reflog 記錄本機參照移動；它不是遠端備份，也不保存每次未提交編輯。誤移動分支時先用 reflog 找到提交，再建立救援分支。一般記錄及不可達記錄有不同過期設定，物件也可能被 GC 清理，不能宣稱永久可救回。

未追蹤檔案也可能是重要新程式碼。第 20 關先 `git clean -nd` 查看名單再 `git clean -fd`；預設不刪除 ignore 檔案，`-x` 範圍更大。未保存的檔案不能靠 reflog 保證恢復。

## 遠端同步不是單一固定答案

`main` 是本地分支；`origin/main` 是本機對遠端進度的追蹤參照；遠端真正的 main 則在伺服器上。Fetch 更新物件與追蹤資訊，不會自動把變更合進目前工作區。Ahead／behind 是相對本機已知的追蹤進度，不保證伺服器此刻仍相同。

| 同步方式 | 適用判斷 |
| :--- | :--- |
| `git pull --ff-only` | 只允許指標向前；分歧時拒絕，讓你先檢查。 |
| `git pull --no-rebase` | 需要保留雙方提交及明確整合節點。 |
| `git pull --rebase` | 重放自己可以改寫的提交，遵守團隊歷史政策。 |

第 39 關比較整合結果，第 06 關要求用 rebase 處理尚未共享的本機提交。Rebase 會改變提交 ID，不能一概當成較新的 merge 替代品。改寫已推送的個人 PR 分支時也須協調依賴該歷史的成員；共享 main 通常透過 revert 向前修正。

`push.autoSetupRemote` 在適用的預設推送模式下，於首次手動 push 自動設定 upstream。它不會自動推送，也不免除需要正確 remote、認證及權限的條件。

## 認證與權限排查

第 40 關使用本機案例，區分作者資訊、連線認證及存取權，不會實際連線到託管平台。進入自己的平台沙盒時，可依以下方式設定：

1. 以 `git config --list --show-origin` 查看設定來源；公司與私人專案可採不同 local 作者或 includeIf。作者 email 與平台貢獻關聯需符合平台規則。
2. 使用 `git remote -v` 確認 HTTPS 或 SSH URL。遠端名稱 upstream 與分支的 upstream tracking 是不同概念。
3. SSH 先檢查是否已有適用金鑰，避免覆蓋。新金鑰可用 `ssh-keygen -t ed25519 -C "you@example.com"`，設定 passphrase，再透過 ssh-agent 管理。只上傳 `.pub` 公鑰；私鑰留在本機。
4. 在 GitHub 帳號設定加入公鑰，再執行 `ssh -T git@github.com` 驗證，初次連線先核對平台公開的 host fingerprint。
5. HTTPS 使用平台核發、權限適當的 token 與系統安全儲存／Git Credential Manager；credential.helper 用於 HTTPS，ssh-agent 用於 SSH。不要把 token 寫進 remote URL。
6. `Permission denied (publickey)` 先查金鑰選擇及認證；認證成功但 push 被拒，則查 repository 權限、組織政策或受保護分支。改 user.email 不會修復這些錯誤。

## 歷史整理與衝突

Interactive rebase 的 todo 由舊到新排列。Squash 合併變更與訊息；fixup 合併變更並捨棄修補訊息；reword 改訊息。Amend 只修補最後一筆，不會單獨合併之前的多筆提交。第 43 關在真實 Git 用 edit 暫停、mixed reset、分次 add／commit，並用 range-diff 檢查提交序列的差異。

Rebase 衝突中 ours 是目前已重放完成的新基底，theirs 是正在套用的提交；不能套用一般 merge 的分支直覺。`--abort` 回到操作前；`--skip` 捨棄目前提交的變更，只有明確可丟棄或已整合的提交才適合略過。第 29 關有獨立 skip 練習，主要功能提交仍須完整保留。

Rerere 需要第一次記錄衝突與正確解法，再遇到可匹配的衝突才能重用。重用不代表語意正確；預設還要檢查並 add，不是任何相似衝突都能自動解決。錯誤解法可用 `git rerere forget <path>`。

Stash 預設只含追蹤檔案，`-u` 加未追蹤檔案；`apply` 保留 stash，`pop` 成功後才刪除。Pop 衝突時紀錄留著，解決後自行確認再 drop。`apply --index` 嘗試恢復 index 狀態，也可能失敗；stash 沒有通用的 `--abort`，需依工作區與保存內容處理。

## 參照與範圍

`HEAD~2` 沿第一親代走兩步；`HEAD^2` 是第二親代，兩者在 merge 上不同。對 log，`A..B` 選 B 可達、A 不可達的提交，`A...B` 選雙方的對稱差；對 diff，`A..B` 比較兩端快照，`A...B` 比較共同祖先至 B。第 44 關練習辨識這些差異。

`log -S` 找指定字串出現次數改變的提交；`-G` 找 diff 中新增／移除行匹配正則的提交。Blame 指向每行最後相關修改，搭配 -w 排除空白變動，用來理解設計背景。

## Hooks、標籤與 PR

Hooks 是本機腳本，可被繞過，不能取代 CI、伺服器政策與專門的秘密掃描。第 11 關要求攔截後修正，再正常提交。`--no-verify` 放在限制說明，不是帶著敏感資料完成任務的捷徑。

把 `.githooks` 納入版本控制只會共享腳本；每個 clone 仍須設定 core.hooksPath、確認執行權限或執行可信的安裝程序。範例敏感詞掃描有誤報與漏報，並非完整資安檢查。

附註標籤包含 tagger 與訊息，不等於密碼學簽章。SemVer 的 major／minor／patch 應依公開介面的相容性判斷，Git 不強制版號格式。推送標籤只同步 refs；Release、CI 建置與部署都需要另外配置。第 48 關使用 SSH 簽章並設定信任清單，練習簽署與驗證 commit／tag。

GitHub 的 PR 合併方式是 Merge commit、Squash and merge、Rebase and merge。第 26 關練本機 no-ff／squash，不能把 Fast-forward 當作 GitHub 的第三個按鈕。完整平台流程見 [PR 平台實作](./docs/PR_PLATFORM_GUIDE.md)。

第 31 關更新已推送的 PR 分支。`--force-with-lease` 比對預期的遠端 tip；未指定預期 OID 時通常依本機追蹤參照，背景 fetch 可能更新它。因此先確認整合範圍，必要時使用 `--force-with-lease=refs/heads/<branch>:<expected-oid>`。它不判斷程式邏輯或團隊授權。

## 進階工具的範圍

- **Submodule**：父專案記錄 gitlink 指向的提交，不跟著子模組分支自動前進。Clone 後需 `git submodule update --init --recursive`；更新版本後在父專案提交新參照。子模組若有新提交，先推子倉庫再推父專案。
- **Sparse checkout**：縮減工作區檢出的檔案。Cone 模式還包含選取目錄祖先層級的檔案，因此不保證只剩單一目錄。
- **Partial clone**：使用 filter 按需下載部分物件，需要伺服器支援。Shallow clone 則縮減歷史深度，可能影響 merge-base、blame、bisect 等操作；需要時 deepen／unshallow。
- **Git LFS**：Git 歷史保存指標，大型內容由另一套物件儲存管理。Collaborator 與 CI 也需要 LFS，服務容量及政策另行確認；加入 LFS 不會自動搬移既有歷史。
- **Bisect run**：測試須能客觀重現問題。0 表示 good，1–127 中除 125 外通常表示 bad，125 表示 skip。126／127 常是工具無法執行或不存在；應先檢查測試可執行，Git 也可能偵測這類錯誤而停止搜尋。完成後 reset。
- **物件資料庫**：blob 保存內容、tree 保存路徑與物件關係、commit 保存 tree 與父提交、tag 保存標籤中繼資料。`cat-file` 是查看物件，不是解密。課程預設 SHA-1；支援的 Git 亦可建立 SHA-256 repository，不要假設所有物件 ID 都固定 40 位。

## 敏感資料清除

先撤銷並輪替憑證，再處理歷史。第 13 關 rm --cached 只停止追蹤，舊提交仍有資料。第 33 關在沙盒清理全量 refs、確認無引用備份並以明確租約推送，同時保留其他功能內容。

真實專案優先使用 git-filter-repo；官方不推薦 filter-branch 作一般方案。協調團隊停止使用舊 clone，避免舊 refs 再引入資料。託管平台可能仍保留 PR refs、快取與其他副本，需要依平台敏感資料移除流程申請清理。

## 官方參考

- [Git 命令文件](https://git-scm.com/docs)、[Pro Git](https://git-scm.com/book/en/v2)
- [Restore](https://git-scm.com/docs/git-restore)、[Push lease](https://git-scm.com/docs/git-push)、[Reflog](https://git-scm.com/docs/git-reflog)
- [GitHub PR 合併方式](https://docs.github.com/en/pull-requests/reference/pull-request-merges)
- [Sparse checkout](https://git-scm.com/docs/git-sparse-checkout)、[Clone](https://git-scm.com/docs/git-clone)、[Git LFS](https://git-lfs.com/)
