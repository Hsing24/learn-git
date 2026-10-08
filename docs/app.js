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

  // Load Scenario by ID
  function loadScenario(index) {
    if (index < 0 || index >= SCENARIOS.length) index = 0;
    currentScenarioIndex = index;
    const scenario = SCENARIOS[index];

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

    // Update Mission Tab Content
    const tabMissionTitle = document.getElementById('tab-mission-title');
    if (tabMissionTitle) tabMissionTitle.textContent = `${scenario.id}：${scenario.title}`;
    const tabMissionStory = document.getElementById('tab-mission-story');
    if (tabMissionStory) tabMissionStory.textContent = scenario.story;
    const tabMissionGoals = document.getElementById('tab-mission-goals');
    if (tabMissionGoals) tabMissionGoals.innerHTML = scenario.goals.map(g => `<li>${g}</li>`).join('');

    // Print welcome banner in terminal
    terminalOutput.innerHTML = '';
    printOutput(`\x1b[38;2;88;166;255m╔══════════════════════════════════════════════════════════════════╗\x1b[0m`);
    printOutput(`\x1b[38;2;88;166;255m║  🚀 關卡 ${scenario.id}：${scenario.title}\x1b[0m`);
    printOutput(`\x1b[38;2;88;166;255m╚══════════════════════════════════════════════════════════════════╝\x1b[0m`);
    printOutput(`\x1b[38;2;210;153;34m💼 職場情境：${scenario.story}\x1b[0m\n`);
    printOutput(`\x1b[38;2;46;160;67m🎯 本關目標：\x1b[0m`);
    scenario.goals.forEach((g, i) => {
      printOutput(`   ${i + 1}. ${g}`);
    });
    printOutput(`\n輸入 \x1b[38;2;88;166;255mhelp\x1b[0m 查看指令幫助，輸入 \x1b[38;2;88;166;255mhint\x1b[0m 獲取解題提示。\n`);

    showMissionModal(scenario);
    terminalInput.focus();
  }

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
    const promptText = `student@git-lab:~/workspace ${promptBranchSpan.textContent} $ ${cmd}`;
    printOutput(`\x1b[38;2;139;148;158m${promptText}\x1b[0m`);

    // Parse tokens respecting quotes
    const tokens = parseCommandTokens(cmd);
    const mainCmd = tokens[0];
    const args = tokens.slice(1);

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
      if (!completedScenarios.has(sc.id)) {
        completedScenarios.add(sc.id);
        localStorage.setItem('git_lab_completed_scenarios', JSON.stringify(Array.from(completedScenarios)));
      }
      showVictoryModal(sc, result.message);
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
  git commit -m "msg"         建立 Commit
  git switch [-c <branch>]    切換或建立分支
  git merge <branch> [--no-ff] 合併分支 (支援衝突模擬)
  git rebase <branch>         變基保持線性歷史
  git cherry-pick <hash>      單獨偷渡特定 Commit
  git reset [--hard|--soft]   移動 HEAD 指針
  git revert [-m 1] <hash>    安全反轉產生回滾提交
  git tag [-a <v> -m "msg"]   建立輕量或附註標籤
  git worktree add <dir> <b>  雙軌平行工作區
  git bisect [start|bad|good] 二分搜尋捉蟲
  git rm --cached <file>      自 Git 索引除名保全本地檔案
  git reflog / git log        查看歷史黑盒子日記

平台輔助指令：
  hint       查看當前關卡提示
  goal       重新打開任務簡報
  verify     驗收目標完成狀態
  reset      重設當前關卡
  levels     展開 18 關地圖抽屜
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
      const suggestions = ['git status', 'git add .', 'git add -p', 'git commit -m "', 'git switch ', 'git switch -c ', 'git merge ', 'git rebase ', 'git cherry-pick ', 'git reset --hard ', 'git revert -m 1 ', 'git tag -a ', 'git worktree add ', 'git bisect start', 'git rm --cached ', 'verify', 'hint', 'help', 'reset'];
      const match = suggestions.find(s => s.startsWith(val));
      if (match) terminalInput.value = match;
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
      printOutput(`\x1b[38;2;255;215;0m🏆 狂賀！你已經完整通關了全部 18 大 Git 實戰宇宙！你已成為團隊不可或缺的 Git 大師！\x1b[0m`);
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
