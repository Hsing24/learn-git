/**
 * Git Scenario Lab - Main App Controller
 * Interactive Web Terminal, Graph synchronization, Scenario Management & Audio/Visual Celebrations
 */

document.addEventListener('DOMContentLoaded', () => {
  // Initialize Core Systems
  const git = new VirtualGit();
  const graphSvg = document.getElementById('git-graph-svg');
  const graphRenderer = new GraphRenderer(graphSvg);

  // App State
  let ORDERED_SCENARIOS = [];

  function initCurriculumOrder() {
    if (typeof CURRICULUM === 'undefined' || !CURRICULUM.chapters) {
      console.warn('CURRICULUM manifest not loaded, fallback to raw SCENARIOS');
      ORDERED_SCENARIOS = typeof SCENARIOS !== 'undefined' ? [...SCENARIOS] : [];
      return;
    }

    const scenarioMap = new Map((typeof SCENARIOS !== 'undefined' ? SCENARIOS : []).map(s => [s.id, s]));
    const manifestIds = new Set();
    const ordered = [];

    CURRICULUM.chapters.forEach((ch, chIdx) => {
      (ch.levels || []).forEach((lvl, lIdx) => {
        manifestIds.add(lvl.id);
        const raw = scenarioMap.get(lvl.id);
        if (raw) {
          ordered.push({
            ...raw,
            chapterKey: ch.key,
            chapterTitle: ch.title,
            chapterSummary: ch.summary,
            chapterIndex: chIdx,
            displayNum: `${chIdx}-${lIdx + 1}`,
            slug: lvl.slug,
            difficulty: lvl.difficulty || raw.difficulty,
            defaultTab: lvl.defaultTab || 'mission',
            isOptional: false,
            cliOnly: Boolean(lvl.cliOnly || raw.cliOnly)
          });
        } else {
          console.error(`Curriculum level id "${lvl.id}" not found in SCENARIOS!`);
        }
      });
    });

    (CURRICULUM.optional || []).forEach((opt, optIdx) => {
      manifestIds.add(opt.id);
      const raw = scenarioMap.get(opt.id);
      if (raw) {
        ordered.push({
          ...raw,
          chapterKey: 'optional',
          chapterTitle: '選修主題',
          chapterSummary: '特定進階議題（選修實戰）',
          chapterIndex: 99,
          displayNum: `選修-${optIdx + 1}`,
          slug: opt.slug,
          difficulty: opt.difficulty || raw.difficulty,
          defaultTab: opt.defaultTab || 'files',
          isOptional: true,
          cliOnly: Boolean(opt.cliOnly || raw.cliOnly)
        });
      } else {
        console.error(`Curriculum optional level id "${opt.id}" not found in SCENARIOS!`);
      }
    });

    // Consistency check
    (typeof SCENARIOS !== 'undefined' ? SCENARIOS : []).forEach(s => {
      if (!manifestIds.has(s.id)) {
        console.error(`Scenario id "${s.id}" in SCENARIOS is missing from CURRICULUM manifest!`);
      }
    });

    ORDERED_SCENARIOS = ordered;
  }

  initCurriculumOrder();

  const scenarioNavigation = window.CURRICULUM_NAVIGATION || {
    isWebPlayable: (scenario) => Boolean(scenario) && scenario.cliOnly !== true,
    countWebPlayable: (scenarios) => scenarios.filter(scenario => scenario.cliOnly !== true).length,
    nextWebPlayableIndex: (scenarios, afterIndex, predicate = () => true) => {
      const startIndex = Number.isInteger(afterIndex) ? afterIndex + 1 : 0;
      for (let index = startIndex; index < scenarios.length; index++) {
        if (scenarios[index].cliOnly !== true && predicate(scenarios[index], index)) return index;
      }
      return -1;
    },
    nextWebProgressionIndex: (scenarios, afterIndex, completedIds) => {
      const startIndex = Number.isInteger(afterIndex) ? afterIndex + 1 : 0;
      for (let index = startIndex; index < scenarios.length; index++) {
        if (scenarios[index].cliOnly !== true) return index;
      }
      if (!completedIds.has(scenarios[afterIndex]?.id)) return -1;
      return scenarios.findIndex((scenario, index) =>
        index !== afterIndex && scenario.cliOnly !== true && !completedIds.has(scenario.id)
      );
    }
  };
  const webPlayableScenarioCount = scenarioNavigation.countWebPlayable(ORDERED_SCENARIOS);

  let currentScenarioIndex = 0;
  let pendingInitialIntro = false;
  const completedScenarios = new Set(
    JSON.parse(localStorage.getItem('git_lab_completed_scenarios') || '[]')
  );
  let commandHistory = [];
  let historyIndex = -1;
  let currentDraft = '';

  const countCompletedWebScenarios = () => ORDERED_SCENARIOS.filter(scenario =>
    scenarioNavigation.isWebPlayable(scenario) && completedScenarios.has(scenario.id)
  ).length;
  const getNextScenarioIndex = (afterIndex) => scenarioNavigation.nextWebProgressionIndex(
    ORDERED_SCENARIOS,
    afterIndex,
    completedScenarios
  );

  // Easter egg: Player name from Level 00 git config or localStorage
  function getUserName() {
    try {
      const fromStorage = localStorage.getItem('git_lab_user_name');
      if (fromStorage && fromStorage.trim() && fromStorage.trim() !== 'User') {
        return fromStorage.trim();
      }
    } catch (e) {}
    if (window.git && git.config && git.config['user.name'] && git.config['user.name'].trim() && git.config['user.name'] !== 'User') {
      return git.config['user.name'].trim();
    }
    return '';
  }

  function personalizeStory(storyText, userName) {
    if (!userName || !storyText) return storyText;
    return storyText
      .replace(/「菜鳥，/g, `「${userName}，`)
      .replace(/「菜鳥……/g, `「${userName}……`)
      .replace(/「欸菜鳥，/g, `「欸 ${userName}，`)
      .replace(/「菜鳥！/g, `「${userName}！`)
      .replace(/從小菜鳥的角度/g, `從新人 ${userName} 的角度`)
      .replace(/身為剛入職的新人/g, `身為剛入職的新人 ${userName}`)
      .replace(/身為最沒包袱的新人/g, `身為最沒包袱的新人 ${userName}`)
      .replace(/身為新人/g, `身為新人 ${userName}`)
      .replace(/身為菜鳥/g, `身為新人 ${userName}`)
      .replace(/強哥交給你第一份/g, `強哥交給 ${userName} 第一份`)
      .replace(/展開職場生存記！/g, `${userName} 的職場生存記正式開演！`);
  }

  // DOM Elements
  const terminalOutput = document.getElementById('terminal-output');
  const terminalInput = document.getElementById('terminal-input');
  const promptBranchSpan = document.getElementById('prompt-branch');
  const levelSelectBtn = document.getElementById('level-select-btn');
  const levelDropdown = document.getElementById('level-dropdown');
  const missionModal = document.getElementById('mission-modal');
  const victoryModal = document.getElementById('victory-modal');
  const filesList = document.getElementById('files-list');
  const fileViewerContent = document.getElementById('file-viewer-content');
  const fileViewerName = document.getElementById('file-viewer-name');
  const terminalNextBar = document.getElementById('terminal-next-bar');
  const nextBarMsg = document.getElementById('next-bar-msg');
  const nextScenarioButton = document.getElementById('btn-next-scenario');
  const guideContainer = document.getElementById('guide-container');
  const missionContainer = document.getElementById('mission-container');
  let isCurrentScenarioPassed = false;
  let completedTasks = new Set();
  let selectedFilename = null;
  let editingFilename = null;
  let pendingPatch = null;

  function finishCommand(command, code = 0) {
    updatePrompt();
    refreshGraph();
    renderFileList();
    if (code === 0) checkTaskProgress(command);
    checkScenarioSuccess(false);
    scrollToBottom();
    return code;
  }

  function setFileEditing(active) {
    const editor = document.getElementById('file-editor');
    if (!editor) return;
    editor.hidden = !active;
    fileViewerContent.hidden = active;
    document.getElementById('btn-edit-file').hidden = active;
    document.getElementById('btn-save-file').hidden = !active;
    document.getElementById('btn-cancel-edit').hidden = !active;
    if (!active) editingFilename = null;
  }

  function beginFileEdit() {
    if (!selectedFilename) return;
    if (pendingPatch) {
      printOutput('請先完成 patch 選擇或輸入 q，再編輯檔案。');
      return;
    }
    editingFilename = selectedFilename;
    const editor = document.getElementById('file-editor');
    editor.value = git.workingTree.get(selectedFilename) ?? '';
    setFileEditing(true);
    editor.focus();
  }

  document.getElementById('btn-edit-file')?.addEventListener('click', beginFileEdit);
  document.getElementById('btn-cancel-edit')?.addEventListener('click', () => setFileEditing(false));
  document.getElementById('btn-save-file')?.addEventListener('click', () => {
    if (!editingFilename) return;
    if (pendingPatch) return;
    const file = editingFilename;
    git.workingTree.set(file, document.getElementById('file-editor').value);
    setFileEditing(false);
    document.getElementById('file-editor-status').textContent = '已儲存至工作區；請自行檢視、暫存與提交。';
    finishCommand('edit ' + file);
    selectFile(file);
  });

  function getRequiredSteps(scenario) {
    const guide = (typeof COMMAND_GUIDES !== 'undefined' && COMMAND_GUIDES[scenario.id]) ? COMMAND_GUIDES[scenario.id] : null;
    if (guide && guide.guidedSteps) {
      return guide.guidedSteps.filter(s => s.category !== 'optional');
    }
    return scenario.goals.map((g, i) => ({ step: i + 1, cmd: g, why: g }));
  }

  // Render required tasks with live progress; command notes live in the guide.
  function renderMissionPanel(scenario) {
    if (!missionContainer) return;
    const requiredSteps = getRequiredSteps(scenario);
    const completedCount = requiredSteps.filter((_, idx) => completedTasks.has(idx)).length;
    const totalRequired = requiredSteps.length;
    const tabTitleEl = document.getElementById('tab-title-mission');
    if (tabTitleEl) tabTitleEl.textContent = `${completedCount}/${totalRequired}`;
    document.getElementById('tab-btn-mission').setAttribute('aria-label', `任務，已完成 ${completedCount} / ${totalRequired} 項`);

    missionContainer.innerHTML = `
      <div class="mission-panel-header">
        <div class="mission-title-row">
          <span class="bracket-tag">[${scenario.displayNum || scenario.id}]</span>
          <h3 class="mission-heading">${escapeHtml(scenario.title)}</h3>
        </div>
        <div class="mission-progress-bar-container">
          <div class="mission-progress-status">
            <span>任務進度</span>
            <span class="progress-count">${completedCount} / ${totalRequired}</span>
          </div>
          <div class="progress-track" role="progressbar" aria-label="任務進度" aria-valuemin="0" aria-valuemax="${totalRequired}" aria-valuenow="${completedCount}">
            <div class="progress-fill" style="transform: scaleX(${totalRequired > 0 ? completedCount / totalRequired : 0});"></div>
          </div>
        </div>
      </div>
      <p class="mission-section-desc">自行輸入指令，完成後自動勾選。</p>
      <ol class="mission-tasks-list">
        ${requiredSteps.map((step, idx) => {
          const isDone = completedTasks.has(idx);
          return `
            <li class="mission-task-card ${isDone ? 'completed' : 'pending'}">
              <div class="task-checkbox-col">
                <span class="task-checkbox ${isDone ? 'checked' : 'unchecked'}" role="img" aria-label="${isDone ? '已完成' : '待完成'}">${isDone ? '✔' : ''}</span>
              </div>
              <div class="task-content-col">
                <div class="task-why-text ${isDone ? 'completed-text' : ''}">${escapeHtml(cleanGuideText(step.why))}</div>
                <code class="task-cmd-chip">${escapeHtml(step.cmd)}</code>
              </div>
            </li>
          `;
        }).join('')}
      </ol>
    `;
  }

  // Load Scenario by Index
  function loadScenario(index, showIntro = true) {
    if (index < 0 || index >= ORDERED_SCENARIOS.length) index = 0;
    const scenario = ORDERED_SCENARIOS[index];
    if (!scenarioNavigation.isWebPlayable(scenario)) {
      printOutput(`（關卡 ${scenario.id} 為 CLI 專屬選修實戰，請使用 ./git-lab start ${scenario.id} 在本機真實環境練習）`);
      return;
    }
    currentScenarioIndex = index;
    isCurrentScenarioPassed = false;
    completedTasks.clear();
    pendingPatch = null;
    selectedFilename = null;
    setFileEditing(false);
    const editorStatus = document.getElementById('file-editor-status');
    if (editorStatus) editorStatus.textContent = '';

    if (terminalNextBar) terminalNextBar.style.display = 'none';

    // Reset git and execute scenario setup
    git.resetAll();
    scenario.setup(git);

    // Update UI elements
    levelSelectBtn.innerHTML = `
      <span class="level-badge">${scenario.displayNum || scenario.id}</span>
      <span class="level-name">${scenario.title}</span>
      <span class="arrow-down">▼</span>
    `;

    updatePrompt();
    refreshGraph();
    renderFileList();
    renderCommandGuide(scenario);
    renderMissionPanel(scenario);

    // Default right panel to scenario's defaultTab
    window.switchTab(scenario.defaultTab || 'mission');

    // Open Scenario Intro Modal Alert if not disabled
    if (showIntro && localStorage.getItem('git_lab_hide_intro_modal') !== 'true') {
      window.openMissionModal();
    }
  }

  function normalizeGitCmd(cmdStr) {
    if (!cmdStr) return '';
    return cmdStr
      .trim()
      .replace(/^[\$#>]\s+/, '')
      .replace(/[\u3000\t]+/g, ' ')
      .replace(/[“”]/g, '"')
      .replace(/[‘’]/g, "'")
      .replace(/;+$/, '')
      .replace(/\s+/g, ' ')
      .toLowerCase()
      .replace(/^git checkout -b\s+/, 'git switch -c ')
      .replace(/^git checkout\s+/, 'git switch ')
      .replace(/^git add -a\b|^git add --all\b/, 'git add .')
      .replace(/["']/g, ''); // ignore quote difference
  }

  // Check Task Progress on Every Command Execution
  function checkTaskProgress(rawCmd) {
    const sc = ORDERED_SCENARIOS[currentScenarioIndex];
    const requiredSteps = getRequiredSteps(sc);
    const normalizedInput = normalizeGitCmd(rawCmd);

    // Check each required step
    requiredSteps.forEach((s, idx) => {
      if (completedTasks.has(idx)) return;

      // Special check for Level 00
      if (sc.id === '00') {
        if (idx === 0) {
          const name = git.config['user.name'];
          if (name && name.trim() && name !== 'User') {
            completedTasks.add(idx);
            try {
              localStorage.setItem('git_lab_user_name', name.trim());
            } catch (e) {}
          }
        } else if (idx === 1) {
          const email = git.config['user.email'];
          if (email && email.includes('@')) completedTasks.add(idx);
        }
        return;
      }

      const targetBase = s.cmd.split(' (')[0].trim();
      const normalizedTarget = normalizeGitCmd(targetBase);

      if (normalizedInput === normalizedTarget) {
        completedTasks.add(idx);
      } else if (targetBase.includes('<') && targetBase.includes('>')) {
        // e.g. git cherry-pick <commitHash> or git reflog show <branch>
        const targetPrefix = normalizeGitCmd(targetBase.split('<')[0]);
        if (normalizedInput.startsWith(targetPrefix) && normalizedInput.length > targetPrefix.length) {
          completedTasks.add(idx);
        }
      }
    });

    // If scenario goal check passes, all required tasks are satisfied
    const goalRes = sc.checkGoal(git);
    if (goalRes.passed) {
      requiredSteps.forEach((_, idx) => completedTasks.add(idx));
    }

    renderMissionPanel(sc);
  }

  // Keep prose free of decorative badges while preserving command examples.
  function cleanGuideText(value = '') {
    return value
      .replace(/【★[^】]*】\s*/g, '')
      .replace(/[\p{Extended_Pictographic}\uFE0F\u200D]/gu, '')
      .trim();
  }

  // Group examples and explanations by Git command, merging repeated syntax.
  function renderCommandGuide(scenario) {
    if (!guideContainer) return;
    const guide = typeof COMMAND_GUIDES !== 'undefined' ? COMMAND_GUIDES[scenario.id] : null;
    const groups = new Map();

    function addCommand(item) {
      const commandName = item.cmd.match(/\bgit\s+([a-z][\w-]*)\b/);
      const groupName = commandName ? `git ${commandName[1]}` : '檔案操作';
      if (!groups.has(groupName)) groups.set(groupName, new Map());
      const entries = groups.get(groupName);
      if (!entries.has(item.cmd)) entries.set(item.cmd, { cmd: item.cmd, notes: new Set() });
      const entry = entries.get(item.cmd);
      if (item.name) entry.name = cleanGuideText(item.name);
      if (item.category) entry.category = item.category;
      if (item.isPopular) entry.isPopular = true;
      [item.why, item.desc, item.popularReason].filter(Boolean).forEach(note => entry.notes.add(cleanGuideText(note)));
    }

    (guide?.guidedSteps || getRequiredSteps(scenario)).forEach(addCommand);
    (guide?.variations || []).forEach(addCommand);
    if (guide?.configCategories) {
      Object.entries(guide.configCategories).forEach(([category, items]) => items.forEach(item => {
        const value = item.key === 'user.name' ? ' "你的名字"' : item.key === 'user.email' ? ' "you@example.com"' : '';
        const cmd = `git config ${item.key}${value}`;
        const existing = groups.get('git config')?.has(cmd);
        addCommand({ cmd, name: item.label, category, desc: existing ? '' : item.desc });
      }));
    }

    const resetMatrixHtml = guide?.resetModeRows ? `
      <div class="reset-matrix-table-wrap">
        <table class="cheat-table reset-matrix-table">
          <caption>git reset 模式比較</caption>
          <thead><tr>
            <th scope="col">模式</th><th scope="col">HEAD</th><th scope="col">暫存區</th><th scope="col">工作區</th>
          </tr></thead>
          <tbody>${guide.resetModeRows.map(row => `
            <tr><td><code>${escapeHtml(row.mode)}</code></td><td>${escapeHtml(row.head)}</td><td>${escapeHtml(row.index)}</td><td>${escapeHtml(row.workingTree)}</td></tr>
          `).join('')}</tbody>
        </table>
      </div>
      <p class="guide-section-desc reset-matrix-warning">${escapeHtml(cleanGuideText(guide.resetModeWarning))}</p>
    ` : '';

    guideContainer.innerHTML = `
      ${guide?.summary ? `<p class="guide-summary">${escapeHtml(cleanGuideText(guide.summary))}</p>` : ''}
      <nav class="guide-command-index" aria-label="本關指令">
        ${[...groups.keys()].map((name, index) => `<a href="#guide-command-${index}">${escapeHtml(name)}</a>`).join('')}
      </nav>
      ${[...groups].map(([name, entries], index) => `
        <section id="guide-command-${index}" class="command-guide-section" aria-labelledby="guide-command-title-${index}">
          <h3 id="guide-command-title-${index}" class="command-guide-title">${escapeHtml(name)}</h3>
          <ul class="command-examples">
            ${[...entries.values()].map(entry => `
              <li class="command-example">
                <div class="command-example-header">
                  <code>${escapeHtml(entry.cmd)}</code>
                  ${entry.isPopular ? '<span class="command-star" role="img" aria-label="常用指令" title="常用指令">★</span>' : ''}
                  ${entry.category ? `<span class="command-category">${entry.category === 'optional' ? '延伸' : '必要'}</span>` : ''}
                </div>
                ${entry.name ? `<p class="command-example-name">${escapeHtml(entry.name)}</p>` : ''}
                <ul class="command-notes">${[...entry.notes].map(note => `<li>${escapeHtml(note)}</li>`).join('')}</ul>
              </li>
            `).join('')}
          </ul>
          ${name === 'git reset' ? resetMatrixHtml : ''}
        </section>
      `).join('')}
      ${guide?.whyPopularContent ? `
        <section class="guide-section guide-rationale" aria-labelledby="guide-rationale-title">
          <h3 id="guide-rationale-title" class="guide-section-title"><span role="img" aria-label="補充觀念">💡</span> ${escapeHtml(cleanGuideText(guide.whyPopularTitle || '補充觀念'))}</h3>
          <p class="guide-summary">${escapeHtml(cleanGuideText(guide.whyPopularContent))}</p>
        </section>
      ` : ''}
      ${guide?.pitfalls?.length ? `
        <section class="guide-section" aria-labelledby="guide-pitfalls-title">
          <h3 id="guide-pitfalls-title" class="guide-section-title">注意事項</h3>
          <ul class="command-notes guide-pitfalls">${guide.pitfalls.map(note => `<li>${escapeHtml(cleanGuideText(note))}</li>`).join('')}</ul>
        </section>
      ` : ''}
    `;
    guideContainer.scrollTop = 0;
  }

  function escapeHtml(str) {
    if (!str) return '';
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  // Update prompt with active branch
  function updatePrompt() {
    if (git.HEAD.type === 'detached') {
      const targetId = git.HEAD.target;
      const matchingTag = [...git.tags.entries()].find(([_, t]) => t.commitId === targetId);
      if (matchingTag) {
        promptBranchSpan.textContent = `(HEAD detached at ${matchingTag[0]})`;
      } else {
        const shortHash = targetId ? targetId.substring(0, 7) : 'HEAD';
        promptBranchSpan.textContent = `(HEAD detached at ${shortHash})`;
      }
    } else {
      const branch = git.getCurrentBranch() || 'main';
      promptBranchSpan.textContent = `(${branch})`;
    }
  }

  // Re-render SVG Graph
  function refreshGraph() {
    graphRenderer.render(git, (commit) => {
      // Node clicked - show commit details in terminal
      printOutput(`\n\x1b[38;2;188;140;255m[Commit 詳情]\x1b[0m ${commit.id}`);
      printOutput(`訊息: ${commit.message}`);
      printOutput(`作者: ${commit.author}`);
      printOutput(`時間: ${new Date(commit.timestamp).toLocaleTimeString()}`);
      if (commit.tree && commit.tree.size > 0) {
        printOutput(`檔案清單:`);
        for (const [f] of commit.tree.entries()) {
          printOutput(`  - ${f}`);
        }
      }
      scrollToBottom();
    });
  }

  // Update File Tree Tab
  function renderFileList() {
    if (!filesList) return;
    filesList.innerHTML = '';

    const allFiles = new Set([
      ...git.workingTree.keys(),
      ...git.index.keys()
    ]);

    if (allFiles.size === 0) {
      filesList.innerHTML = '<div class="empty-state">工作目錄目前沒有檔案</div>';
      if (fileViewerContent) fileViewerContent.textContent = '// 尚無選取檔案';
      if (fileViewerName) fileViewerName.textContent = '無檔案';
      return;
    }

    for (const file of allFiles) {
      const item = document.createElement('button');
      item.type = 'button';
      item.className = 'file-tree-item';
      const conflictFiles = git.conflictState?.files || (git.conflictState?.file ? [git.conflictState.file] : []);
      const isConflict = conflictFiles.includes(file) &&
        (!git.rebaseState?.conflictFiles?.has(file) || git.rebaseState.unresolvedFiles.has(file));
      item.innerHTML = `
        <svg class="ui-icon" aria-hidden="true" viewBox="0 0 24 24"><path d="M14 2H5v20h14V7ZM14 2v5h5M8 12h8m-8 4h8"/></svg>
        <span class="file-name">${escapeHtml(file)}</span>
        ${isConflict ? '<span class="tag-conflict">衝突中</span>' : ''}
      `;
      item.onclick = () => selectFile(file);
      filesList.appendChild(item);

    }
    selectFile(allFiles.has(selectedFilename) ? selectedFilename : allFiles.values().next().value);
  }

  function selectFile(filename) {
    if (!fileViewerName || !fileViewerContent) return;
    if (editingFilename && filename !== editingFilename) return;
    selectedFilename = filename;
    fileViewerName.textContent = filename;
    const content = git.workingTree.get(filename) || git.index.get(filename) || '';
    fileViewerContent.textContent = content;

    const conflictActions = document.getElementById('conflict-actions');
    if (conflictActions) {
      const conflictFiles = git.conflictState?.files || (git.conflictState?.file ? [git.conflictState.file] : []);
      const isConflict = conflictFiles.includes(filename) &&
        (!git.rebaseState?.conflictFiles?.has(filename) || git.rebaseState.unresolvedFiles.has(filename));
      conflictActions.style.display = isConflict ? 'flex' : 'none';
    }
  }

  function preprocessInput(raw) {
    let cmd = (raw || '').trim();
    cmd = cmd.replace(/^[\$#>]\s+/, '');
    cmd = cmd.replace(/[\u3000\t]+/g, ' ');
    cmd = cmd.replace(/[“”]/g, '"').replace(/[‘’]/g, "'");
    cmd = cmd.replace(/;+$/, '');
    return cmd.trim();
  }

  // Command Execution Dispatcher
  function executeCommand(rawCmd) {
    const cmd = preprocessInput(rawCmd);
    if (!cmd) return 0;

    if (pendingPatch) return answerPatch(cmd);
    const chain = splitCommandChain(cmd);
    if (chain.length > 1) {
      for (const part of chain) {
        const code = executeCommand(part);
        if (code !== 0 || pendingPatch) return code;
      }
      return 0;
    }

    // Record history with deduplication
    if (commandHistory.length === 0 || commandHistory[commandHistory.length - 1] !== cmd) {
      commandHistory.push(cmd);
    }
    historyIndex = commandHistory.length;
    currentDraft = '';

    // Echo input command with prompt
    const promptText = `user@git-lab:~/workspace${git.currentDirectory ? '/' + git.currentDirectory : ''} ${promptBranchSpan.textContent} $ ${cmd}`;
    printOutput(`\x1b[38;2;139;148;158m${promptText}\x1b[0m`);

    // Parse tokens respecting quotes
    const tokens = parseCommandTokens(cmd);
    const mainCmd = tokens[0];
    const args = tokens.slice(1);

    if (mainCmd === 'next' || mainCmd === 'n') {
      window.nextScenario();
      return 0;
    }

    if (mainCmd === 'guide') {
      window.switchTab('guide');
      printOutput(`\x1b[38;2;88;166;255m[已切換至補充說明]\x1b[0m`);
      return 0;
    }

    if (mainCmd === 'clear') {
      terminalOutput.innerHTML = '';
      return 0;
    }

    if (mainCmd === 'help') {
      printHelp();
      return 0;
    }

    if (mainCmd === 'hint') {
      const sc = ORDERED_SCENARIOS[currentScenarioIndex];
      printOutput(`\x1b[38;2;210;153;34m💡 [通關提示]：\x1b[0m\n${sc.hints.join('\n')}\n`);
      return 0;
    }

    if (mainCmd === 'goal' || mainCmd === 'mission') {
      window.openMissionModal();
      return 0;
    }

    if (mainCmd === 'levels' || mainCmd === 'list') {
      toggleLevelDropdown();
      return 0;
    }

    if (mainCmd === 'reset') {
      loadScenario(currentScenarioIndex);
      printOutput(`\x1b[38;2;248;81;73m✔ 當前關卡已重設至初始狀態。\x1b[0m`);
      return 0;
    }

    if (mainCmd === 'verify') {
      checkScenarioSuccess(true);
      return ORDERED_SCENARIOS[currentScenarioIndex].checkGoal(git).passed ? 0 : 1;
    }

    if (mainCmd === 'tree') {
      printOutput(git.logCmd(['--oneline', '--graph']).output);
      return 0;
    }

    if (mainCmd === 'echo') {
      const raw = cmd.replace(/^echo\s+/, '');
      const match = raw.match(/^(.*?)\s*(>{1,2})\s*([^\s]+)$/s);
      if (match) {
        const echoText = match[1].trim();
        const interpretEscapes = echoText.startsWith('-e ');
        let content = echoText.replace(/^-e\s+/, '').replace(/^['"]|['"]$/g, '');
        if (interpretEscapes) content = content.replace(/\\n/g, '\n').replace(/\\t/g, '\t');
        const append = match[2] === '>>';
        const filename = match[3].trim();
        const existing = git.workingTree.get(filename) || '';
        git.workingTree.set(filename, append ? existing + content + '\n' : content + '\n');
      } else {
        printOutput(raw.replace(/^['"]|['"]$/g, ''));
      }
      return finishCommand(cmd);
    }

    if (mainCmd === 'touch') {
      const file = args[0] || '.gitignore';
      if (!git.workingTree.has(file)) {
        git.workingTree.set(file, '');
      }
      return finishCommand(cmd);
    }

    if (mainCmd === 'cd') {
      const result = git.changeDirectory(args[0] || '.');
      if (result.output) printOutput(result.output);
      setFileEditing(false);
      selectedFilename = null;
      return finishCommand(cmd, result.code);
    }
    if (mainCmd === 'pwd') {
      printOutput(`/workspace${git.currentDirectory ? '/' + git.currentDirectory : ''}`);
      return 0;
    }
    if (mainCmd === 'cat') {
      const file = args[0];
      if (!git.workingTree.has(file)) {
        printOutput(`cat: ${file}: No such file`);
        return 1;
      }
      printOutput(git.workingTree.get(file));
      return 0;
    }
    if (mainCmd === 'rm') {
      for (const file of args.filter(arg => !arg.startsWith('-'))) git.workingTree.delete(file);
      return finishCommand(cmd);
    }
    if (mainCmd === 'chmod') {
      const file = args[args.length - 1];
      if (!git.workingTree.has(file) || !args.includes('+x')) {
        printOutput('usage: chmod +x <existing-file>');
        return 1;
      }
      git.executableFiles ||= new Set();
      git.executableFiles.add(file);
      return finishCommand(cmd);
    }

    let code = 0;
    if (mainCmd === 'git') {
      code = handleGitCommand(args) ?? 0;
    } else {
      printOutput(`command not found: ${mainCmd}. 輸入 \x1b[38;2;88;166;255mhelp\x1b[0m 查看支援的 Git 指令。`);
      code = 127;
    }

    return finishCommand(cmd, code);
  }

  function splitCommandChain(command) {
    const parts = [];
    let quote = null;
    let start = 0;
    for (let i = 0; i < command.length; i++) {
      if (command[i] === '\\') { i++; continue; }
      if (quote) { if (command[i] === quote) quote = null; }
      else if (command[i] === '"' || command[i] === "'") quote = command[i];
      else if (command.slice(i, i + 2) === '&&') {
        parts.push(command.slice(start, i).trim());
        start = i + 2;
        i++;
      }
    }
    parts.push(command.slice(start).trim());
    return parts;
  }

  function showPatchHunk() {
    const hunk = pendingPatch.hunks[pendingPatch.position];
    printOutput(hunk.diff);
    printOutput(`(${pendingPatch.position + 1}/${pendingPatch.hunks.length}) Stage this hunk [y,n,q]?`);
  }

  function answerPatch(answer) {
    if (!['y', 'n', 'q'].includes(answer)) {
      printOutput('請輸入 y 暫存、n 略過或 q 結束；此模擬器按目前顯示的區塊選擇。');
      return 1;
    }
    if (answer === 'y') pendingPatch.selected.push(pendingPatch.position);
    pendingPatch.position++;
    if (answer !== 'q' && pendingPatch.position < pendingPatch.hunks.length) {
      showPatchHunk();
      return 0;
    }
    const { file, selected, hunks } = pendingPatch;
    pendingPatch = null;
    const result = git.addPatch(file, selected, hunks);
    if (result.output) printOutput(result.output);
    return finishCommand(`git add -p ${file}`, result.code);
  }

  function handleGitCommand(args) {
    if (args.length === 0) {
      printOutput('usage: git [--version] [--help] <command> [<args>]');
      return 1;
    }

    const sub = args[0];
    const subArgs = args.slice(1);
    if (git.initialized === false && !['init', 'config'].includes(sub)) {
      printOutput('fatal: not a git repository；請先執行 git init。');
      return 128;
    }
    function emit(result) {
      if (result.output) printOutput(result.output);
      return result.code;
    }

    switch (sub) {
      case 'init':
        return emit(git.init(subArgs));
      case 'status':
        const isShort = subArgs.includes('-s') || subArgs.includes('--short') || subArgs.includes('--porcelain');
        const st = git.status(subArgs);
        if (isShort) {
          let sOut = '';
          if (subArgs.includes('-b') || subArgs.includes('--branch')) {
            sOut += `## ${st.branch || 'HEAD (no branch)'}\n`;
          }
          const rows = new Map();
          if (st.conflict) (st.conflict.files || [st.conflict.file]).forEach(file => rows.set(file, ['U', 'U']));
          st.staged.forEach(s => {
            const code = s.status === 'new file' ? 'A' : (s.status === 'deleted' ? 'D' : 'M');
            if (!rows.has(s.file)) rows.set(s.file, [' ', ' ']);
            if (rows.get(s.file)[0] !== 'U') rows.get(s.file)[0] = code;
          });
          st.unstaged.forEach(s => {
            const code = s.status === 'deleted' ? 'D' : 'M';
            if (!rows.has(s.file)) rows.set(s.file, [' ', ' ']);
            if (rows.get(s.file)[1] !== 'U') rows.get(s.file)[1] = code;
          });
          for (const [file, columns] of rows) sOut += `${columns.join('')} ${file}\n`;
          st.untracked.forEach(f => {
            sOut += `\x1b[38;2;248;81;73m?? ${f}\x1b[0m\n`;
          });
          printOutput(sOut || '');
          break;
        }
        let out = `位於分支 ${st.branch || 'detached HEAD'}\n`;
        if (st.conflict) {
          out += `\x1b[38;2;248;81;73m您有尚未合併的衝突路徑！\n  （修復衝突並執行 "git commit"）\n未合併的路徑：\n  雙方修改：   ${st.conflict.file}\x1b[0m\n`;
        }
        if (st.staged.length > 0) {
          out += `\x1b[38;2;46;160;67m要提交的變更：\n${st.staged.map(s => `  ${s.status}:   ${s.file}`).join('\n')}\x1b[0m\n`;
        }
        if (st.unstaged.length > 0) {
          out += `\x1b[38;2;210;153;34m尚未暫存以備提交的變更：\n${st.unstaged.map(s => `  ${s.status}:   ${s.file}`).join('\n')}\x1b[0m\n`;
        }
        if (st.untracked.length > 0) {
          out += `\x1b[38;2;248;81;73m未追蹤的檔案：\n${st.untracked.map(f => `  ${f}`).join('\n')}\x1b[0m\n`;
        }
        if (st.staged.length === 0 && st.unstaged.length === 0 && st.untracked.length === 0 && !st.conflict) {
          out += `無檔案要提交，乾淨的工作區\n`;
        }
        printOutput(out);
        break;

      case 'add':
        if ((subArgs.includes('-p') || subArgs.includes('--patch')) && editingFilename) {
          printOutput('請先儲存或取消檔案編輯，再選擇 patch；顯示的區塊會以已儲存內容為準。');
          return 1;
        }
        const resAdd = git.add(subArgs);
        if (resAdd.output) printOutput(resAdd.output);
        if (resAdd.patch?.hunks?.length) {
          pendingPatch = { ...resAdd.patch, selected: [], position: 0 };
          showPatchHunk();
        }
        return resAdd.code;

      case 'commit':
        const resCommit = git.commit(subArgs);
        printOutput(resCommit.output);
        return resCommit.code;

      case 'branch':
        const resBranch = git.branch(subArgs);
        if (resBranch.output) printOutput(resBranch.output);
        return resBranch.code;

      case 'checkout':
      case 'switch':
        let isCreate = subArgs.includes('-c') || subArgs.includes('-b');
        let isDetach = subArgs.includes('--detach');
        let target = subArgs.find(a => a === '-' || !a.startsWith('-'));
        if (isCreate) {
          const idx = subArgs.findIndex(a => a === '-c' || a === '-b');
          target = subArgs[idx + 1];
        } else if (isDetach) {
          target = subArgs.find(a => !a.startsWith('-'));
        }
        if (!target) {
          printOutput(`fatal: missing branch name or reference`);
          return 1;
        }
        const resSwitch = git.checkoutOrSwitch(target, isCreate, isDetach);
        if (resSwitch.output) printOutput(resSwitch.output);
        return resSwitch.code;

      case 'restore':
        const resRestore = git.restore(subArgs);
        if (resRestore.output) printOutput(resRestore.output);
        return resRestore.code;

      case 'merge':
        const isAbort = subArgs.includes('--abort');
        const isSquash = subArgs.includes('--squash');
        const noFf = subArgs.includes('--no-ff');
        const targetMerge = subArgs.find(a => !a.startsWith('-'));
        if (isAbort) {
          const resMerge = git.merge('--abort', { abort: true });
          if (resMerge.output) printOutput(resMerge.output);
          return resMerge.code;
        }
        if (!targetMerge && !isSquash) {
          printOutput('fatal: No branch specified to merge.');
          return 1;
        }
        const resMerge = git.merge(targetMerge, { noFf, squash: isSquash, ffOnly: subArgs.includes('--ff-only') });
        if (resMerge.output) printOutput(resMerge.output);
        return resMerge.code;

      case 'rebase':
        const isInteractiveRebase = subArgs.includes('-i') || subArgs.includes('--interactive');
        const hasAutosquash = subArgs.includes('--autosquash');
        const isContinue = subArgs.includes('--continue');
        const isAbortRebase = subArgs.includes('--abort');
        const isSkip = subArgs.includes('--skip');
        const ontoIdx = subArgs.indexOf('--onto');

        if (isContinue) {
          const resCont = git.rebase('--continue');
          if (resCont.output) printOutput(resCont.output);
          return resCont.code;
        }
        if (isAbortRebase) {
          const resAb = git.rebase('--abort');
          if (resAb.output) printOutput(resAb.output);
          return resAb.code;
        }
        if (isSkip) {
          const resSk = git.rebase('--skip');
          if (resSk.output) printOutput(resSk.output);
          return resSk.code;
        }

        if (ontoIdx !== -1) {
          const ontoArgs = subArgs.slice(ontoIdx + 1).filter(a => !a.startsWith('-'));
          const newbase = ontoArgs[0];
          const upstream = ontoArgs[1];
          const targetBranch = ontoArgs[2] || null;
          if (!newbase || !upstream) {
            printOutput('fatal: Needed --onto <newbase> <upstream> [<branch>]');
            return 1;
          }
          const resOnto = git.rebaseOnto(newbase, upstream, targetBranch);
          if (resOnto.output) printOutput(resOnto.output);
          return resOnto.code;
        }

        const targetRebase = subArgs.find(a => !a.startsWith('-')) || 'main';
        if (isInteractiveRebase) {
          const plan = git.rebaseInteractivePlan(targetRebase, { autosquash: hasAutosquash });
          if (plan.code !== 0) {
            printOutput(plan.output);
            return plan.code;
          }
          if (plan.commits.length === 0) {
            printOutput(plan.output || `Current branch ${git.getCurrentBranch()} is up to date.`);
            return 0;
          }
          let todoOut = '';
          plan.commits.forEach(c => {
            const action = c.action || 'pick';
            todoOut += `${action} ${c.shortHash} ${c.message}\n`;
          });
          todoOut += `\n# Rebase onto ${targetRebase} (${plan.commits.length} commands)\n[開啟 Interactive Rebase Todo 視窗中...]`;
          printOutput(todoOut);
          openRebaseModal(plan);
          return 0;
        }
        const resRebase = git.rebase(targetRebase);
        if (resRebase.output) printOutput(resRebase.output);
        return resRebase.code;

      case 'cherry-pick':
        const hash = subArgs[0];
        if (!hash) {
          printOutput('fatal: Commit hash required for cherry-pick.');
          return 1;
        }
        const resCherry = git.cherryPick(hash);
        if (resCherry.output) printOutput(resCherry.output);
        return resCherry.code;

      case 'reset':
        let mode = '--mixed';
        if (subArgs.includes('--hard')) mode = '--hard';
        if (subArgs.includes('--soft')) mode = '--soft';
        const targetReset = subArgs.find(a => !a.startsWith('-')) || 'HEAD';
        const resReset = git.reset(targetReset, mode);
        if (resReset.output) printOutput(resReset.output);
        return resReset.code;

      case 'revert':
        let mainline = null;
        const mIdx = subArgs.indexOf('-m');
        if (mIdx !== -1 && subArgs[mIdx + 1]) {
          mainline = parseInt(subArgs[mIdx + 1], 10);
        }
        const targetRevert = subArgs.find((a, idx) => !a.startsWith('-') && (mIdx === -1 || idx !== mIdx + 1)) || 'HEAD';
        const resRevert = git.revert(targetRevert, { mainline });
        if (resRevert.output) printOutput(resRevert.output);
        return resRevert.code;

      case 'tag':
        const resTag = git.tag(subArgs);
        if (resTag.output) printOutput(resTag.output);
        return resTag.code;

      case 'reflog':
        return emit(git.reflogCmd());

      case 'log':
        return emit(git.logCmd(subArgs));

      case 'blame':
        return emit(git.blameCmd(subArgs));

      case 'worktree':
        return emit(git.worktree(subArgs));

      case 'bisect':
        return emit(git.bisect(subArgs));

      case 'rm':
        return emit(git.rm(subArgs));

      case 'stash':
        return emit(git.stashCmd(subArgs));

      case 'clean':
        return emit(git.cleanCmd(subArgs));

      case 'mv':
        return emit(git.mvCmd(subArgs));

      case 'remote':
        return emit(git.remoteCmd(subArgs));

      case 'fetch':
        return emit(git.fetchCmd(subArgs));

      case 'cat-file':
        return emit(git.catFileCmd(subArgs));

      case 'config':
        return emit(git.configCmd(subArgs));

      case 'diff':
        const resDiff = git.diffCmd(subArgs);
        if (resDiff.output) {
          printOutput(resDiff.output);
        } else {
          if (subArgs.includes('-w') || subArgs.includes('--ignore-all-space')) {
            printOutput(`(工作目錄比對完成：已忽略所有空白字元與縮排差異)`);
          } else {
            printOutput('(比對完成：無任何差異)');
          }
        }
        return resDiff.code;

      case 'check-ignore':
        return emit(git.checkIgnore(subArgs));

      case 'show':
        const resShow = git.showCmd(subArgs);
        if (resShow.output) printOutput(resShow.output);
        return resShow.code;

      case 'clone':
        const resClone = git.clone(subArgs[0], subArgs[1]);
        if (resClone.output) printOutput(resClone.output);
        return resClone.code;

      case 'rerere':
        return emit(git.rerereCmd(subArgs));

      case 'rev-parse':
        return emit(git.revParse(subArgs));

      case 'lab':
        return emit(git.labCmd(subArgs));

      case 'filter-repo':
      case 'filter-branch':
        const resFilter = git.filterRepo(subArgs);
        if (resFilter.output) printOutput(resFilter.output);
        return resFilter.code;

      case 'pull':
        const resPull = git.pull(subArgs);
        if (resPull.output) printOutput(resPull.output);
        return resPull.code;

      case 'push':
        const resPush = git.push(subArgs);
        if (resPush.output) printOutput(resPush.output);
        return resPush.code;

      default:
        printOutput(`git: '${sub}' is not a supported git command.`);
        return 1;
    }
  }

  // Parse command tokens with quoted string support
  function parseCommandTokens(text) {
    const tokens = [];
    let current = '';
    let inQuote = false;
    let quoteChar = '';

    for (let i = 0; i < text.length; i++) {
      const ch = text[i];
      if ((ch === '"' || ch === "'") && !inQuote) {
        inQuote = true;
        quoteChar = ch;
      } else if (ch === quoteChar && inQuote) {
        inQuote = false;
        quoteChar = '';
      } else if (ch === ' ' && !inQuote) {
        if (current) {
          tokens.push(current);
          current = '';
        }
      } else {
        current += ch;
      }
    }
    if (current) tokens.push(current);
    return tokens;
  }

  // Check if scenario goals achieved
  function checkScenarioSuccess(isManualVerify = false) {
    const sc = ORDERED_SCENARIOS[currentScenarioIndex];
    const result = sc.checkGoal(git);

    if (result.passed) {
      const isFirstTimePass = !isCurrentScenarioPassed;
      if (!completedScenarios.has(sc.id)) {
        completedScenarios.add(sc.id);
        localStorage.setItem('git_lab_completed_scenarios', JSON.stringify(Array.from(completedScenarios)));
      }
      isCurrentScenarioPassed = true;

      if (isFirstTimePass || isManualVerify) {
        const nextIndex = getNextScenarioIndex(currentScenarioIndex);
        const hasNext = nextIndex !== -1;
        const nextSc = hasNext ? ORDERED_SCENARIOS[nextIndex] : null;
        const nextId = nextSc ? (nextSc.displayNum || nextSc.id) : '大師結業';
        const completedWebCount = countCompletedWebScenarios();
        const courseComplete = completedWebCount === webPlayableScenarioCount;

        // Render authentic TUI box banner directly in terminal stream (no popup modal!)
        const msgLines = (result.message || '').split('\n');
        printOutput(`\n\x1b[38;2;63;185;80m╭──────────────────────────────────────────────────────────────────────────╮\x1b[0m`);
        printOutput(`\x1b[38;2;63;185;80m│  ✔ [LEVEL ${sc.displayNum || sc.id} PASSED] ${sc.title}\x1b[0m`);
        msgLines.forEach(line => {
          printOutput(`\x1b[38;2;63;185;80m│  ${line}\x1b[0m`);
        });
        printOutput(`\x1b[38;2;63;185;80m╰──────────────────────────────────────────────────────────────────────────╯\x1b[0m`);
        if (hasNext) {
          printOutput(`\x1b[38;2;227;179;65m👉 下一步：輸入 \x1b[1mnext\x1b[0m\x1b[38;2;227;179;65m 或按下快捷鍵 [Alt + →]，亦可點擊下方按鈕前往下一關！\x1b[0m`);
        } else if (courseComplete) {
          printOutput(`\x1b[38;2;255;215;0m🏆 狂賀！你已通關全部 ${webPlayableScenarioCount} 個 Web 關卡！\x1b[0m`);
        }

        // Show terminal action strip
        if (terminalNextBar) {
          terminalNextBar.style.display = 'flex';
          if (nextBarMsg) {
            nextBarMsg.textContent = hasNext
              ? `✔ 關卡 ${sc.displayNum || sc.id} 通關！可前往下一關 (${nextId})`
              : courseComplete
                ? `🏆 Web 課程完成！已通關全部 ${webPlayableScenarioCount} 個可玩關卡。`
                : `此為最後一個 Web 關卡；尚有 ${webPlayableScenarioCount - completedWebCount} 關未完成，請從關卡清單繼續。`;
          }
          if (nextScenarioButton) nextScenarioButton.style.display = hasNext ? '' : 'none';
        }

        // Also add an interactive button in the terminal output stream
        if (hasNext) {
          const actionDiv = document.createElement('div');
          actionDiv.className = 'terminal-line terminal-victory-action';
          actionDiv.innerHTML = `<button class="btn-terminal-next" onclick="nextScenario()">前往下一關 ➜ (${nextId}) <kbd>Alt+→</kbd></button>`;
          terminalOutput.appendChild(actionDiv);
        }

        spawnConfetti();

        // Check Chapter Graduation (§7.6)
        if (isFirstTimePass && sc.chapterKey && sc.chapterKey !== 'optional') {
          const chLevels = ORDERED_SCENARIOS.filter(s => s.chapterKey === sc.chapterKey && scenarioNavigation.isWebPlayable(s));
          const chapterComplete = chLevels.length > 0 && chLevels.every(level => completedScenarios.has(level.id));
          if (chapterComplete) {
            setTimeout(() => {
              if (ORDERED_SCENARIOS[currentScenarioIndex]?.id === sc.id && isCurrentScenarioPassed) openChapterGraduationModal(sc);
            }, 600);
          }
        }
      }
    } else if (isManualVerify) {
      printOutput(`\x1b[38;2;248;81;73m❌ 尚未達成通關目標：\x1b[0m\n${result.message}`);
    }
  }

  // Terminal Print Output helper with basic ANSI colors
  function printOutput(text) {
    if (!text) return;
    const lines = text.split('\n');
    for (const line of lines) {
      const lineDiv = document.createElement('div');
      lineDiv.className = 'terminal-line';
      lineDiv.innerHTML = ansiToHtml(line);
      terminalOutput.appendChild(lineDiv);
    }
  }

  function ansiToHtml(str) {
    if (!str) return '';
    let escaped = str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');

    let openSpans = 0;
    let res = escaped.replace(/\x1b\[([0-9;]*)m/g, (match, p1) => {
      if (!p1 || p1 === '0') {
        let closeTags = '</span>'.repeat(openSpans);
        openSpans = 0;
        return closeTags;
      }
      if (p1 === '1') {
        openSpans++;
        return '<span style="font-weight: 700; color: #fff;">';
      }
      if (p1 === '22') {
        if (openSpans > 0) {
          openSpans--;
          return '</span>';
        }
        return '';
      }
      const rgbMatch = p1.match(/^38;2;(\d+);(\d+);(\d+)$/);
      if (rgbMatch) {
        openSpans++;
        return `<span style="color: rgb(${rgbMatch[1]}, ${rgbMatch[2]}, ${rgbMatch[3]});">`;
      }
      const stdColors = {
        '30': '#000', '31': '#f85149', '32': '#2ea043', '33': '#d29922',
        '34': '#58a6ff', '35': '#bc8cff', '36': '#39c5bb', '37': '#c9d1d9',
        '90': '#8b949e', '91': '#ff7b72', '92': '#3fb950', '93': '#e3b341',
        '94': '#79c0ff', '95': '#d2a8ff', '96': '#56d4dd', '97': '#f0f6fc'
      };
      if (stdColors[p1]) {
        openSpans++;
        return `<span style="color: ${stdColors[p1]};">`;
      }
      return '';
    });

    res = res.replace(/\x1b\[[0-9;]*[a-zA-Z]/g, '');
    if (openSpans > 0) {
      res += '</span>'.repeat(openSpans);
    }
    return res;
  }

  function scrollToBottom() {
    terminalOutput.scrollTop = terminalOutput.scrollHeight;
  }

  function printHelp() {
    printOutput(`\x1b[38;2;88;166;255mGit Scenario Lab — 支援指令表：\x1b[0m
  git init [-b main]          建立版本庫
  git status                  查看分支與工作區狀態
  git add <file> | . | -p     加入暫存區 (支援 -p 局部暫存)
  git commit [--amend] -m     建立或修補 Commit
  git switch [-c <branch>]    切換或建立分支
  git merge <branch> [--no-ff] 合併分支 (支援衝突模擬)
  git rebase <branch>         rebase 保持線性歷史
  git stash [list|pop|-u]     暫存工作區修改
  git clean -nd / -fd         先預覽再清理未追蹤檔案
  git mv <old> <new>          版本控管更名
  git cherry-pick <hash>      單獨挑選特定 Commit
  git reset [--hard|--soft]   移動 HEAD 指標
  git revert [-m 1] <hash>    安全產生 revert commit
  git tag [-a <v> -m "msg"]   建立輕量或附註標籤
  git worktree add <dir> <b>  雙軌平行工作區
  git bisect [start|bad|good] 二分搜尋 (Bisect) 除錯
  git rm --cached <file>      自 Git 索引除名保全本地檔案
  git remote / git fetch      遠端節點管理與抓取
  git cat-file [-t|-p]        檢視 Git 物件內容
  git check-ignore -v <file>  檢查忽略規則
  git rev-parse <ref>         解析版本參照
  git lab pr merge <branch>   模擬平台合併 PR
  cd <worktree> / cd ..       切換獨立工作目錄
  echo / cat / touch / rm     編輯與檢查工作區檔案
  git reflog / git log / blame 查看歷史黑盒子日記

平台輔助指令：
  next (n)   前往下一關 (快速鍵: Alt+→)
  guide      開啟補充說明
  hint       查看當前關卡提示
  goal       查看關卡情境
  verify     驗收目標完成狀態
  reset      重設當前關卡
  levels     展開課程地圖與 CLI 選修
  clear      清空終端機畫面
`);
  }

  // Keyboard navigation & history & advanced terminal shortcuts
  let lastTabTime = 0;

  terminalInput.addEventListener('keydown', (e) => {
    // 1. Enter: execute command
    if (e.key === 'Enter') {
      const val = terminalInput.value;
      terminalInput.value = '';
      executeCommand(val);
      return;
    }

    // 2. Ctrl+L / Cmd+K: Clear screen keeping current input value
    if ((e.ctrlKey && e.key.toLowerCase() === 'l') || (e.metaKey && e.key.toLowerCase() === 'k')) {
      e.preventDefault();
      terminalOutput.innerHTML = '';
      return;
    }

    // 3. Ctrl+C: Interrupt current line
    if (e.ctrlKey && e.key.toLowerCase() === 'c') {
      if (window.getSelection().toString() === '') {
        e.preventDefault();
        const val = terminalInput.value;
        const promptText = `user@git-lab:~/workspace ${promptBranchSpan.textContent} $ ${val}^C`;
        printOutput(`\x1b[38;2;139;148;158m${promptText}\x1b[0m`);
        terminalInput.value = '';
        pendingPatch = null;
        currentDraft = '';
        historyIndex = commandHistory.length;
        scrollToBottom();
        return;
      }
    }

    // 4. Ctrl+U: Clear entire input line
    if (e.ctrlKey && e.key.toLowerCase() === 'u') {
      e.preventDefault();
      terminalInput.value = '';
      return;
    }

    // 5. ArrowUp: History Previous with draft preservation
    if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (commandHistory.length === 0) return;
      if (historyIndex === commandHistory.length) {
        currentDraft = terminalInput.value;
      }
      if (historyIndex > 0) {
        historyIndex--;
        terminalInput.value = commandHistory[historyIndex];
        terminalInput.setSelectionRange(terminalInput.value.length, terminalInput.value.length);
      }
      return;
    }

    // 6. ArrowDown: History Next with draft restoration
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (historyIndex < commandHistory.length - 1) {
        historyIndex++;
        terminalInput.value = commandHistory[historyIndex];
        terminalInput.setSelectionRange(terminalInput.value.length, terminalInput.value.length);
      } else if (historyIndex === commandHistory.length - 1) {
        historyIndex = commandHistory.length;
        terminalInput.value = currentDraft;
        terminalInput.setSelectionRange(terminalInput.value.length, terminalInput.value.length);
      }
      return;
    }

    // 7. Tab: Context-aware Autocomplete & Double Tab Candidates
    if (e.key === 'Tab') {
      e.preventDefault();
      const input = terminalInput.value;
      const tokens = input.split(' ');
      const now = Date.now();
      const isDoubleTab = (now - lastTabTime) < 500;
      lastTabTime = now;

      let candidates = [];

      if (tokens.length <= 1) {
        const topCmds = ['git', 'cd', 'pwd', 'echo', 'cat', 'touch', 'rm', 'chmod', 'next', 'guide', 'hint', 'help', 'verify', 'reset', 'clear', 'levels'];
        candidates = topCmds.filter(c => c.startsWith(tokens[0]));
      } else if (tokens[0] === 'git') {
        if (tokens.length === 2) {
          const gitSubs = [
            'status', 'add', 'commit', 'branch', 'switch', 'checkout', 'merge',
            'rebase', 'cherry-pick', 'reset', 'revert', 'tag', 'worktree',
            'bisect', 'rm', 'stash', 'clean', 'mv', 'remote', 'fetch',
            'pull', 'push', 'diff', 'log', 'reflog', 'blame', 'cat-file', 'config', 'init', 'restore', 'check-ignore', 'rev-parse', 'lab', 'rerere'
          ];
          candidates = gitSubs.filter(s => s.startsWith(tokens[1])).map(s => `git ${s}`);
        } else {
          const sub = tokens[1];
          const partial = tokens[tokens.length - 1];
          const prefix = tokens.slice(0, -1).join(' ') + ' ';

          if (['switch', 'checkout', 'merge', 'rebase', 'branch'].includes(sub)) {
            const branches = Array.from(git.branches.keys());
            candidates = branches.filter(b => b.startsWith(partial)).map(b => prefix + b);
          } else if (['add', 'rm', 'restore', 'diff'].includes(sub)) {
            const files = Array.from(new Set([...git.workingTree.keys(), ...git.index.keys()]));
            candidates = files.filter(f => f.startsWith(partial)).map(f => prefix + f);
          }
        }
      }

      if (candidates.length === 1) {
        terminalInput.value = candidates[0];
        if (candidates[0].endsWith('commit -m "')) {
          terminalInput.setSelectionRange(candidates[0].length, candidates[0].length);
        }
      } else if (candidates.length > 1) {
        let lcp = candidates[0];
        for (let i = 1; i < candidates.length; i++) {
          while (!candidates[i].startsWith(lcp)) {
            lcp = lcp.slice(0, -1);
          }
        }
        if (lcp.length > input.length) {
          terminalInput.value = lcp;
        } else if (isDoubleTab) {
          printOutput(`\x1b[38;2;139;148;158m${input}\x1b[0m`);
          printOutput(candidates.map(c => c.split(' ').pop()).join('   '));
          scrollToBottom();
        }
      }
    }
  });

  // Auto-focus terminal input when clicking anywhere in terminal area
  const terminalPanelEl = document.querySelector('.terminal-panel') || (terminalOutput && terminalOutput.parentElement);
  if (terminalPanelEl) {
    terminalPanelEl.addEventListener('click', (e) => {
      if (e.target.tagName !== 'BUTTON' && window.getSelection().toString() === '') {
        terminalInput.focus();
      }
    });
  }

  // Global Shortcut listener (Alt+Right / Option+Right for Next Level, or Enter when passed)
  window.addEventListener('keydown', (e) => {
    if (e.altKey && (e.key === 'ArrowRight' || e.key === 'Right')) {
      e.preventDefault();
      window.nextScenario();
    } else if (e.key === 'Enter' && terminalNextBar && terminalNextBar.style.display !== 'none' &&
        nextScenarioButton && nextScenarioButton.style.display !== 'none' && document.activeElement !== terminalInput &&
        !e.target.closest('button, input')) {
      e.preventDefault();
      window.nextScenario();
    }
  });

  // Modal Handling
  window.openMissionModal = () => {
    if (!missionModal) return;
    const sc = ORDERED_SCENARIOS[currentScenarioIndex];
    const bracketTag = document.getElementById('modal-bracket-tag');
    if (bracketTag) bracketTag.textContent = `[關卡 ${sc.displayNum || sc.id}]`;
    const titleEl = document.getElementById('modal-title');
    if (titleEl) titleEl.textContent = sc.title;
    const storyEl = document.getElementById('modal-story');
    if (storyEl) storyEl.textContent = personalizeStory(sc.story, getUserName());
    const hideCb = document.getElementById('modal-hide-intro-cb');
    if (hideCb) hideCb.checked = (localStorage.getItem('git_lab_hide_intro_modal') === 'true');
    missionModal.style.display = 'flex';
    const btn = document.getElementById('btn-modal-confirm');
    if (btn) btn.focus();
  };

  window.closeMissionModal = () => {
    if (missionModal) missionModal.style.display = 'none';
    terminalInput.focus();
  };

  window.confirmScenarioStart = () => {
    const hideCb = document.getElementById('modal-hide-intro-cb');
    if (hideCb && hideCb.checked) {
      localStorage.setItem('git_lab_hide_intro_modal', 'true');
    } else if (hideCb) {
      localStorage.removeItem('git_lab_hide_intro_modal');
    }
    if (missionModal) missionModal.style.display = 'none';
    const sc = ORDERED_SCENARIOS[currentScenarioIndex];
    const requiredSteps = getRequiredSteps(sc);

    terminalOutput.innerHTML = '';

    requiredSteps.forEach((s) => {
      const cleanWhy = s.why.replace(/^[【\[].*?[】\]]\s*/, '');
      printOutput(`\x1b[38;2;255;255;255m${cleanWhy}\x1b[0m`);
      printOutput(`\x1b[38;2;39;247;149m↳  請輸入 \x1b[1m${s.cmd}\x1b[0m\n`);
    });

    terminalInput.focus();
    scrollToBottom();
  };

  document.addEventListener('keydown', (e) => {
    if (missionModal && missionModal.style.display === 'flex') {
      if (e.key === 'Escape') {
        e.preventDefault();
        window.confirmScenarioStart();
      } else if (e.key === 'Tab') {
        const controls = [...missionModal.querySelectorAll('input, button')];
        const first = controls[0];
        const last = controls[controls.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    }
  });

  function showVictoryModal(scenario, message) {
    if (!victoryModal) return;
    document.getElementById('victory-title').textContent = `🎉 關卡 ${scenario.displayNum || scenario.id} 順利通關！`;
    document.getElementById('victory-msg').textContent = message;
    victoryModal.style.display = 'flex';
    spawnConfetti();
  }

  window.closeVictoryModal = () => {
    if (victoryModal) victoryModal.style.display = 'none';
    terminalInput.focus();
  };

  window.nextScenario = () => {
    closeVictoryModal();
    const nextIndex = getNextScenarioIndex(currentScenarioIndex);
    if (nextIndex !== -1) {
      loadScenario(nextIndex);
    } else if (countCompletedWebScenarios() < webPlayableScenarioCount) {
      printOutput(`\x1b[38;2;227;179;65m目前還有 Web 關卡尚未完成，請先完成當前關卡或從關卡清單選擇未完成的關卡。\x1b[0m`);
    } else {
      printOutput(`\n\x1b[38;2;255;215;0m╔══════════════════════════════════════════════════════════════════════════╗\x1b[0m`);
      printOutput(`\x1b[38;2;255;215;0m║  🏆 狂賀！你已經完整通關全部 ${webPlayableScenarioCount} 個 Web Git 實戰關卡！你已成為真正的 Git 大師！ ║\x1b[0m`);
      printOutput(`\x1b[38;2;255;215;0m╚══════════════════════════════════════════════════════════════════════════╝\x1b[0m`);
      printOutput(`\x1b[38;2;63;185;80m感謝你的學習與探索！歡迎將本專案分享給更多想學好 Git 的開發者：https://github.com/Hsing24/learn-git\x1b[0m\n`);
      scrollToBottom();
    }
  };

  window.executeLabCommand = (cmd) => executeCommand(cmd);
  window.loadScenario = (idx) => loadScenario(idx);
  window.openCheatsheet = () => {
    const m = document.getElementById('cheatsheet-modal');
    if (m) m.style.display = 'flex';
  };
  window.closeCheatsheet = () => {
    const m = document.getElementById('cheatsheet-modal');
    if (m) m.style.display = 'none';
    terminalInput.focus();
  };

  // Interactive Rebase Modal State & Handlers
  let activeRebaseState = null;

  function openRebaseModal(plan) {
    activeRebaseState = {
      upstreamId: plan.upstreamId,
      commits: plan.commits,
      step: 'todo',
      todo: []
    };

    const modal = document.getElementById('rebase-modal');
    const todoContainer = document.getElementById('rebase-todo-list');
    const stepTodo = document.getElementById('rebase-step-todo');
    const stepMsg = document.getElementById('rebase-step-msg');
    const btnSubmit = document.getElementById('btn-rebase-submit');

    if (!modal || !todoContainer) return;

    stepTodo.style.display = 'block';
    stepMsg.style.display = 'none';
    btnSubmit.textContent = '開始 Rebase ➜';

    todoContainer.innerHTML = '';
    plan.commits.forEach((c) => {
      const row = document.createElement('div');
      row.className = 'rebase-todo-row';
      row.innerHTML = `
        <select class="rebase-action-select" data-commit-id="${c.id}">
          <option value="pick" ${(!c.action || c.action === 'pick') ? 'selected' : ''}>pick</option>
          <option value="reword" ${c.action === 'reword' ? 'selected' : ''}>reword</option>
          <option value="squash" ${c.action === 'squash' ? 'selected' : ''}>squash</option>
          <option value="fixup" ${c.action === 'fixup' ? 'selected' : ''}>fixup</option>
          <option value="drop" ${c.action === 'drop' ? 'selected' : ''}>drop</option>
        </select>
        <code class="rebase-short-hash">${escapeHtml(c.shortHash)}</code>
        <span class="rebase-commit-msg">${escapeHtml(c.message)}</span>
      `;
      todoContainer.appendChild(row);
    });

    modal.style.display = 'flex';
  }

  window.abortInteractiveRebase = () => {
    const modal = document.getElementById('rebase-modal');
    if (modal) modal.style.display = 'none';
    activeRebaseState = null;
    printOutput('rebase aborted');
    terminalInput.focus();
    scrollToBottom();
  };

  window.proceedInteractiveRebase = () => {
    if (!activeRebaseState) return;
    const stepTodo = document.getElementById('rebase-step-todo');
    const stepMsg = document.getElementById('rebase-step-msg');
    const msgEditor = document.getElementById('rebase-msg-editor');
    const btnSubmit = document.getElementById('btn-rebase-submit');

    if (activeRebaseState.step === 'todo') {
      const selects = document.querySelectorAll('.rebase-action-select');
      const todo = [];
      selects.forEach(sel => {
        const id = sel.getAttribute('data-commit-id');
        const action = sel.value;
        const commit = activeRebaseState.commits.find(c => c.id === id);
        todo.push({
          id,
          action,
          origMessage: commit ? commit.message : ''
        });
      });

      const nonDrop = todo.filter(t => t.action !== 'drop');
      if (nonDrop.length > 0 && (nonDrop[0].action === 'squash' || nonDrop[0].action === 'fixup')) {
        alert("error: cannot 'squash' or 'fixup' without a previous commit");
        return;
      }

      activeRebaseState.todo = todo;

      const hasSquashOrReword = todo.some(t => t.action === 'squash' || t.action === 'reword');
      if (hasSquashOrReword) {
        activeRebaseState.step = 'editor';
        stepTodo.style.display = 'none';
        stepMsg.style.display = 'block';
        btnSubmit.textContent = '確認送出 ➜';

        let editorLines = [];
        editorLines.push('# This is a combination of commits.');
        todo.forEach((t, i) => {
          if (t.action === 'pick' || t.action === 'squash' || t.action === 'reword' || t.action === 'fixup') {
            editorLines.push(`# This is the commit message #${i + 1}:`);
            editorLines.push(t.origMessage);
            editorLines.push('');
          }
        });
        editorLines.push('# Please enter the commit message for your changes. Lines starting');
        editorLines.push("# with '#' will be ignored.");

        msgEditor.value = editorLines.join('\n');
        msgEditor.focus();
        return;
      }

      finalizeInteractiveRebase();
    } else if (activeRebaseState.step === 'editor') {
      const rawText = msgEditor.value || '';
      const cleaned = rawText
        .split('\n')
        .filter(line => !line.trim().startsWith('#'))
        .join('\n')
        .trim();

      const squashOrReword = activeRebaseState.todo.filter(t => t.action === 'squash' || t.action === 'reword');
      if (squashOrReword.length > 0) {
        squashOrReword[squashOrReword.length - 1].message = cleaned || 'feat: squashed commit';
      }

      finalizeInteractiveRebase();
    }
  };

  function finalizeInteractiveRebase() {
    const modal = document.getElementById('rebase-modal');
    if (modal) modal.style.display = 'none';

    const res = git.rebaseInteractiveApply(activeRebaseState.upstreamId, activeRebaseState.todo);
    if (res.output) printOutput(res.output);

    activeRebaseState = null;
    updatePrompt();
    refreshGraph();
    renderFileList();
    checkTaskProgress('git rebase -i');
    checkScenarioSuccess(false);
    scrollToBottom();
    terminalInput.focus();
  }

  // Level Drawer Generator with Chapter Grouping (§7.2)
  function renderLevelDropdown() {
    if (!levelDropdown) return;
    levelDropdown.innerHTML = '';

    const suggestedIdx = ORDERED_SCENARIOS.findIndex(s => scenarioNavigation.isWebPlayable(s) && !completedScenarios.has(s.id));

    let currentChapter = null;
    ORDERED_SCENARIOS.forEach((sc, idx) => {
      const isDone = completedScenarios.has(sc.id);
      const isCurrent = idx === currentScenarioIndex;
      const isSuggested = idx === suggestedIdx && !isDone;
      const isCliOnly = !scenarioNavigation.isWebPlayable(sc);

      // Group header
      if (sc.chapterTitle && sc.chapterTitle !== currentChapter) {
        currentChapter = sc.chapterTitle;
        const groupHeader = document.createElement('div');
        groupHeader.className = 'level-group-header';

        const groupLevels = ORDERED_SCENARIOS.filter(s => s.chapterTitle === currentChapter);
        const chLevels = groupLevels.filter(s => scenarioNavigation.isWebPlayable(s));
        const chDoneCount = chLevels.filter(s => completedScenarios.has(s.id)).length;
        const groupProgress = chLevels.length > 0 ? `${chDoneCount}/${chLevels.length}` : `${groupLevels.length} 項 CLI 實戰`;

        groupHeader.innerHTML = `
          <span class="group-title">${escapeHtml(sc.chapterTitle)}</span>
          <span class="group-progress">${groupProgress}</span>
        `;
        levelDropdown.appendChild(groupHeader);
      }

      const item = document.createElement('div');
      item.className = `level-item ${isCurrent ? 'active' : ''} ${isDone ? 'completed' : ''} ${isCliOnly ? 'disabled' : ''}`;
      item.innerHTML = `
        <span class="level-id">${sc.displayNum || sc.id}</span>
        <span class="level-info">
          <span class="item-title">
            ${escapeHtml(sc.title)}
            ${isSuggested ? '<span class="badge-suggested">建議下一關</span>' : ''}
            ${isCliOnly ? '<span class="badge-cli-only">僅 CLI</span>' : ''}
          </span>
          <span class="item-diff">${escapeHtml(sc.difficulty)}</span>
        </span>
        <span class="item-status">${isDone ? '✔' : ''}</span>
      `;
      item.onclick = () => {
        if (isCliOnly) {
          alert(`（關卡 ${sc.id} 為 CLI 專屬選修實戰，請使用 ./git-lab start ${sc.id} 在本機真實環境練習）`);
          return;
        }
        loadScenario(idx);
        toggleLevelDropdown();
      };
      levelDropdown.appendChild(item);
    });
  }

  function toggleLevelDropdown() {
    renderLevelDropdown();
    levelDropdown.classList.toggle('show');
  }

  if (levelSelectBtn) {
    levelSelectBtn.onclick = (e) => {
      e.stopPropagation();
      toggleLevelDropdown();
    };
  }

  document.addEventListener('click', (e) => {
    if (levelDropdown && !levelDropdown.contains(e.target) && e.target !== levelSelectBtn) {
      levelDropdown.classList.remove('show');
    }
  });

  // The shortcut rail switches one panel at every viewport size.
  window.switchTab = (tabId) => {
    const labels = { graph: 'Git Tree', mission: '任務', files: '檔案總管', guide: '補充說明' };
    if (!labels[tabId]) return;
    document.querySelectorAll('.tab-btn').forEach(btn => {
      const isActive = btn.id === `tab-btn-${tabId}`;
      btn.classList.toggle('active', isActive);
      btn.setAttribute('aria-selected', String(isActive));
      btn.tabIndex = isActive ? 0 : -1;
    });
    document.querySelectorAll('.tab-content').forEach(content => {
      const isActive = content.id === `tab-pane-${tabId}`;
      content.classList.toggle('active', isActive);
      content.hidden = !isActive;
    });
    document.getElementById('active-panel-title').textContent = labels[tabId];
  };

  document.querySelector('.visual-tabs').addEventListener('keydown', event => {
    const buttons = [...document.querySelectorAll('.visual-tabs .tab-btn')];
    const current = buttons.indexOf(event.target);
    if (current < 0) return;
    let next;
    if (event.key === 'ArrowDown') next = (current + 1) % buttons.length;
    else if (event.key === 'ArrowUp') next = (current - 1 + buttons.length) % buttons.length;
    else if (event.key === 'Home') next = 0;
    else if (event.key === 'End') next = buttons.length - 1;
    else return;
    event.preventDefault();
    buttons[next].click();
    buttons[next].focus();
  });

  // Let learners decide the final contents before staging a resolution.
  window.resolveConflictInUI = () => {
    if (!git.conflictState) return;
    const file = selectedFilename || git.conflictState.file;
    selectFile(file);
    beginFileEdit();
  };

  // Header More Menu (§7.4)
  window.toggleHeaderMoreMenu = (e) => {
    if (e) e.stopPropagation();
    const dropdown = document.getElementById('header-more-dropdown');
    if (dropdown) dropdown.classList.toggle('show');
  };

  window.closeHeaderMoreMenu = () => {
    const dropdown = document.getElementById('header-more-dropdown');
    if (dropdown) dropdown.classList.remove('show');
  };

  document.addEventListener('click', (e) => {
    const moreBtn = document.getElementById('header-more-btn');
    const dropdown = document.getElementById('header-more-dropdown');
    if (dropdown && !dropdown.contains(e.target) && e.target !== moreBtn) {
      dropdown.classList.remove('show');
    }
  });

  // Course Map Modal (§7.1)
  window.openCourseMapModal = () => {
    const modal = document.getElementById('course-map-modal');
    const grid = document.getElementById('course-map-grid');
    if (!modal || !grid) return;

    if (typeof CURRICULUM !== 'undefined' && CURRICULUM.chapters) {
      grid.innerHTML = CURRICULUM.chapters.map((ch, chIdx) => {
        const chLevels = ORDERED_SCENARIOS.filter(s => s.chapterKey === ch.key && scenarioNavigation.isWebPlayable(s));
        const chDoneCount = chLevels.filter(s => completedScenarios.has(s.id)).length;
        const total = chLevels.length;
        const pct = total > 0 ? Math.round((chDoneCount / total) * 100) : 0;

        return `
          <div class="course-chapter-card" onclick="jumpToChapterFromMap('${ch.key}')">
            <div class="chapter-card-top">
              <span class="chapter-badge">第 ${chIdx} 章</span>
              <span class="chapter-progress-text">${chDoneCount}/${total} (${pct}%)</span>
            </div>
            <h4 class="chapter-card-title">${escapeHtml(ch.title)}</h4>
            <p class="chapter-card-summary">${escapeHtml(ch.summary)}</p>
            <div class="chapter-card-bar">
              <div class="chapter-card-fill" style="width: ${pct}%;"></div>
            </div>
          </div>
        `;
      }).join('');
    }

    modal.style.display = 'flex';
  };

  window.closeCourseMapModal = () => {
    const modal = document.getElementById('course-map-modal');
    if (modal) modal.style.display = 'none';
    if (pendingInitialIntro) {
      pendingInitialIntro = false;
      window.openMissionModal();
    } else {
      terminalInput.focus();
    }
  };

  window.jumpToChapterFromMap = (chKey) => {
    const chLevels = ORDERED_SCENARIOS.filter(s => s.chapterKey === chKey && scenarioNavigation.isWebPlayable(s));
    if (chLevels.length === 0) return;
    let target = chLevels.find(s => !completedScenarios.has(s.id));
    if (!target) target = chLevels[0];
    const idx = ORDERED_SCENARIOS.indexOf(target);
    if (idx !== -1) {
      loadScenario(idx);
      closeCourseMapModal();
    }
  };

  // Chapter Graduation Modal (§7.6)
  function openChapterGraduationModal(sc) {
    const modal = document.getElementById('chapter-graduation-modal');
    if (!modal) return;
    const titleEl = document.getElementById('graduation-modal-title');
    const descEl = document.getElementById('graduation-modal-desc');
    const listEl = document.getElementById('graduation-commands-list');
    const nextBtn = document.getElementById('btn-graduation-next');

    if (titleEl) titleEl.textContent = `🎓 恭喜完成第 ${sc.chapterIndex} 章：${sc.chapterTitle}！`;
    if (descEl) descEl.innerHTML = `你已全數通關本章所有關卡！<strong>${escapeHtml(sc.chapterSummary)}</strong>。實戰心法已融會貫通！`;

    const chLevels = ORDERED_SCENARIOS.filter(s => s.chapterKey === sc.chapterKey && scenarioNavigation.isWebPlayable(s));
    const commands = [];
    chLevels.forEach(lvl => {
      const guide = (typeof COMMAND_GUIDES !== 'undefined' && COMMAND_GUIDES[lvl.id]) || (typeof COMMAND_GUIDES_EXTRA !== 'undefined' && COMMAND_GUIDES_EXTRA[lvl.id]);
      if (guide && guide.guidedSteps) {
        guide.guidedSteps.filter(s => s.category === 'required').forEach(s => {
          if (!commands.some(c => c.cmd === s.cmd)) {
            commands.push({ cmd: s.cmd, why: s.why });
          }
        });
      }
    });

    if (listEl) {
      listEl.innerHTML = commands.map(c => `
        <div class="graduation-cmd-item">
          <code class="graduation-cmd-code">${escapeHtml(c.cmd)}</code>
          <span class="graduation-cmd-why">${escapeHtml(c.why)}</span>
        </div>
      `).join('');
    }

    const nextChapLvlIdx = scenarioNavigation.nextWebPlayableIndex(
      ORDERED_SCENARIOS,
      currentScenarioIndex,
      scenario => scenario.chapterIndex > sc.chapterIndex
    );
    if (nextBtn) {
      if (nextChapLvlIdx !== -1) {
        nextBtn.style.display = 'block';
        nextBtn.textContent = `前往下一章 (${ORDERED_SCENARIOS[nextChapLvlIdx].chapterTitle})`;
        nextBtn.onclick = () => {
          closeGraduationModal();
          loadScenario(nextChapLvlIdx);
        };
      } else {
        nextBtn.style.display = 'none';
      }
    }

    modal.style.display = 'flex';
  }

  window.closeGraduationModal = () => {
    const modal = document.getElementById('chapter-graduation-modal');
    if (modal) modal.style.display = 'none';
    terminalInput.focus();
  };

  // Cheatsheet Data-Driven Rendering (§7.7)
  function renderCheatsheetTable() {
    const tbody = document.getElementById('cheatsheet-table-body');
    if (!tbody) return;
    const data = typeof CHEATSHEET_DATA !== 'undefined' ? CHEATSHEET_DATA : [];
    tbody.innerHTML = data.map(item => `
      <tr>
        <td><strong>${escapeHtml(item.scene)}</strong></td>
        <td><code>${escapeHtml(item.legacy)}</code></td>
        <td><span class="tag-better">${escapeHtml(item.modern)}</span></td>
        <td>${escapeHtml(item.why)}</td>
        <td>
          <button class="btn-cheat-practice" onclick="goToScenarioFromCheat('${item.levelId}')">
            去練習 ➜
          </button>
        </td>
      </tr>
    `).join('');
  }

  window.goToScenarioFromCheat = (lvlId) => {
    const idx = ORDERED_SCENARIOS.findIndex(s => s.id === lvlId);
    if (idx !== -1) {
      loadScenario(idx);
      closeCheatsheet();
    } else {
      alert(`找不到關卡 ${lvlId}`);
    }
  };

  // Confetti Particle Effect
  function spawnConfetti() {
    const canvas = document.getElementById('confetti-canvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const particles = [];
    const colors = ['#58a6ff', '#3fb950', '#d29922', '#bc8cff', '#f85149', '#ffffff'];

    for (let i = 0; i < 70; i++) {
      particles.push({
        x: canvas.width / 2,
        y: canvas.height / 2,
        vx: (Math.random() - 0.5) * 14,
        vy: (Math.random() - 0.7) * 14,
        size: Math.random() * 8 + 4,
        color: colors[Math.floor(Math.random() * colors.length)],
        alpha: 1
      });
    }

    let frame = 0;
    function animate() {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      particles.forEach(p => {
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.3; // gravity
        p.alpha -= 0.015;
        ctx.fillStyle = p.color;
        ctx.globalAlpha = Math.max(0, p.alpha);
        ctx.fillRect(p.x, p.y, p.size, p.size);
      });
      frame++;
      if (frame < 60) {
        requestAnimationFrame(animate);
      } else {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
      }
    }
    animate();
  }

  // Initial startup
  renderCheatsheetTable();

  // First visit check: show the Course Map before any scenario intro.
  const showCourseMapOnFirstVisit = !localStorage.getItem('git_lab_has_visited') && completedScenarios.size === 0;
  if (showCourseMapOnFirstVisit) {
    pendingInitialIntro = localStorage.getItem('git_lab_hide_intro_modal') !== 'true';
    localStorage.setItem('git_lab_has_visited', 'true');
    setTimeout(() => {
      openCourseMapModal();
    }, 400);
  }

  // Start with Level 00
  loadScenario(0, !showCourseMapOnFirstVisit);
});
