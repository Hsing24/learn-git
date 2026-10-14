/** Core foundations and CLI electives. Load after scenarios-extra.js. */
const SCENARIOS_FOUNDATIONS = [
  {
    id: '36', title: '建立倉庫：Git Init 與三區模型', difficulty: '入門 ⭐', category: '基礎裝備',
    story: '資料夾中的檔案還不是 Git 倉庫。初始化後，先保存 README 快照，再比較工作區、暫存區與提交。分支指向提交，HEAD 通常指向目前分支。',
    goals: ['git init -b main 建立倉庫', 'git status 查看未追蹤檔案', 'git add README.md，git diff --staged 確認快照', 'git commit -m "docs: first snapshot"'],
    hints: ['init 不會自動 add 或 commit；.git 儲存版本資料', '本關只提交 README.md，保留 notes.txt 未追蹤'],
    setup: (git) => { git.initialized = false; git.workingTree.set('README.md', '# Team notes\n'); git.workingTree.set('notes.txt', 'local notes\n'); },
    checkGoal: (git) => {
      const head = git.getHeadCommit();
      if (!git.hasInitialized || !head || git.getCurrentBranch() !== 'main' || head.parents.length || head.tree.get('README.md') !== '# Team notes\n' || head.tree.has('notes.txt') || !git.workingTree.has('notes.txt')) return { passed: false, message: '請初始化 main，只提交 README.md，保留 notes.txt 未追蹤。' };
      return { passed: true, message: '倉庫已建立，第一個提交保存了指定的暫存快照。' };
    }
  },
  {
    id: '37', title: '提交快照：暫存後再修改', difficulty: '入門 ⭐', category: '單機日常循環',
    story: '已暫存的內容是快照。add 後再修改檔案，commit 不會自動包含新修改。請保留這兩個版本，觀察 status 的雙欄與兩種 diff。',
    goals: ['git add report.txt 保存 ready 版本', '在檔案頁將 report.txt 的 ready 改為 draft-after-add，不要再次 add', 'git diff 與 git diff --staged 分別查看差異', 'git commit -m "docs: publish ready report"，確認 draft 留在工作區'],
    hints: ['commit 預設提交索引，不是當下整個工作區', '避免 commit -a 或再次 add，它們會更新暫存快照'],
    setup: (git) => {
      const base = git.createCommit({ message: 'docs: report base', tree: new Map([['report.txt', 'base\n']]) });
      git.branches.set('main', base.id); git.checkoutOrSwitch('main'); git.workingTree.set('report.txt', 'ready\n');
      git.scenarioMeta = { baseId: base.id, staged: 'ready\n', working: 'draft-after-add\n' };
    },
    checkGoal: (git) => {
      const head = git.getHeadCommit(), m = git.scenarioMeta;
      if (!head || head.parents[0] !== m.baseId || head.tree.get('report.txt') !== m.staged || git.index.get('report.txt') !== m.staged || git.workingTree.get('report.txt') !== m.working) return { passed: false, message: '提交須包含 ready 快照，draft-after-add 必須只留在工作區。' };
      const queries = git.operationHistory || [];
      if (!queries.some(o => o.command === 'diff' && !o.args.includes('--staged')) || !queries.some(o => o.command === 'diff' && o.args.includes('--staged'))) return { passed: false, message: '請用 diff 與 diff --staged 觀察兩種差異。' };
      return { passed: true, message: '提交保存 add 時的快照，之後的修改仍未暫存。' };
    }
  },
  {
    id: '38', title: '共享歷史：Revert 一般提交', difficulty: '初階 ⭐⭐', category: '協作救援',
    story: '一筆錯誤設定已在共享主線，後面又有有效修改。用 revert 建立反向提交，保留既有歷史與後來的有效內容。',
    goals: ['git log --oneline 找到錯誤設定的提交', 'git revert bad-config 只撤銷那筆普通提交', '確認通知檔保留，設定恢復安全值，原錯誤提交仍在歷史'],
    hints: ['普通提交不需要 -m；-m 是選擇 merge 的 mainline parent', 'revert 反轉指定提交的差異，不是 reset 整個工作區回舊版本'],
    setup: (git) => {
      const base = git.createCommit({ message: 'feat: safe config', tree: new Map([['config.js', 'safeMode = true;\n']]) });
      const bad = git.createCommit({ hash: 'bad-config', message: 'feat: disable safe mode', parents: [base.id], tree: new Map([['config.js', 'safeMode = false;\n']]) });
      const later = git.createCommit({ message: 'docs: add notice', parents: [bad.id], tree: new Map([...bad.tree, ['notice.txt', 'keep this update\n']]) });
      git.branches.set('main', later.id); git.checkoutOrSwitch('main'); git.scenarioMeta = { badId: bad.id, laterId: later.id };
    },
    checkGoal: (git) => {
      const head = git.getHeadCommit(), m = git.scenarioMeta;
      if (!head || head.parents[0] !== m.laterId || !git.isAncestor(m.badId, head.id) || head.tree.get('config.js') !== 'safeMode = true;\n' || head.tree.get('notice.txt') !== 'keep this update\n') return { passed: false, message: '請新增反向提交，保留後續 notice.txt 與原始共享歷史。' };
      return { passed: true, message: '錯誤差異已反轉，後續修改與原始歷史完整保留。' };
    }
  },
  {
    id: '39', title: '遠端分歧：FF-only 與整合策略', difficulty: '進階 ⭐⭐⭐', category: '遠端協作基礎',
    story: '本機與遠端都有獨立提交。ff-only 應拒絕這次更新，讓你明確選擇 merge 保留分歧歷史，或 rebase 重播尚未共享的本機提交。',
    goals: ['git fetch origin，git log --oneline --graph --all 查看分歧', 'git pull --ff-only，觀察拒絕與原本 HEAD 保留', '選 git pull --no-rebase 或 git pull --rebase 明確整合', 'git push origin main，保留雙方內容'],
    hints: ['ff-only 不會自動選擇 merge 或 rebase', 'rebase 改寫本機提交 ID；對已共享分支應先協調'],
    setup: (git) => {
      const base = git.createCommit({ message: 'feat: shared base', tree: new Map([['app.js', 'start();\n']]) });
      const remote = git.createCommit({ message: 'docs: remote notice', parents: [base.id], tree: new Map([...base.tree, ['notice.txt', 'remote update\n']]) });
      const local = git.createCommit({ message: 'feat: local feature', parents: [base.id], tree: new Map([...base.tree, ['feature.js', 'localFeature();\n']]) });
      git.branches.set('main', local.id); git.remotes.origin.branches.set('main', remote.id); git.checkoutOrSwitch('main');
      git.scenarioMeta = { originalTip: local.id, remoteTip: remote.id };
    },
    checkGoal: (git) => {
      const head = git.getHeadCommit();
      if (!git.ffOnlyRejected) return { passed: false, message: '先執行 pull --ff-only，觀察分歧拒絕。' };
      const chosen = (git.operationHistory || []).some(o => o.command === 'pull' && (o.args.includes('--rebase') || o.args.includes('--no-rebase')));
      if (!chosen || !head || !git.isAncestor(git.scenarioMeta.remoteTip, head.id) || head.tree.get('notice.txt') !== 'remote update\n' || head.tree.get('feature.js') !== 'localFeature();\n' || git.remotes.origin.branches.get('main') !== head.id) return { passed: false, message: '明確選擇 merge 或 rebase，整合雙方內容後再 push。' };
      return { passed: true, message: '已觀察 ff-only 保護，再明確選擇策略並同步雙方內容。' };
    }
  },
  {
    id: '40', title: '連線排查：作者、驗證與權限', difficulty: '初階 ⭐⭐', category: '遠端協作基礎',
    story: '提交作者設定正確，仍收到 Permission denied (publickey)。這個訊息指向 SSH 驗證；Repository not found 也可能是 URL 或存取權限。本關只做本機模擬與診斷，不連線真實服務。',
    goals: ['git config user.name 與 user.email 查看作者；git remote -v 查看 SSH URL', '檢查團隊提供的 repo-info.txt，修正錯誤的 origin URL', 'git config lab.auth-diagnosis ssh-key，記錄 publickey 錯誤的診斷', 'git config lab.permission-check required，記錄仍須檢查倉庫存取權限'],
    hints: ['git remote set-url origin git@github.com:training/team-notes.git', '作者名稱與 Email 不會提供遠端登入權限；HTTPS 使用服務接受的 token/credential helper，SSH 使用金鑰', 'SSH 公鑰登記、私鑰選擇、host 與權限都需要各別確認'],
    setup: (git) => {
      const c = git.createCommit({ message: 'docs: repository access', tree: new Map([['repo-info.txt', 'owner=training\nrepo=team-notes\ntransport=ssh\nerror=Permission denied (publickey)\n']]) });
      git.branches.set('main', c.id); git.checkoutOrSwitch('main'); git.remotes.origin.url = 'git@github.com:wrong-owner/team-notes.git';
      git.config['user.name'] = 'Alex Chen'; git.config['user.email'] = 'alex@example.com';
      git.scenarioMeta = { expectedUrl: 'git@github.com:training/team-notes.git', author: 'Alex Chen', email: 'alex@example.com' };
    },
    checkGoal: (git) => {
      const history = git.operationHistory || [], m = git.scenarioMeta;
      if (!history.some(o => o.command === 'remote' && (o.args.includes('-v') || o.args.includes('get-url')))) return { passed: false, message: '先查看實際 origin URL，再對照 repo-info.txt。' };
      if (git.remotes.origin.url !== m.expectedUrl || git.config['user.name'] !== m.author || git.config['user.email'] !== m.email || git.config['lab.auth-diagnosis'] !== 'ssh-key' || git.config['lab.permission-check'] !== 'required') return { passed: false, message: '修正 SSH URL、保留作者資訊，並區分 SSH 驗證與倉庫權限。' };
      return { passed: true, message: '本機 URL 與診斷已確認；實際金鑰與服務端權限需在真實環境檢查。' };
    }
  },
  {
    id: '41', title: '排除檔案：Ignore 模式與例外', difficulty: '初階 ⭐⭐', category: '單機日常循環',
    story: '產生目錄和 .log 都應排除，但 logs/keep.log 是範例，必須追蹤。不要忽略 logs/ 整個父目錄，否則其子檔案無法直接重新納入。',
    goals: ['編輯 .gitignore：build/、*.log、!logs/keep.log', 'git check-ignore -v build/output.js debug.log，觀察命中的規則', 'git check-ignore -v logs/keep.log，確認例外不忽略', 'git add .，提交規則與 keep.log，排除產物'],
    hints: ['規則由上到下比對，最後命中的規則影響結果', '目錄規則 build/，glob *.log，否定規則 !logs/keep.log', 'check-ignore 回傳 1 可表示沒有被忽略；不是檔案遺失'],
    setup: (git) => {
      git.workingTree.set('.gitignore', '# add patterns here\n'); git.workingTree.set('build/output.js', 'generated();\n'); git.workingTree.set('debug.log', 'debug\n'); git.workingTree.set('logs/keep.log', 'example\n');
    },
    checkGoal: (git) => {
      const head = git.getHeadCommit(), rules = head?.tree.get('.gitignore')?.split(/\r?\n/) || [];
      const inspected = (git.operationHistory || []).filter(o => o.command === 'check-ignore').flatMap(o => o.args);
      if (!head || !['build/', '*.log', '!logs/keep.log'].every(r => rules.includes(r)) || !head.tree.has('logs/keep.log') || head.tree.has('debug.log') || head.tree.has('build/output.js') || !['build/output.js', 'debug.log', 'logs/keep.log'].every(f => inspected.includes(f))) return { passed: false, message: '加入目錄、glob 與例外規則，檢查三個檔案，再只提交規則與範例。' };
      return { passed: true, message: '排除規則已檢查：產物未追蹤，指定範例正常追蹤。' };
    }
  },
  {
    id: '44', title: '閱讀歷史：修訂參照與範圍', difficulty: '進階 ⭐⭐⭐', category: '分支合併',
    story: 'A 與 B 從共同基底分岔並合併。HEAD^ 選第一個 parent，HEAD^2 選第二個 parent，HEAD~2 沿第一親代走兩步。log 的範圍集合與 diff 的端點比較具有不同含義。',
    goals: ['git rev-parse HEAD^ HEAD^2 HEAD~2，觀察合併雙親與祖先', 'git log --oneline A..B；git log --oneline A...B，比較差集與對稱差集', 'git diff A..B；git diff A...B，比較端點與共同祖先到 B', 'git tag first-parent HEAD^；git tag second-parent HEAD^2；git tag ancestor HEAD~2'],
    hints: ['log A..B：B 可達但 A 不可達的提交；log A...B：只在任一方可達的提交', 'diff A..B 等同 diff A B；diff A...B 比較 merge-base(A,B) 與 B', '標籤要指向查到的實際提交，不是輸入固定答案'],
    setup: (git) => {
      const base = git.createCommit({ message: 'feat: base', tree: new Map([['app.js', 'base();\n']]) });
      const a = git.createCommit({ message: 'feat: A', parents: [base.id], tree: new Map([...base.tree, ['a.txt', 'A\n']]) });
      const b = git.createCommit({ message: 'feat: B', parents: [base.id], tree: new Map([...base.tree, ['b.txt', 'B\n']]) });
      const merge = git.createCommit({ message: 'Merge B into A', parents: [a.id, b.id], tree: new Map([...a.tree, ['b.txt', 'B\n']]) });
      git.branches.set('A', a.id); git.branches.set('B', b.id); git.branches.set('main', merge.id); git.checkoutOrSwitch('main');
      git.scenarioMeta = { baseId: base.id, aId: a.id, bId: b.id, originalTip: merge.id };
    },
    checkGoal: (git) => {
      const m = git.scenarioMeta, h = git.operationHistory || [];
      const has = (command, value) => h.some(o => o.command === command && o.args.includes(value));
      if (!['HEAD^', 'HEAD^2', 'HEAD~2'].every(v => has('rev-parse', v)) || !['A..B', 'A...B'].every(v => has('log', v) && has('diff', v))) return { passed: false, message: '請實際檢視三種參照，以及 log/diff 的兩種範圍。' };
      if (git.tags.get('first-parent')?.commitId !== m.aId || git.tags.get('second-parent')?.commitId !== m.bId || git.tags.get('ancestor')?.commitId !== m.baseId || git.getHeadCommitId() !== m.originalTip) return { passed: false, message: '用參照建立三個正確標籤，保留原本的 merge HEAD。' };
      return { passed: true, message: '已解析合併親代，並觀察歷史集合與快照比較的範圍差異。' };
    }
  }
];
const CLI_ELECTIVE_FOUNDATIONS = [
  ['42', '跨平台協作：Attributes 與換行', '以 .gitattributes 明確定義文字檔換行，理解索引標準化與工作區 LF/CRLF；既有檔案需檢查再 renormalize。', ['設定 text/eol 規則並提交 .gitattributes', '觀察 git ls-files --eol 與 git add --renormalize 的變更']],
  ['43', '調整提交：Split Commit 與 Range-diff', '在未共享分支拆開混合提交，再用 range-diff 審查改寫前後的 patch 序列。', ['互動式 rebase edit，reset 後分次暫存與提交', '用 git range-diff 比較兩段提交，確認沒有漏掉功能']],
  ['45', '自動定位：Bisect Run', '用有明確 exit code 的測試腳本自動定位回歸；不可測試的版本用 125 跳過。', ['git bisect run 執行本機檢測腳本', '確認第一個壞提交並 git bisect reset']],
  ['46', '縮減複製：Partial Clone 與 Shallow Clone', 'Partial clone 延後部分物件下載；shallow clone 截短歷史；sparse-checkout 控制工作區檔案。三者解決不同問題，遠端是否支援 filter 也需確認。', ['以本機真實 Git 比較 --depth 與 --filter=blob:none', '檢查 shallow 狀態、物件與工作區範圍']],
  ['47', '大型資產：Git LFS 指標與工具', 'Git LFS 是選用工具，不是 Git 內建指令。Git 保存 pointer，內容另存 LFS 服務；所有協作者需要工具及可用的物件服務。', ['確認 git lfs 已安裝；未安裝時顯示明確先決條件', '設定 track、提交 .gitattributes 並檢查 pointer 與下載內容']],
  ['48', '驗證來源：SSH 提交與標籤簽章', 'Git 2.34+ 可使用 SSH 簽章。提交作者、遠端登入與內容簽章是三種不同用途；驗證需要可信的 allowed signers 設定。', ['使用本機練習金鑰設定 gpg.format ssh 與 user.signingkey', '建立 signed commit/tag 並以 allowed signers 驗證']]
].map(([id, title, story, goals]) => ({ id, title, story, goals, difficulty: '選修 ⭐⭐⭐', category: 'CLI 選修', cliOnly: true, hints: ['請執行 ./git-lab start ' + id + '，在真實本機 Git 環境完成。'], setup: () => {}, checkGoal: () => ({ passed: false, message: '此選修由 CLI 實際倉庫驗證。' }) }));
SCENARIOS.push(...SCENARIOS_FOUNDATIONS, ...CLI_ELECTIVE_FOUNDATIONS);
if (typeof module !== 'undefined' && module.exports) module.exports = { SCENARIOS_FOUNDATIONS, CLI_ELECTIVE_FOUNDATIONS };
