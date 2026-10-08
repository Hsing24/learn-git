/**
 * VirtualGit - Browser-based Git Simulator Engine
 * Accurately models Commits, DAG graph, Branches, HEAD, Index/Staging, Working Tree,
 * Tags, Worktree, Reflog, Bisect, Rerere, and Config.
 */

class VirtualGit {
  constructor() {
    this.resetAll();
  }

  resetAll() {
    this.commits = new Map(); // id -> Commit
    this.branches = new Map(); // name -> commitId
    this.tags = new Map(); // name -> { commitId, type: 'lightweight'|'annotated', message, tagger }
    this.HEAD = { type: 'branch', target: 'main' }; // target is branch name or commitId (detached)
    this.index = new Map(); // path -> content (staged)
    this.workingTree = new Map(); // path -> content (working directory)
    this.config = {
      'user.name': 'Student',
      'user.email': 'student@learn-git.local',
      'push.autoSetupRemote': 'false',
      'rerere.enabled': 'false',
      'core.hooksPath': ''
    };
    this.worktrees = []; // [ { path, branch, commitId } ]
    this.reflog = []; // [ { from, to, action, message, hash, timestamp } ]
    this.remotes = {
      origin: {
        branches: new Map() // branchName -> commitId
      }
    };
    this.rerereCache = new Map(); // conflictKey -> resolvedContent
    this.bisectState = {
      active: false,
      good: [],
      bad: null,
      current: null,
      originalHead: null
    };
    this.stash = []; // [ { id, message, index, workingTree, branch } ]
    this.hooks = new Map(); // 'pre-commit' -> scriptContent
    this.conflictState = null; // null or { file: string, ourBranch: string, theirBranch: string }
    this.commitCounter = 0;
  }

  // Generate short unique deterministic or pseudo-random hash
  generateHash(seed) {
    this.commitCounter++;
    const chars = '0123456789abcdef';
    let h = '';
    const num = (this.commitCounter * 2654435761) >>> 0;
    for (let i = 0; i < 7; i++) {
      h += chars[(num >> (i * 4)) & 0xf];
    }
    return h;
  }

  getHeadCommitId() {
    if (this.HEAD.type === 'branch') {
      return this.branches.get(this.HEAD.target) || null;
    }
    return this.HEAD.target;
  }

  getHeadCommit() {
    const id = this.getHeadCommitId();
    return id ? this.commits.get(id) : null;
  }

  getCurrentBranch() {
    return this.HEAD.type === 'branch' ? this.HEAD.target : null;
  }

  // Create commit object directly in storage
  createCommit({ message, parents = [], tree = null, author = null, hash = null }) {
    const id = hash || this.generateHash(message);
    const resolvedTree = tree ? new Map(tree) : new Map(this.index);
    const commit = {
      id,
      hash: id,
      message,
      parents: Array.isArray(parents) ? parents : [parents],
      tree: resolvedTree,
      author: author || `${this.config['user.name']} <${this.config['user.email']}>`,
      timestamp: Date.now()
    };
    this.commits.set(id, commit);
    return commit;
  }

  // Record an action in reflog
  logReflog(action, message) {
    const headCommit = this.getHeadCommitId() || '0000000';
    this.reflog.unshift({
      hash: headCommit,
      action,
      message,
      timestamp: Date.now()
    });
  }

  // -------------------------------------------------------------
  // Command Implementations
  // -------------------------------------------------------------

  status() {
    const branch = this.getCurrentBranch();
    const headCommit = this.getHeadCommit();
    const staged = [];
    const unstaged = [];
    const untracked = [];

    // Compare index with HEAD commit
    const headTree = headCommit ? headCommit.tree : new Map();
    for (const [file, content] of this.index.entries()) {
      if (!headTree.has(file)) {
        staged.push({ file, status: 'new file' });
      } else if (headTree.get(file) !== content) {
        staged.push({ file, status: 'modified' });
      }
    }
    for (const [file] of headTree.entries()) {
      if (!this.index.has(file)) {
        staged.push({ file, status: 'deleted' });
      }
    }

    // Compare workingTree with index
    for (const [file, content] of this.workingTree.entries()) {
      if (!this.index.has(file)) {
        // Untracked or deleted from index
        if (!headTree.has(file)) {
          untracked.push(file);
        }
      } else if (this.index.get(file) !== content) {
        unstaged.push({ file, status: 'modified' });
      }
    }
    for (const [file] of this.index.entries()) {
      if (!this.workingTree.has(file)) {
        unstaged.push({ file, status: 'deleted' });
      }
    }

    return {
      branch,
      detached: this.HEAD.type === 'detached',
      headId: headCommit ? headCommit.id : null,
      staged,
      unstaged,
      untracked,
      conflict: this.conflictState,
      bisect: this.bisectState.active
    };
  }

  add(args) {
    if (!args || args.length === 0) {
      return { code: 1, output: 'Nothing specified, nothing added.\n' };
    }

    if (args.includes('-p') || args.includes('--patch')) {
      // Interactive patch simulation: stages modified hunks
      const targetFile = args.find(a => !a.startsWith('-')) || 'shopping.py';
      if (!this.workingTree.has(targetFile)) {
        return { code: 1, output: `fatal: pathspec '${targetFile}' did not match any files\n` };
      }
      return {
        code: 0,
        output: `[模擬互動暫存 (Patch Mode)]\n已將 ${targetFile} 中選定的代碼塊 (Hunk 1) 移入暫存區 (Staged)。\n剩餘改動 (Hunk 2) 仍保留在工作區未暫存。`,
        isPatchPrompt: true,
        file: targetFile
      };
    }

    if (args.includes('.') || args.includes('-A') || args.includes('--all')) {
      for (const [file, content] of this.workingTree.entries()) {
        this.index.set(file, content);
      }
      return { code: 0, output: '' };
    }

    // Add specific files
    let addedCount = 0;
    for (const file of args) {
      if (this.workingTree.has(file)) {
        this.index.set(file, this.workingTree.get(file));
        addedCount++;
      } else if (this.index.has(file)) {
        // File deleted in working tree
        this.index.delete(file);
        addedCount++;
      }
    }

    if (addedCount === 0) {
      return { code: 1, output: `fatal: pathspec did not match any files\n` };
    }
    return { code: 0, output: '' };
  }

  commit(args = []) {
    let message = '';
    let isAmend = false;
    let fixupHash = null;

    for (let i = 0; i < args.length; i++) {
      if (args[i] === '-m' && args[i + 1]) {
        message = args[i + 1].replace(/^["']|["']$/g, '');
        i++;
      } else if (args[i] === '--amend') {
        isAmend = true;
      } else if (args[i] === '--fixup' && args[i + 1]) {
        fixupHash = args[i + 1];
        i++;
      }
    }

    // Check pre-commit hooks
    if (this.hooks.has('pre-commit')) {
      const hookScript = this.hooks.get('pre-commit');
      // If hook checks for PRIVATE_KEY or API_TOKEN in staged files
      for (const [file, content] of this.index.entries()) {
        if (/PRIVATE_KEY|AWS_SECRET|API_TOKEN/i.test(content)) {
          return {
            code: 1,
            output: `🔍 正在執行 pre-commit 程式碼安全檢查...\n❌ [安全警報] 檢測到暫存代碼中包含敏感金鑰 (PRIVATE_KEY / AWS_SECRET / API_TOKEN)！\n🚨 Git Hook 已攔截此次提交，請移至環境變數 (.env) 後重試。\ncommit failed.`
          };
        }
      }
    }

    if (this.conflictState) {
      // Resolving a merge conflict
      const parent1 = this.getHeadCommitId();
      const parent2 = this.conflictState.theirCommitId;
      const finalMsg = message || `Merge branch '${this.conflictState.theirBranch}' into ${this.getCurrentBranch()}`;
      
      const commit = this.createCommit({
        message: finalMsg,
        parents: [parent1, parent2],
        tree: new Map(this.index)
      });

      if (this.HEAD.type === 'branch') {
        this.branches.set(this.HEAD.target, commit.id);
      } else {
        this.HEAD.target = commit.id;
      }

      this.logReflog('commit (merge)', finalMsg);
      this.conflictState = null;
      return {
        code: 0,
        output: `[${this.getCurrentBranch() || 'detached HEAD'} ${commit.id}] ${finalMsg}\n`
      };
    }

    if (fixupHash) {
      const target = this.commits.get(fixupHash);
      if (!target) {
        return { code: 1, output: `fatal: could not find commit ${fixupHash}\n` };
      }
      message = `fixup! ${target.message}`;
    }

    if (!message && !isAmend) {
      message = 'update files';
    }

    const headId = this.getHeadCommitId();
    if (isAmend && headId) {
      const oldCommit = this.commits.get(headId);
      const updatedMsg = message || oldCommit.message;
      oldCommit.message = updatedMsg;
      oldCommit.tree = new Map(this.index);
      this.logReflog('commit (amend)', updatedMsg);
      return { code: 0, output: `[${this.getCurrentBranch() || 'detached HEAD'} ${oldCommit.id}] ${updatedMsg}\n` };
    }

    // Normal commit
    const parents = headId ? [headId] : [];
    const commit = this.createCommit({
      message,
      parents,
      tree: new Map(this.index)
    });

    if (this.HEAD.type === 'branch') {
      this.branches.set(this.HEAD.target, commit.id);
    } else {
      this.HEAD.target = commit.id;
    }

    this.logReflog('commit', message);
    return {
      code: 0,
      output: `[${this.getCurrentBranch() || 'detached HEAD'} ${commit.id}] ${message}\n 1 file changed, 1 insertion(+)\n`
    };
  }

  branch(args = []) {
    if (args.length === 0 || (args.length === 1 && (args[0] === '-a' || args[0] === '--all'))) {
      // List branches
      const current = this.getCurrentBranch();
      let out = '';
      for (const [name, id] of this.branches.entries()) {
        const prefix = name === current ? '* ' : '  ';
        out += `${prefix}${name}\n`;
      }
      // List remote branches
      for (const [remName, remObj] of Object.entries(this.remotes)) {
        for (const [bName] of remObj.branches.entries()) {
          out += `  remotes/${remName}/${bName}\n`;
        }
      }
      return { code: 0, output: out };
    }

    if (args[0] === '-d' || args[0] === '-D') {
      const target = args[1];
      if (!target) return { code: 1, output: 'fatal: branch name required\n' };
      if (target === this.getCurrentBranch()) {
        return { code: 1, output: `error: Cannot delete branch '${target}' checked out at workspace\n` };
      }
      if (!this.branches.has(target)) {
        return { code: 1, output: `error: branch '${target}' not found.\n` };
      }
      this.branches.delete(target);
      return { code: 0, output: `Deleted branch ${target}.\n` };
    }

    // Create branch
    const branchName = args[0];
    const headId = this.getHeadCommitId();
    if (this.branches.has(branchName)) {
      return { code: 1, output: `fatal: A branch named '${branchName}' already exists.\n` };
    }
    this.branches.set(branchName, headId);
    return { code: 0, output: '' };
  }

  checkoutOrSwitch(target, isCreate = false) {
    if (isCreate) {
      const headId = this.getHeadCommitId();
      this.branches.set(target, headId);
      this.HEAD = { type: 'branch', target };
      this.logReflog('checkout', `moving from ${this.getCurrentBranch()} to ${target}`);
      return { code: 0, output: `Switched to a new branch '${target}'\n` };
    }

    if (this.branches.has(target)) {
      this.HEAD = { type: 'branch', target };
      // Sync working tree with commit
      const commit = this.commits.get(this.branches.get(target));
      if (commit) {
        this.workingTree = new Map(commit.tree);
        this.index = new Map(commit.tree);
      }
      this.logReflog('checkout', `moving to ${target}`);
      return { code: 0, output: `Switched to branch '${target}'\n` };
    }

    // Detached HEAD checkout by commit ID or Tag
    let targetCommitId = null;
    if (this.commits.has(target)) {
      targetCommitId = target;
    } else if (this.tags.has(target)) {
      targetCommitId = this.tags.get(target).commitId;
    }

    if (targetCommitId) {
      this.HEAD = { type: 'detached', target: targetCommitId };
      const commit = this.commits.get(targetCommitId);
      if (commit) {
        this.workingTree = new Map(commit.tree);
        this.index = new Map(commit.tree);
      }
      this.logReflog('checkout', `moving to ${target}`);
      return {
        code: 0,
        output: `Note: switching to '${target}'.\nYou are in 'detached HEAD' state.\nHEAD is now at ${targetCommitId} ${commit ? commit.message : ''}\n`
      };
    }

    return { code: 1, output: `error: pathspec '${target}' did not match any file(s) known to git\n` };
  }

  merge(targetBranch, options = {}) {
    const currentBranch = this.getCurrentBranch();
    if (!currentBranch) {
      return { code: 1, output: 'fatal: You are in detached HEAD state, cannot merge.\n' };
    }

    const currentCommitId = this.branches.get(currentBranch);
    const targetCommitId = this.branches.get(targetBranch);

    if (!targetCommitId) {
      return { code: 1, output: `merge: ${targetBranch} - not something we can merge\n` };
    }

    if (currentCommitId === targetCommitId) {
      return { code: 0, output: 'Already up to date.\n' };
    }

    // Check if Fast-Forward possible (current is ancestor of target)
    if (this.isAncestor(currentCommitId, targetCommitId) && !options.noFf) {
      this.branches.set(currentBranch, targetCommitId);
      const newCommit = this.commits.get(targetCommitId);
      this.workingTree = new Map(newCommit.tree);
      this.index = new Map(newCommit.tree);
      this.logReflog('merge', `Fast-forward to ${targetBranch}`);
      return {
        code: 0,
        output: `Updating ${currentCommitId}..${targetCommitId}\nFast-forward\n 1 file changed, 2 insertions(+)\n`
      };
    }

    // Simulated 3-way merge conflict trigger
    if (options.simulateConflict || this.hasContentConflict(currentCommitId, targetCommitId)) {
      this.conflictState = {
        file: options.conflictFile || 'order.py',
        ourBranch: currentBranch,
        theirBranch: targetBranch,
        theirCommitId: targetCommitId
      };
      const conflictFile = this.conflictState.file;
      const conflictContent = `<<<<<<< HEAD\n// ${currentBranch} 的實作版本\n=======\n// ${targetBranch} 的衝突版本\n>>>>>>> ${targetBranch}\n`;
      this.workingTree.set(conflictFile, conflictContent);
      this.index.set(conflictFile, conflictContent);

      return {
        code: 1,
        output: `Auto-merging ${conflictFile}\nCONFLICT (content): Merge conflict in ${conflictFile}\nAutomatic merge failed; fix conflicts and then commit the result.\n`
      };
    }

    // Clean 3-way merge commit
    const msg = options.message || `Merge branch '${targetBranch}' into ${currentBranch}`;
    const mergeCommit = this.createCommit({
      message: msg,
      parents: [currentCommitId, targetCommitId],
      tree: new Map(this.index)
    });
    this.branches.set(currentBranch, mergeCommit.id);
    this.logReflog('merge', msg);

    return {
      code: 0,
      output: `Merge made by the 'ort' strategy.\n`
    };
  }

  isAncestor(possibleAncestor, commitId) {
    if (!possibleAncestor || !commitId) return false;
    if (possibleAncestor === commitId) return true;
    const visited = new Set();
    const queue = [commitId];
    while (queue.length > 0) {
      const curr = queue.shift();
      if (curr === possibleAncestor) return true;
      if (visited.has(curr)) continue;
      visited.add(curr);
      const c = this.commits.get(curr);
      if (c && c.parents) {
        queue.push(...c.parents);
      }
    }
    return false;
  }

  hasContentConflict(commitA, commitB) {
    // If either commit modified same file differently
    const cA = this.commits.get(commitA);
    const cB = this.commits.get(commitB);
    if (!cA || !cB) return false;
    for (const [file, contentA] of cA.tree.entries()) {
      if (cB.tree.has(file) && cB.tree.get(file) !== contentA) {
        return true;
      }
    }
    return false;
  }

  rebase(upstream, options = {}) {
    const currentBranch = this.getCurrentBranch();
    if (!currentBranch) {
      return { code: 1, output: 'fatal: cannot rebase detached HEAD\n' };
    }

    const upstreamCommitId = this.branches.get(upstream) || (this.commits.has(upstream) ? upstream : null);
    if (!upstreamCommitId) {
      return { code: 1, output: `fatal: invalid upstream '${upstream}'\n` };
    }

    const currentCommitId = this.branches.get(currentBranch);
    if (currentCommitId === upstreamCommitId) {
      return { code: 0, output: `Current branch ${currentBranch} is up to date.\n` };
    }

    // Replay commits from fork point onto upstream
    const commitsToReplay = [];
    let curr = currentCommitId;
    while (curr && curr !== upstreamCommitId && !this.isAncestor(curr, upstreamCommitId)) {
      commitsToReplay.unshift(this.commits.get(curr));
      const c = this.commits.get(curr);
      curr = (c && c.parents && c.parents[0]) ? c.parents[0] : null;
    }

    if (commitsToReplay.length === 0) {
      // Just fast-forward
      this.branches.set(currentBranch, upstreamCommitId);
      return { code: 0, output: `Successfully rebased and updated refs/heads/${currentBranch}.\n` };
    }

    let newBaseId = upstreamCommitId;
    for (const c of commitsToReplay) {
      if (!c) continue;
      const replayed = this.createCommit({
        message: c.message,
        parents: [newBaseId],
        tree: new Map(c.tree)
      });
      newBaseId = replayed.id;
    }

    this.branches.set(currentBranch, newBaseId);
    this.logReflog('rebase', `checkout ${upstream}`);
    return {
      code: 0,
      output: `Successfully rebased and updated refs/heads/${currentBranch}.\n`
    };
  }

  cherryPick(commitHash) {
    const target = this.commits.get(commitHash);
    if (!target) {
      return { code: 1, output: `fatal: bad revision '${commitHash}'\n` };
    }

    const headId = this.getHeadCommitId();
    const newCommit = this.createCommit({
      message: target.message,
      parents: headId ? [headId] : [],
      tree: new Map(target.tree)
    });

    if (this.HEAD.type === 'branch') {
      this.branches.set(this.HEAD.target, newCommit.id);
    } else {
      this.HEAD.target = newCommit.id;
    }

    this.logReflog('cherry-pick', target.message);
    return {
      code: 0,
      output: `[${this.getCurrentBranch() || 'detached HEAD'} ${newCommit.id}] ${target.message}\n`
    };
  }

  reset(target, mode = '--mixed') {
    let targetCommitId = null;
    if (target.startsWith('HEAD~')) {
      const steps = parseInt(target.replace('HEAD~', ''), 10) || 1;
      let curr = this.getHeadCommit();
      for (let i = 0; i < steps; i++) {
        if (curr && curr.parents && curr.parents[0]) {
          curr = this.commits.get(curr.parents[0]);
        }
      }
      targetCommitId = curr ? curr.id : null;
    } else if (target === 'HEAD' || target === '@') {
      targetCommitId = this.getHeadCommitId();
    } else if (this.branches.has(target)) {
      targetCommitId = this.branches.get(target);
    } else if (this.commits.has(target)) {
      targetCommitId = target;
    }

    if (!targetCommitId) {
      return { code: 1, output: `fatal: Cannot resolve '${target}' as a valid commit.\n` };
    }

    const targetCommit = this.commits.get(targetCommitId);

    if (mode === '--hard') {
      this.workingTree = new Map(targetCommit.tree);
      this.index = new Map(targetCommit.tree);
    } else if (mode === '--soft') {
      // Keep working tree and index unchanged
    } else {
      // --mixed
      this.index = new Map(targetCommit.tree);
    }

    if (this.HEAD.type === 'branch') {
      this.branches.set(this.HEAD.target, targetCommitId);
    } else {
      this.HEAD.target = targetCommitId;
    }

    this.logReflog(`reset ${mode}`, `moving to ${target}`);
    return {
      code: 0,
      output: `HEAD is now at ${targetCommitId} ${targetCommit.message}\n`
    };
  }

  revert(target, options = {}) {
    const targetCommit = this.commits.get(target) || (target === 'HEAD' ? this.getHeadCommit() : null);
    if (!targetCommit) {
      return { code: 1, output: `fatal: bad revision '${target}'\n` };
    }

    // Check if it's a merge commit
    if (targetCommit.parents && targetCommit.parents.length > 1) {
      if (!options.mainline) {
        return {
          code: 1,
          output: `error: commit ${targetCommit.id} is a merge but no -m option was given.\nfatal: revert failed\n`
        };
      }
    }

    const headId = this.getHeadCommitId();
    const revertMsg = `Revert "${targetCommit.message}"`;
    // Reverted tree restores parent 1 state
    const parent1Id = targetCommit.parents[0];
    const parent1 = this.commits.get(parent1Id);
    const revertedTree = parent1 ? new Map(parent1.tree) : new Map();

    const commit = this.createCommit({
      message: revertMsg,
      parents: headId ? [headId] : [],
      tree: revertedTree
    });

    if (this.HEAD.type === 'branch') {
      this.branches.set(this.HEAD.target, commit.id);
    } else {
      this.HEAD.target = commit.id;
    }
    this.workingTree = new Map(revertedTree);
    this.index = new Map(revertedTree);

    this.logReflog('revert', revertMsg);
    return {
      code: 0,
      output: `[${this.getCurrentBranch() || 'detached HEAD'} ${commit.id}] ${revertMsg}\n`
    };
  }

  tag(args = []) {
    if (args.length === 0) {
      let out = '';
      for (const [name] of this.tags.entries()) {
        out += `${name}\n`;
      }
      return { code: 0, output: out };
    }

    if (args[0] === '-d') {
      const name = args[1];
      if (this.tags.has(name)) {
        this.tags.delete(name);
        return { code: 0, output: `Deleted tag '${name}'\n` };
      }
      return { code: 1, output: `error: tag '${name}' not found.\n` };
    }

    let isAnnotated = false;
    let message = '';
    let tagName = '';
    let targetCommit = this.getHeadCommitId();

    for (let i = 0; i < args.length; i++) {
      if (args[i] === '-a') {
        isAnnotated = true;
        tagName = args[i + 1];
        i++;
      } else if (args[i] === '-m' && args[i + 1]) {
        message = args[i + 1].replace(/^["']|["']$/g, '');
        i++;
      } else if (!tagName && !args[i].startsWith('-')) {
        tagName = args[i];
      } else if (tagName && !args[i].startsWith('-')) {
        targetCommit = args[i];
      }
    }

    if (!tagName) {
      return { code: 1, output: 'fatal: tag name required\n' };
    }

    // Resolve target commit if hash or branch
    if (this.branches.has(targetCommit)) {
      targetCommit = this.branches.get(targetCommit);
    }

    this.tags.set(tagName, {
      commitId: targetCommit,
      type: isAnnotated ? 'annotated' : 'lightweight',
      message: message || `Tag ${tagName}`,
      tagger: `${this.config['user.name']} <${this.config['user.email']}>`
    });

    return { code: 0, output: '' };
  }

  worktree(args = []) {
    const sub = args[0];
    if (!sub || sub === 'list') {
      let out = `workspace  ${this.getHeadCommitId()} [${this.getCurrentBranch() || 'detached'}]\n`;
      for (const wt of this.worktrees) {
        out += `${wt.path}  ${wt.commitId} [${wt.branch}]\n`;
      }
      return { code: 0, output: out };
    }

    if (sub === 'add') {
      const dir = args[1];
      let branchName = args[2];
      if (args[2] === '-b' && args[3]) {
        branchName = args[3];
        // Create new branch for worktree
        this.branches.set(branchName, this.getHeadCommitId());
      }
      if (!dir || !branchName) {
        return { code: 1, output: 'usage: git worktree add <path> <branch>\n' };
      }
      const commitId = this.branches.get(branchName) || this.getHeadCommitId();
      this.worktrees.push({ path: dir, branch: branchName, commitId });
      return {
        code: 0,
        output: `Preparing worktree (new working tree at '${dir}')\nHEAD is now at ${commitId}\n`
      };
    }

    if (sub === 'remove') {
      const dir = args[1];
      const idx = this.worktrees.findIndex(w => w.path === dir);
      if (idx !== -1) {
        this.worktrees.splice(idx, 1);
        return { code: 0, output: `Removed worktree '${dir}'\n` };
      }
      return { code: 1, output: `fatal: '${dir}' is not a worktree\n` };
    }

    return { code: 1, output: `Unknown worktree command '${sub}'\n` };
  }

  bisect(args = []) {
    const sub = args[0];
    if (sub === 'start') {
      this.bisectState = {
        active: true,
        good: [],
        bad: null,
        current: this.getHeadCommitId(),
        originalHead: this.getCurrentBranch() || this.getHeadCommitId()
      };
      return { code: 0, output: 'status: bisecting started\n' };
    }

    if (sub === 'bad') {
      const target = args[1] || this.getHeadCommitId();
      this.bisectState.bad = target;
      return this.stepBisect();
    }

    if (sub === 'good') {
      const target = args[1] || this.getHeadCommitId();
      this.bisectState.good.push(target);
      return this.stepBisect();
    }

    if (sub === 'reset') {
      const orig = this.bisectState.originalHead || 'main';
      this.bisectState.active = false;
      this.checkoutOrSwitch(orig);
      return { code: 0, output: `Previous HEAD position was ${this.getHeadCommitId()}\nSwitched to branch '${orig}'\n` };
    }

    return { code: 1, output: `Unknown bisect command '${sub}'\n` };
  }

  stepBisect() {
    if (!this.bisectState.bad || this.bisectState.good.length === 0) {
      return { code: 0, output: 'Waiting for both good and bad commit markers...\n' };
    }
    // Collect commits between good and bad
    const commits = Array.from(this.commits.values());
    const badIdx = commits.findIndex(c => c.id === this.bisectState.bad);
    const goodId = this.bisectState.good[0];
    const goodIdx = commits.findIndex(c => c.id === goodId);

    if (Math.abs(badIdx - goodIdx) <= 1) {
      const culprit = this.commits.get(this.bisectState.bad);
      return {
        code: 0,
        output: `${culprit.id} is the first bad commit\nAuthor: ${culprit.author}\n\n    ${culprit.message}\n`
      };
    }

    const midIdx = Math.floor((badIdx + goodIdx) / 2);
    const midCommit = commits[midIdx];
    this.bisectState.current = midCommit.id;
    this.checkoutOrSwitch(midCommit.id);

    const remaining = Math.abs(badIdx - goodIdx) - 1;
    return {
      code: 0,
      output: `Bisecting: ${remaining} revisions left to test after this (roughly 1 step)\n[${midCommit.id}] ${midCommit.message}\n`
    };
  }

  rm(args = []) {
    let cached = false;
    let file = null;
    for (const a of args) {
      if (a === '--cached') cached = true;
      else if (!a.startsWith('-')) file = a;
    }
    if (!file) {
      return { code: 1, output: 'fatal: No pathspec specified\n' };
    }
    if (!this.index.has(file)) {
      return { code: 1, output: `fatal: pathspec '${file}' did not match any files\n` };
    }

    this.index.delete(file);
    if (!cached) {
      this.workingTree.delete(file);
    }
    return { code: 0, output: `rm '${file}'\n` };
  }

  configCmd(args = []) {
    let isGlobal = false;
    let key = '';
    let val = undefined;
    for (const a of args) {
      if (a === '--global') isGlobal = true;
      else if (!key) key = a;
      else if (val === undefined) val = a;
    }
    if (!key) {
      return { code: 1, output: 'usage: git config [--global] <key> [<value>]\n' };
    }
    if (val === undefined) {
      return { code: 0, output: (this.config[key] || '') + '\n' };
    }
    this.config[key] = val;
    return { code: 0, output: '' };
  }

  logCmd(args = []) {
    let out = '';
    const pickaxeArg = args.find((a, i) => args[i - 1] === '-S');
    if (pickaxeArg || args.includes('-S')) {
      this.hasExecutedArchaeology = true;
    }
    const isOneLine = args.includes('--oneline');

    let curr = this.getHeadCommitId();
    const visited = new Set();
    while (curr && !visited.has(curr)) {
      visited.add(curr);
      const c = this.commits.get(curr);
      if (!c) break;

      if (pickaxeArg) {
        // Check if commit diff introduces pickaxeArg
        let hasString = false;
        for (const [f, content] of c.tree.entries()) {
          if (content.includes(pickaxeArg)) {
            hasString = true;
            break;
          }
        }
        if (!hasString) {
          curr = (c.parents && c.parents[0]) || null;
          continue;
        }
      }

      if (isOneLine) {
        // Badges for branches and tags
        let badges = [];
        if (c.id === this.getHeadCommitId()) badges.push('HEAD');
        for (const [b, cid] of this.branches.entries()) {
          if (cid === c.id) badges.push(b);
        }
        for (const [t, tagObj] of this.tags.entries()) {
          if (tagObj.commitId === c.id) badges.push(`tag: ${t}`);
        }
        const badgeStr = badges.length ? ` (${badges.join(', ')})` : '';
        out += `${c.id}${badgeStr} ${c.message}\n`;
      } else {
        out += `commit ${c.id}\nAuthor: ${c.author}\nDate:   ${new Date(c.timestamp).toISOString()}\n\n    ${c.message}\n\n`;
      }

      curr = (c.parents && c.parents[0]) || null;
    }
    return { code: 0, output: out || 'No commits yet.\n' };
  }

  reflogCmd() {
    let out = '';
    for (const r of this.reflog) {
      out += `${r.hash} HEAD@{0}: ${r.action}: ${r.message}\n`;
    }
    return { code: 0, output: out || 'Reflog is empty.\n' };
  }

  blameCmd(args = []) {
    this.hasExecutedArchaeology = true;
    const file = args.find(a => !a.startsWith('-')) || 'db.js';
    const head = this.getHeadCommit();
    const content = this.workingTree.get(file) || (head && head.tree && head.tree.get(file)) || '';
    if (!content) {
      return { code: 1, output: `fatal: no such path '${file}' in HEAD\n` };
    }
    const lines = content.split('\n');
    let out = '';
    lines.forEach((line, idx) => {
      const lineHash = line.includes('CRITICAL_SECRET_TOKEN') ? 'a1b2c3d4' : (head ? head.id.substring(0, 8) : 'e8f9a0b1');
      const author = line.includes('CRITICAL_SECRET_TOKEN') ? 'Alex Dev' : 'Lead Dev';
      out += `${lineHash} (${author} 2026-10-01 10:00:00 +0800 ${idx + 1}) ${line}\n`;
    });
    return { code: 0, output: out };
  }
}

// Export for browser
if (typeof window !== 'undefined') {
  window.VirtualGit = VirtualGit;
}
