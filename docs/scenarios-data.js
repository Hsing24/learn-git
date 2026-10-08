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
    story: '身為小菜雞的您到公司報到，拿到公司買新電腦給資深同事後換下來重灌後的舊電腦並安裝了 git，此時請為您的電腦環境設定 git 吧',
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
        : '\n💡 [推薦可選小撇步] 你還可以額外輸入 git config push.autoSetupRemote true，體驗免敲 --set-upstream 的極速 push！';

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
    story: '剛接手專案的小菜雞寫好了第一版 index.html 與 style.css，現在要把這些新寫好的程式碼打包暫存並拍照存檔，建立專案的第一個正式 Commit。',
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
    story: '資深前輩提醒菜雞：「千萬別直接在 main 上亂改！」請從小菜雞的角度開出 feature/login 分支開發登入功能，完成後安全快進合併回 main。',
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
        message: '🎉 漂亮！你完成了標準的獨立分支開發與 Fast-Forward 合併流程，main 分支指標順暢平移！'
      };
    }
  },

  {
    id: '03',
    title: '迎戰衝突：手動解決 Merge Conflict',
    difficulty: '進階 ⭐⭐⭐',
    category: '分支合併',
    story: '小菜雞跟同事改到了同一支檔案同一行，git merge 跳出衝突大爆炸！請冷靜打開檔案手動化解衝突標記並完成合併。',
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
    title: 'Rebase 藝術：使用 git rebase 保持線性歷史',
    difficulty: '進階 ⭐⭐⭐',
    category: '進階歷史',
    story: '菜雞發 PR 時被主管要求：「歷史太亂了，rebase 一下保持線性！」請使用 git rebase 把分支整合成乾淨的一條線。',
    goals: [
      '確認當前在 feature 分支上',
      '執行 rebase：git rebase main',
      '切回 main 並快進合併：git switch main && git merge feature'
    ],
    hints: [
      '在 feature 分支上執行 git rebase main',
      'rebase 完成後，切回 main 執行 git merge feature'
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
          message: '🎉 Rebase 成功！你的 commit 已優雅接在 main 的最新節點之後，整個 Git 樹呈現乾淨筆直的線性歷史！'
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
    story: '菜雞在本地狂敲一堆「fix bug」、「wip」、「test」零碎提交，被主管噴之前，請用 git rebase -i 把碎提交 squash 合併整理乾淨。',
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
    title: '模擬協作：遠端衝突與 Non-Fast-Forward Push 被拒',
    difficulty: '實戰 ⭐⭐⭐⭐',
    category: '協作救援',
    story: '菜雞興奮地敲 git push 卻被遠端狠狠拒絕（Non-Fast-Forward）！原來別人搶先推了進度，請用 git pull --rebase 優雅解套。',
    goals: [
      '嘗試 push 觀察 rejected 錯誤',
      '執行 pull rebase：git pull --rebase',
      '再次 push 完成同步：git push origin main'
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
          message: '🎉 成功克服 Non-Fast-Forward push 被拒！利用 git pull --rebase 避免了菱形交叉節點，團隊協作天衣無縫！'
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
    story: '隔壁部門看中小菜雞分支上某一個特定的 Bug 修復 commit，請用 git cherry-pick 精確偷渡該節點到發布分支。',
    goals: [
      '確認當前在 main 分支',
      '使用 git log experimental 查看安全修補 Commit 的 Hash',
      '精準 cherry-pick 該 commit：git cherry-pick <commitHash>'
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
    story: '菜雞手抖敲了 git reset --hard 誤刪心血程式碼，嚇得冷汗直流！請使用神秘的 git reflog 黑盒子日記救回失蹤的 Commit。',
    goals: [
      '輸入 git reflog 查閱 HEAD 指標移動歷史',
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
    story: '正寫到一半突然有線上 emergency hotfix 插單！菜雞不想 stash 搞亂工作區，請用 git worktree 開啟第二工作目錄並行救援。',
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
    story: '專案上百個 commit 中出現神秘未知 Bug，主管要菜雞找出來。請使用 git bisect 二分搜尋法在幾秒鐘內秒殺元凶。',
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
    story: '菜雞差點把包含 AWS 密鑰的設定檔推上網！請配置 pre-commit hook 守門腳本，在 commit 前自動攔截敏感資訊。',
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
    story: '菜雞在一支檔案裡改了兩件事，前輩要求分開提交。請用 git add -p 互動式逐塊暫存，達成乾淨的原子提交 (Atomic Commit)。',
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
    story: '菜雞把 .env 誤加入版本庫，事後補上 .gitignore 卻沒用！請用 git rm --cached 從索引除名並保全本地檔案。',
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
    title: '線上緊急 Revert：解救正式機事故的 Revert Merge (git revert -m 1)',
    difficulty: '實戰 ⭐⭐⭐⭐',
    category: '協作救援',
    story: '菜雞 merge 上線的新功能害線上系統掛了！請使用 git revert -m 1 針對 Merge Commit 安全產生 revert commit。',
    goals: [
      '觀察當前 HEAD 是一個雙親的 Merge Commit',
      '使用 git revert -m 1 HEAD 產生安全的 revert commit',
      '確認主線正式機事故解除'
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
          message: '🎉 救火成功！你成功運用 git revert -m 1 解救了線上正式機事故！向前推進產生 revert commit，既平息災難又保留完整審計歷史！'
        };
      }
      return { passed: false, message: '尚未 revert 該 Merge commit！請執行 git revert -m 1 HEAD。' };
    }
  },

  {
    id: '15',
    title: '版本里程碑：Git Tag 與語意化版號發布',
    difficulty: '初階 ⭐⭐',
    category: '基礎裝備',
    story: '產品發布日到了！菜雞負責為穩定版本貼上語意化版號標籤 (Semantic Versioning)，請使用 git tag 建立附註標籤。',
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
    title: '程式碼考古學：git log -S 搜尋與 git blame',
    difficulty: '進階 ⭐⭐⭐',
    category: '現代工程',
    story: '專案某行核心程式碼被改掉了，菜雞要抓出是誰哪次改的。請使用 git log -S 搜尋語意變更，搭配 git blame 責任溯源。',
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
    story: '菜雞在長期分支每天 rebase 都要解同一批衝突，快發瘋了！請開啟 git rerere 自動記憶衝突解法，再也不重複解題。',
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
          message: '🎉 恭喜解鎖 Git 最被低估的黑魔法：git rerere！長期分支與多步驟 rebase 從此不再害怕重複衝突，省下無數寶貴時間！'
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
    story: '菜雞剛 commit 完才驚覺漏放了一張圖，且 commit message 拼錯字！請用 git commit --amend 零痕跡完美修補。',
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
    story: '菜雞寫到一半被叫去開會修別的分支，請用 git stash -u 暫存未追蹤修改，修完切回分支用 git stash pop 還原現場。',
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
    story: '菜雞手動改檔名造成 Git 誤認是砍掉重新建檔，且本地殘留一堆雜物。請用 git mv 保持歷史，並用 git clean -fd 掃除未追蹤垃圾。',
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
        message: '🎉 太乾淨了！你掌握了 git mv 檔案更名規範與 git clean -fd 雜物清理神技，讓專案 repo 保持最高水準的整潔！'
      };
    }
  },

  {
    id: '21',
    title: '遠端全貌：git remote 管理與 git fetch vs git pull 深度解密',
    difficulty: '進階 ⭐⭐⭐',
    category: '遠端協作',
    story: '菜雞接手開源專案 Fork，搞不懂 pull 跟 fetch 差在哪。請配置 upstream 遠端，先 fetch 觀察遠端進度再決定合併策略。',
    goals: [
      '新增上游遠端：git remote add upstream https://github.com/corp/upstream.git',
      '抓取上游進度：git fetch upstream',
      '將 upstream/main 的安全 patch merge 至本地 main：git merge upstream/main'
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
    story: '菜雞犯了最經典的錯誤：忘記開分支直接在 main 上做了 2 個提交！請在當前位置開分支貼紙，再把 main reset 退回去拯救主線。',
    goals: [
      '原地開出新分支：git branch feature/oauth',
      '切回 main 分支：git switch main',
      '將 main 分支回退 2 步：git reset --hard HEAD~2',
      '確認 feature/oauth 保留全部進度，而 main 重回純淨初始狀態'
    ],
    hints: [
      '原地開分支：git branch feature/oauth',
      '切回主線：git switch main',
      '重設 HEAD 指標：git reset --hard HEAD~2'
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
        return { passed: false, message: 'main 分支指標尚未退回！請切回 main 並執行 git reset --hard HEAD~2。' };
      }
      const oauthCommit = git.commits.get(oauthId);
      if (!oauthCommit || !oauthCommit.message.includes('oauth step 2')) {
        return { passed: false, message: 'feature/oauth 分支未能承接最新的 OAuth 提交！' };
      }
      return {
        passed: true,
        message: '🎉 神級平移！你完全掌握了 Git 分支指標貼紙的本質，一秒化解了誤在 main 開發的大災難，程式碼零丟失、main 分支零污染！'
      };
    }
  },

  {
    id: '23',
    title: '底層透視：.git 水管底層物件解密 (Plumbing: cat-file & SHA-1)',
    difficulty: '進階 ⭐⭐⭐',
    category: '底層解密',
    story: '菜雞想搞懂 Git 到底如何存檔案。請使用水管底層指令 git cat-file -t 與 -p，解密 blob、tree 與 commit 物件的真實結構。',
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
