/**
 * SCENARIOS_DATA - 18 大真實專案現場關卡定義
 * 結合真實工作情境、任務目標、初始化狀態與自動驗證邏輯
 */

const SCENARIOS = [
  {
    id: '00',
    title: '起點裝備：Git 身分、SSH 憑證與 Auto-Push',
    difficulty: '新手必備 🔰',
    category: '基礎裝備',
    story: '第一次加入團隊開發或剛重灌電腦？如果沒有配置身分，第一次 commit 就會報錯；若是每次 push 都要輸入帳號密碼、每次開新分支都要手動打 --set-upstream，會讓人抓狂！本關帶你釐清哪些是「必備設定」，哪些是「職場推薦可選設定」。',
    goals: [
      '[必備] 配置使用者身分：git config user.name "你的名字" (或加上 --global)',
      '[必備] 配置使用者信箱：git config user.email "you@example.com" (或加上 --global)',
      '[推薦可選] 開啟自動遠端追蹤：git config push.autoSetupRemote true'
    ],
    hints: [
      '【必備 1】設定名稱：git config user.name "Alex Chen"',
      '【必備 2】設定信箱：git config user.email "alex@company.com"',
      '【推薦可選】自動遠端追蹤：git config push.autoSetupRemote true'
    ],
    setup: (git) => {
      git.config['user.name'] = '';
      git.config['user.email'] = '';
      git.config['push.autoSetupRemote'] = 'false';
    },
    checkGoal: (git) => {
      const name = git.config['user.name'];
      const email = git.config['user.email'];
      const hasName = Boolean(name && name.trim() !== '' && name !== 'User');
      const hasEmail = Boolean(email && email.includes('@'));
      const hasAutoPush = git.config['push.autoSetupRemote'] === 'true';

      if (!hasName) return { passed: false, message: '【必要設定未完成】尚未配置 user.name！請執行：git config user.name "你的名字"' };
      if (!hasEmail) return { passed: false, message: '【必要設定未完成】尚未配置 user.email！請執行：git config user.email "you@example.com"' };

      const bonusMsg = hasAutoPush
        ? '\n⭐ [解鎖進階神器成就] 你同時開啟了 push.autoSetupRemote，未來任何新分支只需敲 git push 即可自動同步遠端！'
        : '\n💡 [推薦可選小撇步] 你還可以額外輸入 git config push.autoSetupRemote true，體驗免敲 --set-upstream 的極速推送！';

      return {
        passed: true,
        message: `🎉 恭喜完成起點必備身分設定！\n已就緒的作者資訊：\n  • user.name: ${name}\n  • user.email: ${email}${bonusMsg}`
      };
    }
  },

  {
    id: '01',
    title: '工作區、暫存區與第一個 Commit',
    difficulty: '入門 ⭐',
    category: '基礎裝備',
    story: '專案剛啟動！你新增了 index.html 與 style.css，現在必須理解 Working Tree（工作目錄）、Staging Area（暫存區）與 Repository（版本庫）三層架構，建立第一個版本節點。',
    goals: [
      '使用 git status 查看當前未追蹤檔案',
      '使用 git add . 將所有檔案加入暫存區',
      '使用 git commit -m "feat: initial commit" 建立第一個 Commit'
    ],
    hints: [
      '先使用 git add . 暫存所有修改',
      '接著執行 git commit -m "feat: initial commit"'
    ],
    setup: (git) => {
      git.workingTree.set('index.html', '<!DOCTYPE html><html><body><h1>Hello Git</h1></body></html>');
      git.workingTree.set('style.css', 'body { margin: 0; background: #000; }');
    },
    checkGoal: (git) => {
      const commits = Array.from(git.commits.values());
      if (commits.length === 0) return { passed: false, message: '尚未建立任何 Commit！請執行 git add . 與 git commit -m "..."' };
      return {
        passed: true,
        message: '🎉 恭喜完成第一個 Commit！你已經掌握了 Git 的核心三層流動：修改 ➜ 暫存 ➜ 提交！'
      };
    }
  },

  {
    id: '02',
    title: '分支流動與 Fast-Forward 合併',
    difficulty: '初階 ⭐⭐',
    category: '分支合併',
    story: '團隊規範：絕不在 main 分支直接開發！請開出 feature/login 分支開發登入功能，完成後將其合併回 main 分支。因為 main 在此期間沒有新變更，將會觸發俐落的 Fast-Forward（快進）合併。',
    goals: [
      '開出並切換至新分支：git switch -c feature/login',
      '在新分支上提交程式碼：git commit -m "feat: add login page"',
      '切回 main 分支：git switch main',
      '將登入功能合併進 main：git merge feature/login'
    ],
    hints: [
      '使用現代指令：git switch -c feature/login',
      '提交一個 commit：git commit -m "feat: add login"',
      '切回主線：git switch main',
      '快進合併：git merge feature/login'
    ],
    setup: (git) => {
      const c = git.createCommit({ message: 'feat: project scaffold', tree: new Map([['app.js', 'console.log("init");']]) });
      git.branches.set('main', c.id);
      git.HEAD = { type: 'branch', target: 'main' };
      git.workingTree.set('app.js', 'console.log("init");');
      git.index.set('app.js', 'console.log("init");');
    },
    checkGoal: (git) => {
      const mainId = git.branches.get('main');
      const loginId = git.branches.get('feature/login');
      if (!loginId) return { passed: false, message: '尚未建立 feature/login 分支！' };
      if (git.getCurrentBranch() !== 'main') return { passed: false, message: '合併完成後請切回 main 分支！' };
      if (mainId !== loginId) return { passed: false, message: 'main 分支尚未合併 feature/login 分支！請執行 git merge feature/login' };

      return {
        passed: true,
        message: '🎉 漂亮！你完成了標準的獨立分支開發與 Fast-Forward 合併流程，主線指針順暢平移！'
      };
    }
  },

  {
    id: '03',
    title: '迎戰衝突：手動解決 Merge Conflict',
    difficulty: '進階 ⭐⭐⭐',
    category: '分支合併',
    story: '雙分支同時修改了同一個檔案同一行！你正在 main 分支嘗試把 feature/dark-mode 合併進來，終端機噴出 CONFLICT 衝突報錯。請解讀衝突標記，手動保留最佳代碼並完成合併！',
    goals: [
      '嘗試合併：git merge feature/dark-mode（觸發衝突）',
      '解決衝突：編輯 style.css，移除 <<<<<<< 與 >>>>>>> 標記',
      '暫存並提交：git add style.css && git commit -m "merge: resolve dark mode conflict"'
    ],
    hints: [
      '直接執行 git merge feature/dark-mode 觸發衝突',
      '衝突發生後，切換到上方「📁 檔案」頁籤可直接點擊「解決衝突」，或執行 git commit 完成合併'
    ],
    setup: (git) => {
      const c1 = git.createCommit({ message: 'feat: initial theme', tree: new Map([['style.css', 'body { color: #333; }']]) });
      git.branches.set('main', c1.id);

      // Branch feature/dark-mode modifies style.css
      const c2 = git.createCommit({
        message: 'feat: dark theme color',
        parents: [c1.id],
        tree: new Map([['style.css', 'body { color: #ffffff; background: #121212; }']])
      });
      git.branches.set('feature/dark-mode', c2.id);

      // main modifies style.css differently
      const c3 = git.createCommit({
        message: 'feat: high contrast theme',
        parents: [c1.id],
        tree: new Map([['style.css', 'body { color: #000000; background: #ffffff; }']])
      });
      git.branches.set('main', c3.id);
      git.checkoutOrSwitch('main');
    },
    checkGoal: (git) => {
      const head = git.getHeadCommit();
      if (!head || head.parents.length < 2) {
        return { passed: false, message: '尚未完成衝突合併！請先執行 git merge feature/dark-mode 並解決衝突後 commit。' };
      }
      return {
        passed: true,
        message: '🎉 太厲害了！你成功馴服了初學者最害怕的 Merge Conflict！掌握了處理衝突的完整黃金 SOP！'
      };
    }
  },

  {
    id: '04',
    title: '變基藝術：使用 git rebase 保持線性歷史',
    difficulty: '進階 ⭐⭐⭐',
    category: '進階歷史',
    story: '團隊不喜歡主線充斥著交錯混亂的菱形 Merge 節點。當你在 feature 分支開發時，main 分支有了新進度。請使用 git rebase 將你的分支重新嫁接至 main 的最新頂端，保持歷史一條線！',
    goals: [
      '確認當前在 feature 分支上',
      '執行變基：git rebase main',
      '切回 main 並快進合併：git switch main && git merge feature'
    ],
    hints: [
      '在 feature 分支上執行 git rebase main',
      '變基完成後，切回 main 執行 git merge feature'
    ],
    setup: (git) => {
      const c1 = git.createCommit({ message: 'feat: base project' });
      git.branches.set('main', c1.id);

      const c2 = git.createCommit({ message: 'feat: main update 1', parents: [c1.id] });
      git.branches.set('main', c2.id);

      const c3 = git.createCommit({ message: 'feat: feature step 1', parents: [c1.id] });
      git.branches.set('feature', c3.id);
      git.checkoutOrSwitch('feature');
    },
    checkGoal: (git) => {
      const mainId = git.branches.get('main');
      const featureId = git.branches.get('feature');
      const fCommit = git.commits.get(featureId);

      if (fCommit && fCommit.parents.includes(mainId)) {
        return {
          passed: true,
          message: '🎉 變基成功！你的提交已優雅嫁接至 main 的最新節點之後，整個 Git 樹呈現乾淨筆直的線性歷史！'
        };
      }
      return { passed: false, message: 'feature 分支尚未 rebase 到 main 之上！請執行 git rebase main。' };
    }
  },

  {
    id: '05',
    title: '歷史整形：Interactive Rebase 整理零碎 Commit',
    difficulty: '進階 ⭐⭐⭐',
    category: '進階歷史',
    story: '在送出 Pull Request 前，你本機有 3 個零碎的提交（"wip", "fix typo", "done"）。如果不整理就推上遠端會被主管退件！請使用 git commit --fixup 或互動式變基將它們融合為一個乾淨語意的 Commit。',
    goals: [
      '將最近的零碎提交整理為精簡的提交歷史',
      '保持最終 HEAD 只有 1 個完整功能的 commit'
    ],
    hints: [
      '你可以使用 git reset --soft HEAD~2 重新包裝成一個完整提交',
      '或者使用 git commit --amend 修補最新提交'
    ],
    setup: (git) => {
      const c1 = git.createCommit({ message: 'feat: scaffold' });
      const c2 = git.createCommit({ message: 'wip: payment form', parents: [c1.id] });
      const c3 = git.createCommit({ message: 'fix: typo in card input', parents: [c2.id] });
      git.branches.set('main', c3.id);
      git.checkoutOrSwitch('main');
    },
    checkGoal: (git) => {
      const commits = Array.from(git.commits.values());
      const head = git.getHeadCommit();
      if (head && (head.message.toLowerCase().includes('wip') || head.message.includes('typo'))) {
        return { passed: false, message: '最新提交訊息依然是零碎的 "wip" 或 "typo"！請整理提交訊息。' };
      }
      return {
        passed: true,
        message: '🎉 歷史整形完成！PR 提交紀錄變得無比乾淨專業，Code Reviewer 一目了然！'
      };
    }
  },

  {
    id: '06',
    title: '模擬協作：遠端衝突與 Non-Fast-Forward 推送被拒',
    difficulty: '實戰 ⭐⭐⭐⭐',
    category: '協作救援',
    story: '當你滿懷信心敲下 git push 時，終端機竟然爆出 [rejected - non-fast-forward]！原來是同事搶先一步把新版推上了遠端 main。請使用業界主流的 git pull --rebase 拉取並嫁接最新進度後再次推送！',
    goals: [
      '嘗試推送觀察 rejected 錯誤',
      '執行拉取變基：git pull --rebase',
      '再次推送完成同步：git push origin main'
    ],
    hints: [
      '先執行 git pull --rebase 將本地提交接在遠端最新版之後',
      '接著執行 git push origin main'
    ],
    setup: (git) => {
      const c1 = git.createCommit({ message: 'feat: initial common base' });
      git.remotes.origin.branches.set('main', c1.id);
      git.branches.set('main', c1.id);

      // Remote colleague pushed c2
      const c2 = git.createCommit({ message: 'feat: colleague feature on remote', parents: [c1.id] });
      git.remotes.origin.branches.set('main', c2.id);

      // Local user committed c3
      const c3 = git.createCommit({ message: 'feat: my local feature', parents: [c1.id] });
      git.branches.set('main', c3.id);
      git.checkoutOrSwitch('main');
    },
    checkGoal: (git) => {
      const localMain = git.branches.get('main');
      const remoteMain = git.remotes.origin.branches.get('main');
      if (localMain === remoteMain && git.isAncestor(git.remotes.origin.branches.get('main'), localMain)) {
        return {
          passed: true,
          message: '🎉 成功克服 Non-Fast-Forward 推送被拒！利用 git pull --rebase 避免了菱形交叉節點，團隊協作天衣無縫！'
        };
      }
      return { passed: false, message: '本地 main 尚未與遠端 origin/main 同步！請執行 git pull --rebase' };
    }
  },

  {
    id: '07',
    title: '精準挑選：跨分支 Cherry-pick 偷渡關鍵 Commit',
    difficulty: '實戰 ⭐⭐⭐',
    category: '協作救援',
    story: '你在一個巨大的實驗性分支 experimental 裡寫了幾千行還不能發布的草稿，但在其中修了一個極度關鍵的資安漏洞（Commit "fix: security patch"）。如何在不合併整包實驗代碼的前提下，單獨摘取該 Commit 到 main？',
    goals: [
      '確認當前在 main 分支',
      '使用 git log experimental 查看安全修補 Commit 的 Hash',
      '精準摘取該提交：git cherry-pick <commitHash>'
    ],
    hints: [
      '切換到 main：git switch main',
      '執行 git cherry-pick 加上該修復提交的 Hash（例如 b2c3d4e）'
    ],
    setup: (git) => {
      const c1 = git.createCommit({ message: 'feat: stable main' });
      git.branches.set('main', c1.id);

      const c2 = git.createCommit({ message: 'wip: experimental messy code', parents: [c1.id] });
      const cSecurity = git.createCommit({ message: 'fix: critical security patch', parents: [c2.id], hash: 'sec001' });
      const c3 = git.createCommit({ message: 'wip: half-baked AI model', parents: [cSecurity.id] });
      git.branches.set('experimental', c3.id);

      git.checkoutOrSwitch('main');
    },
    checkGoal: (git) => {
      const head = git.getHeadCommit();
      if (git.getCurrentBranch() === 'main' && head && head.message.includes('security patch')) {
        return {
          passed: true,
          message: '🎉 完美採摘！你成功使用 git cherry-pick 將關鍵安全修復偷渡到穩定主線，而巨大的未完成實驗程式碼依然留在原處！'
        };
      }
      return { passed: false, message: 'main 分支最新提交尚未包含 security patch！請執行 git cherry-pick sec001' };
    }
  },

  {
    id: '08',
    title: '起死回生：Git Reflog 拯救失蹤的 Commit',
    difficulty: '實戰 ⭐⭐⭐⭐',
    category: '協作救援',
    story: '手滑慘劇！本想清理工作區，卻不小心輸入了毀滅性的 git reset --hard HEAD~2，辛辛苦苦寫了一整天的重要代碼瞬間消失無蹤！別慌，Git 的黑盒子日記簿 reflog 記錄了每一次指針跳動，請將失蹤的提交召喚回來！',
    goals: [
      '輸入 git reflog 查閱指針移動歷史',
      '找到誤刪前的那筆 Commit Hash（或 HEAD@{1}）',
      '使用 git reset --hard <Hash> 起死回生！'
    ],
    hints: [
      '執行 git reflog 查看歷史',
      '執行 git reset --hard <丟失的CommitHash>'
    ],
    setup: (git) => {
      const c1 = git.createCommit({ message: 'feat: scaffold' });
      const cLost = git.createCommit({ message: 'feat: my precious 1000 lines of code', parents: [c1.id], hash: 'lost99' });
      git.branches.set('main', cLost.id);
      git.checkoutOrSwitch('main');

      // Accidental disaster reset
      git.reset('HEAD~1', '--hard');
    },
    checkGoal: (git) => {
      const head = git.getHeadCommit();
      if (head && head.message.includes('precious 1000 lines')) {
        return {
          passed: true,
          message: '🎉 起死回生！心血程式碼全數救回！只要 Git 曾經為它建立過 commit，在 reflog 的庇護下就永遠沒有真正失去！'
        };
      }
      return { passed: false, message: '重要程式碼尚未救回！請執行 git reflog 尋找 lost99 並 reset --hard 救回。' };
    }
  },

  {
    id: '09',
    title: '雙軌並行：Git Worktree 免 Stash 零干擾平行開發',
    difficulty: '實戰 ⭐⭐⭐⭐',
    category: '現代工程',
    story: '正在開發大功能，工作區檔案正在被本地伺服器監聽，突發 P0 緊急線上修復！傳統 git stash 會刷掉編譯快取與 node_modules，且 pop 容易衝突。現代工程師使用 git worktree 在獨立目錄多軌並行檢出，互不干擾！',
    goals: [
      '新增獨立工作區目錄：git worktree add hotfix-dir -b hotfix-p0',
      '在 hotfix-dir 完成修復並提交',
      '完成後移除該 worktree：git worktree remove hotfix-dir'
    ],
    hints: [
      '執行：git worktree add hotfix-dir -b hotfix-p0',
      '切換至 hotfix-p0 並 commit',
      '完成後執行：git worktree remove hotfix-dir'
    ],
    setup: (git) => {
      const c1 = git.createCommit({ message: 'feat: big feature in progress' });
      git.branches.set('main', c1.id);
      git.checkoutOrSwitch('main');
    },
    checkGoal: (git) => {
      if (git.branches.has('hotfix-p0') || git.worktrees.length > 0) {
        return {
          passed: true,
          message: '🎉 雙軌並行掌握！利用 git worktree，你可以在多個目錄同時跑不同分支的 dev server，徹底告別 stash pop 衝突與編譯快取失效！'
        };
      }
      return { passed: false, message: '尚未建立 hotfix worktree！請執行 git worktree add hotfix-dir -b hotfix-p0' };
    }
  },

  {
    id: '10',
    title: '時光偵探：Git Bisect 二分搜尋秒殺神秘 Bug',
    difficulty: '實戰 ⭐⭐⭐⭐⭐',
    category: '現代工程',
    story: '專案過去 100 個 commit 裡不知何時被引進了一個計算 Bug！主管在催，手動測 100 次會瘋掉。請啟動 Git 二分搜尋偵探 bisect，在 O(log N) 步之內鎖定到底是哪一個 Commit 搞的鬼！',
    goals: [
      '啟動二分偵探：git bisect start',
      '標記當前版本有問題：git bisect bad',
      '標記初始版本是好的：git bisect good c1',
      '跟隨 Git 自動檢出的節點反覆標記 good/bad 直到抓出犯人'
    ],
    hints: [
      '先執行 git bisect start',
      '再執行 git bisect bad，接著執行 git bisect good <最初的CommitId>'
    ],
    setup: (git) => {
      let prev = git.createCommit({ message: 'v1.0 stable release', hash: 'c1000' });
      for (let i = 1; i <= 6; i++) {
        const isCulprit = i === 4;
        const msg = isCulprit ? 'perf: optimize math (INTRUDED BUG)' : `chore: update module ${i}`;
        prev = git.createCommit({ message: msg, parents: [prev.id], hash: isCulprit ? 'bug004' : `c100${i}` });
      }
      git.branches.set('main', prev.id);
      git.checkoutOrSwitch('main');
    },
    checkGoal: (git) => {
      if (git.bisectState.bad === 'bug004' || (git.bisectState.active && git.bisectState.good.length > 0)) {
        return {
          passed: true,
          message: '🎉 兇手鎖定！你成功運用 Git Bisect 二分演算法秒殺神秘 Bug！這項技能能讓你在龐大歷史中比別人快 10 倍抓出元凶！'
        };
      }
      return { passed: false, message: '尚未啟動二分搜尋！請執行 git bisect start、git bisect bad 與 git bisect good c1000。' };
    }
  },

  {
    id: '11',
    title: '守門神器：Git Hooks 自動化品管與金鑰攔截',
    difficulty: '實戰 ⭐⭐⭐⭐',
    category: '現代工程',
    story: '防範資安悲劇！新手常不小心把 AWS_KEY 或 API_TOKEN commit 進代碼庫。Git Hooks 是內建的自動化守門員，若在提交時發現金鑰或代碼風格不合，立即強制拒絕 commit！',
    goals: [
      '配置守門員：在 Hooks 中啟用 pre-commit 敏感金鑰防禦',
      '嘗試提交含有 API_TOKEN 的檔案，體驗被守門員擋下的安全機制',
      '移除敏感金鑰後正常提交'
    ],
    hints: [
      'Git 守門員會自動檢查暫存檔案中的敏感字串',
      '請確認程式碼不含金鑰後執行 git commit'
    ],
    setup: (git) => {
      git.hooks.set('pre-commit', 'check-secrets');
      git.workingTree.set('config.env', 'AWS_KEY="AKIAIOSFODNN7EXAMPLE"');
      git.index.set('config.env', 'AWS_KEY="AKIAIOSFODNN7EXAMPLE"');
    },
    checkGoal: (git) => {
      // User must remove the secret and commit cleanly
      const head = git.getHeadCommit();
      const content = git.index.get('config.env') || '';
      if (!content.includes('AKIAIOSFODNN7EXAMPLE') && head) {
        return {
          passed: true,
          message: '🎉 守門成功！你親身體驗了 Git Hooks 的強大防禦力！配合 core.hooksPath 或 Husky，全團隊共享自動化品管與資安防線！'
        };
      }
      return { passed: false, message: '檔案中依然包含敏感金鑰！請移至環境變數後重新提交。' };
    }
  },

  {
    id: '12',
    title: '精準原子暫存：git add -p 局部區塊暫存',
    difficulty: '進階 ⭐⭐⭐',
    category: '現代工程',
    story: '在 shopping.py 中你同時改了折扣 Bug 和貨幣符號。如果直接 git add . 全部提交，會違背單一職責與 Atomic Commit 原則，讓 Code Review 極為痛苦。請使用 git add -p 依代碼塊拆分暫存！',
    goals: [
      '使用 git add -p shopping.py 進入互動暫存模式',
      '只暫存修復折扣的區塊 (Hunk 1)',
      '提交該原子修復：git commit -m "fix: apply discount in total calculation"'
    ],
    hints: [
      '執行 git add -p shopping.py',
      '在提示出現時，對第一個區塊按 y，第二個區塊按 n',
      '最後執行 git commit'
    ],
    setup: (git) => {
      const c1 = git.createCommit({ message: 'feat: shopping cart base' });
      git.branches.set('main', c1.id);
      git.checkoutOrSwitch('main');
      git.workingTree.set('shopping.py', '// modified discount and currency');
    },
    checkGoal: (git) => {
      const head = git.getHeadCommit();
      if (head && head.message.toLowerCase().includes('discount')) {
        return {
          passed: true,
          message: '🎉 掌握原子提交！利用 git add -p，即使在同一個檔案內做了多處修改，也能精準組織出乾淨俐落、容易 Review 的 Atomic Commits！'
        };
      }
      return { passed: false, message: '尚未完成獨立折扣修復的原子提交！請使用 git add -p shopping.py 並 commit。' };
    }
  },

  {
    id: '13',
    title: '亡羊補牢：.gitignore 追蹤失效與 git rm --cached',
    difficulty: '初階 ⭐⭐',
    category: '協作救援',
    story: '全宇宙工程師最常踩的坑：不小心把 .env 密碼檔 commit 進了版本庫，事後才在 .gitignore 補寫 .env，卻發現 Git 依然緊追不捨！因為已追蹤檔案不受 ignore 約束。請使用 git rm --cached 自索引除名！',
    goals: [
      '使用 git rm --cached .env 從 Git 索引移除追蹤（保留本機檔案）',
      '建立 .gitignore 並寫入 .env',
      '提交變更：git commit -m "chore: untrack .env"'
    ],
    hints: [
      '執行：git rm --cached .env',
      '執行：git add .gitignore && git commit -m "chore: untrack .env"'
    ],
    setup: (git) => {
      const c1 = git.createCommit({
        message: 'feat: initial commit with app and env',
        tree: new Map([
          ['app.py', 'print("run");'],
          ['.env', 'DB_PASSWORD="super_secret_123"']
        ])
      });
      git.branches.set('main', c1.id);
      git.checkoutOrSwitch('main');
      git.workingTree.set('.gitignore', '.env\n');
    },
    checkGoal: (git) => {
      if (!git.index.has('.env') && git.workingTree.has('.env')) {
        return {
          passed: true,
          message: '🎉 救回機密檔案！記住黃金法則：『已追蹤的檔案不受 .gitignore 約束』！透過 git rm --cached，優雅除名同時保全本機開發配置！'
        };
      }
      return { passed: false, message: '.env 依然在 Git 追蹤名單中！請執行 git rm --cached .env。' };
    }
  },

  {
    id: '14',
    title: '線上緊急回滾：解救生產事故的 Revert Merge (git revert -m 1)',
    difficulty: '實戰 ⭐⭐⭐⭐',
    category: '協作救援',
    story: '剛合併進 main 的 PR 爆發重大線上故障！主管喊「立刻回滾！」。直接輸入 git revert 卻報錯缺少 -m option。因為 Merge Commit 有雙親節點，必須加上 -m 1 指定保留主線基準！',
    goals: [
      '觀察當前 HEAD 是一個雙親的 Merge Commit',
      '使用 git revert -m 1 HEAD 產生安全的回滾提交',
      '確認主線生產事故解除'
    ],
    hints: [
      '執行：git revert -m 1 HEAD',
      '-m 1 代表以主線 Parent 1 為基準反轉該次合併的所有改動'
    ],
    setup: (git) => {
      const c1 = git.createCommit({ message: 'feat: stable v1.0' });
      const cBroken = git.createCommit({ message: 'feat: broken payment v2', parents: [c1.id] });
      const cMerge = git.createCommit({ message: 'Merge branch feature into main', parents: [c1.id, cBroken.id] });
      git.branches.set('main', cMerge.id);
      git.checkoutOrSwitch('main');
    },
    checkGoal: (git) => {
      const head = git.getHeadCommit();
      if (head && head.message.toLowerCase().includes('revert')) {
        return {
          passed: true,
          message: '🎉 救火成功！你成功運用 git revert -m 1 解救了線上生產事故！向前推進產生反轉提交，既平息災難又保留完整審計歷史！'
        };
      }
      return { passed: false, message: '尚未回滾該 Merge 提交！請執行 git revert -m 1 HEAD。' };
    }
  },

  {
    id: '15',
    title: '版本里程碑：Git Tag 與語意化版號發布',
    difficulty: '初階 ⭐⭐',
    category: '基礎裝備',
    story: '軟體正式上線！需要打上版本發布標籤（如 v1.0.0）。業界規範強烈推薦附註標籤 (Annotated Tag `git tag -a`)，包含發布備註與簽名；同時學會給歷史 Commit 補簽版號。',
    goals: [
      '在當前進度打上附註標籤：git tag -a v1.0.0 -m "Release v1.0.0"',
      '給歷史 Commit 補簽標籤：git tag -a v0.9.0 cAuth -m "Beta release"'
    ],
    hints: [
      '執行：git tag -a v1.0.0 -m "Release v1.0.0"',
      '執行：git tag -a v0.9.0 cAuth -m "Beta v0.9.0"'
    ],
    setup: (git) => {
      const cAuth = git.createCommit({ message: 'feat: user authentication', hash: 'cAuth' });
      const cRelease = git.createCommit({ message: 'docs: update changelog for v1.0.0', parents: [cAuth.id] });
      git.branches.set('main', cRelease.id);
      git.checkoutOrSwitch('main');
    },
    checkGoal: (git) => {
      const hasV1 = git.tags.has('v1.0.0');
      const hasV09 = git.tags.has('v0.9.0');
      if (hasV1 && hasV09) {
        return {
          passed: true,
          message: '🎉 里程碑標記完成！學會了附註標籤與歷史補簽，配合 git push origin --tags 即可全自動觸發 GitHub Releases 與 CI/CD 構建！'
        };
      }
      return { passed: false, message: '尚未完成標籤設定！請建立 v1.0.0 與 v0.9.0 標籤。' };
    }
  },

  {
    id: '16',
    title: '代碼考古學：git log -S 語意搜尋與 git blame',
    difficulty: '進階 ⭐⭐⭐',
    category: '現代工程',
    story: '接手龐大專案，關鍵變數 CRITICAL_SECRET_TOKEN 突然不知被誰改動了？盲翻幾百個 commit 如大海撈針。請使用鶴嘴鎬語意搜尋 git log -S 秒速鎖定元凶，並用 git blame 查看責任人！',
    goals: [
      '使用鶴嘴鎬搜尋：git log -S "CRITICAL_SECRET_TOKEN" --oneline',
      '找出引入該變數的 Commit Hash',
      '使用 git blame 查閱檔案每行歷史'
    ],
    hints: [
      '執行：git log -S "CRITICAL_SECRET_TOKEN" --oneline',
      '查看列出的特定 Commit'
    ],
    setup: (git) => {
      const c1 = git.createCommit({ message: 'feat: scaffold database', tree: new Map([['db.js', 'const PORT = 5432;']]) });
      const c2 = git.createCommit({
        message: 'feat: inject CRITICAL_SECRET_TOKEN into config',
        parents: [c1.id],
        tree: new Map([['db.js', 'const PORT = 5432;\nconst CRITICAL_SECRET_TOKEN = "vault_888";']])
      });
      const c3 = git.createCommit({ message: 'style: reformat comments', parents: [c2.id] });
      git.branches.set('main', c3.id);
      git.checkoutOrSwitch('main');
    },
    checkGoal: (git) => {
      if (!git.hasExecutedArchaeology) {
        return {
          passed: false,
          message: '請執行 git log -S "CRITICAL_SECRET_TOKEN" --oneline 或 git blame db.js 來追蹤該變數改動！'
        };
      }
      return {
        passed: true,
        message: '🎉 神級考古技術解鎖！git log -S 只看變數增減次數，搭配 git blame -w 忽略排版，接手任何大型專案都能 3 秒破案！'
      };
    }
  },

  {
    id: '17',
    title: '重複衝突終結者：git rerere 記錄與自動重用解法',
    difficulty: '實戰 ⭐⭐⭐⭐',
    category: '現代工程',
    story: '在長期分支上進行多次 Rebase，同一個衝突在每個 commit 都要手動解 10 次，解到懷疑人生！開啟 Git 秘密武器 rerere，只要解過一次，Git 自動快取解法並全自動填入！',
    goals: [
      '開啟配置：git config rerere.enabled true',
      '合併觸發衝突並手動解決第一次',
      '觀察 Git 自動記錄 resolution，享受未來 0 秒免解體驗！'
    ],
    hints: [
      '先執行：git config rerere.enabled true',
      '接著執行：git merge feature/api 解決衝突並提交'
    ],
    setup: (git) => {
      const c1 = git.createCommit({ message: 'feat: base server' });
      const cMain = git.createCommit({ message: 'feat: update lts', parents: [c1.id] });
      const cApi = git.createCommit({ message: 'feat: update async', parents: [c1.id] });
      git.branches.set('main', cMain.id);
      git.branches.set('feature/api', cApi.id);
      git.checkoutOrSwitch('main');
    },
    checkGoal: (git) => {
      const isRerere = git.config['rerere.enabled'] === 'true';
      if (isRerere) {
        return {
          passed: true,
          message: '🎉 恭喜解鎖 Git 最被低估的黑魔法：git rerere！長壽分支與多步驟變基從此不再害怕重複衝突，省下無數寶貴時間！'
        };
      }
      return { passed: false, message: '尚未開啟 rerere！請執行 git config rerere.enabled true。' };
    }
  },

  {
    id: '18',
    title: '完美補完：git commit --amend 追補漏檔與修改最後提交',
    difficulty: '初階 ⭐⭐',
    category: '提交修飾',
    story: '高見龍老師《為你自己學 Git》經典狀況題：剛敲下 git commit，才驚覺漏掉了重要圖檔 assets/logo.png，且提交訊息打成了 feat: relase（拼錯字）。使用 git commit --amend 在不產生多餘碎提交的情況下無縫修補！',
    goals: [
      '暫存遺漏檔案：git add assets/logo.png',
      '追加檔案並修正訊息：git commit --amend -m "feat: release v1.0.0"',
      '確認專案歷史維持單一乾淨節點'
    ],
    hints: [
      '先執行：git add assets/logo.png',
      '接著執行：git commit --amend -m "feat: release v1.0.0"'
    ],
    setup: (git) => {
      const c = git.createCommit({
        message: 'feat: relase v1.0.0',
        tree: new Map([['app.py', 'console.log("v1.0.0");']])
      });
      git.branches.set('main', c.id);
      git.HEAD = { type: 'branch', target: 'main' };
      git.workingTree.set('app.py', 'console.log("v1.0.0");');
      git.index.set('app.py', 'console.log("v1.0.0");');
      git.workingTree.set('assets/logo.png', '[PNG_LOGO_DATA]');
    },
    checkGoal: (git) => {
      const head = git.getHeadCommit();
      if (!head) return { passed: false, message: '尚未有任何提交！' };
      if (!head.tree.has('assets/logo.png')) {
        return { passed: false, message: '最後一次提交中尚未包含 assets/logo.png！請執行 git add assets/logo.png 並使用 git commit --amend。' };
      }
      if (head.message.includes('relase')) {
        return { passed: false, message: '提交訊息中的拼寫尚未修正！請修正為包含 release。' };
      }
      return {
        passed: true,
        message: '🎉 完美收官！你成功使用 git commit --amend 追補了遺漏檔案並修正拼寫，保持了極致乾淨的提交歷史！'
      };
    }
  },

  {
    id: '19',
    title: '救急暫存：Git Stash 工作區暫存、彈出與清理',
    difficulty: '初階 ⭐⭐',
    category: '上下文切換',
    story: '高見龍老師《為你自己學 Git》高頻狀況題：手邊做到一半臨時要切換任務！你在 feature/cart 修改了 cart.py 且新增了 coupon.py。此時 main 突發需要提交緊急 hotfix，切換分支會被擋下。請使用 git stash -u 暫存，切至 main 提交 hotfix，再切回分支執行 git stash pop 還原！',
    goals: [
      '使用 git stash -u 打包工作區修改與未追蹤檔案',
      '切換至 main 分支並提交緊急修復：git switch main ➜ 提交 hotfix.txt',
      '切回 feature/cart 分支並使用 git stash pop 彈出還原工作區'
    ],
    hints: [
      '執行：git stash -u',
      '切換主線：git switch main，建立 hotfix 並 commit',
      '切回分支：git switch feature/cart，執行：git stash pop'
    ],
    setup: (git) => {
      const c1 = git.createCommit({ message: 'feat: initial release', tree: new Map([['app.py', 'console.log("stable");']]) });
      git.branches.set('main', c1.id);

      const cCart = git.createCommit({
        message: 'feat: scaffold cart',
        parents: [c1.id],
        tree: new Map([['app.py', 'console.log("stable");'], ['cart.py', 'export const cart = [];']])
      });
      git.branches.set('feature/cart', cCart.id);
      git.checkoutOrSwitch('feature/cart');

      git.workingTree.set('cart.py', 'export const cart = [/* with discount */];');
      git.workingTree.set('coupon.py', 'export const coupon = "SUMMER_50";');
    },
    checkGoal: (git) => {
      const mainCommit = git.commits.get(git.branches.get('main'));
      if (!mainCommit || !mainCommit.message.toLowerCase().includes('hotfix')) {
        return { passed: false, message: '尚未在 main 分支完成緊急 hotfix 提交！請先 stash 暫存後，切換至 main 提交修復。' };
      }
      if (git.getCurrentBranch() !== 'feature/cart') {
        return { passed: false, message: '請切回 feature/cart 分支並執行 git stash pop！' };
      }
      if (!git.workingTree.has('coupon.py')) {
        return { passed: false, message: '未追蹤的 coupon.py 尚未還原！請執行 git stash pop。' };
      }
      return {
        passed: true,
        message: '🎉 漂亮通關！你熟練運用了 git stash -u 與 git stash pop，在零殘留與零髒 commit 的情況下化解了上下文切換的危機！'
      };
    }
  },

  {
    id: '20',
    title: '乾淨俐落：git mv 檔案更名與 git clean -fd 清理雜物',
    difficulty: '初階 ⭐⭐',
    category: '工作區維護',
    story: '架構重構規範要求將 utils.py 改名為 helpers.py；同時本地測試產生了殘留檔案 dump.tmp 與目錄 temp_test/。請使用 git mv 一步到位完成檔案更名，並使用 git clean -fd 一鍵徹底消除未追蹤垃圾！',
    goals: [
      '使用 git mv utils.py helpers.py 完成檔案更名並加入暫存',
      '使用 git clean -fd 清除未追蹤的 dump.tmp 與 temp_test/',
      '提交更名變更：git commit -m "refactor: rename utils to helpers"'
    ],
    hints: [
      '更名指令：git mv utils.py helpers.py',
      '清理指令：git clean -fd',
      '提交變更：git commit -m "refactor: rename utils to helpers"'
    ],
    setup: (git) => {
      const c = git.createCommit({
        message: 'feat: scaffold utils',
        tree: new Map([['utils.py', 'export const format = () => {};']])
      });
      git.branches.set('main', c.id);
      git.checkoutOrSwitch('main');
      git.workingTree.set('utils.py', 'export const format = () => {};');
      git.index.set('utils.py', 'export const format = () => {};');
      git.workingTree.set('dump.tmp', 'TEMP_DATA');
      git.workingTree.set('temp_test/cache.pid', '9911');
    },
    checkGoal: (git) => {
      const head = git.getHeadCommit();
      if (!head || !head.tree.has('helpers.py')) {
        return { passed: false, message: '尚未完成 helpers.py 提交！請使用 git mv utils.py helpers.py 並 commit。' };
      }
      if (git.workingTree.has('dump.tmp')) {
        return { passed: false, message: 'dump.tmp 仍殘留在工作目錄！請執行 git clean -fd 清理。' };
      }
      return {
        passed: true,
        message: '🎉 太乾淨了！你掌握了 git mv 檔案更名規範與 git clean -fd 雜物清理神技，讓代碼庫保持最高水準的整潔！'
      };
    }
  },

  {
    id: '21',
    title: '遠端全貌：git remote 管理與 git fetch vs git pull 深度解密',
    difficulty: '進階 ⭐⭐⭐',
    category: '遠端協作',
    story: '參與開源專案或跨團隊協作時，你需要配置上游倉庫 upstream。資深工程師的專業守則：『先 fetch 觀察遠端進度，再決定如何 merge』，避免盲目 pull 破壞本地代碼。請新增 upstream 遠端，執行 git fetch upstream 下載最新安全補丁，再整併進本地 main！',
    goals: [
      '新增上游遠端：git remote add upstream https://github.com/corp/upstream.git',
      '抓取上游進度：git fetch upstream',
      '將 upstream/main 的安全補丁合併至本地 main：git merge upstream/main'
    ],
    hints: [
      '註冊遠端：git remote add upstream https://github.com/corp/upstream.git',
      '下載進度：git fetch upstream',
      '合併主線：git merge upstream/main'
    ],
    setup: (git) => {
      const c1 = git.createCommit({ message: 'feat: initial release' });
      git.branches.set('main', c1.id);
      git.checkoutOrSwitch('main');

      const cUpstream = git.createCommit({
        message: 'fix: critical security patch from upstream',
        parents: [c1.id],
        tree: new Map([['security.js', 'export const verify = () => true;']])
      });
      git.remotes.upstream = {
        url: 'https://github.com/corp/upstream.git',
        branches: new Map([['main', cUpstream.id]])
      };
    },
    checkGoal: (git) => {
      const head = git.getHeadCommit();
      if (!head || !head.tree.has('security.js')) {
        return { passed: false, message: '本地 main 尚未合併上游的 security.js！請執行 git fetch upstream 與 git merge upstream/main。' };
      }
      return {
        passed: true,
        message: '🎉 太專業了！你解鎖了 git remote 與 git fetch 的完整協作思維，先看再合，完全避免了盲目 pull 的風險！'
      };
    }
  },

  {
    id: '22',
    title: '移花接木：錯在 main 提交的救星 (Branch & Reset 平移救援)',
    difficulty: '初階 ⭐⭐',
    category: '災難平移',
    story: '高見龍老師《為你自己學 Git》神級救援題：『啊！我還沒開分支就直接 Commit 下去了！』本該在 feature/oauth 開發，卻一時大意在 main 連續做了 2 個 commits。利用『原地開分支，再把主線退回去』的神級兩步，零損平移拯救歷史！',
    goals: [
      '原地開出新分支：git branch feature/oauth',
      '切回 main 分支：git switch main',
      '將 main 分支回退 2 步：git reset --hard HEAD~2',
      '確認 feature/oauth 保留全部進度，而 main 重回純淨初始狀態'
    ],
    hints: [
      '原地開分支：git branch feature/oauth',
      '切回主線：git switch main',
      '重設指針：git reset --hard HEAD~2'
    ],
    setup: (git) => {
      const c1 = git.createCommit({ message: 'feat: stable production foundation' });
      const c2 = git.createCommit({ message: 'feat: oauth step 1 - add client credentials', parents: [c1.id] });
      const c3 = git.createCommit({ message: 'feat: oauth step 2 - implement redirect login', parents: [c2.id] });
      git.branches.set('main', c3.id);
      git.checkoutOrSwitch('main');
    },
    checkGoal: (git) => {
      if (!git.branches.has('feature/oauth')) {
        return { passed: false, message: '尚未建立 feature/oauth 分支！請執行 git branch feature/oauth。' };
      }
      const mainId = git.branches.get('main');
      const oauthId = git.branches.get('feature/oauth');
      if (mainId === oauthId) {
        return { passed: false, message: 'main 分支指針尚未回退！請切回 main 並執行 git reset --hard HEAD~2。' };
      }
      const oauthCommit = git.commits.get(oauthId);
      if (!oauthCommit || !oauthCommit.message.includes('oauth step 2')) {
        return { passed: false, message: 'feature/oauth 分支未能承接最新的 OAuth 提交！' };
      }
      return {
        passed: true,
        message: '🎉 神級平移！你完全掌握了 Git 分支指針貼紙的本質，一秒化解了誤在主線開發的大災難，代碼零丟失、主線零污染！'
      };
    }
  },

  {
    id: '23',
    title: '底層透視：.git 水管底層物件解密 (Plumbing: cat-file & SHA-1)',
    difficulty: '進階 ⭐⭐⭐',
    category: '底層解密',
    story: '高見龍老師《為你自己學 Git》全書最震撼的解密章節：『在 .git 目錄裡到底有什麼東西？』Git 核心是一座鍵值資料庫，由 blob、tree、commit、tag 四種物件組成。在本關中，你將使用水管指令 git cat-file -t (查型別) 與 -p (印內容)，一層層順藤摸瓜直達檔案本體！',
    goals: [
      '查看 HEAD 物件型別：git cat-file -t HEAD',
      '傾印 HEAD 提交內容：git cat-file -p HEAD',
      '傾印 tree 內容：git cat-file -p tree_xxx',
      '傾印 blob 內容：git cat-file -p blob_xxx'
    ],
    hints: [
      '查型別：git cat-file -t HEAD',
      '查內容：git cat-file -p HEAD',
      '查 tree：git cat-file -p tree_xxxx',
      '查 blob：git cat-file -p blob_xxxx'
    ],
    setup: (git) => {
      const c = git.createCommit({
        message: 'feat: scaffold core vault secret',
        tree: new Map([['app.py', 'SECRET_DATABASE_PAYLOAD = "VAULT_CORE_778899"\n']])
      });
      git.branches.set('main', c.id);
      git.checkoutOrSwitch('main');
    },
    checkGoal: (git) => {
      if (!git.hasExecutedCatFile) {
        return { passed: false, message: '尚未執行水管指令！請執行 git cat-file -t HEAD 或 git cat-file -p HEAD 探索物件。' };
      }
      return {
        passed: true,
        message: '🎉 嘆為觀止！你成功解構了 Git 的底層物件儲存模型 (Object Database)，從 Commit ➜ Tree ➜ Blob 摸透了版本控制的物理本質！'
      };
    }
  }
];

// Export for browser
if (typeof window !== 'undefined') {
  window.SCENARIOS = SCENARIOS;
}
