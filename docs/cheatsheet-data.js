/**
 * Git Scenario Lab - Modern Git Cheatsheet Data
 * Data-driven alternatives comparison with direct links to practice levels
 */

const CHEATSHEET_DATA = [
  {
    scene: '切換分支',
    legacy: 'git checkout <branch>',
    modern: 'git switch <branch>',
    why: 'checkout 同時承擔切分支與復原檔案雙重職責；switch 專職切分支，安全明確。',
    levelId: '02'
  },
  {
    scene: '建立並切換新分支',
    legacy: 'git checkout -b <new>',
    modern: 'git switch -c <new>',
    why: '語意更直觀對稱（-c 代表 create），降低認知負擔。',
    levelId: '02'
  },
  {
    scene: '查看舊版本 / 游標分離',
    legacy: 'git checkout <commit/tag>',
    modern: 'git switch --detach <commit/tag>',
    why: '明確宣告游標脫離分支進入 Detached HEAD 狀態，避免誤以為在分支上推進。',
    levelId: '27'
  },
  {
    scene: '放棄工作區修改',
    legacy: 'git checkout -- <file>',
    modern: 'git restore <file>',
    why: 'checkout -- 語法晦澀；restore 顧名思義就是還原，直覺不易打錯。',
    levelId: '25'
  },
  {
    scene: '移出暫存區 (Unstage)',
    legacy: 'git reset HEAD <file> 或 reset --hard',
    modern: 'git restore --staged <file>',
    why: '不用搬出容易失誤誤殺工作區的 reset，restore --staged 精準安全地撤回暫存。',
    levelId: '25'
  },
  {
    scene: '變更強制推送至遠端',
    legacy: 'git push --force (或 -f)',
    modern: 'git push --force-with-lease',
    why: '若遠端已被同事推上新進度，--force 會盲目蓋掉他人代碼；--force-with-lease 能精確租約比對，只在無人覆寫時才覆蓋！',
    levelId: '31'
  },
  {
    scene: '微調修正歷史 Commit',
    legacy: '手動 rebase -i 逐行改 squash',
    modern: 'git commit --fixup + --autosquash',
    why: '自動將 fixup commit 移到目標下方自動合併，零手動編輯出錯風險。',
    levelId: '30'
  },
  {
    scene: '同檔局部暫存 (Atomic)',
    legacy: '盲目全包 git add .',
    modern: 'git add -p <file>',
    why: '依 Hunk 逐塊挑選（y/n/s），確保每個 Commit 具備單一職責，大幅提升 CR 品質。',
    levelId: '12'
  },
  {
    scene: '跨分支平行開發 (Hotfix)',
    legacy: 'git stash ➜ 切換 ➜ pop',
    modern: 'git worktree add <dir> <branch>',
    why: '實體目錄隔離，避免重編譯快取與 node_modules 失效，免除 pop 衝突風險。',
    levelId: '09'
  },
  {
    scene: '新分支首次 push',
    legacy: 'git push -u origin <branch>',
    modern: 'push.autoSetupRemote true + git push',
    why: '設定一次一勞永逸，任何新分支直接 git push，自動建立遠端同名分支。',
    levelId: '28'
  },
  {
    scene: 'pull 遠端最新程式碼',
    legacy: 'git pull（預設 merge）',
    modern: 'git pull --rebase',
    why: '避免產生雜亂無章的菱形交叉 Merge Commit，保持乾淨線性歷史。',
    levelId: '06'
  },
  {
    scene: '二分法除錯 (Bisect)',
    legacy: '手動一步步 good/bad',
    modern: 'git bisect run <test_script>',
    why: '全自動化執行測試腳本，數十秒內直接揪出第一個壞掉的 commit。',
    levelId: '10'
  },
  {
    scene: 'Git Hooks 團隊共享',
    legacy: '手動複製腳本到 .git/hooks/',
    modern: 'git config core.hooksPath .githooks',
    why: '.git/hooks 不受版本控制；core.hooksPath 讓全團隊自動共享守門員防線。',
    levelId: '11'
  },
  {
    scene: '停止追蹤機密檔案',
    legacy: '刪除本地實體檔案再加 ignore',
    modern: 'git rm --cached <file>',
    why: '只從 Git 索引除名，完整保全本地環境變數 (.env) 與開發資料。',
    levelId: '13'
  },
  {
    scene: '線上 revert Merge PR',
    legacy: '危險覆蓋主線的 force push',
    modern: 'git revert -m 1 <hash>',
    why: '向前推進產生 revert commit，清楚保留審計歷史，不破壞團隊他人進度。',
    levelId: '14'
  },
  {
    scene: '重用衝突解法 (Rebase)',
    legacy: '每次 rebase 手動解 10 次',
    modern: 'git config rerere.enabled true',
    why: 'Git 自動記憶衝突解決方案，後續相同衝突區塊 0 秒全自動填入！',
    levelId: '17'
  },
  {
    scene: '精確程式碼考古',
    legacy: '大海撈針盲翻 commit 訊息',
    modern: 'git log -S "<字串>" --oneline',
    why: '鶴嘴鎬 (Pickaxe) 精準鎖定增減該字串次數的 commit，比文字搜尋精準百倍。',
    levelId: '16'
  }
];

if (typeof window !== 'undefined') {
  window.CHEATSHEET_DATA = CHEATSHEET_DATA;
}
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { CHEATSHEET_DATA };
}
