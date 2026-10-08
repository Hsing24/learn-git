/**
 * COMMAND_GUIDES - 24 大關卡指令深度教室與實戰語法變體庫
 * 為學習者提供：
 * 1. 職場情境現場 (Role & Situation)
 * 2. 引導式解題步驟與指令脈絡 (Guided Steps: 為什麼要下這個指令？它具體做了什麼？)
 * 3. 核心指令變體比對 (Command Variations with click-to-paste)
 * 4. 業界主流決策脈絡 (Why 90% developers use this)
 * 5. 避坑指南與實戰防線 (Pitfalls & Pro-Tips)
 */

const COMMAND_GUIDES = {
  '00': {
    targetCommand: 'git config user.name "你的名字" && git config user.email "you@example.com"',
    summary: '配置開發者起點身分標籤，清楚釐清「必備底線設定」與「現代可選提效神技」，打通免密連線與自動遠端追蹤。',
    scenarioContext: {
      role: '新進軟體工程師 / 剛重灌開發環境的開發者',
      situation: '你剛拿到公司的開發電腦或重灌了系統，clone 了第一個專案準備開工。若沒有預先配置好 Git 使用者身分，當你寫完程式第一次執行 git commit 時，Git 會因無法追蹤作者而直接報錯中斷！同時，若每次開新分支 push 都要輸入長長的 --set-upstream，會嚴重打斷開發節奏。'
    },
    guidedSteps: [
      {
        step: 1,
        cmd: 'git config user.name "你的名字"',
        category: 'required',
        why: '設定提交作者名稱。Git 每個 Commit 都必須永久記錄作者印記，否則 Git 會因無法辨識身分而直接拒絕提交。'
      },
      {
        step: 2,
        cmd: 'git config user.email "you@example.com"',
        category: 'required',
        why: '設定提交作者信箱。與 GitHub/GitLab 帳號綁定以識別貢獻者，專案貢獻度（綠格子）才會正確計入個人檔案。'
      },
      {
        step: 3,
        cmd: 'git config push.autoSetupRemote true',
        category: 'optional',
        why: '開啟現代自動遠端分支追蹤（Git 2.37+），開新分支後只要敲 git push 即自動在遠端建立同名分支，免除手動輸入 --set-upstream。'
      },
      {
        step: 4,
        cmd: 'git config init.defaultBranch main',
        category: 'optional',
        why: '將所有新建 repo 的初始預設分支自動命名為 main，符合現代開源社群規範，告別過時的 master。'
      }
    ],
    configCategories: {
      required: [
        { key: 'user.name', label: '作者名稱', desc: '每個 Commit 的必要標籤，缺少則無法提交。' },
        { key: 'user.email', label: '作者信箱', desc: '與程式碼平台綁定辨識貢獻度，缺少則無法提交。' }
      ],
      optional: [
        { key: 'push.autoSetupRemote true', label: '自動遠端追蹤', desc: '新分支直接 git push，免除手動打 --set-upstream。' },
        { key: 'init.defaultBranch main', label: '預設分支名稱', desc: '新專案預設為 main，符合現代團隊規範。' },
        { key: 'pull.rebase true', label: 'pull 預設 rebase', desc: 'git pull 自動採用 rebase，避免產生多餘 merge 節點。' },
        { key: 'core.editor "code --wait"', label: '指定預設編輯器', desc: '綁定慣用編輯器（如 VSCode 或 Vim），防止卡住。' },
        { key: 'core.autocrlf input', label: '跨平台換行符號', desc: '自動轉換 LF/CRLF，防止 Mac/Windows 換行污染。' }
      ]
    },
    variations: [
      {
        cmd: 'git config user.name "你的名字"',
        name: '設定作者名稱 (本地生效)',
        desc: '僅在當前 repo 生效。若公司 GitLab 與私人 GitHub 帳號不同，適合在特定專案分別設定。',
        isPopular: false
      },
      {
        cmd: 'git config --global user.name "你的名字"',
        name: '設定全域作者名稱',
        desc: '整台電腦所有 Git repo 預設通用，團隊 Code Review 與 Git Blame 溯源必備。',
        isPopular: true,
        popularReason: '新電腦開工第一步，一次設定整台電腦所有專案皆適用。'
      },
      {
        cmd: 'git config --global user.email "you@example.com"',
        name: '設定全域電子郵件',
        desc: '與 GitHub/GitLab 帳號綁定，確保貢獻度綠格子正確計入個人檔案。',
        isPopular: true,
        popularReason: '每台電腦必備，建議與 GitHub 註冊信箱一致。'
      },
      {
        cmd: 'git config --global push.autoSetupRemote true',
        name: '自動設定遠端分支追蹤 (Git 2.37+)',
        desc: '開新分支後只要敲 git push，Git 自動在遠端建立同名分支並建立關聯。',
        isPopular: true,
        popularReason: '【★ 現代團隊神技】徹底告別落落長的 git push --set-upstream origin <branch> 複製貼上惡夢！'
      },
      {
        cmd: 'git config --global init.defaultBranch main',
        name: '設定新 repo 預設分支名稱',
        desc: '符合現代開源標準，將 git init 產生的預設分支由 master 改為 main。',
        isPopular: false
      },
      {
        cmd: 'git config --list --show-origin',
        name: '檢視當前所有配置與來源檔',
        desc: '印出 System、Global、Local 三層配置及其所在實體路徑，排查配置衝突利器。',
        isPopular: false
      }
    ],
    whyPopularTitle: '哪些設定是必要？哪些是可選？',
    whyPopularContent: '在 Git 底層設計中，只有 `user.name` 與 `user.email` 是「絕對必要」的，因為 Git 每個 Commit 節點必須永久鐫刻作者資訊以供審計溯源；而像 `push.autoSetupRemote`、`init.defaultBranch`、`pull.rebase` 等則屬於「職場高頻推薦的可選神技」，是用來大幅降低日常重複輸入指令的心智負擔。',
    pitfalls: [
      '⚠️ 身分配置層級注意：--global 適用於整台電腦，若公司有私人 GitLab 與個人 GitHub 帳號區分，可以在特定 repo 使用無 --global 的 local 設定覆蓋。',
      '💡 避坑指南：SSH 金鑰生成後需將公鑰 (~/.ssh/id_ed25519.pub) 複製到 GitHub Settings -> SSH Keys，未來即可免密碼安全 push。'
    ]
  },

  '01': {
    targetCommand: 'git add .',
    summary: '將工作目錄中所有修改與新增的檔案送入暫存區 (Staging Area)，準備建立第一個正式 Commit。',
    scenarioContext: {
      role: '前端工程師 / 專案創始成員',
      situation: '專案剛啟動！你在本地工作目錄建立了 index.html 與 style.css 兩個檔案。此時這兩個檔案尚未被 Git 版本控管追蹤（Untracked）。你需要理解工作區、暫存區與版本庫三層流動，將第一批程式碼拍照存檔。'
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
        popularReason: '【★ 業界 90% 最常用】日常完成一個完整功能時，搭配 .gitignore 批次提交速度最快、心智負擔最低！'
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
    targetCommand: 'git switch -c feature/login',
    summary: '建立並切換至新分支，保持主線 main 乾淨穩定，並於完成後執行快進 (Fast-Forward) 合併。',
    scenarioContext: {
      role: '功能模組工程師',
      situation: '團隊制定了嚴格的開發規範：主線 main 必須永遠保持可部署的穩定狀態，嚴禁直接在 main 上面敲程式碼！你領取了登入功能開發需求，必須開出獨立分支開發，驗收無誤後再合併回主線。'
    },
    guidedSteps: [
      {
        step: 1,
        cmd: 'git switch -c feature/login',
        category: 'required',
        why: '從 main 建立並切換至新功能分支，隔離新功能與主線，保護主線不受半成品干擾。'
      },
      {
        step: 2,
        cmd: 'git commit -m "feat: add login page"',
        category: 'required',
        why: '在專屬分支上記錄登入功能成果，產生專屬提交節點。'
      },
      {
        step: 3,
        cmd: 'git switch main',
        category: 'required',
        why: '登入功能開發完畢，切換回目標主線 main，準備接納新程式碼。'
      },
      {
        step: 4,
        cmd: 'git merge feature/login',
        category: 'required',
        why: '將功能分支合回 main。因為 main 在此期間無新提交，觸發俐落的 Fast-Forward 快進指標平移。'
      },
      {
        step: 5,
        cmd: 'git switch -',
        category: 'optional',
        why: '快速返回上一個停留的分支（類似終端機 cd -），在兩個分支間頻繁切換時大幅省去手動打字時間。'
      },
      {
        step: 6,
        cmd: 'git branch -vv',
        category: 'optional',
        why: '詳細檢視所有本地分支及其對應的遠端追蹤分支、領先或落後節點數與最新提交摘要。'
      }
    ],
    variations: [
      {
        cmd: 'git switch <分支名稱>',
        name: '純粹切換至現有分支',
        desc: '專職切換分支。若輸入的分支不存在會立即報錯，安全無副作用。',
        isPopular: true,
        popularReason: '【★ 現代 Git 推薦】自 Git 2.23+ 推出，語意單純，不再與還原檔案的 checkout 混淆。'
      },
      {
        cmd: 'git switch -c <新分支名稱>',
        name: '建立並切換新分支 (Create & Switch)',
        desc: '以當前 HEAD 為起點，建立新分支並立即切換過去（等同於傳統的 checkout -b）。',
        isPopular: true,
        popularReason: '【★ 現代日常最高頻】語意中的 -c 代表 create，對稱直觀不易打錯。'
      },
      {
        cmd: 'git checkout <分支名稱>',
        name: '傳統切換分支指令',
        desc: '舊版 Git 通用指令。同時身兼切換分支與復原工作區檔案兩大職責。',
        isPopular: false
      },
      {
        cmd: 'git checkout -b <新分支名稱>',
        name: '傳統建立並切換分支指令',
        desc: '老一輩工程師最習慣的手勢，功能與 switch -c 相同。',
        isPopular: false
      }
    ],
    whyPopularTitle: '為什麼現代技術團隊全面改用 git switch ？',
    whyPopularContent: '過去的 `git checkout` 承擔過多職責：打 `git checkout main` 是切換分支；打 `git checkout index.html` 卻會無聲無息地覆蓋還原工作區檔案！初學者稍有不慎就會誤刪尚未提交的程式碼。因此官方在 Git 2.23 正式拆分出 `git switch`（切換分支）與 `git restore`（還原檔案），各司其職。',
    pitfalls: [
      '⚠️ 髒工作區警告：切換分支前如果工作區有未提交的改動，且該改動與目標分支有衝突，Git 會中斷切換。',
      '💡 快進合併 (Fast-Forward)：當目標分支自切出後沒有任何新 Commit 時，合併僅需將指標平移，不會產生多餘的 Merge Commit。'
    ]
  },

  '03': {
    targetCommand: 'git merge feature/dark-mode',
    summary: '合併兩條分叉歷史，解讀 <<<<<<< 與 >>>>>>> 衝突標記，手動保留最佳程式碼完成三方合併。',
    scenarioContext: {
      role: '協同合作工程師',
      situation: '雙分支平行開發時，同事在 main 修改了 style.css 的主題顏色，而你在 feature/dark-mode 也修改了同一行。當你嘗試執行 git merge 時，Git 無法猜測該聽誰的，終端機噴出紅字 CONFLICT！'
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
      situation: '你在 feature 分支埋頭開發了幾天，此時遠端 main 分支有了同事的新進度。團隊規範提 PR 前必須先 rebase main，保持歷史一條線，杜絕雜亂無章的菱形 Merge Commit 蛛網。'
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
    targetCommand: 'git commit --fixup <hash> 或 git rebase -i HEAD~3',
    summary: '在送出 Pull Request 前整理本機的零碎草稿提交 (wip, fix typo)，重整出高語意清晰歷史。',
    scenarioContext: {
      role: 'Pull Request 提交者',
      situation: '在準備送出 PR 供主管 Review 前，你檢查了本地 log，發現充斥著 "wip", "fix typo", "done" 等零碎的半成品提交。如果直接推上遠端會嚴重降低審查效率，需要將其整合成職責明確的單一語意 Commit。'
    },
    guidedSteps: [
      {
        step: 1,
        cmd: 'git log --oneline -n 5',
        category: 'required',
        why: '查看最近的零碎提交清單，確認需要整併的 Commit 範圍與 Hash。'
      },
      {
        step: 2,
        cmd: 'git rebase -i HEAD~2',
        category: 'required',
        why: '使用互動式 rebase 將多筆零碎提交壓縮 (squash) 融合成單一語意清晰的功能節點。'
      },
      {
        step: 3,
        cmd: '保持最終 HEAD 只有 1 個完整功能的 commit',
        category: 'required',
        why: '整頓歷史清晰度，讓審查者一目了然，日後線上排查時更容易追蹤。'
      },
      {
        step: 4,
        cmd: 'git commit --fixup <commitHash>',
        category: 'optional',
        why: '針對指定歷史提交建立標註為 fixup! 的修補節點，省去手動思考臨時提交訊息的心智負擔。'
      },
      {
        step: 5,
        cmd: 'git rebase -i --autosquash HEAD~3',
        category: 'optional',
        why: 'rebase 時自動依據 fixup! 標記重排並將修補提交融合進目標節點，免除手動調整順序的繁瑣步驟。'
      }
    ],
    variations: [
      {
        cmd: 'git rebase -i HEAD~n',
        name: '互動式 rebase (Interactive Rebase)',
        desc: '開啟文字選單，支援 pick（保留）、squash（壓縮）、fixup（捨棄訊息壓縮）、drop（丟棄）。',
        isPopular: true,
        popularReason: '歷史整形的瑞士刀，靈活度最高。'
      },
      {
        cmd: 'git commit --fixup <hash>',
        name: '現代自動配對修補提交 (Fixup)',
        desc: '提交時直接宣告「這次修改是為了修補某個特定 hash」，自動產生標題為 fixup! ... 的提交。',
        isPopular: true,
        popularReason: '【★ 資深工程師黑科技】搭配 git rebase -i --autosquash，0 手動編輯錯誤，全自動排序融合！'
      },
      {
        cmd: 'git reset --soft HEAD~n',
        name: '懶人壓平法 (Soft Reset Squash)',
        desc: '將 HEAD 指標往前退 n 個節點，但保留所有修改在暫存區，直接一鍵打新的 commit 即可合併。',
        isPopular: false
      }
    ],
    whyPopularTitle: '為什麼專業工程師提 PR 前一定要整理 Commit？',
    whyPopularContent: '未經整理的 PR 往往充斥著 "update", "fix bug", "test", "final fix" 等毫無意義的碎片提交，會大幅降低 Reviewer 的審查效率，日後線上出問題時也無法透過 commit 標題釐清因果。將相關修改融合成 1~2 個職責分明的 Commit 是資深工程師的專業體現。',
    pitfalls: [
      '⚠️ 順序重要性：在互動式 rebase 清單中，最上面的是最舊的 Commit，最下面的是最新的 Commit。',
      '💡 fixup 與 squash 的差異：squash 會合併訊息，fixup 則會直接丟棄修補提交的訊息，直接沿用目標節點訊息。'
    ]
  },

  '06': {
    targetCommand: 'git pull --rebase origin main',
    summary: '解決遠端他人搶先 push 導致的 Non-Fast-Forward push 被拒，將本地提交優雅嫁接至遠端最新進度之上。',
    scenarioContext: {
      role: '團隊協作開發者',
      situation: '你在本機辛勤寫完了功能，自信滿滿地敲下 git push，終端機卻爆出 [rejected - non-fast-forward]！原來是同事搶先一步把他的新進度推上了遠端 main，導致遠端版本超前了你的基準點。'
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
        why: '安全強制 push 防線，在覆蓋前檢查遠端是否有未知新提交，若有他人進度則自動阻擋，避免誤殺隊友程式碼。'
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
    targetCommand: 'git cherry-pick <commitHash>',
    summary: '精準 cherry-pick：在不合併整個實驗性龐大分支的前提下，單獨偷渡特定關鍵 Bugfix 提交回 main。',
    scenarioContext: {
      role: '版本維護工程師',
      situation: '你在一個巨大的實驗性分支寫了幾千行還不能發布的草稿，但過程中順手修了一個影響正式機器的嚴重資安漏洞。你不能合併整包半成品，必須單獨把那個修復提交偷渡回 main。'
    },
    guidedSteps: [
      {
        step: 1,
        cmd: 'git switch main',
        category: 'required',
        why: '切換到準備套用漏洞修補的穩定主線 main。'
      },
      {
        step: 2,
        cmd: 'git log experimental --oneline (查看修復 Commit Hash)',
        category: 'required',
        why: '在實驗性分支中找出該修復提交的 Hash（如 sec001）。'
      },
      {
        step: 3,
        cmd: 'git cherry-pick <commitHash>',
        category: 'required',
        why: '只 cherry-pick 那一顆特定提交，精準複製修補到主線，完全不帶進未成熟的實驗程式碼！'
      },
      {
        step: 4,
        cmd: 'git cherry-pick -n <commitHash>',
        category: 'optional',
        why: 'cherry-pick 套用程式碼變更但保留在暫存區而不立即建立 Commit，方便微調或與其他修改合併提交。'
      },
      {
        step: 5,
        cmd: 'git cherry-pick --abort',
        category: 'optional',
        why: 'cherry-pick 過程遭遇衝突或挑錯提交時，一鍵放棄操作並將工作區復原至挑選前的狀態。'
      }
    ],
    variations: [
      {
        cmd: 'git cherry-pick <commitHash>',
        name: 'cherry-pick 單一提交',
        desc: '將指定的 Commit 複製一份並重新套用在當前分支頂端，生成新 Hash。',
        isPopular: true,
        popularReason: '【★ 線上緊急救援神器】快速將 feature 或 dev 分支修好的 Hotfix 單獨搬到 production 分支！'
      },
      {
        cmd: 'git cherry-pick -n <commitHash>',
        name: 'cherry-pick 但不立即提交 (--no-commit)',
        desc: '套用修改並直接放在暫存區，方便你在提交前繼續追加或微調程式碼。',
        isPopular: false
      },
      {
        cmd: 'git cherry-pick <hashA>..<hashB>',
        name: '批次 cherry-pick 提交區間',
        desc: '連續 cherry-pick 從 hashA 到 hashB 之間的多個提交（左開右閉）。',
        isPopular: false
      }
    ],
    whyPopularTitle: '什麼時候該用 cherry-pick 而不是 merge？',
    whyPopularContent: '當你在實驗性分支（例如 AI 重構版）寫了上千行尚未穩定的程式碼，但過程中順手修了一個影響正式機器的嚴重資安漏洞。若直接 merge 會把未完成的半成品一起帶上線；此時 cherry-pick 允許你只挑那顆「櫻桃」（安全修補 Commit），乾淨安全！',
    pitfalls: [
      '⚠️ Hash 差異提醒：cherry-pick 會產生一個全新的 Commit Hash，即便程式碼相同，在 Git 底層仍是不同節點。',
      '💡 衝突應對：若被 cherry-pick 的提交依賴未被 cherry-pick 的程式碼，會發生衝突，解決後敲 `git cherry-pick --continue` 即可。'
    ]
  },

  '08': {
    targetCommand: 'git reflog 搭配 git reset --hard HEAD@{n}',
    summary: '起死回生：透過本地指標變更黑盒子日記 (Reflog)，拯救誤刪或 hard reset 遺失的 Commit。',
    scenarioContext: {
      role: '緊急事故救援工程師',
      situation: '糟糕！剛才手滑執行了危險的 git reset --hard，原本重要的幾次 Commit 竟然從 git log 中徹底消失了！團隊程式碼難道化為烏有了嗎？你必須使用 Reflog 找回它。'
    },
    guidedSteps: [
      {
        step: 1,
        cmd: 'git reflog',
        category: 'required',
        why: '開啟本地 HEAD 指標的黑盒子日記，找到誤刪前的那次提交 Hash。'
      },
      {
        step: 2,
        cmd: 'git reset --hard HEAD@{1}',
        category: 'required',
        why: '時光倒流，將分支指標強制還原至特定動作點，找回心血程式碼！'
      },
      {
        step: 3,
        cmd: 'git reflog show <branch>',
        category: 'optional',
        why: '特定分支黑盒子檢索，過濾其他分支與操作雜訊，精確鎖定目標分支的歷史移動紀錄。'
      }
    ],
    variations: [
      {
        cmd: 'git reflog',
        name: '查看引用日誌 (Reference Log)',
        desc: '記錄本地 HEAD 指標過去所有移動歷史（包含 checkout, reset, commit, rebase）。',
        isPopular: true,
        popularReason: '【★ Git 最後防線】哪怕打錯了 reset --hard，只要 Commit 曾存在過，99% 都能在 reflog 找回！'
      },
      {
        cmd: 'git reset --hard HEAD@{1}',
        name: '還原回上一個動作點',
        desc: '將當前分支與工作區強制還原至 reflog 所指的特定步驟。',
        isPopular: true,
        popularReason: '最快速的時光倒流手勢。'
      },
      {
        cmd: 'git branch <救命新分支> <失蹤的Hash>',
        name: '以失蹤 Commit 開出新分支',
        desc: '在 reflog 找到被孤立的 Hash 後直接開出新分支，完全不影響當前分支狀態。',
        isPopular: true,
        popularReason: '比直接 reset --hard 更安全、更受資深工程師推薦的救援手法。'
      }
    ],
    whyPopularTitle: '為什麼 Git 裡的東西幾乎永遠「死不透」？',
    whyPopularContent: 'Git 是一個追加型（append-only）的內容定址資料庫。當你執行 `git reset --hard` 時，Git 只是移動了分支指標，原本的 Commit 物件依然完整保存在 `.git/objects/` 內。只要垃圾回收（GC）尚未執行（通常保留 30~90 天），`reflog` 就能帶你找回它的 SHA-1 Hash！',
    pitfalls: [
      '⚠️ 本機專屬限制：`git reflog` 僅記錄「你這台電腦」上的本地操作，不會被 push 到遠端 repo。',
      '💡 唯一無法挽回的例外：若修改「從未被 git add 或 git commit 過」就直接執行了硬重設，該程式碼將無法透過 Git 救回。'
    ]
  },

  '09': {
    targetCommand: 'git worktree add <路徑> <分支>',
    summary: '雙軌並行：直接建立獨立實體工作目錄，免除 Stash 與分支切換，實現零干擾平行開發。',
    scenarioContext: {
      role: '全端資深工程師',
      situation: '新功能寫到一半，伺服器正在跑測試，線上突然傳來 P0 緊急漏洞需要立即修復！若使用 stash 會打亂 IDE 與編譯快取，你需要開闢平行工作區同時開發。'
    },
    guidedSteps: [
      {
        step: 1,
        cmd: 'git worktree add ../hotfix-dir hotfix/p1',
        category: 'required',
        why: '在實體磁碟開闢獨立工作目錄並檢出分支，雙視窗平行作業，原專案伺服器與快取完全不動！'
      },
      {
        step: 2,
        cmd: 'git worktree list',
        category: 'required',
        why: '檢視目前活躍掛載的所有實體工作樹目錄。'
      },
      {
        step: 3,
        cmd: 'git worktree remove ../hotfix-dir',
        category: 'required',
        why: '修復並合併後，安全乾淨釋放該實體目錄。'
      },
      {
        step: 4,
        cmd: 'git worktree prune',
        category: 'optional',
        why: '清理已被手動刪除目錄但 Git 內部管理資訊仍殘留的失效工作樹紀錄，維持工作樹清單乾淨。'
      }
    ],
    variations: [
      {
        cmd: 'git worktree add ../<目錄名稱> <分支>',
        name: '建立新工作樹 (Worktree Add)',
        desc: '在指定路徑建立獨立工作目錄並檢出指定分支，多個目錄共享同一個底層 .git 庫。',
        isPopular: true,
        popularReason: '【★ 高階工程師必備】平行開兩重視窗開發，免停下手邊工作、免清編譯快取與 node_modules！'
      },
      {
        cmd: 'git worktree list',
        name: '列出所有活躍的 Worktree 目錄',
        desc: '查看當前 repo 掛載的所有實體工作目錄位置與所在分支。',
        isPopular: true,
        popularReason: '隨時掌握目前有哪些工作區處於開啟狀態。'
      },
      {
        cmd: 'git worktree remove <目錄路徑>',
        name: '安全移除已完成的 Worktree',
        desc: 'Hotfix 合併完成後，一鍵乾淨釋放該實體目錄。',
        isPopular: true,
        popularReason: '保持專案資料夾整潔有序。'
      }
    ],
    whyPopularTitle: 'Git Worktree 為什麼完勝傳統 Git Stash？',
    whyPopularContent: '遇到線上緊急 Bug 時，傳統做法是 `git stash` ➜ 切換分支 ➜ 修復 ➜ 切回 ➜ `git stash pop`。這會導致 IDE 重新索引、編譯快取失效、node_modules 重新載入，且 pop 時極易發生衝突。Worktree 讓你直接在另一個目錄開新 VS Code 視窗，原專案伺服器完全不必關閉！',
    pitfalls: [
      '⚠️ 分支互斥規則：Git 不允許兩個不同的 worktree 同時檢出 (checkout) 同一個分支，以防止檔案寫入衝突。',
      '💡 硬碟效益：Worktree 只建立工作目錄檔案，不重複複製 `.git` 歷史，比重新 git clone 節省數倍空間。'
    ]
  },

  '10': {
    targetCommand: 'git bisect start ➜ git bisect bad ➜ git bisect good <hash>',
    summary: '時光偵探：利用二分搜尋演算法，在數百個 Commit 中快速定位引發神秘 Bug 的罪魁禍首。',
    scenarioContext: {
      role: '除錯偵探工程師',
      situation: '上線前夕發現核心功能壞了！但這一個月內團隊提了上百個 Commit，根本不知道是誰在哪一天哪次提交弄壞的。逐一手動測試需要測上百次，你必須使用二分搜尋秒殺排查。'
    },
    guidedSteps: [
      {
        step: 1,
        cmd: 'git bisect start',
        category: 'required',
        why: '啟動 Git 二分搜尋捉蟲會話。'
      },
      {
        step: 2,
        cmd: 'git bisect bad',
        category: 'required',
        why: '標記當前 HEAD 版本是有 Bug 的 (bad)。'
      },
      {
        step: 3,
        cmd: 'git bisect good <hash>',
        category: 'required',
        why: '標記某個已知正常的歷史版本 (good)，Git 會自動跳到中間節點供你檢驗。'
      },
      {
        step: 4,
        cmd: 'git bisect log',
        category: 'optional',
        why: '檢視二分搜尋目前的排查路徑與標記歷史，清楚掌握已判定好壞的提交紀錄。'
      },
      {
        step: 5,
        cmd: 'git bisect reset',
        category: 'optional',
        why: '抓出問題提交後結束除錯會話，將 HEAD 指標復原切換回最初所在分支。'
      }
    ],
    variations: [
      {
        cmd: 'git bisect start',
        name: '啟動二分偵探模式',
        desc: '初始化 bisect 工作階段，準備標記好壞邊界。',
        isPopular: true,
        popularReason: '捉蟲的第一步。'
      },
      {
        cmd: 'git bisect bad / git bisect good <hash>',
        name: '手動標記好壞節點',
        desc: '告知 Git 當前版本有 Bug (bad)，而某個已知歷史版本是正常的 (good)。',
        isPopular: true,
        popularReason: 'Git 會自動跳到中間節點讓你驗證，O(log N) 次即可抓出元兇。'
      },
      {
        cmd: 'git bisect run <測試腳本>',
        name: '全自動化執行二分測試',
        desc: '傳入自動化測試腳本（返回 0 代表正常，非 0 代表失敗），Git 在數秒內自動全速二分排查！',
        isPopular: true,
        popularReason: '【★ 終極省時神技】泡杯咖啡的時間，Git 自動揪出哪次 commit 壞掉！'
      },
      {
        cmd: 'git bisect reset',
        name: '結束二分搜尋',
        desc: '捉蟲結束後退出 bisect，回到最初所在分支。',
        isPopular: true,
        popularReason: '必不可少的收尾指令。'
      }
    ],
    whyPopularTitle: '面對 500 個提交，二分法有多可怕？',
    whyPopularContent: '若一個 Bug 是在過去一個月內某個時間點引入的，中間有 500 次 Commit。如果手動逐個測試需要測 500 次；但使用 `git bisect` 二分搜尋（2^9 = 512），你最多只需要測試 9 次就能百分之百精確鎖定引發 Bug 的那行程式碼！',
    pitfalls: [
      '⚠️ 容易忘記 reset：二分搜尋結束後一定要執行 `git bisect reset`，否則會持續停留在 Detached HEAD 狀態。',
      '💡 測試要客觀：確保每次測試時的環境一致，若某個提交因其他編譯問題無法測試，可輸入 `git bisect skip` 跳過。'
    ]
  },

  '11': {
    targetCommand: 'git config core.hooksPath .githooks',
    summary: '守門神器：將 Git Hooks 納入專案版本控管全團隊共享，自動攔截機密金鑰並把關程式碼品質。',
    scenarioContext: {
      role: 'DevOps / 資安工程師',
      situation: '為了防止工程師不小心把 AWS 密鑰或包含敏感詞（如 CONFIDENTIAL）的程式碼推到公開 repo，你需要在 git commit 的當下設立第一道自動化守門員防線。'
    },
    guidedSteps: [
      {
        step: 1,
        cmd: 'git config core.hooksPath .githooks',
        category: 'required',
        why: '將 Git Hooks 讀取路徑由不受控的 .git/hooks 改為專案內的 .githooks，讓全團隊共享防線！'
      },
      {
        step: 2,
        cmd: 'chmod +x .githooks/pre-commit',
        category: 'required',
        why: '賦予 pre-commit 檢查腳本可執行權限。'
      },
      {
        step: 3,
        cmd: '嘗試提交包含敏感關鍵字的檔案',
        category: 'required',
        why: '親自驗證 pre-commit 守門員即時攔截並拒絕提交！'
      },
      {
        step: 4,
        cmd: 'git commit --no-verify',
        category: 'optional',
        why: '緊急情況跳過 pre-commit 等本機 hook 檢查強制提交，僅限事故搶修等特殊極端情境使用。'
      }
    ],
    variations: [
      {
        cmd: 'git config core.hooksPath .githooks',
        name: '設定共享 Hooks 路徑',
        desc: '將 Git Hooks 的預設讀取目錄從不受控的 .git/hooks 改為專案目錄下的 .githooks。',
        isPopular: true,
        popularReason: '【★ 現代團隊品管標準】一鍵讓全團隊所有成員自動享有 pre-commit 檢查防線！'
      },
      {
        cmd: 'chmod +x .githooks/pre-commit',
        name: '賦予 Hook 腳本執行權限',
        desc: '在 Linux/macOS 上確保 hook 腳本具備可執行權限，否則會被 Git 跳過。',
        isPopular: true,
        popularReason: '不可遺漏的權限步驟。'
      },
      {
        cmd: 'git commit --no-verify',
        name: '跳過 Hook 檢查強制提交',
        desc: '繞過 pre-commit 檢查直接提交。緊急修復事故時的後門。',
        isPopular: false
      }
    ],
    whyPopularTitle: '為什麼預設的 .git/hooks 無法在團隊中共享？',
    whyPopularContent: '因為 `.git` 資料夾本身的內容不會被 Git 版本控制，也不會隨 `git push` 同步給他人。如果將防守腳本放在 `.git/hooks`，每個新進同仁都得手動複製一次。使用 `git config core.hooksPath .githooks` 能將防線程式碼直接納入 Git Repo，達成自動化標準品管。',
    pitfalls: [
      '⚠️ 腳本退出碼：pre-commit 腳本若 `exit 1`（非 0），Git 會立刻中斷 commit；`exit 0` 才允許放行。',
      '💡 避坑指南：非到萬不得已切勿濫用 `--no-verify`，這等於關閉團隊的安全氣囊。'
    ]
  },

  '12': {
    targetCommand: 'git add -p shopping.py',
    summary: '精準原子暫存：以程式碼區塊 (Hunk) 為單位逐一審查暫存，實現乾淨純粹的單一職責原子提交。',
    scenarioContext: {
      role: '程式碼潔癖架構師',
      situation: '你在同一個檔案裡改了兩處邏輯：一處是修復折扣計算，另一處是幣別顯示。前輩要求拆成獨立提交。如果直接 git add . 會混雜無關改動，需要用 git add -p 組織單一職責的原子提交。'
    },
    guidedSteps: [
      {
        step: 1,
        cmd: 'git add -p shopping.py',
        category: 'required',
        why: '以程式碼區塊 (Hunk) 為單位逐一審核，輸入 y 暫存折扣修復區塊，輸入 n 略過其他變更。'
      },
      {
        step: 2,
        cmd: 'git commit -m "fix: apply discount in total calculation"',
        category: 'required',
        why: '將暫存區的折扣修復獨立建立原子提交，維持單一職責與清晰歷史。'
      },
      {
        step: 3,
        cmd: 'git diff --staged',
        category: 'optional',
        why: '檢視暫存區與最新提交之間的程式碼差異，確認即將提交的內容精確無誤。'
      },
      {
        step: 4,
        cmd: 'git diff -w',
        category: 'optional',
        why: '比對工作目錄變更時忽略所有空白與縮排，專注於實質程式碼邏輯變更。'
      }
    ],
    variations: [
      {
        cmd: 'git add -p (或 --patch)',
        name: '互動式局部區塊暫存',
        desc: '逐塊跳出 Diff 並詢問選項：y（暫存）、n（不暫存）、s（拆細區塊）、e（手動編輯）。',
        isPopular: true,
        popularReason: '【★ Code Review 神器】將同一檔案內的排版整理、除錯 print 與核心功能分開提交！'
      },
      {
        cmd: 'git diff --staged',
        name: '檢視已暫存的精確內容',
        desc: '在 commit 前做最後確認，確保進入暫存區的只有本次想要的邏輯。',
        isPopular: true,
        popularReason: '提交前最好的自我審查習慣。'
      },
      {
        cmd: 'git diff -w',
        name: '比對時忽略空白與縮排',
        desc: '在比對工作目錄與暫存區時忽略所有空白與縮排變更，聚焦核心邏輯修改。',
        isPopular: false
      }
    ],
    whyPopularTitle: '為什麼優秀工程師堅持「原子提交 (Atomic Commit)」？',
    whyPopularContent: '如果你在開發新功能的過程中，順手重構了幾行程式碼、修了一個無關的小 typo、還留了幾個 debug log。若直接 `git add .` 整包推上去，一旦新功能出事需要 revert，無辜的重構與 typo 修復也會一起被 revert。`git add -p` 能讓你將改動拆解成乾淨獨立的小提交。',
    pitfalls: [
      '⚠️ 區塊太黏怎麼辦：若想暫存的改動與不想暫存的改動緊挨在一起，可以在提示符輸入 `s`（split）將區塊拆細。',
      '💡 按鍵速查：y = stage this hunk; n = do not stage; q = quit; ? = 顯示所有選項幫助。'
    ]
  },

  '13': {
    targetCommand: 'git rm --cached .env',
    summary: '亡羊補牢：停止追蹤已被納入版本庫的機密或暫存檔案，同時完整保全本地硬碟實體檔案。',
    scenarioContext: {
      role: '資安防護工程師',
      situation: '專案剛上線，才發現機密的 `.env` 環境變數檔先前已經被 commit 過了！事後雖然把它寫入了 `.gitignore`，但 Git 依然在每次存檔時持續追蹤它。'
    },
    guidedSteps: [
      {
        step: 1,
        cmd: 'git rm --cached .env',
        category: 'required',
        why: '從 Git 暫存區與版本索引中移除追蹤，同時完整保全本地硬碟實體檔案。'
      },
      {
        step: 2,
        cmd: 'git commit -m "chore: untrack .env"',
        category: 'required',
        why: '正式提交索引移除變更，使 .gitignore 規則對該檔案全面生效。'
      },
      {
        step: 3,
        cmd: 'git check-ignore -v .env',
        category: 'optional',
        why: '排查檔案被忽略的具體原因，顯示命中的 .gitignore 檔案路徑與行號。'
      }
    ],
    variations: [
      {
        cmd: 'git rm --cached <檔案名稱>',
        name: '僅自索引除名 (保全本地實體)',
        desc: '只從 Git 暫存區與版本控管名單移除，本地硬碟上的實體檔案完全不受損壞。',
        isPopular: true,
        popularReason: '【★ 解決 .env 外流救星】把已經誤推的設定檔退出版控，但本地繼續保留使用！'
      },
      {
        cmd: 'git check-ignore -v <檔案名稱>',
        name: '排查 .gitignore 命中規則',
        desc: '顯示檔案被 Git 忽略的原因，精確印出命中哪一份 .gitignore 規則檔與行號。',
        isPopular: true,
        popularReason: '【★ 除錯利器】快速釐清特定檔案為何沒被 Git 追蹤到。'
      },
      {
        cmd: 'git rm -r --cached .',
        name: '全 repo 重新應用 .gitignore',
        desc: '暫時移除所有檔案追蹤，接著重新 git add .，讓新改寫的 .gitignore 全面生效。',
        isPopular: true,
        popularReason: '修補大量忽略規則時的最常用組合拳。'
      },
      {
        cmd: 'git rm <檔案名稱>',
        name: '實體與版控同步刪除',
        desc: '同時刪除本地硬碟檔案並暫存該刪除動作。',
        isPopular: false
      }
    ],
    whyPopularTitle: '為什麼寫了 .gitignore 檔案卻依然被 Git 追蹤？',
    whyPopularContent: '這是初學者最常遇到的困惑！`.gitignore` 的機制是「只對從未被 Git 追蹤過的未追蹤檔案 (untracked) 生效」。如果某個檔案在寫入 `.gitignore` 之前就已經被 commit 過，Git 就會持續追蹤它。必須透過 `git rm --cached` 將其從索引中剔除。',
    pitfalls: [
      '🚨 千萬別漏打 --cached：如果手滑只打了 `git rm <file>`，你的本地實體檔案會直接被刪除！',
      '💡 提交生效：執行完 `git rm --cached` 後，記得執行 `git commit` 將刪除索引的動作記錄下來。'
    ]
  },

  '14': {
    targetCommand: 'git revert -m 1 HEAD',
    summary: '線上緊急 revert：解救生產事故，向前推進產生反轉提交，安全復原已合併的 Pull Request。',
    scenarioContext: {
      role: '線上值班負責人',
      situation: '五分鐘前剛合併進 main 的重大 PR 在正式機引發嚴重當機事故！在團隊協作的共享分支上，嚴禁使用危險的 reset --hard + force push，必須用安全向前推進的方式撤銷 PR。'
    },
    guidedSteps: [
      {
        step: 1,
        cmd: 'git log --oneline -n 3',
        category: 'required',
        why: '確認提交歷史與當前引發線上事故的 Merge Commit 節點。'
      },
      {
        step: 2,
        cmd: 'git revert -m 1 HEAD',
        category: 'required',
        why: '以主線第一親代為基準反轉合併變更，生成向前推進的安全 revert commit。'
      },
      {
        step: 3,
        cmd: 'git revert --no-edit HEAD',
        category: 'optional',
        why: '保留預設產生的 Revert 提交訊息，跳過文字編輯器確認直接完成反轉。'
      }
    ],
    variations: [
      {
        cmd: 'git revert -m 1 <MergeCommitHash>',
        name: 'revert Merge Commit (指定主線第一親代)',
        desc: '產生一個新的提交，將特定 Merge Commit 引入的變更全部反轉撤銷，且不破壞歷史。',
        isPopular: true,
        popularReason: '【★ 正式機線上事故標準 SOP】保留完整審計歷史，團隊成員無需重整本地程式碼！'
      },
      {
        cmd: 'git revert <普通CommitHash>',
        name: 'revert 單親普通 commit',
        desc: '不需要 -m 參數，直接反轉普通單親提交的程式碼變動。',
        isPopular: true,
        popularReason: '日常 revert 單一錯誤 commit 的首選。'
      },
      {
        cmd: 'git revert --no-edit <CommitHash>',
        name: '沿用預設反轉提交訊息',
        desc: '跳過文字編輯器確認步驟，直接以預設 Revert 訊息產生 revert commit。',
        isPopular: true,
        popularReason: 'CI/CD 自動化或緊急快速 revert 時省去編輯器互動。'
      }
    ],
    whyPopularTitle: '為什麼 revert Merge PR 必須加上 -m 1 ？',
    whyPopularContent: '普通提交只有一個 Parent（父親），但 Merge Commit 擁有兩個 Parent：Parent 1 是合併前的主線（main），Parent 2 是被合併進來的功能分支（feature）。Git 不知道你想以誰為基準進行反轉，因此 `-m 1` 明確指定「以 Parent 1 主線為基準，將 Parent 2 的改動全部消除」。',
    pitfalls: [
      '⚠️ 未來重新合併的陷阱：被 revert 過的分支未來若想再次合入 main，直接合會發現程式碼被視為已刪除，需先 revert 該 revert commit。',
      '💡 絕不要在線上 force push：線上正式環境嚴禁使用 `git reset --hard` + `git push --force`，會導致全團隊歷史錯亂。'
    ]
  },

  '15': {
    targetCommand: 'git tag -a v1.0.0 -m "Release v1.0.0"',
    summary: '版本里程碑：建立附註標籤 (Annotated Tag)，綁定發布節點並 push 到遠端釋出 Release。',
    scenarioContext: {
      role: 'Release 負責人',
      situation: '系統完成 v1.0.0 正式里程碑！你需要為當前的穩定 Commit 貼上正式的發布標籤，並為過往里程碑補簽版號，讓 CI/CD 觸發自動建置並供用戶下載。'
    },
    guidedSteps: [
      {
        step: 1,
        cmd: 'git tag -a v1.0.0 -m "Release v1.0.0"',
        category: 'required',
        why: '在當前穩定進度建立包含打標者與時間戳記的附註標籤，標定正式發布版號。'
      },
      {
        step: 2,
        cmd: 'git tag -a v0.9.0 cAuth -m "Beta release"',
        category: 'required',
        why: '為指定的歷史提交補簽附註標籤，補足過往里程碑版本紀錄。'
      },
      {
        step: 3,
        cmd: 'git tag -l "v1.*"',
        category: 'optional',
        why: '使用萬用字元樣式過濾列出符合特定版號範圍的標籤清單。'
      },
      {
        step: 4,
        cmd: 'git show v1.0.0',
        category: 'optional',
        why: '檢視標籤中繼資料，包含打標者、簽署時間、附註訊息與指向的快照內容。'
      },
      {
        step: 5,
        cmd: 'git push origin --tags',
        category: 'optional',
        why: '將本地建立的所有版本標籤一次性同步 push 至遠端 repo。'
      }
    ],
    variations: [
      {
        cmd: 'git tag -a <標籤名> -m "<說明訊息>"',
        name: '附註標籤 (Annotated Tag)',
        desc: '建立包含打標者姓名、Email、時間戳記與專屬描述的完整標籤物件。',
        isPopular: true,
        popularReason: '【★ 正式軟體發布標準】CI/CD 自動化建置、Docker Image 版號與 GitHub Release 基準！'
      },
      {
        cmd: 'git tag -l "<萬用字元樣式>"',
        name: '樣式過濾標籤清單',
        desc: '使用萬用字元（如 "v1.*"）列出符合特定版號範圍的所有標籤。',
        isPopular: false
      },
      {
        cmd: 'git show <標籤名>',
        name: '檢視標籤詳細資訊',
        desc: '顯示標籤的簽署中繼資料（打標者、日期、附註訊息）與其指向之 Commit 內容。',
        isPopular: true,
        popularReason: '驗證正式發布標籤內容與指向節點是否正確必用。'
      },
      {
        cmd: 'git tag <標籤名>',
        name: '輕量標籤 (Lightweight Tag)',
        desc: '不帶額外訊息，僅僅是某個 Commit 的不可變別名指標。',
        isPopular: false
      },
      {
        cmd: 'git push origin --tags',
        name: 'push 所有本地標籤至遠端',
        desc: '將本地建立的版本標籤同步發布到遠端 repo。',
        isPopular: true,
        popularReason: '平常 git push 不會主動 push tags，必須加上此參數。'
      }
    ],
    whyPopularTitle: '語意化版本號 (SemVer) 的重要性',
    whyPopularContent: '現代軟體開發普遍遵循 `vMAJOR.MINOR.PATCH`（例如 v1.2.3）：MAJOR 代表破壞性重大升級 (Breaking Change)，MINOR 代表向下相容的新功能，PATCH 代表向下相容的 Bug 修復。搭配 Git Tag 能讓團隊與使用者清楚掌握每次改版幅度。',
    pitfalls: [
      '⚠️ 預設不 push：執行 `git push` 時，預設不會 push 標籤！必須打 `git push origin <tag>` 或 `git push origin --tags`。',
      '💡 刪除遠端標籤手勢：若標籤打錯，可打 `git tag -d <tag>` 刪除本地，再打 `git push origin :refs/tags/<tag>` 刪除遠端。'
    ]
  },

  '16': {
    targetCommand: 'git log -S "CRITICAL_SECRET_TOKEN" --oneline',
    summary: '程式碼考古學：使用鶴嘴鎬 (Pickaxe) 精準搜尋特定函式或變數在何時被新增或移除，搭配 blame 追查責任。',
    scenarioContext: {
      role: '架構考古學家',
      situation: '一個關鍵的加密密鑰變數突然找不到了！如果用普通搜尋會搜到大量排版變動的雜訊。你需要精準揪出到底是在哪一次提交中被真正引入或刪除的。'
    },
    guidedSteps: [
      {
        step: 1,
        cmd: 'git log -S "CRITICAL_SECRET_TOKEN" --oneline',
        category: 'required',
        why: '鶴嘴鎬只匹配該字串出現次數有改變的提交，精準鎖定變數增減的關鍵節點。'
      },
      {
        step: 2,
        cmd: 'git blame db.js',
        category: 'required',
        why: '逐行追溯檔案中每行程式碼的最後修改者、提交 Hash 與修改時間。'
      },
      {
        step: 3,
        cmd: 'git log --oneline --graph',
        category: 'optional',
        why: '以單行 ASCII 樹狀圖視覺化呈現分支歷史與合併分叉拓撲結構。'
      },
      {
        step: 4,
        cmd: 'git blame -L 10,20 db.js',
        category: 'optional',
        why: '限制只追蹤指定行號範圍內的責任歸屬，避免大檔案資訊過量。'
      }
    ],
    variations: [
      {
        cmd: 'git log -S "<搜尋字串>" --oneline',
        name: '鶴嘴鎬搜尋 (Pickaxe Search)',
        desc: '精確找出「增減該字串出現次數」的 Commit，排除單純格式排版或無關搬移。',
        isPopular: true,
        popularReason: '【★ 考古神技】當某個核心函式莫名失蹤時，數秒內揪出是誰在哪次提交中刪掉的！'
      },
      {
        cmd: 'git blame -L <起始行>,<結束行> <檔案>',
        name: '逐行責任追查 (Git Blame)',
        desc: '列出指定行數範圍內每一行的最後修改者、Commit Hash 與修改日期。',
        isPopular: true,
        popularReason: '了解一段奇怪程式碼當初撰寫時的上下文背景。'
      },
      {
        cmd: 'git log --oneline --graph',
        name: '視覺化單行歷史樹',
        desc: '以 ASCII 樹狀圖單行呈現分支合併與分叉拓撲結構，直觀掌握版本演進。',
        isPopular: true,
        popularReason: '【★ 最推日誌檢視】終端機中最直觀好讀的分支歷史檢視方式。'
      },
      {
        cmd: 'git log -p <檔案名稱>',
        name: '檢視單一檔案完整修補歷史',
        desc: '逐一展開該檔案自誕生以來每次提交的詳細程式碼差異 (Diff)。',
        isPopular: false
      }
    ],
    whyPopularTitle: 'git log -S 與普通搜尋有何根本不同？',
    whyPopularContent: '一般的文字搜尋（如 `git log --grep`）只會搜尋 Commit 的「訊息標題與內文」；而 `git log -S` 則是深入檢查「程式碼 patch 內容 (Diff)」，且它只在該字串的「出現次數發生改變」時才匹配！這意味著如果有人只是重新排版整份檔案，-S 不會誤報，只會精準命中真正新增或刪除該字串的那一刻。',
    pitfalls: [
      '⚠️ Blame 的心態：Git Blame 的初衷不是為了推卸責任，而是為了找到當時修改的人請教該邏輯的設計背景。',
      '💡 忽略排版：在執行 blame 時加上 `-w` 可以自動忽略純粹的空白排版變動。'
    ]
  },

  '17': {
    targetCommand: 'git config rerere.enabled true',
    summary: '重複衝突終結者：啟用 Reuse Recorded Resolution，讓 Git 自動記憶衝突解法並自動填入。',
    scenarioContext: {
      role: '長期重構工程師',
      situation: '你維護一條長期的重構分支，每天都要 rebase main 一次。每天面對相同的 10 個衝突，每次都要手動解一遍，嚴重浪費生命！'
    },
    guidedSteps: [
      {
        step: 1,
        cmd: 'git config rerere.enabled true',
        category: 'required',
        why: '啟用 Reuse Recorded Resolution 機制，讓 Git 自動記錄後續所有衝突解決方案。'
      },
      {
        step: 2,
        cmd: 'git merge feature/api',
        category: 'required',
        why: '執行分支合併以觸發衝突，建立初次衝突解法指紋記錄。'
      },
      {
        step: 3,
        cmd: 'git rerere diff',
        category: 'optional',
        why: '檢視當前工作目錄衝突狀態與 rerere 已記錄解決方案之間的程式碼差異。'
      },
      {
        step: 4,
        cmd: 'git rerere status',
        category: 'optional',
        why: '查看目前受 rerere 機制追蹤且正在處理中的衝突檔案清單。'
      }
    ],
    variations: [
      {
        cmd: 'git config rerere.enabled true',
        name: '開啟當前 repo Rerere',
        desc: 'Git 會在背後悄悄記錄你每次解決衝突時的前後程式碼指紋與解決方案。',
        isPopular: true,
        popularReason: '【★ 長期 Rebase 救星】下次再遇到相同衝突時，Git 在 0 秒內全自動套用解法！'
      },
      {
        cmd: 'git rerere diff',
        name: '檢視衝突與記憶解法差異',
        desc: '比對當前工作區中的衝突狀態與 rerere 預先記錄之已解決方案的差異。',
        isPopular: false
      },
      {
        cmd: 'git rerere status',
        name: '列出受 rerere 追蹤的檔案',
        desc: '印出目前正在受 rerere 衝突記憶機制處理與追蹤的衝突檔案清單。',
        isPopular: false
      },
      {
        cmd: 'git config --global rerere.enabled true',
        name: '全域啟用 Rerere',
        desc: '讓整台電腦的所有專案都享受自動衝突記憶。',
        isPopular: true,
        popularReason: '資深工程師配置檔標配。'
      }
    ],
    whyPopularTitle: 'Rerere 能解決什麼極度痛苦的痛點？',
    whyPopularContent: '如果你維護一條長期的重構分支，每天都要 rebase main 一次；或者一個主題分支需要連續被合併到 staging 與 production。在沒有 rerere 的情況下，相同的衝突你每天都要手動解一次！開啟 rerere 後，你只要解第一次，往後所有相同的衝突 Git 自動填寫，省下無數青春。',
    pitfalls: [
      '⚠️ 如果第一次解錯了怎麼辦：若記錄了一次錯誤的衝突解法，可以使用 `git rerere forget <file>` 清除記憶。',
      '💡 自動暫存：搭配 `git config rerere.autoupdate true`，Git 還能自動將套用好的檔案加入暫存區。'
    ]
  },

  '18': {
    targetCommand: 'git commit --amend -m "feat: release v1.0.0"',
    summary: '完美補完：剛送出 Commit 卻發現漏加了一個檔案或有筆誤？在不增加歷史髒節點的前提下原處修補。',
    scenarioContext: {
      role: '專案開發者',
      situation: '剛按 Enter 送出 commit，才猛然發現忘了把 assets/logo.png 加入暫存，且提交訊息打錯了一個字母。如果再推一個 "fix typo" commit 會讓歷史很醜陋。'
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
    whyPopularTitle: '為什麼不能直接再 push 一個 "fix typo" commit？',
    whyPopularContent: '頻繁產生 "fix typo", "oops forgotten file" 等 patch commit 會污染歷史，讓未來的 `git log` 與 PR Review 充滿噪音。善用 `git commit --amend` 能讓最後一次提交保持原子性與完整性。',
    pitfalls: [
      '🚨 已 push 到遠端時請謹慎：`--amend` 會產生全新 Hash，若該提交已經 push 到遠端，再次 push 需要 force push，可能影響正在依賴它的同事。',
      '💡 本地修改隨意用：在提交尚未 push 上遠端之前，隨時都可以安全地 amend。'
    ]
  },

  '19': {
    targetCommand: 'git stash -u',
    summary: '救急暫存：手邊工作寫到一半突遇緊急任務？將修改與未追蹤檔案安全收進貯藏棧，隨時乾淨復原。',
    scenarioContext: {
      role: '敏捷開發者',
      situation: '正在寫一個大功能，檔案改了一半、還新增了 3 個未追蹤檔案。老闆突然叫你馬上切換到 main 修復緊急 bug，而此時工作區一團亂無法切換。'
    },
    guidedSteps: [
      {
        step: 1,
        cmd: 'git stash -u',
        category: 'required',
        why: '將工作區修改連同未追蹤檔案全數封存至暫存堆疊，瞬間還原乾淨工作區。'
      },
      {
        step: 2,
        cmd: 'git switch main',
        category: 'required',
        why: '切換至主線分支以進行緊急修復任務。'
      },
      {
        step: 3,
        cmd: 'git stash pop',
        category: 'required',
        why: '切回原分支後彈出並還原暫存改動，同時自暫存堆疊中移除該紀錄。'
      },
      {
        step: 4,
        cmd: 'git stash show -p',
        category: 'optional',
        why: '以 patch 差異格式詳細檢視暫存堆疊中最頂層的程式碼改動細節。'
      },
      {
        step: 5,
        cmd: 'git stash drop',
        category: 'optional',
        why: '手動丟棄指定或最頂層的暫存紀錄，清理已不再需要的草稿堆疊。'
      }
    ],
    variations: [
      {
        cmd: 'git stash -u (或 --include-untracked)',
        name: '暫存工作區與未追蹤檔案',
        desc: '連同新建立的未追蹤檔案一起收進 stash 堆疊，確保工作區 100% 潔淨。',
        isPopular: true,
        popularReason: '【★ 最推 Stash 手法】普通 git stash 會遺漏新檔案，加上 -u 才最保險！'
      },
      {
        cmd: 'git stash pop',
        name: '彈出並套用最新暫存',
        desc: '將堆疊頂部的暫存變更還原回工作目錄，並自 stash 列表中移除。',
        isPopular: true,
        popularReason: '做完緊急任務回來繼續工時的日常手勢。'
      },
      {
        cmd: 'git stash show -p',
        name: '檢視最新暫存 patch 差異',
        desc: '以完整 Diff patch 格式展開暫存堆疊頂層修改的每行程式碼細節。',
        isPopular: true,
        popularReason: '在 pop 還原前確認暫存內容是否符合預期的最佳方式。'
      },
      {
        cmd: 'git stash drop',
        name: '丟棄特定或最新暫存',
        desc: '自暫存堆疊中刪除指定或最新的一筆暫存紀錄，釋放暫存空間。',
        isPopular: false
      },
      {
        cmd: 'git stash list',
        name: '檢視當前暫存堆疊清單',
        desc: '查看當前存了幾包草稿（stash@{0}, stash@{1}...）。',
        isPopular: true,
        popularReason: '確認堆疊狀態必備。'
      },
      {
        cmd: 'git stash clear',
        name: '清空所有暫存堆疊',
        desc: '一口氣刪除所有貯藏的歷史草稿。',
        isPopular: false
      }
    ],
    whyPopularTitle: '普通 git stash vs git stash -u 的巨大陷阱',
    whyPopularContent: '很多工程師敲了 `git stash` 以為萬無一失，切換分支後卻赫然發現剛新增的 5 個檔案還孤零零地留在工作目錄！這是因為預設的 stash「只會暫存已被 Git 追蹤的修改」。加上 `-u`（--include-untracked）才能真正把所有新檔案乾淨打包。',
    pitfalls: [
      '⚠️ pop 發生衝突：若在其他分支修改了相同檔案，`stash pop` 可能會引發衝突，解完衝突後該 stash 不會自動自列表中消失。',
      '💡 與 Worktree 的取捨：短暫切換可用 stash；若任務需長期並行，強烈建議使用第 09 關的 `git worktree`。'
    ]
  },

  '20': {
    targetCommand: 'git clean -fd',
    summary: '乾淨俐落：強制清理工作目錄中所有未受控的臨時檔與垃圾目錄，搭配 -n 乾跑預覽防手滑。',
    scenarioContext: {
      role: '程式碼整潔專家',
      situation: '專案進行模組重構，需要更名核心檔案；同時本地測試留下了大量未受控的臨時檔與垃圾目錄需要徹底大掃除。'
    },
    guidedSteps: [
      {
        step: 1,
        cmd: 'git mv utils.py helpers.py',
        category: 'required',
        why: '在檔案系統與 Git 索引層級同步更名，保持檔案版本歷史連貫性。'
      },
      {
        step: 2,
        cmd: 'git clean -fd',
        category: 'required',
        why: '強制刪除所有未追蹤的檔案與目錄，徹底清理工作目錄雜物。'
      },
      {
        step: 3,
        cmd: 'git commit -m "refactor: rename utils to helpers"',
        category: 'required',
        why: '正式提交檔案更名結果，完成模組重構。'
      },
      {
        step: 4,
        cmd: 'git clean -nd',
        category: 'optional',
        why: '以演習模式預覽即將被清除的未追蹤檔案與目錄，避免誤刪重要資料。'
      }
    ],
    variations: [
      {
        cmd: 'git clean -nd (Dry-run 預覽)',
        name: '乾跑預覽 (絕不手滑)',
        desc: '先列出有哪些未追蹤檔案與目錄即將被刪除，但「完全不執行任何實體刪除」。',
        isPopular: true,
        popularReason: '【★ 資深工程師防手滑指南】在敲下毀滅性指令前必先預覽！'
      },
      {
        cmd: 'git clean -fd',
        name: '強制清除檔案與目錄',
        desc: '-f 代表 force 強制執行，-d 代表遞迴包含整個未追蹤目錄。',
        isPopular: true,
        popularReason: '快速還原潔淨編譯環境的終極大掃除手勢。'
      },
      {
        cmd: 'git mv <舊檔名> <新檔名>',
        name: '版本控管重新命名',
        desc: '在作業系統層級更名並自動在 Git 索引中登記更名，避免被判定為一刪一增。',
        isPopular: true,
        popularReason: '保持檔案歷史歷史追蹤連貫性的標準更名指令。'
      }
    ],
    whyPopularTitle: '為什麼不能直接在檔案總管手動刪除或更名？',
    whyPopularContent: '若手動更名檔案，Git 在 status 裡可能會顯示為「刪除 old.js」與「新增 new.js」，導致部分歷史連貫性失真；使用 `git mv` 能讓 Git 直接辨識出更名動作。而當本地殘留大量未追蹤的編譯暫存檔時，手動挑選極易漏網，`git clean -fd` 能瞬間還原無瑕狀態。',
    pitfalls: [
      '🚨 永遠無法救回警告：`git clean` 刪除的是未追蹤檔案，這些檔案從未進入過 Git repo，因此無法透過 reflog 救回！',
      '💡 避坑原則：養成習慣先打 `git clean -nd` 看清楚名單，確認沒有誤刪未存檔的重要程式碼，再打 `-fd`。'
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
        desc: '僅下載遠端最新的 Commit、分支與標籤至本地的 origin/* 快取，絕不自動合併或改動你的程式碼。',
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
      situation: '高見龍老師書中超經典狀況題！寫得太順手忘了開分支，直接在 main 上面敲了 2 個功能提交！如何不傷及程式碼的前提下，把這 2 個提交移到新分支並把 main 退回原狀？'
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
    whyPopularContent: '在真實工作中，90% 的人都曾恍神「忘記開分支，直接在 main 上面敲了 git commit」。許多人手忙腳亂地開始複製貼上備份檔案。其實 Git 的分支本質上只是一個「貼紙（指標）」！只要在原地貼上新分支貼紙，再把 main 貼紙撕下來貼回前一個節點，10 秒內毫髮無傷化解危機！',
    pitfalls: [
      '🚨 順序不可顛倒：務必先執行 `git branch <new>` 錨定住 Commit，然後才執行 reset；如果先執行了 reset --hard，該 Commit 就會變成孤兒節點（需靠 reflog 找回）。',
      '💡 適用情境：此操作適用於該 Commit 尚未被 push 到遠端共享 main 的情況。'
    ]
  },

  '23': {
    targetCommand: 'git cat-file -p <Hash>',
    summary: '底層透視：使用 Plumbing 水管指令解密 .git 核心，透視 Commit、Tree 與 Blob 物件的 SHA-1 內容定址本質。',
    scenarioContext: {
      role: '底層架構探險家',
      situation: 'Git 到處都是 40 位的 SHA-1 雜湊，到底背後是怎麼存資料的？你將化身水管工人，使用底層 Plumbing 指令解密 .git 核心內容定址資料庫。'
    },
    guidedSteps: [
      {
        step: 1,
        cmd: 'git cat-file -t HEAD',
        category: 'required',
        why: '查詢指定物件的底層資料型別（commit、tree 或 blob）。'
      },
      {
        step: 2,
        cmd: 'git cat-file -p HEAD',
        category: 'required',
        why: '美化傾印 HEAD 提交物件內容，透視作者資訊、父節點與關聯 Tree 雜湊。'
      },
      {
        step: 3,
        cmd: 'git rev-parse HEAD',
        category: 'optional',
        why: '解析引用並輸出當前 HEAD 提交對應的完整 40 位 SHA-1 雜湊字串。'
      }
    ],
    variations: [
      {
        cmd: 'git cat-file -p <Hash>',
        name: '美化解密物件內容 (Pretty-print)',
        desc: '自動判斷物件類型，並將其原始內容（Commit 資訊、Tree 目錄清單或 Blob 檔案文字）美化輸出。',
        isPopular: true,
        popularReason: '【★ 水管底層探索神器】透視 Git 物件內容的最直覺指令！'
      },
      {
        cmd: 'git cat-file -t <Hash>',
        name: '查看底層物件類型 (Type)',
        desc: '輸出該 40 位 SHA-1 雜湊代表的物件種類：commit, tree, blob, 或 tag。',
        isPopular: true,
        popularReason: '快速辨識物件性質。'
      },
      {
        cmd: 'git rev-parse HEAD',
        name: '輸出完整 40 位 SHA-1 雜湊',
        desc: '解析 HEAD 引用符號，印出其對應的完整 40 位 SHA-1 雜湊字串。',
        isPopular: true,
        popularReason: '在 CI/CD 腳本或自動化部署中取得精確 Commit SHA 的標準指令。'
      },
      {
        cmd: 'git ls-tree <Hash>',
        name: '列出 Tree 物件的檔案結構',
        desc: '類似 Linux 的 ls 指令，展開該資料夾快照包含的所有檔案與權限。',
        isPopular: false
      }
    ],
    whyPopularTitle: '揭開 Git 的神秘面紗：本質就是一個內容定址鍵值資料庫！',
    whyPopularContent: 'Git 的底層設計極其優雅簡單：Blob 代表檔案內容（不含檔名）；Tree 代表資料夾結構（紀錄檔名與對應的 Blob/Tree Hash）；Commit 代表一個版本快照，包含指向特定 Tree 的指標、父節點 Hash、作者與提交訊息。所有資料都以 SHA-1 Hash 作為 Key，儲存在 `.git/objects/` 中！',
    pitfalls: [
      '⚠️ 檔名不屬於 Blob：Blob 只存檔案的內容，完全不記錄檔案名稱！這就是為什麼兩個不同路徑、不同檔名的檔案若內容完全相同，在 Git 裡只會共用同一個 Blob 物件。',
      '💡 只要前 4~6 碼即可：在查詢 Hash 時，通常只需輸入前 4 到 6 位字元，只要在 repo 中不重複，Git 就能精確識別。'
    ]
  }
};
