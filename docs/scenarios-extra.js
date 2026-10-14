/**
 * SCENARIOS_EXTRA - 新增關卡 24-35 定義庫
 * 擴充至全域 SCENARIOS 陣列
 */

const SCENARIOS_EXTRA = [
  {
    id: '24',
    title: '接手專案：Status、Diff、Log 與 Show',
    difficulty: '入門 ⭐',
    category: '單機日常循環',
    story: '小明前輩下班前拍拍你的肩：「欸菜鳥，這支半成品你先看一下，明天接著寫。」工作區有些被改動、暫存區有些被 stage，還有未追蹤的便簽。在急著寫扣前，先用偵探四部曲看懂前輩到底改了什麼、歷史進度在哪裡！',
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
        observedCommands: []
      };
    },
    checkGoal: (git) => {
      const meta = git.scenarioMeta || {};
      const requiredOrder = ['status', 'diff', 'diff--staged', 'log', 'show'];
      let nextExpected = 0;
      for (const command of meta.observedCommands || []) {
        if (command === requiredOrder[nextExpected]) nextExpected++;
      }
      if (nextExpected < requiredOrder.length) {
        const prompts = {
          status: 'git status -s',
          diff: 'git diff',
          'diff--staged': 'git diff --staged',
          log: 'git log --oneline --graph',
          show: 'git show HEAD~1'
        };
        return { passed: false, message: `請依序完成檢視指令，下一步是：${prompts[requiredOrder[nextExpected]]}` };
      }

      return {
        passed: true,
        message: '🎉 太棒了！你完整掌握了 status、diff、diff --staged、log 與 HEAD~n 的全套檢視指令，具備了精準看清代碼狀態的能力！'
      };
    }
  },

  {
    id: '25',
    title: '撤銷操作：Restore 與三種 Reset',
    difficulty: '初階 ⭐⭐',
    category: '單機日常循環',
    story: '今天下午衰神附體，接連犯了三個錯：手滑改壞 config.js（未暫存）、不小心把 debug.log 暫存進去了、還手抖提前 commit 了半成品 wip。別慌！拿出現代 Git 後悔藥對照表，精準對症下藥，逐一復原案發現場！',
    goals: [
      '先 git restore config.js 與 git restore --staged debug.log；debug.log 保留在工作區，再在 mixed-demo 執行 reset --mixed HEAD~1、觀察暫存清空，再 restore payment.js；在 hard-demo 執行 reset --hard HEAD~1，觀察工作區一併回復；最後切回 main',
      '使用 git restore config.js 從索引還原工作區的錯誤修改',
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
      git.branches.set('mixed-demo', c2.id); git.branches.set('hard-demo', c2.id);
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
      const history = git.operationHistory || [];
      if (!history.some(o => o.command === 'reset' && o.args.includes('--mixed')) || !history.some(o => o.command === 'reset' && o.args.includes('--hard')) || git.branches.get('mixed-demo') !== meta.baseId || git.branches.get('hard-demo') !== meta.baseId) return { passed: false, message: '先完成 mixed-demo 與 hard-demo 的獨立 reset 練習。' };
      if (git.getCurrentBranch() !== 'main') return { passed: false, message: '最後請回 main 完成 soft reset 重整提交。' };
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
    title: '整合功能：Merge、Squash 與分支清理',
    difficulty: '初階 ⭐⭐',
    category: '分支與整合',
    story: 'GitHub PR 上常見的三種合併按鈕到底差在哪？技術主管請你在本機親手操作 --no-ff 保留完整歷史、與 --squash 壓平成乾淨單一節點的差別，並清理已無用處的過期分支，搞懂大專案的協作哲學！',
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
        bTip: cb2.id,
        aContent: '1\n2\n',
        bContent: 'x\ny\n'
      };
    },
    checkGoal: (git) => {
      const meta = git.scenarioMeta || {};
      if (git.branches.has('feature/a')) {
        return { passed: false, message: 'feature/a 分支尚未刪除！請執行 git branch -d feature/a。' };
      }
      if (git.branches.has('feature/b')) {
        return { passed: false, message: 'feature/b 分支尚未刪除！請執行 git branch -D feature/b。' };
      }

      const head = git.getHeadCommit();
      if (!head) return { passed: false, message: 'main 分支缺少 commit。' };
      if (git.getCurrentBranch() !== 'main') {
        return { passed: false, message: '請切回 main 完成合併策略驗收。' };
      }

      const aMerge = Array.from(git.commits.values()).find(c =>
        c.parents && c.parents.length === 2 &&
        c.parents[0] === meta.baseId && c.parents[1] === meta.aTip
      );
      if (!aMerge || aMerge.tree.get('a.txt') !== meta.aContent) {
        return { passed: false, message: 'main 歷史中缺少 --no-ff 的 Merge Commit！請確認使用了 git merge --no-ff feature/a。' };
      }

      if (head.parents.length !== 1 || head.parents[0] !== aMerge.id) {
        return { passed: false, message: 'HEAD 應是接在 feature/a merge commit 後的單親 squash commit。' };
      }

      if (head.tree.get('a.txt') !== meta.aContent || head.tree.get('b.txt') !== meta.bContent) {
        return { passed: false, message: 'main 必須保留 feature/a 與 feature/b 的完整檔案內容。' };
      }

      return {
        passed: true,
        message: '🎉 太棒了！你完成了 --no-ff 與 --squash 練習；Fast-forward 另於分支基礎關練習。GitHub PR 提供 merge、squash、rebase merge，沒有獨立 FF 按鈕，並學會以 -d 與 -D 清理分支！'
      };
    }
  },

  {
    id: '27',
    title: '維護舊版：Detached HEAD 與分支救援',
    difficulty: '初階 ⭐⭐',
    category: '分支與整合',
    story: 'PM 跑來問：「v1.0 以前的舊版本表現如何？」你 checkout 過去測試，順手修復了一個問題並 commit。切回 main 之前 Git 警告你 HEAD 處於分離狀態！請為這個孤立無援、飄在半空中的 commit 開出救生分支，妥善保存勞動成果！',
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
        v1Commit: c1.id,
        repairFile: 'app.js'
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

      const v1Commit = git.commits.get(meta.v1Commit);
      if (!v1Commit || hCommit.parents.length !== 1 || hCommit.parents[0] !== meta.v1Commit) {
        return { passed: false, message: 'hotfix/v1-legacy 必須是直接從 v1.0 建立的一個修復 commit。' };
      }

      if (hCommit.tree.get(meta.repairFile) === v1Commit.tree.get(meta.repairFile)) {
        return { passed: false, message: '修復 commit 尚未修改舊版 app.js。' };
      }

      return {
        passed: true,
        message: '🎉 成功掌握 Detached HEAD 的本質與平移救援！不再害怕游標脫離分支的提示！'
      };
    }
  },

  {
    id: '28',
    title: '加入協作：Clone 與追蹤分支',
    difficulty: '初階 ⭐⭐',
    category: '遠端協作基礎',
    story: '第一天進辦公室，強哥把公司的遠端 Repo 網址貼給你。身為新人，請從 clone 專案開始，建立你的功能分支，設定 upstream 首次推送到遠端，並學會用 git branch -vv 掌握本地與遠端的領先/落後動態！',
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
      git.branches.clear();
      git.HEAD = { type: 'branch', target: 'main' };
      git.index = new Map();
      git.workingTree = new Map();
      for (const key of Object.keys(git.config)) {
        if (key.startsWith('branch.')) delete git.config[key];
      }

      git.scenarioMeta = {
        baseId: c1.id,
        cloneRequired: true,
        clonePerformed: false,
        profileContent: 'export const profile = {};\n'
      };
    },
    checkGoal: (git) => {
      const meta = git.scenarioMeta || {};
      if (!meta.clonePerformed || git.branches.get('main') !== meta.baseId ||
          git.branches.get('origin/main') !== meta.baseId ||
          git.config['branch.main.remote'] !== 'origin' ||
          git.config['branch.main.merge'] !== 'refs/heads/main') {
        return { passed: false, message: '請先執行 git clone origin，建立正確的 main 與 upstream 追蹤設定。' };
      }

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

      const featureCommit = git.commits.get(curBranch);
      if (curBranch === meta.baseId || !featureCommit ||
          !git.isAncestor(meta.baseId, curBranch) ||
          featureCommit.tree.get('profile.js') !== meta.profileContent) {
        return { passed: false, message: 'feature/profile 必須包含從 clone 基底建立的新功能 commit。' };
      }

      const isTracking = git.config['branch.feature/profile.remote'] === 'origin' &&
        git.config['branch.feature/profile.merge'] === 'refs/heads/feature/profile' &&
        git.branches.get('origin/feature/profile') === curBranch;
      if (git.getCurrentBranch() !== 'feature/profile' || !isTracking) {
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
    title: '變基中斷：Continue、Abort 與 Skip',
    difficulty: '進階 ⭐⭐⭐',
    category: '打造乾淨歷史',
    story: '聽從強哥的建議執行 git rebase main，結果在第 2 個 commit 突然卡死爆發衝突，終端機停在半途中進退兩難！請冷靜手動排除衝突，執行 git rebase --continue 順利把路走完，學會身為成熟工程師必備的變基續行力！',
    goals: [
      '先切 abort-demo，git rebase main 觸發衝突後 git rebase --abort，確認 tip 回到原位',
      '再切 skip-demo，git rebase main 觸發衝突後 git rebase --skip，明確丟棄衝突的 feature step 2',
      '最後切 feature，啟動變基：git rebase main（觸發衝突並停在中間節點）',
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

      // Three feature commits; the second conflicts with main during rebase.
      const cf1 = git.createCommit({ message: 'feat: feature step 1', parents: [c1.id], tree: new Map([['app.py', 'console.log("base");\n'], ['helper.js', 'export const ok = true;\n']]) });
      const cf2 = git.createCommit({ message: 'feat: feature step 2', parents: [cf1.id], tree: new Map([['app.py', 'console.log("base - feature step 2");\n'], ['helper.js', 'export const ok = true;\n']]) });
      const testContent = 'export const featureTest = true;\n';
      const cf3Tree = new Map(cf2.tree);
      cf3Tree.set('test.js', testContent);
      const cf3 = git.createCommit({ message: 'feat: feature step 3', parents: [cf2.id], tree: cf3Tree });
      git.branches.set('feature', cf3.id);
      git.branches.set('abort-demo', cf3.id); git.branches.set('skip-demo', cf3.id);

      git.checkoutOrSwitch('feature');

      git.scenarioMeta = {
        mainId: c2.id,
        origFeatureTip: cf3.id,
        featureMessages: ['feat: feature step 1', 'feat: feature step 2', 'feat: feature step 3'],
        helperContent: 'export const ok = true;\n',
        testContent
      };
    },
    checkGoal: (git) => {
      const meta = git.scenarioMeta || {};
      const history = git.operationHistory || [];
      if (!history.some(o => o.command === 'rebase' && o.args.includes('--abort')) || git.branches.get('abort-demo') !== meta.origFeatureTip) return { passed: false, message: '先完成 abort-demo 練習，確認原始分支 tip 完整回復。' };
      const skipped = git.commits.get(git.branches.get('skip-demo'));
      if (!history.some(o => o.command === 'rebase' && o.args.includes('--skip')) || !skipped || !git.isAncestor(meta.mainId, skipped.id) || skipped.tree.get('app.py') !== git.commits.get(meta.mainId).tree.get('app.py') || skipped.tree.get('helper.js') !== meta.helperContent || skipped.tree.get('test.js') !== meta.testContent) return { passed: false, message: '完成 skip-demo：只丟棄衝突的 step 2，保留 helper.js 與 test.js。' };
      if (git.getCurrentBranch() !== 'feature') return { passed: false, message: '完成 abort 與 skip 練習後，最後回 feature 保留所有變更並 continue。' };
      const skipChain = []; let skip = skipped;
      while (skip && skip.id !== meta.mainId) { skipChain.unshift(skip); skip = git.commits.get(skip.parents[0]); }
      if (!skip || skipChain.length !== 2 || skipChain[0].message !== meta.featureMessages[0] || skipChain[1].message !== meta.featureMessages[2]) return { passed: false, message: 'skip-demo 應只重播 step 1 與 step 3，不保留 step 2。' };
      const fId = git.branches.get('feature');
      const mainId = git.branches.get('main') || meta.mainId;
      if (!fId) return { passed: false, message: 'feature 分支不存在。' };

      if (git.rebaseInProgress) {
        return { passed: false, message: 'Rebase 尚未完成！請在解決衝突後執行 git add . 與 git rebase --continue。' };
      }

      if (fId === meta.origFeatureTip) {
        return { passed: false, message: '尚未執行 git rebase main！' };
      }

      if (!git.isAncestor(mainId, fId)) {
        return { passed: false, message: 'feature 分支尚未接在 main 最新提交之後！' };
      }

      const replayed = [];
      let cur = git.commits.get(fId);
      while (cur && cur.id !== mainId) {
        replayed.unshift(cur);
        cur = (cur.parents && cur.parents[0]) ? git.commits.get(cur.parents[0]) : null;
      }
      if (!cur || replayed.length !== 3) {
        return { passed: false, message: 'feature 必須保留接在 main 後的三筆原始功能提交。' };
      }
      if (replayed.some((commit, index) => commit.message !== meta.featureMessages[index])) {
        return { passed: false, message: 'Rebase 後必須保留三筆 feature commit 的原始訊息與順序。' };
      }
      if (replayed[0].tree.get('helper.js') !== meta.helperContent) {
        return { passed: false, message: '第一筆 feature commit 的 helper.js 內容遺失。' };
      }
      const resolvedApp = replayed[1].tree.get('app.py') || '';
      if (!resolvedApp.includes('main updated') || !resolvedApp.includes('feature step 2')) {
        return { passed: false, message: '第二筆 feature commit 必須同時保留 main 與 feature 的 app.py 修改。' };
      }
      if (replayed[2].tree.get('test.js') !== meta.testContent) {
        return { passed: false, message: '第三筆 feature commit 的 test.js 內容遺失。' };
      }
      for (const content of git.workingTree.values()) {
        if (/^(<<<<<<<|=======|>>>>>>>)/m.test(content)) {
          return { passed: false, message: '工作目錄仍包含未解決的衝突標記。' };
        }
      }

      return { passed: true, message: '🎉 成功馴服 Rebase 中途衝突！掌握了 rebase --continue 的狀態機推進精髓！' };
    }
  },

  {
    id: '30',
    title: '修補舊提交：Fixup 與 Autosquash',
    difficulty: '進階 ⭐⭐⭐',
    category: '打造乾淨歷史',
    story: '提了 4 個 commit 的 PR，Reviewer 強哥在第 2 個 commit 抓出一個 typo：「不要給我後面補一個 fix typo commit 污染歷史，融進去！」請用現代黑科技 --fixup 與 --autosquash 進行微創手術，精確將修正靶向融進原提交！',
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
    title: 'PR 更新與合併後收尾：Rebase 與租約推送',
    difficulty: '實戰 ⭐⭐⭐⭐',
    category: '團隊工作流與發布',
    story: '你的 PR 等待 Review 時主線又被合了 2 個新功能。主管要求你 rebase 最新 main 再推，且千交代萬交代：使用 --force-with-lease；預設租約依賴遠端追蹤參照，背景 fetch 可能更新它，必要時指定預期的遠端 hash。體驗一個 PR 從開工、更新、安全覆蓋到最終清理分支的完整流程！',
    goals: [
      '拉取遠端最新變更：git fetch origin',
      '將 feature 變基至遠端最新主線：git rebase origin/main',
      '以安全租約強制推送：git push --force-with-lease',
      '模擬 PR 合併：git lab pr merge，再切回 main 同步並清理分支'
    ],
    hints: [
      '執行 git fetch origin',
      '執行 git rebase origin/main',
      '執行 git push --force-with-lease origin feature/cart',
      '執行 git lab pr merge；git switch main && git pull --ff-only，再刪除 feature/cart 與 fetch --prune'
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
        cartMessage: 'feat: shopping cart logic',
        cartContent: 'cart();\n',
        isPrLifecycle: true
      };
    },
    checkGoal: (git) => {
      const meta = git.scenarioMeta || {};
      if (!(git.operationHistory || []).some(o => o.command === 'lab' && o.args[0] === 'pr' && o.args[1] === 'merge')) return { passed: false, message: '完成更新推送後，請執行 git lab pr merge 模擬實際 PR 合併。' };
      const localMain = git.branches.get('main');
      const remoteMain = git.remotes.origin?.branches?.get('main');
      const hasLocalCart = git.branches.has('feature/cart');
      const hasRemoteTrackingCart = git.branches.has('origin/feature/cart');

      // 1. Check if rebase was done
      const curCart = git.branches.get('feature/cart');
      if (curCart && curCart === meta.origCartId) {
        return { passed: false, message: 'feature/cart 尚未變基！請執行 git fetch origin && git rebase origin/main。' };
      }

      // 2. Remote main must include the rebased cart commit and its content.
      const remoteMainCommit = remoteMain ? git.commits.get(remoteMain) : null;
      if (!remoteMainCommit || !remoteMainCommit.tree ||
          remoteMainCommit.tree.get('cart.js') !== meta.cartContent ||
          !git.isAncestor(meta.remoteMainTip, remoteMain)) {
        return { passed: false, message: '遠端 main 尚未真正合併 shopping cart 功能；請完成 PR 合併。' };
      }
      const reachable = git.getReachableCommits(remoteMain);
      const cartCommit = Array.from(reachable)
        .map(id => git.commits.get(id))
        .find(c => c && c.message === meta.cartMessage &&
          c.parents[0] === meta.remoteMainTip &&
          c.tree.get('cart.js') === meta.cartContent);
      if (!cartCommit || !git.isAncestor(cartCommit.id, remoteMain)) {
        return { passed: false, message: '遠端 main 必須保留以最新 origin/main 為基底的 cart commit。' };
      }

      // 3. Check if switched back to main and pulled
      if (git.getCurrentBranch() !== 'main') {
        return { passed: false, message: '遠端 PR 已合併！請切換回 main 並拉取最新進度：git switch main && git pull。' };
      }

      if (localMain !== remoteMain) {
        return { passed: false, message: '本地 main 尚未同步至最新版本！請執行 git pull。' };
      }
      if (git.branches.get('origin/main') !== remoteMain) {
        return { passed: false, message: 'origin/main 追蹤參照尚未同步，請再次執行 git pull。' };
      }

      // 4. Check if local branch cleaned up
      if (hasLocalCart) {
        return { passed: false, message: '請清理已合併的特徵分支：git branch -d feature/cart。' };
      }

      // 5. Check if remote tracking ref pruned
      if (hasRemoteTrackingCart) {
        return { passed: false, message: '請清除已失效的遠端追蹤參照：git fetch --prune。' };
      }
      if (git.remotes.origin.branches.has('feature/cart')) {
        return { passed: false, message: 'PR 合併後遠端 feature/cart 應已刪除。' };
      }

      return {
        passed: true,
        message: '🎉 太專業了！你走完了完整現代 PR 生命週期：fetch ➜ rebase ➜ force-with-lease ➜ pull ➜ branch -d ➜ fetch --prune，無懈可擊！'
      };
    }
  },

  {
    id: '32',
    title: '堆疊分支：Rebase Onto 搬移範圍',
    difficulty: '進階 ⭐⭐⭐⭐⭐',
    category: '進階工程',
    story: '你在 feature/api 上開出 feature/ui 疊疊樂開發。沒想到主管直接將 api 分支 squash merge 進 main，導致 ui 分支一 rebase 就滿地衝突！這時唯有手術刀級的 git rebase --onto 能幫你完美截枝，乾淨嫁接回主線！',
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
    title: '憑證外洩：輪替與歷史清理',
    difficulty: '進階 ⭐⭐⭐⭐⭐',
    category: '進階工程',
    story: '下午三點警報大響！小明前輩在 3 個 commit 前不小心把含有 AWS 密鑰的 .env 推上了遠端倉庫！切記職場保命原則：改寫 Git 歷史不會讓外洩密鑰失效，必須先到雲端輪替廢棄，再用重型工具從歷史徹底抹除，最後通知全組重新 clone！',
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
        baseId: c0.id,
        dirtyId: c1.id,
        originalMainTip: c2.id
      };
    },
    checkGoal: (git) => {
      const head = git.getHeadCommit();
      if (!head) return { passed: false, message: 'main 缺少提交。' };
      const meta = git.scenarioMeta || {};

      if (git.config?.['lab.secret-rotation-confirmed'] !== 'yes') {
        return { passed: false, message: '請先在憑證服務撤銷並輪替密鑰，再執行 git config lab.secret-rotation-confirmed yes 記錄確認。' };
      }

      const localMain = git.branches.get('main');
      const remoteMain = git.remotes.origin?.branches?.get('main');
      const localHistory = Array.from(git.getReachableCommits(localMain))
        .map(id => git.commits.get(id))
        .filter(Boolean);

      // Old objects remain available to the remote until the rewritten ref is pushed.
      for (const c of localHistory) {
        if (c.tree && c.tree.has('.env')) {
          return { passed: false, message: '提交歷史中仍找得到 .env 機密檔案！請執行 git filter-repo --path .env --invert-paths 徹底自歷史抹除。' };
        }
      }

      const rewrittenSecretCommit = localHistory.find(c => c.message === 'feat: add config with secret');
      const rewrittenDashboardCommit = localHistory.find(c => c.message === 'feat: add dashboard');
      if (!rewrittenSecretCommit || rewrittenSecretCommit.id === meta.dirtyId ||
          rewrittenSecretCommit.parents[0] !== meta.baseId ||
          !rewrittenDashboardCommit || rewrittenDashboardCommit.id === meta.originalMainTip ||
          rewrittenDashboardCommit.parents[0] !== rewrittenSecretCommit.id ||
          rewrittenSecretCommit.tree.get('app.js') !== 'start();\n' ||
          rewrittenDashboardCommit.tree.get('dash.js') !== 'render();\n') {
        return { passed: false, message: '本機歷史尚未以新 commit hash 正確重建，或遺失了未清理的檔案內容。' };
      }

      if (!head.tree || !head.tree.has('.gitignore')) {
        return { passed: false, message: '尚未將 .env 加入 .gitignore 提交！請執行 git add .gitignore && git commit -m "chore: ignore .env"' };
      }

      if (head.tree.get('dash.js') !== 'render();\n') {
        return { passed: false, message: '清理後的 main tree 必須保留 dashboard.js 的功能。' };
      }

      const safePush = git.lastPush &&
        git.lastPush.remote === 'origin' &&
        git.lastPush.targetBranch === 'main' &&
        git.lastPush.localId === localMain &&
        git.lastPush.remoteIdBefore === meta.originalMainTip &&
        git.lastPush.expectedRemoteId === meta.originalMainTip &&
        git.lastPush.forceWithLease && !git.lastPush.force;
      if (!safePush || localMain !== remoteMain) {
        return { passed: false, message: '尚未以 git push --force-with-lease 覆寫遠端歷史！' };
      }

      const remoteHistory = Array.from(git.getReachableCommits(remoteMain));
      if (remoteHistory.some(id => git.commits.get(id)?.tree?.has('.env'))) {
        return { passed: false, message: '遠端 main 仍可追溯到 .env，請確認安全強推已更新遠端歷史。' };
      }

      return {
        passed: true,
        message: '🎉 你已先確認憑證撤銷與輪替，再清理並推送歷史。請通知團隊棄用舊 clone、重新 clone；Git 歷史改寫不會撤銷憑證。'
      };
    }
  },

  {
    id: '34',
    cliOnly: true,
    title: '引用專案：Submodule 固定版本',
    difficulty: '實戰 ⭐⭐⭐⭐',
    category: '選修主題',
    story: '專案需要引入公司共用的底層套件庫。強哥警告：「不要直接把外部 code 複製貼上進來！」請使用 git submodule add 正確掛載子模組，提交版本指針，體會多倉庫協作的嚴謹度！',
    goals: [
      '完成父專案後，以消費端 clone，執行 git submodule update --init --recursive，確認固定版本，再更新並提交新的 gitlink',
      '添加子模組：git submodule add ./sub-repo libs/shared',
      '在父專案提交 .gitmodules 與 gitlink：git add .gitmodules libs/shared，再 git commit -m "feat: add shared submodule"'
    ],
    hints: [
      '執行 git submodule add ./sub-repo libs/shared',
      'git add .gitmodules libs/shared，再 git commit -m "feat: add submodule"；commit -a 不包含未追蹤的 .gitmodules'
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
    cliOnly: true,
    title: '大型專案：Sparse Checkout 工作區範圍',
    difficulty: '實戰 ⭐⭐⭐⭐',
    category: '選修主題',
    story: '公司的老古董 Monorepo 歷史龐大動輒幾十 GB，你的小筆電硬碟快被塞爆了。在只要開發前端模組的情況下，請開啟 sparse-checkout 稀疏檢出，只展開需要的工作區目錄。這不會自行縮減下載；partial clone 延後部分物件下載，shallow clone 截短歷史。',
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
