window.CURRICULUM = {
  "version": 3,
  "chapters": [
    {
      "key": "ch0",
      "title": "環境與版本庫",
      "summary": "設定提交作者，從零建立版本庫並認識 Git 快照",
      "levels": [
        {"id": "00", "slug": "setup-identity", "difficulty": "★", "defaultTab": "mission"},
        {"id": "36", "slug": "repo-init", "difficulty": "★", "defaultTab": "files"}
      ]
    },
    {
      "key": "ch1",
      "title": "單機日常循環",
      "summary": "修改、檢視、精準暫存、提交與安全復原",
      "levels": [
        {"id": "01", "slug": "first-commit", "difficulty": "★", "defaultTab": "files"},
        {"id": "37", "slug": "staged-snapshot", "difficulty": "★", "defaultTab": "files"},
        {"id": "24", "slug": "inspect-changes", "difficulty": "★", "defaultTab": "mission"},
        {"id": "12", "slug": "patch-add", "difficulty": "★★", "defaultTab": "files"},
        {"id": "41", "slug": "ignore-patterns", "difficulty": "★★", "defaultTab": "files"},
        {"id": "13", "slug": "gitignore-untrack", "difficulty": "★★", "defaultTab": "files"},
        {"id": "20", "slug": "mv-clean", "difficulty": "★★", "defaultTab": "files"},
        {"id": "08", "slug": "reflog-rescue", "difficulty": "★★", "defaultTab": "graph"},
        {"id": "25", "slug": "undo-matrix", "difficulty": "★★", "defaultTab": "files"},
        {"id": "38", "slug": "revert-commit", "difficulty": "★★", "defaultTab": "graph"},
        {"id": "18", "slug": "amend", "difficulty": "★★", "defaultTab": "graph"}
      ]
    },
    {
      "key": "ch2",
      "title": "分支與整合",
      "summary": "分支指標、合併、衝突、stash 與版本參照",
      "levels": [
        {"id": "02", "slug": "branch-ff", "difficulty": "★★", "defaultTab": "graph"},
        {"id": "26", "slug": "merge-strategies", "difficulty": "★★", "defaultTab": "graph"},
        {"id": "03", "slug": "merge-conflict", "difficulty": "★★★", "defaultTab": "files"},
        {"id": "19", "slug": "stash", "difficulty": "★★", "defaultTab": "mission"},
        {"id": "44", "slug": "revisions-ranges", "difficulty": "★★★", "defaultTab": "graph"},
        {"id": "27", "slug": "detached-head", "difficulty": "★★", "defaultTab": "graph"},
        {"id": "22", "slug": "accidental-main", "difficulty": "★★★", "defaultTab": "graph"}
      ]
    },
    {
      "key": "ch3",
      "title": "遠端協作基礎",
      "summary": "區分作者與認證，理解追蹤分支並選擇同步方式",
      "levels": [
        {"id": "40", "slug": "auth-diagnostics", "difficulty": "★★", "defaultTab": "mission"},
        {"id": "28", "slug": "clone-and-track", "difficulty": "★★", "defaultTab": "graph"},
        {"id": "21", "slug": "remote-fetch", "difficulty": "★★★", "defaultTab": "graph"},
        {"id": "39", "slug": "remote-sync", "difficulty": "★★★", "defaultTab": "graph"},
        {"id": "06", "slug": "push-rejected", "difficulty": "★★★", "defaultTab": "graph"}
      ]
    },
    {
      "key": "ch4",
      "title": "整理提交歷史",
      "summary": "變基、衝突處理、互動整理與精準移植",
      "levels": [
        {"id": "04", "slug": "rebase-linear", "difficulty": "★★★", "defaultTab": "graph"},
        {"id": "29", "slug": "rebase-conflict", "difficulty": "★★★", "defaultTab": "files"},
        {"id": "05", "slug": "interactive-rebase", "difficulty": "★★★", "defaultTab": "graph"},
        {"id": "30", "slug": "fixup-autosquash", "difficulty": "★★★", "defaultTab": "graph"},
        {"id": "07", "slug": "cherry-pick", "difficulty": "★★★", "defaultTab": "graph"}
      ]
    },
    {
      "key": "ch5",
      "title": "團隊工作流與發布",
      "summary": "更新 PR、合併後收尾、標籤、回滾與 hooks",
      "levels": [
        {"id": "31", "slug": "pr-lifecycle", "difficulty": "★★★★", "defaultTab": "graph"},
        {"id": "15", "slug": "tags-release", "difficulty": "★★", "defaultTab": "graph"},
        {"id": "14", "slug": "revert-merge", "difficulty": "★★★★", "defaultTab": "graph"},
        {"id": "11", "slug": "hooks", "difficulty": "★★★", "defaultTab": "mission"}
      ]
    },
    {
      "key": "ch6",
      "title": "歷史調查與除錯",
      "summary": "追查字串與作者，找出引入問題的提交",
      "levels": [
        {"id": "16", "slug": "archaeology", "difficulty": "★★★", "defaultTab": "mission"},
        {"id": "10", "slug": "bisect", "difficulty": "★★★★", "defaultTab": "graph"}
      ]
    },
    {
      "key": "ch7",
      "title": "進階工程",
      "summary": "平行工作區、衝突重用、分支搬移與敏感資料清除",
      "levels": [
        {"id": "09", "slug": "worktree", "difficulty": "★★★★", "defaultTab": "graph"},
        {"id": "17", "slug": "rerere", "difficulty": "★★★★", "defaultTab": "files"},
        {"id": "32", "slug": "rebase-onto", "difficulty": "★★★★★", "defaultTab": "graph"},
        {"id": "33", "slug": "secret-purge", "difficulty": "★★★★★", "defaultTab": "graph"},
        {"id": "23", "slug": "plumbing", "difficulty": "★★★★", "defaultTab": "mission"}
      ]
    }
  ],
  "optional": [
    {"id": "34", "slug": "submodule", "difficulty": "★★★★", "defaultTab": "files", "cliOnly": true},
    {"id": "35", "slug": "sparse-checkout", "difficulty": "★★★★", "defaultTab": "files", "cliOnly": true},
    {"id": "42", "slug": "attributes", "difficulty": "★★★", "defaultTab": "files", "cliOnly": true},
    {"id": "43", "slug": "split-commit", "difficulty": "★★★★", "defaultTab": "graph", "cliOnly": true},
    {"id": "45", "slug": "bisect-run", "difficulty": "★★★★", "defaultTab": "mission", "cliOnly": true},
    {"id": "46", "slug": "partial-shallow", "difficulty": "★★★★", "defaultTab": "mission", "cliOnly": true},
    {"id": "47", "slug": "git-lfs", "difficulty": "★★★★", "defaultTab": "files", "cliOnly": true},
    {"id": "48", "slug": "ssh-signing", "difficulty": "★★★★", "defaultTab": "mission", "cliOnly": true}
  ]
};
