/* Run against a served app: agent-browser eval --stdin < tests/web/browser_smoke.js */
(() => {
  const results = [];
  const assert = (condition, message) => { if (!condition) throw new Error(message); };
  const command = (value, expected = 0) => {
    const code = window.executeLabCommand(value);
    assert(code === expected, `${value}: expected ${expected}, received ${code}`);
  };
  const closeDialogs = () => {
    window.closeMissionModal(); window.closeVictoryModal(); window.closeCourseMapModal(); window.closeGraduationModal();
  };
  const level = (id, run) => {
    closeDialogs(); window.goToScenarioFromCheat(id); closeDialogs(); command('clear', undefined);
    run();
    assert(document.querySelector('#terminal-next-bar').style.display !== 'none', `${id}: did not pass in the actual app`);
    results.push(id);
  };
  localStorage.setItem('git_lab_hide_intro_modal', 'true');
  level('36', () => { command('git init -b main && git add README.md && git commit -m "docs: first snapshot"'); });
  command('git cherry-pick && echo unexpected > marker', 1);
  assert(![...document.querySelectorAll('#files-list .file-name')].some(n => n.textContent === 'marker'), 'Failed command must stop &&');
  level('37', () => {
    command('git add report.txt');
    window.switchTab('files'); document.querySelector('#btn-edit-file').click();
    const editor = document.querySelector('#file-editor'); assert(!editor.hidden, 'Editor opens');
    editor.value = 'draft-after-add\n'; document.querySelector('#btn-save-file').click();
    command('git status -s'); assert(document.querySelector('#terminal-output').textContent.includes('MM report.txt'), 'Short status combines index and worktree columns');
    command('git diff && git diff --staged && git commit -m "docs: ready report"');
  });
  level('12', () => {
    command('git add -p shopping.py');
    document.querySelector('#btn-edit-file').click(); assert(document.querySelector('#file-editor').hidden, 'Patch freezes file editing');
    command('y'); command('n'); command('git diff --staged && git commit -m "fix: discount"');
  });
  level('11', () => {
    command('git config core.hooksPath .githooks && chmod +x .githooks/pre-commit');
    command('git commit -m "test: secret"', 1);
    command('echo AWS_KEY= > config.env'); command('git add config.env && git commit -m "chore: remove secret"');
  });
  level('09', () => {
    command('git worktree add -b hotfix-p0 ../hotfix main && cd ../hotfix');
    command('echo "runFixed();" > app.js'); command('git add app.js && git commit -m "fix: hotfix"');
    command('git switch main && git merge hotfix-p0 && cd .. && git worktree remove ../hotfix');
    command('cat app.js'); assert(document.querySelector('#terminal-output').textContent.includes('featureInProgress();'), 'Original worktree draft survives');
  });
  level('17', () => {
    command('git config rerere.enabled true'); command('git merge feature/api', 1);
    command('echo "serveLtsAndAsync();" > server.js'); command('git add server.js && git commit -m "merge: first"');
    command('git reset --hard main-before'); command('git merge feature/api', 1);
    command('git add server.js && git commit -m "merge: reused"');
  });
  level('38', () => { command('git revert bad-config'); });
  level('39', () => { command('git fetch origin'); command('git pull --ff-only', 1); command('git pull --no-rebase && git push origin main'); });
  level('41', () => {
    command('echo -e "build/\n*.log\n!logs/keep.log" > .gitignore');
    command('git check-ignore -v build/output.js debug.log'); command('git check-ignore -v logs/keep.log');
    command('git add . && git commit -m "chore: ignore artifacts"');
  });
  level('44', () => {
    command('git rev-parse HEAD^ HEAD^2 HEAD~2'); command('git log --oneline A..B'); command('git log --oneline A...B');
    command('git diff A..B'); command('git diff A...B'); command('git tag first-parent HEAD^ && git tag second-parent HEAD^2 && git tag ancestor HEAD~2');
  });
  closeDialogs(); window.goToScenarioFromCheat('37'); closeDialogs(); window.switchTab('files');
  return JSON.stringify({passed: results, total: results.length, fileEditor: true, patchFreeze: true, commandFailureStopsChain: true});
})();
