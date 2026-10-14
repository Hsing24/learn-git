import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const { VirtualGit } = require('../../docs/git-engine.js');
let passed = 0;
function test(name, run) { run(); passed++; console.log(`PASS ${name}`); }
function fixture() {
  const git = new VirtualGit();
  const base = git.createCommit({ message: 'base', tree: new Map([['app.js', 'base\n']]) });
  git.branches.set('main', base.id); git.checkoutOrSwitch('main');
  return { git, base };
}
function commitFile(git, file, content, message = 'change') {
  git.workingTree.set(file, content); assert.equal(git.add([file]).code, 0); assert.equal(git.commit(['-m', message]).code, 0); return git.getHeadCommit();
}
test('init keeps an unborn branch and staging captures a snapshot', () => {
  const git = new VirtualGit(); git.initialized = false;
  git.workingTree.set('a', 'before init'); assert.equal(git.add(['a']).code, 1); assert.equal(git.commit(['-m', 'before init']).code, 1);
  assert.equal(git.init(['-b', 'main']).code, 0); assert.equal(git.getHeadCommitId(), null);
  git.workingTree.set('a', 'staged'); git.add(['a']); git.workingTree.set('a', 'later'); git.commit(['-m', 'first']);
  assert.equal(git.getHeadCommit().tree.get('a'), 'staged'); assert.equal(git.workingTree.get('a'), 'later');
});
test('clean merge contains both branch changes; add all stages deletions', () => {
  const { git, base } = fixture();
  git.branches.set('feature', base.id); git.checkoutOrSwitch('feature'); commitFile(git, 'feature', 'feature');
  git.checkoutOrSwitch('main'); commitFile(git, 'main', 'main');
  assert.equal(git.merge('feature').code, 0); assert.equal(git.getHeadCommit().tree.get('feature'), 'feature');
  assert.equal(git.getHeadCommit().tree.get('main'), 'main');
  git.workingTree.delete('main'); git.add(['.']); assert.equal(git.index.has('main'), false);
});
test('revert preserves changes committed after its target', () => {
  const { git } = fixture(); const bad = commitFile(git, 'app.js', 'bad\n'); commitFile(git, 'later', 'keep');
  assert.equal(git.revert(bad.id).code, 0); assert.equal(git.getHeadCommit().tree.get('app.js'), 'base\n'); assert.equal(git.getHeadCommit().tree.get('later'), 'keep');
});
test('ff-only rejects divergence without moving local HEAD', () => {
  const { git, base } = fixture(); const local = commitFile(git, 'local', 'local');
  const remote = git.createCommit({ message: 'remote', parents: [base.id], tree: new Map([...base.tree, ['remote', 'remote']]) }); git.remotes.origin.branches.set('main', remote.id);
  assert.equal(git.pull(['--ff-only']).code, 1); assert.equal(git.getHeadCommitId(), local.id);
  assert.equal(git.pull(['--no-rebase']).code, 0); assert.equal(git.getHeadCommit().tree.get('remote'), 'remote');
});
test('linked worktree commits while original index and WIP survive', () => {
  const { git, base } = fixture(); git.branches.set('feature', base.id); git.checkoutOrSwitch('feature');
  git.workingTree.set('app.js', 'WIP'); git.workingTree.set('staged', 'snapshot'); git.add(['staged']);
  assert.equal(git.worktree(['add', '-b', 'hotfix', '../hotfix', 'main']).code, 0);
  assert.equal(git.changeDirectory('../hotfix').code, 0); assert.equal(git.getCurrentBranch(), 'hotfix'); commitFile(git, 'app.js', 'fixed');
  assert.equal(git.changeDirectory('..').code, 0); assert.equal(git.getCurrentBranch(), 'feature'); assert.equal(git.workingTree.get('app.js'), 'WIP'); assert.equal(git.index.get('staged'), 'snapshot');
  assert.equal(git.worktree(['remove', '../hotfix']).code, 0); assert.notEqual(git.branches.get('hotfix'), base.id);
});
test('bisect tests checked-out trees and restores the original branch', () => {
  const { git, base } = fixture(); let culprit;
  for (let i = 1; i <= 8; i++) { git.workingTree.set('iteration', String(i)); git.add(['iteration']); const c = commitFile(git, 'app.js', i >= 4 ? 'bad' : 'good'); if (i === 4) culprit = c.id; }
  const tip = git.getHeadCommitId(); git.bisect(['start']); git.bisect(['bad']); git.bisect(['good', base.id]);
  let iterations = 0; while (!git.bisectFoundId && iterations++ < 10) git.bisect([git.workingTree.get('app.js') === 'bad' ? 'bad' : 'good']);
  assert.equal(git.bisectFoundId, culprit); assert.equal(git.bisect(['reset']).code, 0); assert.equal(git.getCurrentBranch(), 'main'); assert.equal(git.getHeadCommitId(), tip);
});
test('hook blocks a staged fake secret, permits cleanup, honors bypass', () => {
  const { git } = fixture(); git.hooks.set('pre-commit', 'check-secrets'); git.workingTree.set('secret', 'API_TOKEN="fake"'); git.add(['secret']);
  assert.equal(git.commit(['-m', 'blocked']).code, 1); assert.equal(git.hasBlockedHook, true);
  commitFile(git, 'secret', 'tokenFromEnvironment();'); assert.equal(git.getHeadCommit().tree.get('secret'), 'tokenFromEnvironment();');
  git.workingTree.set('secret', 'API_TOKEN="fake"'); git.add(['secret']); assert.equal(git.commit(['-m', 'bypass', '--no-verify']).code, 0);
});
test('patch stages one real hunk and preserves the other in the worktree', () => {
  const { git } = fixture(); commitFile(git, 'patch', 'first\ncontext\nlast\n'); git.workingTree.set('patch', 'FIRST\ncontext\nLAST\n');
  const prompt = git.add(['-p', 'patch']); assert.equal(prompt.patch.hunks.length, 2); assert.equal(git.index.get('patch'), 'first\ncontext\nlast\n');
  git.addPatch('patch', [0]); assert.equal(git.index.get('patch'), 'FIRST\ncontext\nlast\n'); assert.equal(git.workingTree.get('patch'), 'FIRST\ncontext\nLAST\n');
});
test('ignore patterns affect status and add but never already tracked files', () => {
  const { git } = fixture(); git.workingTree.set('.gitignore', '.env\n*.log\nbuild/\n!important.log\n');
  for (const file of ['.env', 'debug.log', 'important.log', 'build/bundle.js']) git.workingTree.set(file, 'data');
  assert.equal(git.checkIgnore(['-v', '.env']).code, 0); assert.equal(git.checkIgnore(['important.log']).code, 1); assert.match(git.checkIgnore(['-v', 'important.log']).output, /!important.log/);
  git.workingTree.set('.gitignore', 'logs/\n!logs/keep.log\n'); assert.equal(git.isIgnored('logs/keep.log'), true); git.workingTree.set('.gitignore', '.env\n*.log\nbuild/\n!important.log\n');
  assert.equal(git.status().untracked.includes('.env'), false); git.add(['.']); assert.equal(git.index.has('.env'), false); assert.equal(git.index.has('important.log'), true);
  git.workingTree.set('.gitignore', 'app.js\n'); assert.equal(git.checkIgnore(['app.js']).code, 1); git.workingTree.set('app.js', 'updated'); git.add(['app.js']); assert.equal(git.index.get('app.js'), 'updated');
});
test('cherry-pick conflict needs staging and supports abort then continue', () => {
  const { git, base } = fixture(); const main = commitFile(git, 'app.js', 'ours');
  const target = git.createCommit({ message: 'pick', parents: [base.id], tree: new Map([['app.js', 'theirs']]) });
  assert.equal(git.cherryPick(target.id).code, 1); assert.equal(git.cherryPick('--continue').code, 1); assert.equal(git.cherryPick('--abort').code, 0); assert.equal(git.getHeadCommitId(), main.id); assert.equal(git.workingTree.get('app.js'), 'ours');
  git.cherryPick(target.id); git.workingTree.set('app.js', 'both'); git.add(['app.js']); assert.equal(git.cherryPick('--continue').code, 0); assert.deepEqual(git.getHeadCommit().parents, [main.id]);
});
test('rerere records actual resolution and reuses it without auto staging', () => {
  const { git, base } = fixture(); const main = commitFile(git, 'app.js', 'ours');
  const feature = git.createCommit({ message: 'theirs', parents: [base.id], tree: new Map([['app.js', 'theirs']]) }); git.branches.set('feature', feature.id); git.configCmd(['rerere.enabled', 'true']);
  git.merge('feature'); git.workingTree.set('app.js', 'both'); git.add(['app.js']); git.commit(['-m', 'merge']); assert.equal(git.rerereRecorded, 1);
  git.reset(main.id, '--hard'); git.merge('feature'); assert.equal(git.workingTree.get('app.js'), 'both'); assert.equal(git.rerereReused, 1); assert.equal(git.commit(['-m', 'too early']).code, 1);
  git.add(['app.js']); assert.equal(git.commit(['-m', 'merge again']).code, 0);
});
test('stash apply honors --index and pop keeps its entry after a conflict', () => {
  const { git } = fixture(); git.workingTree.set('app.js', 'staged'); git.add(['app.js']); git.workingTree.set('app.js', 'draft'); git.workingTree.set('untracked', 'draft'); git.stashCmd(['push', '-u']);
  assert.equal(git.stashCmd(['apply', '--index']).code, 0); assert.equal(git.index.get('app.js'), 'staged'); assert.equal(git.workingTree.get('app.js'), 'draft'); assert.equal(git.stash.length, 1);
  git.reset('HEAD', '--hard'); commitFile(git, 'app.js', 'upstream'); assert.equal(git.stashCmd(['pop', '--index']).code, 1); assert.equal(git.stash.length, 1); assert.equal(git.workingTree.get('untracked'), 'draft');
});
test('revision parents, log ranges and triple-dot diff use commit ancestry', () => {
  const { git, base } = fixture(); const main = commitFile(git, 'main', 'main');
  const feature = git.createCommit({ message: 'feature', parents: [base.id], tree: new Map([...base.tree, ['feature', 'feature']]) }); git.branches.set('feature', feature.id);
  assert.equal(git.resolveCommit('HEAD~'), base.id); assert.equal(git.resolveCommit('HEAD^0'), main.id);
  assert.match(git.logCmd(['--oneline', 'main..feature']).output, /feature/); assert.doesNotMatch(git.logCmd(['--oneline', 'main..feature']).output, /base/);
  const diff = git.diffCmd(['main...feature']).output; assert.match(diff, /feature/); assert.doesNotMatch(diff, /a\/main/);
  git.merge('feature'); assert.equal(git.revParse(['HEAD^2']).output.trim(), feature.id); assert.equal(git.tag(['second-parent', 'HEAD^2']).code, 0); assert.equal(git.tags.get('second-parent').commitId, feature.id);
});
test('remote URL changes preserve refs; PR merge advances remote main explicitly', () => {
  const { git, base } = fixture(); git.remotes.origin.branches.set('main', base.id); git.remoteCmd(['set-url', 'origin', 'git@example.test:repo.git']); assert.equal(git.remotes.origin.branches.get('main'), base.id);
  git.remotes.origin.authError = 'Permission denied (publickey)'; git.configCmd(['user.name', 'New Author']); git.remoteCmd(['set-url', 'origin', 'git@example.test:correct.git']); assert.equal(git.fetchCmd().code, 1); delete git.remotes.origin.authError;
  git.checkoutOrSwitch('feature', true); const feature = commitFile(git, 'feature', 'feature'); git.push(['-u', 'origin', 'feature']); assert.equal(git.remotes.origin.branches.get('main'), base.id);
  assert.equal(git.labCmd(['pr', 'merge']).code, 0); const merged = git.commits.get(git.remotes.origin.branches.get('main')); assert.equal(merged.tree.get('feature'), 'feature'); assert.deepEqual(merged.parents, [base.id, feature.id]);
});
test('resetAll removes every lesson evidence and executable permission', () => {
  const { git } = fixture();
  for (const key of ['hasInitialized', 'hasBlockedHook', 'hasBypassedHook', 'hasCreatedWorktree', 'hasStashConflict', 'hasExecutedArchaeology', 'hasExecutedCatFile', 'ffOnlyRejected']) git[key] = true;
  git.cleanDryRun = ['debug.log']; git.executableFiles.add('hook'); git.cloneDirectory = 'app'; git.operationHistory.push({ command: 'fake', args: [] });
  git.resetAll();
  for (const key of ['hasInitialized', 'hasBlockedHook', 'hasBypassedHook', 'hasCreatedWorktree', 'hasStashConflict', 'hasExecutedArchaeology', 'hasExecutedCatFile', 'ffOnlyRejected']) assert.equal(git[key], false, key);
  assert.deepEqual(git.cleanDryRun, []); assert.equal(git.executableFiles.size, 0); assert.equal(git.cloneDirectory, null); assert.deepEqual(git.operationEvidence, []);
});
test('switch preserves safe staged changes, WIP and untracked files', () => {
  const { git, base } = fixture();
  const branch = git.createCommit({ message: 'other', parents: [base.id], tree: new Map([...base.tree, ['other', 'new']]) }); git.branches.set('other', branch.id);
  git.workingTree.set('app.js', 'staged'); git.add(['app.js']); git.workingTree.set('app.js', 'WIP'); git.workingTree.set('debug.log', 'untracked');
  assert.equal(git.checkoutOrSwitch('other').code, 0); assert.equal(git.index.get('app.js'), 'staged'); assert.equal(git.workingTree.get('app.js'), 'WIP'); assert.equal(git.workingTree.get('debug.log'), 'untracked'); assert.equal(git.workingTree.get('other'), 'new');
});
test('switch rejects overwrites and duplicate creation without changing state', () => {
  const { git, base } = fixture();
  const branch = git.createCommit({ message: 'other', parents: [base.id], tree: new Map([['app.js', 'incoming'], ['debug.log', 'tracked']]) }); git.branches.set('other', branch.id);
  git.workingTree.set('app.js', 'WIP'); const head = { ...git.HEAD }, index = new Map(git.index), working = new Map(git.workingTree);
  assert.equal(git.checkoutOrSwitch('other').code, 1); assert.deepEqual(git.HEAD, head); assert.deepEqual(git.index, index); assert.deepEqual(git.workingTree, working);
  assert.equal(git.checkoutOrSwitch('main', true).code, 1); assert.equal(git.branches.get('main'), base.id);
  git.workingTree.set('app.js', 'base\n'); git.workingTree.set('debug.log', 'local'); assert.equal(git.checkoutOrSwitch('other').code, 1); assert.equal(git.workingTree.get('debug.log'), 'local');
});
test('reset hard preserves untracked files; mixed and hard end cherry-pick conflicts', () => {
  for (const mode of ['--mixed', '--hard']) {
    const { git, base } = fixture(); commitFile(git, 'app.js', 'ours');
    const target = git.createCommit({ message: 'theirs', parents: [base.id], tree: new Map([['app.js', 'theirs']]) });
    git.workingTree.set('debug.log', 'local'); assert.equal(git.cherryPick(target.id).code, 1);
    const originalTip = git.getHeadCommitId(); assert.equal(git.reset('HEAD', '--soft').code, 1); assert.equal(git.getHeadCommitId(), originalTip); assert.equal(git.cherryPickInProgress, true);
    assert.equal(git.reset('HEAD', mode).code, 0); assert.equal(git.cherryPickInProgress, false); assert.equal(git.conflictState, null); assert.equal(git.workingTree.get('debug.log'), 'local');
  }
});
test('worktree main merge preserves primary feature WIP and branch locks follow HEAD', () => {
  const { git, base } = fixture(); git.branches.set('feature', base.id); git.checkoutOrSwitch('feature'); git.workingTree.set('app.js', 'feature WIP');
  git.worktree(['add', '-b', 'hotfix', '../hotfix', 'main']); assert.equal(git.checkoutOrSwitch('hotfix').code, 1); assert.equal(git.branch(['-D', 'hotfix']).code, 1);
  git.changeDirectory('../hotfix'); assert.equal(git.checkoutOrSwitch('feature').code, 1); assert.equal(git.branch(['-D', 'feature']).code, 1);
  const fix = commitFile(git, 'app.js', 'fixed'); assert.equal(git.checkoutOrSwitch('main').code, 0); assert.equal(git.merge('hotfix').code, 0); assert.equal(git.branches.get('main'), fix.id);
  assert.equal(git.branch(['-D', 'hotfix']).code, 0); assert.equal(git.branch(['-m', 'main', 'production']).code, 0); assert.equal(git.getCurrentBranch(), 'production');
  git.changeDirectory('..'); assert.equal(git.workingTree.get('app.js'), 'feature WIP'); assert.equal(git.getCurrentBranch(), 'feature'); assert.equal(git.checkoutOrSwitch('production').code, 1); assert.equal(git.branch(['-D', 'production']).code, 1);
  assert.equal(git.branch(['-m', 'production', 'main']).code, 0); assert.equal(git.worktrees[0].HEAD.target, 'main'); assert.equal(git.worktree(['remove', '../hotfix']).code, 0);
});
test('worktree removal refuses staged changes even when physical files match HEAD', () => {
  const { git } = fixture(); git.worktree(['add', '-b', 'linked', '../linked']); git.changeDirectory('../linked');
  git.workingTree.set('app.js', 'staged'); git.add(['app.js']); git.workingTree.set('app.js', 'base\n'); git.changeDirectory('..');
  assert.equal(git.worktree(['remove', '../linked']).code, 1); assert.equal(git.worktrees.length, 1); assert.equal(git.worktrees[0].index.get('app.js'), 'staged');
  assert.equal(git.worktree(['remove', '--force', '../linked']).code, 0);
});
test('mixed and hard demo switches retain untracked debug through main cleanup', () => {
  const { git, base } = fixture(); const wip = commitFile(git, 'app.js', 'half done'); git.branches.set('mixed-demo', wip.id); git.branches.set('hard-demo', wip.id); git.workingTree.set('debug.log', 'local');
  git.checkoutOrSwitch('mixed-demo'); git.reset('HEAD~1', '--mixed'); assert.equal(git.workingTree.get('app.js'), 'half done'); git.restore(['app.js']);
  assert.equal(git.checkoutOrSwitch('hard-demo').code, 0); git.reset('HEAD~1', '--hard'); assert.equal(git.workingTree.get('app.js'), 'base\n');
  assert.equal(git.checkoutOrSwitch('main').code, 0); git.reset('HEAD~1', '--soft'); assert.equal(git.commit(['-m', 'clean']).code, 0); assert.equal(git.getHeadCommit().parents[0], base.id); assert.equal(git.workingTree.get('debug.log'), 'local'); assert.equal(git.index.has('debug.log'), false);
});
test('displayed patch plan cannot stage a changed hunk', () => {
  const { git } = fixture(); git.workingTree.set('app.js', 'first draft'); const plan = git.patchHunks('app.js'); git.workingTree.set('app.js', 'second draft');
  assert.equal(git.addPatch('app.js', [0], plan).code, 1); assert.equal(git.index.get('app.js'), 'base\n');
});
console.log(`${passed} meaningful engine curriculum checks passed.`);
