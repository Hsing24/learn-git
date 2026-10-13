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
    this.previousBranch = null; // tracks previous branch for git switch -
    this.index = new Map(); // path -> content (staged)
    this.workingTree = new Map(); // path -> content (working directory)
    this.config = {
      'user.name': 'User',
      'user.email': 'user@learn-git.local',
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
    this.scenarioMeta = {}; // metadata for scenario verification
    this.conflictState = null; // null or { file: string, ourBranch: string, theirBranch: string }
    this.rebaseState = null; // null or { origBranch, origBranchTip, newBaseId, commitsToReplay, currentReplayIndex, conflictFile }
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

  status(args = []) {
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

    if (this.scenarioMeta && Array.isArray(this.scenarioMeta.observedCommands) &&
        args.length === 1 && (args[0] === '-s' || args[0] === '--short') &&
        staged.some(item => item.file === 'utils.js' && item.status === 'modified') &&
        unstaged.some(item => item.file === 'app.js' && item.status === 'modified') &&
        untracked.includes('notes.txt')) {
      this.scenarioMeta.observedCommands.push('status');
    }

    return {
      branch,
      detached: this.HEAD.type === 'detached',
      headId: headCommit ? headCommit.id : null,
      staged,
      unstaged,
      untracked,
      conflict: this.conflictState,
      bisect: this.bisectState.active,
      rebaseInProgress: !!this.rebaseState,
      rebaseCurrent: this.rebaseState ? this.rebaseState.commitsToReplay[this.rebaseState.currentReplayIndex] : null
    };
  }

  get rebaseInProgress() {
    return !!this.rebaseState;
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
        output: `[模擬互動暫存 (Patch Mode)]\n已將 ${targetFile} 中選定的程式碼區塊 (Hunk 1) 移入暫存區 (Staged)。\n剩餘改動 (Hunk 2) 仍保留在工作區未暫存。`,
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

    if (typeof args === 'string') {
      message = args;
      args = ['-m', args];
    } else if (!Array.isArray(args)) {
      args = [];
    }

    for (let i = 0; i < args.length; i++) {
      if ((args[i] === '-m' || args[i] === '-am') && args[i + 1]) {
        message = args[i + 1].replace(/^["']|["']$/g, '');
        i++;
      } else if (args[i] === '--amend') {
        isAmend = true;
      } else if (args[i] === '--fixup' && args[i + 1]) {
        fixupHash = args[i + 1];
        i++;
      }
    }

    // Auto-stage modified tracked files if -a, --all, or -am was used
    if (args.includes('-a') || args.includes('--all') || args.some(a => a.startsWith('-am') || a === '-a')) {
      for (const [file, content] of this.workingTree.entries()) {
        if (this.index.has(file)) {
          this.index.set(file, content);
        }
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
            output: `🔍 正在執行 pre-commit 程式碼安全檢查...\n❌ [安全警報] 檢測到暫存程式碼中包含敏感金鑰 (PRIVATE_KEY / AWS_SECRET / API_TOKEN)！\n🚨 Git Hook 已攔截此次提交，請移至環境變數 (.env) 後重試。\ncommit failed.`
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
      const amendedCommit = this.createCommit({
        message: updatedMsg,
        parents: oldCommit.parents || [],
        tree: new Map(this.index)
      });
      if (this.HEAD.type === 'branch') {
        this.branches.set(this.HEAD.target, amendedCommit.id);
      } else {
        this.HEAD.target = amendedCommit.id;
      }
      this.logReflog('commit (amend)', updatedMsg);
      return { code: 0, output: `[${this.getCurrentBranch() || 'detached HEAD'} ${amendedCommit.id}] ${updatedMsg}\n` };
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
    if (typeof args === 'string') {
      args = [args];
    } else if (!Array.isArray(args)) {
      args = [];
    }
    if (args.includes('--show-current')) {
      return { code: 0, output: (this.getCurrentBranch() || '') + '\n' };
    }

    const isVerbose = args.includes('-v') || args.includes('-vv');
    const isAll = args.includes('-a') || args.includes('--all');
    const isRemotes = args.includes('-r') || args.includes('--remotes');

    // Branch rename: git branch -m [old] new
    if (args[0] === '-m' || args[0] === '-M') {
      const oldName = args.length === 3 ? args[1] : this.getCurrentBranch();
      const newName = args.length === 3 ? args[2] : args[1];
      if (!this.branches.has(oldName)) {
        return { code: 1, output: `error: branch '${oldName}' not found.\n` };
      }
      const cId = this.branches.get(oldName);
      this.branches.delete(oldName);
      this.branches.set(newName, cId);
      if (this.HEAD.type === 'branch' && this.HEAD.target === oldName) {
        this.HEAD.target = newName;
      }
      return { code: 0, output: '' };
    }

    // Branch deletion
    if (args[0] === '-d' || args[0] === '-D') {
      const target = args[1];
      if (!target) return { code: 1, output: 'fatal: branch name required\n' };
      if (target === this.getCurrentBranch()) {
        return { code: 1, output: `error: Cannot delete branch '${target}' checked out at workspace\n` };
      }
      if (!this.branches.has(target)) {
        return { code: 1, output: `error: branch '${target}' not found.\n` };
      }

      if (args[0] === '-d') {
        const targetId = this.branches.get(target);
        const currentId = this.getHeadCommitId();
        const mainId = this.branches.get('main');
        const isMerged = (currentId && this.isAncestor(targetId, currentId)) || (mainId && this.isAncestor(targetId, mainId));
        if (!isMerged) {
          return {
            code: 1,
            output: `error: The branch '${target}' is not fully merged.\nIf you are sure you want to delete it, run 'git branch -D ${target}'.\n`
          };
        }
      }

      this.branches.delete(target);
      return { code: 0, output: `Deleted branch ${target}.\n` };
    }

    // List branches (default, -v, -vv, -a, -r)
    if (args.length === 0 || isVerbose || isAll || isRemotes) {
      const current = this.getCurrentBranch();
      let out = '';
      if (!isRemotes) {
        for (const [name, id] of this.branches.entries()) {
          if (name.startsWith('origin/') || name.startsWith('upstream/')) continue;
          const prefix = name === current ? '* ' : '  ';
          const commit = this.commits.get(id);
          const hashStr = isVerbose ? ` ${id.substring(0, 7)}` : '';
          let trackingStr = '';
          if (args.includes('-vv')) {
            const remName = this.config[`branch.${name}.remote`] || 'origin';
            const mergeRef = this.config[`branch.${name}.merge`] || `refs/heads/${name}`;
            const remBranch = mergeRef.replace('refs/heads/', '');
            const remId = this.remotes[remName]?.branches?.get(remBranch) || this.branches.get(`${remName}/${remBranch}`);
            if (remId) {
              const { ahead, behind } = this.countAheadBehind(id, remId);
              if (ahead > 0 && behind > 0) {
                trackingStr = ` [${remName}/${remBranch}: ahead ${ahead}, behind ${behind}]`;
              } else if (ahead > 0) {
                trackingStr = ` [${remName}/${remBranch}: ahead ${ahead}]`;
              } else if (behind > 0) {
                trackingStr = ` [${remName}/${remBranch}: behind ${behind}]`;
              } else {
                trackingStr = ` [${remName}/${remBranch}]`;
              }
            }
          }
          const msgStr = isVerbose && commit ? ` ${commit.message}` : '';
          out += `${prefix}${name}${hashStr}${trackingStr}${msgStr}\n`;
        }
      }
      if (isAll || isRemotes) {
        for (const [remName, remObj] of Object.entries(this.remotes)) {
          for (const [bName, bId] of remObj.branches.entries()) {
            const commit = this.commits.get(bId);
            const hashStr = isVerbose ? ` ${bId.substring(0, 7)}` : '';
            const msgStr = isVerbose && commit ? ` ${commit.message}` : '';
            out += `  remotes/${remName}/${bName}${hashStr}${msgStr}\n`;
          }
        }
      }
      return { code: 0, output: out };
    }

    // Create branch (ignore leading dashes)
    const branchName = args.find(a => !a.startsWith('-'));
    if (!branchName) {
      return { code: 1, output: 'fatal: branch name required\n' };
    }
    const headId = this.getHeadCommitId();
    if (this.branches.has(branchName)) {
      return { code: 1, output: `fatal: A branch named '${branchName}' already exists.\n` };
    }
    this.branches.set(branchName, headId);
    return { code: 0, output: '' };
  }

  checkoutOrSwitch(target, isCreate = false, isDetach = false) {
    if (target === '-') {
      if (!this.previousBranch) {
        return { code: 1, output: 'fatal: No previous branch found.\n' };
      }
      target = this.previousBranch;
    }

    const currentBranch = this.getCurrentBranch();

    // Check if leaving detached HEAD with orphan commits
    let orphanWarning = '';
    if (this.HEAD.type === 'detached') {
      const detachedId = this.HEAD.target;
      let isReachable = false;
      for (const bId of this.branches.values()) {
        if (this.isAncestor(detachedId, bId)) {
          isReachable = true;
          break;
        }
      }
      if (!isReachable) {
        for (const t of this.tags.values()) {
          if (this.isAncestor(detachedId, t.commitId)) {
            isReachable = true;
            break;
          }
        }
      }
      if (!isReachable) {
        const shortId = detachedId ? detachedId.substring(0, 7) : '';
        const c = this.commits.get(detachedId);
        const msg = c ? c.message : '';
        orphanWarning = `Warning: you are leaving 1 commit behind, not connected to any of your branches:\n\n  ${shortId} ${msg}\n\nIf you want to keep it by creating a new branch, this may be a good time to do so with:\n\n git branch <new-branch-name> ${shortId}\n\n`;
      }
    }

    if (isCreate) {
      const headId = this.getHeadCommitId();
      this.branches.set(target, headId);
      this.HEAD = { type: 'branch', target };
      if (currentBranch && currentBranch !== target) {
        this.previousBranch = currentBranch;
      }
      this.logReflog('checkout', `moving from ${currentBranch || 'HEAD'} to ${target}`);
      return { code: 0, output: `${orphanWarning}Switched to a new branch '${target}'\n` };
    }

    if (!isDetach && this.branches.has(target)) {
      this.HEAD = { type: 'branch', target };
      if (currentBranch && currentBranch !== target) {
        this.previousBranch = currentBranch;
      }
      // Sync working tree with commit
      const commit = this.commits.get(this.branches.get(target));
      if (commit) {
        this.workingTree = new Map(commit.tree);
        this.index = new Map(commit.tree);
      }
      this.logReflog('checkout', `moving to ${target}`);
      return { code: 0, output: `${orphanWarning}Switched to branch '${target}'\n` };
    }

    // Detached HEAD checkout by commit ID, Tag, or branch (when isDetach is true)
    let targetCommitId = null;
    if (this.commits.has(target)) {
      targetCommitId = target;
    } else if (this.tags.has(target)) {
      targetCommitId = this.tags.get(target).commitId;
    } else {
      targetCommitId = this.resolveCommit(target);
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
        output: `${orphanWarning}Note: switching to '${target}'.\nYou are in 'detached HEAD' state.\nHEAD is now at ${targetCommitId.substring(0, 7)} ${commit ? commit.message : ''}\n`
      };
    }

    return { code: 1, output: `error: pathspec '${target}' did not match any file(s) known to git\n` };
  }

  merge(targetBranch, options = {}) {
    const currentBranch = this.getCurrentBranch();
    if (!currentBranch) {
      return { code: 1, output: 'fatal: You are in detached HEAD state, cannot merge.\n' };
    }

    if (options.abort || targetBranch === '--abort') {
      if (this.conflictState) {
        const headCommit = this.getHeadCommit();
        if (headCommit) {
          this.workingTree = new Map(headCommit.tree);
          this.index = new Map(headCommit.tree);
        }
        this.conflictState = null;
        return { code: 0, output: '' };
      }
      return { code: 1, output: 'fatal: There is no merge to abort (MERGE_HEAD missing).\n' };
    }

    const isSquash = options.squash || targetBranch === '--squash';
    const actualBranch = targetBranch === '--squash' ? (options.branch || 'HEAD') : targetBranch;

    const currentCommitId = this.branches.get(currentBranch);
    const targetCommitId = this.branches.get(actualBranch) || this.resolveCommit(actualBranch);

    if (!targetCommitId) {
      return { code: 1, output: `merge: ${actualBranch} - not something we can merge\n` };
    }

    if (currentCommitId === targetCommitId) {
      return { code: 0, output: 'Already up to date.\n' };
    }

    if (isSquash) {
      const baseId = this.getMergeBase(currentCommitId, targetCommitId);
      const baseTree = baseId ? (this.commits.get(baseId)?.tree || new Map()) : new Map();
      const targetCommit = this.commits.get(targetCommitId);
      const targetTree = targetCommit ? targetCommit.tree : new Map();
      const changes = this.diffTrees(baseTree, targetTree);
      this.workingTree = this.applyChanges(this.workingTree, changes);
      this.index = this.applyChanges(this.index, changes);
      return {
        code: 0,
        output: 'Squash commit -- not updating HEAD\nAutomatic merge went well; stopped before committing as requested\n'
      };
    }

    // Check if Fast-Forward possible (current is ancestor of target)
    if (this.isAncestor(currentCommitId, targetCommitId)) {
      if (!options.noFf) {
        this.branches.set(currentBranch, targetCommitId);
        const newCommit = this.commits.get(targetCommitId);
        if (newCommit) {
          this.workingTree = new Map(newCommit.tree);
          this.index = new Map(newCommit.tree);
        }
        this.logReflog('merge', `Fast-forward to ${actualBranch}`);
        const shortCurrent = currentCommitId ? currentCommitId.substring(0, 7) : '0000000';
        const shortTarget = targetCommitId.substring(0, 7);
        return {
          code: 0,
          output: `Updating ${shortCurrent}..${shortTarget}\nFast-forward\n 1 file changed, 2 insertions(+)\n`
        };
      } else {
        // --no-ff on fast-forwardable branch
        const targetCommit = this.commits.get(targetCommitId);
        const targetTree = targetCommit ? targetCommit.tree : new Map();
        this.workingTree = new Map(targetTree);
        this.index = new Map(targetTree);
        const branchName = this.branches.has(actualBranch) ? actualBranch : actualBranch.substring(0, 7);
        const msg = options.message || `Merge branch '${branchName}' into ${currentBranch}`;
        const mergeCommit = this.createCommit({
          message: msg,
          parents: [currentCommitId, targetCommitId],
          tree: new Map(targetTree)
        });
        this.branches.set(currentBranch, mergeCommit.id);
        this.logReflog('merge', msg);
        return {
          code: 0,
          output: `Merge made by the 'ort' strategy.\n`
        };
      }
    }

    // Simulated 3-way merge conflict trigger
    const conflictingFile = this.getConflictingFile(currentCommitId, targetCommitId);
    if (options.simulateConflict || conflictingFile) {
      this.conflictState = {
        file: options.conflictFile || conflictingFile || 'style.css',
        ourBranch: currentBranch,
        theirBranch: actualBranch,
        theirCommitId: targetCommitId
      };
      const conflictFile = this.conflictState.file;
      const ourContent = (this.commits.get(currentCommitId)?.tree?.get(conflictFile)) || this.workingTree.get(conflictFile) || `// ${currentBranch} 的實作版本`;
      const theirContent = (this.commits.get(targetCommitId)?.tree?.get(conflictFile)) || `// ${actualBranch} 的衝突版本`;
      const conflictContent = `<<<<<<< HEAD\n${ourContent}\n=======\n${theirContent}\n>>>>>>> ${actualBranch}\n`;
      this.workingTree.set(conflictFile, conflictContent);
      this.index.set(conflictFile, conflictContent);

      return {
        code: 1,
        output: `Auto-merging ${conflictFile}\nCONFLICT (content): Merge conflict in ${conflictFile}\nAutomatic merge failed; fix conflicts and then commit the result.\n`
      };
    }

    // Clean 3-way merge commit
    const branchName = this.branches.has(actualBranch) ? actualBranch : actualBranch.substring(0, 7);
    const msg = options.message || `Merge branch '${branchName}' into ${currentBranch}`;
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

  getConflictingFile(commitA, commitB) {
    const cA = this.commits.get(commitA);
    const cB = this.commits.get(commitB);
    if (!cA || !cB) return null;
    for (const [file, contentA] of cA.tree.entries()) {
      if (cB.tree.has(file) && cB.tree.get(file) !== contentA) {
        return file;
      }
    }
    return null;
  }

  getReachableCommits(commitId) {
    const set = new Set();
    if (!commitId) return set;
    const queue = [commitId];
    while (queue.length > 0) {
      const cId = queue.shift();
      if (set.has(cId)) continue;
      set.add(cId);
      const c = this.commits.get(cId);
      if (c && c.parents) queue.push(...c.parents);
    }
    return set;
  }

  countAheadBehind(localId, remoteId) {
    if (!localId || !remoteId) return { ahead: 0, behind: 0 };
    const localReachable = this.getReachableCommits(localId);
    const remoteReachable = this.getReachableCommits(remoteId);
    let ahead = 0;
    for (const id of localReachable) {
      if (!remoteReachable.has(id)) ahead++;
    }
    let behind = 0;
    for (const id of remoteReachable) {
      if (!localReachable.has(id)) behind++;
    }
    return { ahead, behind };
  }

  getMergeBase(commitA, commitB) {
    if (!commitA || !commitB) return null;
    if (commitA === commitB) return commitA;
    const reachableA = this.getReachableCommits(commitA);
    const queue = [commitB];
    const visited = new Set();
    while (queue.length > 0) {
      const curr = queue.shift();
      if (reachableA.has(curr)) return curr;
      if (visited.has(curr)) continue;
      visited.add(curr);
      const c = this.commits.get(curr);
      if (c && c.parents) queue.push(...c.parents);
    }
    return null;
  }

  hasContentConflict(commitA, commitB) {
    return !!this.getConflictingFile(commitA, commitB);
  }

  // 算出 commit 相對於它第一個 parent 的變更
  diffTrees(parentTree, tree) {
    const parent = parentTree || new Map();
    const current = tree || new Map();
    const changes = { upsert: new Map(), remove: [] };
    for (const [f, v] of current) {
      if (parent.get(f) !== v) changes.upsert.set(f, v);
    }
    for (const f of parent.keys()) {
      if (!current.has(f)) changes.remove.push(f);
    }
    return changes;
  }

  // 把變更套到新的 base tree 上
  applyChanges(baseTree, changes) {
    const t = new Map(baseTree || []);
    for (const [f, v] of changes.upsert) t.set(f, v);
    for (const f of changes.remove) t.delete(f);
    return t;
  }

  resolveCommit(ref) {
    if (!ref) return null;
    const r = ref.trim();
    if (!r) return null;

    // Upstream tracking branch: @{u} or HEAD@{u} or <branch>@{u}
    if (r === '@{u}' || r === 'HEAD@{u}') {
      const cur = this.getCurrentBranch();
      const remote = (cur && this.config[`branch.${cur}.remote`]) || 'origin';
      const mergeRef = (cur && this.config[`branch.${cur}.merge`]) || (cur ? `refs/heads/${cur}` : '');
      const shortBranch = mergeRef.replace('refs/heads/', '');
      return (shortBranch && this.branches.get(`${remote}/${shortBranch}`)) || (this.remotes[remote]?.branches?.get(shortBranch)) || null;
    }
    if (r.endsWith('@{u}')) {
      const bName = r.replace('@{u}', '');
      const remote = this.config[`branch.${bName}.remote`] || 'origin';
      const mergeRef = this.config[`branch.${bName}.merge`] || `refs/heads/${bName}`;
      const shortBranch = mergeRef.replace('refs/heads/', '');
      return (shortBranch && this.branches.get(`${remote}/${shortBranch}`)) || (this.remotes[remote]?.branches?.get(shortBranch)) || null;
    }

    // Reflog syntax: <ref>@{n}
    const reflogMatch = r.match(/^([^@]+)?@\{(\d+)\}$/);
    if (reflogMatch) {
      const targetRef = reflogMatch[1] || 'HEAD';
      const idx = parseInt(reflogMatch[2], 10);
      if (targetRef === 'HEAD') {
        return this.reflog[idx] ? this.reflog[idx].hash : null;
      }
    }

    // Parent traversal: ~n, ^n, ^
    const tildeMatch = r.match(/^(.+?)~(\d+)$/);
    if (tildeMatch) {
      const baseId = this.resolveCommit(tildeMatch[1]);
      if (!baseId) return null;
      const steps = parseInt(tildeMatch[2], 10);
      let curr = this.commits.get(baseId);
      for (let i = 0; i < steps; i++) {
        if (!curr || !curr.parents || !curr.parents[0]) return null;
        curr = this.commits.get(curr.parents[0]);
      }
      return curr ? curr.id : null;
    }

    const caretMatch = r.match(/^(.+?)\^(\d+)?$/);
    if (caretMatch) {
      const baseId = this.resolveCommit(caretMatch[1]);
      if (!baseId) return null;
      const parentIdx = caretMatch[2] ? (parseInt(caretMatch[2], 10) - 1) : 0;
      const curr = this.commits.get(baseId);
      if (!curr || !curr.parents || curr.parents[parentIdx] === undefined) return null;
      return curr.parents[parentIdx];
    }

    // Direct match: HEAD or @
    if (r === 'HEAD' || r === '@') return this.getHeadCommitId();

    // Direct match: commit hash
    if (this.commits.has(r)) return r;

    // Direct match: local branch
    if (this.branches.has(r)) return this.branches.get(r);

    // Direct match: remote-tracking branch origin/xxx
    if (r.startsWith('origin/')) {
      const bName = r.replace('origin/', '');
      if (this.remotes.origin?.branches?.has(bName)) {
        return this.remotes.origin.branches.get(bName);
      }
    }

    // Direct match: tag
    if (this.tags.has(r)) return this.tags.get(r).commitId;

    // Prefix match on commit hash (min 3 chars)
    if (r.length >= 3) {
      for (const id of this.commits.keys()) {
        if (id.startsWith(r)) return id;
      }
    }

    return null;
  }

  rebase(upstream, options = {}) {
    if (upstream === '--abort' || options.abort) {
      if (!this.rebaseState) {
        return { code: 1, output: 'fatal: No rebase in progress?\n' };
      }
      this.branches.set(this.rebaseState.origBranch, this.rebaseState.origBranchTip);
      this.HEAD = { type: 'branch', target: this.rebaseState.origBranch };
      const origC = this.commits.get(this.rebaseState.origBranchTip);
      if (origC) {
        this.workingTree = new Map(origC.tree);
        this.index = new Map(origC.tree);
      }
      this.conflictState = null;
      this.rebaseState = null;
      return { code: 0, output: 'rebase aborted\n' };
    }

    if (upstream === '--skip' || options.skip) {
      if (!this.rebaseState) {
        return { code: 1, output: 'fatal: No rebase in progress?\n' };
      }
      this.conflictState = null;
      this.rebaseState.currentReplayIndex++;
      return this.continueReplayingCommits();
    }

    if (upstream === '--continue' || options.continue) {
      if (!this.rebaseState) {
        return { code: 1, output: 'fatal: No rebase in progress?\n' };
      }
      if (this.conflictState) {
        const conflictFile = this.conflictState.file;
        const curContent = this.workingTree.get(conflictFile) || '';
        if (curContent.includes('<<<<<<< HEAD')) {
          return {
            code: 1,
            output: `error: Committing is not possible because you have unmerged files.\nhint: Fix them up in the work tree, and then use 'git add/rm <file>'\nhint: as appropriate to mark resolution and run 'git rebase --continue'.\nfatal: Exiting because of an unresolved conflict.\n`
          };
        }
        const c = this.rebaseState.commitsToReplay[this.rebaseState.currentReplayIndex];
        const replayed = this.createCommit({
          message: c.message,
          parents: [this.rebaseState.newBaseId],
          tree: new Map(this.index)
        });
        this.rebaseState.newBaseId = replayed.id;
        this.rebaseState.currentReplayIndex++;
        this.conflictState = null;
      }
      return this.continueReplayingCommits();
    }

    const currentBranch = this.getCurrentBranch();
    if (!currentBranch) {
      return { code: 1, output: 'fatal: cannot rebase detached HEAD\n' };
    }

    const upstreamCommitId = this.resolveCommit(upstream);
    if (!upstreamCommitId) {
      return { code: 1, output: `fatal: invalid upstream '${upstream}'\n` };
    }

    const currentCommitId = this.branches.get(currentBranch);
    if (currentCommitId === upstreamCommitId) {
      return { code: 0, output: `Current branch ${currentBranch} is up to date.\n` };
    }

    // Replay commits from fork point onto upstream
    const commitsToReplay = [];
    const upstreamReachable = this.getReachableCommits(upstreamCommitId);
    let curr = currentCommitId;
    while (curr && !upstreamReachable.has(curr)) {
      commitsToReplay.unshift(this.commits.get(curr));
      const c = this.commits.get(curr);
      curr = (c && c.parents && c.parents[0]) ? c.parents[0] : null;
    }

    if (commitsToReplay.length === 0) {
      this.branches.set(currentBranch, upstreamCommitId);
      const upC = this.commits.get(upstreamCommitId);
      if (upC) {
        this.workingTree = new Map(upC.tree);
        this.index = new Map(upC.tree);
      }
      return { code: 0, output: `Successfully rebased and updated refs/heads/${currentBranch}.\n` };
    }

    this.rebaseState = {
      origBranch: currentBranch,
      origBranchTip: currentCommitId,
      newBaseId: upstreamCommitId,
      commitsToReplay,
      currentReplayIndex: 0
    };

    return this.continueReplayingCommits();
  }

  continueReplayingCommits() {
    if (!this.rebaseState) {
      return { code: 0, output: '' };
    }

    while (this.rebaseState.currentReplayIndex < this.rebaseState.commitsToReplay.length) {
      const i = this.rebaseState.currentReplayIndex;
      const c = this.rebaseState.commitsToReplay[i];
      const origParentId = (c.parents && c.parents[0]) ? c.parents[0] : null;
      const origParent = origParentId ? this.commits.get(origParentId) : null;
      const origParentTree = origParent ? origParent.tree : new Map();
      const changes = this.diffTrees(origParentTree, c.tree);

      const baseCommit = this.commits.get(this.rebaseState.newBaseId);
      const baseTree = baseCommit ? baseCommit.tree : new Map();

      // Check conflict
      let hasConflict = false;
      let conflictFile = null;
      for (const [file, content] of changes.upsert) {
        if (baseTree.has(file) && origParentTree.has(file) && baseTree.get(file) !== origParentTree.get(file) && baseTree.get(file) !== content) {
          hasConflict = true;
          conflictFile = file;
          break;
        }
      }

      if (hasConflict) {
        this.conflictState = {
          file: conflictFile,
          ourBranch: 'HEAD',
          theirBranch: c.message
        };
        const ourContent = baseTree.get(conflictFile) || '';
        const theirContent = c.tree.get(conflictFile) || '';
        const conflictContent = `<<<<<<< HEAD\n${ourContent}\n=======\n${theirContent}\n>>>>>>> ${c.message}\n`;
        this.workingTree.set(conflictFile, conflictContent);
        this.index.set(conflictFile, conflictContent);
        this.HEAD = { type: 'detached', target: this.rebaseState.newBaseId };
        return {
          code: 1,
          output: `Auto-merging ${conflictFile}\nCONFLICT (content): Merge conflict in ${conflictFile}\nerror: could not apply ${c.id.substring(0, 7)}... ${c.message}\nhint: Resolve all conflicts manually, mark them as resolved with\nhint: "git add/rm <conflicted_files>", then run "git rebase --continue".\nhint: You can instead skip this commit: run "git rebase --skip".\nhint: To abort and get back to the state before "git rebase", run "git rebase --abort".\n`
        };
      }

      const newTree = this.applyChanges(baseTree, changes);
      const replayed = this.createCommit({
        message: c.message,
        parents: [this.rebaseState.newBaseId],
        tree: newTree
      });
      this.rebaseState.newBaseId = replayed.id;
      this.rebaseState.currentReplayIndex++;
    }

    const finalBranch = this.rebaseState.origBranch;
    const finalTipId = this.rebaseState.newBaseId;
    this.branches.set(finalBranch, finalTipId);
    this.HEAD = { type: 'branch', target: finalBranch };
    const finalCommit = this.commits.get(finalTipId);
    if (finalCommit) {
      this.workingTree = new Map(finalCommit.tree);
      this.index = new Map(finalCommit.tree);
    }
    this.logReflog('rebase', `finished rebase on ${finalBranch}`);
    this.rebaseState = null;
    return {
      code: 0,
      output: `Successfully rebased and updated refs/heads/${finalBranch}.\n`
    };
  }

  rebaseOnto(newbase, upstream, branch = null) {
    if (branch) {
      this.checkoutOrSwitch(branch);
    }
    const currentBranch = this.getCurrentBranch();
    if (!currentBranch) {
      return { code: 1, output: 'fatal: cannot rebase detached HEAD\n' };
    }
    const newBaseId = this.resolveCommit(newbase);
    if (!newBaseId) {
      return { code: 1, output: `fatal: invalid newbase '${newbase}'\n` };
    }
    const upstreamId = this.resolveCommit(upstream);
    if (!upstreamId) {
      return { code: 1, output: `fatal: invalid upstream '${upstream}'\n` };
    }

    const currentCommitId = this.branches.get(currentBranch);
    const commitsToReplay = [];
    const upstreamReachable = this.getReachableCommits(upstreamId);
    let curr = currentCommitId;
    while (curr && !upstreamReachable.has(curr)) {
      commitsToReplay.unshift(this.commits.get(curr));
      const c = this.commits.get(curr);
      curr = (c && c.parents && c.parents[0]) ? c.parents[0] : null;
    }

    this.rebaseState = {
      origBranch: currentBranch,
      origBranchTip: currentCommitId,
      newBaseId,
      commitsToReplay,
      currentReplayIndex: 0
    };

    return this.continueReplayingCommits();
  }

  rebaseInteractivePlan(upstream, options = {}) {
    const currentBranch = this.getCurrentBranch();
    if (!currentBranch) {
      return { code: 1, output: 'fatal: cannot rebase detached HEAD\n' };
    }
    const upstreamCommitId = this.resolveCommit(upstream);
    if (!upstreamCommitId) {
      return { code: 1, output: `fatal: invalid upstream '${upstream}'\n` };
    }
    const currentCommitId = this.branches.get(currentBranch);
    if (currentCommitId === upstreamCommitId) {
      return { code: 0, output: `Current branch ${currentBranch} is up to date.\n`, commits: [], upstreamId: upstreamCommitId };
    }

    const commits = [];
    const upstreamReachable = this.getReachableCommits(upstreamCommitId);
    let curr = currentCommitId;
    while (curr && !upstreamReachable.has(curr)) {
      const c = this.commits.get(curr);
      if (c) {
        commits.unshift({
          id: c.id,
          shortHash: c.id.substring(0, 7),
          message: c.message,
          action: 'pick'
        });
      }
      curr = (c && c.parents && c.parents[0]) ? c.parents[0] : null;
    }

    if (commits.length === 0) {
      return { code: 0, output: 'noop', commits: [], upstreamId: upstreamCommitId };
    }

    // Auto-squash handling
    const autosquash = options.autosquash || this.config['rebase.autoSquash'] === 'true';
    if (autosquash) {
      const regularCommits = [];
      const fixupCommits = [];
      for (const item of commits) {
        if (item.message.startsWith('fixup!') || item.message.startsWith('squash!')) {
          fixupCommits.push(item);
        } else {
          regularCommits.push(item);
        }
      }
      for (const fixupItem of fixupCommits) {
        const isFixup = fixupItem.message.startsWith('fixup!');
        const targetSubject = fixupItem.message.replace(/^fixup!\s+|^squash!\s+/, '').trim();
        fixupItem.action = isFixup ? 'fixup' : 'squash';
        const targetIdx = regularCommits.findIndex(c => c.message === targetSubject || c.message.startsWith(targetSubject));
        if (targetIdx !== -1) {
          regularCommits.splice(targetIdx + 1, 0, fixupItem);
        } else {
          regularCommits.push(fixupItem);
        }
      }
      commits.length = 0;
      commits.push(...regularCommits);
    }

    return {
      code: 0,
      output: '',
      upstreamId: upstreamCommitId,
      branch: currentBranch,
      commits
    };
  }

  rebaseInteractiveApply(upstreamId, todo = []) {
    const currentBranch = this.getCurrentBranch();
    if (!currentBranch) {
      return { code: 1, output: 'fatal: cannot rebase detached HEAD\n' };
    }
    const baseCommit = this.commits.get(upstreamId);
    if (!baseCommit) {
      return { code: 1, output: `fatal: invalid upstream commit '${upstreamId}'\n` };
    }

    const nonDrop = todo.filter(item => item.action !== 'drop');
    if (nonDrop.length > 0 && (nonDrop[0].action === 'squash' || nonDrop[0].action === 'fixup')) {
      return { code: 1, output: `error: cannot '${nonDrop[0].action}' without a previous commit\n` };
    }

    let newBaseId = upstreamId;
    let lastCommitId = null;

    for (const item of todo) {
      const { id, action, message } = item;
      if (action === 'drop') {
        continue;
      }
      const origCommit = this.commits.get(id);
      if (!origCommit) continue;

      const origParentId = (origCommit.parents && origCommit.parents[0]) ? origCommit.parents[0] : null;
      const origParent = origParentId ? this.commits.get(origParentId) : null;
      const origParentTree = origParent ? origParent.tree : new Map();
      const changes = this.diffTrees(origParentTree, origCommit.tree);

      if (action === 'squash' || action === 'fixup') {
        const prevCommit = this.commits.get(lastCommitId);
        const combinedTree = this.applyChanges(prevCommit ? prevCommit.tree : new Map(), changes);
        let finalMessage = prevCommit ? prevCommit.message : '';
        if (action === 'squash') {
          finalMessage = (message && message.trim()) ? message.trim() : `${finalMessage}\n\n${origCommit.message}`;
        }
        // Delete previous commit and create combined commit replacing it
        this.commits.delete(lastCommitId);
        const combined = this.createCommit({
          message: finalMessage,
          parents: prevCommit ? prevCommit.parents : [upstreamId],
          tree: combinedTree
        });
        lastCommitId = combined.id;
        newBaseId = combined.id;
      } else {
        // pick or reword
        const base = this.commits.get(newBaseId);
        const newTree = this.applyChanges(base ? base.tree : new Map(), changes);
        const commitMsg = action === 'reword' ? (message || origCommit.message) : origCommit.message;
        const replayed = this.createCommit({
          message: commitMsg,
          parents: [newBaseId],
          tree: newTree
        });
        lastCommitId = replayed.id;
        newBaseId = replayed.id;
      }
    }

    this.branches.set(currentBranch, newBaseId);
    const finalTip = this.commits.get(newBaseId);
    if (finalTip) {
      this.workingTree = new Map(finalTip.tree);
      this.index = new Map(finalTip.tree);
    }
    this.logReflog('rebase -i (finish)', `returning to refs/heads/${currentBranch}`);
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

    const origParentId = (target.parents && target.parents[0]) ? target.parents[0] : null;
    const origParent = origParentId ? this.commits.get(origParentId) : null;
    const origParentTree = origParent ? origParent.tree : new Map();
    const changes = this.diffTrees(origParentTree, target.tree);

    const headId = this.getHeadCommitId();
    const headCommit = this.getHeadCommit();
    const newTree = this.applyChanges(headCommit ? headCommit.tree : new Map(), changes);

    const newCommit = this.createCommit({
      message: target.message,
      parents: headId ? [headId] : [],
      tree: newTree
    });

    if (this.HEAD.type === 'branch') {
      this.branches.set(this.HEAD.target, newCommit.id);
    } else {
      this.HEAD.target = newCommit.id;
    }
    this.workingTree = new Map(newTree);
    this.index = new Map(newTree);

    this.logReflog('cherry-pick', target.message);
    return {
      code: 0,
      output: `[${this.getCurrentBranch() || 'detached HEAD'} ${newCommit.id.substring(0, 7)}] ${target.message}\n`
    };
  }

  pull(args = []) {
    const currentBranch = this.getCurrentBranch();
    if (!currentBranch) {
      return { code: 1, output: 'fatal: You are not currently on a branch.\n' };
    }

    const nonFlags = args.filter(a => !a.startsWith('-'));
    const remote = nonFlags[0] || 'origin';
    const remoteBranch = nonFlags[1] || currentBranch;

    if (!this.remotes[remote] || !this.remotes[remote].branches) {
      return { code: 1, output: `fatal: '${remote}' does not appear to be a git repository\n` };
    }

    const remoteId = this.remotes[remote].branches.get(remoteBranch);
    if (!remoteId) {
      return { code: 1, output: `fatal: couldn't find remote ref ${remoteBranch}\n` };
    }
    this.branches.set(`${remote}/${remoteBranch}`, remoteId);

    const localId = this.branches.get(currentBranch);
    const useRebase = args.includes('--rebase') || this.config['pull.rebase'] === 'true';

    if (this.isAncestor(remoteId, localId)) {
      return { code: 0, output: 'Already up to date.\n' };
    } else if (this.isAncestor(localId, remoteId)) {
      // Fast-forward
      this.branches.set(currentBranch, remoteId);
      const remoteCommit = this.commits.get(remoteId);
      if (remoteCommit) {
        this.workingTree = new Map(remoteCommit.tree);
        this.index = new Map(remoteCommit.tree);
      }
      this.logReflog('pull', `Fast-forward to ${remote}/${remoteBranch}`);
      const shortLocal = localId ? localId.substring(0, 7) : '0000000';
      const shortRemote = remoteId.substring(0, 7);
      return {
        code: 0,
        output: `Updating ${shortLocal}..${shortRemote}\nFast-forward\n`
      };
    } else if (useRebase) {
      const res = this.rebase(remoteId);
      if (res.code === 0) {
        return {
          code: 0,
          output: `Successfully rebased and updated refs/heads/${currentBranch}.\n`
        };
      }
      return res;
    } else {
      return this.merge(remoteId);
    }
  }

  push(args = []) {
    const currentBranch = this.getCurrentBranch();
    const nonFlags = args.filter(a => !a.startsWith('-') && !a.startsWith(':'));
    const remote = nonFlags[0] || 'origin';
    let targetBranch = nonFlags[1] || currentBranch;

    if (!targetBranch) {
      return { code: 1, output: 'fatal: You are not currently on a branch.\n' };
    }

    const setUpstream = args.includes('-u') || args.includes('--set-upstream');
    const isDelete = args.includes('--delete') || args.includes('-d') || args.some(a => a.startsWith(':'));

    if (!this.remotes[remote] || !this.remotes[remote].branches) {
      return { code: 1, output: `fatal: '${remote}' does not appear to be a git repository\n` };
    }

    if (isDelete) {
      let delBranch = targetBranch;
      const colonArg = args.find(a => a.startsWith(':'));
      if (colonArg) {
        delBranch = colonArg.substring(1);
      } else if (args.includes('--delete')) {
        delBranch = nonFlags[1] || nonFlags[0];
      }
      this.remotes[remote].branches.delete(delBranch);
      this.branches.delete(`${remote}/${delBranch}`);
      return {
        code: 0,
        output: `To https://github.com/Hsing24/learn-git.git\n - [deleted]         ${delBranch}\n`
      };
    }

    const force = args.includes('--force') || args.includes('-f');
    const lease = args.includes('--force-with-lease') || args.some(a => a.startsWith('--force-with-lease'));

    const localId = this.branches.get(targetBranch) || (targetBranch === currentBranch ? this.getHeadCommitId() : null);
    if (!localId) {
      return { code: 1, output: `error: src refspec ${targetBranch} does not match any\n` };
    }

    const remoteId = this.remotes[remote].branches.get(targetBranch);

    const onPushSuccess = (outputMessage) => {
      this.remotes[remote].branches.set(targetBranch, localId);
      this.branches.set(`${remote}/${targetBranch}`, localId);
      if (setUpstream) {
        this.config[`branch.${targetBranch}.remote`] = remote;
        this.config[`branch.${targetBranch}.merge`] = `refs/heads/${targetBranch}`;
        outputMessage += `Branch '${targetBranch}' set up to track remote branch '${targetBranch}' from '${remote}'.\n`;
      }
      if (this.scenarioMeta && this.scenarioMeta.isPrLifecycle) {
        // Simulate remote reviewer merging PR and deleting remote branch
        this.remotes.origin.branches.set('main', localId);
        this.remotes.origin.branches.delete('feature/cart');
        outputMessage += `\n🤖 [模擬] Reviewer 已核准，PR #42 已合併並刪除遠端分支\n`;
      }
      return { code: 0, output: outputMessage };
    };

    if (!remoteId) {
      return onPushSuccess(`To https://github.com/Hsing24/learn-git.git\n * [new branch]      ${targetBranch} -> ${targetBranch}\n`);
    }

    if (remoteId === localId) {
      return { code: 0, output: 'Everything up-to-date\n' };
    }

    if (this.isAncestor(remoteId, localId)) {
      const shortRemote = remoteId.substring(0, 7);
      const shortLocal = localId.substring(0, 7);
      return onPushSuccess(`To https://github.com/Hsing24/learn-git.git\n   ${shortRemote}..${shortLocal}  ${targetBranch} -> ${targetBranch}\n`);
    }

    if (lease && !force) {
      // Lease check: verify remote branch matches our remote-tracking ref
      const trackingRefId = this.branches.get(`${remote}/${targetBranch}`);
      if (trackingRefId && remoteId && trackingRefId !== remoteId) {
        return {
          code: 1,
          output: `To https://github.com/Hsing24/learn-git.git
 ! [rejected]        ${targetBranch} -> ${targetBranch} (stale info)
error: failed to push some refs to 'https://github.com/Hsing24/learn-git.git'
hint: Updates were rejected because the remote contains work that you do not
hint: have locally. This is usually caused by another repository pushing to
hint: the same ref. If you want to integrate the remote changes, use
hint: 'git pull' before pushing again.\n`
        };
      }
    }

    if (force || lease) {
      const shortRemote = remoteId.substring(0, 7);
      const shortLocal = localId.substring(0, 7);
      return onPushSuccess(`To https://github.com/Hsing24/learn-git.git\n + ${shortRemote}...${shortLocal} ${targetBranch} -> ${targetBranch} (forced update)\n`);
    }

    return {
      code: 1,
      output: `To https://github.com/Hsing24/learn-git.git
 ! [rejected]        ${targetBranch} -> ${targetBranch} (fetch first)
error: failed to push some refs to 'https://github.com/Hsing24/learn-git.git'
hint: Updates were rejected because the remote contains work that you do not
hint: have locally. This is usually caused by another repository pushing to
hint: the same ref. If you want to integrate the remote changes, use
hint: 'git pull' before pushing again.\n`
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
    const targetCommitId = this.resolveCommit(target);
    const targetCommit = targetCommitId ? this.commits.get(targetCommitId) : null;
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

  filterRepo(args = []) {
    let targetPath = '.env';
    const pIdx = args.indexOf('--path');
    if (pIdx !== -1 && args[pIdx + 1]) {
      targetPath = args[pIdx + 1];
    } else {
      const nonFlag = args.find(a => !a.startsWith('-'));
      if (nonFlag) targetPath = nonFlag;
    }

    let modifiedCount = 0;
    for (const [id, c] of this.commits.entries()) {
      if (c.tree && c.tree.has(targetPath)) {
        c.tree.delete(targetPath);
        modifiedCount++;
      }
    }
    this.workingTree.delete(targetPath);
    this.index.delete(targetPath);

    return {
      code: 0,
      output: `Parsed ${this.commits.size} commits\nRewrote ${modifiedCount} commit trees removing '${targetPath}'\nNew history written; now repacking\nCompletely finished.\n`
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

    if (args.includes('-l') || args.includes('--list')) {
      const pattern = args.find((a, i) => i > 0 && !a.startsWith('-'));
      let out = '';
      for (const [name] of this.tags.entries()) {
        if (!pattern || name.startsWith(pattern.replace(/\*/g, '')) || name.includes(pattern.replace(/\*/g, ''))) {
          out += `${name}\n`;
        }
      }
      return { code: 0, output: out || (pattern ? '' : 'v1.0.0\n') };
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
    if (this.scenarioMeta && Array.isArray(this.scenarioMeta.observedCommands) &&
        args.length === 2 && args.includes('--oneline') && args.includes('--graph') &&
        out && out !== 'No commits yet.\n') {
      this.scenarioMeta.observedCommands.push('log');
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

  stashCmd(args = []) {
    const sub = args[0] || 'push';
    if (sub === 'list') {
      if (this.stash.length === 0) return { code: 0, output: '' };
      return {
        code: 0,
        output: this.stash.map((s, idx) => `stash@{${idx}}: WIP on ${s.branch}: ${s.headHash} ${s.message}`).join('\n') + '\n'
      };
    }
    if (sub === 'show') {
      if (this.stash.length === 0) {
        return { code: 1, output: 'error: No stash entries found.\n' };
      }
      const entry = this.stash[0];
      let out = '';
      for (const [f] of entry.workingTree.entries()) {
        out += `diff --git a/${f} b/${f}\n--- a/${f}\n+++ b/${f}\n@@ -1,3 +1,4 @@\n+ // modified changes in stash@{0}\n`;
      }
      return { code: 0, output: out || '(stash@{0} 工作區未偵測到變更差異)\n' };
    }
    if (sub === 'pop' || sub === 'apply') {
      if (this.stash.length === 0) {
        return { code: 1, output: 'error: No stash entries found.\n' };
      }
      const entry = sub === 'pop' ? this.stash.shift() : this.stash[0];
      for (const [f, c] of entry.workingTree.entries()) {
        this.workingTree.set(f, c);
      }
      for (const [f, c] of entry.index.entries()) {
        this.index.set(f, c);
      }
      let out = `On branch ${this.getCurrentBranch()}\nChanges restored from stash.\n`;
      if (sub === 'pop') out += `Dropped refs/stash@{0} (${entry.headHash})\n`;
      return { code: 0, output: out };
    }
    if (sub === 'drop') {
      if (this.stash.length > 0) {
        const dropped = this.stash.shift();
        return { code: 0, output: `Dropped refs/stash@{0} (${dropped.headHash})\n` };
      }
      return { code: 1, output: 'No stash entries to drop.\n' };
    }
    if (sub === 'clear') {
      this.stash = [];
      return { code: 0, output: '' };
    }

    // Default: stash push / save
    const headCommit = this.getHeadCommit();
    const headHash = headCommit ? headCommit.id.substring(0, 7) : '0000000';
    const headMsg = headCommit ? headCommit.message : 'initial';

    const savedWorking = new Map(this.workingTree);
    const savedIndex = new Map(this.index);

    this.stash.unshift({
      branch: this.getCurrentBranch() || 'detached',
      headHash,
      message: headMsg,
      workingTree: savedWorking,
      index: savedIndex
    });

    if (headCommit) {
      this.workingTree = new Map(headCommit.tree);
      this.index = new Map(headCommit.tree);
    } else {
      this.workingTree.clear();
      this.index.clear();
    }

    return {
      code: 0,
      output: `Saved working directory and index state WIP on ${this.getCurrentBranch()}: ${headHash} ${headMsg}\n`
    };
  }

  cleanCmd(args = []) {
    const isDryRun = args.includes('-n') || args.includes('-nd') || args.includes('-dn');
    const isForce = args.includes('-f') || args.includes('-fd') || args.includes('-df');

    if (!isForce && !isDryRun) {
      return { code: 1, output: 'fatal: clean.requireForce set and neither -i, -n, nor -f given; refusing to clean\n' };
    }

    const headTree = this.getHeadCommit() ? this.getHeadCommit().tree : new Map();
    const untracked = [];
    for (const [file] of this.workingTree.entries()) {
      if (!this.index.has(file) && !headTree.has(file)) {
        untracked.push(file);
      }
    }

    if (untracked.length === 0) {
      return { code: 0, output: '' };
    }

    let out = '';
    for (const f of untracked) {
      if (isDryRun) {
        out += `Would remove ${f}\n`;
      } else {
        this.workingTree.delete(f);
        out += `Removing ${f}\n`;
      }
    }
    return { code: 0, output: out };
  }

  mvCmd(args = []) {
    const nonFlags = args.filter(a => !a.startsWith('-'));
    if (nonFlags.length < 2) {
      return { code: 1, output: 'fatal: destination exists or missing destination\n' };
    }
    const [oldPath, newPath] = nonFlags;
    const content = this.workingTree.get(oldPath) || this.index.get(oldPath);
    if (content === undefined) {
      return { code: 1, output: `fatal: bad source, source=${oldPath}, destination=${newPath}\n` };
    }
    this.workingTree.delete(oldPath);
    this.index.delete(oldPath);
    this.workingTree.set(newPath, content);
    this.index.set(newPath, content);
    return { code: 0, output: `renamed: ${oldPath} -> ${newPath}\n` };
  }

  remoteCmd(args = []) {
    const sub = args[0];
    if (!sub || sub === '-v') {
      let out = '';
      for (const [name, rem] of Object.entries(this.remotes)) {
        out += `${name}\t${rem.url} (fetch)\n${name}\t${rem.url} (push)\n`;
      }
      return { code: 0, output: out };
    }
    if (sub === 'add') {
      const name = args[1];
      const url = args[2] || `https://github.com/upstream/${name}.git`;
      if (!name) return { code: 1, output: 'fatal: remote name required\n' };
      const existingBranches = (this.remotes[name] && this.remotes[name].branches) || new Map();
      this.remotes[name] = { url, branches: existingBranches };
      return { code: 0, output: '' };
    }
    if (sub === 'remove' || sub === 'rm') {
      const name = args[1];
      delete this.remotes[name];
      return { code: 0, output: '' };
    }
    return { code: 0, output: '' };
  }

  fetchCmd(args = []) {
    const remoteName = args.find(a => !a.startsWith('-')) || 'origin';
    const remote = this.remotes[remoteName];
    if (!remote) {
      return { code: 1, output: `fatal: '${remoteName}' does not appear to be a git repository\n` };
    }
    let out = `From ${remote.url || 'origin'}\n`;
    for (const [b, cId] of remote.branches.entries()) {
      out += ` * [new branch]      ${b} -> ${remoteName}/${b}\n`;
      this.branches.set(`${remoteName}/${b}`, cId);
    }
    if (args.includes('--prune') || args.includes('-p')) {
      for (const bName of Array.from(this.branches.keys())) {
        if (bName.startsWith(`${remoteName}/`)) {
          const shortB = bName.substring(`${remoteName}/`.length);
          if (!remote.branches.has(shortB)) {
            this.branches.delete(bName);
            out += ` x [pruned]          ${bName}\n`;
          }
        }
      }
    }
    return { code: 0, output: out };
  }

  restore(args = []) {
    if (typeof args === 'string') args = [args];
    if (!args || args.length === 0) {
      return { code: 1, output: 'fatal: you must specify path(s) to restore\n' };
    }

    let isStaged = args.includes('--staged') || args.includes('-S');
    let isWorktree = args.includes('--worktree') || args.includes('-W');
    if (!isStaged && !isWorktree) {
      isWorktree = true;
    }

    let sourceRev = null;
    const files = [];
    for (let i = 0; i < args.length; i++) {
      const a = args[i];
      if (a.startsWith('--source=')) {
        sourceRev = a.substring('--source='.length);
      } else if (a === '--source' && args[i + 1]) {
        sourceRev = args[i + 1];
        i++;
      } else if (a === '--staged' || a === '-S' || a === '--worktree' || a === '-W') {
        // flag
      } else if (!a.startsWith('-')) {
        files.push(a);
      }
    }

    if (files.length === 0) {
      return { code: 1, output: 'fatal: you must specify path(s) to restore\n' };
    }

    let srcTree = null;
    if (sourceRev) {
      const srcId = this.resolveCommit(sourceRev);
      if (!srcId) {
        return { code: 1, output: `fatal: invalid reference: ${sourceRev}\n` };
      }
      const c = this.commits.get(srcId);
      srcTree = c ? c.tree : new Map();
    }

    const headTree = this.getHeadCommit() ? this.getHeadCommit().tree : new Map();

    for (const file of files) {
      if (isStaged) {
        const treeForStaged = srcTree !== null ? srcTree : headTree;
        if (treeForStaged.has(file)) {
          this.index.set(file, treeForStaged.get(file));
        } else {
          this.index.delete(file);
        }
      }
      if (isWorktree) {
        const treeForWorktree = srcTree !== null ? srcTree : this.index;
        if (treeForWorktree.has(file)) {
          this.workingTree.set(file, treeForWorktree.get(file));
        } else if (headTree.has(file)) {
          this.workingTree.set(file, headTree.get(file));
        } else {
          return { code: 1, output: `error: pathspec '${file}' did not match any file(s) known to git\n` };
        }
      }
    }

    return { code: 0, output: '' };
  }

  computeLCS(linesA, linesB, ignoreSpace = false) {
    const cleanLine = (l) => ignoreSpace ? l.replace(/\s+/g, '') : l;
    const m = linesA.length, n = linesB.length;
    if (m === 0) return linesB.map(line => ({ type: 'add', text: line }));
    if (n === 0) return linesA.map(line => ({ type: 'del', text: line }));

    const dp = Array.from({ length: m + 1 }, () => new Uint16Array(n + 1));
    for (let i = 0; i < m; i++) {
      for (let j = 0; j < n; j++) {
        if (cleanLine(linesA[i]) === cleanLine(linesB[j])) {
          dp[i + 1][j + 1] = dp[i][j] + 1;
        } else {
          dp[i + 1][j + 1] = Math.max(dp[i + 1][j], dp[i][j + 1]);
        }
      }
    }

    const result = [];
    let i = m, j = n;
    while (i > 0 || j > 0) {
      if (i > 0 && j > 0 && cleanLine(linesA[i - 1]) === cleanLine(linesB[j - 1])) {
        result.unshift({ type: 'common', text: linesA[i - 1] });
        i--; j--;
      } else if (j > 0 && (i === 0 || dp[i][j - 1] >= dp[i - 1][j])) {
        result.unshift({ type: 'add', text: linesB[j - 1] });
        j--;
      } else if (i > 0 && (j === 0 || dp[i][j - 1] < dp[i - 1][j])) {
        result.unshift({ type: 'del', text: linesA[i - 1] });
        i--;
      }
    }
    return result;
  }

  formatDiffBetweenTrees(treeA, treeB, options = {}) {
    const allFiles = Array.from(new Set([...treeA.keys(), ...treeB.keys()])).sort();
    const fileFilter = options.fileFilter;
    const filteredFiles = fileFilter ? allFiles.filter(f => f === fileFilter) : allFiles;

    let totalInsertions = 0;
    let totalDeletions = 0;
    let diffBlocks = [];
    let statLines = [];

    for (const f of filteredFiles) {
      const textA = treeA.get(f);
      const textB = treeB.get(f);
      if (textA === textB) continue;

      const linesA = textA !== undefined ? (textA === '' ? [] : textA.split('\n')) : [];
      const linesB = textB !== undefined ? (textB === '' ? [] : textB.split('\n')) : [];
      if (linesA.length && linesA[linesA.length - 1] === '') linesA.pop();
      if (linesB.length && linesB[linesB.length - 1] === '') linesB.pop();

      const diffEntries = this.computeLCS(linesA, linesB, options.ignoreSpace);
      let ins = 0, del = 0;
      const hunk = [];
      for (const e of diffEntries) {
        if (e.type === 'common') {
          hunk.push(` ${e.text}`);
        } else if (e.type === 'del') {
          del++;
          hunk.push(`-${e.text}`);
        } else if (e.type === 'add') {
          ins++;
          hunk.push(`+${e.text}`);
        }
      }
      if (ins === 0 && del === 0) continue;

      totalInsertions += ins;
      totalDeletions += del;

      if (options.stat) {
        const plusMinus = '+'.repeat(Math.min(ins, 20)) + '-'.repeat(Math.min(del, 20));
        statLines.push(` ${f.padEnd(20)} | ${(ins + del).toString().padStart(3)} ${plusMinus}`);
      } else {
        let block = `diff --git a/${f} b/${f}\n`;
        if (textA === undefined) {
          block += `new file mode 100644\n--- /dev/null\n+++ b/${f}\n`;
        } else if (textB === undefined) {
          block += `deleted file mode 100644\n--- a/${f}\n+++ /dev/null\n`;
        } else {
          block += `--- a/${f}\n+++ b/${f}\n`;
        }
        block += `@@ -1,${linesA.length || 1} +1,${linesB.length || 1} @@\n`;
        block += hunk.join('\n') + '\n';
        diffBlocks.push(block);
      }
    }

    if (options.stat) {
      if (statLines.length === 0) return '';
      let summary = ` ${statLines.length} file(s) changed, ${totalInsertions} insertion(s)(+), ${totalDeletions} deletion(s)(-)\n`;
      return statLines.join('\n') + '\n' + summary;
    }

    return diffBlocks.join('');
  }

  diffCmd(args = []) {
    if (typeof args === 'string') args = [args];
    const isStaged = args.includes('--staged') || args.includes('--cached');
    const isStat = args.includes('--stat');
    const isIgnoreSpace = args.includes('-w') || args.includes('--ignore-all-space');

    const nonFlags = args.filter(a => !a.startsWith('-'));

    let treeA = null;
    let treeB = null;
    let fileFilter = null;

    const headTree = this.getHeadCommit() ? this.getHeadCommit().tree : new Map();

    const parsedRefs = [];
    for (const arg of nonFlags) {
      if (arg.includes('..')) {
        const parts = arg.split('..');
        const ref1 = this.resolveCommit(parts[0]);
        const ref2 = this.resolveCommit(parts[1]);
        if (ref1 && ref2) {
          treeA = this.commits.get(ref1)?.tree || new Map();
          treeB = this.commits.get(ref2)?.tree || new Map();
          continue;
        }
      }
      const resolved = this.resolveCommit(arg);
      if (resolved) {
        parsedRefs.push(resolved);
      } else {
        fileFilter = arg;
      }
    }

    if (!treeA && !treeB) {
      if (parsedRefs.length === 2) {
        treeA = this.commits.get(parsedRefs[0])?.tree || new Map();
        treeB = this.commits.get(parsedRefs[1])?.tree || new Map();
      } else if (parsedRefs.length === 1) {
        treeA = this.commits.get(parsedRefs[0])?.tree || new Map();
        treeB = this.workingTree;
      } else if (isStaged) {
        treeA = headTree;
        treeB = this.index;
      } else {
        treeA = this.index;
        treeB = this.workingTree;
      }
    }

    const out = this.formatDiffBetweenTrees(treeA, treeB, { fileFilter, stat: isStat, ignoreSpace: isIgnoreSpace });
    if (this.scenarioMeta && Array.isArray(this.scenarioMeta.observedCommands) && out.trim()) {
      if (!isStaged && args.length === 0 && out.includes('work in progress')) {
        this.scenarioMeta.observedCommands.push('diff');
      } else if (args.length === 1 && args[0] === '--staged' && out.includes('subtract')) {
        this.scenarioMeta.observedCommands.push('diff--staged');
      }
    }
    return { code: 0, output: out };
  }

  showCmd(args = []) {
    if (typeof args === 'string') args = [args];
    const target = args.find(a => !a.startsWith('-')) || 'HEAD';

    if (this.tags.has(target)) {
      const t = this.tags.get(target);
      const c = this.commits.get(t.commitId);
      let out = `tag ${target}\nTagger: ${t.tagger}\nDate:   ${new Date().toISOString()}\n\n    ${t.message}\n\n`;
      if (c) {
        out += `commit ${c.id}\nAuthor: ${c.author}\nDate:   ${new Date(c.timestamp).toISOString()}\n\n    ${c.message}\n\n`;
        const parentId = c.parents && c.parents[0];
        const parentTree = parentId ? (this.commits.get(parentId)?.tree || new Map()) : new Map();
        out += this.formatDiffBetweenTrees(parentTree, c.tree);
      }
      return { code: 0, output: out };
    }

    const commitId = this.resolveCommit(target);
    if (!commitId) {
      return { code: 1, output: `fatal: ambiguous argument '${target}': unknown revision or path not in the working tree.\n` };
    }

    const c = this.commits.get(commitId);
    if (!c) {
      return { code: 1, output: `fatal: bad object ${commitId}\n` };
    }
    if (this.scenarioMeta && Array.isArray(this.scenarioMeta.observedCommands) &&
        args.length === 1 && target === 'HEAD~1') {
      this.scenarioMeta.observedCommands.push('show');
    }

    let out = `commit ${c.id}\nAuthor: ${c.author}\nDate:   ${new Date(c.timestamp).toISOString()}\n\n    ${c.message}\n\n`;
    const parentId = c.parents && c.parents[0];
    const parentTree = parentId ? (this.commits.get(parentId)?.tree || new Map()) : new Map();
    out += this.formatDiffBetweenTrees(parentTree, c.tree);
    return { code: 0, output: out };
  }

  clone(remoteUrl = 'origin', dir = 'app') {
    const remote = 'origin';
    const remoteRepo = this.remotes[remote] || { branches: new Map() };
    this.branches.clear();
    for (const [bName, cId] of remoteRepo.branches.entries()) {
      this.branches.set(`${remote}/${bName}`, cId);
    }
    const defaultBranch = remoteRepo.branches.has('main') ? 'main' : (Array.from(remoteRepo.branches.keys())[0] || 'main');
    const tipId = remoteRepo.branches.get(defaultBranch);
    if (tipId) {
      this.branches.set(defaultBranch, tipId);
      this.HEAD = { type: 'branch', target: defaultBranch };
      const commit = this.commits.get(tipId);
      if (commit) {
        this.workingTree = new Map(commit.tree);
        this.index = new Map(commit.tree);
      }
      this.config[`branch.${defaultBranch}.remote`] = remote;
      this.config[`branch.${defaultBranch}.merge`] = `refs/heads/${defaultBranch}`;
    }
    if (this.scenarioMeta && this.scenarioMeta.cloneRequired) {
      this.scenarioMeta.clonePerformed = defaultBranch === 'main' && tipId === this.scenarioMeta.baseId;
    }
    return {
      code: 0,
      output: `Cloning into '${dir}'...\nremote: Enumerating objects: 3, done.\nremote: Total 3 (delta 0), reused 3 (delta 0)\nReceiving objects: 100% (3/3), done.\n`
    };
  }

  catFileCmd(args = []) {
    this.hasExecutedCatFile = true;
    const isType = args.includes('-t');
    const isPretty = args.includes('-p');
    const target = args.find(a => !a.startsWith('-')) || 'HEAD';

    let resolvedId = target;
    if (target === 'HEAD') {
      resolvedId = this.getHeadCommitId();
    } else if (this.branches.has(target)) {
      resolvedId = this.branches.get(target);
    }

    const commit = this.commits.get(resolvedId);
    if (commit) {
      if (isType) return { code: 0, output: 'commit\n' };
      if (isPretty) {
        const treeHash = `tree_${resolvedId.substring(0, 6)}`;
        let out = `tree ${treeHash}\n`;
        if (commit.parents && commit.parents.length) {
          commit.parents.forEach(p => out += `parent ${p}\n`);
        }
        out += `author ${commit.author} ${Math.floor(commit.timestamp/1000)} +0800\n`;
        out += `committer ${commit.author} ${Math.floor(commit.timestamp/1000)} +0800\n\n`;
        out += `${commit.message}\n`;
        return { code: 0, output: out };
      }
    }

    if (target.startsWith('tree_') || target.includes('tree')) {
      if (isType) return { code: 0, output: 'tree\n' };
      if (isPretty) {
        let out = '';
        const head = this.getHeadCommit();
        if (head && head.tree) {
          for (const [f] of head.tree.entries()) {
            const blobHash = `blob_${f.replace(/\W/g, '')}_${(head.id || 'c01').substring(0, 4)}`;
            out += `100644 blob ${blobHash}\t${f}\n`;
          }
        }
        return { code: 0, output: out || '100644 blob blob_app_c01\tapp.py\n' };
      }
    }

    if (target.startsWith('blob_') || target.includes('blob')) {
      if (isType) return { code: 0, output: 'blob\n' };
      if (isPretty) {
        const head = this.getHeadCommit();
        let content = '';
        if (head && head.tree) {
          for (const [f, c] of head.tree.entries()) {
            if (target.includes(f.replace(/\W/g, ''))) {
              content = c;
              break;
            }
          }
        }
        return { code: 0, output: content || 'SECRET_DATABASE_PAYLOAD = "VAULT_CORE_778899"\n' };
      }
    }

    return { code: 0, output: `commit ${resolvedId}\n` };
  }
}

// Export for browser and node
if (typeof window !== 'undefined') {
  window.VirtualGit = VirtualGit;
}
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { VirtualGit };
}
