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

function assert(condition, message) {
  if (!condition) {
    totalFailed++;
    console.error(`  ❌ FAIL: ${message}`);
    throw new Error(message);
  }
}

function test(name, fn) {
  try {
    fn();
    totalPassed++;
    console.log(`  ✔ PASS: ${name}`);
  } catch (err) {
    // Already logged in assert
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
  git.status();
  git.diffCmd([]);
  git.diffCmd(['--staged']);
  git.logCmd(['--oneline', '--graph']);
  git.showCmd(['HEAD~1']);
  assert(sc.checkGoal(git).passed === true, '24 solution should pass');
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

test('29: Rebase conflict and continue solution', () => {
  const sc = SCENARIOS.find(s => s.id === '29');
  const git = new VirtualGit();
  sc.setup(git);
  const rebaseRes = git.rebase('main');
  assert(rebaseRes.code === 1, 'Rebase should pause on conflict');
  assert(git.rebaseInProgress, 'Rebase should be in progress');
  assert(git.workingTree.get('app.py').includes('<<<<<<< HEAD'), 'Conflict markers should be in app.py');
  
  // Resolve conflict
  git.workingTree.set('app.py', 'console.log("base - resolved");\n');
  git.add(['app.py']);
  const contRes = git.rebase('--continue');
  assert(contRes.code === 0, `Rebase continue should succeed: ${contRes.output}`);
  assert(!git.rebaseInProgress, 'Rebase should no longer be in progress');
  assert(sc.checkGoal(git).passed === true, '29 solution should pass');
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
console.log(`Web Scenarios Test Results: ${totalPassed} passed, ${totalFailed} failed`);
console.log(`========================================\n`);

if (totalFailed > 0) {
  process.exit(1);
} else {
  console.log('All Web Scenario tests passed cleanly!');
}
