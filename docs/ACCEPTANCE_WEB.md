# MOMO｜Web 原型驗收清單

> 文件版本：1.3｜2026-11-05｜適用：Web 原型 v0.7（成長改為 30／80 與長大演出）
> 驗收網址：<https://tamagotchi-uni-inspired-virtual-pet.vercel.app>（推上 GitHub `main` 後自動更新）
> 數值一律見 [BALANCE.md](BALANCE.md)；產品規則見 [PRD.md](PRD.md)；Mac／實機／擴充功能見 [ACCEPTANCE_MAC_HW.md](ACCEPTANCE_MAC_HW.md)。

## 1. 怎麼驗

1. **先確認版本**：做 WEB-DEPLOY-01。版本不對，後面全部不算。
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
- 很餓卻不給點心：心情 100 時點心會被拒絕（B-ACT-02、B-OPEN-02）。
- A 接著 B 按太快，B 沒反應：120ms 防連按不分按鍵（B-INPUT-02、B-OPEN-03）。
- 睡著一直不醒：目前不會自己醒（B-TIME-05、B-OPEN-01）。

## 2. 驗收項目

### 2.1 版本與部署

| ID | 等級 | 前置 | 步驟 | 預期結果 | 方式 | 狀態 |
|---|---|---|---|---|---|---|
| WEB-DEPLOY-01 | 🔴 | 已推上 `main` 超過 2 分鐘 | 開驗收網址，看頁尾版本；比對 GitHub 最新 commit | 頁尾顯示的版本 = `package.json` 版本；線上 `app.js` 與 GitHub `main` 一致 | 手動 | PASS（`4498b03`，2026-11-05 逐檔比對 4 檔一致） |
| WEB-DEPLOY-02 | 🔴 | — | 推上 `main` | GitHub Actions「Verify pet MVP」綠燈 | 自動（CI） | PASS（`4498b03`） |
| WEB-DEPLOY-03 | 🔴 | 本機 `npm run serve` | 要求 `/.env.local`、`/.git/config` | 都回 404，只提供網頁本身與圖檔 | 自動：`local server never exposes secrets…` | PASS（`4498b03`） |

### 2.2 三鍵與畫面

| ID | 等級 | 前置 | 步驟 | 預期結果 | 方式 | 狀態 |
|---|---|---|---|---|---|---|
| WEB-NAV-01 | 🔴 | 房間畫面 | 連按 A 6 次 | 底列 6 個捷徑（B-INPUT-05）依序選取，第 6 下回到第 1 個 | 自動：`A cycles through all six…` | PASS（`4498b03`） |
| WEB-NAV-02 | 🔴 | 選到「選單」 | B 進入 → A 移動 → B 進子選單 → C → C | 每層 C 返回上一層，游標停在離開時的位置；最後回房間，底列選取不變 | 自動：`B on selected menu icon…`、`full menu is controlled…` | PASS（`4498b03`） |
| WEB-NAV-03 | 🔴 | 選到「食物」 | B → 看到正餐／小點心與效果說明 → C | B 只打開預覽，不會直接餵；C 回房間且數值不變 | 自動：`food opens a preview…` | PASS（`4498b03`） |
| WEB-NAV-04 | 🔴 | 選單→設定→重新開始 | 直接按 B | 預設停在「保留進度」，B 不會清除進度；要先按 A 選「確定重新開始」再按 B 才重設 | 自動：`reset requires explicit second selection…` | PASS（`4498b03`） |
| WEB-NAV-05 | 🔴 | 狀態頁 | 按 B，再按 C | B 沒有任何作用；C 回房間 | 自動：`status is view-only…` | PASS（`4498b03`） |
| WEB-INPUT-01 | 🔴 | 任一畫面 | 用滑鼠或手指點螢幕上的圖示、選單 | 完全沒反應；只有下方 A/B/C 按鈕與鍵盤有效 | 自動：`screen is explicitly non-touch…`、`device screen contains no clickable buttons…` | PASS（`4498b03`） |
| WEB-INPUT-02 | 🔴 | 房間 | 鍵盤分別按 A/B/C 與 J/K/L | 兩組按鍵效果相同；其他按鍵不觸發任何照顧 | 自動：`invalid keys never trigger…`＋手動 | PASS（`6e14e86` 線上實測，見 [證據](evidence/WEB_v0.6_2026-11-05.md)） |
| WEB-INPUT-03 | 🟡 | 房間 | 同一顆鍵在 0.1 秒內按兩下；按住鍵盤 A 不放 | 只算一次（B-INPUT-02）；按住不會連續輪選 | 手動 | PASS（`6e14e86` 線上實測，見 [證據](evidence/WEB_v0.6_2026-11-05.md)） |
| WEB-UI-01 | 🟡 | — | 視窗寬 320、390、768、1440 各看一次 | 外殼完整、沒有左右捲軸；A/B/C 點按位置對準粉紅按鈕 | 手動截圖 | PASS（`6e14e86` 線上實測，見 [證據](evidence/WEB_v0.6_2026-11-05.md)） |
| WEB-UI-02 | 🟡 | 房間 | 觀察提示文字與角色 | 提示列在房間和底列之間，不蓋住角色 | 手動截圖 | PASS（`6e14e86` 線上實測，見 [證據](evidence/WEB_v0.6_2026-11-05.md)） |

### 2.3 照顧

| ID | 等級 | 前置 | 步驟 | 預期結果 | 方式 | 狀態 |
|---|---|---|---|---|---|---|
| WEB-CARE-01 | 🔴 | 乾淨狀態 | 食物→正餐→B，等動畫結束 | 動畫約 4.5 秒（B-ANIM-01）；結束後飽足、精力依 B-ACT-01 改變；顯示「吃飽一點了 · 關係 +1」 | 自動：`care actions raise the permanent bond…`＋手動 | PASS（`6e14e86` 線上實測，見 [證據](evidence/WEB_v0.6_2026-11-05.md)） |
| WEB-CARE-02 | 🔴 | 乾淨狀態 | 分別做小點心、清潔身體、梳洗小臉、毛線球、陪伴、休息 | 每個行為的數值變化與 B-ACT-02～07 完全相同 | 自動：同上＋手動看狀態頁 | PASS（`6e14e86` 線上實測，見 [證據](evidence/WEB_v0.6_2026-11-05.md)） |
| WEB-CARE-03 | 🔴 | 分別設好：飽足 100、心情 100、精力 7、清潔 100、睡著 | 做對應行為 | 被拒絕並顯示 B-ACT 表上的原因文字；需求和好感都不變 | 自動：`rejected actions do not award bond…`＋手動看文字 | PASS（`6e14e86` 線上實測，見 [證據](evidence/WEB_v0.6_2026-11-05.md)） |
| WEB-CARE-04 | 🔴 | 正餐動畫播放中 | 連按 B 5 次 | 只結算一次；提示列顯示目前動作與「C 取消」 | 手動 | PASS（`6e14e86` 線上實測，見 [證據](evidence/WEB_v0.6_2026-11-05.md)） |
| WEB-CARE-05 | 🔴 | 正餐動畫播放中 | 按 C | 播放約 0.36 秒收勢（B-ANIM-07）；顯示「已取消 · 數值未變更」；需求與好感都不變；回到原本的選單與游標 | 手動 | PASS（`6e14e86` 線上實測，見 [證據](evidence/WEB_v0.6_2026-11-05.md)） |
| WEB-CARE-06 | 🔴 | 休息 → 等入睡 | 按 A；再按 B | A 只顯示「熟睡中 · B / C 喚醒」；B 播放喚醒動畫後回房間 | 手動 | PASS（`6e14e86` 線上實測，見 [證據](evidence/WEB_v0.6_2026-11-05.md)） |
| WEB-CARE-07 | 🟡 | 伸懶腰、看窗外 | 執行 | 播放動畫，數值不變（B-ACT-08） | 手動 | PASS（`6e14e86` 線上實測，見 [證據](evidence/WEB_v0.6_2026-11-05.md)） |

### 2.4 好感與成長

| ID | 等級 | 前置 | 步驟 | 預期結果 | 方式 | 狀態 |
|---|---|---|---|---|---|---|
| WEB-GROW-01 | 🔴 | 好感 0 | 陪伴 1 次，60 秒內再陪伴 1 次 | 第 1 次 +2；第 2 次心情照加，但好感 +0；狀態頁顯示「關係加分冷卻 N 秒」（B-BOND-02） | 自動：`relationship cooldown is shared…`＋手動 | PASS（`6e14e86` 線上實測，見 [證據](evidence/WEB_v0.6_2026-11-05.md)） |
| WEB-GROW-02 | 🔴 | 冷卻中 | 重新整理頁面，再照顧 | 冷卻沒有被重置，好感仍 +0 | 自動：同上 | PASS（`4498b03`） |
| WEB-GROW-03 | 🔴 | — | 好感累積跨過 30、80 | 29→30 變成長中，79→80 變成年；28 以下做一次照顧不會長大（B-BOND-03、B-BOND-04） | 自動：`growth follows permanent bond…`＋手動看畫面 | NOT RUN（v0.7 重測） |
| WEB-GROW-04 | 🔴 | 成年 | 放著讓需求下降、時間經過很多天 | 永遠不會變回較小的階段；好感不會下降 | 自動：同上 | PASS（`4498b03`） |
| WEB-GROW-05 | 🔴 | 沒有好感欄位的舊存檔 | 載入 | 依 B-BOND-06 換算好感，不會縮小 | 自動：同上 | PASS（`4498b03`） |
| WEB-GROW-06 | 🟡 | 好感 0、30、55、100 | 看房間上方愛心 | 分別為 0 顆、1.5 顆、2.75 顆、5 顆，旁邊數字一致（B-BOND-05） |
| WEB-GROW-07 | 🔴 | 好感 29，在食物選單 | 正餐 → 等動畫結束 | 回到房間；角色約 1.2 秒放大到成長中尺寸；慶祝畫面顯示「MOMO 長大了！」「幼年 → 成長中」，4 秒後自動消失；期間按任一鍵提早關閉且不觸發其他動作（B-ANIM-11） | 手動 | NOT RUN |
| WEB-GROW-08 | 🔴 | v0.6 存檔：好感 12、沒有 `stageFloor` | 載入 | 仍是成長中，不縮回幼年（B-BOND-06） | 自動：`saves from the old 10/30 rule…`＋手動 | NOT RUN | 手動截圖 | PASS（`6e14e86` 線上實測，見 [證據](evidence/WEB_v0.6_2026-11-05.md)） |

### 2.5 時間與存檔

| ID | 等級 | 前置 | 步驟 | 預期結果 | 方式 | 狀態 |
|---|---|---|---|---|---|---|
| WEB-TIME-01 | 🔴 | — | 一次推進 10 分鐘 vs 每分鐘推進 1 次共 10 次 | 結果完全相同；每分鐘降幅依 B-DECAY | 自動：`minute-by-minute decay matches…` | PASS（`4498b03`） |
| WEB-TIME-02 | 🔴 | 存檔後關閉分頁 | 6 小時後重開 | 只補算 240 分鐘（B-TIME-01），不會補更多 | 手動（或改存檔的 `lastSavedAt` 模擬） | PASS（`6e14e86` 線上實測，見 [證據](evidence/WEB_v0.6_2026-11-05.md)） |
| WEB-TIME-03 | 🔴 | — | 把系統時間往回調 4 小時再開 | 補算 0 分鐘，需求、成長、冷卻都不倒退（B-TIME-02） | 自動：`tick(start,-100)`＋手動 | PASS（`6e14e86` 線上實測，見 [證據](evidence/WEB_v0.6_2026-11-05.md)） |
| WEB-TIME-04 | 🔴 | 睡著 | 重新整理頁面 | 仍在睡；按 C 喚醒後狀態存檔 | 自動：`hydratePet(sleeping).sleeping`＋手動 | PASS（`6e14e86` 線上實測，見 [證據](evidence/WEB_v0.6_2026-11-05.md)） |
| WEB-SAVE-01 | 🔴 | 照顧後 | 重新整理 | 需求、好感、成長階段、冷卻與重整前相同 | 手動 | PASS（`6e14e86` 線上實測，見 [證據](evidence/WEB_v0.6_2026-11-05.md)） |
| WEB-SAVE-02 | 🔴 | 存檔內容被改成亂碼或超出範圍 | 載入 | 不當機；數值夾回 0–100，壞掉的欄位用初始值 | 自動：`saved data is hydrated defensively` | PASS（`4498b03`） |

### 2.6 動畫

| ID | 等級 | 前置 | 步驟 | 預期結果 | 方式 | 狀態 |
|---|---|---|---|---|---|---|
| WEB-ANIM-01 | 🔴 | — | 檢查圖集 | 幼年、成年各 64 格透明 PNG（B-ANIM-09） | 自動：`both ages have a complete…` | PASS（`4498b03`） |
| WEB-ANIM-02 | 🔴 | — | 檢查每個主要動作 | 8 個不同姿勢，總長 4–6 秒 | 自動：`every main action has eight distinct poses…` | PASS（`4498b03`） |
| WEB-ANIM-04 | 🔴 | — | 量測每個動作相鄰兩格整隻貓的位移（`node scripts/sprite-align.mjs`） | 幼年、成年所有動作的相鄰影格位移都 ≤1px；程式對每格套用同一個定位，不逐格推動角色（B-ANIM-12） | 自動：`the whole cat moves at most 1px…`、`registration is one fixed offset…` | NOT RUN（v0.7 重測） |
| WEB-ANIM-05 | 🔴 | 幼年、成年各一次 | 依序播放正餐、清潔、毛線球、休息、陪伴、伸懶腰、看窗外，盯著腳底與身體 | 腳底不上下跳、身體不左右滑；只有頭、爪子、尾巴在動 | 手動（錄影） | NOT RUN |
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
| 總數 | 35 |
| PASS | 35 |
| NOT RUN | 0 |
| FAIL | 0 |

**Web v0.6 驗收通過**（2026-11-05 17:23，commit `6e14e86`）：35 項全 PASS，0 件 FAIL。觀察到的低優先問題列在證據檔最後一節。
