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
import './engine_curriculum.mjs';
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
runFile('scenarios-foundations.js');
runFile('curriculum.js');
runFile('curriculum-navigation.js');

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

test('Protected text for scenarios 00-23 matches the approved curriculum baseline', () => {
  const fixturePath = path.resolve(__dirname, '../fixtures/protected-scenario-text.json');
  const baseline = JSON.parse(fs.readFileSync(fixturePath, 'utf-8'));
  const scenariosById = new Map(SCENARIOS.map((scenario) => [scenario.id, scenario]));

  for (const [id, expected] of Object.entries(baseline.scenarios)) {
    const actual = scenariosById.get(id);
    assert(actual, `Scenario ${id} is missing from the current definitions`);
    for (const field of baseline.fields) {
      assert(
        JSON.stringify(actual[field]) === JSON.stringify(expected[field]),
        `Scenario ${id} protected field '${field}' changed from baseline ${baseline.baselineCommit}`
      );
    }
  }
});

test('Web navigation skips CLI-only optionals and counts playable levels', () => {
  const navigation = sandbox.CURRICULUM_NAVIGATION;
  const rawById = new Map(SCENARIOS.map((scenario) => [scenario.id, scenario]));
  const ordered = CURRICULUM.chapters.flatMap((chapter, chapterIndex) =>
    chapter.levels.map((level) => ({
      ...rawById.get(level.id),
      ...level,
      chapterIndex,
      cliOnly: Boolean(level.cliOnly || rawById.get(level.id)?.cliOnly)
    }))
  ).concat(CURRICULUM.optional.map((level) => ({
    ...rawById.get(level.id),
    ...level,
    chapterIndex: 99,
    cliOnly: Boolean(level.cliOnly || rawById.get(level.id)?.cliOnly)
  })));
  const lastCoreIndex = ordered.findIndex((scenario) => scenario.id === '23');
  const previousCoreIndex = ordered.findIndex((scenario) => scenario.id === '33');

  assert(navigation.countWebPlayable(ordered) === 41, 'The eight CLI-only optionals must not count toward Web completion');
  assert(navigation.nextWebPlayableIndex(ordered, previousCoreIndex) === lastCoreIndex, 'The final playable core level should follow id 33');
  assert(navigation.nextWebPlayableIndex(ordered, lastCoreIndex) === -1, 'No Web next level should follow id 23');
  assert(navigation.nextWebPlayableIndex(ordered, lastCoreIndex, scenario => scenario.chapterIndex > ordered[lastCoreIndex].chapterIndex) === -1,
    'The final chapter must not link to a CLI-only optional');
  assert(ordered.find(scenario => scenario.id === '34')?.cliOnly && ordered.find(scenario => scenario.id === '35')?.cliOnly,
    'CLI-only status must come from curriculum metadata');

  const completed = new Set(ordered.filter(scenario => !scenario.cliOnly).map(scenario => scenario.id));
  completed.delete('23');
  assert(navigation.nextWebProgressionIndex(ordered, lastCoreIndex, completed) === -1,
    'An unpassed final level must not be mistaken for course completion');
  completed.add('23');
  assert(navigation.nextWebProgressionIndex(ordered, lastCoreIndex, completed) === -1,
    'The completed final level must not lead to a CLI-only optional');
  completed.delete('33');
  assert(navigation.nextWebProgressionIndex(ordered, lastCoreIndex, completed) === previousCoreIndex,
    'An earlier incomplete Web level remains reachable after the final core level');
});

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

test('06: force-with-lease rejects an existing remote when tracking ref is missing', () => {
  const git = new VirtualGit();
  const sc = SCENARIOS.find(s => s.id === '06');
  sc.setup(git);
  const colleagueTip = git.scenarioMeta.colleagueId;
  git.branches.delete('origin/main');

  const pushRes = git.push(['--force-with-lease']);
  assert(pushRes.code === 1, 'A missing tracking ref must not authorize overwriting an existing remote branch');
  assert(pushRes.output.includes('(stale info)'), `Expected stale lease rejection, got: ${pushRes.output}`);
  assert(git.remotes.origin.branches.get('main') === colleagueTip, 'The colleague remote commit must remain intact');
});

test('06: force-with-lease rejects an outdated tracking ref', () => {
  const git = new VirtualGit();
  const sc = SCENARIOS.find(s => s.id === '06');
  sc.setup(git);
  const colleagueTip = git.scenarioMeta.colleagueId;
  git.branches.set('origin/main', git.scenarioMeta.baseId);

  const pushRes = git.push(['--force-with-lease']);
  assert(pushRes.code === 1, 'An outdated tracking ref must not authorize a force push');
  assert(git.remotes.origin.branches.get('main') === colleagueTip, 'The colleague remote commit must remain intact');
});

test('06: force-with-lease allows a matching remote-tracking ref', () => {
  const git = new VirtualGit();
  const sc = SCENARIOS.find(s => s.id === '06');
  sc.setup(git);
  const colleagueTip = git.scenarioMeta.colleagueId;
  git.branches.set('origin/main', colleagueTip);

  const pushRes = git.push(['--force-with-lease']);
  assert(pushRes.code === 0, `A matching lease should allow the rewrite: ${pushRes.output}`);
  assert(git.remotes.origin.branches.get('main') === git.branches.get('main'), 'The intended local tip should be pushed');
});

test('06: force-with-lease still allows new branches and fast-forward pushes', () => {
  const sc = SCENARIOS.find(s => s.id === '06');
  const newBranch = new VirtualGit();
  sc.setup(newBranch);
  const localTip = newBranch.branches.get('main');
  newBranch.branches.set('feature/lease', localTip);
  const newBranchPush = newBranch.push(['--force-with-lease', 'origin', 'feature/lease']);
  assert(newBranchPush.code === 0, `Creating a remote branch should not require a lease: ${newBranchPush.output}`);
  assert(newBranch.remotes.origin.branches.get('feature/lease') === localTip, 'The new remote branch should point at the local tip');

  const fastForward = new VirtualGit();
  sc.setup(fastForward);
  fastForward.remotes.origin.branches.set('main', fastForward.scenarioMeta.baseId);
  fastForward.branches.delete('origin/main');
  const fastForwardPush = fastForward.push(['--force-with-lease']);
  assert(fastForwardPush.code === 0, `A fast-forward should remain allowed without a tracking ref: ${fastForwardPush.output}`);
  assert(fastForward.remotes.origin.branches.get('main') === fastForward.branches.get('main'), 'Fast-forward should update remote main');
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
const sc = SCENARIOS.find(s => s.id === '01'); const git = new VirtualGit(); sc.setup(git);
  git.add(['.']); git.commit(['-m', 'feat: initial page structure']);
  assert(sc.checkGoal(git).passed, '01 solution should pass');
});

test('02: Branch fast-forward merge solution', () => {
const sc = SCENARIOS.find(s => s.id === '02'); const git = new VirtualGit(); sc.setup(git);
  git.branch(['feature/login']); assert(!sc.checkGoal(git).passed, 'An unchanged branch must not pass');
  git.checkoutOrSwitch('feature/login'); git.workingTree.set('app.js', 'login();\n'); git.add(['app.js']); git.commit(['-m', 'feat: add login']);
  git.checkoutOrSwitch('main'); git.merge('feature/login'); assert(sc.checkGoal(git).passed, '02 solution should pass');
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
const sc = SCENARIOS.find(s => s.id === '07'); const git = new VirtualGit(); sc.setup(git);
  assert(git.cherryPick('sec001').code === 1, 'A competing change should conflict');
  assert(git.cherryPick('--abort').code === 0, 'Abort restores the original branch');
  git.cherryPick('sec001'); git.workingTree.set('auth.js', git.scenarioMeta.resolved); git.add(['auth.js']);
  assert(git.cherryPick('--continue').code === 0, 'Staged resolution should continue');
  assert(sc.checkGoal(git).passed, '07 solution should pass');
});

test('08: Reset to recovered commit via reflog solution', () => {
  const sc = SCENARIOS.find(s => s.id === '08');
  const git = new VirtualGit();
  sc.setup(git);
  git.reset('lost99', '--hard');
  assert(sc.checkGoal(git).passed === true, '08 solution should pass');
});

test('09: Independent worktree repair and cleanup solution', () => {
const sc = SCENARIOS.find(s => s.id === '09'); const git = new VirtualGit(); sc.setup(git);
  git.branch(['hotfix-p0']); assert(!sc.checkGoal(git).passed, 'A plain branch is not a worktree'); git.branch(['-D','hotfix-p0']);
  assert(git.worktree(['add','-b','hotfix-p0','../hotfix','main']).code === 0, 'Create linked worktree');
  git.changeDirectory('../hotfix'); git.workingTree.set('app.js','runFixed();\n'); git.add(['app.js']); git.commit(['-m','fix: hotfix']);
  git.checkoutOrSwitch('main'); git.merge('hotfix-p0'); git.changeDirectory('..'); git.worktree(['remove','../hotfix']);
  const result = sc.checkGoal(git); assert(result.passed, result.message);
});

test('10: Bisect solution', () => {
const sc = SCENARIOS.find(s => s.id === '10'); const git = new VirtualGit(); sc.setup(git);
  git.bisect(['start']); git.bisect(['bad']); git.bisect(['good','c1000']);
  assert(!sc.checkGoal(git).passed, 'Only marking boundaries must not pass');
  for(let i=0; !git.bisectFoundId && i<10; i++) git.bisect([git.workingTree.get('calc.js').includes('3')?'bad':'good']);
  assert(git.bisectFoundId === 'bug004', 'Find the first bad commit'); assert(!sc.checkGoal(git).passed, 'Must reset after finding culprit');
  git.bisect(['reset']); assert(sc.checkGoal(git).passed, '10 solution should pass');
});

test('11: Hooks block then allow a corrected normal commit', () => {
const sc = SCENARIOS.find(s => s.id === '11'); const git = new VirtualGit(); sc.setup(git);
  git.configCmd(['core.hooksPath','.githooks']); git.executableFiles = new Set(['.githooks/pre-commit']);
  assert(git.commit(['-m','test: blocked secret']).code === 1, 'Secret is blocked');
  git.workingTree.set('config.env','AWS_KEY=""\n'); git.add(['config.env']);
  assert(git.commit(['-m','chore: remove secret']).code === 0, 'Clean commit is allowed'); assert(sc.checkGoal(git).passed, '11 solution should pass');
  const bypass = new VirtualGit(); sc.setup(bypass); bypass.commit(['--no-verify','-m','bypass']);
  assert(!sc.checkGoal(bypass).passed, 'Bypassing a hook must not be course completion');
});

test('12: Add patch solution', () => {
const sc = SCENARIOS.find(s => s.id === '12'); const git = new VirtualGit(); sc.setup(git);
  const patch = git.add(['-p','shopping.py']); assert(patch.patch.hunks.length === 2, 'Two independent changes');
  git.addPatch('shopping.py',[0]); git.commit(['-m','fix: discount']); assert(sc.checkGoal(git).passed, '12 solution should pass');
  const all = new VirtualGit(); sc.setup(all); all.add(['shopping.py']); all.commit(['-m','fix: discount']); assert(!sc.checkGoal(all).passed, 'Bundling both changes must fail');
});

test('13: Untrack cached solution', () => {
const sc = SCENARIOS.find(s => s.id === '13'); const git = new VirtualGit(); sc.setup(git);
  git.rm(['--cached','.env']); assert(!sc.checkGoal(git).passed, 'Uncommitted index removal must fail');
  git.add(['.gitignore']); git.commit(['-m','chore: untrack .env']); assert(sc.checkGoal(git).passed, '13 solution should pass');
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
const sc = SCENARIOS.find(s => s.id === '17'); const git = new VirtualGit(); sc.setup(git);
  git.configCmd(['rerere.enabled','true']); assert(!sc.checkGoal(git).passed, 'Configuration alone must fail');
  git.merge('feature/api'); git.workingTree.set('server.js',git.scenarioMeta.resolved); git.add(['server.js']); git.commit(['-m','merge: first resolution']);
  assert(!sc.checkGoal(git).passed, 'Recording without reuse must fail');
  git.reset('main-before','--hard'); git.merge('feature/api'); assert(git.workingTree.get('server.js')===git.scenarioMeta.resolved, 'Actual recorded solution reused');
  git.add(['server.js']); git.commit(['-m','merge: reused resolution']); assert(sc.checkGoal(git).passed, '17 solution should pass');
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
const sc = SCENARIOS.find(s => s.id === '19'); const git = new VirtualGit(); sc.setup(git);
  git.stashCmd(['push','-u']);
  git.stashCmd(['apply','--index']); assert(git.index.get('cart.py')==='cartWithDiscount();\n','Index is restored');
  git.reset('HEAD','--hard'); git.workingTree.delete('coupon.py');
  git.checkoutOrSwitch('main'); git.workingTree.set('app.py','runFixed();\n'); git.add(['app.py']); git.commit(['-m','fix: emergency hotfix']);
  git.checkoutOrSwitch('feature/cart'); git.workingTree.set('cart.py','cartWithTax();\n'); git.add(['cart.py']); git.commit(['-m','feat: tax']);
  assert(git.stashCmd(['pop','--index']).code===1,'Pop conflicts'); assert(git.stash.length===1,'Conflict preserves stash');
  git.workingTree.set('cart.py',git.scenarioMeta.resolved); git.add(['cart.py','coupon.py']); git.commit(['-m','feat: combine tax and discount']); git.stashCmd(['drop']);
  const result=sc.checkGoal(git); assert(result.passed,result.message);
});

test('20: Clean solution', () => {
  const sc = SCENARIOS.find(s => s.id === '20');
  const git = new VirtualGit();
  sc.setup(git);
  git.mvCmd(['utils.py', 'helpers.py']);
  git.cleanCmd(['-nd']);
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
const sc = SCENARIOS.find(s => s.id === '25'); const git = new VirtualGit(); sc.setup(git);
  git.restore(['config.js']); git.restore(['--staged','debug.log']);
  git.checkoutOrSwitch('mixed-demo'); git.reset('HEAD~1','--mixed');
  assert(git.workingTree.get('payment.js')==='function pay() { process(); }\n', 'Mixed keeps worktree');
  git.restore(['payment.js']); git.checkoutOrSwitch('hard-demo'); git.reset('HEAD~1','--hard');
  assert(git.workingTree.get('payment.js')==='function pay() {}\n','Hard resets worktree');
  git.checkoutOrSwitch('main'); git.reset('HEAD~1','--soft'); git.commit(['-m','feat: complete payment setup']);
  const result=sc.checkGoal(git); assert(result.passed,result.message);
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
  git.checkoutOrSwitch('abort-demo'); git.rebase('main'); git.rebase('--abort');
  git.checkoutOrSwitch('skip-demo'); git.rebase('main'); git.rebase('--skip');
  git.checkoutOrSwitch('feature');

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
  git.index = new Map(featureTip.tree); git.workingTree = new Map(featureTip.tree);
  git.checkoutOrSwitch('abort-demo'); git.rebase('main'); git.rebase('--abort');
  git.checkoutOrSwitch('skip-demo'); git.rebase('main'); git.rebase('--skip');
  git.checkoutOrSwitch('feature');

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
  assert(git.labCmd(['pr','merge','feature/cart']).code===0,'Explicit platform merge must succeed');
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

  const originalMain = git.branches.get('main');
  const originalDirty = git.scenarioMeta.dirtyId;
  git.branches.set('release', originalDirty);
  git.tag(['v1', originalDirty]);
  git.configCmd(['lab.secret-rotation-confirmed', 'yes']);
  const filterRes = git.filterRepo(['--path', '.env', '--invert-paths']);
  assert(filterRes.code === 0, 'filterRepo should succeed');

  const rewrittenMain = git.branches.get('main');
  const rewrittenSecret = git.commits.get(git.branches.get('release'));
  const rewrittenDashboard = git.commits.get(rewrittenMain);
  assert(rewrittenMain !== originalMain, 'Filtering must move local main to a new commit hash');
  assert(git.branches.get('origin/main') === originalMain, 'The remote-tracking lease ref must remain at the expected old tip');
  assert(git.remotes.origin.branches.get('main') === originalMain, 'The remote server ref must remain unchanged until push');
  assert(git.commits.get(originalMain).tree.has('.env'), 'The old remote commit object must remain immutable');
  assert(git.branches.get('release') !== originalDirty, 'Other local branches must move to rewritten commits');
  assert(git.tags.get('v1').commitId === git.branches.get('release'), 'Tags must move with rewritten local history');
  assert(rewrittenSecret.parents[0] === git.scenarioMeta.baseId, 'The secret commit parent must map to the rewritten base');
  assert(!rewrittenSecret.tree.has('.env') && !rewrittenDashboard.tree.has('.env'), 'Rewritten trees must omit .env');
  assert(rewrittenSecret.tree.get('app.js') === 'start();\n', 'Filtering must preserve non-target files');
  assert(rewrittenDashboard.tree.get('dash.js') === 'render();\n', 'Filtering must preserve dashboard content');
  assert(git.workingTree.has('.gitignore') && !git.workingTree.has('.env'), 'The filtered checkout must retain .gitignore and remove .env');

  assert(sc.checkGoal(git).passed === false, 'Filtering alone must not pass before .gitignore is committed and pushed');
  git.add(['.gitignore']);
  git.commit(['-m', 'chore: ignore .env']);
  const regularPush = git.push(['origin', 'main']);
  assert(regularPush.code === 1, 'A normal push must reject the rewritten non-fast-forward history');
  assert(git.remotes.origin.branches.get('main') === originalMain, 'A rejected normal push must preserve remote history');
  assert(sc.checkGoal(git).passed === false, 'The scenario must still fail before a safe rewrite push');

  const pushRes = git.push(['--force-with-lease', 'origin', 'main']);
  assert(pushRes.code === 0, `push --force-with-lease should succeed: ${pushRes.output}`);
  assert(git.remotes.origin.branches.get('main') === git.branches.get('main'), 'The remote should move only after the safe push');
  assert(!Array.from(git.getReachableCommits(git.remotes.origin.branches.get('main')))
    .some(id => git.commits.get(id)?.tree?.has('.env')), 'The pushed remote history must no longer contain .env');
  assert(sc.checkGoal(git).passed === true, '33 solution should pass');

  const unsafe = new VirtualGit();
  sc.setup(unsafe);
  unsafe.configCmd(['lab.secret-rotation-confirmed', 'yes']);
  unsafe.filterRepo(['--path', '.env', '--invert-paths']);
  unsafe.add(['.gitignore']);
  unsafe.commit(['-m', 'chore: ignore .env']);
  const forcePush = unsafe.push(['--force', 'origin', 'main']);
  assert(forcePush.code === 0, 'The unsafe force-push example should update the remote');
  assert(sc.checkGoal(unsafe).passed === false, 'Scenario 33 must reject a rewrite pushed without a lease');
});

// Foundations: meaningful state changes and failure cases.
function foundation(id, solution) {
  const sc = SCENARIOS.find(s => s.id === id), git = new VirtualGit(); sc.setup(git);
  assert(!sc.checkGoal(git).passed, `${id}: fresh must fail`);
  solution(git);
  const result = sc.checkGoal(git); assert(result.passed, `${id}: ${result.message}`);
}
test('36: Initialize an uninitialized repository and commit only the chosen snapshot', () => {
  foundation('36', git => { assert(git.add(['README.md']).code !== 0, 'Cannot stage before init'); git.init(['-b','main']); git.add(['README.md']); git.commit(['-m','docs: first snapshot']); });
});
test('37: Commit the index snapshot and keep the later working edit', () => {
  foundation('37', git => { git.add(['report.txt']); git.workingTree.set('report.txt',git.scenarioMeta.working); git.diffCmd([]); git.diffCmd(['--staged']); git.commit(['-m','docs: ready report']); });
  const sc=SCENARIOS.find(s=>s.id==='37'), git=new VirtualGit(); sc.setup(git); git.add(['report.txt']); git.workingTree.set('report.txt',git.scenarioMeta.working); git.commit(['-am','docs: accidentally update snapshot']); assert(!sc.checkGoal(git).passed,'commit -a must not hide the staging mistake');
});
test('38: Revert an ordinary shared commit without losing later updates', () => {
  foundation('38', git => git.revert('bad-config'));
  const sc=SCENARIOS.find(s=>s.id==='38'), git=new VirtualGit(); sc.setup(git); git.reset('HEAD~2','--hard'); assert(!sc.checkGoal(git).passed,'Reset must not replace shared-history reversal');
});
for(const strategy of ['--rebase','--no-rebase']) test(`39: Observe ff-only rejection then integrate with ${strategy}`,()=>{
  foundation('39', git=>{ git.fetchCmd(['origin']); const before=git.getHeadCommitId(); assert(git.pull(['--ff-only']).code!==0,'Divergence must be rejected'); assert(git.getHeadCommitId()===before,'Rejection leaves local HEAD unchanged'); git.pull([strategy]); git.push(['origin','main']); });
});
test('40: Correct the remote URL and diagnose authentication without changing author identity',()=>{
  foundation('40',git=>{git.remoteCmd(['-v']);git.remoteCmd(['set-url','origin',git.scenarioMeta.expectedUrl]);git.configCmd(['lab.auth-diagnosis','ssh-key']);git.configCmd(['lab.permission-check','required']);});
  const sc=SCENARIOS.find(s=>s.id==='40'),git=new VirtualGit();sc.setup(git);git.configCmd(['user.email','new@example.com']);assert(!sc.checkGoal(git).passed,'Author changes cannot repair authentication');
});
test('41: Commit ignore patterns and an exception while excluding generated artifacts',()=>{
  foundation('41',git=>{git.workingTree.set('.gitignore','build/\n*.log\n!logs/keep.log\n');git.checkIgnore(['-v','build/output.js','debug.log']);git.checkIgnore(['-v','logs/keep.log']);git.add(['.']);git.commit(['-m','chore: ignore artifacts']);});
});
test('44: Inspect revision ranges and tag the actual merge parents',()=>{
  foundation('44',git=>{git.revParse(['HEAD^','HEAD^2','HEAD~2']);git.logCmd(['--oneline','A..B']);git.logCmd(['--oneline','A...B']);git.diffCmd(['A..B']);git.diffCmd(['A...B']);git.tag(['first-parent','HEAD^']);git.tag(['second-parent','HEAD^2']);git.tag(['ancestor','HEAD~2']);});
});
test('All curriculum entries have one definition, a guide, and the declared platform',()=>{
  runFile('command-guides.js');runFile('command-guides-extra.js');runFile('command-guides-foundations.js');
  const guides=sandbox.COMMAND_GUIDES; const manifest=[...CURRICULUM.chapters.flatMap(ch=>ch.levels),...CURRICULUM.optional];
  assert(manifest.length===49 && new Set(manifest.map(l=>l.id)).size===49,'49 unique manifest IDs');
  assert(SCENARIOS.length===49 && new Set(SCENARIOS.map(l=>l.id)).size===49,'49 unique definitions');
  for(const level of manifest){const sc=SCENARIOS.find(s=>s.id===level.id);assert(sc && guides[level.id],`Missing lesson or guide ${level.id}`);assert(Boolean(sc.cliOnly)===Boolean(level.cliOnly),`Platform mismatch ${level.id}`);}
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
