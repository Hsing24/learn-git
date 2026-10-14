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
    this.initialized = true;
    this.hasInitialized = false;
    this.hasBlockedHook = false;
    this.hasBypassedHook = false;
    this.hasCreatedWorktree = false;
    this.hasStashConflict = false;
    this.hasExecutedArchaeology = false;
    this.hasExecutedCatFile = false;
    this.ffOnlyRejected = false;
    this.cleanDryRun = [];
    this.executableFiles = new Set();
    this.cloneDirectory = null;
    this.operationHistory = [];
    this.currentDirectory = '';
    this.operationEvidence = this.operationHistory;
    this.mainWorktree = null;
    this.cherryPickState = null;
    this.bisectFoundId = null;
    this.rerereRecorded = 0;
    this.rerereReused = 0;
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
    this.lastPush = null;
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
    this.conflictState = null; // null or { file: string, files?: string[], ourBranch: string, theirBranch: string }
    this.rebaseState = null; // Replay state, including conflict paths awaiting staging.
    this.commitCounter = 0;
  }

  init(args = []) {
    const wasInitialized = this.initialized;
    const b = args.indexOf('-b');
    const long = args.find(a => a.startsWith('--initial-branch='));
    if (!wasInitialized) this.HEAD = { type: 'branch', target: b >= 0 ? args[b + 1] : long ? long.split('=')[1] : 'main' };
    this.initialized = true;
    this.hasInitialized = true;
    this.operationHistory.push({ command: 'init', args: [...args] });
    return { code: 0, output: `${wasInitialized ? 'Reinitialized existing' : 'Initialized empty'} Git repository in workspace/.git/\n` };
  }

  markResolved(file) {
    this.cherryPickState?.unresolvedFiles.delete(file);
    this.conflictState?.unresolvedFiles?.delete(file);
  }

  // File-level three-way merge; separate files combine, competing content conflicts.
  mergeTrees(base, ours, theirs, label = 'incoming') {
    const tree = new Map(ours);
    const conflicts = [];
    for (const file of new Set([...base.keys(), ...ours.keys(), ...theirs.keys()])) {
      const before = base.get(file), our = ours.get(file), their = theirs.get(file);
      if (their === before || our === their) continue;
      if (our === before) {
        if (their === undefined) tree.delete(file); else tree.set(file, their);
      } else {
        conflicts.push(file);
        tree.set(file, `<<<<<<< HEAD\n${our ?? ''}\n=======\n${their ?? ''}\n>>>>>>> ${label}\n`);
      }
    }
    return { tree, conflicts };
  }

  ignoreMatch(file, noIndex = false) {
    if (!noIndex && this.index.has(file)) return null;
    let match = null;
    const parents = file.split('/');
    parents.pop();
    for (let depth = 1; depth <= parents.length; depth++) {
      const parent = this.ignoreMatch(parents.slice(0, depth).join('/'), true);
      if (parent && !parent.negate) return parent;
    }
    const sources = Array.from(this.workingTree.entries()).filter(([name]) => name === '.gitignore' || name.endsWith('/.gitignore')).sort(([a], [b]) => a.length - b.length);
    for (const [source, content] of sources) {
      const dir = source === '.gitignore' ? '' : source.slice(0, -10);
      if (dir && !file.startsWith(dir)) continue;
      const relative = dir ? file.slice(dir.length) : file;
      for (const [i, raw] of content.split('\n').entries()) {
        let pattern = raw.trim();
        if (!pattern || pattern.startsWith('#')) continue;
        const negate = pattern.startsWith('!');
        if (negate) pattern = pattern.slice(1);
        const directory = pattern.endsWith('/');
        if (directory) pattern = pattern.slice(0, -1);
        const anchored = pattern.startsWith('/');
        if (anchored) pattern = pattern.slice(1);
        const glob = pattern.replace(/[.+^${}()|[\]\\]/g, '\\$&').replace(/\*\*/g, '\u0000').replace(/\*/g, '[^/]*').replace(/\?/g, '[^/]').replace(/\u0000/g, '.*');
        const prefix = anchored || pattern.includes('/') ? '^' : '(^|/)';
        const regex = new RegExp(prefix + glob + (directory ? '(/|$)' : '$'));
        if (regex.test(relative)) match = { source, line: i + 1, pattern: raw.trim(), negate };
      }
    }
    return match;
  }

  isIgnored(file) { const match = this.ignoreMatch(file); return !!match && !match.negate; }

  checkIgnore(args = []) {
    this.operationHistory.push({ command: 'check-ignore', args: [...args] });
    const files = args.filter(a => !a.startsWith('-'));
    const output = files.map(file => {
      const match = this.ignoreMatch(file, args.includes('--no-index'));
      const verbose = args.includes('-v') || args.includes('--verbose');
      return !match || match.negate && !verbose ? '' : args.includes('-v') || args.includes('--verbose') ? `${match.source}:${match.line}:${match.pattern}\t${file}\n` : `${file}\n`;
    }).join('');
    return { code: output ? 0 : 1, output };
  }

  revParse(args = []) {
    this.operationHistory.push({ command: 'rev-parse', args: [...args] });
    const refs = args.filter(a => !a.startsWith('-'));
    let output = '';
    for (const ref of refs) {
      const id = this.resolveCommit(ref);
      if (!id) return { code: 1, output: `fatal: ambiguous argument '${ref}'\n` };
      output += id + '\n';
    }
    return { code: 0, output };
  }

  recordRerere() {
    if (this.config['rerere.enabled'] !== 'true' || !this.conflictState?.rerereKeys) return;
    for (const [file, key] of this.conflictState.rerereKeys) {
      const content = this.workingTree.get(file);
      if (content === undefined || /^(<<<<<<<|=======|>>>>>>>)/m.test(content)) continue;
      if (!this.rerereCache.has(key)) this.rerereRecorded++;
      this.rerereCache.set(key, content);
    }
  }

  rerereCmd(args = []) {
    this.operationHistory.push({ command: 'rerere', args: [...args] });
    if (args[0] === 'status') return { code: 0, output: Array.from(this.conflictState?.rerereKeys?.keys() || []).join('\n') + (this.conflictState ? '\n' : '') };
    if (args[0] === 'diff') {
      let output = '';
      for (const file of this.conflictState?.rerereKeys?.keys() || []) output += this.formatDiffBetweenTrees(this.index, this.workingTree, { fileFilter: file });
      return { code: 0, output };
    }
    this.recordRerere();
    return { code: 0, output: '' };
  }

  patchHunks(file) {
    const old = (this.index.get(file) || '').split('\n');
    const next = (this.workingTree.get(file) || '').split('\n');
    const entries = this.computeLCS(old, next);
    const hunks = [];
    let oldStart = 0, current = null;
    for (const entry of entries) {
      if (entry.type === 'common') { current = null; oldStart++; continue; }
      if (!current) { current = { index: hunks.length, oldStart, oldLines: [], newLines: [], diff: '' }; hunks.push(current); }
      if (entry.type === 'del') { current.oldLines.push(entry.text); oldStart++; current.diff += '-' + entry.text + '\n'; }
      if (entry.type === 'add') { current.newLines.push(entry.text); current.diff += '+' + entry.text + '\n'; }
    }
    return hunks;
  }

  addPatch(file, selectedIndices = [], displayedHunks = null) {
    const hunks = this.patchHunks(file);
    if (displayedHunks && JSON.stringify(displayedHunks) !== JSON.stringify(hunks)) return { code: 1, output: 'error: patch changed; run git add -p again\n' };
    const lines = (this.index.get(file) || '').split('\n');
    for (const hunk of hunks.slice().reverse()) if (selectedIndices.includes(hunk.index)) lines.splice(hunk.oldStart, hunk.oldLines.length, ...hunk.newLines);
    this.index.set(file, lines.join('\n'));
    this.operationHistory.push({ command: 'add-patch', args: [file, ...selectedIndices] });
    return { code: 0, output: '' };
  }

  untrackedFiles() {
    const headTree = this.getHeadCommit()?.tree || new Map();
    return new Map(Array.from(this.workingTree).filter(([file]) => !this.index.has(file) && !headTree.has(file)));
  }

  worktreeHeads() {
    return [
      { path: '', HEAD: this.currentDirectory === '' ? this.HEAD : this.mainWorktree?.HEAD },
      ...this.worktrees.map(w => ({ path: w.path, HEAD: this.currentDirectory === w.path ? this.HEAD : w.HEAD }))
    ];
  }

  prepareCheckout(targetTree) {
    const oldTree = this.getHeadCommit()?.tree || new Map();
    const bootstrap = this.reflog.length === 0 && !this.index.size && !this.workingTree.size;
    const nextIndex = new Map(this.index), nextWorking = new Map(this.workingTree);
    for (const file of new Set([...oldTree.keys(), ...targetTree.keys(), ...this.index.keys(), ...this.workingTree.keys()])) {
      const old = bootstrap ? undefined : oldTree.get(file), target = targetTree.get(file);
      const staged = this.index.get(file), working = this.workingTree.get(file);
      if (old === target) continue;
      const untracked = old === undefined && staged === undefined && working !== undefined;
      if (untracked && target !== undefined || staged !== old && staged !== target || working !== staged && working !== target && staged !== target) {
        return { code: 1, output: `error: Your local changes to '${file}' would be overwritten by checkout.\n` };
      }
      if (staged === target && !bootstrap) continue;
      if (target === undefined) { nextIndex.delete(file); nextWorking.delete(file); }
      else { nextIndex.set(file, target); nextWorking.set(file, target); }
    }
    for (const file of this.workingTree.keys()) {
      if (this.index.has(file) || oldTree.has(file)) continue;
      if (Array.from(targetTree.keys()).some(target => target.startsWith(file + '/') || file.startsWith(target + '/'))) return { code: 1, output: `error: Untracked path '${file}' would be overwritten by checkout.\n` };
    }
    return { code: 0, index: nextIndex, workingTree: nextWorking };
  }

  changeDirectory(path) {
    if (path === '.') return { code: 0, output: '' };
    if (path === this.cloneDirectory) return { code: 0, output: '' };
    const target = path === '..' || path === 'workspace' || path === '.' && !this.currentDirectory ? '' : path;
    if (target === this.currentDirectory) return { code: 0, output: '' };
    const next = target === '' ? this.mainWorktree : this.worktrees.find(w => w.path === target);
    if (!next) return { code: 1, output: `cd: ${path}: No such directory\n` };
    const snapshot = { HEAD: { ...this.HEAD }, index: new Map(this.index), workingTree: new Map(this.workingTree), conflictState: this.conflictState, rebaseState: this.rebaseState, cherryPickState: this.cherryPickState };
    if (this.currentDirectory === '') this.mainWorktree = snapshot;
    else Object.assign(this.worktrees.find(w => w.path === this.currentDirectory), snapshot, { branch: this.getCurrentBranch(), commitId: this.getHeadCommitId() });
    this.HEAD = { ...next.HEAD };
    this.index = new Map(next.index);
    this.workingTree = new Map(next.workingTree);
    this.conflictState = next.conflictState || null;
    this.rebaseState = next.rebaseState || null;
    this.cherryPickState = next.cherryPickState || null;
    this.currentDirectory = target;
    return { code: 0, output: '' };
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
          if (!this.isIgnored(file)) untracked.push(file);
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
      unmergedFiles: this.rebaseState ? Array.from(this.rebaseState.unresolvedFiles || []) : Array.from(this.cherryPickState?.unresolvedFiles || this.conflictState?.unresolvedFiles || []),
      bisect: this.bisectState.active,
      rebaseInProgress: !!this.rebaseState,
      rebaseCurrent: this.rebaseState ? this.rebaseState.commitsToReplay[this.rebaseState.currentReplayIndex] : null
    };
  }

  get cherryPickInProgress() { return !!this.cherryPickState; }

  get mergeInProgress() { return !!this.conflictState && !this.cherryPickState && this.conflictState.kind !== 'stash'; }

  get rebaseInProgress() {
    return !!this.rebaseState;
  }

  add(args) {
    if (!this.initialized) return { code: 1, output: 'fatal: not a git repository (or any of the parent directories): .git\n' };
    if (!args || args.length === 0) {
      return { code: 1, output: 'Nothing specified, nothing added.\n' };
    }

    if (args.includes('-p') || args.includes('--patch')) {
      const targetFile = args.find(a => !a.startsWith('-')) || 'shopping.py';
      if (!this.workingTree.has(targetFile)) return { code: 1, output: `fatal: pathspec '${targetFile}' did not match any files\n` };
      const hunks = this.patchHunks(targetFile);
      return { code: 0, output: hunks.map(h => h.diff).join(''), isPatchPrompt: true, file: targetFile, patch: { file: targetFile, hunks } };
    }

    if (args.includes('.') || args.includes('-A') || args.includes('--all')) {
      const stagedPaths = new Set();
      for (const [file, content] of this.workingTree.entries()) {
        if (!this.index.has(file) && this.isIgnored(file)) continue;
        this.index.set(file, content);
        stagedPaths.add(file);
      }
      for (const file of Array.from(this.index.keys())) {
        if (!this.workingTree.has(file)) { this.index.delete(file); stagedPaths.add(file); }
      }
      for (const file of this.rebaseState?.unresolvedFiles || []) {
        if (!this.workingTree.has(file)) {
          this.index.delete(file);
          stagedPaths.add(file);
        }
      }
      for (const file of stagedPaths) {
        this.markResolved(file);
        if (this.rebaseState?.conflictFiles?.has(file)) {
          this.rebaseState.unresolvedFiles.delete(file);
        }
      }
      return { code: 0, output: '' };
    }

    // Add specific files
    let addedCount = 0;
    for (const file of args) {
      if (this.workingTree.has(file)) {
        if (!this.index.has(file) && this.isIgnored(file) && !args.includes('-f')) {
          return { code: 1, output: `The following paths are ignored by one of your .gitignore files:\n${file}\n` };
        }
        this.index.set(file, this.workingTree.get(file));
        this.markResolved(file);
        addedCount++;
        if (this.rebaseState?.conflictFiles?.has(file)) {
          this.rebaseState.unresolvedFiles.delete(file);
        }
      } else if (this.index.has(file) || this.rebaseState?.unresolvedFiles?.has(file)) {
        // File deleted in working tree
        this.index.delete(file);
        this.markResolved(file);
        addedCount++;
        if (this.rebaseState?.conflictFiles?.has(file)) {
          this.rebaseState.unresolvedFiles.delete(file);
        }
      }
    }

    if (addedCount === 0) {
      return { code: 1, output: `fatal: pathspec did not match any files\n` };
    }
    return { code: 0, output: '' };
  }

  commit(args = []) {
    if (!this.initialized) return { code: 1, output: 'fatal: not a git repository (or any of the parent directories): .git\n' };
    if (this.rebaseState) {
      return {
        code: 1,
        output: "error: a rebase is in progress; stage resolved paths and run 'git rebase --continue'\n"
      };
    }

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
    if (this.hooks.has('pre-commit') && args.includes('--no-verify')) this.hasBypassedHook = true;
    const hookPath = this.config['core.hooksPath'];
    const hookActive = this.hooks.has('pre-commit') && (!this.workingTree.has('.githooks/pre-commit') || hookPath === '.githooks' && this.executableFiles?.has('.githooks/pre-commit'));
    if (hookActive && !args.includes('--no-verify')) {
      // Simulate the configured lesson's staged secret check
      for (const [file, content] of this.index.entries()) {
        if (/PRIVATE_KEY|AWS_SECRET|API_TOKEN|AKIA[0-9A-Z]{16}/i.test(content)) {
          this.hasBlockedHook = true;
          this.operationHistory.push({ command: 'hook-blocked', args: [file] });
          return {
            code: 1,
            output: `🔍 正在執行 pre-commit 程式碼安全檢查...\n❌ [安全警報] 檢測到暫存程式碼中包含敏感金鑰 (PRIVATE_KEY / AWS_SECRET / API_TOKEN)！\n🚨 Git Hook 已攔截此次提交，請移至環境變數 (.env) 後重試。\ncommit failed.`
          };
        }
      }
    }

    if (this.cherryPickState) return this.cherryPick('--continue');

    if (this.conflictState) {
      const unresolved = Array.from(this.conflictState.unresolvedFiles || []);
      if (unresolved.length) return { code: 1, output: `error: unresolved paths: ${unresolved.join(', ')}\n` };
      this.recordRerere();
      // Resolving a merge conflict
      const parent1 = this.getHeadCommitId();
      const parent2 = this.conflictState.theirCommitId;
      const finalMsg = message || `Merge branch '${this.conflictState.theirBranch}' into ${this.getCurrentBranch()}`;
      
      const commit = this.createCommit({
        message: finalMsg,
        parents: this.conflictState.kind === 'stash' ? [parent1] : [parent1, parent2],
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

    if (!args.includes('--allow-empty') && this.diffTrees(this.getHeadCommit()?.tree || new Map(), this.index).upsert.size === 0 && this.diffTrees(this.getHeadCommit()?.tree || new Map(), this.index).remove.length === 0) {
      return { code: 1, output: 'nothing to commit, working tree clean\n' };
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
      if (!newName) return { code: 1, output: 'fatal: new branch name required\n' };
      if (newName !== oldName && this.branches.has(newName) && (args[0] !== '-M' || this.worktreeHeads().some(w => w.HEAD?.type === 'branch' && w.HEAD.target === newName))) return { code: 1, output: `fatal: branch '${newName}' already exists or is checked out\n` };
      const cId = this.branches.get(oldName);
      this.branches.delete(oldName);
      this.branches.set(newName, cId);
      if (this.HEAD.type === 'branch' && this.HEAD.target === oldName) {
        this.HEAD.target = newName;
      }
      for (const context of [this.mainWorktree, ...this.worktrees]) {
        if (context?.HEAD.type === 'branch' && context.HEAD.target === oldName) context.HEAD.target = newName;
        if (context?.branch === oldName) context.branch = newName;
      }
      for (const key of Object.keys(this.config)) if (key.startsWith(`branch.${oldName}.`)) {
        this.config[`branch.${newName}.${key.slice(`branch.${oldName}.`.length)}`] = this.config[key]; delete this.config[key];
      }
      if (this.previousBranch === oldName) this.previousBranch = newName;
      return { code: 0, output: '' };
    }

    // Branch deletion
    if (args[0] === '-d' || args[0] === '-D') {
      const target = args[1];
      if (!target) return { code: 1, output: 'fatal: branch name required\n' };
      if (this.worktreeHeads().some(w => w.HEAD?.type === 'branch' && w.HEAD.target === target)) {
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
    if (this.conflictState || this.rebaseState || this.cherryPickState) return { code: 1, output: 'error: resolve the current operation before switching branches\n' };
    if (isCreate && this.branches.has(target)) return { code: 1, output: `fatal: A branch named '${target}' already exists.\n` };
    if (!isDetach && this.worktreeHeads().some(w => w.path !== this.currentDirectory && w.HEAD?.type === 'branch' && w.HEAD.target === target)) return { code: 1, output: `fatal: '${target}' is already checked out in another worktree\n` };
    const desiredId = isCreate ? this.getHeadCommitId() : this.resolveCommit(target);
    if (!isCreate && !desiredId) return { code: 1, output: `error: invalid reference '${target}'\n` };
    const prepared = this.prepareCheckout(this.commits.get(desiredId)?.tree || new Map());
    if (prepared.code) return prepared;

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
      this.workingTree = prepared.workingTree;
      this.index = prepared.index;
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
      this.workingTree = prepared.workingTree;
      this.index = prepared.index;
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

    if (this.isAncestor(targetCommitId, currentCommitId)) return { code: 0, output: 'Already up to date.\n' };
    if (options.ffOnly && !this.isAncestor(currentCommitId, targetCommitId)) {
      this.ffOnlyRejected = true;
      return { code: 1, output: 'fatal: Not possible to fast-forward, aborting.\n' };
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

    const baseId = this.getMergeBase(currentCommitId, targetCommitId);
    const baseTree = this.commits.get(baseId)?.tree || new Map();
    const merged = this.mergeTrees(baseTree, this.getHeadCommit()?.tree || new Map(), this.commits.get(targetCommitId)?.tree || new Map(), actualBranch);
    if (options.simulateConflict && merged.conflicts.length === 0) {
      const file = options.conflictFile || 'style.css';
      merged.conflicts.push(file);
      merged.tree.set(file, `<<<<<<< HEAD\n${this.workingTree.get(file) || ''}\n=======\n${this.commits.get(targetCommitId)?.tree.get(file) || ''}\n>>>>>>> ${actualBranch}\n`);
    }
    this.workingTree = new Map(merged.tree);
    this.index = new Map(merged.tree);
    if (merged.conflicts.length) {
      this.conflictState = {
        file: merged.conflicts[0], files: merged.conflicts,
        unresolvedFiles: new Set(merged.conflicts),
        ourBranch: currentBranch, theirBranch: actualBranch, theirCommitId: targetCommitId,
        rerereKeys: new Map()
      };
      for (const file of merged.conflicts) {
        const key = JSON.stringify([file, baseTree.get(file), this.getHeadCommit()?.tree.get(file), this.commits.get(targetCommitId)?.tree.get(file)]);
        this.conflictState.rerereKeys.set(file, key);
        if (this.config['rerere.enabled'] === 'true' && this.rerereCache.has(key)) {
          this.workingTree.set(file, this.rerereCache.get(key));
          this.rerereReused++;
        }
      }
      return { code: 1, output: merged.conflicts.map(file => `Auto-merging ${file}\nCONFLICT (content): Merge conflict in ${file}\n`).join('') + (this.rerereReused ? 'Resolved using previous resolution.\n' : '') + 'Automatic merge failed; fix conflicts and then commit the result.\n' };
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
    const tildeMatch = r.match(/^(.+?)~(\d*)$/);
    if (tildeMatch) {
      const baseId = this.resolveCommit(tildeMatch[1]);
      if (!baseId) return null;
      const steps = tildeMatch[2] ? parseInt(tildeMatch[2], 10) : 1;
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
      if (caretMatch[2] === '0') return baseId;
      const parentIdx = caretMatch[2] ? (parseInt(caretMatch[2], 10) - 1) : 0;
      const curr = this.commits.get(baseId);
      if (!curr || !curr.parents || curr.parents[parentIdx] === undefined) return null;
      return curr.parents[parentIdx];
    }

    if (r.endsWith('^{commit}') || r.endsWith('^{}')) return this.resolveCommit(r.replace(/\^\{(?:commit)?\}$/, ''));
    if (r.startsWith('refs/heads/')) return this.branches.get(r.slice(11)) || null;
    if (r.startsWith('refs/tags/')) return this.tags.get(r.slice(10))?.commitId || null;

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
      const matches = Array.from(this.commits.keys()).filter(id => id.startsWith(r));
      if (matches.length === 1) return matches[0];
    }

    return null;
  }

  rebase(upstream, options = {}) {
    this.operationHistory.push({ command: 'rebase', args: [upstream] });
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
      const baseCommit = this.commits.get(this.rebaseState.newBaseId);
      if (baseCommit) {
        this.workingTree = new Map(baseCommit.tree);
        this.index = new Map(baseCommit.tree);
      }
      this.conflictState = null;
      this.rebaseState.conflictFiles.clear();
      this.rebaseState.unresolvedFiles.clear();
      this.rebaseState.currentReplayIndex++;
      return this.continueReplayingCommits();
    }

    if (upstream === '--continue' || options.continue) {
      if (!this.rebaseState) {
        return { code: 1, output: 'fatal: No rebase in progress?\n' };
      }
      if (this.conflictState) {
        const unresolved = Array.from(this.rebaseState.unresolvedFiles || []);
        if (unresolved.length > 0) {
          return {
            code: 1,
            output: `error: cannot continue because these paths are not staged as resolved: ${unresolved.join(', ')}\nhint: Resolve each path and use 'git add/rm <file>' before 'git rebase --continue'.\n`
          };
        }
        for (const conflictFile of this.rebaseState.conflictFiles || []) {
          const indexHas = this.index.has(conflictFile);
          const worktreeHas = this.workingTree.has(conflictFile);
          if (indexHas !== worktreeHas || (indexHas && this.index.get(conflictFile) !== this.workingTree.get(conflictFile))) {
            return {
              code: 1,
              output: `error: ${conflictFile} has unstaged changes after conflict resolution\nhint: Stage the final content with 'git add ${conflictFile}' before 'git rebase --continue'.\n`
            };
          }
        }
        const c = this.rebaseState.commitsToReplay[this.rebaseState.currentReplayIndex];
        const replayed = this.createCommit({
          message: c.message,
          parents: [this.rebaseState.newBaseId],
          tree: new Map(this.index)
        });
        this.rebaseState.newBaseId = replayed.id;
        this.rebaseState.currentReplayIndex++;
        this.HEAD = { type: 'detached', target: replayed.id };
        this.rebaseState.conflictFiles.clear();
        this.rebaseState.unresolvedFiles.clear();
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
      currentReplayIndex: 0,
      conflictFiles: new Set(),
      unresolvedFiles: new Set()
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

      // Detect all paths changed on both sides since the replay commit's parent.
      const conflictFiles = [];
      for (const [file, content] of changes.upsert) {
        const baseHasFile = baseTree.has(file);
        const parentHasFile = origParentTree.has(file);
        const upstreamChanged = baseHasFile !== parentHasFile || (parentHasFile && baseTree.get(file) !== origParentTree.get(file));
        if (upstreamChanged && (!baseHasFile || baseTree.get(file) !== content)) {
          conflictFiles.push(file);
        }
      }
      for (const file of changes.remove) {
        const baseHasFile = baseTree.has(file);
        const parentHasFile = origParentTree.has(file);
        const upstreamChanged = baseHasFile !== parentHasFile || (parentHasFile && baseTree.get(file) !== origParentTree.get(file));
        if (upstreamChanged && baseHasFile) conflictFiles.push(file);
      }

      if (conflictFiles.length > 0) {
        const newTree = this.applyChanges(baseTree, changes);
        for (const file of conflictFiles) {
          if (baseTree.has(file)) newTree.set(file, baseTree.get(file));
          else newTree.delete(file);
        }
        this.index = new Map(newTree);
        this.workingTree = new Map(newTree);

        const conflictVersions = new Map();
        for (const file of conflictFiles) {
          const ourContent = baseTree.has(file) ? baseTree.get(file) : '';
          const theirContent = c.tree.has(file) ? c.tree.get(file) : '';
          conflictVersions.set(file, { ours: ourContent, theirs: theirContent });
          const conflictContent = `<<<<<<< HEAD\n${ourContent}\n=======\n${theirContent}\n>>>>>>> ${c.message}\n`;
          this.workingTree.set(file, conflictContent);
        }

        this.rebaseState.conflictFiles = new Set(conflictFiles);
        this.rebaseState.unresolvedFiles = new Set(conflictFiles);
        this.conflictState = {
          file: conflictFiles[0],
          files: conflictFiles.slice(),
          conflictVersions,
          ourBranch: 'HEAD',
          theirBranch: c.message
        };
        this.HEAD = { type: 'detached', target: this.rebaseState.newBaseId };
        const conflictList = conflictFiles.join(', ');
        return {
          code: 1,
          output: `Auto-merging ${conflictList}\nCONFLICT (content): Merge conflict in ${conflictList}\nerror: could not apply ${c.id.substring(0, 7)}... ${c.message}\nhint: Resolve all conflicts manually, mark them as resolved with\nhint: "git add/rm <conflicted_files>", then run "git rebase --continue".\nhint: You can instead skip this commit: run "git rebase --skip".\nhint: To abort and get back to the state before "git rebase", run "git rebase --abort".\n`
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
      currentReplayIndex: 0,
      conflictFiles: new Set(),
      unresolvedFiles: new Set()
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
    const untracked = this.untrackedFiles();
    if (Array.isArray(commitHash)) commitHash = commitHash[0];
    this.operationHistory.push({ command: 'cherry-pick', args: [commitHash] });
    if (commitHash === '--abort') {
      if (!this.cherryPickState) return { code: 1, output: 'error: no cherry-pick in progress\n' };
      const original = this.cherryPickState;
      this.HEAD = { ...original.originalHead };
      this.index = new Map(original.originalIndex);
      this.workingTree = new Map(original.originalWorkingTree);
      this.cherryPickState = null;
      this.conflictState = null;
      return { code: 0, output: '' };
    }
    let target, newTree;
    if (commitHash === '--continue') {
      if (!this.cherryPickState) return { code: 1, output: 'error: no cherry-pick in progress\n' };
      if (this.cherryPickState.unresolvedFiles.size) return { code: 1, output: 'error: resolve conflicts and stage them before continuing\n' };
      target = this.commits.get(this.cherryPickState.targetId);
      newTree = new Map(this.index);
    } else {
      if (this.cherryPickState) return { code: 1, output: 'error: cherry-pick already in progress\n' };
      target = this.commits.get(this.resolveCommit(commitHash));
      if (!target) return { code: 1, output: `fatal: bad revision '${commitHash}'\n` };
      const baseTree = this.commits.get(target.parents[0])?.tree || new Map();
      const merged = this.mergeTrees(baseTree, this.getHeadCommit()?.tree || new Map(), target.tree, target.id);
      newTree = merged.tree;
      if (merged.conflicts.length) {
        this.cherryPickState = { targetId: target.id, originalHead: { ...this.HEAD }, originalIndex: new Map(this.index), originalWorkingTree: new Map(this.workingTree), unresolvedFiles: new Set(merged.conflicts) };
        this.conflictState = { kind: 'cherry-pick', file: merged.conflicts[0], files: merged.conflicts, unresolvedFiles: this.cherryPickState.unresolvedFiles };
        this.index = new Map(newTree);
        this.workingTree = new Map([...untracked, ...newTree]);
        return { code: 1, output: `CONFLICT (content): Merge conflict in ${merged.conflicts.join(', ')}\nerror: could not apply ${target.id}... ${target.message}\n` };
      }
    }
    const headId = this.getHeadCommitId();
    const newCommit = this.createCommit({ message: target.message, parents: headId ? [headId] : [], tree: newTree });
    if (this.HEAD.type === 'branch') this.branches.set(this.HEAD.target, newCommit.id);
    else this.HEAD.target = newCommit.id;
    this.index = new Map(newTree);
    this.workingTree = new Map([...untracked, ...newTree]);
    this.cherryPickState = null;
    this.conflictState = null;
    this.logReflog('cherry-pick', target.message);
    return { code: 0, output: `[${this.getCurrentBranch() || 'detached HEAD'} ${newCommit.id}] ${target.message}\n` };
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

    if (this.remotes[remote].authError) return { code: 1, output: `${this.remotes[remote].authError}\n` };
    const remoteId = this.remotes[remote].branches.get(remoteBranch);
    if (!remoteId) {
      return { code: 1, output: `fatal: couldn't find remote ref ${remoteBranch}\n` };
    }
    this.branches.set(`${remote}/${remoteBranch}`, remoteId);

    const localId = this.branches.get(currentBranch);
    this.operationHistory.push({ command: 'pull', args: [...args] });
    const useRebase = args.includes('--rebase') || (!args.includes('--no-rebase') && this.config['pull.rebase'] === 'true');
    if (args.includes('--ff-only') && !this.isAncestor(localId, remoteId) && !this.isAncestor(remoteId, localId)) {
      this.ffOnlyRejected = true;
      return { code: 1, output: 'fatal: Not possible to fast-forward, aborting.\n' };
    }

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
    this.lastPush = null;
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

    if (this.remotes[remote].authError) return { code: 1, output: `${this.remotes[remote].authError}\n` };
    const localId = this.branches.get(targetBranch) || (targetBranch === currentBranch ? this.getHeadCommitId() : null);
    if (!localId) {
      return { code: 1, output: `error: src refspec ${targetBranch} does not match any\n` };
    }

    const remoteId = this.remotes[remote].branches.get(targetBranch);
    const expectedRemoteId = this.branches.get(`${remote}/${targetBranch}`) || null;

    const onPushSuccess = (outputMessage) => {
      this.remotes[remote].branches.set(targetBranch, localId);
      this.branches.set(`${remote}/${targetBranch}`, localId);
      this.lastPush = {
        remote,
        targetBranch,
        localId,
        remoteIdBefore: remoteId || null,
        expectedRemoteId,
        force,
        forceWithLease: lease && !force
      };
      if (setUpstream) {
        this.config[`branch.${targetBranch}.remote`] = remote;
        this.config[`branch.${targetBranch}.merge`] = `refs/heads/${targetBranch}`;
        outputMessage += `Branch '${targetBranch}' set up to track remote branch '${targetBranch}' from '${remote}'.\n`;
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
      if (!trackingRefId || trackingRefId !== remoteId) {
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
    this.operationHistory.push({ command: 'reset', args: [mode, target] });
    const targetCommitId = this.resolveCommit(target);

    if (!targetCommitId) {
      return { code: 1, output: `fatal: Cannot resolve '${target}' as a valid commit.\n` };
    }

    const targetCommit = this.commits.get(targetCommitId);
    if (mode === '--soft' && (this.conflictState || this.cherryPickState || this.rebaseState)) return { code: 1, output: 'fatal: Cannot do a soft reset in the middle of an unresolved operation.\n' };
    const previousTree = this.getHeadCommit()?.tree || new Map();
    const untracked = new Map(Array.from(this.workingTree).filter(([file]) => !this.index.has(file) && !previousTree.has(file)));
    if (mode !== '--soft') { this.cherryPickState = null; this.conflictState = null; }

    if (mode === '--hard') {
      this.workingTree = new Map(targetCommit.tree);
      for (const [file, content] of untracked) if (!Array.from(targetCommit.tree.keys()).some(target => target === file || target.startsWith(file + '/') || file.startsWith(target + '/'))) this.workingTree.set(file, content);
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
    // Apply the inverse change to HEAD, preserving later unrelated changes.
    const parentNumber = options.mainline ? Number(options.mainline) : 1;
    if (parentNumber < 1 || parentNumber > Math.max(1, targetCommit.parents.length)) return { code: 1, output: 'error: invalid mainline parent\n' };
    const parent1Id = targetCommit.parents[parentNumber - 1];
    const parent1 = this.commits.get(parent1Id);
    const inverse = this.mergeTrees(targetCommit.tree, this.getHeadCommit()?.tree || new Map(), parent1?.tree || new Map(), 'revert');
    if (inverse.conflicts.length) return { code: 1, output: `error: revert conflicts in ${inverse.conflicts.join(', ')}\n` };
    const revertedTree = inverse.tree;

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

    const remoteTrackingPrefixes = Object.keys(this.remotes).map(remote => `${remote}/`);
    const isRemoteTrackingRef = (name) => remoteTrackingPrefixes.some(prefix => name.startsWith(prefix));
    const rewritten = new Map();
    let rewrittenCount = 0;

    const rewriteCommit = (oldId) => {
      if (!oldId) return oldId;
      if (rewritten.has(oldId)) return rewritten.get(oldId);

      const commit = this.commits.get(oldId);
      if (!commit) {
        rewritten.set(oldId, oldId);
        return oldId;
      }

      const oldParents = commit.parents || [];
      const newParents = oldParents.map(rewriteCommit);
      const newTree = new Map(commit.tree || []);
      const removedPath = newTree.delete(targetPath);
      const parentChanged = newParents.some((parent, index) => parent !== oldParents[index]);

      if (!removedPath && !parentChanged) {
        rewritten.set(oldId, oldId);
        return oldId;
      }

      const newCommit = this.createCommit({
        message: commit.message,
        parents: newParents,
        tree: newTree,
        author: commit.author
      });
      rewritten.set(oldId, newCommit.id);
      rewrittenCount++;
      return newCommit.id;
    };

    // Rewrite refs owned by this repository. Keep remote-tracking refs as the
    // expected lease values, and leave the remote server's refs and old objects intact.
    for (const [name, commitId] of this.branches.entries()) {
      if (!isRemoteTrackingRef(name)) {
        this.branches.set(name, rewriteCommit(commitId));
      }
    }
    for (const tag of this.tags.values()) {
      tag.commitId = rewriteCommit(tag.commitId);
    }
    if (this.HEAD.type === 'detached') {
      this.HEAD.target = rewriteCommit(this.HEAD.target);
    }

    this.workingTree.delete(targetPath);
    this.index.delete(targetPath);
    this.logReflog('filter-repo', `rewrote history removing ${targetPath}`);

    return {
      code: 0,
      output: `Parsed ${this.commits.size} commits\nRewrote ${rewrittenCount} commits removing '${targetPath}'\nNew history written; now repacking\nCompletely finished.\n`
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

    targetCommit = this.resolveCommit(targetCommit);
    if (!targetCommit) return { code: 1, output: 'fatal: failed to resolve tag target\n' };

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
      const mainHead = this.currentDirectory ? this.mainWorktree?.HEAD : this.HEAD;
      const mainId = mainHead?.type === 'branch' ? this.branches.get(mainHead.target) : mainHead?.target;
      let output = `workspace  ${mainId} [${mainHead?.target || 'detached'}]\n`;
      for (const wt of this.worktrees) output += `${wt.path}  ${this.branches.get(wt.branch)} [${wt.branch}]\n`;
      return { code: 0, output };
    }
    if (sub === 'add') {
      const create = args.indexOf('-b');
      const positionals = args.slice(1).filter((a, i) => !a.startsWith('-') && args[i] !== '-b');
      const dir = positionals[0];
      const branchName = create >= 0 ? args[create + 1] : positionals[1];
      const start = create >= 0 ? positionals[1] || 'HEAD' : branchName;
      if (!dir || !branchName) return { code: 1, output: 'usage: git worktree add [-b <branch>] <path> [<start-point>]\n' };
      if (this.worktrees.some(w => w.path === dir)) return { code: 1, output: `fatal: '${dir}' already exists\n` };
      if (create >= 0 && this.branches.has(branchName)) return { code: 1, output: `fatal: branch '${branchName}' already exists\n` };
      const commitId = this.resolveCommit(start);
      if (!commitId) return { code: 1, output: `fatal: invalid reference: ${start}\n` };
      if (this.worktreeHeads().some(w => w.HEAD?.type === 'branch' && w.HEAD.target === branchName)) return { code: 1, output: `fatal: '${branchName}' is already checked out\n` };
      if (create >= 0) this.branches.set(branchName, commitId);
      const tree = this.commits.get(commitId).tree;
      this.hasCreatedWorktree = true;
      this.worktrees.push({ path: dir, branch: branchName, commitId, HEAD: { type: 'branch', target: branchName }, workingTree: new Map(tree), index: new Map(tree) });
      return { code: 0, output: `Preparing worktree (new working tree at '${dir}')\nHEAD is now at ${commitId}\n` };
    }
    if (sub === 'remove') {
      const dir = args.find((a, i) => i > 0 && !a.startsWith('-'));
      const wt = this.worktrees.find(w => w.path === dir);
      if (!wt) return { code: 1, output: `fatal: '${dir}' is not a worktree\n` };
      if (this.currentDirectory === dir) return { code: 1, output: 'fatal: cannot remove the current worktree\n' };
      const headId = wt.HEAD.type === 'branch' ? this.branches.get(wt.HEAD.target) : wt.HEAD.target;
      const staged = this.diffTrees(this.commits.get(headId)?.tree || new Map(), wt.index);
      const dirty = this.diffTrees(wt.index, wt.workingTree);
      if (!args.includes('--force') && (staged.upsert.size || staged.remove.length || dirty.upsert.size || dirty.remove.length)) return { code: 1, output: `fatal: '${dir}' contains modified or untracked files\n` };
      this.worktrees.splice(this.worktrees.indexOf(wt), 1);
      return { code: 0, output: `Removed worktree '${dir}'\n` };
    }
    return { code: 1, output: `Unknown worktree command '${sub}'\n` };
  }

  bisect(args = []) {
    this.operationHistory.push({ command: 'bisect', args: [...args] });
    const sub = args[0];
    if (sub === 'start') {
      this.bisectFoundId = null;
      this.bisectState = { active: true, good: [], bad: null, current: this.getHeadCommitId(), originalHead: { ...this.HEAD } };
      if (args[1]) this.bisectState.bad = this.resolveCommit(args[1]);
      if (args[2]) this.bisectState.good.push(this.resolveCommit(args[2]));
      return this.stepBisect();
    }
    if (sub === 'reset') {
      if (!this.bisectState.active) return { code: 1, output: 'error: We are not bisecting.\n' };
      const original = this.bisectState.originalHead;
      this.bisectState.active = false;
      const target = args[1] || original?.target || 'main';
      const result = this.checkoutOrSwitch(target, false, original?.type === 'detached');
      return result;
    }
    if (!this.bisectState.active) return { code: 1, output: 'error: You need to start by "git bisect start"\n' };
    if (sub === 'bad' || sub === 'good') {
      const target = this.resolveCommit(args[1] || 'HEAD');
      if (!target) return { code: 1, output: `fatal: bad revision '${args[1]}'\n` };
      if (sub === 'bad') this.bisectState.bad = target;
      else if (!this.bisectState.good.includes(target)) this.bisectState.good.push(target);
      return this.stepBisect();
    }
    return { code: 1, output: `Unknown bisect command '${sub}'\n` };
  }

  stepBisect() {
    if (!this.bisectState.bad || this.bisectState.good.length === 0) return { code: 0, output: 'Waiting for both good and bad commit markers...\n' };
    const excluded = new Set();
    for (const good of this.bisectState.good) for (const id of this.getReachableCommits(good)) excluded.add(id);
    const candidates = Array.from(this.getReachableCommits(this.bisectState.bad)).filter(id => !excluded.has(id));
    if (!candidates.length) return { code: 1, output: 'error: good and bad revisions are inconsistent\n' };
    if (candidates.length === 1) {
      const culprit = this.commits.get(candidates[0]);
      this.bisectFoundId = culprit.id;
      this.bisectState.current = culprit.id;
      this.checkoutOrSwitch(culprit.id, false, true);
      return { code: 0, output: `${culprit.id} is the first bad commit\nAuthor: ${culprit.author}\n\n    ${culprit.message}\n` };
    }
    const candidateSet = new Set(candidates);
    const midpoint = candidates.map(id => ({ id, weight: Array.from(this.getReachableCommits(id)).filter(c => candidateSet.has(c)).length })).sort((a, b) => Math.abs(a.weight - candidates.length / 2) - Math.abs(b.weight - candidates.length / 2))[0];
    const commit = this.commits.get(midpoint.id);
    this.bisectState.current = commit.id;
    this.checkoutOrSwitch(commit.id, false, true);
    return { code: 0, output: `Bisecting: ${candidates.length - 1} revisions left to test after this\n[${commit.id}] ${commit.message}\n` };
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
    const unresolvedRebasePath = this.rebaseState?.unresolvedFiles?.has(file);
    if (!this.index.has(file) && !unresolvedRebasePath) {
      return { code: 1, output: `fatal: pathspec '${file}' did not match any files\n` };
    }

    this.index.delete(file);
    this.markResolved(file);
    if (!cached) {
      this.workingTree.delete(file);
    }
    if (this.rebaseState?.conflictFiles?.has(file)) {
      this.rebaseState.unresolvedFiles.delete(file);
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
    this.operationHistory.push({ command: 'log', args: [...args] });
    let out = '';
    const pickaxeArg = args.find((a, i) => args[i - 1] === '-S');
    if (pickaxeArg || args.includes('-S')) {
      this.hasExecutedArchaeology = true;
    }
    const isOneLine = args.includes('--oneline');

    const revision = args.find((a, i) => !a.startsWith('-') && args[i - 1] !== '-S' && args[i - 1] !== '-n');
    let included;
    if (revision?.includes('..')) {
      const [left, right] = revision.split(revision.includes('...') ? '...' : '..');
      const a = this.resolveCommit(left || 'HEAD'), b = this.resolveCommit(right || 'HEAD');
      if (!a || !b) return { code: 1, output: `fatal: bad revision '${revision}'\n` };
      const fromA = this.getReachableCommits(a), fromB = this.getReachableCommits(b);
      included = revision.includes('...') ? new Set([...fromA, ...fromB].filter(id => fromA.has(id) !== fromB.has(id))) : new Set([...fromB].filter(id => !fromA.has(id)));
    } else if (args.includes('--all')) {
      included = new Set();
      for (const id of this.branches.values()) for (const commit of this.getReachableCommits(id)) included.add(commit);
    } else {
      const id = revision ? this.resolveCommit(revision) : this.getHeadCommitId();
      if (revision && !id) return { code: 1, output: `fatal: bad revision '${revision}'\n` };
      included = this.getReachableCommits(id);
    }
    // Children before parents, including both sides of a merge or range.
    const pending = new Set(included);
    const ordered = [];
    while (pending.size) {
      const next = Array.from(pending).find(id => !Array.from(pending).some(other => this.commits.get(other)?.parents.includes(id)));
      if (!next) break;
      ordered.push(next); pending.delete(next);
    }
    for (const id of ordered) {
      const c = this.commits.get(id);
      if (!c) continue;

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
    this.operationHistory.push({ command: 'stash', args: [...args] });
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
      const out = this.formatDiffBetweenTrees(entry.baseTree || new Map(), entry.workingTree);
      return { code: 0, output: out || '(stash@{0} 工作區未偵測到變更差異)\n' };
    }
    if (sub === 'pop' || sub === 'apply') {
      if (this.stash.length === 0) {
        return { code: 1, output: 'error: No stash entries found.\n' };
      }
      const selector = args.find(a => /^stash@\{\d+\}$/.test(a));
      const selected = selector ? Number(selector.match(/\d+/)[0]) : 0;
      const entry = this.stash[selected];
      if (!entry) return { code: 1, output: 'error: invalid stash reference\n' };
      const base = entry.baseTree || this.commits.get(entry.headHash)?.tree || new Map();
      const merged = this.mergeTrees(base, this.workingTree, entry.workingTree, 'Stashed changes');
      this.workingTree = merged.tree;
      if (merged.conflicts.length) {
        this.hasStashConflict = true;
        this.conflictState = { kind: 'stash', file: merged.conflicts[0], files: merged.conflicts, unresolvedFiles: new Set(merged.conflicts) };
        return { code: 1, output: `CONFLICT (content): Merge conflict in ${merged.conflicts.join(', ')}\nThe stash entry is kept in case you need it again.\n` };
      }
      if (args.includes('--index')) {
        const staged = this.mergeTrees(base, this.index, entry.index, 'Stashed index');
        if (staged.conflicts.length) return { code: 1, output: 'error: conflicts in index. Try without --index.\n' };
        this.index = staged.tree;
      }
      if (sub === 'pop') this.stash.splice(selected, 1);
      return { code: 0, output: `On branch ${this.getCurrentBranch()}\nChanges restored from stash.\n` + (sub === 'pop' ? `Dropped stash@{${selected}} (${entry.headHash})\n` : '') };
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

    const includeUntracked = args.includes('-u') || args.includes('--include-untracked') || args.includes('-a');
    const baseTree = new Map(headCommit?.tree || []);
    const savedWorking = new Map(Array.from(this.workingTree).filter(([file]) => this.index.has(file) || baseTree.has(file) || includeUntracked && !this.isIgnored(file)));
    const savedIndex = new Map(this.index);
    const unstashed = new Map(Array.from(this.workingTree).filter(([file]) => !savedWorking.has(file)));
    const workChanges = this.diffTrees(baseTree, savedWorking), indexChanges = this.diffTrees(baseTree, savedIndex);
    if (!workChanges.upsert.size && !workChanges.remove.length && !indexChanges.upsert.size && !indexChanges.remove.length) return { code: 0, output: 'No local changes to save\n' };

    this.stash.unshift({
      branch: this.getCurrentBranch() || 'detached',
      headHash,
      baseTree,
      message: args.includes('-m') ? args[args.indexOf('-m') + 1] : headMsg,
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

    for (const [file, content] of unstashed) this.workingTree.set(file, content);

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

    if (isDryRun) this.cleanDryRun = [...untracked];
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

  labCmd(args = []) {
    this.operationHistory.push({ command: 'lab', args: [...args] });
    if (args[0] !== 'pr' || args[1] !== 'merge') return { code: 1, output: 'usage: git lab pr merge [branch]\n' };
    const branch = args[2] || this.getCurrentBranch();
    const remote = this.remotes.origin;
    const feature = remote?.branches.get(branch), main = remote?.branches.get('main');
    if (!feature || !main || branch === 'main') return { code: 1, output: 'error: push a feature branch before merging its PR\n' };
    const merged = this.mergeTrees(this.commits.get(this.getMergeBase(main, feature))?.tree || new Map(), this.commits.get(main).tree, this.commits.get(feature).tree, branch);
    if (merged.conflicts.length) return { code: 1, output: 'error: PR has conflicts; update the feature branch first\n' };
    const commit = this.createCommit({ message: `Merge pull request from ${branch}`, parents: [main, feature], tree: merged.tree });
    remote.branches.set('main', commit.id);
    remote.branches.delete(branch);
    return { code: 0, output: `Pull request merged into origin/main (${commit.id}).\n` };
  }

  remoteCmd(args = []) {
    this.operationHistory.push({ command: 'remote', args: [...args] });
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
    if (sub === 'set-url' || sub === 'get-url') {
      const remote = this.remotes[args[1]];
      if (!remote) return { code: 1, output: `error: No such remote '${args[1]}'\n` };
      if (sub === 'get-url') return { code: 0, output: `${remote.url || ''}\n` };
      if (!args[2]) return { code: 1, output: 'usage: git remote set-url <name> <newurl>\n' };
      remote.url = args[2];
      this.operationHistory.push({ command: 'remote', args: [...args] });
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
    if (remote.authError) return { code: 1, output: `${remote.authError}\n` };
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
    this.operationHistory.push({ command: 'diff', args: [...args] });
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
        const triple = arg.includes('...');
        const parts = arg.split(triple ? '...' : '..');
        const ref1 = this.resolveCommit(parts[0] || 'HEAD');
        const ref2 = this.resolveCommit(parts[1] || 'HEAD');
        if (ref1 && ref2) {
          treeA = this.commits.get(triple ? this.getMergeBase(ref1, ref2) : ref1)?.tree || new Map();
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
    this.cloneDirectory = dir;
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

    const treeRef = target.match(/^(.+)\^\{tree\}$/);
    if (treeRef) {
      const id = this.resolveCommit(treeRef[1]);
      const commit = this.commits.get(id);
      if (!commit) return { code: 1, output: `fatal: invalid object '${target}'\n` };
      if (isType) return { code: 0, output: 'tree\n' };
      if (isPretty) return { code: 0, output: Array.from(commit.tree.keys()).map(file => `100644 blob blob_${file.replace(/\W/g, '')}_${id.slice(0, 4)}\t${file}\n`).join('') };
    }
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
