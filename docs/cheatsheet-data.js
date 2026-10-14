/** Git command choices with direct practice links. */
const CHEATSHEET_DATA = [
  {
    "scene": "切換分支",
    "legacy": "git checkout <branch>",
    "modern": "git switch <branch>",
    "why": "checkout 同時承擔切分支與復原檔案雙重職責；switch 專職切分支，安全明確。",
    "levelId": "02"
  },
  {
    "scene": "建立並切換新分支",
    "legacy": "git checkout -b <new>",
    "modern": "git switch -c <new>",
    "why": "語意更直觀對稱（-c 代表 create），降低認知負擔。",
    "levelId": "02"
  },
  {
    "scene": "查看舊版本 / 游標分離",
    "legacy": "git checkout <commit/tag>",
    "modern": "git switch --detach <commit/tag>",
    "why": "明確宣告游標脫離分支進入 Detached HEAD 狀態，避免誤以為在分支上推進。",
    "levelId": "27"
  },
  {
    "scene": "放棄工作區修改",
    "legacy": "git checkout -- <file>",
    "modern": "git restore <file>",
    "why": "restore 預設從索引還原工作區；--staged 從 HEAD 還原索引。先確認要改動的層級。",
    "levelId": "25"
  },
  {
    "scene": "移出暫存區 (Unstage)",
    "legacy": "git reset HEAD <file>",
    "modern": "git restore --staged <file>",
    "why": "restore 預設從索引還原工作區；--staged 從 HEAD 還原索引。先確認要改動的層級。",
    "levelId": "25"
  },
  {
    "scene": "變更強制推送至遠端",
    "legacy": "git push --force (或 -f)",
    "modern": "git push --force-with-lease",
    "why": "比對預期遠端 tip 後更新；背景 fetch 可能改變隱含 lease，必要時指定 expected OID。",
    "levelId": "31"
  },
  {
    "scene": "微調修正歷史 Commit",
    "legacy": "手動 rebase -i 逐行改 squash",
    "modern": "git commit --fixup + --autosquash",
    "why": "fixup 標註修補對象，autosquash 依標記重排融合；改寫後仍須檢查內容與測試。",
    "levelId": "30"
  },
  {
    "scene": "同檔局部暫存 (Atomic)",
    "legacy": "盲目全包 git add .",
    "modern": "git add -p <file>",
    "why": "依區塊挑選變更，提交前以 diff --staged 檢查，讓提交有明確目的。",
    "levelId": "12"
  },
  {
    "scene": "跨分支平行開發 (Hotfix)",
    "legacy": "git stash ➜ 切換 ➜ pop",
    "modern": "git worktree add <dir> <branch>",
    "why": "worktree 使用獨立目錄保存並行工作；每個目錄的依賴、環境與建置仍需自行管理。",
    "levelId": "09"
  },
  {
    "scene": "新分支首次 push",
    "legacy": "git push -u origin <branch>",
    "modern": "push.autoSetupRemote true + git push",
    "why": "適用預設推送模式時，在首次手動 push 建立追蹤關係；不是自動推送。",
    "levelId": "28"
  },
  {
    "scene": "pull 遠端最新程式碼",
    "legacy": "git pull（預設 merge）",
    "modern": "git pull --rebase",
    "why": "在可改寫的本機提交上使用 rebase；需要保留整合歷史則選 merge，僅允許快進則用 --ff-only。",
    "levelId": "06"
  },
  {
    "scene": "二分法除錯 (Bisect)",
    "legacy": "手動一步步 good/bad",
    "modern": "git bisect run <test_script>",
    "why": "可重現的測試腳本自動標記好壞版本；先檢查工具與退出碼，完成後 reset。",
    "levelId": "10"
  },
  {
    "scene": "Git Hooks 團隊共享",
    "legacy": "手動複製腳本到 .git/hooks/",
    "modern": "git config core.hooksPath .githooks",
    "why": "版本控制共享腳本；每個 clone 仍須設定 hooksPath／安裝並確認執行權限。",
    "levelId": "11"
  },
  {
    "scene": "停止追蹤機密檔案",
    "legacy": "刪除本地實體檔案再加 ignore",
    "modern": "git rm --cached <file>",
    "why": "停止追蹤並保留本機檔案；舊歷史仍有內容，外洩憑證須另外撤銷輪替。",
    "levelId": "13"
  },
  {
    "scene": "線上 revert Merge PR",
    "legacy": "危險覆蓋主線的 force push",
    "modern": "git revert -m 1 <hash>",
    "why": "依 merge 父提交選擇 mainline，新增反向提交並保留歷史。",
    "levelId": "14"
  },
  {
    "scene": "重用衝突解法 (Rebase)",
    "legacy": "每次 rebase 手動解 10 次",
    "modern": "git config rerere.enabled true",
    "why": "記錄正確解法後可重用匹配的衝突；重用後仍須檢查與暫存。",
    "levelId": "17"
  },
  {
    "scene": "精確程式碼考古",
    "legacy": "大海撈針盲翻 commit 訊息",
    "modern": "git log -S \"<字串>\" --oneline",
    "why": "-S 查字串次數增減；-G 查 patch 行匹配；以結果縮小調查範圍。",
    "levelId": "16"
  },
  {
    "scene": "撤銷共享普通提交",
    "legacy": "確認修改範圍與是否已共享",
    "modern": "git revert <commit>",
    "why": "新增反向提交，保留後續更新與原始共享歷史。",
    "levelId": "38"
  },
  {
    "scene": "只允許快進更新",
    "legacy": "先觀察追蹤分支與分歧",
    "modern": "git pull --ff-only",
    "why": "有分歧時停止，讓你明確決定整合方式。",
    "levelId": "39"
  },
  {
    "scene": "確認 ignore 規則",
    "legacy": "檢查目錄、glob 與例外範圍",
    "modern": "git check-ignore -v <path>",
    "why": "顯示命中的規則；不能直接重新納入被忽略父目錄內的子檔案。",
    "levelId": "41"
  }
];
if (typeof window !== 'undefined') window.CHEATSHEET_DATA = CHEATSHEET_DATA;
if (typeof module !== 'undefined' && module.exports) module.exports = { CHEATSHEET_DATA };
