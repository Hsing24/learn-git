/**
 * COMMAND_GUIDES_EXTRA - 新增關卡 24-35 指令解說與指引庫
 */

const COMMAND_GUIDES_EXTRA = {
  '24': {
    targetCommand: 'git status -s && git diff && git diff --staged && git log --oneline --graph && git show HEAD~1',
    summary: '看懂工作區、暫存區與版本歷史的全貌，掌握 status -s 雙欄代碼與 HEAD 相對參照。',
    scenarioContext: {
      role: '接手同事半成品專案的工程師',
      situation: '你剛接手了一個功能模組，工作區有些修改、暫存區有些改動，還有未追蹤檔案。在急著寫新代碼之前，必須精準看清「改了什麼、暫存了什麼、歷史長怎樣」。'
    },
    guidedSteps: [
      { step: 1, cmd: 'git status -s', category: 'required', why: '以簡短模式檢視狀態，第一欄為暫存區狀態，第二欄為工作目錄狀態。' },
      { step: 2, cmd: 'git diff', category: 'required', why: '比對工作區與暫存區之間的代碼差異。' },
      { step: 3, cmd: 'git diff --staged', category: 'required', why: '比對暫存區與 HEAD（最新提交）之間的差異，確認即將 commit 的變更。' },
      { step: 4, cmd: 'git log --oneline --graph', category: 'required', why: '以單行圖表檢視提交歷史拓撲。' },
      { step: 5, cmd: 'git show HEAD~1', category: 'required', why: '檢視前一個提交的詳細改動，掌握相對參照 HEAD~n 語法。' },
      { step: 6, cmd: 'git diff HEAD~2 HEAD --stat', category: 'optional', why: '快速統計最近兩次提交之間的改動檔案與行數。' }
    ],
    variations: [
      { cmd: 'git diff', desc: '比對工作區 vs 暫存區' },
      { cmd: 'git diff --staged', desc: '比對暫存區 vs 最新 commit' },
      { cmd: 'git show HEAD~1', desc: '檢視上一筆提交的完整細節與 diff' }
    ]
  },

  '25': {
    targetCommand: 'git restore <file> && git restore --staged <file> && git reset --soft HEAD~1',
    summary: '現代 Git 的三大多維度後悔藥：分別精準復原工作區、暫存區與提交記錄。',
    scenarioContext: {
      role: '下午不小心連續犯了三個失誤的工程師',
      situation: '你不小心改壞了 config.js（尚未暫存）、手滑將 debug.log 加進暫存區，還太早 commit 了半成品 wip。你需要安全有序地各個擊破還原。'
    },
    guidedSteps: [
      { step: 1, cmd: 'git restore config.js', category: 'required', why: '放棄工作區檔案的未暫存修改，精確還原至最新提交狀態。' },
      { step: 2, cmd: 'git restore --staged debug.log', category: 'required', why: '將檔案從暫存區移出（Unstage），本地硬碟上的實體檔案內容完好保留。' },
      { step: 3, cmd: 'git reset --soft HEAD~1', category: 'required', why: '撤銷最新的半成品 commit，將改動保留在暫存區以供重新組織。' },
      { step: 4, cmd: 'git commit -m "feat: complete feature correctly"', category: 'required', why: '重新建立單一且乾淨的正確 commit。' }
    ],
    variations: [
      { cmd: 'git restore <file>', desc: '放棄工作目錄修改' },
      { cmd: 'git restore --staged <file>', desc: '移出暫存區（不碰檔案內容）' },
      { cmd: 'git reset --soft HEAD~1', desc: '撤銷 commit 但保留暫存區' }
    ],
    resetModeRows: [
      { mode: '--soft', head: '移到指定提交', index: '保留原樣', workingTree: '保留原樣' },
      { mode: '--mixed（預設）', head: '移到指定提交', index: '重設到指定提交', workingTree: '保留原樣' },
      { mode: '--hard', head: '移到指定提交', index: '重設到指定提交', workingTree: '重設到指定提交' }
    ],
    resetModeWarning: '⚠️ --hard 會丟棄尚未提交的追蹤檔案變更。若移動錯 HEAD，可查看 git reflog（第 6 章）找回提交位置；reflog 無法保證還原未提交的工作區內容。'
  },

  '26': {
    targetCommand: 'git merge --no-ff feature/a && git merge --squash feature/b && git branch -D feature/b',
    summary: '實戰掌控 GitHub 三大合併按鈕的底層邏輯：Fast-forward、--no-ff 與 --squash。',
    scenarioContext: {
      role: '主線維護者 / 架構師',
      situation: '主管要求你在本機親手操作不同合併策略，體會分支保留、菱形節點與歷史壓縮的差異，並學會刪除未合併警告的分支。'
    },
    guidedSteps: [
      { step: 1, cmd: 'git merge --no-ff feature/a', category: 'required', why: '強制產生 Merge Commit，保留完整的特徵分支歷史脈絡。' },
      { step: 2, cmd: 'git merge --squash feature/b', category: 'required', why: '將 feature/b 的多個零碎改動壓扁成單一工作區變更。' },
      { step: 3, cmd: 'git commit -m "feat: implement feature b"', category: 'required', why: '為 squash 之後的變更提交一個全新精準的 commit。' },
      { step: 4, cmd: 'git branch -d feature/a', category: 'required', why: '正常刪除已完全合併的 feature/a 分支。' },
      { step: 5, cmd: 'git branch -D feature/b', category: 'required', why: '強制刪除 feature/b（因為 squash 不會保留祖先關係，-d 會被 Git 拒絕）。' }
    ],
    variations: [
      { cmd: 'git merge --no-ff <branch>', desc: '保留分支歷史的 Merge Commit' },
      { cmd: 'git merge --squash <branch>', desc: '壓扁多個提交為單一改動' },
      { cmd: 'git branch -D <branch>', desc: '強制刪除未被認定合併的分支' }
    ]
  },

  '27': {
    targetCommand: 'git switch --detach v1.0 && git commit -m "..." && git switch -c hotfix/v1-legacy',
    summary: '理解 Detached HEAD（分離頭指針）的本質，學會在歷史節點探索並安全救援孤兒提交。',
    scenarioContext: {
      role: '緊急維護舊版本的資深工程師',
      situation: 'PM 請你看一下 v1.0 釋出時的狀態。你切過去順手修了一個 bug 並 commit，切回 main 時 Git 警告你有孤兒 commit 未綁定分支。'
    },
    guidedSteps: [
      { step: 1, cmd: 'git switch --detach v1.0', category: 'required', why: '以分離 HEAD 模式切換至 v1.0 標籤，不會帶著任何分支游標移動。' },
      { step: 2, cmd: 'git commit -am "fix: legacy bug on v1.0"', category: 'required', why: '在分離 HEAD 狀態下建立修復 commit。' },
      { step: 3, cmd: 'git switch -c hotfix/v1-legacy', category: 'required', why: '為當前孤立的 commit 建立新分支，防止被 Git 垃圾回收機制回收。' },
      { step: 4, cmd: 'git switch main', category: 'required', why: '安全切回 main 主線。' }
    ],
    variations: [
      { cmd: 'git switch --detach <tag/hash>', desc: '切換至任意舊版本（分離 HEAD）' },
      { cmd: 'git switch -c <new-branch>', desc: '在目前位置直接貼上分支標籤' }
    ]
  },

  '28': {
    targetCommand: 'git clone origin app && git switch -c feature/profile && git push -u origin feature/profile && git branch -vv',
    summary: '遠端生命週期起點：Clone 遠端倉庫、開分支、首次推送追蹤與解析 branch -vv。',
    scenarioContext: {
      role: '新進專案成員',
      situation: '第一天加入團隊，需要從遠端倉庫 clone 專案、開啟自己的特徵分支、建立 upstream 關聯推送，並學會看懂 ahead 1, behind 2 的含義。'
    },
    guidedSteps: [
      { step: 1, cmd: 'git clone origin app', category: 'required', why: '將遠端倉庫完整複製到本地工作目錄。' },
      { step: 2, cmd: 'git switch -c feature/profile', category: 'required', why: '建立並切換至個人新功能分支。' },
      { step: 3, cmd: 'git commit -am "feat: user profile scaffold"', category: 'required', why: '在分支上完成提交。' },
      { step: 4, cmd: 'git push -u origin feature/profile', category: 'required', why: '推送至遠端並建立 upstream tracking 追蹤關係。' },
      { step: 5, cmd: 'git branch -vv', category: 'required', why: '檢視本地分支與遠端對應分支的追蹤與領先/落後狀態。' }
    ],
    variations: [
      { cmd: 'git push -u origin <branch>', desc: '首次推送並綁定上游' },
      { cmd: 'git branch -vv', desc: '詳細列出各分支與遠端領先/落後情況' }
    ]
  },

  '29': {
    targetCommand: 'git rebase main -> conflict -> git add <file> -> git rebase --continue',
    summary: '馴服 Rebase 中途衝突：掌握 rebase in progress 狀態機、ours/theirs 反轉與 abort/continue。',
    scenarioContext: {
      role: '向主線變基時遇到衝突的工程師',
      situation: '你執行 git rebase main 整理分支，結果第 2 個 commit 發生衝突，終端機停在半途中。你需要冷靜解衝突並推進狀態。'
    },
    guidedSteps: [
      { step: 1, cmd: 'git rebase main', category: 'required', why: '啟動變基，遇衝突時會停在發生問題的 commit 上。' },
      { step: 2, cmd: 'git status', category: 'required', why: '觀察 rebase in progress 提示，找到衝突檔案。' },
      { step: 3, cmd: 'git add <file>', category: 'required', why: '解決衝突後將檔案標記為 resolved（切勿在此時執行 git commit！）。' },
      { step: 4, cmd: 'git rebase --continue', category: 'required', why: '告訴 Git 衝突已解決，繼續套用後續的 commits。' }
    ],
    variations: [
      { cmd: 'git rebase --continue', desc: '解完衝突後繼續變基流程' },
      { cmd: 'git rebase --abort', desc: '放棄變基，瞬間回到起始原點' },
      { cmd: 'git rebase --skip', desc: '跳過當前 commit 不套用' }
    ]
  },

  '30': {
    targetCommand: 'git commit --fixup <hash> && git rebase -i --autosquash main',
    summary: '優雅修補歷史提交：利用 --fixup 標記與 --autosquash 自動移位嫁接。',
    scenarioContext: {
      role: 'PR 收到 Code Review 回饋的工程師',
      situation: 'Reviewer 指出你 3 個 commit 前的檔案有個 typo。你不希望產生醜陋的 "fix typo" commit，而是希望將修改自動融進原 commit。'
    },
    guidedSteps: [
      { step: 1, cmd: 'git add validator.js', category: 'required', why: '暫存 typo 修復的改動。' },
      { step: 2, cmd: 'git commit --fixup <target-hash>', category: 'required', why: '建立特殊語意 commit，標題自動設為 fixup! ...。' },
      { step: 3, cmd: 'git rebase -i --autosquash main', category: 'required', why: '自動將 fixup commit 挪到目標 commit 正下方並自動合併。' }
    ],
    variations: [
      { cmd: 'git commit --fixup <hash>', desc: '自動建立針對特定 hash 的修補提交' },
      { cmd: 'git rebase -i --autosquash <base>', desc: '自動對齊並合併所有 fixup' }
    ]
  },

  '31': {
    targetCommand: 'git fetch origin && git rebase origin/main && git push --force-with-lease && git fetch --prune',
    summary: '企業級 PR 完整生命週期：變基最新主線、安全租約強推與清理過期分支。',
    scenarioContext: {
      role: '團隊功能開發工程師',
      situation: '你的 PR 在等 Review 時主線已更新。主管要求先 rebase 最新 main 再推，且必須使用最安全的 --force-with-lease，PR 合併後要清理分支。'
    },
    guidedSteps: [
      { step: 1, cmd: 'git fetch origin', category: 'required', why: '抓取遠端最新分支指針與 commits。' },
      { step: 2, cmd: 'git rebase origin/main', category: 'required', why: '將自己的特徵分支嫁接在遠端最新 main 上。' },
      { step: 3, cmd: 'git push --force-with-lease', category: 'required', why: '安全強制推送：若遠端已被他人更新則自動拒絕，絕不盲目覆蓋同事進度。' },
      { step: 4, cmd: 'git switch main && git pull', category: 'required', why: 'PR 合併後切回主線並拉取最新結果。' },
      { step: 5, cmd: 'git branch -d feature/cart', category: 'required', why: '刪除本機已合併的特徵分支。' },
      { step: 6, cmd: 'git fetch --prune', category: 'required', why: '清除本機殘留的已刪除遠端分支追蹤參照。' }
    ],
    variations: [
      { cmd: 'git push --force-with-lease', desc: '帶有版本保護的現代強推最佳實踐' },
      { cmd: 'git fetch --prune', desc: '同步清理本地過期的遠端分支紀錄' }
    ]
  },

  '32': {
    targetCommand: 'git rebase --onto main feature/api feature/ui',
    summary: '解決 Stacked PR 斷頭路：利用 --onto 精確搬移分支嫁接基底。',
    scenarioContext: {
      role: '大型全端模組開發者',
      situation: '你在 feature/api 上開出 feature/ui。後來 feature/api 被 squash merge 進 main，導致 feature/ui 一 rebase main 就大量重複衝突。'
    },
    guidedSteps: [
      { step: 1, cmd: 'git rebase --onto main feature/api feature/ui', category: 'required', why: '將 feature/ui 獨有的 commits 精確拔起，跳過已 squash 的 feature/api，直接插在 main 頂端。' }
    ],
    variations: [
      { cmd: 'git rebase --onto <new-base> <old-base> <branch>', desc: '精準截枝嫁接指定範圍的 commits' }
    ]
  },

  '33': {
    targetCommand: 'git config lab.secret-rotation-confirmed yes && git filter-repo --path .env --invert-paths && git push --force-with-lease origin main',
    summary: '先撤銷並輪替外洩密鑰，再清理本機與遠端歷史；推送後要求團隊重新 clone。',
    scenarioContext: {
      role: '資安事故應變工程師',
      situation: '同事 3 個 commit 前不小心將包含 AWS Key 的 .env 推送至遠端！先撤銷並輪替憑證；Git 歷史改寫不會讓密鑰失效。清洗並推送後，要求團隊丟棄舊 clone、重新 clone。'
    },
    guidedSteps: [
      { step: 1, cmd: 'git config lab.secret-rotation-confirmed yes', category: 'required', why: '先在憑證服務撤銷並輪替密鑰。這行只記錄你的確認，不會自動撤銷憑證；清理 Git 歷史也不會讓舊密鑰失效。' },
      { step: 2, cmd: 'git filter-repo --path .env --invert-paths', category: 'required', why: '在乾淨 clone 中改寫所有 refs，移除 .env 歷史。若 CLI 未安裝，請參考 CLI 關卡的 filter-branch fallback，並一併刪除 refs/original、清理 reflog 和無引用物件。' },
      { step: 3, cmd: 'echo ".env" >> .gitignore && git add .gitignore && git commit -m "chore: ignore .env"', category: 'required', why: '確保 .gitignore 永久攔截未來再次誤傳。' },
      { step: 4, cmd: 'git push --force-with-lease origin main', category: 'required', why: '將洗淨後的新歷史更新到遠端。通知團隊停止使用舊 clone、丟棄舊 refs 並重新 clone；託管平台可能還需要依其敏感資料程序清理其他 refs、PR refs 和快取。' }
    ],
    variations: [
      { cmd: 'git filter-repo --path <file> --invert-paths', desc: '高效自歷史全盤剔除特定檔案' }
    ]
  },

  '34': {
    targetCommand: 'git submodule add <repo-url> libs/shared && git submodule update --init --recursive',
    summary: '跨專案代碼復用：Git Submodule 子模組的引用、固定版本與遞迴同步。',
    scenarioContext: {
      role: '微服務或套件模組架構師',
      situation: '專案需要引用外部共用函式庫，但希望保持獨立版本歷史與指定 Commit 鎖定。'
    },
    guidedSteps: [
      { step: 1, cmd: 'git submodule add ./sub-repo libs/shared', category: 'required', why: '在專案中掛載外部子模組並建立 .gitmodules 配置檔。' },
      { step: 2, cmd: 'git commit -am "feat: add shared submodule"', category: 'required', why: '提交子模組參照指針。' }
    ],
    variations: [
      { cmd: 'git clone --recurse-submodules <url>', desc: 'Clone 專案時一併遞迴初始化子模組' },
      { cmd: 'git submodule update --init', desc: '同步本地已註冊之子模組至目標版本' }
    ]
  },

  '35': {
    targetCommand: 'git clone --filter=blob:none --sparse <url> && git sparse-checkout set packages/web',
    summary: '超大型 Monorepo 救星：Sparse Checkout 局部檢出大幅縮減工作目錄體積。',
    scenarioContext: {
      role: 'Monorepo 前端開發者',
      situation: '公司代碼庫高達 50GB，但你只需要開發 packages/web，透過 sparse-checkout 避免下載與檢出無關的龐大目錄。'
    },
    guidedSteps: [
      { step: 1, cmd: 'git sparse-checkout init --cone', category: 'required', why: '啟用錐形 (Cone) 模式的局部檢出功能。' },
      { step: 2, cmd: 'git sparse-checkout set packages/web', category: 'required', why: '僅在本地工作區檢出 packages/web 目錄，其餘資料夾全部隱藏。' }
    ],
    variations: [
      { cmd: 'git sparse-checkout set <path>', desc: '指定只顯示特定子目錄' },
      { cmd: 'git sparse-checkout disable', desc: '關閉局部檢出，恢復完整目錄' }
    ]
  }
};

if (typeof COMMAND_GUIDES !== 'undefined') {
  Object.assign(COMMAND_GUIDES, COMMAND_GUIDES_EXTRA);
}
