# didi｜Web 原型驗收清單

> 文件版本：1.6｜2026-11-05｜適用：Web 原型 v0.8.2（只顯示電子機、手機版放大）
> 驗收網址：<https://tamagotchi-uni-inspired-virtual-pet.vercel.app>（推上 GitHub `main` 後自動更新）
> 數值一律見 [BALANCE.md](BALANCE.md)；產品規則見 [PRD.md](PRD.md)；Mac／實機／擴充功能見 [ACCEPTANCE_MAC_HW.md](ACCEPTANCE_MAC_HW.md)。

## 1. 怎麼驗

1. **先確認版本**：做 WEB-DEPLOY-01（選單 → 設定 看版本）。版本不對，後面全部不算。
2. **自動項目**：在專案資料夾跑 `npm test`，全部通過即 PASS。證據是 commit SHA ＋ 測試名稱。
3. **手動項目**：照「步驟」在驗收網址操作，截圖或錄影存證。
4. 每次驗收開新的乾淨狀態：瀏覽器開無痕視窗，或在選單→設定→重新開始。
5. 結果只能填下面四種，沒證據不能填 PASS：

| 狀態 | 意思 |
|---|---|
| PASS | 有證據，結果符合預期 |
| FAIL | 有證據，結果不符合；要開缺陷單 |
| NOT RUN | 還沒測 |
| BLOCKED | 環境或前置條件不具備，不算失敗 |

**等級**：🔴 必過，FAIL 就不能放行；🟡 應過，FAIL 要記錄，可帶著已知問題放行。

**常見誤判**（不是 bug，以 BALANCE.md 為準）：

- 連續照顧好感沒有一直加：60 秒共用冷卻（B-BOND-02）。
- 肚子很餓按睡覺沒反應：飽足低於 15 睡不著，要先吃（B-ACT-07）。
- 睡一陣子自己醒了：睡飽或餓醒會自動起床（B-TIME-08）。

## 2. 驗收項目

### 2.1 版本與部署

| ID | 等級 | 前置 | 步驟 | 預期結果 | 方式 | 狀態 |
|---|---|---|---|---|---|---|
| WEB-DEPLOY-01 | 🔴 | 已推上 `main` 超過 2 分鐘 | 開驗收網址 → 選單 → 設定，看版本；比對 GitHub 最新 commit | 設定頁顯示的版本 = `package.json` 版本；線上 `app.js` 與 GitHub `main` 一致 | 手動 | PASS（`39e35da` 線上實測，見 [證據](evidence/WEB_v0.6_2026-11-05.md)） |
| WEB-DEPLOY-02 | 🔴 | — | 推上 `main` | GitHub Actions「Verify pet MVP」綠燈 | 自動（CI） | PASS（`4498b03`） |
| WEB-DEPLOY-03 | 🔴 | 本機 `npm run serve` | 要求 `/.env.local`、`/.git/config` | 都回 404，只提供網頁本身與圖檔 | 自動：`local server never exposes secrets…` | PASS（`4498b03`） |

### 2.2 三鍵與畫面

| ID | 等級 | 前置 | 步驟 | 預期結果 | 方式 | 狀態 |
|---|---|---|---|---|---|---|
| WEB-NAV-01 | 🔴 | 房間畫面 | 連按 A 6 次 | 底列 6 個捷徑（B-INPUT-05）依序選取，第 6 下回到第 1 個 | 自動：`A cycles through all six…` | PASS（`4498b03`） |
| WEB-NAV-02 | 🔴 | 選到「選單」 | B 進入 → A 移到「設定」→ B → C → C | 進設定後 C 回到選單且游標停在「設定」；再 C 回房間，底列選取不變 | 自動：`B on selected menu icon…`、`full menu is controlled…` | PASS（`5a3a039` 線上實測，見 [證據](evidence/WEB_v0.6_2026-11-05.md)） |
| WEB-NAV-03 | 🔴 | 房間 | 分別選餐食、清潔、玩耍、摸摸按 B | 每一個都**直接開始動作**，不出現任何選項畫面（B-INPUT-05） | 自動：`care shortcuts run on B directly…`＋手動 | PASS（`5a3a039` 線上實測，見 [證據](evidence/WEB_v0.6_2026-11-05.md)） |
| WEB-NAV-06 | 🔴 | 選到「選單」 | B 進入，看清單 | 只有一層：睡覺、點心、洗臉、伸懶腰、看窗外、設定；前五項按 B 直接執行；只有「設定」會再開一層 | 自動：`menu is one level…`＋手動 | PASS（`5a3a039` 線上實測，見 [證據](evidence/WEB_v0.6_2026-11-05.md)） |
| WEB-NAV-04 | 🔴 | 選單→設定→重新開始 | 直接按 B | 預設停在「保留進度」，B 不會清除進度；要先按 A 選「確定重新開始」再按 B 才重設 | 自動：`reset requires explicit second selection…` | PASS（`4498b03`） |
| WEB-NAV-05 | 🔴 | 狀態頁 | 按 B，再按 C | B 沒有任何作用；C 回房間 | 自動：`status is view-only…` | PASS（`4498b03`） |
| WEB-INPUT-01 | 🔴 | 任一畫面 | 用滑鼠或手指點螢幕上的圖示、選單 | 完全沒反應；只有下方 A/B/C 按鈕與鍵盤有效 | 自動：`screen is explicitly non-touch…`、`device screen contains no clickable buttons…` | PASS（`4498b03`） |
| WEB-INPUT-02 | 🔴 | 房間 | 鍵盤分別按 A/B/C 與 J/K/L | 兩組按鍵效果相同；其他按鍵不觸發任何照顧 | 自動：`invalid keys never trigger…`＋手動 | PASS（`6e14e86` 線上實測，見 [證據](evidence/WEB_v0.6_2026-11-05.md)） |
| WEB-INPUT-03 | 🔴 | 房間 | 同一顆鍵 0.1 秒內按兩下；A 後 0.06 秒按 B；按住鍵盤 A 不放 | 同鍵只算一次；**A 與 B 都有反應**（B-INPUT-02）；按住不會連續輪選 | 自動：`debounce only swallows a repeat…`＋手動 | PASS（`962d92a` 線上實測，見 [證據](evidence/WEB_v0.6_2026-11-05.md)） |
| WEB-UI-01 | 🔴 | — | 視窗寬 320、375、768、1440 各看一次 | 沒有左右捲軸；電子機完整在畫面內；手機寬度時蛋形外殼左右貼齊畫面、各留約 6px；A/B/C 點按位置對準粉紅按鈕（B-UI-03） | 手動截圖 | PASS（`39e35da` 線上實測，見 [證據](evidence/WEB_v0.6_2026-11-05.md)） |
| WEB-UI-03 | 🔴 | 房間、選單、設定、狀態頁 | 各截一張圖 | 選單項目、標題列、狀態列、提示列、計數、數值條都是直角缺角的像素框與硬邊色塊；選中項目有像素箭頭；畫面內沒有圓角或漸層（B-UI-01） | 手動截圖 | PASS（`5a3a039` 線上實測，見 [證據](evidence/WEB_v0.6_2026-11-05.md)） |
| WEB-UI-04 | 🔴 | 舊存檔名字為 MOMO | 載入 | 標題、上方名稱、狀態頁、長大畫面都顯示 didi；存檔名字改為 didi（B-UI-02） | 自動＋手動 | PASS（`5a3a039` 線上實測，見 [證據](evidence/WEB_v0.6_2026-11-05.md)） |
| WEB-UI-05 | 🔴 | 任一寬度 | 看電子機以外的區域 | 沒有任何文字（標題、說明、頁尾都不顯示）；操作說明只留給讀螢幕軟體（B-UI-03） | 自動：`nothing but the device is visible…`＋手動 | PASS（`39e35da` 線上實測，見 [證據](evidence/WEB_v0.6_2026-11-05.md)） |
| WEB-UI-02 | 🟡 | 房間 | 觀察提示文字與角色 | 提示列在房間和底列之間，不蓋住角色 | 手動截圖 | PASS（`6e14e86` 線上實測，見 [證據](evidence/WEB_v0.6_2026-11-05.md)） |

### 2.3 照顧

| ID | 等級 | 前置 | 步驟 | 預期結果 | 方式 | 狀態 |
|---|---|---|---|---|---|---|
| WEB-CARE-01 | 🔴 | 乾淨狀態 | 底列「餐食」按 B，等動畫結束 | 動畫約 4.5 秒（B-ANIM-01）；結束後飽足、精力依 B-ACT-01 改變；顯示「吃飽一點了 · 關係 +1」 | 自動：`care actions raise the permanent bond…`＋手動 | PASS（`5a3a039` 線上實測，見 [證據](evidence/WEB_v0.6_2026-11-05.md)） |
| WEB-CARE-02 | 🔴 | 乾淨狀態 | 分別做點心、清潔、洗臉、玩耍、摸摸、睡覺 | 每個行為的數值變化與 B-ACT-02～07 完全相同 | 自動：同上＋手動看狀態頁 | PASS（`5a3a039` 線上實測，見 [證據](evidence/WEB_v0.6_2026-11-05.md)） |
| WEB-CARE-03 | 🔴 | 分別設好：飽足 100、精力 7、清潔 100、飽足 10、睡著 | 做對應行為（餐食、點心、玩耍、清潔、洗臉、睡覺、摸摸） | 被拒絕並顯示 B-ACT 表上的原因文字；需求和好感都不變 | 自動：`rejected actions do not award bond…`＋手動看文字 | PASS（`962d92a` 線上實測，見 [證據](evidence/WEB_v0.6_2026-11-05.md)） |
| WEB-CARE-08 | 🔴 | 飽足 30、心情 100 | 選單→點心 | 可以吃：飽足 +4，心情維持 100（B-ACT-02） | 自動：`a hungry pet can have a snack…`＋手動 | PASS（`962d92a` 線上實測，見 [證據](evidence/WEB_v0.6_2026-11-05.md)） |
| WEB-CARE-04 | 🔴 | 餐食動畫播放中 | 連按 B 5 次 | 只結算一次；提示列顯示目前動作與「C 取消」 | 手動 | PASS（`6e14e86` 線上實測，見 [證據](evidence/WEB_v0.6_2026-11-05.md)） |
| WEB-CARE-05 | 🔴 | 餐食動畫播放中 | 按 C | 播放約 0.36 秒收勢（B-ANIM-07）；顯示「已取消 · 數值未變更」；需求與好感都不變；回到出發的畫面與游標（底列或選單） | 手動 | PASS（`5a3a039` 線上實測，見 [證據](evidence/WEB_v0.6_2026-11-05.md)） |
| WEB-CARE-06 | 🔴 | 選單→睡覺 → 等入睡 | 按 A；再按 B | A 只顯示「熟睡中 · B / C 喚醒」；B 播放喚醒動畫後回房間 | 手動 | PASS（`5a3a039` 線上實測，見 [證據](evidence/WEB_v0.6_2026-11-05.md)） |
| WEB-CARE-07 | 🟡 | 伸懶腰、看窗外 | 執行 | 播放動畫，數值不變（B-ACT-08） | 手動 | PASS（`6e14e86` 線上實測，見 [證據](evidence/WEB_v0.6_2026-11-05.md)） |

### 2.3A 閒置動作

| ID | 等級 | 前置 | 步驟 | 預期結果 | 方式 | 狀態 |
|---|---|---|---|---|---|---|
| WEB-IDLE-01 | 🔴 | 房間、不操作 | 觀察 60 秒 | 每 6–12 秒出現一次小動作：搖尾巴眨眼、舔爪子、東張西望或偶爾伸懶腰（B-ANIM-08）；需求與好感不因此改變 | 自動：`idle moments pick tail, lick, look or stretch…`＋手動 | PASS（`5a3a039` 線上實測，見 [證據](evidence/WEB_v0.6_2026-11-05.md)） |
| WEB-IDLE-02 | 🔴 | 閒置小動作播放中 | 按 A | 小動作立刻停止回到待機姿勢，底列選取照常移動 | 手動 | PASS（`5a3a039` 線上實測，見 [證據](evidence/WEB_v0.6_2026-11-05.md)） |

### 2.4 好感與成長

| ID | 等級 | 前置 | 步驟 | 預期結果 | 方式 | 狀態 |
|---|---|---|---|---|---|---|
| WEB-GROW-01 | 🔴 | 好感 0 | 摸摸 1 次，60 秒內再摸摸 1 次 | 第 1 次 +2；第 2 次心情照加，但好感 +0；狀態頁顯示「關係加分冷卻 N 秒」（B-BOND-02） | 自動：`relationship cooldown is shared…`＋手動 | PASS（`5a3a039` 線上實測，見 [證據](evidence/WEB_v0.6_2026-11-05.md)） |
| WEB-GROW-02 | 🔴 | 冷卻中 | 重新整理頁面，再照顧 | 冷卻沒有被重置，好感仍 +0 | 自動：同上 | PASS（`4498b03`） |
| WEB-GROW-03 | 🔴 | — | 好感累積跨過 30、80 | 29→30 變成長中，79→80 變成年；28 以下做一次照顧不會長大（B-BOND-03、B-BOND-04） | 自動：`growth follows permanent bond…`＋手動看畫面 | PASS（`80db55a` 線上實測，見 [證據](evidence/WEB_v0.6_2026-11-05.md)） |
| WEB-GROW-04 | 🔴 | 成年 | 放著讓需求下降、時間經過很多天 | 永遠不會變回較小的階段；好感不會下降 | 自動：同上 | PASS（`4498b03`） |
| WEB-GROW-05 | 🔴 | 沒有好感欄位的舊存檔 | 載入 | 依 B-BOND-06 換算好感，不會縮小 | 自動：同上 | PASS（`4498b03`） |
| WEB-GROW-06 | 🟡 | 好感 0、30、55、100 | 看房間上方愛心 | 分別為 0 顆、1.5 顆、2.75 顆、5 顆，旁邊數字一致（B-BOND-05） | 手動截圖 | PASS（`6e14e86` 線上實測，見 [證據](evidence/WEB_v0.6_2026-11-05.md)） |
| WEB-GROW-07 | 🔴 | 好感 29、冷卻已結束 | 底列「餐食」按 B，等動畫結束 | 回到房間；角色約 1.2 秒放大到成長中尺寸；慶祝畫面顯示「didi 長大了！」「幼年 → 成長中」，4 秒後自動消失；期間按任一鍵提早關閉且不觸發其他動作（B-ANIM-11） | 手動 | PASS（`5a3a039` 線上實測，見 [證據](evidence/WEB_v0.6_2026-11-05.md)） |
| WEB-GROW-08 | 🔴 | v0.6 存檔：好感 12、沒有 `stageFloor` | 載入 | 仍是成長中，不縮回幼年（B-BOND-06） | 自動：`saves from the old 10/30 rule…`＋手動 | PASS（`80db55a` 線上實測，見 [證據](evidence/WEB_v0.6_2026-11-05.md)） |

### 2.5 時間與存檔

| ID | 等級 | 前置 | 步驟 | 預期結果 | 方式 | 狀態 |
|---|---|---|---|---|---|---|
| WEB-TIME-01 | 🔴 | — | 一次推進 10 分鐘 vs 每分鐘推進 1 次共 10 次 | 結果完全相同；每分鐘降幅依 B-DECAY | 自動：`minute-by-minute decay matches…` | PASS（`4498b03`） |
| WEB-TIME-02 | 🔴 | 存檔後關閉分頁 | 6 小時後重開 | 只補算 240 分鐘（B-TIME-01），不會補更多 | 手動（或改存檔的 `lastSavedAt` 模擬） | PASS（`6e14e86` 線上實測，見 [證據](evidence/WEB_v0.6_2026-11-05.md)） |
| WEB-TIME-03 | 🔴 | — | 把系統時間往回調 4 小時再開 | 補算 0 分鐘，需求、成長、冷卻都不倒退（B-TIME-02） | 自動：`tick(start,-100)`＋手動 | PASS（`6e14e86` 線上實測，見 [證據](evidence/WEB_v0.6_2026-11-05.md)） |
| WEB-TIME-04 | 🔴 | 睡著 | 重新整理頁面 | 仍在睡；按 C 喚醒後狀態存檔 | 自動：`hydratePet(sleeping).sleeping`＋手動 | PASS（`6e14e86` 線上實測，見 [證據](evidence/WEB_v0.6_2026-11-05.md)） |
| WEB-TIME-05 | 🔴 | 睡著、精力 30、飽足 80 | 等 35 分鐘（或改存檔時間模擬） | 精力到 100 自動起床，播放起床動畫，提示「睡飽起床了」（B-TIME-08） | 自動：`a sleeping pet wakes by itself…`＋手動 | PASS（`962d92a` 線上實測，見 [證據](evidence/WEB_v0.6_2026-11-05.md)） |
| WEB-TIME-06 | 🔴 | 睡著、精力 10、飽足 20 | 等 13 分鐘（或改存檔時間模擬）；再於飽足 10 時按睡覺 | 飽足掉到 15 以下自動起床，提示「肚子餓醒了 · 先吃餐食」；飽足 <15 時睡覺被拒絕（B-TIME-08、B-ACT-07） | 自動：`…wakes up when hunger drops…`＋手動 | PASS（`962d92a` 線上實測，見 [證據](evidence/WEB_v0.6_2026-11-05.md)） |
| WEB-SAVE-01 | 🔴 | 照顧後 | 重新整理 | 需求、好感、成長階段、冷卻與重整前相同 | 手動 | PASS（`6e14e86` 線上實測，見 [證據](evidence/WEB_v0.6_2026-11-05.md)） |
| WEB-SAVE-02 | 🔴 | 存檔內容被改成亂碼或超出範圍 | 載入 | 不當機；數值夾回 0–100，壞掉的欄位用初始值 | 自動：`saved data is hydrated defensively` | PASS（`4498b03`） |

### 2.6 動畫

| ID | 等級 | 前置 | 步驟 | 預期結果 | 方式 | 狀態 |
|---|---|---|---|---|---|---|
| WEB-ANIM-01 | 🔴 | — | 檢查圖集 | 幼年、成年各 64 格透明 PNG（B-ANIM-09） | 自動：`both ages have a complete…` | PASS（`4498b03`） |
| WEB-ANIM-02 | 🔴 | — | 檢查每個主要動作 | 8 個不同姿勢，總長 4–6 秒 | 自動：`every main action has eight distinct poses…` | PASS（`4498b03`） |
| WEB-ANIM-04 | 🔴 | — | 量測每個動作相鄰兩格整隻貓的位移（`node scripts/sprite-align.mjs`） | 幼年、成年所有動作的相鄰影格位移都 ≤1px；程式對每格套用同一個定位，不逐格推動角色（B-ANIM-12） | 自動：`the whole cat moves at most 1px…`、`registration is one fixed offset…` | PASS（`80db55a`，`npm test` 31 項通過；所有動作相鄰影格 ≤1px） |
| WEB-ANIM-06 | 🔴 | — | 檢查三張角色圖集；在房間裡看幼貓、成貓、走路 | 透明度只有 0 或 255，沒有灰霧、光暈、半透明邊或散落碎點；放在房間上輪廓是乾淨的硬邊（B-UI-04） | 自動：`background fully removed…`＋手動截圖 | PASS（v0.9.1 本機實測，見 [證據](evidence/WEB_v0.6_2026-11-05.md)） |
| WEB-ANIM-05 | 🔴 | 幼年、成年各一次 | 依序播放餐食、清潔、玩耍、摸摸、睡覺、點心、洗臉、伸懶腰、看窗外，以及閒置小動作，盯著腳底與身體 | 腳底不上下跳、身體不左右滑；只有頭、爪子、尾巴在動 | 手動（錄影） | NOT RUN |
| WEB-ANIM-03 | 🔴 | 同一成長階段 | 播放任一動作，比對動作前後角色外框 | 位置與尺寸誤差 ≤1px；不旋轉、不縮放；尺寸只在長大時改變（B-ANIM-10） | 自動：`character scale depends only on growth…`＋手動截圖 | PASS（`6e14e86` 線上實測，見 [證據](evidence/WEB_v0.6_2026-11-05.md)） |

## 3. 不在 Web 驗收範圍

以下要等 Mac 模擬器、Rust 核心或實機，見 [ACCEPTANCE_MAC_HW.md](ACCEPTANCE_MAC_HW.md)：健康與生病、自主行為 AI、性格與喜好、背包商店、小遊戲、房間裝扮、散步 DIY、好友連線、線上功能、Mac 測試包、ESP32 實機效能。

## 4. 舊編號對照（QA v1.1 §2A）

舊版的 5 項 Web 驗收已拆細，**舊版標的 PASS 不沿用**，以本表狀態為準。

| 舊 ID | 新 ID |
|---|---|
| WEB-MOTION-01 | WEB-ANIM-03 |
| WEB-GROW-01（各行為加幾分） | WEB-CARE-01、WEB-CARE-02、WEB-GROW-01（新增冷卻規則） |
| WEB-GROW-02（門檻） | WEB-GROW-03、WEB-GROW-04 |
| WEB-GROW-03（只前進、尺寸固定） | WEB-GROW-03、WEB-GROW-04、WEB-ANIM-03 |
| WEB-GROW-04（舊存檔） | WEB-GROW-05 |

## 5. 本輪結果摘要

| 項目 | 數量 |
|---|---|
| 總數 | 49 |
| PASS | 48 |
| NOT RUN | 1（WEB-ANIM-05 需人眼觀看） |
| FAIL | 0 |

**Web v0.9.1**（2026-11-06）：49 項中 48 項 PASS、0 件 FAIL；WEB-ANIM-05 需要人眼看動畫，請驗收者補做。v0.9.0 散步功能的驗收見 RELEASE_0.9.0.md。
