/**
 * COMMAND_GUIDES - 24 大關卡指令深度教室與實戰語法變體庫
 * 為學習者提供：
 * 1. 職場情境現場 (Role & Situation)
 * 2. 引導式解題步驟與指令脈絡 (Guided Steps: 為什麼要下這個指令？它具體做了什麼？)
 * 3. 核心指令變體比對 (Command Variations with click-to-paste)
 * 4. 業界主流決策脈絡 (Why Command selection context)
 * 5. 避坑指南與實戰防線 (Pitfalls & Pro-Tips)
 */

const COMMAND_GUIDES = {
  '00': {
      "targetCommand": "git config user.name \"Alex Chen\" → git config user.email \"alex@example.com\"",
      "summary": "設定提交作者。作者身分不提供 SSH 或 HTTPS 的登入權限；連線診斷另於第 40 關練習。",
      "guidedSteps": [
          {
              "step": 1,
              "cmd": "git config user.name \"Alex Chen\"",
              "category": "required",
              "why": "記錄提交作者名稱。"
          },
          {
              "step": 2,
              "cmd": "git config user.email \"alex@example.com\"",
              "category": "required",
              "why": "記錄作者信箱；依託管服務規則匹配帳號。"
          }
      ],
      "variations": [
          {
              "cmd": "git config --global user.name \"Alex Chen\"",
              "desc": "所有本機倉庫的預設作者，個別倉庫設定可覆寫。"
          },
          {
              "cmd": "git config push.autoSetupRemote true",
              "desc": "選用：在預設 simple/current/upstream 推送時，首次推送可自動設定 upstream。"
          }
      ],
      "pitfalls": [
          "push.autoSetupRemote 不會自動推送；使用者仍需執行 git push。"
      ]
  },

  '01': {
    targetCommand: 'git add .',
    summary: '將工作目錄中所有修改與新增的檔案送入暫存區 (Staging Area)，準備建立第一個正式 Commit。',
    scenarioContext: {
      role: '剛到職的菜鳥工程師',
      situation: '強哥交給你第一份需求任務，你在本地寫好第一版程式。此時這些檔案尚未被 Git 版本控管追蹤（Untracked）。身為剛到職的新人，你需要理解工作區、暫存區與版本庫三層流動，謹慎拍下第一個正式快照！'
    },
    guidedSteps: [
      {
        step: 1,
        cmd: 'git status',
        category: 'required',
        why: '審視工作目錄狀態，確認有哪些未追蹤 (untracked) 的新檔案。'
      },
      {
        step: 2,
        cmd: 'git add .',
        category: 'required',
        why: '將當前目錄及子目錄下的所有新檔案一次打包推進暫存區，備妥待拍快照。'
      },
      {
        step: 3,
        cmd: 'git commit -m "feat: initial commit"',
        category: 'required',
        why: '正式拍下快照建立第一個版本歷史節點 (Commit)，附上職責明確的提交訊息。'
      },
      {
        step: 4,
        cmd: 'git status -s',
        category: 'optional',
        why: '以極簡雙欄程式碼（如 ?? 代表未追蹤、M 代表修改）呈現狀態，檔案繁多時能光速掃描變更。'
      },
      {
        step: 5,
        cmd: 'git commit -v',
        category: 'optional',
        why: '在編輯提交訊息時直接在下方帶出本次完整 diff，方便提交前做最後自我程式碼審查，防止誤交雜質程式碼。'
      }
    ],
    variations: [
      {
        cmd: 'git add <檔案名稱>',
        name: '指定單一檔案暫存',
        desc: '精確安全。只將指名的單一檔案加入暫存區，其他改動完全不受影響。適合檔案較多但想分開提交時。',
        isPopular: false
      },
      {
        cmd: 'git add .',
        name: '當前目錄與子目錄全包暫存',
        desc: '將當前目錄（及所有遞迴子目錄）下的所有新增 (untracked) 與修改 (modified) 批次加入暫存區。',
        isPopular: true,
        popularReason: '常見用途：日常完成一個完整功能時，搭配 .gitignore 批次提交速度最快、心智負擔最低！'
      },
      {
        cmd: 'git add -A (或 --all)',
        name: '整個 repo 所有層級全包暫存',
        desc: '無視目前終端機所在的子目錄位置，強制將整個 Git Repository 根目錄下所有新增、修改、刪除全部暫存。',
        isPopular: false
      },
      {
        cmd: 'git add -p (或 --patch)',
        name: '互動式逐塊 (Hunk) 挑選暫存',
        desc: '逐塊顯示程式碼變更並詢問 (y/n/s/e)。資深工程師自我 Code Review、拆分巨大 Commit 的頂級武器。',
        isPopular: false
      }
    ],
    whyPopularTitle: '為什麼大部分開發者都習慣敲 git add . ？',
    whyPopularContent: '在敏捷迭代中，一個功能的實作通常涵蓋 HTML、CSS、JS 或數個模組檔案。在專案已配置完善 `.gitignore` 的前提下，逐一輸入檔案名稱非常繁瑣且容易遺漏關聯檔；`git add .` 能在 1 秒內打包當前工作目錄的所有改動，是最流暢自然的開發節奏。',
    pitfalls: [
      '⚠️ 關鍵防坑：若專案沒有撰寫或漏寫了 `.gitignore`，`git add .` 會把包含帳密金鑰的 `.env`、幾百 MB 的 `node_modules` 或編譯輸出暫存檔一口氣全部塞進版本庫！',
      '💡 黃金 SOP：習慣執行 `git add .` 後，先敲一下 `git status` 用肉眼掃一眼綠色清單確認無誤，再執行 `git commit`。'
    ]
  },

  '02': {
      "targetCommand": "git switch -c feature/login → git add app.js → git commit -m \"feat: add login\" → git switch main → git merge feature/login",
      "summary": "先建立有實際差異的功能提交，再把 main 快進到該提交。",
      "guidedSteps": [
          {
              "step": 1,
              "cmd": "git switch -c feature/login",
              "category": "required",
              "why": "建立功能分支。接著在檔案頁修改 app.js。"
          },
          {
              "step": 2,
              "cmd": "git add app.js",
              "category": "required",
              "why": "保存新功能快照。"
          },
          {
              "step": 3,
              "cmd": "git commit -m \"feat: add login\"",
              "category": "required",
              "why": "建立真正包含變更的提交。"
          },
          {
              "step": 4,
              "cmd": "git switch main",
              "category": "required",
              "why": "回到原主線。"
          },
          {
              "step": 5,
              "cmd": "git merge feature/login",
              "category": "required",
              "why": "main 是功能分支祖先時，預設可快進指標。"
          }
      ],
      "variations": [],
      "pitfalls": []
  },

  '03': {
    targetCommand: 'git merge feature/dark-mode',
    summary: '合併兩條分叉歷史，解讀 <<<<<<< 與 >>>>>>> 衝突標記，手動保留最佳程式碼完成三方合併。',
    scenarioContext: {
      role: '協同合作工程師',
      situation: '雙分支平行開發時，小明前輩在 main 修改了 style.css 的主題顏色，而你在 feature/dark-mode 也修改了同一行。當你嘗試執行 git merge 時，Git 無法猜測該聽誰的，終端機噴出紅字 CONFLICT！'
    },
    guidedSteps: [
      {
        step: 1,
        cmd: 'git merge feature/dark-mode',
        category: 'required',
        why: '啟動分支合併流程，Git 偵測到兩端修改重疊，暫停並在檔案中寫入衝突標記。'
      },
      {
        step: 2,
        cmd: '編輯 style.css 移除 <<<<<<< 與 >>>>>>> 標記',
        category: 'required',
        why: '由人腦判斷保留兩端的最佳實作，刪除 Git 注入的標記符號。'
      },
      {
        step: 3,
        cmd: 'git add style.css',
        category: 'required',
        why: '告訴 Git 該檔案的衝突已經妥善解決，標記已解決狀態。'
      },
      {
        step: 4,
        cmd: 'git commit -m "merge: resolve dark mode conflict"',
        category: 'required',
        why: '完成三方合併並產生正式的 Merge Commit。'
      },
      {
        step: 5,
        cmd: 'git merge --abort',
        category: 'optional',
        why: '當衝突過於混亂、不小心合錯分支或需要退回原點重來時，一鍵安全取消合併並完全復原工作區。'
      },
      {
        step: 6,
        cmd: 'git diff --check',
        category: 'optional',
        why: '在送出合併提交前快速掃描所有檔案，主動抓出殘留的衝突標記符號與行尾多餘空白。'
      }
    ],
    variations: [
      {
        cmd: 'git merge <目標分支>',
        name: '標準分支合併 (Auto 3-way Merge)',
        desc: '若有分叉則觸發三方合併演算法；若修改重疊則暫停並在檔案中寫入衝突標記。',
        isPopular: true,
        popularReason: '保留完整的分支脈絡與共同祖先的演化歷程。'
      },
      {
        cmd: 'git merge --no-ff <目標分支>',
        name: '強制產生 Merge Commit',
        desc: '即便可以快進 (Fast-Forward)，仍強制建立一個合併節點，清晰標記功能分支起訖點。',
        isPopular: false
      },
      {
        cmd: 'git merge --abort',
        name: '一鍵放棄合併 (緊急撤退神技)',
        desc: '當衝突太複雜或不小心合錯分支時，一鍵光速復原回合併前的乾淨狀態。',
        isPopular: true,
        popularReason: '【★ 解衝突必備後路】救命專用，手忙腳亂時隨時重頭來過。'
      }
    ],
    whyPopularTitle: '衝突標記的本質：什麼是 HEAD 與 incoming？',
    whyPopularContent: '衝突標記中：`<<<<<<< HEAD` 代表你「當前所在分支」的原有程式碼；`=======` 是分隔線；`>>>>>>> 分支名` 代表你「試圖合併進來」的對方程式碼。解決衝突就是由工程師人工挑選哪一段要留下、或兩者截長補短合併，最後刪掉這三行標記即可。',
    pitfalls: [
      '⚠️ 致命失誤：切勿把 `<<<<<<<` 或 `=======` 等標記留在原始碼中提交，會造成編譯錯誤或上線白畫面！',
      '💡 解完衝突流程：手動編輯檔案 ➜ 存檔 ➜ `git add <檔名>` 標記已解決 ➜ `git commit` 完成合併。'
    ]
  },

  '04': {
    targetCommand: 'git rebase main',
    summary: '將當前分支的基底 (Base) 重新嫁接至 main 最新節點之後，保持 Git 樹筆直無菱形分叉。',
    scenarioContext: {
      role: '開源 / 大廠專案開發者',
      situation: '你在 feature 分支埋頭開發，此時 main 分支有了小明前輩的新進度。強哥在 Slack 嚴厲警告：提 PR 前必須先 rebase main，保持歷史一條線，杜絕雜亂無章的菱形 Merge Commit 蛛網！'
    },
    guidedSteps: [
      {
        step: 1,
        cmd: 'git rebase main',
        category: 'required',
        why: '將當前 feature 分支的提交暫存抽起，將基底移到 main 最新頂端後重新逐一重放，消除歷史分叉。'
      },
      {
        step: 2,
        cmd: 'git switch main',
        category: 'required',
        why: '切換回主線 main，準備接納已經線性化的功能分支。'
      },
      {
        step: 3,
        cmd: 'git merge feature',
        category: 'required',
        why: '因為已經完成 rebase，此時合併直接觸發 Fast-Forward 快進，完美保持單一直線！'
      },
      {
        step: 4,
        cmd: 'git rebase --abort',
        category: 'optional',
        why: 'rebase 過程中若遇到混亂衝突或操作失誤，一鍵放棄 rebase 並將分支指標完全還原至操作前。'
      },
      {
        step: 5,
        cmd: 'git rebase --continue',
        category: 'optional',
        why: '在手動解決當前步驟衝突並執行 git add 標記後，通知 Git 繼續套用後續提交（rebase 時嚴禁執行 git commit）。'
      }
    ],
    variations: [
      {
        cmd: 'git rebase <目標基準分支>',
        name: '標準 rebase (Rebase)',
        desc: '暫存當前分支的新 Commit，將基底移到目標分支最新點，再依序重放提交。',
        isPopular: true,
        popularReason: '【★ 頂級開源與大廠規範】保持歷史線條筆直如一，杜絕雜亂無章的 Merge Commit 蛛網！'
      },
      {
        cmd: 'git rebase --continue',
        name: '解決衝突後繼續 rebase',
        desc: 'rebase 過程中若遇到衝突，解完並 git add 後執行此指令繼續套用下一個提交。',
        isPopular: true,
        popularReason: 'rebase 時不要敲 git commit，一律用 git rebase --continue 推進。'
      },
      {
        cmd: 'git rebase --abort',
        name: '放棄 rebase 回到原點',
        desc: '遇到複雜衝突或嫁接錯誤時，一鍵還原回 rebase 前的分支狀態。',
        isPopular: true,
        popularReason: 'rebase 出錯時的絕對安全閥。'
      }
    ],
    whyPopularTitle: 'Merge vs Rebase：大廠團隊究竟怎麼選？',
    whyPopularContent: '`merge` 的優點是忠實記錄歷史時間軸，缺點是多人頻繁合併會產生大量交叉節點與無意義的 "Merge branch..." 噪音；`rebase` 則將歷史線性化（Linear History），讓 `git log` 如同故事書般順暢好讀，且大幅簡化未來 `git bisect` 捉蟲難度。許多團隊規定在提 PR 前必須先 rebase main。',
    pitfalls: [
      '🚨 REBASE 黃金禁忌：絕對不要對「已經 push 到公開共享分支（如 main/master）」的提交進行 Rebase！只在自己未 push 的 local 私人功能分支使用。',
      '💡 解衝突差異：rebase 是一步步重放 commit，因此一個分支若有多個 commit 可能會需要連續解決多次衝突。'
    ]
  },

  '05': {
      "targetCommand": "git rebase -i HEAD~2 → git log --oneline",
      "summary": "本關 scaffold 之上有兩筆草稿；以 HEAD~2 為基底把它們整理成一筆。",
      "guidedSteps": [
          {
              "step": 1,
              "cmd": "git rebase -i HEAD~2",
              "category": "required",
              "why": "第一行保持 pick，第二行改 squash 或 fixup。"
          },
          {
              "step": 2,
              "cmd": "git log --oneline",
              "category": "required",
              "why": "確認只有一筆功能提交且 payment.js 最終內容完整。"
          }
      ],
      "variations": [
          {
              "cmd": "git reset --soft HEAD~2",
              "desc": "另一種重整方式：保留索引內容，再重新 commit；本關主解法是 rebase -i。"
          },
          {
              "cmd": "git commit --amend",
              "desc": "只能修補最新提交，單獨執行不會合併兩個既有提交。"
          }
      ],
      "pitfalls": [
          "rebase 會改寫提交 ID；已共享歷史需要先與團隊協調。",
          "squash 可編輯合併訊息；fixup 通常採前一筆訊息，本關還需將 wip 訊息改成有意義的功能名稱。"
      ]
  },

  '06': {
    targetCommand: 'git pull --rebase origin main',
    summary: '解決遠端他人搶先 push 導致的 Non-Fast-Forward push 被拒，將本地提交優雅嫁接至遠端最新進度之上。',
    scenarioContext: {
      role: '團隊協作開發者',
      situation: '你在本機辛勤寫完功能，自信滿滿敲下 git push，終端機卻爆出 [rejected - non-fast-forward]！原來是小明前輩搶先一步把他的新進度推上了遠端 main，導致遠端版本超前了你的基準點。切勿 force push 覆蓋，改用 pull --rebase 優雅解套！'
    },
    guidedSteps: [
      {
        step: 1,
        cmd: 'git push origin main (觀察 rejected 錯誤)',
        category: 'required',
        why: '理解 Git 為了避免直接覆蓋他人程式碼的安全防護機制。'
      },
      {
        step: 2,
        cmd: 'git pull --rebase origin main',
        category: 'required',
        why: '先 pull 遠端最新程式碼，並把自己的本地提交優雅嫁接在最新頂端，杜絕菱形交叉節點。'
      },
      {
        step: 3,
        cmd: 'git push origin main',
        category: 'required',
        why: '本地已整合遠端且保持線性超前，再次 push 順利放行！'
      },
      {
        step: 4,
        cmd: 'git push --force-with-lease',
        category: 'optional',
        why: '租約依據預期的遠端參照值拒絕不符更新；預設值依賴 remote-tracking ref，背景 fetch 可能更新該值，必要時明確指定 expected hash。'
      }
    ],
    variations: [
      {
        cmd: 'git pull --rebase origin <branch>',
        name: 'pull 並 rebase (Pull with Rebase)',
        desc: '先將本地新增的提交抽起，pull 遠端最新程式碼，再把本地提交嫁接在最新頂端。',
        isPopular: true,
        popularReason: '【★ 現代團隊標準規範】杜絕團隊日誌中充斥著 "Merge branch \'main\' of github.com" 垃圾節點！'
      },
      {
        cmd: 'git pull origin <branch>',
        name: '傳統 pull (Fetch + Merge)',
        desc: '預設以 merge 方式 pull，若本地與遠端有分叉，會強制產生一個菱形合併節點。',
        isPopular: false
      },
      {
        cmd: 'git config --global pull.rebase true',
        name: '設定全域 pull 預設一律使用 rebase',
        desc: '一次設定，未來只要敲 git pull 自動執行 --rebase 模式。',
        isPopular: true,
        popularReason: '團隊新手救星，防止不經意產生 merge commit。'
      }
    ],
    whyPopularTitle: '為什麼 Git 拒絕你的 push (rejected - non-fast-forward)？',
    whyPopularContent: '因為在你看不到的地方，同事已經搶先 push 了新 Commit，導致遠端 main 的版本超前於你開工時的基準點。Git 為了保護團隊程式碼不被覆蓋，強制要求你必須先 pull 遠端最新版並整合成功後，才允許 push。',
    pitfalls: [
      '⚠️ 衝突排查：pull --rebase 遇到衝突時，請在解完衝突並 `git add` 後執行 `git rebase --continue`，切勿執行 git commit！',
      '💡 避坑指南：切勿使用 `git push --force` 強推覆蓋，這會直接抹煞同事辛苦寫好的程式碼。'
    ]
  },

  '07': {
      "targetCommand": "git log experimental --oneline → git cherry-pick sec001 → git cherry-pick --abort → git cherry-pick sec001 → git add auth.js → git cherry-pick --continue",
      "summary": "Cherry-pick 套用指定提交相對親代的差異，可能與目前分支衝突。",
      "guidedSteps": [
          {
              "step": 1,
              "cmd": "git log experimental --oneline",
              "category": "required",
              "why": "找出 sec001 的修復。"
          },
          {
              "step": 2,
              "cmd": "git cherry-pick sec001",
              "category": "required",
              "why": "在 main 套用修復並觀察衝突。"
          },
          {
              "step": 3,
              "cmd": "git cherry-pick --abort",
              "category": "required",
              "why": "放棄本次套用，回復開始前的 main。"
          },
          {
              "step": 4,
              "cmd": "git cherry-pick sec001",
              "category": "required",
              "why": "重新嘗試；在檔案頁把 auth.js 改成 authorizeWithAuditAndValidation();。"
          },
          {
              "step": 5,
              "cmd": "git add auth.js",
              "category": "required",
              "why": "標記衝突已解決。"
          },
          {
              "step": 6,
              "cmd": "git cherry-pick --continue",
              "category": "required",
              "why": "建立修復提交，保留實驗功能在原分支。"
          }
      ],
      "variations": [],
      "pitfalls": []
  },

  '08': {
      "targetCommand": "git reflog → git reset --hard lost99",
      "summary": "Reflog 記錄本機參照移動，可用來尋找誤 reset 的提交。",
      "guidedSteps": [
          {
              "step": 1,
              "cmd": "git reflog",
              "category": "required",
              "why": "尋找原本 HEAD 的提交 ID。"
          },
          {
              "step": 2,
              "cmd": "git reset --hard lost99",
              "category": "required",
              "why": "回到該提交；先確認目前沒有需要保存的未提交修改。"
          }
      ],
      "variations": [
          {
              "cmd": "git branch rescue lost99",
              "desc": "先建立引用保存提交，再決定是否移動目前分支。"
          }
      ],
      "pitfalls": [
          "reflog 有到期政策，無引用物件可能被垃圾回收；它不是永久備份，也不會隨 push 分享。",
          "從未 add 或 commit 的檔案不會由 reflog 保存。"
      ]
  },

  '09': {
    "targetCommand": "git worktree add -b hotfix-p0 ../hotfix main → cd ../hotfix → 提交修復 → git switch main → git merge hotfix-p0 → cd .. → git worktree remove ../hotfix",
    "summary": "Linked worktree 共用提交與分支參照，但各有 HEAD、索引與工作區。",
    "guidedSteps": [
        {
            "step": 1,
            "cmd": "git worktree add -b hotfix-p0 ../hotfix main",
            "category": "required",
            "why": "從 main 在另一目錄開修復分支。"
        },
        {
            "step": 2,
            "cmd": "cd ../hotfix",
            "category": "required",
            "why": "進入新的工作區，修改 app.js。"
        },
        {
            "step": 3,
            "cmd": "git add app.js",
            "category": "required",
            "why": "只暫存修復內容。"
        },
        {
            "step": 4,
            "cmd": "git commit -m \"fix: production bug\"",
            "category": "required",
            "why": "在 hotfix-p0 保存修復。"
        },
        {
            "step": 5,
            "cmd": "git switch main",
            "category": "required",
            "why": "在 linked worktree 切到 main；原工作區仍在 feature。"
        },
        {
            "step": 6,
            "cmd": "git merge hotfix-p0",
            "category": "required",
            "why": "將修復整合到主線，保留原 feature 的未提交修改。"
        },
        {
            "step": 7,
            "cmd": "cd ..",
            "category": "required",
            "why": "模擬器返回主工作區；真實 CLI 應 cd 回原倉庫路徑。"
        },
        {
            "step": 8,
            "cmd": "git worktree remove ../hotfix",
            "category": "required",
            "why": "乾淨的工作區可移除；分支及提交仍保留。"
        }
    ],
    "variations": [
        {
            "cmd": "git worktree list",
            "desc": "列出各工作區與分支。"
        }
    ],
    "pitfalls": [
        "不能在兩個 worktree 同時檢出同一分支。",
        "僅建立 hotfix 分支不算完成；必須進入另一個目錄並提交，原 feature WIP 要保留。"
    ]
},

  '10': {
      "targetCommand": "git bisect start → git bisect bad → git bisect good c1000 → git bisect good → git bisect reset",
      "summary": "透過 good/bad 縮小範圍，直到定位第一個錯誤版本，最後恢復原本 HEAD。",
      "guidedSteps": [
          {
              "step": 1,
              "cmd": "git bisect start",
              "category": "required",
              "why": "啟動搜尋。"
          },
          {
              "step": 2,
              "cmd": "git bisect bad",
              "category": "required",
              "why": "標記原始最新版為錯誤。"
          },
          {
              "step": 3,
              "cmd": "git bisect good c1000",
              "category": "required",
              "why": "標記已知正確版本。"
          },
          {
              "step": 4,
              "cmd": "git bisect good",
              "category": "required",
              "why": "檢查當前 calc.js：result=2 時標 good；result=3 時改執行 bisect bad。重複直到找到第一個壞提交。"
          },
          {
              "step": 5,
              "cmd": "git bisect reset",
              "category": "required",
              "why": "結束搜尋並回到原本分支。"
          }
      ],
      "variations": [
          {
              "cmd": "git bisect bad",
              "desc": "當前版本測試失敗。"
          },
          {
              "cmd": "git bisect skip",
              "desc": "當前版本無法測試；太多跳過版本可能無法唯一定位。"
          }
      ],
      "pitfalls": [
          "必須依實際檔案結果標記；只啟動 bisect 不表示已找到原因。"
      ]
  },

  '11': {
      "targetCommand": "git config core.hooksPath .githooks → chmod +x .githooks/pre-commit → git commit -m \"test: blocked secret\" → git add config.env → git commit -m \"chore: remove secret\"",
      "summary": "體驗本機 hook 攔截假密鑰，移除後正常提交。",
      "guidedSteps": [
          {
              "step": 1,
              "cmd": "git config core.hooksPath .githooks",
              "category": "required",
              "why": "指定本機 hooks 所在目錄。"
          },
          {
              "step": 2,
              "cmd": "chmod +x .githooks/pre-commit",
              "category": "required",
              "why": "讓 hook 可執行。"
          },
          {
              "step": 3,
              "cmd": "git commit -m \"test: blocked secret\"",
              "category": "required",
              "why": "已暫存假密鑰；此提交應被拒絕。接著在檔案頁移除密鑰。"
          },
          {
              "step": 4,
              "cmd": "git add config.env",
              "category": "required",
              "why": "更新索引中的乾淨內容。"
          },
          {
              "step": 5,
              "cmd": "git commit -m \"chore: remove secret\"",
              "category": "required",
              "why": "通過檢查後正常建立提交。"
          }
      ],
      "variations": [
          {
              "cmd": "git commit --no-verify",
              "desc": "略過 pre-commit 與 commit-msg 等可略過的 hooks；本關不以 bypass 作成功條件。"
          }
      ],
      "pitfalls": [
          "本機 hooks 不會自動傳給所有 clone，也可被略過；不能作為安全保證。",
          "已洩漏的密鑰需撤銷與輪替，不是移除文字就恢復安全。"
      ]
  },

  '12': {
      "targetCommand": "git add -p shopping.py → git diff --staged → git commit -m \"fix: discount\"",
      "summary": "局部暫存同檔案的獨立 hunk，只提交折扣修復。",
      "guidedSteps": [
          {
              "step": 1,
              "cmd": "git add -p shopping.py",
              "category": "required",
              "why": "第一個 hunk y，第二個 n。"
          },
          {
              "step": 2,
              "cmd": "git diff --staged",
              "category": "required",
              "why": "確認只暫存 return price * 0.9。"
          },
          {
              "step": 3,
              "cmd": "git commit -m \"fix: discount\"",
              "category": "required",
              "why": "格式的 TOTAL 修改仍留在工作區。"
          }
      ],
      "variations": [],
      "pitfalls": []
  },

  '13': {
      "targetCommand": "git rm --cached .env → git add .gitignore → git commit -m \"chore: untrack .env\"",
      "summary": "Gitignore 不影響已追蹤檔案；rm --cached 移除索引追蹤，保留本機檔案。",
      "guidedSteps": [
          {
              "step": 1,
              "cmd": "git rm --cached .env",
              "category": "required",
              "why": "將 .env 從下一次提交中移除，工作區仍保留。"
          },
          {
              "step": 2,
              "cmd": "git add .gitignore",
              "category": "required",
              "why": "提交 .env 排除規則。"
          },
          {
              "step": 3,
              "cmd": "git commit -m \"chore: untrack .env\"",
              "category": "required",
              "why": "HEAD 必須不再含 .env 並含 .gitignore。"
          }
      ],
      "variations": [],
      "pitfalls": [
          "此操作不會清除既有歷史的密鑰；外洩時先撤銷並輪替。"
      ]
  },

  '14': {
      "targetCommand": "git show HEAD → git revert -m 1 HEAD",
      "summary": "合併有多個 parent，revert -m 必須選擇用哪一個 parent 當差異基準。",
      "guidedSteps": [
          {
              "step": 1,
              "cmd": "git show HEAD",
              "category": "required",
              "why": "檢查 Merge 提交的親代與內容。"
          },
          {
              "step": 2,
              "cmd": "git revert -m 1 HEAD",
              "category": "required",
              "why": "相對第一個 parent 反轉合併的變更，新增提交並保留原合併。"
          }
      ],
      "variations": [],
      "pitfalls": [
          "-m 1 是 parent 編號，不是提交訊息。",
          "以後重新 merge 同一分支不會自動重新引入所有被 revert 的變更；需評估 revert-the-revert 或新的修復提交。"
      ]
  },

  '15': {
      "targetCommand": "git tag -a v1.0.0 -m \"Release v1.0.0\" → git tag -a v0.9.0 cAuth -m \"Beta v0.9.0\" → git show v1.0.0",
      "summary": "附註標籤記錄標記者、時間與訊息；附註不等於密碼學簽章。",
      "guidedSteps": [
          {
              "step": 1,
              "cmd": "git tag -a v1.0.0 -m \"Release v1.0.0\"",
              "category": "required",
              "why": "標記目前 HEAD。"
          },
          {
              "step": 2,
              "cmd": "git tag -a v0.9.0 cAuth -m \"Beta v0.9.0\"",
              "category": "required",
              "why": "標記指定歷史提交。"
          },
          {
              "step": 3,
              "cmd": "git show v1.0.0",
              "category": "required",
              "why": "檢查附註與指向內容。"
          }
      ],
      "variations": [
          {
              "cmd": "git push origin v1.0.0",
              "desc": "只同步指定標籤。"
          },
          {
              "cmd": "git tag -s <tag>",
              "desc": "建立簽署標籤，需先配置簽章金鑰。"
          }
      ],
      "pitfalls": [
          "推送標籤不會自動建立 GitHub Release；CI/CD 或 release 自動化需要另行設定。"
      ]
  },

  '16': {
      "targetCommand": "git log -S \"CRITICAL_SECRET_TOKEN\" --oneline → git blame db.js",
      "summary": "Pickaxe -S 搜尋指定字串出現次數發生變化的提交；blame 查目前行的來源。",
      "guidedSteps": [
          {
              "step": 1,
              "cmd": "git log -S \"CRITICAL_SECRET_TOKEN\" --oneline",
              "category": "required",
              "why": "搜尋字串數量變化，不是搜尋變數的語意。"
          },
          {
              "step": 2,
              "cmd": "git blame db.js",
              "category": "required",
              "why": "檢查目前每行最近的來源提交。"
          }
      ],
      "variations": [
          {
              "cmd": "git log -G <regex>",
              "desc": "搜尋 patch 新增或刪除行中匹配 regex 的變更。"
          },
          {
              "cmd": "git blame -w db.js",
              "desc": "忽略空白差異，仍需人工理解上下文。"
          }
      ],
      "pitfalls": []
  },

  '17': {
      "targetCommand": "git config rerere.enabled true → git merge feature/api → git add server.js → git commit -m \"merge: resolve server conflict\" → git reset --hard main-before → git merge feature/api → git add server.js → git commit -m \"merge: reuse checked resolution\"",
      "summary": "Rerere 記錄已解決內容衝突；再次遇到相同 conflict preimage 時重用。",
      "guidedSteps": [
          {
              "step": 1,
              "cmd": "git config rerere.enabled true",
              "category": "required",
              "why": "在第一次衝突前啟用。"
          },
          {
              "step": 2,
              "cmd": "git merge feature/api",
              "category": "required",
              "why": "觸發衝突，把 server.js 改為 serveLtsAndAsync();。"
          },
          {
              "step": 3,
              "cmd": "git add server.js",
              "category": "required",
              "why": "暫存手動解法。"
          },
          {
              "step": 4,
              "cmd": "git commit -m \"merge: resolve server conflict\"",
              "category": "required",
              "why": "完成第一次合併並記錄解法。"
          },
          {
              "step": 5,
              "cmd": "git reset --hard main-before",
              "category": "required",
              "why": "本練習回到第一次合併之前的主線。"
          },
          {
              "step": 6,
              "cmd": "git merge feature/api",
              "category": "required",
              "why": "再次出現相同衝突，觀察解法重用。"
          },
          {
              "step": 7,
              "cmd": "git add server.js",
              "category": "required",
              "why": "檢查結果後重新暫存；rerere 不等於自動完成提交。"
          },
          {
              "step": 8,
              "cmd": "git commit -m \"merge: reuse checked resolution\"",
              "category": "required",
              "why": "完成第二次合併。"
          }
      ],
      "variations": [
          {
              "cmd": "git rerere status",
              "desc": "查看正在記錄的衝突。"
          },
          {
              "cmd": "git rerere diff",
              "desc": "查看解法差異。"
          }
      ],
      "pitfalls": [
          "即使成功重用，也必須確認內容與測試；不同衝突可能無法重用。"
      ]
  },

  '18': {
    targetCommand: 'git commit --amend -m "feat: release v1.0.0"',
    summary: '完美補完：剛送出 Commit 卻發現漏加了一個檔案或有筆誤？在目前分支替換最新提交，保留清楚的功能訊息。',
    scenarioContext: {
      role: '專案開發者',
      situation: '剛按 Enter 送出 commit，才猛然發現漏放了圖檔，且提交訊息打錯了一個字母。如果被強哥看見肯定會被碎念，尚未共享前可使用 amend 修補最新提交；這會建立新的提交 ID，原提交仍可能在 reflog 中。'
    },
    guidedSteps: [
      {
        step: 1,
        cmd: 'git add assets/logo.png',
        category: 'required',
        why: '將遺漏的檔案加入暫存區，準備補入最新一筆提交。'
      },
      {
        step: 2,
        cmd: 'git commit --amend -m "feat: release v1.0.0"',
        category: 'required',
        why: '將暫存變更融合進最新提交，並同步更正打錯字的提交訊息。'
      },
      {
        step: 3,
        cmd: 'git commit --amend --no-edit',
        category: 'optional',
        why: '追加暫存區檔案至最新提交，但保留原有的提交訊息不變。'
      }
    ],
    variations: [
      {
        cmd: 'git commit --amend -m "新訊息"',
        name: '修改最後一筆 Commit 訊息',
        desc: '不改程式碼，純粹修正最新提交的打字錯誤 (Typo) 或補充說明。',
        isPopular: true,
        popularReason: '打錯標題時的快速救星。'
      },
      {
        cmd: 'git commit --amend --no-edit',
        name: '追補檔案不改訊息',
        desc: '將當前暫存區的新變更直接融合進最新的一筆 Commit，保持原有訊息不變。',
        isPopular: true,
        popularReason: '【★ 日常高頻修補手勢】剛 commit 完才發現漏存一個檔案時的最優解！'
      }
    ],
    whyPopularTitle: '何時適合修補最後一筆提交？',
    whyPopularContent: '尚未共享的最後一筆提交可用 amend 補上漏檔與修正訊息。若歷史已被他人使用，新增修正提交通常更容易協作；是否改寫依團隊政策與依賴情況決定。',
    pitfalls: [
      '🚨 已 push 到遠端時請謹慎：`--amend` 會產生全新 Hash，若該提交已經 push 到遠端，再次 push 需要 force push，可能影響正在依賴它的同事。',
      '💡 本地修改隨意用：在提交尚未 push 上遠端之前，隨時都可以安全地 amend。'
    ]
  },

  '19': {
      "targetCommand": "git stash push -u → git switch main → git switch feature/cart → git stash pop --index → git add cart.py coupon.py → git commit -m \"feat: tax and discount\" → git stash drop",
      "summary": "Stash 保存快照；pop 成功時移除 stash，衝突時通常保留供你確認。",
      "guidedSteps": [
          {
              "step": 1,
              "cmd": "git stash push -u",
              "category": "required",
              "why": "保存索引、工作區及未追蹤 coupon.py。"
          },
          {
              "step": 2,
              "cmd": "git switch main",
              "category": "required",
              "why": "修改 app.py 並 add/commit 緊急修復。"
          },
          {
              "step": 3,
              "cmd": "git switch feature/cart",
              "category": "required",
              "why": "把 cart.py 改成 cartWithTax(); 並 add/commit，製造同檔的新修改。"
          },
          {
              "step": 4,
              "cmd": "git stash pop --index",
              "category": "required",
              "why": "嘗試恢復索引與工作區；這次產生衝突且 stash 保留。"
          },
          {
              "step": 5,
              "cmd": "git add cart.py coupon.py",
              "category": "required",
              "why": "在檔案頁解成 cartWithTaxAndDiscount();，確認 coupon 仍在。"
          },
          {
              "step": 6,
              "cmd": "git commit -m \"feat: tax and discount\"",
              "category": "required",
              "why": "保存解決後的功能。"
          },
          {
              "step": 7,
              "cmd": "git stash drop",
              "category": "required",
              "why": "確認內容保存後刪除留存的 stash。"
          }
      ],
      "variations": [
          {
              "cmd": "git stash apply --index",
              "desc": "嘗試恢復索引且保留 stash；衝突時仍須處理。"
          },
          {
              "cmd": "git stash list",
              "desc": "檢查保存項目。"
          }
      ],
      "pitfalls": [
          "-u 不包含 ignored 檔案；-a 才包含，可能也保存大型產物。",
          "--index 嘗試恢復暫存狀態，衝突時不保證可以完全還原。"
      ]
  },

  '20': {
      "targetCommand": "git mv utils.py helpers.py → git clean -nd → git clean -fd → git commit -m \"refactor: rename utils to helpers\"",
      "summary": "Git mv 同步更名與暫存。Clean 刪除未追蹤檔案前，先 dry-run 檢查範圍。",
      "guidedSteps": [
          {
              "step": 1,
              "cmd": "git mv utils.py helpers.py",
              "category": "required",
              "why": "更名並更新索引。Git 的更名辨識仍依內容相似度。"
          },
          {
              "step": 2,
              "cmd": "git clean -nd",
              "category": "required",
              "why": "必要步驟：預覽即將移除的檔案與目錄。"
          },
          {
              "step": 3,
              "cmd": "git clean -fd",
              "category": "required",
              "why": "確認名單後才刪除未追蹤檔案與目錄。"
          },
          {
              "step": 4,
              "cmd": "git commit -m \"refactor: rename utils to helpers\"",
              "category": "required",
              "why": "保存更名。"
          }
      ],
      "variations": [],
      "pitfalls": [
          "未追蹤內容一般無法由 reflog 救回；請先保存需要的檔案。",
          "Clean 預設保留 ignored 檔案；-x 擴大刪除範圍，需重新預覽。"
      ]
  },

  '21': {
    targetCommand: 'git fetch upstream',
    summary: '遠端全貌：安全 pull 遠端最新節點與分支歷史，不觸動本地分支與工作目錄，安心比對審核。',
    scenarioContext: {
      role: '開源專案貢獻者',
      situation: '你 Fork 了一個開源專案，需要新增官方 upstream 遠端節點。此時遠端有了新提交，你想先看清楚他人改了什麼，而不是盲目 pull 引發衝突。'
    },
    guidedSteps: [
      {
        step: 1,
        cmd: 'git remote add upstream https://github.com/corp/upstream.git',
        category: 'required',
        why: '新增上游官方 repo 的遠端關聯，建立協作同步來源。'
      },
      {
        step: 2,
        cmd: 'git fetch upstream',
        category: 'required',
        why: '安全抓取上游最新提交與分支指標，不改動本地工作目錄與現有分支。'
      },
      {
        step: 3,
        cmd: 'git merge upstream/main',
        category: 'required',
        why: '將上游最新安全更新合併至本地當前分支。'
      },
      {
        step: 4,
        cmd: 'git remote -v',
        category: 'optional',
        why: '詳細列出當前所有已設定的遠端 repo 名稱與對應的 Fetch/Push 網址。'
      },
      {
        step: 5,
        cmd: 'git fetch --prune',
        category: 'optional',
        why: '抓取遠端時同步清除本地快取中已被遠端刪除的失效分支指標。'
      }
    ],
    variations: [
      {
        cmd: 'git fetch origin',
        name: '安全抓取遠端更新',
        desc: '下載物件並更新 origin/* 等遠端追蹤參照；標籤依 fetch 設定與可達性取得，預設不合併目前工作分支。',
        isPopular: true,
        popularReason: '【★ 資深開發者最愛】安全第一！先抓下來慢慢看 diff，確認無誤再手動合併。'
      },
      {
        cmd: 'git fetch --prune (或 -p)',
        name: '同步清理已刪除分支',
        desc: '自動移除本地快取中「遠端已經被刪除的遠端追蹤分支 (origin/...)」，防止分支名單無限膨脹。',
        isPopular: true,
        popularReason: '保持本地分支名單乾淨的必備保養指令。'
      },
      {
        cmd: 'git remote -v',
        name: '檢視遠端 repo 詳細網址',
        desc: '列出當前 origin 對應的 fetch 與 push 網址。',
        isPopular: true,
        popularReason: '確認遠端連線目標必打。'
      }
    ],
    whyPopularTitle: 'git fetch vs git pull 的根本哲學差異',
    whyPopularContent: '`git pull` 本質上就是偷懶的 `git fetch + git merge`（或 rebase）。當你對遠端進度一無所知時，直接敲 `git pull` 很可能瞬間引發意外衝突；而 `git fetch` 只是把遠端最新資訊下載下來，你可以從容地執行 `git log HEAD..origin/main` 審閱他人變更，決定何時整合。',
    pitfalls: [
      '⚠️ fetch 完程式碼沒變是正常的：很多人打完 fetch 發現本地檔案沒更新以為失敗了，請記得 fetch 只更新遠端追蹤指標，需手動 merge 或 rebase 才會套用。',
      '💡 查看差異神技：打完 fetch 後，可輸入 `git diff main origin/main` 查看本地主線與遠端最新版的完整差異。'
    ]
  },

  '22': {
    targetCommand: 'git branch feature/oauth && git reset --hard HEAD~2',
    summary: '移花接木：不小心把功能直接寫在 main 並提交了？用指標平移救星將 Commit 移駕新分支並恢復主線。',
    scenarioContext: {
      role: '恍神救星工程師',
      situation: '菜鳥經典大忌！埋頭苦幹了兩個小時，猛然抬頭發現自己竟然直接在 main 上面敲了 2 個功能提交！強哥正拿著咖啡從走廊走過來，快用「開新分支 + main reset 退回」的移花接木大法拯救主線！'
    },
    guidedSteps: [
      {
        step: 1,
        cmd: 'git branch feature/oauth',
        category: 'required',
        why: '在當前 HEAD 位置建立新分支貼紙，牢牢錨定誤寫在主線上的功能提交。'
      },
      {
        step: 2,
        cmd: 'git reset --hard HEAD~2',
        category: 'required',
        why: '將 main 分支指標強制退回前兩個版本，使主線迅速恢復純淨狀態。'
      },
      {
        step: 3,
        cmd: 'git switch feature/oauth',
        category: 'required',
        why: '切換至剛建立的功能分支，承接進度無縫繼續開發。'
      },
      {
        step: 4,
        cmd: 'git reset --soft HEAD~1',
        category: 'optional',
        why: '撤銷最近一次提交但將所有程式碼改動完整保留在暫存區，便於重新組織 Commit。'
      }
    ],
    variations: [
      {
        cmd: 'git branch <新分支名稱>',
        name: '原處開出新分支保全程式碼',
        desc: '在當前 HEAD 位置直接標記一個新分支名稱，牢牢抓住這個誤寫的 Commit。',
        isPopular: true,
        popularReason: '【★ 救援第一步】先建分支錨定當前位置，絕不丟失程式碼！'
      },
      {
        cmd: 'git reset --hard HEAD~1 (或指定穩定Hash)',
        name: '將 main 指標向後倒退',
        desc: '將當前所在分支（main）強制退回誤提交前的穩定節點。',
        isPopular: true,
        popularReason: '讓 main 回歸乾淨穩定狀態。'
      },
      {
        cmd: 'git reset --soft HEAD~1',
        name: '軟重設（撤銷提交保留暫存）',
        desc: '將分支指標退回上一版本，但將所有修改保留在暫存區，方便重新拆分或修改提交。',
        isPopular: true,
        popularReason: '【★ 重整提交首選】撤銷最後一次 Commit 同時完好保全所有寫好的程式碼！'
      },
      {
        cmd: 'git switch <新分支名稱>',
        name: '切換至新分支繼續開發',
        desc: '這時新分支完美繼承了剛剛的提交，主線 main 也恢復原狀，移花接木大功告成！',
        isPopular: true,
        popularReason: '平移完成後的開發接軌手勢。'
      }
    ],
    whyPopularTitle: '為什麼這個指標技巧是每個工程師必備的肌肉記憶？',
    whyPopularContent: '在真實工作中，可能會「忘記開分支，直接在 main 上面敲了 git commit」。許多人手忙腳亂地開始複製貼上備份檔案。其實 Git 的分支本質上只是一個「貼紙（指標）」！只要在原地貼上新分支貼紙，再把 main 貼紙撕下來貼回前一個節點，保留誤提交的功能，再恢復未共享的 main。執行前確認未提交修改已保存。',
    pitfalls: [
      '🚨 順序不可顛倒：務必先執行 `git branch <new>` 錨定住 Commit，然後才執行 reset；如果先執行了 reset --hard，該 Commit 就會變成孤兒節點（需靠 reflog 找回）。',
      '💡 適用情境：此操作適用於該 Commit 尚未被 push 到遠端共享 main 的情況。'
    ]
  },

  '23': {
      "targetCommand": "git cat-file -t HEAD → git cat-file -p HEAD → git cat-file -p HEAD^{tree}",
      "summary": "Cat-file 讀取 Git 物件，並非解密。Commit 指向 tree，tree 條目指向 blob 或子 tree。",
      "guidedSteps": [
          {
              "step": 1,
              "cmd": "git cat-file -t HEAD",
              "category": "required",
              "why": "查看物件型別。"
          },
          {
              "step": 2,
              "cmd": "git cat-file -p HEAD",
              "category": "required",
              "why": "查看 commit 的 tree 與 parent 引用。"
          },
          {
              "step": 3,
              "cmd": "git cat-file -p HEAD^{tree}",
              "category": "required",
              "why": "查看快照中的檔名與 blob ID。"
          }
      ],
      "variations": [
          {
              "cmd": "git cat-file -p <blob-id>",
              "desc": "查看保存的檔案內容。"
          }
      ],
      "pitfalls": [
          "Git 常見預設是 SHA-1；可選 SHA-256 物件格式需考慮工具與服務相容性。",
          "Hash 是內容定址識別，不是加密或隱藏秘密。"
      ]
  },

};

// Export for browser and node
if (typeof window !== 'undefined') {
  window.COMMAND_GUIDES = COMMAND_GUIDES;
}
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { COMMAND_GUIDES };
}
