/**
 * SCENARIOS_EXTRA - 新增關卡 24-35 定義庫
 * 擴充至全域 SCENARIOS 陣列
 */

const SCENARIOS_EXTRA = [
  {
    id: '24',
    title: '看懂變更：status / diff / log / show',
    difficulty: '入門 ⭐',
    category: '單機日常循環',
    story: '你剛接手同事未完成的半成品，工作區有些改動、暫存區有些檔案，還有未追蹤的備忘錄。在急著寫新代碼前，請先看懂當前變更與版本歷史！',
    goals: [
      '使用 git status -s 觀察簡短狀態與雙欄標記',
      '使用 git diff 檢視工作區未暫存的修改',
      '使用 git diff --staged 檢視已暫存待提交的修改',
      '使用 git log --oneline --graph 檢視提交歷史',
      '使用 git show HEAD~1 檢視前一個提交的詳細改動'
    ],
    hints: [
      '先後執行 git status -s、git diff 與 git diff --staged',
      '執行 git log --oneline --graph 查看拓撲',
      '執行 git show HEAD~1 體會 HEAD 相對參照'
    ],
    setup: (git) => {
      const c1 = git.createCommit({ message: 'feat: project init', tree: new Map([['app.js', 'console.log("init");\n'], ['utils.js', 'function add(a, b) { return a + b; }\n']]) });
      const c2 = git.createCommit({ message: 'feat: add multiply helper', parents: [c1.id], tree: new Map([['app.js', 'console.log("init");\n'], ['utils.js', 'function add(a, b) { return a + b; }\nfunction multiply(a, b) { return a * b; }\n']]) });
      const c3 = git.createCommit({ message: 'feat: update app main logic', parents: [c2.id], tree: new Map([['app.js', 'console.log("ready");\n'], ['utils.js', 'function add(a, b) { return a + b; }\nfunction multiply(a, b) { return a * b; }\n']]) });

      git.branches.set('main', c3.id);
      git.HEAD = { type: 'branch', target: 'main' };

      // Working tree and index modifications
      git.workingTree = new Map(c3.tree);
      git.index = new Map(c3.tree);

      // Staged change to utils.js
      const stagedUtils = 'function add(a, b) { return a + b; }\nfunction multiply(a, b) { return a * b; }\nfunction subtract(a, b) { return a - b; }\n';
      git.index.set('utils.js', stagedUtils);
      git.workingTree.set('utils.js', stagedUtils);

      // Unstaged change to app.js
      git.workingTree.set('app.js', 'console.log("ready");\nconsole.log("work in progress");\n');

      // Untracked file notes.txt
      git.workingTree.set('notes.txt', 'TODO: complete unit tests\n');

      git.scenarioMeta = {
        observedCommands: new Set()
      };
    },
    checkGoal: (git) => {
      const meta = git.scenarioMeta || {};
      const obs = meta.observedCommands || new Set();

      const hasDiff = obs.has('diff');
      const hasStaged = obs.has('diff--staged');
      const hasLog = obs.has('log');
      const hasShow = obs.has('show');

      if (!hasDiff) return { passed: false, message: '尚未執行 git diff 檢視工作區變更！請在終端機輸入：git diff' };
      if (!hasStaged) return { passed: false, message: '尚未執行 git diff --staged 檢視已暫存變更！請輸入：git diff --staged' };
      if (!hasLog) return { passed: false, message: '尚未檢視歷史樹狀圖！請輸入：git log --oneline --graph' };
      if (!hasShow) return { passed: false, message: '尚未檢視上一筆提交細節！請輸入：git show HEAD~1' };

      return {
        passed: true,
        message: '🎉 太棒了！你完整掌握了 status、diff、diff --staged、log 與 HEAD~n 的全套檢視指令，具備了精準看清代碼狀態的能力！'
      };
    }
  },

  {
    id: '25',
    title: '後悔藥對照：restore / reset 三種模式',
    difficulty: '初階 ⭐⭐',
    category: '單機日常循環',
    story: '一個下午同時犯了三個錯：config.js 被手滑改壞（尚未暫存）、debug.log 誤加進暫存區、還手抖提前提交了半成品 wip。請用現代後悔藥精準復原！',
    goals: [
      '使用 git restore config.js 放棄工作區的錯誤修改',
      '使用 git restore --staged debug.log 取消暫存（檔案仍留在硬碟）',
      '使用 git reset --soft HEAD~1 撤銷 wip 提交，保留變更於暫存區',
      '重新提交一個乾淨的 commit：git commit -m "feat: complete payment setup"'
    ],
    hints: [
      '放棄工作區修改：git restore config.js',
      '移出暫存區：git restore --staged debug.log',
      '撤銷提交保留暫存：git reset --soft HEAD~1',
      '重新提交：git commit -m "feat: complete payment setup"'
    ],
    setup: (git) => {
      const c1 = git.createCommit({ message: 'feat: payment base', tree: new Map([['config.js', 'const API_HOST = "https://api.prod";\n'], ['payment.js', 'function pay() {}\n']]) });
      const c2 = git.createCommit({ message: 'wip: half done', parents: [c1.id], tree: new Map([['config.js', 'const API_HOST = "https://api.prod";\n'], ['payment.js', 'function pay() { process(); }\n']]) });

      git.branches.set('main', c2.id);
      git.HEAD = { type: 'branch', target: 'main' };

      git.workingTree = new Map(c2.tree);
      git.index = new Map(c2.tree);

      // 1. Broken config.js in working tree
      git.workingTree.set('config.js', 'const API_HOST = "BROKEN_URL_TYPO";\n');

      // 2. Accidental debug.log in index and working tree
      git.workingTree.set('debug.log', 'secret debug trace\n');
      git.index.set('debug.log', 'secret debug trace\n');

      git.scenarioMeta = {
        baseId: c1.id,
        wipId: c2.id,
        origConfig: 'const API_HOST = "https://api.prod";\n'
      };
    },
    checkGoal: (git) => {
      const meta = git.scenarioMeta || {};
      const curConfig = git.workingTree.get('config.js');
      if (curConfig !== meta.origConfig) {
        return { passed: false, message: 'config.js 尚未復原！請執行 git restore config.js 放棄工作區修改。' };
      }

      if (git.index.has('debug.log')) {
        return { passed: false, message: 'debug.log 仍在暫存區中！請執行 git restore --staged debug.log 移出暫存。' };
      }

      if (!git.workingTree.has('debug.log')) {
        return { passed: false, message: 'debug.log 檔案消失了！請確認使用 restore --staged（移出暫存而非刪除實體檔案）。' };
      }

      const head = git.getHeadCommit();
      if (!head) return { passed: false, message: '尚未建立任何 Commit。' };
      if (head.id === meta.wipId || (head.message && head.message.toLowerCase().includes('wip'))) {
        return { passed: false, message: 'wip 提交尚未撤銷！請執行 git reset --soft HEAD~1 撤銷提交並重新 commit。' };
      }

      if (head.parents.length === 0 || head.parents[0] !== meta.baseId) {
        return { passed: false, message: '新提交的基底不是原本的 payment base，請確認使用 git reset --soft HEAD~1。' };
      }

      return {
        passed: true,
        message: '🎉 漂亮！你完美駕馭了 restore、restore --staged 與 reset --soft 的組合技，各個擊破所有日常失誤！'
      };
    }
  },

  {
    id: '26',
    title: '合併策略：Fast-forward / --no-ff / --squash 與清理分支',
    difficulty: '初階 ⭐⭐',
    category: '分支與整合',
    story: 'GitHub PR 有三種常見合併模式。主管請你在本地親自操作 --no-ff 與 --squash，體會分支歷史保留與壓扁的區別，並學會刪除分支。',
    goals: [
      '在 main 上合併 feature/a 並保留分支形狀：git merge --no-ff feature/a',
      '在 main 上壓縮合併 feature/b：git merge --squash feature/b',
      '為 squash 變更建立新提交：git commit -m "feat: complete feature b"',
      '刪除已合併的 feature/a：git branch -d feature/a',
      '刪除 squash 合併的 feature/b：git branch -D feature/b'
    ],
    hints: [
      '執行 git merge --no-ff feature/a 保留菱形分支形狀',
      '執行 git merge --squash feature/b 並提交 git commit -m "feat: complete feature b"',
      '執行 git branch -d feature/a 與 git branch -D feature/b'
    ],
    setup: (git) => {
      const c1 = git.createCommit({ message: 'feat: base project' });
      git.branches.set('main', c1.id);

      // feature/a: 2 commits
      const ca1 = git.createCommit({ message: 'feat(a): step 1', parents: [c1.id], tree: new Map([['a.txt', '1\n']]) });
      const ca2 = git.createCommit({ message: 'feat(a): step 2', parents: [ca1.id], tree: new Map([['a.txt', '1\n2\n']]) });
      git.branches.set('feature/a', ca2.id);

      // feature/b: 2 commits
      const cb1 = git.createCommit({ message: 'feat(b): part 1', parents: [c1.id], tree: new Map([['b.txt', 'x\n']]) });
      const cb2 = git.createCommit({ message: 'feat(b): part 2', parents: [cb1.id], tree: new Map([['b.txt', 'x\ny\n']]) });
      git.branches.set('feature/b', cb2.id);

      git.branches.set('main', c1.id);
      git.checkoutOrSwitch('main');

      git.scenarioMeta = {
        baseId: c1.id,
        aTip: ca2.id,
        bTip: cb2.id
      };
    },
    checkGoal: (git) => {
      if (git.branches.has('feature/a')) {
        return { passed: false, message: 'feature/a 分支尚未刪除！請執行 git branch -d feature/a。' };
      }
      if (git.branches.has('feature/b')) {
        return { passed: false, message: 'feature/b 分支尚未刪除！請執行 git branch -D feature/b。' };
      }

      const head = git.getHeadCommit();
      if (!head) return { passed: false, message: 'main 分支缺少 commit。' };

      // Walk commits on main
      const chain = [];
      let cur = head;
      while (cur) {
        chain.push(cur);
        cur = (cur.parents && cur.parents[0]) ? git.commits.get(cur.parents[0]) : null;
      }

      const hasNoFfMerge = chain.some(c => c.parents && c.parents.length >= 2);
      if (!hasNoFfMerge) {
        return { passed: false, message: 'main 歷史中缺少 --no-ff 的 Merge Commit！請確認使用了 git merge --no-ff feature/a。' };
      }

      const hasBContent = head.tree && head.tree.has('b.txt');
      if (!hasBContent) {
        return { passed: false, message: 'main 尚未包含 feature/b 的內容！請執行 git merge --squash feature/b 並 commit。' };
      }

      return {
        passed: true,
        message: '🎉 太棒了！你完整理解了 Fast-forward、--no-ff 與 --squash 三種合併策略，並學會以 -d 與 -D 清理分支！'
      };
    }
  },

  {
    id: '27',
    title: '分離 HEAD：查看舊版本並救回在上面做的 commit',
    difficulty: '初階 ⭐⭐',
    category: '分支與整合',
    story: 'PM 請你確認 v1.0 釋出時的舊版表現。你切過去順手修復了一處問題並 commit。切回 main 前，請為這個孤立 commit 開出 hotfix/v1-legacy 分支妥善保存！',
    goals: [
      '以分離 HEAD 切換至標籤：git switch --detach v1.0',
      '在舊版本上修復並提交一個 commit',
      '為該 commit 建立新分支：git switch -c hotfix/v1-legacy',
      '安全切回 main 分支：git switch main'
    ],
    hints: [
      '執行 git switch --detach v1.0',
      '提交修改：git commit -am "fix: legacy patch on v1.0"',
      '建立新分支保全代碼：git switch -c hotfix/v1-legacy',
      '切回主線：git switch main'
    ],
    setup: (git) => {
      const c1 = git.createCommit({ message: 'feat: release v1.0', tree: new Map([['app.js', 'v1.0 stable\n']]) });
      git.tags.set('v1.0', { commitId: c1.id, message: 'Release v1.0' });

      const c2 = git.createCommit({ message: 'feat: start v2.0 development', parents: [c1.id], tree: new Map([['app.js', 'v2.0 dev\n']]) });
      const c3 = git.createCommit({ message: 'feat: more v2 features', parents: [c2.id], tree: new Map([['app.js', 'v2.0 dev full\n']]) });

      git.branches.set('main', c3.id);
      git.checkoutOrSwitch('main');

      git.scenarioMeta = {
        v1Commit: c1.id
      };
    },
    checkGoal: (git) => {
      const meta = git.scenarioMeta || {};
      const hotfixId = git.branches.get('hotfix/v1-legacy');
      if (!hotfixId) {
        return { passed: false, message: '尚未建立 hotfix/v1-legacy 分支以拯救孤立的 commit！' };
      }

      if (git.getCurrentBranch() !== 'main') {
        return { passed: false, message: '完成救援後請切回 main 分支：git switch main。' };
      }

      const hCommit = git.commits.get(hotfixId);
      if (!hCommit || hCommit.id === meta.v1Commit) {
        return { passed: false, message: '在 hotfix/v1-legacy 上尚未建立修復的 commit！' };
      }

      if (!git.isAncestor(meta.v1Commit, hotfixId)) {
        return { passed: false, message: 'hotfix/v1-legacy 的祖先不是 v1.0 標籤節點！' };
      }

      return {
        passed: true,
        message: '🎉 成功掌握 Detached HEAD 的本質與平移救援！不再害怕游標脫離分支的提示！'
      };
    }
  },

  {
    id: '28',
    title: 'Clone、首次推送與追蹤分支',
    difficulty: '初階 ⭐⭐',
    category: '遠端協作基礎',
    story: '加入團隊第一天，從公司遠端倉庫 clone 專案、開出個人分支、建立 upstream 推送，並看懂 branch -vv 的領先/落後狀態！',
    goals: [
      '複製遠端倉庫：git clone origin',
      '開出新分支：git switch -c feature/profile',
      '在新分支上建立一個 Commit',
      '首次推送並建立追蹤：git push -u origin feature/profile',
      '檢視追蹤狀態：git branch -vv'
    ],
    hints: [
      '執行 git switch -c feature/profile 開出分支',
      '提交一個 commit 後執行 git push -u origin feature/profile',
      '輸入 git branch -vv 觀察追蹤關係'
    ],
    setup: (git) => {
      const c1 = git.createCommit({ message: 'feat: initial remote base', tree: new Map([['README.md', '# App\n']]) });
      git.remotes.origin = {
        url: 'https://github.com/company/app.git',
        branches: new Map([['main', c1.id]])
      };
      git.branches.set('main', c1.id);
      git.checkoutOrSwitch('main');

      git.scenarioMeta = {
        baseId: c1.id
      };
    },
    checkGoal: (git) => {
      const curBranch = git.branches.get('feature/profile');
      if (!curBranch) {
        return { passed: false, message: '尚未建立 feature/profile 分支！請執行 git switch -c feature/profile。' };
      }

      const remoteBranch = git.remotes.origin.branches.get('feature/profile');
      if (!remoteBranch) {
        return { passed: false, message: '遠端尚未同步 feature/profile 分支！請執行 git push -u origin feature/profile。' };
      }

      if (curBranch !== remoteBranch) {
        return { passed: false, message: '本地分支與遠端分支版本不一致，請執行 git push -u origin feature/profile。' };
      }

      const isTracking = git.config['branch.feature/profile.remote'] === 'origin';
      if (!isTracking) {
        return { passed: false, message: '尚未設定 upstream 追蹤分支！請使用 git push -u origin feature/profile。' };
      }

      return {
        passed: true,
        message: '🎉 恭喜！你完整跑通了 Clone ➜ 開分支 ➜ Upstream 關聯推送 ➜ 狀態追蹤的標準流程！'
      };
    }
  },

  {
    id: '29',
    title: 'Rebase 中途衝突：continue / abort / skip',
    difficulty: '進階 ⭐⭐⭐',
    category: '打造乾淨歷史',
    story: '照主管說的 rebase main，結果在第 2 個 commit 發生衝突，終端機停在半途中。請手動解決衝突並順利執行 git rebase --continue 完成變基！',
    goals: [
      '啟動變基：git rebase main（觸發衝突並停在中間節點）',
      '觀察狀態：git status 查看衝突檔案',
      '化解衝突後標記暫存：git add app.py',
      '繼續完成變基流程：git rebase --continue'
    ],
    hints: [
      '執行 git rebase main 觸發衝突',
      '切換到「檔案」頁籤點擊「快速套用合併解法」或編輯檔案後執行 git add app.py',
      '執行 git rebase --continue 繼續後續流程'
    ],
    setup: (git) => {
      const c1 = git.createCommit({ message: 'feat: base app', tree: new Map([['app.py', 'console.log("base");\n']]) });
      git.branches.set('main', c1.id);

      // main updates app.py
      const c2 = git.createCommit({ message: 'feat: main feature', parents: [c1.id], tree: new Map([['app.py', 'console.log("base - main updated");\n']]) });
      git.branches.set('main', c2.id);

      // feature branch has 2 commits, commit 2 conflicts
      const cf1 = git.createCommit({ message: 'feat: feature step 1', parents: [c1.id], tree: new Map([['app.py', 'console.log("base");\n'], ['helper.js', 'export const ok = true;\n']]) });
      const cf2 = git.createCommit({ message: 'feat: feature step 2', parents: [cf1.id], tree: new Map([['app.py', 'console.log("base - feature step 2");\n'], ['helper.js', 'export const ok = true;\n']]) });
      git.branches.set('feature', cf2.id);

      git.checkoutOrSwitch('feature');

      git.scenarioMeta = {
        mainId: c2.id,
        origFeatureTip: cf2.id
      };
    },
    checkGoal: (git) => {
      const meta = git.scenarioMeta || {};
      const fId = git.branches.get('feature');
      if (!fId) return { passed: false, message: 'feature 分支不存在。' };

      if (git.rebaseInProgress) {
        return { passed: false, message: 'Rebase 尚未完成！請在解決衝突後執行 git add . 與 git rebase --continue。' };
      }

      if (fId === meta.origFeatureTip) {
        return { passed: false, message: '尚未執行 git rebase main！' };
      }

      if (!git.isAncestor(meta.mainId, fId)) {
        return { passed: false, message: 'feature 分支尚未接在 main 最新提交之後！' };
      }

      return {
        passed: true,
        message: '🎉 成功馴服 Rebase 中途衝突！掌握了 rebase --continue 的狀態機推進精髓！'
      };
    }
  },

  {
    id: '30',
    title: '精準修補歷史中的某個 commit',
    difficulty: '進階 ⭐⭐⭐',
    category: '打造乾淨歷史',
    story: 'PR 包含 4 個 commit。Reviewer 發現你在第 2 個 commit 寫錯了 typo。不要新增零碎的 "fix typo" commit，請用 --fixup 與 --autosquash 精確融進原提交！',
    goals: [
      '修正 validator.js 的 typo 並暫存：git add validator.js',
      '建立精準修補提交：git commit --fixup <target-hash>',
      '自動嫁接合併：git rebase -i --autosquash main',
      '保持歷史乾淨且只有原本的 4 個 commit'
    ],
    hints: [
      '先暫存修正：git add validator.js',
      '輸入 git log 取得 validator commit 的 hash，執行 git commit --fixup <hash>',
      '執行 git rebase -i --autosquash main 自動合併'
    ],
    setup: (git) => {
      const c0 = git.createCommit({ message: 'feat: initial scaffold' });
      git.branches.set('main', c0.id);

      const c1 = git.createCommit({ message: 'feat: add user schema', parents: [c0.id], tree: new Map([['schema.js', 'export const user = {};\n']]) });
      const c2 = git.createCommit({ message: 'feat: add validator helper', parents: [c1.id], tree: new Map([['schema.js', 'export const user = {};\n'], ['validator.js', 'function validte() { return false; }\n']]) });
      const c3 = git.createCommit({ message: 'feat: add auth routes', parents: [c2.id], tree: new Map([['schema.js', 'export const user = {};\n'], ['validator.js', 'function validte() { return false; }\n'], ['routes.js', 'export const r = [];\n']]) });
      const c4 = git.createCommit({ message: 'feat: add auth tests', parents: [c3.id], tree: new Map([['schema.js', 'export const user = {};\n'], ['validator.js', 'function validte() { return false; }\n'], ['routes.js', 'export const r = [];\n'], ['test.js', 'test();\n']]) });

      git.branches.set('feature', c4.id);
      git.checkoutOrSwitch('feature');

      // Working tree has the corrected typo
      git.workingTree.set('validator.js', 'function validate() { return true; }\n');
      git.index.set('validator.js', 'function validate() { return true; }\n');

      git.scenarioMeta = {
        mainId: c0.id,
        targetId: c2.id,
        correctContent: 'function validate() { return true; }\n'
      };
    },
    checkGoal: (git) => {
      const meta = git.scenarioMeta || {};
      const fId = git.branches.get('feature');
      if (!fId) return { passed: false, message: 'feature 分支不存在。' };

      const commits = [];
      let cur = git.commits.get(fId);
      while (cur && cur.id !== meta.mainId) {
        commits.unshift(cur);
        cur = (cur.parents && cur.parents[0]) ? git.commits.get(cur.parents[0]) : null;
      }

      const hasFixup = commits.some(c => c.message.startsWith('fixup!'));
      if (hasFixup) {
        return { passed: false, message: '歷史中仍有 fixup! 提交，尚未執行 git rebase -i --autosquash main 自動合併！' };
      }

      if (commits.length !== 4) {
        return { passed: false, message: `Commit 數量應該維持為 4 個，目前為 ${commits.length} 個。` };
      }

      const targetCommit = commits.find(c => c.message.includes('validator helper'));
      if (!targetCommit || !targetCommit.tree || targetCommit.tree.get('validator.js') !== meta.correctContent) {
        return { passed: false, message: 'validator helper commit 尚未包含正確的修正內容！' };
      }

      return {
        passed: true,
        message: '🎉 神乎其技！你掌握了資深工程師最愛的 git commit --fixup 與 autosquash 神技！'
      };
    }
  },

  {
    id: '31',
    title: '一個 PR 從開到收：變基最新主線與安全強推',
    difficulty: '實戰 ⭐⭐⭐⭐',
    category: '團隊工作流與發布',
    story: '你的 PR 等待 Review 時主線被合併了 2 個新功能。主管要求你 rebase 最新 main 再推，且必須使用安全的 --force-with-lease，合併後清理分支！',
    goals: [
      '拉取遠端最新變更：git fetch origin',
      '將 feature 變基至遠端最新主線：git rebase origin/main',
      '以安全租約強制推送：git push --force-with-lease',
      '切回 main 同步並刪除本地與遠端特徵分支'
    ],
    hints: [
      '執行 git fetch origin',
      '執行 git rebase origin/main',
      '執行 git push --force-with-lease origin feature/cart',
      '執行 git switch main && git pull，再刪除 feature/cart'
    ],
    setup: (git) => {
      const c0 = git.createCommit({ message: 'feat: base ecommerce' });
      git.branches.set('main', c0.id);

      // Remote main advances
      const rm1 = git.createCommit({ message: 'feat: add coupons', parents: [c0.id] });
      const rm2 = git.createCommit({ message: 'feat: add reviews', parents: [rm1.id] });

      git.remotes.origin = {
        url: 'https://github.com/company/shop.git',
        branches: new Map([
          ['main', rm2.id]
        ])
      };

      // Local feature/cart
      const fc1 = git.createCommit({ message: 'feat: shopping cart logic', parents: [c0.id], tree: new Map([['cart.js', 'cart();\n']]) });
      git.branches.set('feature/cart', fc1.id);
      git.remotes.origin.branches.set('feature/cart', fc1.id);
      // Remote tracking ref for feature/cart
      git.branches.set('origin/feature/cart', fc1.id);

      git.checkoutOrSwitch('feature/cart');

      git.scenarioMeta = {
        origCartId: fc1.id,
        remoteMainTip: rm2.id,
        isPrLifecycle: true
      };
    },
    checkGoal: (git) => {
      const meta = git.scenarioMeta || {};
      const localMain = git.branches.get('main');
      const remoteMain = git.remotes.origin?.branches?.get('main');
      const hasLocalCart = git.branches.has('feature/cart');
      const hasRemoteTrackingCart = git.branches.has('origin/feature/cart');

      // 1. Check if rebase was done
      const curCart = git.branches.get('feature/cart');
      if (curCart && curCart === meta.origCartId) {
        return { passed: false, message: 'feature/cart 尚未變基！請執行 git fetch origin && git rebase origin/main。' };
      }

      // 2. Check if remote main contains feature commit
      if (!remoteMain || (!git.isAncestor(meta.remoteMainTip, remoteMain) && !git.isAncestor(meta.origCartId, remoteMain))) {
        return { passed: false, message: '尚未將變基後的 feature/cart 以 git push --force-with-lease 推送至遠端！' };
      }

      // 3. Check if switched back to main and pulled
      if (git.getCurrentBranch() !== 'main') {
        return { passed: false, message: '遠端 PR 已合併！請切換回 main 並拉取最新進度：git switch main && git pull。' };
      }

      if (localMain !== remoteMain) {
        return { passed: false, message: '本地 main 尚未同步至最新版本！請執行 git pull。' };
      }

      // 4. Check if local branch cleaned up
      if (hasLocalCart) {
        return { passed: false, message: '請清理已合併的特徵分支：git branch -d feature/cart。' };
      }

      // 5. Check if remote tracking ref pruned
      if (hasRemoteTrackingCart) {
        return { passed: false, message: '請清除已失效的遠端追蹤參照：git fetch --prune。' };
      }

      return {
        passed: true,
        message: '🎉 太專業了！你走完了完整現代 PR 生命週期：fetch ➜ rebase ➜ force-with-lease ➜ pull ➜ branch -d ➜ fetch --prune，無懈可擊！'
      };
    }
  },

  {
    id: '32',
    title: 'Stacked PR：基底分支被 squash merge 之後',
    difficulty: '進階 ⭐⭐⭐⭐⭐',
    category: '進階工程',
    story: '你在 feature/api 上開出 feature/ui。後來 feature/api 被 squash merge 進 main，導致 feature/ui 一 rebase 就重複衝突。請使用 git rebase --onto 完美截枝嫁接！',
    goals: [
      '使用 git rebase --onto main feature/api feature/ui 精確搬移',
      '確保 feature/ui 乾淨接在 main 最新節點之後',
      '確認 feature/ui 僅包含自己的 2 個 commits'
    ],
    hints: [
      '執行 git rebase --onto main feature/api feature/ui',
      '這會將 feature/api..feature/ui 範圍的 commits 嫁接至 main'
    ],
    setup: (git) => {
      const c0 = git.createCommit({ message: 'feat: base app' });

      // feature/api: 2 commits
      const a1 = git.createCommit({ message: 'feat(api): endpoints', parents: [c0.id], tree: new Map([['api.js', 'api 1\n']]) });
      const a2 = git.createCommit({ message: 'feat(api): handlers', parents: [a1.id], tree: new Map([['api.js', 'api 1 & 2\n']]) });
      git.branches.set('feature/api', a2.id);

      // feature/ui: 2 commits on top of feature/api
      const u1 = git.createCommit({ message: 'feat(ui): buttons', parents: [a2.id], tree: new Map([['api.js', 'api 1 & 2\n'], ['ui.js', 'button\n']]) });
      const u2 = git.createCommit({ message: 'feat(ui): forms', parents: [u1.id], tree: new Map([['api.js', 'api 1 & 2\n'], ['ui.js', 'button & form\n']]) });
      git.branches.set('feature/ui', u2.id);

      // main squash-merged feature/api as a single commit
      const sm = git.createCommit({ message: 'feat: complete api (squash merged)', parents: [c0.id], tree: new Map([['api.js', 'api 1 & 2\n']]) });
      git.branches.set('main', sm.id);

      git.checkoutOrSwitch('feature/ui');

      git.scenarioMeta = {
        mainTip: sm.id,
        apiTip: a2.id,
        uiTip: u2.id
      };
    },
    checkGoal: (git) => {
      const meta = git.scenarioMeta || {};
      const uiId = git.branches.get('feature/ui');
      if (!uiId) return { passed: false, message: 'feature/ui 分支不存在。' };

      if (!git.isAncestor(meta.mainTip, uiId)) {
        return { passed: false, message: 'feature/ui 尚未嫁接至 main 上！請執行 git rebase --onto main feature/api feature/ui。' };
      }

      // Check commit distance from mainTip
      let count = 0;
      let cur = git.commits.get(uiId);
      while (cur && cur.id !== meta.mainTip) {
        count++;
        cur = (cur.parents && cur.parents[0]) ? git.commits.get(cur.parents[0]) : null;
      }

      if (count !== 2) {
        return { passed: false, message: `feature/ui 應該只包含 ui 的 2 個 commit，目前有 ${count} 個（可能重複包含了 api 的 commits）。` };
      }

      return {
        passed: true,
        message: '🎉 嘆為觀止！你掌握了 Git 極高階的 --onto 截枝嫁接黑魔法，輕鬆化解 Stacked PR 歷史重疊問題！'
      };
    }
  },

  {
    id: '33',
    title: '密鑰已經推上遠端的事故處理',
    difficulty: '進階 ⭐⭐⭐⭐⭐',
    category: '進階工程',
    story: '同事 3 個 commit 前不小心將包含 AWS 密鑰的 .env 推送到遠端倉庫！先到憑證服務撤銷並輪替密鑰，確認後再清理歷史；改寫 Git 不會讓密鑰失效。清理完成後要求團隊丟棄舊 clone 並重新 clone。',
    goals: [
      '先撤銷並輪替外洩密鑰，再記錄確認：git config lab.secret-rotation-confirmed yes',
      '自歷史中徹底抹除 .env 檔案',
      '將 .env 加入 .gitignore 提交防護',
      '以安全強制推送更新遠端倉庫：git push --force-with-lease'
    ],
    hints: [
      '先至憑證服務撤銷並輪替密鑰；完成後輸入 git config lab.secret-rotation-confirmed yes 記錄確認。',
      '再使用 git filter-repo 清洗歷史中所有 .env。歷史改寫不會撤銷憑證。',
      '將 .env 加入 .gitignore 提交',
      '執行 git push --force-with-lease 覆寫遠端歷史，並要求團隊丟棄舊 clone、重新 clone。'
    ],
    setup: (git) => {
      const c0 = git.createCommit({ message: 'feat: init repo', tree: new Map([['app.js', 'start();\n']]) });
      const c1 = git.createCommit({ message: 'feat: add config with secret', parents: [c0.id], tree: new Map([['app.js', 'start();\n'], ['.env', 'AWS_KEY=AKIAIOSFODNN7EXAMPLE\n']]) });
      const c2 = git.createCommit({ message: 'feat: add dashboard', parents: [c1.id], tree: new Map([['app.js', 'start();\n'], ['.env', 'AWS_KEY=AKIAIOSFODNN7EXAMPLE\n'], ['dash.js', 'render();\n']]) });

      git.branches.set('main', c2.id);
      git.branches.set('origin/main', c2.id);
      git.remotes.origin = {
        url: 'https://github.com/company/app.git',
        branches: new Map([['main', c2.id]])
      };

      git.checkoutOrSwitch('main');

      // Prepare .gitignore in workingTree
      git.workingTree.set('.gitignore', '.env\n');

      git.scenarioMeta = {
        dirtyId: c1.id
      };
    },
    checkGoal: (git) => {
      const head = git.getHeadCommit();
      if (!head) return { passed: false, message: 'main 缺少提交。' };

      if (git.config?.['lab.secret-rotation-confirmed'] !== 'yes') {
        return { passed: false, message: '請先在憑證服務撤銷並輪替密鑰，再執行 git config lab.secret-rotation-confirmed yes 記錄確認。' };
      }

      // Ensure no commit contains .env in tree
      for (const c of git.commits.values()) {
        if (c.tree && c.tree.has('.env')) {
          return { passed: false, message: '提交歷史中仍找得到 .env 機密檔案！請執行 git filter-repo --path .env --invert-paths 徹底自歷史抹除。' };
        }
      }

      if (!head.tree || !head.tree.has('.gitignore')) {
        return { passed: false, message: '尚未將 .env 加入 .gitignore 提交！請執行 git add .gitignore && git commit -m "chore: ignore .env"' };
      }

      const localMain = git.branches.get('main');
      const remoteMain = git.remotes.origin?.branches?.get('main');
      if (localMain !== remoteMain) {
        return { passed: false, message: '尚未以 git push --force-with-lease 覆寫遠端歷史！' };
      }

      return {
        passed: true,
        message: '🎉 你已先確認憑證撤銷與輪替，再清理並推送歷史。請通知團隊棄用舊 clone、重新 clone；Git 歷史改寫不會撤銷憑證。'
      };
    }
  },

  {
    id: '34',
    title: '跨專案代碼復用：Git Submodule 子模組',
    difficulty: '實戰 ⭐⭐⭐⭐',
    category: '選修主題',
    story: '專案需要共用外部函式庫。請使用 git submodule add 掛載子模組，並提交版本參照！',
    goals: [
      '添加子模組：git submodule add ./sub-repo libs/shared',
      '提交子模組參照：git commit -m "feat: add shared submodule"'
    ],
    hints: [
      '執行 git submodule add ./sub-repo libs/shared',
      '執行 git commit -am "feat: add submodule"'
    ],
    setup: (git) => {
      const c0 = git.createCommit({ message: 'feat: base project' });
      git.branches.set('main', c0.id);
      git.checkoutOrSwitch('main');
      git.hasSubmodule = false;
    },
    checkGoal: (git) => {
      if (!git.hasSubmodule) {
        return { passed: false, message: '（此關卡為 CLI 專屬選修實戰，請使用 ./git-lab start 34 在本機真實環境練習）' };
      }
      return {
        passed: true,
        message: '🎉 成功完成子模組管理！（此關卡為選修實戰）'
      };
    }
  },

  {
    id: '35',
    title: '超大型 Monorepo 救星：Sparse Checkout 局部檢出',
    difficulty: '實戰 ⭐⭐⭐⭐',
    category: '選修主題',
    story: '代碼庫體積龐大，只希望在本地檢出 packages/web 目錄，請啟用 sparse-checkout！',
    goals: [
      '啟用局部檢出：git sparse-checkout init --cone',
      '設定指定檢出目錄：git sparse-checkout set packages/web'
    ],
    hints: [
      '執行 git sparse-checkout init --cone',
      '執行 git sparse-checkout set packages/web'
    ],
    setup: (git) => {
      const c0 = git.createCommit({ message: 'feat: monorepo init' });
      git.branches.set('main', c0.id);
      git.checkoutOrSwitch('main');
      git.hasSparse = false;
    },
    checkGoal: (git) => {
      if (!git.hasSparse) {
        return { passed: false, message: '（此關卡為 CLI 專屬選修實戰，請使用 ./git-lab start 35 在本機真實環境練習）' };
      }
      return {
        passed: true,
        message: '🎉 成功完成局部檢出！（此關卡為選修實戰）'
      };
    }
  }
];

if (typeof SCENARIOS !== 'undefined') {
  SCENARIOS_EXTRA.forEach(sc => SCENARIOS.push(sc));
}
if (typeof window !== 'undefined') {
  window.SCENARIOS_EXTRA = SCENARIOS_EXTRA;
}
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { SCENARIOS_EXTRA };
}
