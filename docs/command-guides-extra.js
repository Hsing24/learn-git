/**
 * COMMAND_GUIDES_EXTRA - 新增關卡 24-35 指令解說與指引庫
 */

const COMMAND_GUIDES_EXTRA = {
  '24': {
    targetCommand: 'git status -s && git diff && git diff --staged && git log --oneline --graph && git show HEAD~1',
    summary: '看懂工作區、暫存區與版本歷史的全貌，掌握 status -s 雙欄代碼與 HEAD 相對參照。',
    scenarioContext: {
      role: '接手前輩半成品的菜鳥工程師',
      situation: '小明前輩下班前把未完成的半成品丟給你。在急著寫新程式碼之前，菜鳥必須用偵探四部曲精準看清「前輩改了什麼、暫存了什麼、歷史進度在哪裡」。'
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
    "targetCommand": "git restore → git reset --mixed → git reset --hard → git reset --soft",
    "summary": "Restore 預設從索引還原工作區；reset 的三種模式控制 HEAD、索引與工作區。用獨立分支實際比較。",
    "guidedSteps": [
        {
            "step": 1,
            "cmd": "git restore config.js",
            "category": "required",
            "why": "從目前索引恢復設定檔。"
        },
        {
            "step": 2,
            "cmd": "git restore --staged debug.log",
            "category": "required",
            "why": "從 HEAD 更新索引，移除未追蹤 debug 的暫存；本機內容仍在。"
        },
        {
            "step": 3,
            "cmd": "git switch mixed-demo",
            "category": "required",
            "why": "在練習分支觀察原 WIP。"
        },
        {
            "step": 4,
            "cmd": "git reset --mixed HEAD~1",
            "category": "required",
            "why": "移動 HEAD 並重設索引，變更留在工作區。"
        },
        {
            "step": 5,
            "cmd": "git restore payment.js",
            "category": "required",
            "why": "索引現在是 base，還原工作區後可切分支。"
        },
        {
            "step": 6,
            "cmd": "git switch hard-demo",
            "category": "required",
            "why": "進入另一個獨立練習分支。"
        },
        {
            "step": 7,
            "cmd": "git reset --hard HEAD~1",
            "category": "required",
            "why": "HEAD、索引與追蹤檔案工作區都回復 base。"
        },
        {
            "step": 8,
            "cmd": "git switch main",
            "category": "required",
            "why": "回到主要練習。"
        },
        {
            "step": 9,
            "cmd": "git reset --soft HEAD~1",
            "category": "required",
            "why": "只移動 HEAD，WIP 內容保留在索引。"
        },
        {
            "step": 10,
            "cmd": "git commit -m \"feat: complete payment setup\"",
            "category": "required",
            "why": "重新保存原功能變更，不包含 debug.log。"
        }
    ],
    "variations": [
        {
            "cmd": "git restore --source=HEAD <file>",
            "desc": "明確從 HEAD 還原工作區。"
        }
    ],
    "pitfalls": [
        "--hard 會丟棄追蹤檔案未提交變更，先確認需要保存的內容。"
    ]
},

  '26': {
      "targetCommand": "git merge --no-ff feature/a → git merge --squash feature/b → git commit -m \"feat: integrate b\" → git branch -d feature/a → git branch -D feature/b",
      "summary": "比較 --no-ff 合併提交與 squash 後的單親提交。GitHub PR 的合併選項為 merge、squash、rebase merge。",
      "guidedSteps": [
          {
              "step": 1,
              "cmd": "git merge --no-ff feature/a",
              "category": "required",
              "why": "即使可快進，仍建立雙親合併提交。"
          },
          {
              "step": 2,
              "cmd": "git merge --squash feature/b",
              "category": "required",
              "why": "把整體變更放到索引，尚未建立提交，也不建立第二個 parent。"
          },
          {
              "step": 3,
              "cmd": "git commit -m \"feat: integrate b\"",
              "category": "required",
              "why": "保存 squash 快照。"
          },
          {
              "step": 4,
              "cmd": "git branch -d feature/a",
              "category": "required",
              "why": "刪除已可確認合併的分支。"
          },
          {
              "step": 5,
              "cmd": "git branch -D feature/b",
              "category": "required",
              "why": "squash 不保留祖先關係，確認內容後才強制刪除。"
          }
      ],
      "variations": [],
      "pitfalls": [
          "GitHub 沒有獨立 Fast-forward 按鈕；命令列的快進是另一種拓撲行為。"
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
      "targetCommand": "git switch abort-demo → git rebase main → git rebase --abort → git switch skip-demo → git rebase main → git rebase --skip → git switch feature → git rebase main → git add app.py → git rebase --continue",
      "summary": "同一組提交在三個分支練習中斷處理；skip 會丟棄當前提交的變更。",
      "guidedSteps": [
          {
              "step": 1,
              "cmd": "git switch abort-demo",
              "category": "required",
              "why": "獨立試做，不改動最終 feature。"
          },
          {
              "step": 2,
              "cmd": "git rebase main",
              "category": "required",
              "why": "遇到 step 2 衝突。"
          },
          {
              "step": 3,
              "cmd": "git rebase --abort",
              "category": "required",
              "why": "回復原分支 tip 與開始前狀態。"
          },
          {
              "step": 4,
              "cmd": "git switch skip-demo",
              "category": "required",
              "why": "僅在此分支刻意捨棄 step 2。"
          },
          {
              "step": 5,
              "cmd": "git rebase main",
              "category": "required",
              "why": "再觸發同一衝突。"
          },
          {
              "step": 6,
              "cmd": "git rebase --skip",
              "category": "required",
              "why": "丟棄衝突提交，繼續 step 3；helper 與 test 仍應保留。"
          },
          {
              "step": 7,
              "cmd": "git switch feature",
              "category": "required",
              "why": "完成保留所有功能的正式練習。"
          },
          {
              "step": 8,
              "cmd": "git rebase main",
              "category": "required",
              "why": "衝突時在檔案頁整合 main 與 feature 的內容。"
          },
          {
              "step": 9,
              "cmd": "git add app.py",
              "category": "required",
              "why": "標記手動解法。"
          },
          {
              "step": 10,
              "cmd": "git rebase --continue",
              "category": "required",
              "why": "繼續重播其餘提交。"
          }
      ],
      "variations": [],
      "pitfalls": [
          "Rebase 衝突中的 ours 通常是新基底側，theirs 是正在重播的提交，與日常 merge 的直覺可能不同。",
          "Skip 並非快速解衝突；當前提交的差異會被捨棄。"
      ]
  },

  '30': {
    targetCommand: 'git commit --fixup <hash> && git rebase -i --autosquash main',
    summary: '優雅修補歷史提交：利用 --fixup 標記與 --autosquash 自動移位嫁接。',
    scenarioContext: {
      role: 'PR 收到 Code Review 回饋的工程師',
      situation: 'Reviewer 強哥在你的 PR 抓出 3 個 commit 前有個 typo。強哥嚴禁醜陋的 "fix typo" commit 污染歷史，請用 --fixup 進行微創手術自動融進原提交！'
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
      "targetCommand": "git fetch origin → git rebase origin/main → git push --force-with-lease origin feature/cart → git lab pr merge → git switch main → git pull --ff-only → git branch -d feature/cart → git fetch --prune",
      "summary": "更新既有 PR，再模擬遠端合併並同步清理。預設 lease 以本機 remote-tracking ref 為預期值。",
      "guidedSteps": [
          {
              "step": 1,
              "cmd": "git fetch origin",
              "category": "required",
              "why": "更新遠端追蹤參照。"
          },
          {
              "step": 2,
              "cmd": "git rebase origin/main",
              "category": "required",
              "why": "重播功能提交至最新主線。"
          },
          {
              "step": 3,
              "cmd": "git push --force-with-lease origin feature/cart",
              "category": "required",
              "why": "以租約更新改寫的功能歷史。"
          },
          {
              "step": 4,
              "cmd": "git lab pr merge",
              "category": "required",
              "why": "模擬託管服務合併 PR、刪除遠端功能分支；這是本練習指令，不是 Git 原生命令。"
          },
          {
              "step": 5,
              "cmd": "git switch main",
              "category": "required",
              "why": "回到本機主線。"
          },
          {
              "step": 6,
              "cmd": "git pull --ff-only",
              "category": "required",
              "why": "同步遠端合併結果。"
          },
          {
              "step": 7,
              "cmd": "git branch -d feature/cart",
              "category": "required",
              "why": "刪除已合併本機分支。"
          },
          {
              "step": 8,
              "cmd": "git fetch --prune",
              "category": "required",
              "why": "移除遠端已不存在的 tracking ref。"
          }
      ],
      "variations": [
          {
              "cmd": "git push --force-with-lease=refs/heads/feature/cart:<expected-hash> origin feature/cart",
              "desc": "明確指定預期遠端值，避免背景 fetch 更新預設租約基準。"
          }
      ],
      "pitfalls": [
          "Lease 不是絕對防護；背景 fetch 可能改變預期值。仍須審查範圍並與團隊協調。",
          "git lab pr merge 只在瀏覽器模擬器使用；CLI 以本機 bare remote 模擬，真實 PR 合併在託管平台進行。"
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
      situation: '小明前輩 3 個 commit 前不小心將包含 AWS Key 的 .env 推送至遠端！資安前輩阿威全組通報：先撤銷並輪替憑證，再用重型工具抹除歷史，通知團隊重新 clone！'
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
      "targetCommand": "git submodule add ./sub-repo libs/shared → git add .gitmodules libs/shared → git commit -m \"feat: add shared submodule\" → git submodule update --init --recursive",
      "summary": "Submodule 是另一個倉庫，父專案保存 gitlink 指定提交；消費端 clone 後還要初始化與更新。",
      "guidedSteps": [
          {
              "step": 1,
              "cmd": "git submodule add ./sub-repo libs/shared",
              "category": "required",
              "why": "建立 .gitmodules 與 gitlink。"
          },
          {
              "step": 2,
              "cmd": "git add .gitmodules libs/shared",
              "category": "required",
              "why": "暫存設定與固定提交。"
          },
          {
              "step": 3,
              "cmd": "git commit -m \"feat: add shared submodule\"",
              "category": "required",
              "why": "保存父專案引用。"
          },
          {
              "step": 4,
              "cmd": "git submodule update --init --recursive",
              "category": "required",
              "why": "消費端初始化並檢出父專案記錄的提交。"
          }
      ],
      "variations": [
          {
              "cmd": "git clone --recurse-submodules <url>",
              "desc": "Clone 時一併初始化子模組。"
          },
          {
              "cmd": "git submodule update --remote libs/shared",
              "desc": "刻意取得子模組遠端新版本；檢查後父專案仍須提交新 gitlink。"
          }
      ],
      "pitfalls": [
          "子模組通常檢出 detached HEAD；要開發需在子模組建立或切換分支。",
          "子模組的提交必須先推至其可存取的遠端，再推父專案的新 gitlink。"
      ]
  },

  '35': {
      "targetCommand": "git sparse-checkout init --cone → git sparse-checkout set packages/web → git sparse-checkout list",
      "summary": "Sparse Checkout 控制工作區展開範圍，不會自行縮減已下載的歷史或所有物件。",
      "guidedSteps": [
          {
              "step": 1,
              "cmd": "git sparse-checkout init --cone",
              "category": "required",
              "why": "啟用以目錄為主的 cone 模式。"
          },
          {
              "step": 2,
              "cmd": "git sparse-checkout set packages/web",
              "category": "required",
              "why": "工作區保留選定目錄，cone 模式也保留所需祖先目錄檔案。"
          },
          {
              "step": 3,
              "cmd": "git sparse-checkout list",
              "category": "required",
              "why": "檢查目前展開範圍。"
          }
      ],
      "variations": [
          {
              "cmd": "git sparse-checkout disable",
              "desc": "恢復完整工作區。"
          },
          {
              "cmd": "git clone --filter=blob:none --sparse <url>",
              "desc": "結合 partial clone 延後 blob 下載與 sparse 工作區；需要遠端支援 filter。"
          },
          {
              "cmd": "git clone --depth=1 <url>",
              "desc": "Shallow clone 截短歷史，與 sparse 的工作區範圍不同。"
          }
      ],
      "pitfalls": [
          "Sparse Checkout 不是「只下載這個子目錄」。Partial、shallow、sparse 可以組合但控制不同層面。"
      ]
  },

};

if (typeof COMMAND_GUIDES !== 'undefined') {
  Object.assign(COMMAND_GUIDES, COMMAND_GUIDES_EXTRA);
}
