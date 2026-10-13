/**
 * Web Scenarios Verification Runner
 * Tests scenarios in headless Node environment via node:vm
 * Verifies:
 *  1. Fresh state: Every scenario must fail (passed === false) immediately after setup.
 *  2. Solution state: Canonical solutions must pass (passed === true).
 *  3. Shortcuts / anti-patterns: Dangerous shortcuts (force push, merge commits, drops) must be rejected.
 */

import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const docsDir = path.resolve(__dirname, '../../docs');

// Set up sandbox context simulating browser globals
const sandbox = {
  console,
  setTimeout,
  clearTimeout,
  setInterval,
  clearInterval,
  Date,
  Math,
  Map,
  Set,
  Array,
  Object,
  String,
  Number,
  Boolean,
  RegExp,
  window: {}
};
sandbox.window = sandbox;
sandbox.globalThis = sandbox;
vm.createContext(sandbox);

function runFile(relPath) {
  const fullPath = path.join(docsDir, relPath);
  const code = fs.readFileSync(fullPath, 'utf-8');
  vm.runInContext(code, sandbox, { filename: relPath });
}

runFile('git-engine.js');
runFile('scenarios-data.js');
runFile('scenarios-extra.js');
runFile('curriculum.js');

const VirtualGit = sandbox.VirtualGit || sandbox.window.VirtualGit;
const SCENARIOS = sandbox.SCENARIOS || sandbox.window.SCENARIOS;
const CURRICULUM = sandbox.CURRICULUM || sandbox.window.CURRICULUM;

if (!VirtualGit || !SCENARIOS) {
  console.error('Failed to load VirtualGit or SCENARIOS from docs files.');
  process.exit(1);
}

console.log(`Loaded ${SCENARIOS.length} scenarios into Node test environment.`);

let totalPassed = 0;
let totalFailed = 0;
let totalExecuted = 0;

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

function test(name, fn) {
  totalExecuted++;
  try {
    fn();
    totalPassed++;
    console.log(`  ✔ PASS: ${name}`);
  } catch (err) {
    totalFailed++;
    const details = err && typeof err === 'object' && 'stack' in err
      ? err.stack
      : String(err);
    console.error(`  ❌ FAIL: ${name}\n${details}`);
  }
}

// -------------------------------------------------------------
// 1. Fresh State Test: ALL scenarios must be false right after setup
// -------------------------------------------------------------
console.log('\n--- 1. Testing Fresh State (All scenarios must FAIL initially) ---');

for (const sc of SCENARIOS) {
  test(`Scenario ${sc.id} fresh checkGoal returns false`, () => {
    const git = new VirtualGit();
    sc.setup(git);
    const result = sc.checkGoal(git);
    assert(result && result.passed === false, `Scenario ${sc.id} passed immediately after setup! Message: ${result?.message}`);
  });
}

// -------------------------------------------------------------
// 2. Scenario 04 Bug Fix Verification (§6.2.1)
// -------------------------------------------------------------
console.log('\n--- 2. Testing Scenario 04 (Rebase Linear History) ---');
const sc04 = SCENARIOS.find(s => s.id === '04');

test('04: Fresh setup must fail', () => {
  const git = new VirtualGit();
  sc04.setup(git);
  const res = sc04.checkGoal(git);
  assert(res.passed === false, '04 must fail on fresh setup');
  assert(res.message.includes('尚未 rebase'), `Expected rebase prompt, got: ${res.message}`);
});

test('04: After rebase only, must prompt to merge', () => {
  const git = new VirtualGit();
  sc04.setup(git);
  git.rebase('main');
  const res = sc04.checkGoal(git);
  assert(res.passed === false, '04 must fail before merge');
  assert(res.message.includes('git merge feature'), `Expected merge prompt, got: ${res.message}`);
});

test('04: Standard solution (rebase main -> switch main -> merge feature) must pass', () => {
  const git = new VirtualGit();
  sc04.setup(git);
  git.rebase('main');
  git.checkoutOrSwitch('main');
  const mergeRes = git.merge('feature');
  assert(mergeRes.code === 0, `Merge failed: ${mergeRes.output}`);
  const res = sc04.checkGoal(git);
  assert(res.passed === true, `04 solution failed: ${res.message}`);
});

test('04: Shortcut merge directly without rebase must fail with merge commit warning', () => {
  const git = new VirtualGit();
  sc04.setup(git);
  git.checkoutOrSwitch('main');
  git.merge('feature'); // Creates merge commit because histories diverged
  const res = sc04.checkGoal(git);
  assert(res.passed === false, '04 must reject merge commit shortcut');
});

// -------------------------------------------------------------
// 3. Scenario 06 Bug Fix Verification (§6.2.2)
// -------------------------------------------------------------
console.log('\n--- 3. Testing Scenario 06 (Remote Rejection & Pull --rebase) ---');
const sc06 = SCENARIOS.find(s => s.id === '06');

test('06: Fresh setup must fail', () => {
  const git = new VirtualGit();
  sc06.setup(git);
  const res = sc06.checkGoal(git);
  assert(res.passed === false, '06 must fail on fresh setup');
});

test('06: Direct push without pull must be rejected by engine', () => {
  const git = new VirtualGit();
  sc06.setup(git);
  const pushRes = git.push(['origin', 'main']);
  assert(pushRes.code === 1, `Push should have been rejected, got: ${pushRes.code}`);
  assert(pushRes.output.includes('[rejected]'), `Expected rejection message, got: ${pushRes.output}`);
  const res = sc06.checkGoal(git);
  assert(res.passed === false, '06 must not pass when push was rejected');
});

test('06: Force push shortcut must be caught and rejected by checkGoal', () => {
  const git = new VirtualGit();
  sc06.setup(git);
  const pushRes = git.push(['origin', 'main', '--force']);
  assert(pushRes.code === 0, 'Force push succeeded at engine level');
  const res = sc06.checkGoal(git);
  assert(res.passed === false, '06 must reject force push that wiped out colleague commit');
  assert(res.message.includes('同事的 commit 被你的 force push 蓋掉了'), `Expected wipeout message, got: ${res.message}`);
});

test('06: Plain pull (merge commit) must be rejected with merge commit warning', () => {
  const git = new VirtualGit();
  sc06.setup(git);
  const pullRes = git.pull(['origin', 'main']); // plain merge
  assert(pullRes.code === 0, 'Pull merge succeeded');
  git.push(['origin', 'main']);
  const res = sc06.checkGoal(git);
  assert(res.passed === false, '06 must reject pull without rebase');
  assert(res.message.includes('出現了 merge commit'), `Expected merge commit message, got: ${res.message}`);
});

test('06: Standard solution (pull --rebase -> push) must pass linearly and preserve both files', () => {
  const git = new VirtualGit();
  sc06.setup(git);
  const pullRes = git.pull(['--rebase']);
  assert(pullRes.code === 0, `Pull rebase failed: ${pullRes.output}`);
  const pushRes = git.push(['origin', 'main']);
  assert(pushRes.code === 0, `Push failed: ${pushRes.output}`);
  const res = sc06.checkGoal(git);
  assert(res.passed === true, `06 solution failed: ${res.message}`);

  // Also verify working tree contains both colleague's notice.txt and user's points.js
  assert(git.workingTree.has('notice.txt'), 'notice.txt from colleague must be preserved');
  assert(git.workingTree.has('points.js'), 'points.js from user must be preserved');
});

// -------------------------------------------------------------
// 4. Scenario 05 Bug Fix Verification (§6.2.3)
// -------------------------------------------------------------
console.log('\n--- 4. Testing Scenario 05 (Interactive Rebase) ---');
const sc05 = SCENARIOS.find(s => s.id === '05');

test('05: Fresh setup must fail', () => {
  const git = new VirtualGit();
  sc05.setup(git);
  const res = sc05.checkGoal(git);
  assert(res.passed === false, '05 must fail on fresh setup');
});

test('05: Fixup without modifying commit message must fail message check', () => {
  const git = new VirtualGit();
  sc05.setup(git);
  const plan = git.rebaseInteractivePlan('HEAD~2');
  assert(plan.commits.length === 2, `Expected 2 commits to replay, got ${plan.commits.length}`);
  const applyRes = git.rebaseInteractiveApply(plan.upstreamId, [
    { id: plan.commits[0].id, action: 'pick' },
    { id: plan.commits[1].id, action: 'fixup' }
  ]);
  assert(applyRes.code === 0, `Apply failed: ${applyRes.output}`);
  const res = sc05.checkGoal(git);
  assert(res.passed === false, '05 must fail if message still contains wip/typo');
  assert(res.message.includes('wip / typo'), `Expected wip/typo warning, got: ${res.message}`);
});

test('05: Dropping commit must fail finalContent check', () => {
  const git = new VirtualGit();
  sc05.setup(git);
  const plan = git.rebaseInteractivePlan('HEAD~2');
  const applyRes = git.rebaseInteractiveApply(plan.upstreamId, [
    { id: plan.commits[0].id, action: 'pick' },
    { id: plan.commits[1].id, action: 'drop' }
  ]);
  assert(applyRes.code === 0, `Apply failed: ${applyRes.output}`);
  const res = sc05.checkGoal(git);
  assert(res.passed === false, '05 must fail if changes were dropped');
  assert(res.message.includes('payment.js 的內容不對'), `Expected content error, got: ${res.message}`);
});

test('05: Standard solution (squash with clean message) must pass', () => {
  const git = new VirtualGit();
  sc05.setup(git);
  const plan = git.rebaseInteractivePlan('HEAD~2');
  const applyRes = git.rebaseInteractiveApply(plan.upstreamId, [
    { id: plan.commits[0].id, action: 'pick' },
    { id: plan.commits[1].id, action: 'squash', message: 'feat: implement payment form' }
  ]);
  assert(applyRes.code === 0, `Apply failed: ${applyRes.output}`);
  const res = sc05.checkGoal(git);
  assert(res.passed === true, `05 solution failed: ${res.message}`);
  assert(git.getHeadCommit().tree.get('payment.js') === git.scenarioMeta.finalContent, 'Tree content must match');
});

// -------------------------------------------------------------
// 5. Existing Core Scenarios Solutions (00-03, 07-14, 18, 19, 20)
// -------------------------------------------------------------
console.log('\n--- 5. Testing Existing Core Scenarios Solutions ---');

test('00: Identity setup solution', () => {
  const sc = SCENARIOS.find(s => s.id === '00');
  const git = new VirtualGit();
  sc.setup(git);
  git.configCmd(['user.name', 'Alex Chen']);
  git.configCmd(['user.email', 'alex@company.com']);
  assert(sc.checkGoal(git).passed === true, '00 solution should pass');
});

test('01: First commit solution', () => {
  const sc = SCENARIOS.find(s => s.id === '01');
  const git = new VirtualGit();
  sc.setup(git);
  git.add(['index.html']);
  git.commit(['-m', 'feat: initial page structure']);
  assert(sc.checkGoal(git).passed === true, '01 solution should pass');
});

test('02: Branch fast-forward merge solution', () => {
  const sc = SCENARIOS.find(s => s.id === '02');
  const git = new VirtualGit();
  sc.setup(git);
  git.checkoutOrSwitch('feature/login', true);
  git.commit(['-m', 'feat: add login']);
  git.checkoutOrSwitch('main');
  git.merge('feature/login');
  assert(sc.checkGoal(git).passed === true, '02 solution should pass');
});

test('03: Merge conflict manual resolution solution', () => {
  const sc = SCENARIOS.find(s => s.id === '03');
  const git = new VirtualGit();
  sc.setup(git);
  git.merge('feature/dark-mode');
  // Resolve conflict in style.css and commit
  git.workingTree.set('style.css', 'body { color: #ffffff; background: #000000; }');
  git.add(['style.css']);
  git.commit(['-m', 'merge: resolve dark mode conflict']);
  assert(sc.checkGoal(git).passed === true, '03 solution should pass');
});

test('07: Cherry-pick solution', () => {
  const sc = SCENARIOS.find(s => s.id === '07');
  const git = new VirtualGit();
  sc.setup(git);
  git.checkoutOrSwitch('main');
  git.cherryPick('sec001');
  assert(sc.checkGoal(git).passed === true, '07 solution should pass');
});

test('08: Reset to recovered commit via reflog solution', () => {
  const sc = SCENARIOS.find(s => s.id === '08');
  const git = new VirtualGit();
  sc.setup(git);
  git.reset('lost99', '--hard');
  assert(sc.checkGoal(git).passed === true, '08 solution should pass');
});

test('09: Worktree add solution', () => {
  const sc = SCENARIOS.find(s => s.id === '09');
  const git = new VirtualGit();
  sc.setup(git);
  git.worktree(['add', 'hotfix-dir', '-b', 'hotfix-p0']);
  assert(sc.checkGoal(git).passed === true, '09 solution should pass');
});

test('10: Bisect solution', () => {
  const sc = SCENARIOS.find(s => s.id === '10');
  const git = new VirtualGit();
  sc.setup(git);
  git.bisect(['start']);
  git.bisect(['bad']);
  git.bisect(['good', 'c1000']);
  assert(sc.checkGoal(git).passed === true, '10 solution should pass');
});

test('11: Hooks bypass solution', () => {
  const sc = SCENARIOS.find(s => s.id === '11');
  const git = new VirtualGit();
  sc.setup(git);
  git.commit(['-m', 'feat: emergency bypass', '--no-verify']);
  assert(sc.checkGoal(git).passed === true, '11 solution should pass');
});

test('12: Add patch solution', () => {
  const sc = SCENARIOS.find(s => s.id === '12');
  const git = new VirtualGit();
  sc.setup(git);
  git.commit(['-m', 'fix: apply discount in total calculation']);
  assert(sc.checkGoal(git).passed === true, '12 solution should pass');
});

test('13: Untrack cached solution', () => {
  const sc = SCENARIOS.find(s => s.id === '13');
  const git = new VirtualGit();
  sc.setup(git);
  git.rm(['--cached', '.env']);
  assert(sc.checkGoal(git).passed === true, '13 solution should pass');
});

test('14: Revert merge solution', () => {
  const sc = SCENARIOS.find(s => s.id === '14');
  const git = new VirtualGit();
  sc.setup(git);
  git.revert('HEAD', { mainline: 1 });
  assert(sc.checkGoal(git).passed === true, '14 solution should pass');
});

test('15: Tag solution', () => {
  const sc = SCENARIOS.find(s => s.id === '15');
  const git = new VirtualGit();
  sc.setup(git);
  git.tag(['-a', 'v1.0.0', '-m', 'Release v1.0.0']);
  git.tag(['-a', 'v0.9.0', 'cAuth', '-m', 'Beta v0.9.0']);
  assert(sc.checkGoal(git).passed === true, '15 solution should pass');
});

test('16: Code archaeology solution', () => {
  const sc = SCENARIOS.find(s => s.id === '16');
  const git = new VirtualGit();
  sc.setup(git);
  git.logCmd(['-S', 'CRITICAL_SECRET_TOKEN']);
  assert(sc.checkGoal(git).passed === true, '16 solution should pass');
});

test('17: Rerere solution', () => {
  const sc = SCENARIOS.find(s => s.id === '17');
  const git = new VirtualGit();
  sc.setup(git);
  git.configCmd(['rerere.enabled', 'true']);
  assert(sc.checkGoal(git).passed === true, '17 solution should pass');
});

test('18: Commit amend solution', () => {
  const sc = SCENARIOS.find(s => s.id === '18');
  const git = new VirtualGit();
  sc.setup(git);
  git.add(['assets/logo.png']);
  git.commit(['--amend', '-m', 'feat: release v1.0.0']);
  assert(sc.checkGoal(git).passed === true, '18 solution should pass');
});

test('19: Stash solution', () => {
  const sc = SCENARIOS.find(s => s.id === '19');
  const git = new VirtualGit();
  sc.setup(git);
  git.stashCmd(['push', '-u']);
  git.checkoutOrSwitch('main');
  git.commit(['-m', 'fix: emergency hotfix']);
  git.checkoutOrSwitch('feature/cart');
  git.stashCmd(['pop']);
  assert(sc.checkGoal(git).passed === true, '19 solution should pass');
});

test('20: Clean solution', () => {
  const sc = SCENARIOS.find(s => s.id === '20');
  const git = new VirtualGit();
  sc.setup(git);
  git.mvCmd(['utils.py', 'helpers.py']);
  git.cleanCmd(['-fd']);
  git.commit(['-m', 'refactor: rename utils to helpers']);
  assert(sc.checkGoal(git).passed === true, '20 solution should pass');
});

test('21: Remote upstream solution', () => {
  const sc = SCENARIOS.find(s => s.id === '21');
  const git = new VirtualGit();
  sc.setup(git);
  git.remoteCmd(['add', 'upstream', 'https://github.com/corp/upstream.git']);
  git.fetchCmd(['upstream']);
  git.merge('upstream/main');
  assert(sc.checkGoal(git).passed === true, '21 solution should pass');
});

test('22: Rescue main commits via branch & reset solution', () => {
  const sc = SCENARIOS.find(s => s.id === '22');
  const git = new VirtualGit();
  sc.setup(git);
  git.branch(['feature/oauth']);
  git.reset('HEAD~2', '--hard');
  assert(sc.checkGoal(git).passed === true, '22 solution should pass');
});

test('23: Cat-file object database exploration solution', () => {
  const sc = SCENARIOS.find(s => s.id === '23');
  const git = new VirtualGit();
  sc.setup(git);
  git.catFileCmd(['-p', 'HEAD']);
  assert(sc.checkGoal(git).passed === true, '23 solution should pass');
});

// --- Phase P2 Scenarios Solutions ---
test('24: Inspect changes solution', () => {
  const sc = SCENARIOS.find(s => s.id === '24');
  const git = new VirtualGit();
  sc.setup(git);
  git.status(['-s']);
  git.diffCmd([]);
  git.diffCmd(['--staged']);
  git.logCmd(['--oneline', '--graph']);
  git.showCmd(['HEAD~1']);
  assert(sc.checkGoal(git).passed === true, '24 solution should pass');
});

test('24: Invalid show and out-of-order inspections must fail', () => {
  const sc = SCENARIOS.find(s => s.id === '24');
  const invalidShow = new VirtualGit();
  sc.setup(invalidShow);
  const badShow = invalidShow.showCmd(['NOT_EXIST']);
  assert(badShow.code !== 0, 'show of an unknown ref must fail');
  invalidShow.status(['-s']);
  invalidShow.diffCmd([]);
  invalidShow.diffCmd(['--staged']);
  invalidShow.logCmd(['--oneline', '--graph']);
  assert(sc.checkGoal(invalidShow).passed === false, 'A failed show must not satisfy the final inspection step');

  const badSequence = new VirtualGit();
  sc.setup(badSequence);
  badSequence.showCmd(['NOT_EXIST']);
  badSequence.logCmd([]);
  badSequence.diffCmd(['--staged']);
  badSequence.diffCmd([]);
  assert(sc.checkGoal(badSequence).passed === false, 'The reported invalid and out-of-order command sequence must fail');

  const wrongOrder = new VirtualGit();
  sc.setup(wrongOrder);
  wrongOrder.showCmd(['HEAD~1']);
  wrongOrder.logCmd(['--oneline', '--graph']);
  wrongOrder.diffCmd(['--staged']);
  wrongOrder.diffCmd([]);
  wrongOrder.status(['-s']);
  assert(sc.checkGoal(wrongOrder).passed === false, 'Correct commands in the wrong order must fail');
});

test('25: Undo matrix solution', () => {
  const sc = SCENARIOS.find(s => s.id === '25');
  const git = new VirtualGit();
  sc.setup(git);
  git.restore(['config.js']);
  git.restore(['--staged', 'debug.log']);
  git.reset('HEAD~1', '--soft');
  git.commit(['-m', 'feat: complete payment setup']);
  assert(sc.checkGoal(git).passed === true, '25 solution should pass');
});

test('26: Merge strategies solution', () => {
  const sc = SCENARIOS.find(s => s.id === '26');
  const git = new VirtualGit();
  sc.setup(git);
  git.merge('feature/a', { noFf: true });
  git.merge('feature/b', { squash: true });
  git.commit(['-m', 'feat: complete feature b']);
  const delA = git.branch(['-d', 'feature/a']);
  assert(delA.code === 0, 'branch -d feature/a should succeed');
  const delBRejected = git.branch(['-d', 'feature/b']);
  assert(delBRejected.code === 1, 'branch -d feature/b should be rejected because squash is unmerged');
  const delBForce = git.branch(['-D', 'feature/b']);
  assert(delBForce.code === 0, 'branch -D feature/b should succeed');
  assert(sc.checkGoal(git).passed === true, '26 solution should pass');
});

test('26: Merging b and deleting a must fail without a merge commit for a', () => {
  const sc = SCENARIOS.find(s => s.id === '26');
  const git = new VirtualGit();
  sc.setup(git);
  git.merge('feature/b', { noFf: true });
  assert(git.branch(['-D', 'feature/a']).code === 0, 'The shortcut should delete feature/a');
  assert(git.branch(['-d', 'feature/b']).code === 0, 'The shortcut should delete merged feature/b');
  assert(!git.branches.has('feature/a') && !git.branches.has('feature/b'), 'Both local feature refs should be gone');
  assert(sc.checkGoal(git).passed === false, 'The required feature/a merge must be present');
});

test('27: Detached HEAD solution', () => {
  const sc = SCENARIOS.find(s => s.id === '27');
  const git = new VirtualGit();
  sc.setup(git);
  git.checkoutOrSwitch('v1.0', false, true); // switch --detach v1.0
  assert(git.HEAD.type === 'detached', 'HEAD must be detached');
  git.workingTree.set('app.js', 'v1.0 patched\n');
  git.add(['app.js']);
  git.commit(['-m', 'fix: legacy patch on v1.0']);
  git.checkoutOrSwitch('hotfix/v1-legacy', true); // switch -c hotfix/v1-legacy
  git.checkoutOrSwitch('main'); // switch main
  assert(sc.checkGoal(git).passed === true, '27 solution should pass');
});

test('27: Branching hotfix from main without a detached fix must fail', () => {
  const sc = SCENARIOS.find(s => s.id === '27');
  const git = new VirtualGit();
  sc.setup(git);
  git.branch(['hotfix/v1-legacy']);
  assert(sc.checkGoal(git).passed === false, 'Hotfix must be a new commit directly on v1.0');
});

test('28: Clone and track solution', () => {
  const sc = SCENARIOS.find(s => s.id === '28');
  const git = new VirtualGit();
  sc.setup(git);
  git.clone('origin', 'app');
  git.checkoutOrSwitch('feature/profile', true);
  git.workingTree.set('profile.js', 'export const profile = {};\n');
  git.add(['profile.js']);
  git.commit(['-m', 'feat: user profile']);
  git.push(['-u', 'origin', 'feature/profile']);
  assert(sc.checkGoal(git).passed === true, '28 solution should pass');
});

test('28: Creating and pushing a branch without cloning or committing must fail', () => {
  const sc = SCENARIOS.find(s => s.id === '28');
  const noClone = new VirtualGit();
  sc.setup(noClone);
  noClone.checkoutOrSwitch('feature/profile', true);
  noClone.push(['-u', 'origin', 'feature/profile']);
  assert(sc.checkGoal(noClone).passed === false, 'A pushed branch cannot substitute for cloning and committing');

  const noCommit = new VirtualGit();
  sc.setup(noCommit);
  noCommit.clone('origin', 'app');
  noCommit.checkoutOrSwitch('feature/profile', true);
  noCommit.push(['-u', 'origin', 'feature/profile']);
  assert(sc.checkGoal(noCommit).passed === false, 'The feature branch must contain a new commit');
});

test('29: Rebase conflict and continue solution', () => {
  const sc = SCENARIOS.find(s => s.id === '29');
  const git = new VirtualGit();
  sc.setup(git);

  // Advance main after setup so the replay must keep unrelated upstream work.
  git.checkoutOrSwitch('main');
  git.workingTree.set('upstream-only.txt', 'keep this upstream file\n');
  git.add(['upstream-only.txt']);
  git.commit(['-m', 'feat: upstream-only file']);
  git.checkoutOrSwitch('feature');

  const rebaseRes = git.rebase('main');
  assert(rebaseRes.code === 1, 'Rebase should pause on conflict');
  assert(git.rebaseInProgress, 'Rebase should be in progress');
  assert(git.rebaseState.currentReplayIndex === 1, 'The first feature commit should replay before the second conflicts');
  assert(git.workingTree.get('app.py').includes('<<<<<<< HEAD'), 'Conflict markers should be in app.py');
  assert(git.workingTree.has('upstream-only.txt'), 'The new base tree must be present during conflict resolution');
  assert(git.index.has('helper.js'), 'The first replayed commit must be present in the index during conflict resolution');
  
  // Resolve conflict
  git.workingTree.set('app.py', 'console.log("base - main updated");\nconsole.log("base - feature step 2");\n');
  git.add(['app.py']);
  const contRes = git.rebase('--continue');
  assert(contRes.code === 0, `Rebase continue should succeed: ${contRes.output}`);
  assert(!git.rebaseInProgress, 'Rebase should no longer be in progress');
  const headTree = git.commits.get(git.branches.get('feature')).tree;
  assert(headTree.get('upstream-only.txt') === 'keep this upstream file\n', 'The new base file must survive replay');
  assert(headTree.get('helper.js') === git.scenarioMeta.helperContent, 'The first replayed commit must survive');
  assert(headTree.get('test.js') === git.scenarioMeta.testContent, 'The final replayed commit must survive');
  const result = sc.checkGoal(git);
  assert(result.passed === true, `29 solution should pass: ${result.message}`);
});

test('29: Rebase continue rejects an unstaged conflict resolution', () => {
  const sc = SCENARIOS.find(s => s.id === '29');
  const git = new VirtualGit();
  sc.setup(git);
  git.rebase('main');

  git.workingTree.set('app.py', 'console.log("resolved without staging");\n');
  const contRes = git.rebase('--continue');
  assert(contRes.code === 1, 'Unstaged conflict content must not be committed');
  assert(git.rebaseInProgress, 'Rebase should remain paused until the conflict path is staged');
  assert(git.rebaseState.unresolvedFiles.has('app.py'), 'The unresolved path should remain tracked');
  assert(git.commits.get(git.rebaseState.newBaseId).tree.get('app.py') === 'console.log("base - main updated");\n', 'No commit should be created from stale index content');
});

test('29: Every path in a multi-file conflict must be staged', () => {
  const sc = SCENARIOS.find(s => s.id === '29');
  const git = new VirtualGit();
  sc.setup(git);

  const featureTip = git.commits.get(git.branches.get('feature'));
  const step2 = git.commits.get(featureTip.parents[0]);
  const step1 = git.commits.get(step2.parents[0]);
  const base = git.commits.get(step1.parents[0]);
  const main = git.commits.get(git.branches.get('main'));
  base.tree.set('settings.js', 'setting = "base";\n');
  step1.tree.set('settings.js', 'setting = "base";\n');
  main.tree.set('settings.js', 'setting = "main";\n');
  step2.tree.set('settings.js', 'setting = "feature";\n');
  featureTip.tree.set('settings.js', 'setting = "feature";\n');

  const rebaseRes = git.rebase('main');
  assert(rebaseRes.code === 1, 'Rebase should pause on the second feature commit');
  assert(git.rebaseState.unresolvedFiles.size === 2, 'Both conflicting paths should be tracked');

  git.workingTree.set('app.py', 'console.log("base - main updated");\nconsole.log("base - feature step 2");\n');
  git.workingTree.set('settings.js', 'setting = "main and feature";\n');
  git.add(['app.py']);
  const partial = git.rebase('--continue');
  assert(partial.code === 1, 'Continue must wait until every conflicted path is staged');
  assert(git.rebaseState.unresolvedFiles.has('settings.js'), 'Unstaged settings.js should remain unresolved');

  git.add(['settings.js']);
  const completed = git.rebase('--continue');
  assert(completed.code === 0, `Continue should succeed after staging both paths: ${completed.output}`);
  assert(sc.checkGoal(git).passed, 'Resolved multi-file replay should satisfy Scenario 29');
  const headTree = git.commits.get(git.branches.get('feature')).tree;
  assert(headTree.get('settings.js') === 'setting = "main and feature";\n', 'The staged multi-file resolution must be committed');
});

test('29: Rebase abort restores the original feature state', () => {
  const sc = SCENARIOS.find(s => s.id === '29');
  const git = new VirtualGit();
  sc.setup(git);
  const originalTip = git.branches.get('feature');
  git.rebase('main');

  const abortRes = git.rebase('--abort');
  assert(abortRes.code === 0, `Abort should succeed: ${abortRes.output}`);
  assert(!git.rebaseInProgress && git.conflictState === null, 'Abort should clear rebase and conflict state');
  assert(git.branches.get('feature') === originalTip, 'Abort should restore the original branch tip');
  assert(git.workingTree.get('app.py') === 'console.log("base - feature step 2");\n', 'Abort should restore the original feature file');
  assert(git.workingTree.has('test.js') && git.workingTree.has('helper.js'), 'Abort should restore all original feature files');
});

test('29: Rebase skip drops only the conflicted commit', () => {
  const sc = SCENARIOS.find(s => s.id === '29');
  const git = new VirtualGit();
  sc.setup(git);
  git.rebase('main');

  const skipRes = git.rebase('--skip');
  assert(skipRes.code === 0, `Skip should continue the remaining replay: ${skipRes.output}`);
  assert(!git.rebaseInProgress, 'Skip should finish when no later commit conflicts');
  const headTree = git.commits.get(git.branches.get('feature')).tree;
  assert(headTree.get('app.py') === 'console.log("base - main updated");\n', 'Skip should discard the conflicting app change');
  assert(headTree.has('helper.js') && headTree.has('test.js'), 'Skip should preserve the earlier and later feature commits');
  assert(!sc.checkGoal(git).passed, 'Skipping a required feature commit must not pass the scenario');
});

test('29: Resetting feature to main and dropping its commits must fail', () => {
  const sc = SCENARIOS.find(s => s.id === '29');
  const git = new VirtualGit();
  sc.setup(git);
  git.reset('main', '--hard');
  assert(sc.checkGoal(git).passed === false, 'All three original feature commits must be preserved');
});

test('30: Fixup and autosquash solution', () => {
  const sc = SCENARIOS.find(s => s.id === '30');
  const git = new VirtualGit();
  sc.setup(git);
  git.commit(['--fixup', git.scenarioMeta.targetId]);
  const plan = git.rebaseInteractivePlan('main', { autosquash: true });
  assert(plan.commits.some(c => c.action === 'fixup'), 'Plan should include autosquashed fixup action');
  const applyRes = git.rebaseInteractiveApply(plan.upstreamId, plan.commits);
  assert(applyRes.code === 0, 'Rebase apply should succeed');
  assert(sc.checkGoal(git).passed === true, '30 solution should pass');
});

test('31: PR lifecycle solution', () => {
  const sc = SCENARIOS.find(s => s.id === '31');
  const git = new VirtualGit();
  sc.setup(git);
  git.fetchCmd(['origin']);
  git.rebase('origin/main');
  const rejectedPush = git.push(['origin', 'feature/cart']);
  assert(rejectedPush.code === 1, 'Plain push must be rejected');
  const leasedPush = git.push(['--force-with-lease', 'origin', 'feature/cart']);
  assert(leasedPush.code === 0, 'Force with lease push must succeed');
  git.checkoutOrSwitch('main');
  git.pull(['origin', 'main']);
  git.branch(['-d', 'feature/cart']);
  git.fetchCmd(['--prune']);
  assert(sc.checkGoal(git).passed === true, '31 solution should pass');
});

test('31: Deleting the PR branch without merging it must fail', () => {
  const sc = SCENARIOS.find(s => s.id === '31');
  const git = new VirtualGit();
  sc.setup(git);
  git.checkoutOrSwitch('main');
  git.branch(['-D', 'feature/cart']);
  git.push(['origin', '--delete', 'feature/cart']);
  git.pull(['origin', 'main']);
  git.fetchCmd(['--prune']);
  assert(!git.branches.has('feature/cart'), 'Local feature branch should be gone');
  assert(!git.branches.has('origin/feature/cart'), 'Remote tracking branch should be pruned');
  assert(!git.remotes.origin.branches.has('feature/cart'), 'Remote feature branch should be gone');
  assert(git.branches.get('main') === git.remotes.origin.branches.get('main'), 'Local main should match remote main');
  assert(sc.checkGoal(git).passed === false, 'Remote main must contain the cart feature after PR merge');
});

test('32: Rebase onto solution', () => {
  const sc = SCENARIOS.find(s => s.id === '32');
  const git = new VirtualGit();
  sc.setup(git);
  const ontoRes = git.rebaseOnto('main', 'feature/api', 'feature/ui');
  assert(ontoRes.code === 0, `rebaseOnto failed: ${ontoRes.output}`);
  assert(sc.checkGoal(git).passed === true, '32 solution should pass');
});

test('33: Secret purge filter-repo solution', () => {
  const sc = SCENARIOS.find(s => s.id === '33');
  const git = new VirtualGit();
  sc.setup(git);
  const unconfirmed = sc.checkGoal(git);
  assert(unconfirmed.passed === false, '33 must require credential rotation confirmation');
  assert(unconfirmed.message.includes('撤銷並輪替'), `Expected rotation warning, got: ${unconfirmed.message}`);
  git.configCmd(['lab.secret-rotation-confirmed', 'yes']);
  const filterRes = git.filterRepo(['--path', '.env', '--invert-paths']);
  assert(filterRes.code === 0, 'filterRepo should succeed');
  git.add(['.gitignore']);
  git.commit(['-m', 'chore: ignore .env']);
  const pushRes = git.push(['--force-with-lease', 'origin', 'main']);
  assert(pushRes.code === 0, 'push --force-with-lease should succeed');
  assert(sc.checkGoal(git).passed === true, '33 solution should pass');
});

// Summary
console.log(`\n========================================`);
console.log(`Web Scenarios Test Results: ${totalPassed} passed, ${totalFailed} failed, ${totalExecuted} executed`);
console.log(`========================================\n`);

if (totalFailed > 0) {
  process.exit(1);
} else {
  console.log('All Web Scenario tests passed cleanly!');
}
