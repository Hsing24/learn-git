/** Foundations and CLI elective command guides. */
const COMMAND_GUIDES_FOUNDATIONS = {
  "36": {
    "targetCommand": "git init -b main → git status → git add README.md → git diff --staged → git commit -m \"docs: first snapshot\"",
    "summary": "Git 是本機版本資料庫；init 建立 .git，add 保存索引快照，commit 建立提交與移動分支。",
    "guidedSteps": [
      {
        "step": 1,
        "cmd": "git init -b main",
        "category": "required",
        "why": "建立 main 的未出生分支；尚無提交。"
      },
      {
        "step": 2,
        "cmd": "git status",
        "category": "required",
        "why": "README 與 notes 仍未追蹤。"
      },
      {
        "step": 3,
        "cmd": "git add README.md",
        "category": "required",
        "why": "只暫存準備分享的 README。"
      },
      {
        "step": 4,
        "cmd": "git diff --staged",
        "category": "required",
        "why": "比較索引與 HEAD；第一筆提交之前即檢視待提交內容。"
      },
      {
        "step": 5,
        "cmd": "git commit -m \"docs: first snapshot\"",
        "category": "required",
        "why": "提交索引，不會自動納入 notes。"
      }
    ],
    "variations": [],
    "pitfalls": [
      "Git 與 GitHub 不同；本機 commit 不需要遠端或網路。"
    ]
  },
  "37": {
    "targetCommand": "git add report.txt → git status -s → git diff → git diff --staged → git commit -m \"docs: publish ready report\"",
    "summary": "Add 保存當時的內容，之後的工作區修改不會自動更新索引。",
    "guidedSteps": [
      {
        "step": 1,
        "cmd": "git add report.txt",
        "category": "required",
        "why": "暫存 ready 版本；接著在檔案頁改為 draft-after-add。"
      },
      {
        "step": 2,
        "cmd": "git status -s",
        "category": "required",
        "why": "MM 表示索引與工作區都各有差異。"
      },
      {
        "step": 3,
        "cmd": "git diff",
        "category": "required",
        "why": "比較工作區 draft 與索引 ready。"
      },
      {
        "step": 4,
        "cmd": "git diff --staged",
        "category": "required",
        "why": "比較索引 ready 與 HEAD base。"
      },
      {
        "step": 5,
        "cmd": "git commit -m \"docs: publish ready report\"",
        "category": "required",
        "why": "提交 ready；工作區 draft 修改仍保留。"
      }
    ],
    "variations": [],
    "pitfalls": [
      "commit -a 或再次 add 會改變待提交內容，不符合本關快照目標。"
    ]
  },
  "38": {
    "targetCommand": "git log --oneline → git revert bad-config → git log --oneline",
    "summary": "Revert 反轉指定提交的差異並新增提交，適合已共享的歷史。",
    "guidedSteps": [
      {
        "step": 1,
        "cmd": "git log --oneline",
        "category": "required",
        "why": "找出 bad-config，後面另有有效的 notice。"
      },
      {
        "step": 2,
        "cmd": "git revert bad-config",
        "category": "required",
        "why": "只撤銷錯誤設定，保留後續檔案與原本提交。"
      },
      {
        "step": 3,
        "cmd": "git log --oneline",
        "category": "required",
        "why": "原錯誤提交仍存在，新增一筆反向提交。"
      }
    ],
    "variations": [
      {
        "cmd": "git revert --abort",
        "desc": "發生衝突且尚未完成時，可放棄這次 revert。"
      }
    ],
    "pitfalls": [
      "Revert 仍可能衝突；應檢查結果與執行相關測試。",
      "普通 revert 不使用 -m；merge revert 才需要 mainline 選擇。"
    ]
  },
  "39": {
    "targetCommand": "git fetch origin → git log --oneline --graph --all → git pull --ff-only → git pull --no-rebase → git push origin main",
    "summary": "Pull 是 fetch 後整合。FF-only 在分歧時拒絕，merge 與 rebase 由使用者明確決定。",
    "guidedSteps": [
      {
        "step": 1,
        "cmd": "git fetch origin",
        "category": "required",
        "why": "先取得可比較的遠端追蹤參照。"
      },
      {
        "step": 2,
        "cmd": "git log --oneline --graph --all",
        "category": "required",
        "why": "觀察本機與遠端分歧。"
      },
      {
        "step": 3,
        "cmd": "git pull --ff-only",
        "category": "required",
        "why": "預期拒絕，本機 HEAD 不應被改成遠端版本。"
      },
      {
        "step": 4,
        "cmd": "git pull --no-rebase",
        "category": "required",
        "why": "選 merge 整合；也可改用下方 rebase 方案。"
      },
      {
        "step": 5,
        "cmd": "git push origin main",
        "category": "required",
        "why": "確認雙方內容保留後推送。"
      }
    ],
    "variations": [
      {
        "cmd": "git pull --rebase",
        "desc": "重播尚未共享的本機提交，改寫其 ID。"
      }
    ],
    "pitfalls": [
      "這裡兩方案擇一；不是要求先 merge 再 rebase。",
      "已共享歷史改寫前必須與協作者溝通。"
    ]
  },
  "40": {
    "targetCommand": "git config user.name → git config user.email → git remote -v → git remote set-url origin git@github.com:training/team-notes.git → git config lab.auth-diagnosis ssh-key → git config lab.permission-check required",
    "summary": "Web：修正 repo-info.txt 對應的模擬 SSH URL 並記錄診斷。CLI：閱讀 AUTH_CASES.md，將四種錯誤分類寫入 diagnosis.json；兩版本皆不連線真實服務。",
    "guidedSteps": [
      {
        "step": 1,
        "cmd": "git config user.name",
        "category": "required",
        "why": "Web 練習：作者名稱不提供遠端權限。"
      },
      {
        "step": 2,
        "cmd": "git config user.email",
        "category": "required",
        "why": "Web 練習：作者信箱亦不等於登入帳號。"
      },
      {
        "step": 3,
        "cmd": "git remote -v",
        "category": "required",
        "why": "Web 練習：確認 SSH host、owner 與 repo；對照 repo-info.txt。"
      },
      {
        "step": 4,
        "cmd": "git remote set-url origin git@github.com:training/team-notes.git",
        "category": "required",
        "why": "Web 練習：修正錯誤 owner。"
      },
      {
        "step": 5,
        "cmd": "git config lab.auth-diagnosis ssh-key",
        "category": "required",
        "why": "Web 練習：根據 publickey 錯誤記錄 SSH 金鑰驗證診斷；此 lab 設定不修復實際金鑰。"
      },
      {
        "step": 6,
        "cmd": "git config lab.permission-check required",
        "category": "required",
        "why": "Web 練習：確認仍須檢查該帳號或金鑰是否有 repo 權限。"
      }
    ],
    "variations": [
      {
        "cmd": "git remote get-url origin",
        "desc": "查看 URL。"
      },
      {
        "cmd": "git remote set-url origin https://github.com/training/team-notes.git",
        "desc": "改用 HTTPS 時需服務支援的 token/credential helper；不是改 user.email 就能登入。"
      },
      {
        "cmd": "cat AUTH_CASES.md",
        "desc": "CLI 練習：閱讀本機四個作者、驗證、URL、權限案例。"
      },
      {
        "cmd": "git config --show-origin --get user.email",
        "desc": "CLI 練習：查看作者設定與來源；它不授予遠端權限。"
      },
      {
        "cmd": "printf '{\"case1\":\"authentication\",\"case2\":\"url\",\"case3\":\"permission\",\"case4\":\"author\"}\\n' > diagnosis.json",
        "desc": "CLI 練習：讀完案例後將分類寫入 fixture 要求的 JSON；CLI 不使用 Web 的 lab.auth-diagnosis 設定。"
      },
      {
        "cmd": "./git-lab verify",
        "desc": "CLI 練習：檢查 diagnosis.json；不執行真實遠端驗證。"
      }
    ],
    "pitfalls": [
      "不要將私鑰、token 或密碼寫入 repo 或遠端 URL。",
      "Permission denied (publickey) 指向 SSH 驗證；Repository not found 也可能來自 URL 或存取權限。"
    ]
  },
  "41": {
    "targetCommand": "git check-ignore -v build/output.js debug.log → git check-ignore -v logs/keep.log → git add . → git commit -m \"chore: ignore generated files\"",
    "summary": "Ignore 只影響未追蹤路徑。以 directory、glob 與否定規則保留例外。",
    "guidedSteps": [
      {
        "step": 1,
        "cmd": "git check-ignore -v build/output.js debug.log",
        "category": "required",
        "why": "先在檔案頁設定 build/、*.log、!logs/keep.log，再檢查規則來源。"
      },
      {
        "step": 2,
        "cmd": "git check-ignore -v logs/keep.log",
        "category": "required",
        "why": "Verbose 可顯示 ! 規則；它表示此檔案沒有被忽略。"
      },
      {
        "step": 3,
        "cmd": "git add .",
        "category": "required",
        "why": "只有 .gitignore 與 keep.log 應進入索引。"
      },
      {
        "step": 4,
        "cmd": "git commit -m \"chore: ignore generated files\"",
        "category": "required",
        "why": "保存規則與範例。"
      }
    ],
    "variations": [
      {
        "cmd": "git check-ignore logs/keep.log",
        "desc": "非 verbose：沒有被忽略通常無輸出、exit 1。"
      }
    ],
    "pitfalls": [
      "被忽略的父目錄不會被遍歷；忽略 logs/ 後只寫 !logs/keep.log 無法直接重新納入子檔案。",
      "已追蹤檔案不受新 ignore 規則影響。"
    ]
  },
  "44": {
    "targetCommand": "git rev-parse HEAD^ HEAD^2 HEAD~2 → git log --oneline A..B → git log --oneline A...B → git diff A..B → git diff A...B → git tag first-parent HEAD^ → git tag second-parent HEAD^2 → git tag ancestor HEAD~2",
    "summary": "修訂參照選提交；log 的範圍是可達集合，diff 的範圍是快照比較。",
    "guidedSteps": [
      {
        "step": 1,
        "cmd": "git rev-parse HEAD^ HEAD^2 HEAD~2",
        "category": "required",
        "why": "查第一親代、第二親代及第一親代鏈兩步。"
      },
      {
        "step": 2,
        "cmd": "git log --oneline A..B",
        "category": "required",
        "why": "B 可達且 A 不可達的提交。"
      },
      {
        "step": 3,
        "cmd": "git log --oneline A...B",
        "category": "required",
        "why": "A 或 B 其一可達、但非兩者皆可達的提交。"
      },
      {
        "step": 4,
        "cmd": "git diff A..B",
        "category": "required",
        "why": "等同 diff A B，比較兩端快照。"
      },
      {
        "step": 5,
        "cmd": "git diff A...B",
        "category": "required",
        "why": "比較共同祖先 merge-base(A,B) 到 B。"
      },
      {
        "step": 6,
        "cmd": "git tag first-parent HEAD^",
        "category": "required",
        "why": "保存查到的第一親代。"
      },
      {
        "step": 7,
        "cmd": "git tag second-parent HEAD^2",
        "category": "required",
        "why": "保存第二親代。"
      },
      {
        "step": 8,
        "cmd": "git tag ancestor HEAD~2",
        "category": "required",
        "why": "保存第一親代鏈上的祖先。"
      }
    ],
    "variations": [],
    "pitfalls": [
      "HEAD^2 是第二個 parent；HEAD~2 是沿第一個 parent 走兩步，兩者不同。",
      "三點的 diff 有方向；交換 A/B 會比較到另一側。"
    ]
  },
  "42": {
    "targetCommand": "printf '*.txt text eol=lf\\n' > .gitattributes → git add .gitattributes → git add --renormalize . → git diff --staged → git commit -m \"chore: normalize line endings\" → git check-attr text eol -- lines.txt",
    "summary": "以 .gitattributes 統一索引中的文字與工作區換行行為。",
    "guidedSteps": [
      {
        "step": 1,
        "cmd": "printf '*.txt text eol=lf\\n' > .gitattributes",
        "category": "required",
        "why": "本關 lines.txt 原為 CRLF；以版本化規則要求索引 LF 與工作區 LF。"
      },
      {
        "step": 2,
        "cmd": "git add .gitattributes",
        "category": "required",
        "why": "保存文字規則。"
      },
      {
        "step": 3,
        "cmd": "git add --renormalize .",
        "category": "required",
        "why": "重新標準化既有追蹤檔案。"
      },
      {
        "step": 4,
        "cmd": "git diff --staged",
        "category": "required",
        "why": "檢查換行差異與規則。"
      },
      {
        "step": 5,
        "cmd": "git commit -m \"chore: normalize line endings\"",
        "category": "required",
        "why": "保存 LF blob 與 attributes。"
      },
      {
        "step": 6,
        "cmd": "git check-attr text eol -- lines.txt",
        "category": "required",
        "why": "確認 text 與 eol 規則。"
      },
      {
        "step": 7,
        "cmd": "./git-lab verify",
        "category": "required",
        "why": "由 CLI 檢查提交的實際 LF bytes。"
      }
    ],
    "variations": [],
    "pitfalls": [
      "不要對二進位檔套文字換行轉換。",
      "core.autocrlf 是本機設定；.gitattributes 是版本化的專案規則。"
    ]
  },
  "43": {
    "targetCommand": "git log --oneline main..old-series → git rebase -i HEAD~1 → git reset HEAD^ → git add alpha.py → git commit -m \"feat: alpha\" → git add beta.py → git commit -m \"feat: beta\" → git rebase --continue → git range-diff main..old-series main..feature",
    "summary": "拆分尚未共享的混合提交，以 range-diff 檢查改寫前後的 patch 序列。",
    "guidedSteps": [
      {
        "step": 1,
        "cmd": "git log --oneline main..old-series",
        "category": "required",
        "why": "Fixture 已建立 old-series 備份，feature 僅有一筆混合提交。"
      },
      {
        "step": 2,
        "cmd": "git rebase -i HEAD~1",
        "category": "required",
        "why": "把唯一一行 pick 改成 edit，存檔離開編輯器。"
      },
      {
        "step": 3,
        "cmd": "git reset HEAD^",
        "category": "required",
        "why": "用 mixed reset 移回基底，兩個模組的變更仍在工作區。"
      },
      {
        "step": 4,
        "cmd": "git add alpha.py",
        "category": "required",
        "why": "只暫存 alpha。"
      },
      {
        "step": 5,
        "cmd": "git commit -m \"feat: alpha\"",
        "category": "required",
        "why": "建立第一筆獨立提交。"
      },
      {
        "step": 6,
        "cmd": "git add beta.py",
        "category": "required",
        "why": "暫存剩下的 beta。"
      },
      {
        "step": 7,
        "cmd": "git commit -m \"feat: beta\"",
        "category": "required",
        "why": "建立第二筆獨立提交。"
      },
      {
        "step": 8,
        "cmd": "git rebase --continue",
        "category": "required",
        "why": "完成 edit 流程。"
      },
      {
        "step": 9,
        "cmd": "git range-diff main..old-series main..feature",
        "category": "required",
        "why": "比較原混合 patch 與拆分後序列；拆分可能無法逐筆配對，另確認最終 tree。"
      },
      {
        "step": 10,
        "cmd": "./git-lab verify",
        "category": "required",
        "why": "確認兩筆提交分別修改 alpha、beta，且 tree 保持一致。"
      }
    ],
    "variations": [],
    "pitfalls": [
      "Range-diff 用於審查提交序列，不取代最終 tree 比較與測試。"
    ]
  },
  "45": {
    "targetCommand": "cat BISECT_GUIDE.md → python3 check.py → git bisect start HEAD good → git bisect run python3 check.py → git rev-parse HEAD > culprit.txt → git bisect reset",
    "summary": "用可重複的測試腳本自動定位第一個壞提交。",
    "guidedSteps": [
      {
        "step": 1,
        "cmd": "cat BISECT_GUIDE.md",
        "category": "required",
        "why": "先讀測試與 exit code 的約定。"
      },
      {
        "step": 2,
        "cmd": "python3 check.py",
        "category": "required",
        "why": "確認腳本能啟動；目前最新版本預期回傳 1 表示測試失敗。"
      },
      {
        "step": 3,
        "cmd": "git bisect start HEAD good",
        "category": "required",
        "why": "使用目前錯誤 HEAD 與 fixture 的 good 標籤作邊界。"
      },
      {
        "step": 4,
        "cmd": "git bisect run python3 check.py",
        "category": "required",
        "why": "0 是 good，1–127 除 125 是 bad，125 是 skip；>=128 中止。"
      },
      {
        "step": 5,
        "cmd": "git rev-parse HEAD > culprit.txt",
        "category": "required",
        "why": "在搜尋結果 HEAD 仍指向第一個壞提交時，記下 hash。"
      },
      {
        "step": 6,
        "cmd": "git bisect reset",
        "category": "required",
        "why": "回復原始 HEAD，保留 culprit.txt 作驗證。"
      },
      {
        "step": 7,
        "cmd": "./git-lab verify",
        "category": "required",
        "why": "確認找到正確回歸並結束 bisect。"
      }
    ],
    "variations": [],
    "pitfalls": [
      "先確認 Python 與腳本可執行；工具找不到常見退出碼 127，不應被誤認為產品回歸。",
      "測試無法執行的舊版本可回傳 125；跳過太多版本可能無法唯一定位。"
    ]
  },
  "46": {
    "targetCommand": "git clone --filter=blob:none --no-checkout … partial → git clone --depth=1 … shallow → ./git-lab verify → git -C shallow fetch --unshallow → ./git-lab verify",
    "summary": "比較初始 partial 缺少的 promised blobs 與真實 shallow 邊界。先 verify 保存初始狀態，再 unshallow 並 verify 完整歷史。",
    "guidedSteps": [
      {
        "step": 1,
        "cmd": "cat CLONE_GUIDE.md",
        "category": "required",
        "why": "本機 file:// server 已啟用物件 filter。"
      },
      {
        "step": 2,
        "cmd": "git clone --filter=blob:none --no-checkout \"file://$PWD/.git-lab-server.git\" partial",
        "category": "required",
        "why": "Fixture 要求名為 partial，保留過濾設定且不 checkout，以免立刻 lazy fetch blob。"
      },
      {
        "step": 3,
        "cmd": "git clone --depth=1 \"file://$PWD/.git-lab-server.git\" shallow",
        "category": "required",
        "why": "以名為 shallow 的目錄建立一筆歷史的淺複製。"
      },
      {
        "step": 4,
        "cmd": "git -C shallow rev-parse --is-shallow-repository",
        "category": "required",
        "why": "在 shallow 倉庫內確認 true；不在父倉庫查。"
      },
      {
        "step": 5,
        "cmd": "./git-lab verify",
        "category": "required",
        "why": "第一次驗證會記錄真實 shallow 邊界與一筆歷史，並確認 partial 缺少 promised blob；此時尚未完成關卡。"
      },
      {
        "step": 6,
        "cmd": "git -C shallow fetch --unshallow",
        "category": "required",
        "why": "向同一個本機 server 補完歷史。"
      },
      {
        "step": 7,
        "cmd": "git -C shallow rev-parse --is-shallow-repository",
        "category": "required",
        "why": "補完後應是 false。"
      },
      {
        "step": 8,
        "cmd": "git -C shallow rev-list --count HEAD",
        "category": "required",
        "why": "確認三筆提交。"
      },
      {
        "step": 9,
        "cmd": "./git-lab verify",
        "category": "required",
        "why": "驗證 partial 與 shallow 的不同特性。"
      }
    ],
    "variations": [
      {
        "cmd": "git -C shallow fetch --deepen=1",
        "desc": "逐步加深歷史；本關最終需要完整三筆。"
      },
      {
        "cmd": "git sparse-checkout set <dir>",
        "desc": "一般用法比較：控制工作區展開範圍，本關不要求 sparse。"
      }
    ],
    "pitfalls": [
      "對本機路徑測試 shallow 通常要使用 file:// 或 --no-local；普通本機 clone 可能忽略 depth。",
      "Partial clone 存取缺少 blob 時仍會向遠端下載。"
    ]
  },
  "47": {
    "targetCommand": "git lfs version → git lfs install --local → git lfs track \"*.bin\" → git add .gitattributes asset.bin → git commit -m \"feat: track binary with LFS\" → git lfs ls-files → git show HEAD:asset.bin",
    "summary": "Git LFS 是需額外安裝的選用工具，Git 提交保存小型 pointer。",
    "guidedSteps": [
      {
        "step": 1,
        "cmd": "git lfs version",
        "category": "required",
        "why": "先確認額外工具已安裝；本關缺工具會回報前置條件。"
      },
      {
        "step": 2,
        "cmd": "git lfs install --local",
        "category": "required",
        "why": "在練習倉庫配置 LFS hooks。"
      },
      {
        "step": 3,
        "cmd": "git lfs track \"*.bin\"",
        "category": "required",
        "why": "為 fixture 的 asset.bin 建立 attributes 規則。"
      },
      {
        "step": 4,
        "cmd": "git add .gitattributes asset.bin",
        "category": "required",
        "why": "明確暫存規則與 asset；LFS clean filter 產生 pointer。"
      },
      {
        "step": 5,
        "cmd": "git commit -m \"feat: track binary with LFS\"",
        "category": "required",
        "why": "保存 pointer 與 .gitattributes，工作區仍有原始資產。"
      },
      {
        "step": 6,
        "cmd": "git lfs ls-files",
        "category": "required",
        "why": "列出受管理資產。"
      },
      {
        "step": 7,
        "cmd": "git show HEAD:asset.bin",
        "category": "required",
        "why": "查看 Git blob 的 LFS pointer。"
      },
      {
        "step": 8,
        "cmd": "./git-lab verify",
        "category": "required",
        "why": "檢查 pointer、原始檔案與本機 LFS object 相符。"
      }
    ],
    "variations": [],
    "pitfalls": [
      "協作者需可存取 LFS 物件服務；僅有 Git pointer 無法還原資產內容。",
      "本選修使用本機 fixture，工具缺少時顯示明確安裝先決條件。"
    ]
  },
  "48": {
    "targetCommand": "cat SIGNING_GUIDE.md → ssh-keygen -t ed25519 -N '' -f .git/lab-signing-key → git config gpg.format ssh → git config user.signingkey \"$PWD/.git/lab-signing-key\" → printf \"learner@example.com %s\\n\" \"$(cat .git/lab-signing-key.pub)\" > .git/allowed_signers → git config gpg.ssh.allowedSignersFile \"$PWD/.git/allowed_signers\" → git add signed.txt → git commit -S -m \"feat: signed change\" → git tag -s signed-v1 -m \"Signed release\" → git verify-commit HEAD → git verify-tag signed-v1",
    "summary": "Git 2.34+ 可使用 SSH 簽章；簽章驗證需要可信 signers，不等於遠端 SSH 登入。",
    "guidedSteps": [
      {
        "step": 1,
        "cmd": "cat SIGNING_GUIDE.md",
        "category": "required",
        "why": "此選修使用 .git 內的一次性測試金鑰，不使用家目錄金鑰。"
      },
      {
        "step": 2,
        "cmd": "ssh-keygen -t ed25519 -N '' -f .git/lab-signing-key",
        "category": "required",
        "why": "只在本練習產生無 passphrase 的一次性測試金鑰。"
      },
      {
        "step": 3,
        "cmd": "git config gpg.format ssh",
        "category": "required",
        "why": "選 SSH 簽章格式。"
      },
      {
        "step": 4,
        "cmd": "git config user.signingkey \"$PWD/.git/lab-signing-key\"",
        "category": "required",
        "why": "指定 fixture 的本機練習私鑰路徑，設定只保存在本倉庫。"
      },
      {
        "step": 5,
        "cmd": "printf \"learner@example.com %s\\n\" \"$(cat .git/lab-signing-key.pub)\" > .git/allowed_signers",
        "category": "required",
        "why": "將完整公鑰與 learner@example.com principal 寫入本機信任名單。"
      },
      {
        "step": 6,
        "cmd": "git config gpg.ssh.allowedSignersFile \"$PWD/.git/allowed_signers\"",
        "category": "required",
        "why": "配置本機驗證的 signers 路徑。"
      },
      {
        "step": 7,
        "cmd": "git add signed.txt",
        "category": "required",
        "why": "暫存 fixture 準備的修改。"
      },
      {
        "step": 8,
        "cmd": "git commit -S -m \"feat: signed change\"",
        "category": "required",
        "why": "簽署提交。"
      },
      {
        "step": 9,
        "cmd": "git tag -s signed-v1 -m \"Signed release\"",
        "category": "required",
        "why": "在相同 HEAD 建立簽署標籤。"
      },
      {
        "step": 10,
        "cmd": "git verify-commit HEAD",
        "category": "required",
        "why": "驗證提交簽章與本機信任名單。"
      },
      {
        "step": 11,
        "cmd": "git verify-tag signed-v1",
        "category": "required",
        "why": "驗證 tag object 簽章。"
      },
      {
        "step": 12,
        "cmd": "./git-lab verify",
        "category": "required",
        "why": "確認兩者指向預期內容且通過本機驗證。"
      }
    ],
    "variations": [],
    "pitfalls": [
      "Git 2.34+ 且 ssh-keygen 支援 -Y 是先決條件。",
      "本練習金鑰重設時刪除；真實私鑰應設定 passphrase 並依組織政策保護。",
      "本機信任名單驗證不代表平台 Verified 或程式安全。"
    ]
  }
};
Object.assign(COMMAND_GUIDES, COMMAND_GUIDES_FOUNDATIONS);
