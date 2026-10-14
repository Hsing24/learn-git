/**
 * SCENARIOS_DATA - 核心關卡 00–23 定義
 * 結合真實工作情境、任務目標、初始化狀態與自動驗證邏輯
 */

const SCENARIOS = [
  {
    id: '00',
    title: '入職設定：提交作者身分',
    difficulty: '新手必備 🔰',
    category: '基礎裝備',
    story: '入職第一天，你小心翼翼坐在工位上，行政人員搬來一台散熱風扇呼呼狂轉的舊筆電：「這是強哥升級 M3 Max 之後汰換下來的二手筆電，重灌過囉！」你打開終端機，深知如果現在直接 commit，所有產出可能都會被算成強哥的——或者更慘，強哥以前留下的 Bug 都會算在你頭上！請立刻用 git config 設定自己的真名與 Email，提交作者資訊與登入遠端是兩件事；本關先設定作者。',
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
      const hasAutoTracking = git.config['push.autoSetupRemote'] === 'true';

      if (!hasName) return { passed: false, message: '尚未配置 user.name！請執行：git config user.name "你的名字"' };
      if (!hasEmail) return { passed: false, message: '尚未配置 user.email！請執行：git config user.email "you@example.com"' };

      const bonusMsg = hasAutoTracking
        ? '\n⭐ [選用設定] 你同時開啟了 push.autoSetupRemote，使用預設 simple/current/upstream 推送時，可在尚未設定 upstream 的分支首次推送時自動建立追蹤；不會自動執行 push。'
        : '\n💡 [選用設定] 你還可以額外輸入 git config push.autoSetupRemote true，了解首次推送的 upstream 自動設定。';

      return {
        passed: true,
        message: `🎉 恭喜完成起點必備身分設定！\n已就緒的作者資訊：\n  • user.name: ${name}\n  • user.email: ${email}${bonusMsg}`
      };
    }
  },

  {
    id: '01',
    title: '首次存檔：工作區、暫存區與提交',
    difficulty: '入門 ⭐',
    category: '基礎裝備',
    story: '強哥丟給你一份「便當訂餐系統」的原始碼需求，你花了一上午手抖著寫好第一版程式。現在要把這些心血打包存檔。身為剛入職的新人，你的第一個考驗是：搞懂「工作區」與「暫存區」的差別，建立你在此專案的第一個正式 Commit 里程碑！',
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
      const head = git.getHeadCommit();
      if (!head || head.tree.get('index.html') !== '<!DOCTYPE html><html><body><h1>Hello Git</h1></body></html>' || head.tree.get('style.css') !== 'body { margin: 0; background: #000; }' || [...head.tree].some(([f, c]) => git.index.get(f) !== c || git.workingTree.get(f) !== c)) return { passed: false, message: '請將 index.html 與 style.css 原始內容一併暫存並提交，確認追蹤檔案乾淨。' };
      if (commits.length === 0) return { passed: false, message: '尚未建立任何 Commit！請執行 git add . 與 git commit -m "..."' };
      return {
        passed: true,
        message: '🎉 恭喜完成第一個 Commit！你已經掌握了 Git 的核心三層流動：修改 ➜ 暫存 ➜ 提交！'
      };
    }
  },

  {
    id: '02',
    title: '功能開發：分支與快進合併',
    difficulty: '初階 ⭐⭐',
    category: '分支合併',
    story: '鄰座的小明前輩探頭低聲警告：「菜鳥，千萬別直接在 main 上狂寫！上次有人在 main 亂改被強哥念了整個下午。」請從小菜鳥的角度開出 feature/login 分支開發新功能，完成提交後切回主線，體驗絲滑順暢的 Fast-Forward 快進合併！',
    goals: [
      '開出並切換至新分支：git switch -c feature/login',
      '編輯 app.js 加入登入功能，再 git add app.js 與 git commit -m "feat: add login page"',
      '切回 main 分支：git switch main',
      '將登入功能合併進 main：git merge feature/login'
    ],
    hints: [
      '使用現代指令：git switch -c feature/login',
      '先在檔案頁修改 app.js，再 git add app.js 與 git commit -m "feat: add login"',
      '切回主線：git switch main',
      '快進合併：git merge feature/login'
    ],
    setup: (git) => {
      const c = git.createCommit({ message: 'feat: project scaffold', tree: new Map([['app.js', 'console.log("init");']]) });
      git.branches.set('main', c.id);
      git.HEAD = { type: 'branch', target: 'main' };
      git.workingTree.set('app.js', 'console.log("init");');
      git.index.set('app.js', 'console.log("init");');
      git.scenarioMeta = { baseId: c.id, initialContent: c.tree.get('app.js') };
    },
    checkGoal: (git) => {
      const mainId = git.branches.get('main');
      const loginId = git.branches.get('feature/login');
      if (!loginId) return { passed: false, message: '尚未建立 feature/login 分支！' };
      if (git.getCurrentBranch() !== 'main') return { passed: false, message: '合併完成後請切回 main 分支！' };
      const head = git.getHeadCommit();
      if (loginId === git.scenarioMeta.baseId || !head || head.tree.get('app.js') === git.scenarioMeta.initialContent || head.parents.length !== 1 || !git.isAncestor(git.scenarioMeta.baseId, mainId)) return { passed: false, message: '請先在 feature/login 修改並提交 app.js，再快進合併到 main。' };
      if (mainId !== loginId) return { passed: false, message: 'main 分支尚未合併 feature/login 分支！請執行 git merge feature/login' };

      return {
        passed: true,
        message: '🎉 漂亮！你完成了標準的獨立分支開發與 Fast-Forward 合併流程，main 分支指標順暢平移！'
      };
    }
  },

  {
    id: '03',
    title: '同時修改：解決合併衝突',
    difficulty: '進階 ⭐⭐⭐',
    category: '分支合併',
    story: '真實的辦公室車禍現場！你滿心歡喜寫好新功能準備合併，終端機卻噴出刺眼紅字：CONFLICT！抬頭一看，小明前輩若無其事地喝咖啡：「啊，我剛剛也改了同一行，忘記跟你說了～」眼前出現 <<<<<<< HEAD 如拆彈剪線，全辦公室都在看你，請冷靜手動化解衝突並完成合併！',
    goals: [
      '嘗試合併：git merge feature/dark-mode（觸發衝突）',
      '解決衝突：編輯 style.css，移除 <<<<<<< 與 >>>>>>> 標記',
      '暫存並提交：git add style.css && git commit -m "merge: resolve dark mode conflict"'
    ],
    hints: [
      '直接執行 git merge feature/dark-mode 觸發衝突',
      '衝突發生後，切換到上方「📁 檔案」頁籤可直接點擊「解決衝突」，手動確認內容，git add style.css 後才 git commit 完成合併'
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
        message: '🎉 太厲害了！你成功馴服了初學者最害怕的 Merge Conflict！而且趕在另一個同事推送前你已經解完衝突並推送了'
      };
    }
  },

  {
    id: '04',
    title: '主線更新：Rebase 與線性歷史',
    difficulty: '進階 ⭐⭐⭐',
    category: '進階歷史',
    story: '你剛送出 PR，強哥馬上在 Slack 敲你：「你這分支歷史怎麼跟蜘蛛網一樣？分支岔出去那麼久，給我 rebase 最新 main，歷史保持一條直線再提！」為了不在試用期第一個月被釘在牆上，請用 git rebase 將分支嫁接到最新主線後方！',
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
      git.scenarioMeta = { baseId: c1.id, mainTipId: c2.id, featureTipId: c3.id };
    },
    checkGoal: (git) => {
      const { mainTipId, featureTipId } = git.scenarioMeta || {};
      const mainId = git.branches.get('main');
      const featureId = git.branches.get('feature');
      if (!featureId) return { passed: false, message: 'feature 分支不見了！請按「重設」重來。' };
      if (featureId === featureTipId) return { passed: false, message: 'feature 尚未 rebase！請在 feature 上執行 git rebase main。' };
      if (!git.isAncestor(mainTipId, featureId)) return { passed: false, message: 'feature 還沒接到 main 的最新 commit 後面。' };

      let curr = featureId;
      let hasFeatureCommit = false;
      let hasMergeCommit = false;
      while (curr && curr !== mainTipId) {
        const c = git.commits.get(curr);
        if (!c) break;
        if (c.parents && c.parents.length > 1) {
          hasMergeCommit = true;
        }
        if (c.message === 'feat: feature step 1') {
          hasFeatureCommit = true;
        }
        curr = (c.parents && c.parents[0]) ? c.parents[0] : null;
      }

      if (hasMergeCommit) return { passed: false, message: '出現了 merge commit，這關要用 rebase 保持線性。' };
      if (!hasFeatureCommit) return { passed: false, message: '你的 feature commit 不見了，可以用 git reflog 找回。' };
      if (mainId !== featureId) return { passed: false, message: 'rebase 完成！最後一步：git switch main && git merge feature（會是 fast-forward）。' };

      return {
        passed: true,
        message: '🎉 Rebase 成功！你的 commit 已優雅接在 main 的最新節點之後，整個 Git 樹呈現乾淨筆直的線性歷史！'
      };
    }
  },

  {
    id: '05',
    title: '整理草稿：互動式 Rebase',
    difficulty: '進階 ⭐⭐⭐',
    category: '進階歷史',
    story: '昨晚你為了解一個 Bug，本地狂敲了一堆「wip」、「fix bug」、「test again」、「真的最後一次」碎提交。眼看技術主管端著咖啡朝你走過來，趁他點開 GitHub 之前，快用 git rebase -i 啟動歷史整形手術，把遮羞布們 squash 合併成專業又體面的完美提交！',
    goals: [
      '將最近的零碎提交整理為精簡的提交歷史',
      '保持最終 HEAD 只有 1 個完整功能的 commit'
    ],
    hints: [
      '執行 git rebase -i HEAD~2；保留第一行 pick，第二行改 squash 或 fixup',
      '編輯合併後的提交訊息。amend 只能修補最新提交，不能單獨合併兩個既有提交。'
    ],
    setup: (git) => {
      const c1 = git.createCommit({ message: 'feat: scaffold', tree: new Map([['payment.js', '// payment module\n']]) });
      const c2 = git.createCommit({
        message: 'wip: payment form',
        parents: [c1.id],
        tree: new Map([['payment.js', '// payment module\nfunction renderForm() { cardNumbr(); }\n']])
      });
      const c3 = git.createCommit({
        message: 'fix: typo in card input',
        parents: [c2.id],
        tree: new Map([['payment.js', '// payment module\nfunction renderForm() { cardNumber(); }\n']])
      });
      git.branches.set('main', c3.id);
      git.checkoutOrSwitch('main');
      git.scenarioMeta = { baseId: c1.id, finalContent: c3.tree.get('payment.js') };
    },
    checkGoal: (git) => {
      const { baseId, finalContent } = git.scenarioMeta || {};
      const head = git.getHeadCommit();
      if (!head) return { passed: false, message: '找不到 HEAD commit。' };

      // 從 head 沿著 parents[0] 數到 baseId 為止的 commit 數 = n
      let n = 0;
      let curr = head.id;
      let reachedBase = false;
      while (curr) {
        if (curr === baseId) {
          reachedBase = true;
          break;
        }
        n++;
        const c = git.commits.get(curr);
        curr = (c && c.parents && c.parents[0]) ? c.parents[0] : null;
      }

      if (!reachedBase) {
        return { passed: false, message: '歷史基礎跑掉了，請按「重設」重來。' };
      }
      if (n !== 1) {
        return { passed: false, message: `scaffold 之上應該只剩 1 個 commit，目前有 ${n} 個。試試 git rebase -i HEAD~2，把第 2 行改成 squash 或 fixup。` };
      }
      if (head.tree.get('payment.js') !== finalContent) {
        return { passed: false, message: 'payment.js 的內容不對，可能是用了 drop 把變更丟掉了。請按「重設」再試一次。' };
      }
      if (/^wip\b|typo/i.test(head.message)) {
        return { passed: false, message: 'commit 已經合併了，但訊息還是零碎的 wip / typo，請用 squash 編輯訊息，或用 reword 改掉。' };
      }

      return {
        passed: true,
        message: '🎉 歷史整形完成！PR 提交紀錄變得無比乾淨專業，Code Reviewer 一目了然！'
      };
    }
  },

  {
    id: '06',
    title: '推送被拒：同步遠端並保留雙方提交',
    difficulty: '實戰 ⭐⭐⭐⭐',
    category: '協作救援',
    story: '寫完功能自信滿滿敲下 git push，終端機卻狠狠賞了你一巴掌：[rejected - non-fast-forward]！原來小明前輩手速更快，搶先一步推了進度。切記職場保命守則：絕對不能用 --force 蓋掉前輩的 code！請用 git pull --rebase 優雅超車再推送！',
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
      const c1 = git.createCommit({
        message: 'feat: initial common base',
        tree: new Map([['app.js', '// base application\n']])
      });
      git.remotes.origin.branches.set('main', c1.id);
      git.branches.set('main', c1.id);

      // Remote colleague pushed c2
      const c2 = git.createCommit({
        message: 'feat: colleague feature on remote',
        parents: [c1.id],
        tree: new Map([['app.js', '// base application\n'], ['notice.txt', 'Important update by colleague\n']])
      });
      git.remotes.origin.branches.set('main', c2.id);

      // Local user committed c3
      const c3 = git.createCommit({
        message: 'feat: my local feature',
        parents: [c1.id],
        tree: new Map([['app.js', '// base application\n'], ['points.js', 'const points = 100;\n']])
      });
      git.branches.set('main', c3.id);
      git.checkoutOrSwitch('main');
      git.scenarioMeta = { baseId: c1.id, colleagueId: c2.id, mineMessage: 'feat: my local feature' };
    },
    checkGoal: (git) => {
      const { colleagueId, mineMessage } = git.scenarioMeta || {};
      const localId = git.branches.get('main');
      const remoteId = git.remotes.origin?.branches?.get('main');

      const firstParentChain = [];
      let curr = localId;
      while (curr) {
        const c = git.commits.get(curr);
        if (!c) break;
        firstParentChain.push(c);
        curr = (c.parents && c.parents[0]) ? c.parents[0] : null;
      }

      const hasMine = firstParentChain.some(c => c.message === mineMessage);
      const hasColleague = git.isAncestor(colleagueId, localId);
      const hasMerge = firstParentChain.some(c => c.parents && c.parents.length > 1);

      if (!hasColleague && remoteId === localId) {
        return { passed: false, message: '同事的 commit 被你的 force push 蓋掉了！真實團隊裡這會造成事故，請按「重設」重來，不要用 --force。' };
      }
      if (!hasMine) {
        return { passed: false, message: '你的本地 commit 不見了！可以用 git reflog 找到它的 hash，再用 git reset --hard <hash> 救回來。' };
      }
      if (!hasColleague) {
        return { passed: false, message: '還沒同步遠端上同事的 commit，請執行 git pull --rebase。' };
      }
      if (hasMerge) {
        return { passed: false, message: '出現了 merge commit（你用了沒加 --rebase 的 pull）。請用 git reset --hard HEAD~1 退回去，再改用 git pull --rebase。' };
      }
      if (remoteId !== localId) {
        return { passed: false, message: '本地已經整理好了，最後一步：git push origin main。' };
      }

      return {
        passed: true,
        message: '🎉 成功克服 Non-Fast-Forward push 被拒！利用 git pull --rebase 避免了菱形交叉節點，團隊協作天衣無縫！'
      };
    }
  },

  {
    id: "07",
    title: '挑選修復：Cherry-pick 與衝突處理',
    difficulty: "初階 ⭐⭐",
    category: "協作救援",
    story: "只取實驗分支的修復，不引入未完成功能。main 與修復改到同一行；先體驗 abort 回到原狀，再重試解衝突並 continue。",
    goals: ["在 main 執行 git cherry-pick sec001，觀察衝突", "git cherry-pick --abort 回復原狀", "重新挑選 sec001，將 auth.js 解成同時保留審計與驗證", "git add auth.js，git cherry-pick --continue"],
    hints: ["查看 git log experimental --oneline", "衝突內容可改成 authorizeWithAuditAndValidation();，再 add 與 --continue"],
    setup: (git) => {
      const base = git.createCommit({ message: 'feat: authorization base', tree: new Map([['auth.js', 'authorize();\n']]) });
      const main = git.createCommit({ message: 'feat: audit authorization', parents: [base.id], tree: new Map([['auth.js', 'authorizeWithAudit();\n']]) });
      const messy = git.createCommit({ message: 'wip: experiment', parents: [base.id], tree: new Map([...base.tree, ['experiment.js', 'unfinished();\n']]) });
      const fix = git.createCommit({ message: 'fix: validate authorization', hash: 'sec001', parents: [messy.id], tree: new Map([['auth.js', 'authorizeWithValidation();\n'], ['experiment.js', 'unfinished();\n']]) });
      git.branches.set('main', main.id); git.branches.set('experimental', fix.id); git.checkoutOrSwitch('main');
      git.scenarioMeta = { mainId: main.id, resolved: 'authorizeWithAuditAndValidation();\n' };
    },
    checkGoal: (git) => {
      const head = git.getHeadCommit();
      const aborted = (git.operationHistory || []).some(o => o.command === 'cherry-pick' && o.args.includes('--abort'));
      if (!aborted) return { passed: false, message: '先在衝突中執行 cherry-pick --abort，再重試。' };
      if (git.getCurrentBranch() !== 'main' || !head || head.parents[0] !== git.scenarioMeta.mainId || head.tree.get('auth.js') !== git.scenarioMeta.resolved || head.tree.has('experiment.js') || git.cherryPickInProgress) return { passed: false, message: '請只套用修復、保留 main 的審計行為，解決衝突後 --continue。' };
      return { passed: true, message: '已挑選修復並保留主線內容，實驗檔案未被引入。' };
    }
  },

  {
    id: '08',
    title: '誤刪提交：Reflog 救援',
    difficulty: '實戰 ⭐⭐⭐⭐',
    category: '協作救援',
    story: '本來只想退回暫存，手抖敲成了 git reset --hard HEAD~1，今天整整四個小時的心血直接在眼前蒸發！你臉色發白、冷汗直流，心中開始打離職信草稿……別慌！Git 有時光黑盒子日記 git reflog，趁前輩發現前偷偷把丟失的提交召喚回人間！',
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
          message: '🎉 起死回生！心血程式碼全數救回！Reflog 是本機參照移動紀錄，會到期；無引用物件也可能被垃圾回收。請及時用分支或標籤保存救回的提交。'
        };
      }
      return { passed: false, message: '重要程式碼尚未救回！請執行 git reflog 尋找 lost99 並 reset --hard 救回。' };
    }
  },

  {
    id: "09",
    title: '平行修復：Worktree 獨立工作區',
    difficulty: "初階 ⭐⭐",
    category: "上下文切換",
    story: "主工作區有未完成修改。建立另一個目錄修復 main、提交並移除 linked worktree，回到主工作區確認未完成內容仍在。",
    goals: ["git worktree add -b hotfix-p0 ../hotfix main", "cd ../hotfix，在 app.js 修正 bug 並提交", "在 linked worktree 中 git switch main 與 git merge hotfix-p0 整合修復，再 cd .. 返回主工作區與 remove", "確認 feature 分支與未提交修改完整保留"],
    hints: ["git worktree add -b hotfix-p0 ../hotfix main", "cd ../hotfix；在檔案頁修改 app.js，再 add、commit", "cd ..；git worktree remove ../hotfix"],
    setup: (git) => {
      const base = git.createCommit({ message: 'feat: stable app', tree: new Map([['app.js', 'runBuggy();\n']]) });
      git.branches.set('main', base.id); git.branches.set('feature', base.id); git.checkoutOrSwitch('feature');
      git.workingTree.set('app.js', 'featureInProgress();\n');
      git.scenarioMeta = { baseId: base.id, wip: 'featureInProgress();\n' };
    },
    checkGoal: (git) => {
      const hotfix = git.commits.get(git.branches.get('hotfix-p0'));
      if (!git.hasCreatedWorktree || !hotfix || hotfix.id === git.scenarioMeta.baseId || hotfix.tree.get('app.js') === 'runBuggy();\n') return { passed: false, message: '請在 ../hotfix 的獨立工作區完成修復提交。' };
      if (!hotfix || !git.isAncestor(hotfix.id, git.branches.get('main'))) return { passed: false, message: '請在 linked worktree 切 main 並 merge hotfix-p0，讓主線包含修復。' };
      if (git.worktrees.length || git.getCurrentBranch() !== 'feature' || git.workingTree.get('app.js') !== git.scenarioMeta.wip || git.branches.get('feature') !== git.scenarioMeta.baseId) return { passed: false, message: '請返回主工作區、移除 linked worktree，保留 feature 的未提交修改。' };
      return { passed: true, message: '另一個目錄的修復已提交，原工作區的 HEAD、索引與未完成修改獨立保留。' };
    }
  },

  {
    id: '10',
    title: '定位回歸：Bisect 二分搜尋',
    difficulty: '實戰 ⭐⭐⭐⭐⭐',
    category: '現代工程',
    story: '線上出現了神祕靈異現象，功能莫名壞掉，但這幾天有上百個 commit。主管在週會上嚴肅地問：「到底是誰在哪天弄壞的？」身為菜鳥，請化身時光偵探，啟動 git bisect 二分搜尋法，在幾分鐘內抓出是哪位前輩留下的內鬼！',
    goals: [
      '啟動二分偵探：git bisect start',
      '標記當前版本有問題：git bisect bad',
      '標記初始版本是好的：git bisect good c1000',
      '檢查 calc.js 的結果，標記 good/bad 到找到第一個壞提交，再 git bisect reset'
    ],
    hints: [
      '先執行 git bisect start',
      '再執行 git bisect bad，接著執行 git bisect good <最初的CommitId>'
    ],
    setup: (git) => {
      let prev = git.createCommit({ message: 'v1.0 stable release', hash: 'c1000', tree: new Map([['calc.js', 'result = 2;\n']]) });
      for (let i = 1; i <= 6; i++) {
        const isCulprit = i === 4;
        const msg = isCulprit ? 'perf: optimize math (INTRUDED BUG)' : `chore: update module ${i}`;
        prev = git.createCommit({ message: msg, parents: [prev.id], hash: isCulprit ? 'bug004' : `c100${i}`, tree: new Map([['calc.js', i >= 4 ? 'result = 3;\n' : 'result = 2;\n']]) });
      }
      git.branches.set('main', prev.id);
      git.checkoutOrSwitch('main');
      git.scenarioMeta = { originalTip: prev.id };
    },
    checkGoal: (git) => {
      if (git.bisectFoundId === 'bug004' && !git.bisectState.active && git.getCurrentBranch() === 'main' && git.branches.get('main') === git.scenarioMeta.originalTip) {
        return {
          passed: true,
          message: '🎉 兇手鎖定！你成功運用 Git Bisect 二分演算法秒殺神秘 Bug！已找到第一個錯誤版本，並 reset 回原始分支。'
        };
      }
      return { passed: false, message: '尚未找到第一個壞提交並結束搜尋！請執行 git bisect start、git bisect bad 與 git bisect good c1000。' };
    }
  },

  {
    id: "11",
    title: '提交檢查：Hooks 攔截與修正',
    difficulty: "初階 ⭐⭐",
    category: "現代工程",
    story: "本機 pre-commit 用假憑證示範攔截。先看一次失敗，再移除假密鑰並正常提交。Hooks 可被跳過或未安裝，團隊仍需服務端檢查與憑證管理。",
    goals: ["配置 git config core.hooksPath .githooks 與 chmod +x .githooks/pre-commit", "嘗試 git commit -m \"test: blocked secret\"，確認被攔截", "在檔案頁將 config.env 改成 AWS_KEY=\"\"，git add config.env", "正常 git commit -m \"chore: remove secret\""],
    hints: ["先配置 hook 路徑與執行權限；假密鑰已暫存", "被攔截後移除密鑰、重新 add，再正常 commit", "--no-verify 可略過部分 hooks；本關不以 bypass 作為成功條件。"],
    setup: (git) => {
      git.hooks.set('pre-commit', 'check-secrets');
      git.workingTree.set('.githooks/pre-commit', '#!/bin/sh\n# check-secrets\n');
      git.workingTree.set('config.env', 'AWS_KEY="AKIAIOSFODNN7EXAMPLE"');
      git.index.set('config.env', 'AWS_KEY="AKIAIOSFODNN7EXAMPLE"');
    },
    checkGoal: (git) => {
      const head = git.getHeadCommit();
      if (!git.hasBlockedHook) return { passed: false, message: '先嘗試提交假密鑰，觀察 hook 攔截。' };
      if (!head || head.tree.get('config.env')?.includes('AKIAIOSFODNN7EXAMPLE') || git.hasBypassedHook) return { passed: false, message: '請移除假密鑰、重新 add，透過正常 commit 完成。' };
      return { passed: true, message: '已體驗攔截並提交修正。Hooks 是本機檢查，不是安全保證。' };
    }
  },

  {
    id: "12",
    title: '拆分變更：Patch 局部暫存',
    difficulty: "初階 ⭐⭐",
    category: "現代工程",
    story: "同一檔案包含折扣修復和輸出格式調整，請只暫存第一個 hunk，讓提交包含一件可獨立審查的變更。",
    goals: ["git add -p shopping.py，只接受第一個 hunk", "提交折扣修復", "確認格式修改仍留在工作區"],
    hints: ["第一個 hunk 選 y、第二個選 n", "git diff --staged 確認快照，再 git commit -m \"fix: discount\""],
    setup: (git) => {
      const original = 'def total(price):\n    return price\n\n\n\n\n\n\n\n\n\ndef label():\n    return "Total"\n';
      const discount = original.replace('return price', 'return price * 0.9');
      const changed = discount.replace('"Total"', '"TOTAL"');
      const c = git.createCommit({ message: 'feat: shopping base', tree: new Map([['shopping.py', original]]) });
      git.branches.set('main', c.id); git.checkoutOrSwitch('main'); git.workingTree.set('shopping.py', changed);
      git.scenarioMeta = { baseId: c.id, discount, changed };
    },
    checkGoal: (git) => {
      const head = git.getHeadCommit();
      if (!head || head.parents[0] !== git.scenarioMeta.baseId || head.tree.get('shopping.py') !== git.scenarioMeta.discount || git.workingTree.get('shopping.py') !== git.scenarioMeta.changed) return { passed: false, message: '提交只能包含折扣修復；格式修改須留在工作區。請用 add -p 拆分。' };
      return { passed: true, message: '提交包含折扣修復，另一個 hunk 留待下一次提交。' };
    }
  },

  {
    id: '13',
    title: '停止追蹤：Gitignore 與移除索引',
    difficulty: '初階 ⭐⭐',
    category: '協作救援',
    story: '你昨天不小心把本地產生的臨時記錄檔 .env 給 commit 進去了，今天雖然補上了 .gitignore，Git 卻完全無視！小明前輩笑著說：「已經被追蹤的檔案，gitignore 救不了你啦。」請用 git rm --cached 把它從索引剔除，同時保留本地檔案！',
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
      const head = git.getHeadCommit();
      if (head && !head.tree.has('.env') && head.tree.get('.gitignore')?.split(/\r?\n/).includes('.env') && !git.index.has('.env') && git.workingTree.has('.env')) {
        return {
          passed: true,
          message: '🎉 已停止追蹤！歷史中的秘密仍需輪替憑證與額外清理。記住黃金法則：『已追蹤的檔案不受 .gitignore 約束』！透過 git rm --cached，優雅除名同時保全本機開發配置！'
        };
      }
      return { passed: false, message: '.env 依然在 Git 追蹤名單中！請執行 git rm --cached .env。' };
    }
  },

  {
    id: '14',
    title: '撤銷合併：Revert 的主線選擇',
    difficulty: '實戰 ⭐⭐⭐⭐',
    category: '協作救援',
    story: '災難降臨！小明前輩剛剛興高采烈合併進 main 的功能，一上線就讓生產環境 CPU 飆到 100%！主管大喊：「快倒退！但絕對不能 force push 改寫主線歷史！」身為在場唯一的冷靜工程師，請用 git revert -m 1 安全產生反向提交，挽救全公司的伺服器！',
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
      const c1 = git.createCommit({ message: 'feat: stable v1.0', tree: new Map([['payment.js', 'payStable();\n']]) });
      const cBroken = git.createCommit({ message: 'feat: broken payment v2', parents: [c1.id], tree: new Map([['payment.js', 'payBroken();\n']]) });
      const cMerge = git.createCommit({ message: 'Merge branch feature into main', parents: [c1.id, cBroken.id], tree: new Map(cBroken.tree) });
      git.branches.set('main', cMerge.id);
      git.checkoutOrSwitch('main');
      git.scenarioMeta = { mergeId: cMerge.id, stable: c1.tree.get('payment.js') };
    },
    checkGoal: (git) => {
      const head = git.getHeadCommit();
      if (head && head.parents[0] === git.scenarioMeta.mergeId && head.tree.get('payment.js') === git.scenarioMeta.stable && git.isAncestor(git.scenarioMeta.mergeId, head.id)) {
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
    title: '版本標記：附註標籤',
    difficulty: '初階 ⭐⭐',
    category: '基礎裝備',
    story: '歷經千辛萬苦，團隊的產品終於迎來大改版。技術主管拍拍你的肩膀：「菜鳥，今天的正式發布由你來下標籤。」請依照語意化版號規範 (Semantic Versioning)，使用 git tag 建立附註標籤，為專案刻下重要的里程碑！',
    goals: [
      '在當前進度打上附註標籤：git tag -a v1.0.0 -m "Release v1.0.0"',
      '給歷史 Commit 補上標籤：git tag -a v0.9.0 cAuth -m "Beta release"'
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
      const hasV1 = git.tags.get('v1.0.0')?.type === 'annotated' && git.tags.get('v1.0.0').commitId === git.getHeadCommitId();
      const hasV09 = git.tags.get('v0.9.0')?.type === 'annotated' && git.tags.get('v0.9.0').commitId === 'cAuth';
      if (hasV1 && hasV09) {
        return {
          passed: true,
          message: '🎉 里程碑標記完成！學會了附註標籤與歷史補上，附註標籤不等於簽署標籤；push 只同步標籤。建立 Release 或 CI/CD 自動化需另行設定。'
        };
      }
      return { passed: false, message: '尚未完成標籤設定！請建立 v1.0.0 與 v0.9.0 標籤。' };
    }
  },

  {
    id: '16',
    title: '追溯變更：Pickaxe 與 Blame',
    difficulty: '進階 ⭐⭐⭐',
    category: '現代工程',
    story: '專案裡一段關鍵的計費核心代碼莫名被改動了，主管問是誰改的，大家面面相覷。身為最沒包袱的新人，請使用 git log -S 搜尋字串變動歷史，搭配 git blame 追溯責任人，看看到底是哪位前輩在深夜偷偷下的毒手！',
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
        message: '🎉 神級考古技術解鎖！git log -S 搜尋指定字串出現次數的變化，不理解程式語意，搭配 git blame -w 忽略排版，協助縮小調查範圍。'
      };
    }
  },

  {
    id: "17",
    title: '重複衝突：Rerere 記錄與重用',
    difficulty: "初階 ⭐⭐",
    category: "現代工程",
    story: "同一個內容衝突需要處理兩次。開啟 rerere、解決第一次並提交，退回主線原位置再合併，檢查重用內容並重新 add、commit。",
    goals: ["git config rerere.enabled true", "git merge feature/api，手動解決 server.js，再 add、commit", "git reset --hard main-before；再次 git merge feature/api", "觀察解法重用，檢查內容後 git add server.js 與 git commit"],
    hints: ["第一次可把 server.js 改成 serveLtsAndAsync();", "第一個合併完成後 reset --hard main-before，重試同一個合併", "rerere 套用內容後仍需檢查與暫存；不保證任意新衝突都能重用"],
    setup: (git) => {
      const base = git.createCommit({ message: 'feat: base server', tree: new Map([['server.js', 'serve();\n']]) });
      const main = git.createCommit({ message: 'feat: lts', parents: [base.id], tree: new Map([['server.js', 'serveLts();\n']]) });
      const api = git.createCommit({ message: 'feat: async', parents: [base.id], tree: new Map([['server.js', 'serveAsync();\n']]) });
      git.branches.set('main', main.id); git.branches.set('main-before', main.id); git.branches.set('feature/api', api.id); git.checkoutOrSwitch('main');
      git.scenarioMeta = { resolved: 'serveLtsAndAsync();\n' };
    },
    checkGoal: (git) => {
      const head = git.getHeadCommit();
      if (!git.rerereRecorded || !git.rerereReused || !head || head.parents.length !== 2 || head.tree.get('server.js') !== git.scenarioMeta.resolved || git.mergeInProgress) return { passed: false, message: '需要完成第一次記錄、第二次實際重用，檢查內容並完成合併。' };
      return { passed: true, message: '相同衝突的已記錄解法已重用；你也確認並提交了結果。' };
    }
  },

  {
    id: '18',
    title: '補上漏檔：Amend 最新提交',
    difficulty: '初階 ⭐⭐',
    category: '提交修飾',
    story: '才剛驕傲地按下 commit，一轉頭驚覺：程式碼裡有一個超低級的變數名稱拼錯，而且漏放了一張圖！要是被強哥看到肯定會被笑三個月。趁還沒 push 到遠端，使用 git commit --amend 替換目前分支的最新提交；原提交仍可能由 reflog 找到。',
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
    id: "19",
    title: '切換任務：Stash 保留與衝突',
    difficulty: "初階 ⭐⭐",
    category: "上下文切換",
    story: "暫存索引、工作區和未追蹤檔案後切去修復 main。原功能分支又改了同一檔案，pop 產生衝突；解決後確認 stash 尚在，完成提交再 drop。",
    goals: ["git stash push -u 保存 cart.py 與 coupon.py", "git switch main，修改 app.py 修復並提交", "git switch feature/cart，把 cart.py 改成 cartWithTax(); 並提交", "git stash pop --index，觀察同檔衝突與保留的 stash", "將 cart.py 解成 cartWithTaxAndDiscount();，保留 coupon.py，add、commit，最後 stash drop"],
    hints: ["初始 cart.py 已有 staged 與 unstaged 兩種快照；--index 嘗試恢復索引", "main 必須修改 app.py；功能分支中途提交 cartWithTax();", "pop 衝突時 stash 不會自動移除。解決、確認內容並提交後才 drop。"],
    setup: (git) => {
      const base = git.createCommit({ message: 'feat: base', tree: new Map([['app.py', 'runBuggy();\n'], ['cart.py', 'cart();\n']]) });
      git.branches.set('main', base.id); git.branches.set('feature/cart', base.id); git.checkoutOrSwitch('feature/cart');
      git.index.set('cart.py', 'cartWithDiscount();\n'); git.workingTree.set('cart.py', 'cartWithDiscountDraft();\n');
      git.workingTree.set('coupon.py', 'SUMMER_50\n');
      git.scenarioMeta = { baseId: base.id, resolved: 'cartWithTaxAndDiscount();\n', coupon: 'SUMMER_50\n' };
    },
    checkGoal: (git) => {
      const main = git.commits.get(git.branches.get('main')), head = git.getHeadCommit();
      if (!main || main.id === git.scenarioMeta.baseId || main.tree.get('app.py') === 'runBuggy();\n') return { passed: false, message: '先保存工作進度，再於 main 修改 app.py 並提交修復。' };
      if (!git.hasStashConflict || git.getCurrentBranch() !== 'feature/cart' || !head || head.tree.get('cart.py') !== git.scenarioMeta.resolved || head.tree.get('coupon.py') !== git.scenarioMeta.coupon || git.stash.length || git.conflictState) return { passed: false, message: '需要實際 pop 衝突、保留未追蹤檔案、解決並提交，最後 drop 留存的 stash。' };
      return { passed: true, message: '已保存快照、處理 pop 衝突並清理留存的 stash。' };
    }
  },

  {
    id: '20',
    title: '整理檔案：更名與清理預覽',
    difficulty: '初階 ⭐⭐',
    category: '工作區維護',
    story: '你想整理專案目錄，想重新命名檔案並同步暫存；Git 會依內容相似度推斷更名；加上編譯噴出的一堆 .tmp 垃圾檔，工作區髒到不行。先用 git clean -nd 預覽清理範圍，確認後再 -fd。',
    goals: [
      '使用 git mv utils.py helpers.py 完成檔案更名並加入暫存',
      '先 git clean -nd 預覽，再 git clean -fd 清除未追蹤的 dump.tmp 與 temp_test/',
      '提交更名變更：git commit -m "refactor: rename utils to helpers"'
    ],
    hints: [
      '更名指令：git mv utils.py helpers.py',
      '預覽：git clean -nd；確認後清理：git clean -fd',
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
      if (!git.cleanDryRun?.includes('dump.tmp')) return { passed: false, message: '刪除前必須用 git clean -nd 預覽未追蹤檔案。' };
      if (!head || !head.tree.has('helpers.py')) {
        return { passed: false, message: '尚未完成 helpers.py 提交！請使用 git mv utils.py helpers.py 並 commit。' };
      }
      if (git.workingTree.has('dump.tmp') || git.workingTree.has('temp_test/cache.pid')) {
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
    title: '觀察遠端：Fetch 與 Pull',
    difficulty: '進階 ⭐⭐⭐',
    category: '遠端協作',
    story: '接手團隊的開源專案 Fork，你一直搞不懂為什麼前輩們都說「沒事不要亂 git pull，先 fetch 看看」。請學會配置 upstream 遠端，先用 git fetch 安全探查遠端動靜，再有把握地下達合併指令，避免盲目 pull 踩雷！',
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
    title: '移走誤提交：分支與 Reset',
    difficulty: '初階 ⭐⭐',
    category: '災難平移',
    story: '菜鳥最大禁忌：你埋頭苦幹了兩個小時、連做了兩個 commit，猛然抬頭看終端機——天啊！當前分支居然是 main！強哥正拿著咖啡從走廊走過來，請用「開新分支貼標籤 + 把 main reset 退回」的移花接木大法，在神不知鬼不覺間拯救主線！',
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
    title: '探索物件：Commit、Tree 與 Blob',
    difficulty: '進階 ⭐⭐⭐',
    category: '底層物件',
    story: '強哥對你說：「如果你只會 add 和 commit，那你只是個打字機；懂了 .git 物件資料庫，你才真正懂 Git。」請化身底層駭客，git cat-file 是讀取物件，不是解密。Git 預設常用 SHA-1，亦可建立 SHA-256 倉庫；請用 git cat-file 剖析 blob、tree 與 commit 物件的真實骨架，讓前輩對你刮目相看！',
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

// Export for browser and node
if (typeof window !== 'undefined') {
  window.SCENARIOS = SCENARIOS;
}
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { SCENARIOS };
}
