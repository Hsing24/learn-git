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
  let currentScenarioIndex = 0;
  const completedScenarios = new Set(
    JSON.parse(localStorage.getItem('git_lab_completed_scenarios') || '[]')
  );
  let commandHistory = [];
  let historyIndex = -1;

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
  const guideContainer = document.getElementById('guide-container');
  let isCurrentScenarioPassed = false;

  // Load Scenario by ID
  function loadScenario(index) {
    if (index < 0 || index >= SCENARIOS.length) index = 0;
    currentScenarioIndex = index;
    const scenario = SCENARIOS[index];
    isCurrentScenarioPassed = false;

    if (terminalNextBar) terminalNextBar.style.display = 'none';

    // Reset git and execute scenario setup
    git.resetAll();
    scenario.setup(git);

    // Update UI elements
    levelSelectBtn.innerHTML = `
      <span class="level-badge">${scenario.id}</span>
      <span class="level-name">${scenario.title}</span>
      <span class="arrow-down">▼</span>
    `;

    updatePrompt();
    refreshGraph();
    renderFileList();
    renderCommandGuide(scenario);

    // Update Mission Tab Content
    const tabMissionTitle = document.getElementById('tab-mission-title');
    if (tabMissionTitle) tabMissionTitle.textContent = `${scenario.id}：${scenario.title}`;
    const tabMissionStory = document.getElementById('tab-mission-story');
    if (tabMissionStory) tabMissionStory.textContent = scenario.story;
    const tabMissionGoals = document.getElementById('tab-mission-goals');
    if (tabMissionGoals) tabMissionGoals.innerHTML = scenario.goals.map(g => `<li>${g}</li>`).join('');

    // Fetch rich pedagogical guide
    const guide = (typeof COMMAND_GUIDES !== 'undefined' && COMMAND_GUIDES[scenario.id]) ? COMMAND_GUIDES[scenario.id] : null;

    // Print welcome banner & guided narrative in terminal (pure in-terminal immersion, no modal popup!)
    terminalOutput.innerHTML = '';
    printOutput(`\x1b[38;2;88;166;255m╔══════════════════════════════════════════════════════════════════════════╗\x1b[0m`);
    printOutput(`\x1b[38;2;88;166;255m║  🚀 關卡 ${scenario.id}：${scenario.title}\x1b[0m`);
    printOutput(`\x1b[38;2;88;166;255m╚══════════════════════════════════════════════════════════════════════════╝\x1b[0m`);

    // 1. 💼 職場情境現場
    if (guide && guide.scenarioContext) {
      printOutput(`\x1b[38;2;210;153;34m💼 職場情境現場：\x1b[0m`);
      printOutput(`   \x1b[38;2;139;148;158m👤 扮演角色：\x1b[0m\x1b[38;2;230;237;243m${guide.scenarioContext.role}\x1b[0m`);
      printOutput(`   \x1b[38;2;139;148;158m📋 實戰現場：\x1b[0m\x1b[38;2;230;237;243m${guide.scenarioContext.situation}\x1b[0m\n`);
    } else {
      printOutput(`\x1b[38;2;210;153;34m💼 職場情境：\x1b[0m\x1b[38;2;230;237;243m${scenario.story}\x1b[0m\n`);
    }

    // 2. 💡 引導思考與指令脈絡 (Why each command)
    if (guide && guide.guidedSteps && guide.guidedSteps.length > 0) {
      printOutput(`\x1b[38;2;240;136;62m💡 引導思考與指令脈絡（循序解題思維）：\x1b[0m`);
      guide.guidedSteps.forEach((s) => {
        const catBadge = s.category === 'required' ? '\x1b[38;2;248;81;73m[必備]\x1b[0m ' : (s.category === 'optional' ? '\x1b[38;2;63;185;80m[推薦可選]\x1b[0m ' : '');
        printOutput(`   \x1b[1m步驟 ${s.step}：\x1b[0m ${catBadge}\x1b[38;2;88;166;255m${s.cmd}\x1b[0m`);
        printOutput(`   \x1b[38;2;139;148;158m↳ 運作目的：${s.why}\x1b[0m`);
      });
      printOutput('');
    }

    // Level 00 specific tip
    if (scenario.id === '00') {
      printOutput(`\x1b[38;2;227;179;65m⚙️ [設定提示] 本關只需完成必備項 (user.name & user.email) 即可過關！\x1b[0m`);
      printOutput(`\x1b[38;2;139;148;158m   若額外輸入 push.autoSetupRemote true 可解鎖彩蛋成就。\x1b[0m\n`);
    }

    // 3. 🎯 本關驗收目標
    printOutput(`\x1b[38;2;63;185;80m🎯 本關驗收目標：\x1b[0m`);
    scenario.goals.forEach((g, i) => {
      printOutput(`   ${i + 1}. ${g}`);
    });

    printOutput(`\n輸入 \x1b[38;2;88;166;255mhelp\x1b[0m 查看指令表，輸入 \x1b[38;2;88;166;255mhint\x1b[0m 獲取解題提示。`);
    printOutput(`👉 右側面板「📖 指令深度教室」提供完整語法解析與一鍵填入功能！\n`);

    terminalInput.focus();
  }

  // Render Pedagogical Command Guide for the Active Scenario
  function renderCommandGuide(scenario) {
    if (!guideContainer) return;
    const guide = (typeof COMMAND_GUIDES !== 'undefined' && COMMAND_GUIDES[scenario.id]) ? COMMAND_GUIDES[scenario.id] : null;

    if (!guide) {
      guideContainer.innerHTML = `
        <div class="guide-header">
          <div class="guide-title-row">
            <span class="guide-tag">關卡 ${scenario.id}</span>
            <h2 class="guide-heading">${escapeHtml(scenario.title)}</h2>
          </div>
          <p class="guide-summary">${escapeHtml(scenario.story)}</p>
        </div>
      `;
      return;
    }

    // 1. Situation block
    const situationHtml = guide.scenarioContext ? `
      <div class="guide-situation-card">
        <div class="situation-header">
          <span class="situation-badge">💼 職場情境現場</span>
          <span class="situation-role">👤 扮演角色：${escapeHtml(guide.scenarioContext.role)}</span>
        </div>
        <p class="situation-desc">${escapeHtml(guide.scenarioContext.situation)}</p>
      </div>
    ` : '';

    // 2. Config Categories block (Level 00 specific)
    let configCategoriesHtml = '';
    if (guide.configCategories) {
      const reqItems = guide.configCategories.required.map(item => {
        const fullCmd = `git config ${item.key.includes(' ') ? item.key : `${item.key} "${item.key === 'user.name' ? '你的名字' : 'you@example.com'}"`}`;
        return `
          <div class="config-item-row required-item">
            <div class="config-item-info">
              <div class="config-item-header">
                <code class="config-item-key">${escapeHtml(item.key)}</code>
                <span class="config-item-label">${escapeHtml(item.label)}</span>
              </div>
              <p class="config-item-desc">${escapeHtml(item.desc)}</p>
            </div>
            <button class="btn-paste-cmd" onclick="insertCommandToTerminal('${escapeJsString(fullCmd)}')" title="點擊填入此設定">
              填入 ➜
            </button>
          </div>
        `;
      }).join('');

      const optItems = guide.configCategories.optional.map(item => {
        const fullCmd = `git config ${item.key}`;
        return `
          <div class="config-item-row optional-item">
            <div class="config-item-info">
              <div class="config-item-header">
                <code class="config-item-key">${escapeHtml(item.key)}</code>
                <span class="config-item-label">${escapeHtml(item.label)}</span>
              </div>
              <p class="config-item-desc">${escapeHtml(item.desc)}</p>
            </div>
            <button class="btn-paste-cmd" onclick="insertCommandToTerminal('${escapeJsString(fullCmd)}')" title="點擊填入此設定">
              填入 ➜
            </button>
          </div>
        `;
      }).join('');

      configCategoriesHtml = `
        <div class="guide-section">
          <h3 class="guide-section-title">⚙️ Git 必備設定 vs 推薦可選設定解析</h3>
          <p class="guide-section-desc">Git 不是只有死記三條指令！清楚分辨「底線必備（缺一不可）」與「提效推薦（大幅省時）」：</p>
          <div class="config-split-grid">
            <div class="config-split-col required-col">
              <div class="config-col-header">
                <span class="badge-col-type badge-required">🔴 必備底線設定 (Required)</span>
                <span class="config-col-subtitle">缺少則 Git 拒絕提交 Commit，本關設定完成即可通關</span>
              </div>
              <div class="config-col-body">
                ${reqItems}
              </div>
            </div>
            <div class="config-split-col optional-col">
              <div class="config-col-header">
                <span class="badge-col-type badge-optional">🟢 推薦/可選進階設定 (Optional & Best Practices)</span>
                <span class="config-col-subtitle">非強制，但大幅消除重複輸入與跨平台地雷（設定享彩蛋成就）</span>
              </div>
              <div class="config-col-body">
                ${optItems}
              </div>
            </div>
          </div>
        </div>
      `;
    }

    // 3. Guided Steps block
    let guidedStepsHtml = '';
    if (guide.guidedSteps && guide.guidedSteps.length > 0) {
      const stepsCards = guide.guidedSteps.map(s => {
        const categoryBadge = s.category === 'required'
          ? `<span class="badge-step-cat badge-cat-req">必備</span>`
          : (s.category === 'optional' ? `<span class="badge-step-cat badge-cat-opt">推薦可選</span>` : '');

        return `
          <div class="guided-step-item">
            <div class="guided-step-header">
              <div class="guided-step-meta">
                <span class="step-num-badge">步驟 ${s.step}</span>
                ${categoryBadge}
              </div>
              <code class="guided-step-cmd">${escapeHtml(s.cmd)}</code>
              <button class="btn-paste-cmd" onclick="insertCommandToTerminal('${escapeJsString(s.cmd)}')" title="填入終端機">
                填入 ➜
              </button>
            </div>
            <div class="guided-step-why">
              <span class="why-label">💡 為什麼要下此指令：</span>
              <span class="why-text">${escapeHtml(s.why)}</span>
            </div>
          </div>
        `;
      }).join('');

      guidedStepsHtml = `
        <div class="guide-section">
          <h3 class="guide-section-title">🧭 實戰情境與引導式解題步驟</h3>
          <p class="guide-section-desc">帶著情境問題循序思考，每一步皆有清晰的底層原因與目的：</p>
          <div class="guided-steps-list">
            ${stepsCards}
          </div>
        </div>
      `;
    }

    // 4. Variations
    const variantsHtml = (guide.variations || []).map(v => `
      <div class="guide-variant-card ${v.isPopular ? 'popular' : ''}">
        <div class="variant-header">
          <code class="variant-cmd">${escapeHtml(v.cmd)}</code>
          <div class="variant-badges">
            <span class="badge-variant-name">${escapeHtml(v.name)}</span>
            ${v.isPopular ? `<span class="badge-popular">★ 業界最常用</span>` : ''}
          </div>
          <button class="btn-paste-cmd" onclick="insertCommandToTerminal('${escapeJsString(v.cmd)}')" title="點擊直接填入終端機">
            填入 ➜
          </button>
        </div>
        <p class="variant-desc">${escapeHtml(v.desc)}</p>
        ${v.popularReason ? `<div class="variant-popular-note">💡 ${escapeHtml(v.popularReason)}</div>` : ''}
      </div>
    `).join('');

    const pitfallsHtml = (guide.pitfalls || []).map(p => `<li>${escapeHtml(p)}</li>`).join('');

    guideContainer.innerHTML = `
      <div class="guide-header">
        <div class="guide-title-row">
          <span class="guide-tag">關卡 ${scenario.id} 深度解析</span>
          <h2 class="guide-heading">${escapeHtml(scenario.title)}</h2>
        </div>
        <p class="guide-summary">${escapeHtml(guide.summary)}</p>
      </div>

      ${situationHtml}

      <div class="guide-target-card">
        <div class="target-card-label">🎯 本關核心操作指令</div>
        <div class="target-card-body">
          <code class="target-card-cmd">${escapeHtml(guide.targetCommand)}</code>
          <button class="btn-paste-cmd btn-paste-primary" onclick="insertCommandToTerminal('${escapeJsString(guide.targetCommand)}')" title="填入終端機">
            填入終端機 ➜
          </button>
        </div>
      </div>

      ${configCategoriesHtml}

      ${guidedStepsHtml}

      ${variantsHtml ? `
      <div class="guide-section">
        <h3 class="guide-section-title">⚡ 指令語法變體與不同打法對照</h3>
        <p class="guide-section-desc">這項操作在 Git 中有多種打法，以下為完整選項比較與使用情境：</p>
        <div class="guide-variants-list">
          ${variantsHtml}
        </div>
      </div>
      ` : ''}

      ${guide.whyPopularTitle ? `
      <div class="guide-section">
        <h3 class="guide-section-title">🤔 ${escapeHtml(guide.whyPopularTitle)}</h3>
        <div class="guide-rationale-box">
          <p>${escapeHtml(guide.whyPopularContent)}</p>
        </div>
      </div>
      ` : ''}

      ${pitfallsHtml ? `
      <div class="guide-section">
        <h3 class="guide-section-title">🛡️ 避坑指南與實戰防線</h3>
        <div class="guide-pitfalls-box">
          <ul class="pitfalls-list">
            ${pitfallsHtml}
          </ul>
        </div>
      </div>
      ` : ''}
    `;
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

  function escapeJsString(str) {
    if (!str) return '';
    return str.replace(/\\/g, '\\\\').replace(/'/g, "\\'").replace(/"/g, '\\"');
  }

  window.insertCommandToTerminal = (rawCmd) => {
    let clean = rawCmd.split(' (')[0].trim();
    terminalInput.value = clean;
    terminalInput.focus();
    terminalInput.setSelectionRange(clean.length, clean.length);
    scrollToBottom();
  };

  // Update prompt with active branch
  function updatePrompt() {
    const branch = git.getCurrentBranch() || `detached@${(git.getHeadCommitId() || 'none').substring(0, 4)}`;
    promptBranchSpan.textContent = `(${branch})`;
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

    let first = true;
    for (const file of allFiles) {
      const item = document.createElement('div');
      item.className = 'file-tree-item';
      const isConflict = git.conflictState && git.conflictState.file === file;
      item.innerHTML = `
        <span class="file-icon">${isConflict ? '⚡' : '📄'}</span>
        <span class="file-name">${file}</span>
        ${isConflict ? '<span class="tag-conflict">衝突中</span>' : ''}
      `;
      item.onclick = () => selectFile(file);
      filesList.appendChild(item);

      if (first) {
        selectFile(file);
        first = false;
      }
    }
  }

  function selectFile(filename) {
    if (!fileViewerName || !fileViewerContent) return;
    fileViewerName.textContent = filename;
    const content = git.workingTree.get(filename) || git.index.get(filename) || '';
    fileViewerContent.textContent = content;

    const conflictActions = document.getElementById('conflict-actions');
    if (conflictActions) {
      const isConflict = git.conflictState && git.conflictState.file === filename;
      conflictActions.style.display = isConflict ? 'flex' : 'none';
    }
  }

  // Command Execution Dispatcher
  function executeCommand(rawCmd) {
    const cmd = rawCmd.trim();
    if (!cmd) return;

    // Record history
    commandHistory.push(cmd);
    historyIndex = commandHistory.length;

    // Echo input command with prompt
    const promptText = `user@git-lab:~/workspace ${promptBranchSpan.textContent} $ ${cmd}`;
    printOutput(`\x1b[38;2;139;148;158m${promptText}\x1b[0m`);

    // Parse tokens respecting quotes
    const tokens = parseCommandTokens(cmd);
    const mainCmd = tokens[0];
    const args = tokens.slice(1);

    if (mainCmd === 'next' || mainCmd === 'n') {
      window.nextScenario();
      return;
    }

    if (mainCmd === 'guide') {
      window.switchTab('guide');
      printOutput(`\x1b[38;2;88;166;255m[已切換至「📖 指令深度教室」頁籤]\x1b[0m`);
      return;
    }

    if (mainCmd === 'clear') {
      terminalOutput.innerHTML = '';
      return;
    }

    if (mainCmd === 'help') {
      printHelp();
      return;
    }

    if (mainCmd === 'hint') {
      const sc = SCENARIOS[currentScenarioIndex];
      printOutput(`\x1b[38;2;210;153;34m💡 [通關提示]：\x1b[0m\n${sc.hints.join('\n')}\n`);
      return;
    }

    if (mainCmd === 'goal' || mainCmd === 'mission') {
      showMissionModal(SCENARIOS[currentScenarioIndex]);
      return;
    }

    if (mainCmd === 'levels' || mainCmd === 'list') {
      toggleLevelDropdown();
      return;
    }

    if (mainCmd === 'reset') {
      loadScenario(currentScenarioIndex);
      printOutput(`\x1b[38;2;248;81;73m✔ 當前關卡已重設至初始狀態。\x1b[0m`);
      return;
    }

    if (mainCmd === 'verify') {
      checkScenarioSuccess(true);
      return;
    }

    if (mainCmd === 'tree') {
      printOutput(git.logCmd(['--oneline', '--graph']).output);
      return;
    }

    if (mainCmd === 'git') {
      handleGitCommand(args);
    } else {
      printOutput(`command not found: ${mainCmd}. 輸入 \x1b[38;2;88;166;255mhelp\x1b[0m 查看支援的 Git 指令。`);
    }

    // Refresh UI & Check Goal
    updatePrompt();
    refreshGraph();
    renderFileList();
    checkScenarioSuccess(false);
    scrollToBottom();
  }

  function handleGitCommand(args) {
    if (args.length === 0) {
      printOutput('usage: git [--version] [--help] <command> [<args>]');
      return;
    }

    const sub = args[0];
    const subArgs = args.slice(1);

    switch (sub) {
      case 'status':
        const st = git.status();
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
        const resAdd = git.add(subArgs);
        if (resAdd.output) printOutput(resAdd.output);
        break;

      case 'commit':
        const resCommit = git.commit(subArgs);
        printOutput(resCommit.output);
        break;

      case 'branch':
        const resBranch = git.branch(subArgs);
        if (resBranch.output) printOutput(resBranch.output);
        break;

      case 'checkout':
      case 'switch':
        let isCreate = subArgs.includes('-c') || subArgs.includes('-b');
        let target = subArgs.find(a => !a.startsWith('-'));
        if (isCreate) {
          const idx = subArgs.findIndex(a => a === '-c' || a === '-b');
          target = subArgs[idx + 1];
        }
        if (!target) {
          printOutput(`fatal: missing branch name`);
          return;
        }
        const resSwitch = git.checkoutOrSwitch(target, isCreate);
        if (resSwitch.output) printOutput(resSwitch.output);
        break;

      case 'merge':
        const targetMerge = subArgs.find(a => !a.startsWith('-'));
        const noFf = subArgs.includes('--no-ff');
        if (!targetMerge) {
          printOutput('fatal: No branch specified to merge.');
          return;
        }
        const resMerge = git.merge(targetMerge, { noFf });
        if (resMerge.output) printOutput(resMerge.output);
        break;

      case 'rebase':
        if (subArgs.includes('-i') || subArgs.includes('--interactive')) {
          printOutput(`[模擬互動式變基 (rebase -i)]\n已自動壓縮 (squash/fixup) 零碎提交，產生清晰單一語意 Commit！`);
        }
        const targetRebase = subArgs.find(a => !a.startsWith('-')) || 'main';
        const resRebase = git.rebase(targetRebase);
        if (resRebase.output) printOutput(resRebase.output);
        break;

      case 'cherry-pick':
        const hash = subArgs[0];
        if (!hash) {
          printOutput('fatal: Commit hash required for cherry-pick.');
          return;
        }
        const resCherry = git.cherryPick(hash);
        if (resCherry.output) printOutput(resCherry.output);
        break;

      case 'reset':
        let mode = '--mixed';
        if (subArgs.includes('--hard')) mode = '--hard';
        if (subArgs.includes('--soft')) mode = '--soft';
        const targetReset = subArgs.find(a => !a.startsWith('-')) || 'HEAD';
        const resReset = git.reset(targetReset, mode);
        if (resReset.output) printOutput(resReset.output);
        break;

      case 'revert':
        const targetRevert = subArgs.find(a => !a.startsWith('-')) || 'HEAD';
        const mainline = subArgs.includes('-m') ? subArgs[subArgs.indexOf('-m') + 1] : null;
        const resRevert = git.revert(targetRevert, { mainline });
        if (resRevert.output) printOutput(resRevert.output);
        break;

      case 'tag':
        const resTag = git.tag(subArgs);
        if (resTag.output) printOutput(resTag.output);
        break;

      case 'reflog':
        printOutput(git.reflogCmd().output);
        break;

      case 'log':
        printOutput(git.logCmd(subArgs).output);
        break;

      case 'blame':
        printOutput(git.blameCmd(subArgs).output);
        break;

      case 'worktree':
        printOutput(git.worktree(subArgs).output);
        break;

      case 'bisect':
        printOutput(git.bisect(subArgs).output);
        break;

      case 'rm':
        printOutput(git.rm(subArgs).output);
        break;

      case 'stash':
        printOutput(git.stashCmd(subArgs).output);
        break;

      case 'clean':
        printOutput(git.cleanCmd(subArgs).output);
        break;

      case 'mv':
        printOutput(git.mvCmd(subArgs).output);
        break;

      case 'remote':
        printOutput(git.remoteCmd(subArgs).output);
        break;

      case 'fetch':
        printOutput(git.fetchCmd(subArgs).output);
        break;

      case 'cat-file':
        printOutput(git.catFileCmd(subArgs).output);
        break;

      case 'config':
        printOutput(git.configCmd(subArgs).output);
        break;

      case 'diff':
        printOutput('(工作目錄比對完成)');
        break;

      case 'pull':
        if (subArgs.includes('--rebase')) {
          printOutput(`Successfully rebased against origin/main.\nFast-forwarded to origin/main.`);
          git.branches.set(git.getCurrentBranch(), git.remotes.origin.branches.get('main'));
        } else {
          printOutput(`Merge made by the 'ort' strategy.`);
        }
        break;

      case 'push':
        const curBranch = git.getCurrentBranch();
        if (curBranch) {
          git.remotes.origin.branches.set(curBranch, git.branches.get(curBranch));
          printOutput(`To https://github.com/Hsing24/learn-git.git\n * [new branch]      ${curBranch} -> ${curBranch}`);
        }
        break;

      default:
        printOutput(`git: '${sub}' is not a supported git command.`);
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
    const sc = SCENARIOS[currentScenarioIndex];
    const result = sc.checkGoal(git);

    if (result.passed) {
      const isFirstTimePass = !isCurrentScenarioPassed;
      if (!completedScenarios.has(sc.id)) {
        completedScenarios.add(sc.id);
        localStorage.setItem('git_lab_completed_scenarios', JSON.stringify(Array.from(completedScenarios)));
      }
      isCurrentScenarioPassed = true;

      if (isFirstTimePass || isManualVerify) {
        const nextIndex = currentScenarioIndex + 1;
        const hasNext = nextIndex < SCENARIOS.length;
        const nextId = hasNext ? SCENARIOS[nextIndex].id : '大師結業';

        // Render authentic TUI box banner directly in terminal stream (no popup modal!)
        const msgLines = (result.message || '').split('\n');
        printOutput(`\n\x1b[38;2;63;185;80m╭──────────────────────────────────────────────────────────────────────────╮\x1b[0m`);
        printOutput(`\x1b[38;2;63;185;80m│  ✔ [LEVEL ${sc.id} PASSED] ${sc.title}\x1b[0m`);
        msgLines.forEach(line => {
          printOutput(`\x1b[38;2;63;185;80m│  ${line}\x1b[0m`);
        });
        printOutput(`\x1b[38;2;63;185;80m╰──────────────────────────────────────────────────────────────────────────╯\x1b[0m`);
        if (hasNext) {
          printOutput(`\x1b[38;2;227;179;65m👉 下一步：輸入 \x1b[1mnext\x1b[0m\x1b[38;2;227;179;65m 或按下快捷鍵 [Ctrl + N]，亦可點擊下方按鈕前往下一關！\x1b[0m`);
        } else {
          printOutput(`\x1b[38;2;255;215;0m🏆 狂賀！你已通關全部 24 大關卡！\x1b[0m`);
        }

        // Show terminal action strip
        if (terminalNextBar) {
          terminalNextBar.style.display = 'flex';
          if (nextBarMsg) {
            nextBarMsg.textContent = hasNext ? `✔ 關卡 ${sc.id} 通關！可前往下一關 (Level ${nextId})` : `🏆 全部 24 關通關完成！`;
          }
        }

        // Also add an interactive button in the terminal output stream
        if (hasNext) {
          const actionDiv = document.createElement('div');
          actionDiv.className = 'terminal-line terminal-victory-action';
          actionDiv.innerHTML = `<button class="btn-terminal-next" onclick="nextScenario()">前往下一關 ➜ (${nextId}) <kbd>Ctrl+N</kbd></button>`;
          terminalOutput.appendChild(actionDiv);
        }

        spawnConfetti();
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
    return str
      .replace(/\x1b\[38;2;(\d+);(\d+);(\d+)m/g, '<span style="color: rgb($1,$2,$3)">')
      .replace(/\x1b\[0m/g, '</span>')
      .replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/&lt;span style="color: rgb\((\d+),(\d+),(\d+)\)"&gt;/g, '<span style="color: rgb($1,$2,$3)">')
      .replace(/&lt;\/span&gt;/g, '</span>');
  }

  function scrollToBottom() {
    terminalOutput.scrollTop = terminalOutput.scrollHeight;
  }

  function printHelp() {
    printOutput(`\x1b[38;2;88;166;255mGit Scenario Lab — 支援指令表：\x1b[0m
  git status                  查看分支與工作區狀態
  git add <file> | . | -p     加入暫存區 (支援 -p 局部暫存)
  git commit [--amend] -m     建立或修補 Commit
  git switch [-c <branch>]    切換或建立分支
  git merge <branch> [--no-ff] 合併分支 (支援衝突模擬)
  git rebase <branch>         變基保持線性歷史
  git stash [list|pop|-u]     暫存工作區修改
  git clean -fd               清除未追蹤檔案
  git mv <old> <new>          版本控管更名
  git cherry-pick <hash>      單獨偷渡特定 Commit
  git reset [--hard|--soft]   移動 HEAD 指針
  git revert [-m 1] <hash>    安全反轉產生回滾提交
  git tag [-a <v> -m "msg"]   建立輕量或附註標籤
  git worktree add <dir> <b>  雙軌平行工作區
  git bisect [start|bad|good] 二分搜尋捉蟲
  git rm --cached <file>      自 Git 索引除名保全本地檔案
  git remote / git fetch      遠端節點管理與抓取
  git cat-file [-t|-p]        解密水管底層物件
  git reflog / git log / blame 查看歷史黑盒子日記

平台輔助指令：
  next (n)   前往下一關 (快捷鍵: Ctrl+N)
  guide      切換至指令深度教室
  hint       查看當前關卡提示
  goal       開啟關卡任務簡報
  verify     驗收目標完成狀態
  reset      重設當前關卡
  levels     展開 24 關地圖抽屜
  clear      清空終端機畫面
`);
  }

  // Keyboard navigation & history
  terminalInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      const val = terminalInput.value;
      terminalInput.value = '';
      executeCommand(val);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (historyIndex > 0) {
        historyIndex--;
        terminalInput.value = commandHistory[historyIndex] || '';
      }
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (historyIndex < commandHistory.length - 1) {
        historyIndex++;
        terminalInput.value = commandHistory[historyIndex] || '';
      } else {
        historyIndex = commandHistory.length;
        terminalInput.value = '';
      }
    } else if (e.key === 'Tab') {
      e.preventDefault();
      // Simple autocomplete
      const val = terminalInput.value;
      const suggestions = ['git status', 'git add .', 'git add -p', 'git commit -m "', 'git switch ', 'git switch -c ', 'git merge ', 'git rebase ', 'git cherry-pick ', 'git reset --hard ', 'git revert -m 1 ', 'git tag -a ', 'git worktree add ', 'git bisect start', 'git rm --cached ', 'next', 'guide', 'verify', 'hint', 'help', 'reset'];
      const match = suggestions.find(s => s.startsWith(val));
      if (match) terminalInput.value = match;
    }
  });

  // Global Shortcut listener (Ctrl+N / Cmd+N for Next Level)
  window.addEventListener('keydown', (e) => {
    if ((e.ctrlKey || e.metaKey) && (e.key === 'n' || e.key === 'N')) {
      e.preventDefault();
      window.nextScenario();
    }
  });

  // Modal Handling
  function showMissionModal(scenario) {
    if (!missionModal) return;
    document.getElementById('modal-title').textContent = `${scenario.id}：${scenario.title}`;
    document.getElementById('modal-diff').textContent = scenario.difficulty;
    document.getElementById('modal-story').textContent = scenario.story;
    const goalsList = document.getElementById('modal-goals');
    goalsList.innerHTML = scenario.goals.map(g => `<li>${g}</li>`).join('');
    missionModal.style.display = 'flex';
  }

  function showVictoryModal(scenario, message) {
    if (!victoryModal) return;
    document.getElementById('victory-title').textContent = `🎉 關卡 ${scenario.id} 順利通關！`;
    document.getElementById('victory-msg').textContent = message;
    victoryModal.style.display = 'flex';
    spawnConfetti();
  }

  window.closeMissionModal = () => {
    if (missionModal) missionModal.style.display = 'none';
    terminalInput.focus();
  };

  window.closeVictoryModal = () => {
    if (victoryModal) victoryModal.style.display = 'none';
    terminalInput.focus();
  };

  window.nextScenario = () => {
    closeVictoryModal();
    if (currentScenarioIndex < SCENARIOS.length - 1) {
      loadScenario(currentScenarioIndex + 1);
    } else {
      printOutput(`\n\x1b[38;2;255;215;0m╔══════════════════════════════════════════════════════════════════════════╗\x1b[0m`);
      printOutput(`\x1b[38;2;255;215;0m║  🏆 狂賀！你已經完整通關了全部 24 大 Git 實戰宇宙！你已成為真正的 Git 大師！ ║\x1b[0m`);
      printOutput(`\x1b[38;2;255;215;0m╚══════════════════════════════════════════════════════════════════════════╝\x1b[0m`);
      printOutput(`\x1b[38;2;63;185;80m感謝你的學習與探索！歡迎將本專案分享給更多想學好 Git 的開發者：https://github.com/Hsing24/learn-git\x1b[0m\n`);
      scrollToBottom();
    }
  };

  window.executeLabCommand = (cmd) => executeCommand(cmd);
  window.openMissionModal = () => showMissionModal(SCENARIOS[currentScenarioIndex]);
  window.openCheatsheet = () => {
    const m = document.getElementById('cheatsheet-modal');
    if (m) m.style.display = 'flex';
  };
  window.closeCheatsheet = () => {
    const m = document.getElementById('cheatsheet-modal');
    if (m) m.style.display = 'none';
    terminalInput.focus();
  };

  // Level Drawer Generator
  function renderLevelDropdown() {
    if (!levelDropdown) return;
    levelDropdown.innerHTML = '';
    SCENARIOS.forEach((sc, idx) => {
      const isDone = completedScenarios.has(sc.id);
      const isCurrent = idx === currentScenarioIndex;
      const item = document.createElement('div');
      item.className = `level-item ${isCurrent ? 'active' : ''} ${isDone ? 'completed' : ''}`;
      item.innerHTML = `
        <span class="level-id">${sc.id}</span>
        <span class="level-info">
          <span class="item-title">${sc.title}</span>
          <span class="item-diff">${sc.difficulty}</span>
        </span>
        <span class="item-status">${isDone ? '✔' : ''}</span>
      `;
      item.onclick = () => {
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

  // Tab Switching
  window.switchTab = (tabId) => {
    document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
    document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
    const btn = document.getElementById(`tab-btn-${tabId}`);
    const content = document.getElementById(`tab-pane-${tabId}`);
    if (btn) btn.classList.add('active');
    if (content) content.classList.add('active');
  };

  // Conflict Resolution Action in UI
  window.resolveConflictInUI = () => {
    if (!git.conflictState) return;
    const file = git.conflictState.file;
    const cleanContent = `// [手動解決衝突] 合併了兩端的最佳實作\nexport const theme = 'unified-dark-mode';\n`;
    git.workingTree.set(file, cleanContent);
    git.index.set(file, cleanContent);
    printOutput(`\x1b[38;2;46;160;67m✔ 已在編輯器中解決 ${file} 衝突並加入暫存區！請執行 git commit 完成合併。\x1b[0m`);
    renderFileList();
    selectFile(file);
    terminalInput.focus();
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

  // Start with Level 00
  loadScenario(0);
});
