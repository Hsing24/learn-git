window.CURRICULUM = {
  "version": 2,
  "chapters": [
    {
      "key": "ch0",
      "title": "環境就緒",
      "summary": "設定身分與連線，之後的每個 commit 都會記錄這些資訊",
      "levels": [
        { "id": "00", "slug": "setup-identity", "difficulty": "★", "defaultTab": "mission" }
      ]
    },
    {
      "key": "ch1",
      "title": "單機日常循環",
      "summary": "修改 → 檢視 → 暫存 → 提交 → 反悔",
      "levels": [
        { "id": "01", "slug": "first-commit", "difficulty": "★", "defaultTab": "files" },
        { "id": "24", "slug": "inspect-changes", "difficulty": "★", "defaultTab": "mission" },
        { "id": "13", "slug": "gitignore-untrack", "difficulty": "★★", "defaultTab": "files" },
        { "id": "20", "slug": "mv-clean", "difficulty": "★★", "defaultTab": "files" },
        { "id": "25", "slug": "undo-matrix", "difficulty": "★★", "defaultTab": "files" },
        { "id": "18", "slug": "amend", "difficulty": "★★", "defaultTab": "graph" }
      ]
    },
    {
      "key": "ch2",
      "title": "分支與整合",
      "summary": "建立、合併、衝突處理與工作區暫存",
      "levels": [
        { "id": "02", "slug": "branch-ff", "difficulty": "★★", "defaultTab": "graph" },
        { "id": "26", "slug": "merge-strategies", "difficulty": "★★", "defaultTab": "graph" },
        { "id": "03", "slug": "merge-conflict", "difficulty": "★★★", "defaultTab": "files" },
        { "id": "19", "slug": "stash", "difficulty": "★★", "defaultTab": "mission" },
        { "id": "27", "slug": "detached-head", "difficulty": "★★", "defaultTab": "graph" },
        { "id": "22", "slug": "accidental-main", "difficulty": "★★★", "defaultTab": "graph" }
      ]
    },
    {
      "key": "ch3",
      "title": "遠端協作基礎",
      "summary": "同步遠端、追蹤分支與推送防護",
      "levels": [
        { "id": "28", "slug": "clone-and-track", "difficulty": "★★", "defaultTab": "graph" },
        { "id": "21", "slug": "remote-fetch", "difficulty": "★★★", "defaultTab": "graph" },
        { "id": "06", "slug": "push-rejected", "difficulty": "★★★", "defaultTab": "graph" }
      ]
    },
    {
      "key": "ch4",
      "title": "打造乾淨歷史",
      "summary": "局部暫存、變基與修飾提交",
      "levels": [
        { "id": "12", "slug": "patch-add", "difficulty": "★★★", "defaultTab": "files" },
        { "id": "04", "slug": "rebase-linear", "difficulty": "★★★", "defaultTab": "graph" },
        { "id": "29", "slug": "rebase-conflict", "difficulty": "★★★", "defaultTab": "files" },
        { "id": "05", "slug": "interactive-rebase", "difficulty": "★★★", "defaultTab": "graph" },
        { "id": "30", "slug": "fixup-autosquash", "difficulty": "★★★", "defaultTab": "graph" },
        { "id": "07", "slug": "cherry-pick", "difficulty": "★★★", "defaultTab": "graph" }
      ]
    },
    {
      "key": "ch5",
      "title": "團隊工作流與發布",
      "summary": "PR 生命週期、標籤發布、緊急復原與鉤子防線",
      "levels": [
        { "id": "31", "slug": "pr-lifecycle", "difficulty": "★★★★", "defaultTab": "graph" },
        { "id": "15", "slug": "tags-release", "difficulty": "★★", "defaultTab": "graph" },
        { "id": "14", "slug": "revert-merge", "difficulty": "★★★★", "defaultTab": "graph" },
        { "id": "11", "slug": "hooks", "difficulty": "★★★", "defaultTab": "mission" }
      ]
    },
    {
      "key": "ch6",
      "title": "救援與除錯",
      "summary": "時光倒流、代碼考古與二分除錯",
      "levels": [
        { "id": "08", "slug": "reflog-rescue", "difficulty": "★★★", "defaultTab": "graph" },
        { "id": "16", "slug": "archaeology", "difficulty": "★★★", "defaultTab": "mission" },
        { "id": "10", "slug": "bisect", "difficulty": "★★★★", "defaultTab": "graph" }
      ]
    },
    {
      "key": "ch7",
      "title": "進階工程",
      "summary": "平行工作區、衝突記憶、進階變基與密鑰清除",
      "levels": [
        { "id": "09", "slug": "worktree", "difficulty": "★★★★", "defaultTab": "graph" },
        { "id": "17", "slug": "rerere", "difficulty": "★★★★", "defaultTab": "files" },
        { "id": "32", "slug": "rebase-onto", "difficulty": "★★★★★", "defaultTab": "graph" },
        { "id": "33", "slug": "secret-purge", "difficulty": "★★★★★", "defaultTab": "graph" },
        { "id": "23", "slug": "plumbing", "difficulty": "★★★★", "defaultTab": "mission" }
      ]
    }
  ],
  "optional": [
    { "id": "34", "slug": "submodule", "difficulty": "★★★★", "defaultTab": "files" },
    { "id": "35", "slug": "sparse-checkout", "difficulty": "★★★★", "defaultTab": "files" }
  ]
};
