# MOMO｜Mac／Rust 核心／實機／擴充功能驗收清單

> 文件版本：1.2｜2026-11-05｜撰寫基準 commit `4498b03`（Web 原型 v0.6）
> 狀態：Mac 模擬器、Rust 核心規則、板卡與 P1–P3 功能皆未實作；全部項目初值為 NOT RUN 或 BLOCKED。
> 數值見 [BALANCE.md](BALANCE.md)；產品規則見 [PRD.md](PRD.md)；Web 原型驗收見 [ACCEPTANCE_WEB.md](ACCEPTANCE_WEB.md)。

## 0. 用途與範圍

- 本文件列出 **Mac 模擬器、Rust 核心（`firmware/`）、ESP32 實機，以及 P1–P3 擴充功能**的驗收項目，供 M1–M6 放行使用。
- 現況：只有 Web 原型 v0.6；`firmware/` 是 Rust 骨架（`game-core`、`game-app`、`platform-api`），沒有 Mac 模擬器、沒有板卡。
- 來源：`archive/` 內舊 PRD v1.1 第 5、6、9、10、11、19、20 章，以及舊 QA v1.1 第 2–9 章。舊編號（AC、NFR、E2E、G、TC）保留在「來源 AC」欄；PRD.md 引用的 `AC-*` 可直接在該欄搜尋。
- 新 ID：`MH-M<里程碑>-<流水號>`；外觀分支候選用 `MH-D11-<流水號>`。
- **平台欄**：`Mac`＝Mac 模擬器；`Rust core`＝主機上的核心測試（`cargo test` 等）；`HW`＝實體板卡；`Web+Mac`＝兩端對照。
- **類型欄**：UT 單元｜IT 整合｜E2E 模擬器端到端｜FI 故障注入｜HW 實機｜SEC 安全｜UX 使用性｜PERF 效能。

## 1. 狀態值與判定規則

| 狀態 | 定義 | 計入放行 |
|---|---|---|
| NOT RUN | 尚未執行：功能未建置，或已建置但未排測。Mac／Rust core／Web+Mac 項目的初值。 | 否 |
| BLOCKED | 硬體、環境、授權或前置決策不具備，無法執行。需要實機的項目在板卡選定（D-01、D-02）前一律 BLOCKED。 | 否；**不算 FAIL**，也**不得推測為 PASS** |
| PASS | 已執行，結果符合預期，第 2 節必填證據齊全。 | 是 |
| FAIL | 已執行，結果不符；須開缺陷並標第 3 節等級。 | 否 |

**禁止假通過**：

1. 證據缺任一必填欄位，不得填 PASS。
2. 文件、程式碼或設定「存在」不等於通過；CLOUD 類項目沒有 CI run URL 前只能是 NOT RUN 或 BLOCKED（舊 AC-CLOUD-08）。
3. 模擬器結果不能代替實機項；Web 結果不能代替 Mac 項。
4. BLOCKED 解除後必須重跑，不能直接改成 PASS。
5. 預期結果寫「B-xxx」者，以執行當下 BALANCE.md 的值判定，並在證據記錄 BALANCE.md 的 commit SHA。BALANCE.md 改了某個值，引用該 ID 的 PASS 項改回 NOT RUN 重跑。
6. 預期結果引用的 B-ID 在 BALANCE.md 標「待定」者，表示數值還沒決定；定案前維持 NOT RUN。
7. 指標難以達成時只能走變更單調整門檻，不得把 FAIL 改成 PASS。

## 2. 證據欄位

| 欄位 | 必填 | 內容 |
|---|---|---|
| Test ID | 是 | 本文件 ID，例：`MH-M2-06` |
| 來源 AC | 是 | 照抄表格欄位 |
| commit SHA | 是 | 完整 40 碼，附連結 `https://github.com/Randall2000/tamagotchi-uni-inspired-virtual-pet/commit/<SHA>` |
| build／tag | 是 | CI run 編號或 release tag；本機建置寫 `local` |
| BALANCE.md 版本 | 是 | BALANCE.md 所在 commit SHA |
| 平台與版本 | 是 | macOS 版本與機型、Rust toolchain；HW 另記板卡型號、螢幕型號、韌體版本 |
| Fixture | 是 | FX ID 與 fixture 檔的 commit |
| 測試者／日期 | 是 | 日期用台北時間（UTC+8） |
| 步驟／預期 | 是 | 照本文件；有偏離要註明 |
| 實際結果 | 是 | 數值、計數、p95 等實測值 |
| 狀態 | 是 | 第 1 節四值之一 |
| 證據連結 | PASS／FAIL 必填 | 測試輸出、CI run URL、log、截圖或錄影 |
| 缺陷 ID | FAIL 必填 | GitHub issue URL 與等級 |

## 3. 缺陷等級與放行規則

| 等級 | 定義（沿用舊 PRD §10.3） |
|---|---|
| Critical | 資料永久遺失、裝置無法啟動、危險電源／安全問題、核心玩法完全不可用 |
| High | 三鍵導覽卡住、誤扣道具、存檔不一致、成長錯誤、常態崩潰 |
| Medium | 偶發回饋缺漏、UI 裁切、非核心選單問題 |
| Low | 微小視覺錯誤、文案修正、非阻擋問題 |

放行：該里程碑適用項全 PASS；未解 Critical／High＝0；Medium／Low 有紀錄與負責人。實機項（M5）在 BLOCKED 狀態下不阻擋 M3。

## 4. 與其他文件的關係

| 文件 | 關係 |
|---|---|
| [PRD.md](PRD.md) | 產品規則：做什麼、拒絕條件、選單結構、決策紀錄（§14）。本文件驗證 PRD 的 FR；規則衝突以 PRD.md 為準，並開缺陷修正本文件。 |
| [BALANCE.md](BALANCE.md) | 所有遊戲數值的唯一來源。本文件只寫 B-ID；括號內數字是已拍板決策的對照，與 BALANCE.md 不一致時以 BALANCE.md 為準。測試次數、seed 數、效能門檻、容差屬於測試設計，寫在本文件。 |
| [ACCEPTANCE_WEB.md](ACCEPTANCE_WEB.md) | Web 原型 v0.6 現在就能驗的項目（`WEB-*`）。本文件不重複；唯一跨平台對照項 MH-M3-34 放在本文件。 |
| `archive/` 舊 PRD／QA v1.1 | 只供追溯，對照見第 8 節。 |

## 5. 已拍板決策（驗收基準）

| 項目 | 驗收基準 | 依據 |
|---|---|---|
| 成長 | 3 階段：幼年 → 成長中 → 成年，只由永久好感決定（B-BOND-03：0–9／10–29／30+）；只前進不倒退、不跳階；年齡與需求衰減不影響成長 | D-05 |
| 5 階段與成年分支 | 研究規格的 5 階段＋3 成年分支不列入現行驗收；分支只作 M3 之後的外觀候選，見 §7.5，狀態 NOT RUN | D-11 |
| 需求 | 五項：飽足、心情、清潔、精力、健康（B-STAT-01）；好感是獨立永久值，不是需求（B-BOND-01） | PRD FR-03 |
| 離線補算上限 | Web 現行 240 分鐘（B-TIME-01）；Mac／Rust 依 BALANCE.md，M2 平衡測試定案 | D-04 |
| 好感冷卻 | 所有行為共用加分冷卻 B-BOND-02（60 秒）；冷卻中需求照常變化、好感 +0 | D-13 |
| 輸入防抖 | Web 120ms（B-INPUT-02）；Mac／實機依 BALANCE.md B-INPUT-02 | PRD FR-02 |
| 食物庫存 | 背包上線前不扣食物；以「狀態不允許時拒絕並顯示原因」取代「沒有食物」；庫存扣除與「沒有食物」只在 M4 驗 | D-12 |
| 實機項目 | 板卡未選定前一律 BLOCKED，不算 FAIL，不得推測為 PASS | D-01、D-02 |
| 證據 | 每筆含 commit SHA 與 BALANCE.md 版本 | 第 2 節 |

## 6. 固定測試資料（Fixtures）

所有 fixture 為可提交 Git 的假資料，不含個資；每次測試重新初始化。

| Fixture | 前置狀態 | 用途 | 適用 |
|---|---|---|---|
| FX-00 | 無存檔、時區 UTC+08:00、seed=1001 | 首次啟動、新遊戲 | M2– |
| FX-01 | 幼年、好感 0、五項需求皆 70、非睡眠時段；M4 起背包有食物 ×3 | 基本照顧、AI 健康對照組 | M2– |
| FX-02 | 飽足 20、精力 80、健康 80，心情與清潔 70；非睡眠；無玩家操作 | 飢餓、AI 需求、健康觸發 | M2–M3 |
| FX-03 | 精力 15、飽足 80，其餘 70 | 休息／睡眠選擇 | M2–M3 |
| FX-04 | 成長中、好感 29（B-BOND-03 成年門檻 −1），距成年差 1 次 +1 照顧；B-BOND-02 冷卻已結束；五項需求 70；seed=1001 | 成年門檻、共用冷卻 | M3– |
| FX-05 | 有效主存檔與上一份備份（皆有 checksum），`last_simulated_at`＝T | 斷電／壞檔恢復、離線補算 | M2–M5 |
| FX-06 | 貨幣 9、售價 10、背包 0 空位 | 商店交易失敗 | M4 |
| FX-07 | 交換封包 TX-0001 已處理一次 | 重送／冪等 | M5 |
| FX-08 | 網路離線、曾完成一次內容下載 | 離線退化與復原 | M6 |
| FX-09 | `health`=20、`unwell`；M2–M3 照護條件依 B-HEALTH-01（待定）成立；M4 起 `medicine`=1 | 生病與恢復 | M2–M4 |
| FX-10 | 錄製的按鍵命令、時間差與 seed；時間跳躍不超過任一平台的 B-TIME-01 | Web／Mac／ESP32 一致性 | M1、M3、M5 |

## 7. 驗收項目

| 里程碑 | 項目數 | NOT RUN | BLOCKED |
|---|---|---|---|
| M1 骨架 | 17 | 17 | 0 |
| M2 可玩 | 34 | 34 | 0 |
| M3 Mac MVP | 36 | 36 | 0 |
| M4 生活擴充 | 23 | 23 | 0 |
| M4 之後（D-11） | 1 | 1 | 0 |
| M5 實機 | 20 | 6 | 14 |
| M6 線上 | 4 | 3 | 1 |
| **合計** | **135** | **120** | **15** |

### 7.1 M1｜系統骨架

放行：本節全 PASS，Mac 模擬器可實際啟動。不阻擋：正式角色、ESP32。

| ID | 來源 AC | 平台 | 前置／Fixture | 步驟 | 預期結果（含數值與容差） | 類型 | 狀態 |
|---|---|---|---|---|---|---|---|
| MH-M1-01 | AC-ARCH-01＋AC-PLATFORM-02（合併）；G-05（核心段）；TC-P0-19 | Rust core | 乾淨 checkout | 1. 掃描 `game-core` 原始碼與依賴樹：`sdl2`、`esp-hal`、`ssd1306`、`mipidsi`、GPIO、SPI、`std::fs`；2. Mac 上跑 `cargo test -p game-core`；3. 以 `--no-default-features` 建置 | 掃描命中 0；測試失敗 0；無 std 建置成功 | UT | NOT RUN |
| MH-M1-02 | AC-ARCH-02＋AC-PLATFORM-01＋TC-NFR-07（合併；mock 段，實機段見 MH-M5-01） | Rust core | FX-10 | 同一序列在 Mac 原生 harness 與 mock 平台 harness 各重放 1 次 | 五項需求、好感、成長階段、健康狀態、事件序列逐欄相同（差異 0）；時間或浮點差異須有 ADR 定義容差 | IT | NOT RUN |
| MH-M1-03 | AC-ARCH-03；TC-P0-19 | Rust core | 2 種 DisplayPort mock | 換 mock 後重跑需求與成長單元測試 | 通過數與輸出快照與基準相同（diff 0） | UT | NOT RUN |
| MH-M1-04 | AC-ARCH-04＋AC-PLATFORM-03（mock 段，實機段見 MH-M5-04）；TC-P0-19 | Mac | 2 組鍵位映射（預設與另一組）、2 組 mock adapter 設定 | 切換鍵位與 adapter 設定後重建，重放 FX-10 | 導覽狀態機、成長規則、經濟、性格 AI 原始碼 diff 0 行；重放結果 diff 0 | IT | NOT RUN |
| MH-M1-05 | NFR-09 | Rust core | `platform-api` | 1. 列出所有 Port trait；2. 逐一檢查 mock 與契約測試；3. 比對架構文件的 Port 清單；4. 檢查 PR 範本 | Port 數＝mock 數＝契約測試套件數（至少 Clock、Random、Storage、Input、Display、Audio 6 個）；契約測試失敗 0；文件與程式 Port 清單 diff 0；PR 範本含「文件已同步」勾選項 | UT | NOT RUN |
| MH-M1-06 | AC-INPUT-01；TC-P0-03 | Mac | FX-01；鍵位依 B-INPUT-01 | 同一 20 步序列分別用預設鍵、注入抽象 KeyA/B/C、改鍵後的新鍵位各跑 1 次 | 三次最終狀態與事件序列 diff 0；畫面顯示目前鍵位對照 | E2E | NOT RUN |
| MH-M1-07 | AC-INPUT-02（模擬段，實機段見 MH-M5-09）；TC-P0-04 | Rust core | 輸入模擬器；防抖窗依 B-INPUT-02（Mac） | 注入 100 次實際按壓，每次附 1–30ms 隨機接點抖動 | 短按事件恰 100 次（容差 0） | UT | NOT RUN |
| MH-M1-08 | AC-INPUT-03（改寫）；TC-P0-03 | Mac | Mac 版每個選單（項數 N 以實作為準） | 在每個選單從第 1 項連按 A 共 N 次 | 遍歷全部項目後回到起點；過程游標索引恆在 0..N−1；越界 0 次 | E2E | NOT RUN |
| MH-M1-09 | AC-INPUT-04（改寫）＋E2E-04（前半）；TC-P0-03 | Mac | FX-01；Mac 版最深選單路徑（深度 D 以實作為準） | 從 Room 進到最深層，再逐次按 C | 每按 1 次 C 回上一層並保留上層游標；從最深層逐層回到 Room 共需 D 次；五項需求與好感前後 diff 0 | E2E | NOT RUN |
| MH-M1-10 | AC-INPUT-06；TC-P0-04 | Rust core | 長按門檻 T 依 B-INPUT-03（M1 定案） | 注入按住 T−50ms、T、T+400ms 各 20 次 | T−50ms：短按 20、長按 0；T 與 T+400ms：長按各 20，放開時額外短按 0 | UT | NOT RUN |
| MH-M1-11 | AC-UI-01（Mac 段，實機段見 MH-M5-10）；TC-P0-17 | Mac | 任一 P0 畫面 | 視窗切 2×、3×、4× 並截圖 | 邏輯畫布 240×240；每邏輯像素對應 2／3／4 實體像素、無插值；文字與選單裁切 0 處 | UX | NOT RUN |
| MH-M1-12 | AC-UI-02＋NFR-07（焦點段）；TC-NFR-06 | Mac | 主選單、底列 | 截圖轉灰階，2 名測試者各自指出焦點 | 焦點至少有高亮框、外框或指示符其一；灰階截圖指認正確率 100% | UX | NOT RUN |
| MH-M1-13 | AC-UI-03；TC-P0-01 | Mac | P0 字串表 | 1. 掃描非 Debug 字串語系；2. 把 1 個字串換成原長 2 倍後顯示 | 繁體中文 100%；超長字串依換行、分頁或截斷顯示，遮擋操作區 0 | UX | NOT RUN |
| MH-M1-14 | AC-UI-04；TC-P0-17 | Mac | 刪除 1 個動畫 asset_id 對應的圖檔 | 啟動並觸發該動畫 | 顯示預設形狀或文字；log 有 1 筆含該 asset_id 的警告；crash 0 | IT | NOT RUN |
| MH-M1-15 | AC-DEV-01 | Mac | 乾淨 Apple Silicon Mac 或 CI macOS runner | 只照 README 指令安裝、建置、啟動 | 不改指令即成功；模擬器視窗開啟；記錄 macOS 與 Rust toolchain 版本 | E2E | NOT RUN |
| MH-M1-16 | AC-CLOUD-01；TC-P0-20 | Mac | GitHub `Randall2000/tamagotchi-uni-inspired-virtual-pet` 的 `main` | 檢查 PRD、README、game-core、Mac 模擬器、CI 設定是否已提交 | 5 類全部存在且對應到 commit SHA；缺 1 類即 FAIL | IT | NOT RUN |
| MH-M1-17 | AC-CLOUD-02；TC-P0-20 | Mac | CI 含 Rust job | 送 1 個正常 PR、1 個故意讓測試失敗的 PR | 正常 PR：`cargo fmt --check`、lint、單元、整合測試全綠；失敗 PR 無法合併 | IT | NOT RUN |

### 7.2 M2｜可玩的照顧循環

放行：本節全 PASS；B-TIME-01 的 Mac 上限已在 BALANCE.md 定案。不阻擋：成長分支、家具、網路。

| ID | 來源 AC | 平台 | 前置／Fixture | 步驟 | 預期結果（含數值與容差） | 類型 | 狀態 |
|---|---|---|---|---|---|---|---|
| MH-M2-01 | AC-INIT-01；TC-P0-01 | Mac | FX-00 | 啟動 → 選「新遊戲」→ B | 按 B 到 Room 可見 ≤3 秒；初始值＝B-STAT-03（Mac），差 0；好感 0、幼年；可見文案全為繁中 | E2E | NOT RUN |
| MH-M2-02 | AC-INIT-02；TC-P0-02 | Mac | FX-05 | 啟動；在啟動畫面按 C | 預設焦點為「繼續」；按 C 後存檔 checksum 不變 | E2E | NOT RUN |
| MH-M2-03 | AC-INIT-03；TC-P0-02 | Mac | FX-05，先記 checksum | 選「新遊戲」→ 覆蓋確認選「否」→ 重啟；再走一次選「是」 | 確認框預設停在保留進度，只按 B 不會覆蓋；選「否」後 checksum 不變並載入原寵物；選「是」才替換 | E2E | NOT RUN |
| MH-M2-04 | AC-INIT-04；TC-P0-01 | Rust core | FX-00 | 相同 seed、初始設定、clock 建立 2 份新遊戲 | 2 份初始狀態序列化後位元組相同 | UT | NOT RUN |
| MH-M2-05 | AC-STAT-01；TC-P0-06、TC-P0-07 | Rust core | FX-01；需求另設在 0、25、35、100 | property test：10,000 次隨機合法命令＋隨機時間推進 | 五項需求恆在 B-STAT-01 範圍；好感從不下降；溢位與負數 0 次 | UT | NOT RUN |
| MH-M2-06 | AC-CARE-01＋AC-STAT-02（無庫存段）＋E2E-01；TC-P0-05 | Mac | FX-01 | 從 Room 只用 A/B/C 執行一次正餐並計時；回 Room 開狀態頁 | ≤30 秒完成；飽足變化＝B-ACT-01（上限 100）；成功提示 1 次；狀態頁數值與核心一致；不檢查食物數量（D-12，見 MH-M4-03） | E2E | NOT RUN |
| MH-M2-07 | AC-CARE-02（改寫，D-12）；TC-P0-06 | Mac | FX-01 分別改為：飽足 100／精力低於 B-ACT-05 門檻／清潔 100／睡眠中 | 每種狀態各嘗試 1 次對應照顧 | 4 種全部拒絕並顯示 B-ACT 列出的原因文字；需求、好感、存檔 diff 0；成功動畫 0 次 | E2E | NOT RUN |
| MH-M2-08 | AC-CARE-03＋AC-INPUT-05（合併）＋E2E-04（後半）；TC-P0-04 | Mac | FX-01 | 同一照顧動畫中連按 B 5 次（按壓間隔小於、大於防抖窗各一輪）；動畫期間強制重繪 10 次 | 每輪只結算 1 次：需求變化 1 次、成功事件 1 個、好感最多加 1 次 | IT | NOT RUN |
| MH-M2-09 | AC-STAT-03＋AC-CARE-04（改寫）；TC-P0-05 | Rust core | FX-01；另將精力設為 B-ACT-05 拒絕門檻 −1 | 各執行 1 次毛線球 | 精力達門檻：心情、精力、飽足變化＝B-ACT-05（容差 0），事件含 reason，快樂反應 visual_event 1 次；精力低於門檻：拒絕並顯示原因文字，數值 diff 0 | UT | NOT RUN |
| MH-M2-10 | AC-STAT-04＋AC-CARE-05；TC-P0-05 | Rust core | FX-01；清潔分別設為 0、B-STAT-04 解除門檻 −1 | 執行清潔身體 | 清潔變化＝B-ACT-03，結果在 0–100；跨過解除門檻的同一次更新中，房間清潔提示消失 | UT | NOT RUN |
| MH-M2-11 | AC-STAT-05；TC-P0-07 | Rust core | FX-02 | 讓飽足在 24、25、26、34、35、36 間往返 1,000 次 | 依 B-STAT-04（Mac：≤25 進、≥35 出）；26–34 之間警示維持前值；警示切換次數＝實際跨門檻次數 | UT | NOT RUN |
| MH-M2-12 | AC-STAT-06；TC-P0-07 | Rust core | FX-01 | 一次推進 24h，與 1,440 次各 1 分鐘分段推進比較；同條件重跑 2 次 | 重跑 diff 0；結果＝B-DECAY 計算值；一次與分段差值 ≤B-TIME-06（待定） | UT | NOT RUN |
| MH-M2-13 | AC-CARE-06；TC-P0-08 | Mac | FX-03 | 選休息進入睡眠；睡眠中嘗試全部照顧；再喚醒 | 進入、離開睡眠各 1 個事件；睡眠中照顧 100% 拒絕並顯示 B-ACT-09 原因；精力不為負；喚醒方式依 B-TIME-05 | E2E | NOT RUN |
| MH-M2-14 | AC-CARE-07；TC-P0-05 | Mac | FX-01 | 開狀態頁，再按 C | 顯示五項需求（飽足、心情、清潔、精力、健康）與好感的名稱和數值，與核心一致；C 回原畫面與原游標 | E2E | NOT RUN |
| MH-M2-15 | AC-CARE-08；TC-P0-06 | Rust core | PRD FR-04 的每個失敗路徑 | 每個失敗路徑各送 1 次命令 | 失敗事件 100% 附 reason；成功 visual_event 數＝實際資料變更數；失敗後存檔 diff 0 | UT | NOT RUN |
| MH-M2-16 | AC-TIME-01；TC-P0-09 | Rust core | FX-05 | 同存檔、同注入時間載入 10 次 | 10 次結果雜湊相同 | UT | NOT RUN |
| MH-M2-17 | AC-TIME-02；TC-P0-09 | Mac | FX-05；上限 L＝B-TIME-01（Mac） | 注入 T+6h 後載入 | 補算量＝min(6h, L)；需求＝B-DECAY 計算值，差 0；用分段或解析解，不逐幀補播；載入到可操作 ≤3 秒 | IT | NOT RUN |
| MH-M2-18 | AC-TIME-03；TC-P0-09 | Rust core | FX-05；L＝B-TIME-01（Mac，依 BALANCE.md，M2 平衡測試定案） | 注入 T+7d 後載入；再依 B-ACT 照顧 | 補算量恰為 L（不得超過）；之後照顧可使五項需求回到 B-STAT-04 解除門檻以上（不可逆狀態 0） | UT | NOT RUN |
| MH-M2-19 | AC-TIME-04＋E2E-05（合併）；TC-P0-09 | Rust core | FX-05 | 注入 T−4h 載入；再注入合法 T+1h 推進並存檔 | 回撥：補算 0、clock anomaly 事件 1 筆、年齡不為負、需求／好感／冷卻不倒退、額外收益 0（B-TIME-02）；之後 1h 正常補算且存檔成功 | IT | NOT RUN |
| MH-M2-20 | AC-TIME-05＋AC-DEV-04（合併）；TC-P0-09、TC-P0-13 | Mac | FX-01 | 用 Debug 快轉 1h、24h、7d 與單步 1 tick | 遊戲時間各前進 1h／24h／7d／1 tick（容差 0）；macOS 系統時間前後差＝實際經過時間 ±1 秒 | IT | NOT RUN |
| MH-M2-21 | AC-SAVE-01＋E2E-02（合併）；TC-P0-15 | Mac | FX-01 | 正餐 → 毛線球 → 存檔 → 關閉 → 重開選「繼續」 | 角色 ID、五項需求、好感、加分冷卻起點、成長階段與紀錄、事件序列 diff 0（時間欄位容差 ±1 秒）；只依合法離線時間補算；上一筆照顧不重複結算 | E2E | NOT RUN |
| MH-M2-22 | AC-SAVE-02；TC-P0-15 | Rust core | 合法存檔、未知 schema_version 存檔、checksum 錯誤存檔 | 逐一載入 | 合法：通過版本與 checksum 檢查；未知版本：顯示清楚錯誤，panic 0；checksum 錯：進入 MH-M2-23 恢復流程 | UT | NOT RUN |
| MH-M2-23 | AC-SAVE-03＋NFR-05（故障段）（實機段見 MH-M5-11）；TC-P0-16、TC-NFR-05 | Rust core | FX-05 | 在寫入 0%、50%、99% 截斷後重開 | 3/3 恢復到最近完整存檔；備份 checksum 不變；顯示可理解的恢復訊息 | FI | NOT RUN |
| MH-M2-24 | NFR-05（循環段）；TC-NFR-05 | Rust core | FX-01 | 100 次存檔／載入循環，每次之間執行 1 個隨機合法命令 | 100/100 載入成功，與記憶體中狀態 diff 0 | UT | NOT RUN |
| MH-M2-25 | NFR-06 | Mac | FX-00；關閉 Wi-Fi、未登入任何帳號 | 新遊戲 → 正餐 → 存檔 → 重開 → 繼續 | 全流程成功；對外網路連線 0 次（網路監看紀錄）；帳號提示 0 次 | E2E | NOT RUN |
| MH-M2-26 | AC-UI-05＋G-06；TC-P0-17、TC-P1-05 | Mac | 3 組 placeholder 素材 | 依序替換 3 組素材，各跑一次 MH-M2-28 流程 | `game-core` diff 0 行；3/3 流程通過 | IT | NOT RUN |
| MH-M2-27 | AC-UI-06；TC-P0-17 | Mac | 靜音 | 執行正餐、存檔、狀態不允許的照顧 | 3 種操作都有可見文字或圖示結果；截圖逐項核對，缺漏 0 | UX | NOT RUN |
| MH-M2-28 | G-02＋AC-DEV-02（合併） | Mac | FX-00 | 只用鍵盤 A/B/C：新遊戲 → 正餐 → 毛線球 → 清潔 → 休息 → 喚醒 → 狀態 → 存檔 → 重開繼續 | 全程無卡住；每步有可見回饋；畫面可見鍵位對照 | E2E | NOT RUN |
| MH-M2-29 | AC-HEALTH-01（改寫：不誤判段）；TC-P0-14 | Rust core | FX-01；照顧腳本使五項需求全程 ≥ B-STAT-04 解除門檻（35） | 24h 加速模擬 | `unwell` 次數＝0；trace 顯示五項需求最低值 ≥35 | UT | NOT RUN |
| MH-M2-30 | AC-HEALTH-01（觸發段）；TC-P0-14 | Rust core | FX-02，停止所有照顧 | 加速模擬到 B-HEALTH-01（待定）觸發條件成立 | 進入 `unwell` ≥1 次；事件 reason 非空並指出觸發的需求 | UT | NOT RUN |
| MH-M2-31 | AC-HEALTH-02；TC-P0-14 | Mac | FX-09 | 看 Room 與狀態頁；截圖轉灰階並靜音 | Room 有健康提示；狀態頁顯示原因；灰階加靜音仍可辨識 | UX | NOT RUN |
| MH-M2-32 | AC-HEALTH-03；TC-P0-14 | Rust core | FX-09 | 執行 1 次照護，快轉恢復期；在門檻 ±1 往返 100 次 | 健康變化＝B-HEALTH-01（待定），單次照護不直接回到 100（B-HEALTH 另定除外）；`unwell` → `recovering` → `healthy` 依進入／退出門檻轉換；門檻往返時狀態閃爍 0 | UT | NOT RUN |
| MH-M2-33 | AC-HEALTH-04（無庫存段，D-12）；TC-P0-06 | Mac | FX-01（healthy）；FX-09 但照護條件不成立 | 嘗試照護 | 拒絕並顯示原因文字；健康 diff 0 | E2E | NOT RUN |
| MH-M2-34 | AC-HEALTH-05；TC-P0-14 | Rust core | FX-09 | 照護 → 快轉 → 存檔 → 重載，重跑 2 次；再重送同一照護命令 | 2 次結果 diff 0；重送產生第 2 次效果 0 | IT | NOT RUN |

### 7.3 M3｜Mac MVP

放行：M1–M3 全 PASS，依第 9 節簽核。實機項不阻擋。

| ID | 來源 AC | 平台 | 前置／Fixture | 步驟 | 預期結果（含數值與容差） | 類型 | 狀態 |
|---|---|---|---|---|---|---|---|
| MH-M3-01 | AC-AI-01（改寫）；TC-P0-10 | Rust core | FX-01（健康對照）與 FX-02；同一性格；seed 1–100 | 兩個 fixture 各取 100 次下一次決策 | FX-02 的 `seek_food` 次數 ≥ 2 × FX-01 次數，且 FX-02 次數 ≥1 | UT | NOT RUN |
| MH-M3-02 | AC-AI-02（改寫）；TC-P0-10 | Rust core | FX-03；無更高優先事件；seed 1–100 | 取 100 次下一次決策 | `rest`＋`sleep` 合計次數高於其他任一行為 | UT | NOT RUN |
| MH-M3-03 | AC-AI-03；TC-P0-10 | Rust core | 固定 state、clock、seed、事件歷程 | 連續 1,000 次決策，重跑 2 次 | 行為序列 diff 0 | UT | NOT RUN |
| MH-M3-04 | AC-AI-04＋G-03（合併改寫）；TC-P0-11 | Rust core | FX-01，非睡眠時段，無玩家操作 | 15 分鐘加速模擬 | 不同自主行為 ≥3 種；每段行為持續 ≥B-AI-01（待定）；2 幀內 A→B→A 來回 0 次；同一幀重抽 0 次 | IT | NOT RUN |
| MH-M3-05 | AC-AI-05；TC-P0-11 | Rust core | FX-01，自主行為進行中 | 按 B 觸發 1 次互動 | 依 PRD FR-06 打斷或排隊；互動完成事件恰 1 個 | IT | NOT RUN |
| MH-M3-06 | AC-AI-06；TC-P0-11 | Rust core | FX-01，注入讓某行為條件永遠成立的錯誤狀態 | 24h 加速模擬 | 每段行為持續 ≤B-AI-02（待定）；冷卻期內重選同一行為 0 次；卡死 0 | UT | NOT RUN |
| MH-M3-07 | AC-AI-07；TC-P0-10 | Rust core | 任一 fixture | 1,000 次決策；再用 release 設定跑一次 | 開發版 100% 決策附非空 reason（例 `energy_low`）；release 設定可關閉詳細日誌 | UT | NOT RUN |
| MH-M3-08 | AC-AI-08；TC-P0-11 | Rust core | — | 掃描 `game-core` 的 `.png` 字串；替換 1 個動畫素材 | 命中 0；行為全以 `behavior_id` 對接；換素材後 `game-core` diff 0 行 | UT | NOT RUN |
| MH-M3-09 | AC-GROW-01；TC-P0-12 | Rust core | FX-01 | 同一照顧序列＋seed 模擬 2 次 | 好感、階段、成長紀錄 diff 0 | UT | NOT RUN |
| MH-M3-10 | AC-GROW-03（前進、不跳階）；TC-P0-12 | Rust core | FX-01（好感 0） | 只用照顧命令把好感推到 B-BOND-03 成年門檻以上，遵守 B-BOND-02 冷卻 | 階段事件依序為幼年 → 成長中 → 成年各 1 筆，發生在好感首次跨過 B-BOND-03 各門檻的那次結算；跳階 0 | UT | NOT RUN |
| MH-M3-11 | AC-GROW-03（不倒退）；D-05 | Rust core | 成長中、好感 15 | 不照顧快轉 7d；再用 Debug 把五項需求設為 0 | 階段仍為成長中、好感仍 15；年齡增加觸發成長 0 次 | UT | NOT RUN |
| MH-M3-12 | D-13（共用冷卻）＋B-BOND-03（成年門檻）；TC-P0-12 | Rust core | FX-04 | 1. 正餐；2. B-BOND-02 冷卻內（例：10 秒後）毛線球；3. 存檔重載；4. 冷卻結束後毛線球 | 1：好感 30（29＋B-ACT-01），進入成年；2：需求依 B-ACT-05 變化、好感 +0；3：冷卻起點保留（容差 ±1 秒）；4：好感 32（30＋B-ACT-05） | UT | NOT RUN |
| MH-M3-13 | AC-GROW-02＋G-04＋E2E-03（3 階段段；分支段見 MH-D11-01）；TC-P0-12 | Rust core | FX-01；策略 A 以 +2 行為為主、策略 B 以 +1 行為為主；固定 seed | 兩策略各推進到成年，各重跑 2 次 | 跨階時間＝依 B-ACT 好感欄與 B-BOND-02 的計算值（容差 0 tick）；每筆跨階事件附 `growth_reason`（觸發命令、好感前後值）；重跑 diff 0；單純時間推進造成跨階 0 次 | IT | NOT RUN |
| MH-M3-14 | AC-GROW-04（改寫；庫存段見 MH-M4-10）；TC-P0-12 | Rust core | FX-01；喜好食物與討厭食物各 1 種（PRD FR-07） | 各餵 1 次 | 兩者反應文字字串不同；狀態效果差值＝B-ACT-10（待定）且 ≠0；差值可由事件 log 算出 | UT | NOT RUN |
| MH-M3-15 | AC-GROW-05；TC-P0-12 | Rust core | 同一需求狀態；性格 `activity` 20 與 80 兩組 | 計算全部行為評分 | 至少 1 個行為評分差 ≠0；方向符合 PRD／BALANCE 的性格定義（例：`activity` 高者 `play_alone` 較高） | UT | NOT RUN |
| MH-M3-16 | AC-GROW-06；TC-P0-13 | Mac | Debug 面板 | 用 Debug 設定性格、好感並快轉 | 系統時鐘不變；每項操作在真實時間 ≤1 分鐘內完成並反映到 Room | IT | NOT RUN |
| MH-M3-17 | AC-GROW-07；TC-P0-12 | Rust core | 好感＝B-BOND-03 成年門檻 −1 | 跨入成年，比較前後狀態 | 只改階段與外觀 ID（另加成長紀錄 1 筆）；資料結構 schema diff 0 | UT | NOT RUN |
| MH-M3-18 | AC-DEV-03；TC-P0-13 | Mac | FX-01 | 用 Debug 修改五項需求、好感、4 個性格傾向 | Room 下一次刷新（≤1 幀）顯示新值 | IT | NOT RUN |
| MH-M3-19 | AC-DEV-05；TC-P0-13 | Mac | FX-01、FX-04 | 設 seed 後重播同一操作序列 2 次 | 成長與行為輸出 diff 0 | IT | NOT RUN |
| MH-M3-20 | AC-DEV-06；TC-P0-13 | Mac | 任一流程 | 匯出事件日誌，跑帳密／個資掃描 | 每列含 `timestamp, event_id, old_state, new_state, reason` 5 欄；掃描命中 0 | SEC | NOT RUN |
| MH-M3-21 | AC-DEV-07＋NFR-10（Debug 段）；TC-P0-18 | Mac | release 建置 | 遍歷所有短按、長按與已定義的組合鍵 | Debug 命令觸發 0 次；畫面無 Debug 入口 | SEC | NOT RUN |
| MH-M3-22 | AC-DEV-08；TC-P0-13 | Mac | FX-00、FX-02、FX-03、FX-04、FX-05 | 從 Debug 載入 5 個情境（剛出生、飢餓、精力低、成年門檻前、損壞存檔） | 5/5 可載入；狀態與 fixture 定義 diff 0 | IT | NOT RUN |
| MH-M3-23 | AC-TIME-06；TC-P0-08 | Rust core | FX-03；時區 UTC+08:00，另 1 個有日光節約的時區 | 快轉跨午夜；跨日光節約切換點 | 睡眠時段與日夜標示＝依時區與 B-TIME-05（Mac 作息）的計算值；跨午夜、DST 各 1 測試通過；負精力 0；超過B-TIME-07（待定）的睡眠 0 | UT | NOT RUN |
| MH-M3-24 | AC-SAVE-04；TC-P0-15 | Rust core | 舊 schema fixture（含 B-BOND-06 舊存檔情境） | 執行 migration | 舊欄位 100% 映射或寫入 migration log；無聲遺失 0；轉換後階段不小於轉換前 | UT | NOT RUN |
| MH-M3-25 | AC-SAVE-05（無貨幣段；貨幣段見 MH-M4-09）；TC-P0-15 | Rust core | FX-05，含 1 筆已完成照顧 | 重送該筆交易 | 需求與好感 diff 0 | IT | NOT RUN |
| MH-M3-26 | AC-SAVE-06 | Rust core | 存檔 schema 與範例存檔 | 掃描識別字串 | Catode32 美術、Bandai 專屬識別命中 0；ID 全為本專案自有 | SEC | NOT RUN |
| MH-M3-27 | AC-PLATFORM-04（mock 段，實機段見 MH-M5-05）；TC-P0-19 | Mac | mock Display、Storage、Input | 注入顯示器斷線、儲存寫入失敗、按鍵卡住（按住超過 B-INPUT-03 長按門檻 10 倍） | 3 種故障各有可觀察錯誤事件與回復；合法存檔 checksum 不變 | FI | NOT RUN |
| MH-M3-28 | G-01 | Mac | FX-00；未看教學的內部測試者 n≥5 | 每人從 Room 起計時，完成一次餵食 | 60 秒內完成者 ≥80%（n=5 時 ≥4 人）；未達標修導覽後重測 | UX | NOT RUN |
| MH-M3-29 | NFR-01（Mac 段）；TC-NFR-01 | Mac | FX-01 | A、B、C 各按 100 次，量按下到可見回饋 | p95 ≤100ms | PERF | NOT RUN |
| MH-M3-30 | NFR-02（Mac 段）；TC-NFR-02 | Mac | 房間、選單、動畫 | 各跑 60 秒 | 每段平均 ≥30fps | PERF | NOT RUN |
| MH-M3-31 | NFR-04（Mac 段）＋NFR-03（Mac 段）；TC-NFR-03、TC-NFR-04 | Mac | FX-01 | 自動操作腳本連續 2 小時，每分鐘取樣記憶體 | crash 0；OOM 0；後 60 分鐘記憶體峰值 ≤ 前 60 分鐘峰值 ×1.05（容差可經 ADR 調整） | PERF | NOT RUN |
| MH-M3-32 | NFR-07＋NFR-08（合併）；TC-NFR-06 | Mac | 全部 P0 畫面；完整繁中字串集 | 遍歷全部畫面截圖；跑字型覆蓋腳本 | 缺字 0；主要資訊重疊 0；核心字串裁切 0；圖示都有文字或可識別回饋 | UX | NOT RUN |
| MH-M3-33 | AC-CLOUD-03＋AC-CLOUD-04＋TC-P0-18（合併） | Mac | 乾淨 Apple Silicon Mac，未裝原始碼 | 推測試 tag → 從 GitHub 下載最新成功建置 → 校驗 SHA-256 → 依說明啟動 → 正餐 → 存檔 | CI 產出測試包並附 SHA-256、版本、說明；校驗相符；可啟動並完成正餐與存檔；可查到版本與 commit SHA；不經開發者手動傳檔 | E2E | NOT RUN |
| MH-M3-34 | AC-CLOUD-05 | Web+Mac | FX-10 | 同一錄製序列分別在 Web 原型與 Mac 模擬器重放 | 飽足、心情、清潔、精力、好感、成長階段、事件序列 diff 0（健康只在 Mac，見 B-STAT-02）；允許差異只限 ADR 列明項（如 B-INPUT-02、B-TIME-04）；兩端畫面都告知儲存位置 | IT | NOT RUN |
| MH-M3-35 | AC-CLOUD-06＋NFR-10（金鑰／個資段）＋NFR-11＋TC-NFR-08（合併） | Mac | repo、Release 產物、素材與字型清冊 | 跑 secrets 與 license 掃描；稽核素材授權欄位；監看執行時對外傳送 | 密碼、token、私鑰、個人本機路徑、真實玩家存檔命中 0；未授權 Bandai 或 Catode32 素材 0；MIT 聲明保留；掃描為 PR 必要 check；個資對外傳送 0 | SEC | NOT RUN |
| MH-M3-36 | AC-CLOUD-07＋TC-NFR-10（合併） | Mac | 指定 tag | CI 與 1 台獨立機各建置 1 次 | 依鎖定依賴成功重建；記錄 Rust toolchain、OS／SDK、建置指令；兩份產物 SHA-256 相同，或差異只在 ADR 列明欄位 | IT | NOT RUN |

### 7.4 M4｜生活擴充（P1）

放行：納入 M4 的項目全 PASS；M1–M3 回歸全 PASS。臨時託管（MH-M4-20..23）只在納入 M4 時執行，不納入則在變更紀錄說明。

| ID | 來源 AC | 平台 | 前置／Fixture | 步驟 | 預期結果（含數值與容差） | 類型 | 狀態 |
|---|---|---|---|---|---|---|---|
| MH-M4-01 | AC-ITEM-01；TC-P1-01 | Mac | FX-01，貨幣 ≥ 售價（B-SHOP-01（待定）） | 用三鍵買 1 份食物；同一交易 ID 再送 1 次 | 貨幣減售價 1 次；背包 +1；交易 ID 唯一；重入生效 0 次 | IT | NOT RUN |
| MH-M4-02 | AC-ITEM-02；TC-P1-02 | Rust core | FX-06；另備價格為負、缺欄的資料表 | 各嘗試購買 1 次 | 交易全部取消，貨幣與背包 diff 0；貨幣不為負；分別顯示「沒錢」「背包滿」「資料異常」類原因 | IT | NOT RUN |
| MH-M4-03 | AC-ITEM-03＋AC-STAT-02（庫存段）＋E2E-01（庫存段）；TC-P1-01 | Mac | FX-01（食物 ×3） | 正餐 1 次 | 食物 3 → 2（恰減 1）；`effect_id` 套用 1 次 | E2E | NOT RUN |
| MH-M4-04 | AC-CARE-02（庫存段，D-12）；TC-P0-06 | Mac | FX-01，食物改為 0 | 嘗試正餐 | 拒絕並顯示「沒有食物」；需求、好感、背包 diff 0；成功回饋 0 | E2E | NOT RUN |
| MH-M4-05 | AC-HEALTH-04（庫存段）；TC-P0-06 | Mac | FX-09，`medicine` 改為 0 | 嘗試治療 | 拒絕並顯示「沒有藥品」；健康與背包 diff 0 | E2E | NOT RUN |
| MH-M4-06 | AC-HEALTH-05（庫存段）；TC-P0-14 | Rust core | FX-09（`medicine`=1） | 治療後重送同一命令 | `medicine` 1 → 0，只扣 1 次 | IT | NOT RUN |
| MH-M4-07 | AC-ITEM-04；TC-P1-01 | Mac | 已購買並使用物品 | 存檔重開 | 商品、餘額、背包順序與有效項目 diff 0 | E2E | NOT RUN |
| MH-M4-08 | AC-ITEM-05；TC-P1-02 | Rust core | 存檔含未知 `item_id`；換版物品表 | 載入 | 走相容處理並提示；crash 0；其他物品數量 diff 0 | FI | NOT RUN |
| MH-M4-09 | AC-SAVE-05（貨幣段） | Rust core | FX-05，含 1 筆已完成購買、1 筆已完成餵食 | 重送兩筆交易 | 貨幣不重複扣；食物不重複扣 | IT | NOT RUN |
| MH-M4-10 | AC-GROW-04（庫存段） | Rust core | 喜好與討厭食物各 1 份 | 各餵 1 次 | 兩者背包數量各恰減 1 | UT | NOT RUN |
| MH-M4-11 | AC-GAME-01；TC-P1-03 | Mac | 小遊戲 | 只用 A/B/C 完成 1 局並計時 | 完成 1 局；方向鍵、觸控、連線需求 0；單局長度在 PRD FR-12 範圍內 | E2E | NOT RUN |
| MH-M4-12 | AC-GAME-02；TC-P1-03 | Rust core | 已完成 1 局 | 離開結果頁再回來 3 次 | 貨幣只增加 1 次B-GAME-01（待定） | IT | NOT RUN |
| MH-M4-13 | AC-GAME-03；TC-P1-03 | Mac | 局中 | 選退出 → 確認 → 重開 | 有確認提示；退出後完成獎勵 0 | E2E | NOT RUN |
| MH-M4-14 | AC-GAME-04；TC-P1-03 | Rust core | 10 個固定 seed | 每個 seed 跑 2 次 | 判分 10/10 相同 | UT | NOT RUN |
| MH-M4-15 | AC-ROOM-01；TC-P1-04 | Mac | 2 個家具槽與可用家具 | 每槽更換家具 | ≥2 槽可換；每槽有效擺件恰 1 件 | E2E | NOT RUN |
| MH-M4-16 | AC-ROOM-02；TC-P1-04 | Rust core | 1 件不適用該槽的家具 | 放入該槽 | 拒絕並顯示原因；家具數量 diff 0 | IT | NOT RUN |
| MH-M4-17 | AC-ROOM-03；TC-P1-04 | Rust core | 喜愛玩具；固定 seed | 擺放前後計算評分，重跑 2 次 | `react_favorite` 或 `play_alone` 評分差 >0；重跑 diff 0 | UT | NOT RUN |
| MH-M4-18 | AC-ROOM-04；TC-P1-05 | Mac | 頭飾與服裝槽；2 組佔位素材 | 裝備、卸除、更換；選無相容配件；按 C 返回 | 角色圖層更新；性格、需求、好感 diff 0；無相容配件時顯示提示；C 返回後資料 diff 0 | IT | NOT RUN |
| MH-M4-19 | AC-ROOM-05；TC-P1-04 | Mac | 已佈置房間 | 存檔重載 | 房間配置 diff 0 | E2E | NOT RUN |
| MH-M4-20 | AC-SITTER-01；TC-P1-06 | Mac | 託管納入 M4 才執行 | 設定開始與結束 | 畫面顯示託管狀態與返回時間 | E2E | NOT RUN |
| MH-M4-21 | AC-SITTER-02；TC-P1-06 | Rust core | 同上 | 託管期間快轉 | 需求保護量＝B-SITTER-01（待定）；重複領獎 0；好感與成長不加倍 | UT | NOT RUN |
| MH-M4-22 | AC-SITTER-03；TC-P1-06 | Rust core | 同上 | 正常結束、手動取消、重啟、重送結算 | 每種情境結算恰 1 次；重載狀態 diff 0 | IT | NOT RUN |
| MH-M4-23 | AC-SITTER-04；TC-P1-06 | Rust core | 同上 | 送不合法開始時間、重複開始、超過上限 | 3 種皆拒絕並附原因 | UT | NOT RUN |

### 7.5 M4 之後｜外觀分支候選（待 D-11）

D-11 定案前不執行、不阻擋任何 Gate。研究規格的 5 階段＋3 成年分支不列入驗收；D-11 定案後依決議改寫本節，並同步 BALANCE.md 與 PRD.md。

| ID | 來源 AC | 平台 | 前置／Fixture | 步驟 | 預期結果（含數值與容差） | 類型 | 狀態 |
|---|---|---|---|---|---|---|---|
| MH-D11-01 | AC-GROW-02＋G-04＋E2E-03（分支段）；TC-P0-12 | Rust core | D-11 已定案；FX-01；策略 A／B；固定 seed | 兩策略推進到成年，依 D-11 規則決定外觀分支，重跑 2 次 | 兩策略得到不同外觀分支 ID；`growth_reason` 可追溯到輸入；重跑 diff 0；成長階段仍只依好感（B-BOND-03） | IT | NOT RUN |

### 7.6 M5｜ESP32 實機與 P2

放行：D-01、D-02 已定案；本節實機項全 PASS；納入的 P2 項全 PASS；M1–M3 回歸全 PASS。板卡未選定時，實機項維持 BLOCKED。

| ID | 來源 AC | 平台 | 前置／Fixture | 步驟 | 預期結果（含數值與容差） | 類型 | 狀態 |
|---|---|---|---|---|---|---|---|
| MH-M5-01 | AC-ARCH-02＋AC-PLATFORM-01＋TC-NFR-07（合併；實機段）＋G-05 | HW | MH-M1-02 PASS；首塊板卡；FX-10 加 FX-09 序列 | 同一序列在 Mac 與板卡各重放 1 次 | 五項需求、好感、階段、健康狀態、事件序列一致；差異只限 ADR 列明項 | HW | BLOCKED |
| MH-M5-02 | AC-ARCH-05＋NFR-04（實機段）；TC-NFR-04 | HW | 板卡 | 連續 60 分鐘自動操作與畫面更新 | crash 0；watchdog reset 0；記憶體判定同 MH-M3-31；測試條件記錄在案 | HW | BLOCKED |
| MH-M5-03 | AC-ARCH-06 | HW | D-01 選型 | 依文件指令重建；量測 RAM、Flash、PSRAM | 可重現建置指令、資源量測紀錄、選型原因齊全；未測項目不得宣稱支援 | HW | BLOCKED |
| MH-M5-04 | AC-PLATFORM-03（實機段） | HW | C6、S3 adapter | 切換編譯目標與板卡設定 | 成長規則、經濟、性格 AI 原始碼 diff 0 行 | HW | BLOCKED |
| MH-M5-05 | AC-PLATFORM-04（實機段） | HW | 板卡 | 拔顯示排線、注入 Flash 寫入失敗、按鍵卡住 | 3 種故障各有可觀察錯誤與回復；合法存檔 checksum 不變 | FI | BLOCKED |
| MH-M5-06 | NFR-01（實機段）；TC-NFR-01 | HW | 板卡 | A、B、C 各按 100 次 | p95 ≤150ms | PERF | BLOCKED |
| MH-M5-07 | NFR-02（實機段）；TC-NFR-02 | HW | 房間、選單、動畫 | 各跑 60 秒 | 每秒 fps 皆 ≥15（最低門檻）；平均 ≥20 為目標，結果另記 | PERF | BLOCKED |
| MH-M5-08 | NFR-03；TC-NFR-03 | HW | 逐場景 | 記錄 heap、stack、PSRAM 峰值 | OOM 0；heap 峰值 ≤ 可用 heap 80% | PERF | BLOCKED |
| MH-M5-09 | AC-INPUT-02（實機段）＋PRD §10.1 GPIO | HW | 3 實體鍵 GPIO 映射；防抖窗依 B-INPUT-02（實機） | 每鍵實按 100 次 | 每鍵短按事件恰 100 次 | HW | BLOCKED |
| MH-M5-10 | AC-UI-01（實機段）＋PRD §10.1 SPI／背光 | HW | 螢幕依 D-02 | 顯示全部 P0 畫面並與 Mac 截圖對照；切換背光 | 座標系與 Mac 相同；裁切 0；背光可開關 | HW | BLOCKED |
| MH-M5-11 | AC-SAVE-03（實機段）＋PRD §10.1 Flash／重啟 | HW | 雙槽或等效存檔 | 存檔寫入中斷電 20 次後重開 | 20/20 恢復到最近完整存檔 | FI | BLOCKED |
| MH-M5-12 | PRD §10.1 離線時鐘、§8.1 時間 | HW | RTC 或校時方案 | 斷電 1h、6h 後開機 | 補算量與實際經過時間差 ≤ ADR 容差，且不超過 B-TIME-01（實機）；無可靠時鐘時畫面明示限制 | HW | BLOCKED |
| MH-M5-13 | AC-WALK-01；TC-P2-01 | Rust core | FX-10；MotionSource mock 回傳 0、100、1,000 步 | 3 組各計算 2 次獎勵 | 同步數、seed、規則的材料結果 diff 0 | UT | NOT RUN |
| MH-M5-14 | AC-WALK-02（模擬段）；TC-P2-01 | Mac | 停用 MotionSource | 開啟散步 | 顯示「模擬模式」或「不可用」；以實測步數呈現 0 次 | E2E | NOT RUN |
| MH-M5-15 | AC-WALK-02（實機段）；TC-P2-02 | HW | 帶 IMU 板卡；M5 感測器 ADR 已訂誤差門檻 | 靜置 10 分鐘、手持走固定路線、搖晃，各記錄計數 | 靜置增量與步行誤差 ≤ ADR 門檻；ADR 未訂門檻前不得 PASS | HW | BLOCKED |
| MH-M5-16 | AC-WALK-03；TC-P2-03 | Rust core | 足量與不足的材料各 1 份 | 各合成 1 次 | 足量：扣料與成品增加在同一交易完成；不足：存檔 diff 0 | IT | NOT RUN |
| MH-M5-17 | AC-WALK-04；TC-P2-03 | Rust core | 已有當日領取紀錄 | 時鐘回撥後再領 | 重發 0 次；clock anomaly 1 筆 | UT | NOT RUN |
| MH-M5-18 | AC-SOCIAL-01＋AC-SOCIAL-03＋TC-NFR-09（協定模擬段）；TC-P2-04 | Rust core | 模擬裝置 A、B，及協定版本不符的 C | A 請求、B 拒絕；A 請求後逾時；雙方確認；C 送不相容封包 | 拒絕與逾時新增好友 0；雙方確認新增 1 筆；不相容封包拒收並記原因，crash 0、存檔 diff 0 | SEC | NOT RUN |
| MH-M5-19 | AC-SOCIAL-02＋AC-SOCIAL-04＋TC-NFR-09（協定模擬段）；TC-P2-05 | Rust core | FX-07；另 1 台未配對模擬裝置 | TX-0001 重送 10 次；未配對裝置送狀態修改命令 | 道具只轉移 1 次；未配對命令生效 0；封包含 Wi-Fi 密碼 0 | SEC | NOT RUN |
| MH-M5-20 | AC-SOCIAL-01..04＋TC-NFR-09（實機段）；TC-P2-04、TC-P2-05 | HW | 2 台實體裝置 | 在實機重做 MH-M5-18、MH-M5-19，保留兩端串口 log | 結果同 MH-M5-18、MH-M5-19 | HW | BLOCKED |

### 7.7 M6｜線上功能（P3）

放行：本節全 PASS；安全與隱私審查完成；離線回歸（M1–M4 適用項）全 PASS。

| ID | 來源 AC | 平台 | 前置／Fixture | 步驟 | 預期結果（含數值與容差） | 類型 | 狀態 |
|---|---|---|---|---|---|---|---|
| MH-M6-01 | AC-ONLINE-01；TC-P3-01 | Mac | FX-08 | 斷網後照顧、使用背包、佈置房間、玩小遊戲 | 4 類功能皆可用；永久阻擋畫面 0 | E2E | NOT RUN |
| MH-M6-02 | AC-ONLINE-02；TC-P3-01 | Mac | FX-08 | 開啟線上入口，等到逾時，再按 C | 顯示連線狀態；逾時（秒數依 ADR）後顯示失敗原因；C 可返回；無限載入 0 | E2E | NOT RUN |
| MH-M6-03 | AC-ONLINE-03；TC-P3-02 | Rust core | 有效簽章包、竄改 1 位元的包、版本不相容的包 | 逐一安裝 | 有效包套用；另 2 包拒絕且舊內容 checksum 不變；每次拒絕有 1 筆錯誤 log | SEC | NOT RUN |
| MH-M6-04 | AC-ONLINE-04；TC-P3-03 | HW | 可啟動韌體備份、測試更新包 | 在下載、寫入、重啟三段各模擬斷電與校驗失敗 | 6/6 恢復上一可用韌體，存檔 diff 0；未通過不得發布 OTA | FI | BLOCKED |

## 8. 需求覆蓋矩陣

### 8.1 AC → 新 ID

| 家族 | 對照 |
|---|---|
| AC-INIT | AC-INIT-01 → MH-M2-01；AC-INIT-02 → MH-M2-02；AC-INIT-03 → MH-M2-03；AC-INIT-04 → MH-M2-04 |
| AC-INPUT | AC-INPUT-01 → MH-M1-06；AC-INPUT-02 → MH-M1-07、MH-M5-09；AC-INPUT-03 → MH-M1-08；AC-INPUT-04 → MH-M1-09；AC-INPUT-05 → MH-M2-08；AC-INPUT-06 → MH-M1-10 |
| AC-STAT | AC-STAT-01 → MH-M2-05；AC-STAT-02 → MH-M2-06、MH-M4-03；AC-STAT-03 → MH-M2-09；AC-STAT-04 → MH-M2-10；AC-STAT-05 → MH-M2-11；AC-STAT-06 → MH-M2-12 |
| AC-CARE | AC-CARE-01 → MH-M2-06；AC-CARE-02 → MH-M2-07、MH-M4-04；AC-CARE-03 → MH-M2-08；AC-CARE-04 → MH-M2-09；AC-CARE-05 → MH-M2-10；AC-CARE-06 → MH-M2-13；AC-CARE-07 → MH-M2-14；AC-CARE-08 → MH-M2-15 |
| AC-TIME | AC-TIME-01 → MH-M2-16；AC-TIME-02 → MH-M2-17；AC-TIME-03 → MH-M2-18；AC-TIME-04 → MH-M2-19；AC-TIME-05 → MH-M2-20；AC-TIME-06 → MH-M3-23 |
| AC-AI | AC-AI-01 → MH-M3-01；AC-AI-02 → MH-M3-02；AC-AI-03 → MH-M3-03；AC-AI-04 → MH-M3-04；AC-AI-05 → MH-M3-05；AC-AI-06 → MH-M3-06；AC-AI-07 → MH-M3-07；AC-AI-08 → MH-M3-08 |
| AC-GROW | AC-GROW-01 → MH-M3-09；AC-GROW-02 → MH-M3-13、MH-D11-01；AC-GROW-03 → MH-M3-10、MH-M3-11；AC-GROW-04 → MH-M3-14、MH-M4-10；AC-GROW-05 → MH-M3-15；AC-GROW-06 → MH-M3-16；AC-GROW-07 → MH-M3-17 |
| AC-SAVE | AC-SAVE-01 → MH-M2-21；AC-SAVE-02 → MH-M2-22；AC-SAVE-03 → MH-M2-23、MH-M5-11；AC-SAVE-04 → MH-M3-24；AC-SAVE-05 → MH-M3-25、MH-M4-09；AC-SAVE-06 → MH-M3-26 |
| AC-UI | AC-UI-01 → MH-M1-11、MH-M5-10；AC-UI-02 → MH-M1-12；AC-UI-03 → MH-M1-13；AC-UI-04 → MH-M1-14；AC-UI-05 → MH-M2-26；AC-UI-06 → MH-M2-27 |
| AC-DEV | AC-DEV-01 → MH-M1-15；AC-DEV-02 → MH-M2-28；AC-DEV-03 → MH-M3-18；AC-DEV-04 → MH-M2-20；AC-DEV-05 → MH-M3-19；AC-DEV-06 → MH-M3-20；AC-DEV-07 → MH-M3-21；AC-DEV-08 → MH-M3-22 |
| AC-HEALTH | AC-HEALTH-01 → MH-M2-29、MH-M2-30；AC-HEALTH-02 → MH-M2-31；AC-HEALTH-03 → MH-M2-32；AC-HEALTH-04 → MH-M2-33、MH-M4-05；AC-HEALTH-05 → MH-M2-34、MH-M4-06 |
| AC-CLOUD | AC-CLOUD-01 → MH-M1-16；AC-CLOUD-02 → MH-M1-17；AC-CLOUD-03 → MH-M3-33；AC-CLOUD-04 → MH-M3-33；AC-CLOUD-05 → MH-M3-34；AC-CLOUD-06 → MH-M3-35；AC-CLOUD-07 → MH-M3-36；AC-CLOUD-08 → 第 1 節規則 2（非測試項，簽核時檢查） |
| AC-PLATFORM | AC-PLATFORM-01 → MH-M1-02、MH-M5-01；AC-PLATFORM-02 → MH-M1-01；AC-PLATFORM-03 → MH-M1-04、MH-M5-04；AC-PLATFORM-04 → MH-M3-27、MH-M5-05 |
| AC-ARCH | AC-ARCH-01 → MH-M1-01；AC-ARCH-02 → MH-M1-02、MH-M5-01；AC-ARCH-03 → MH-M1-03；AC-ARCH-04 → MH-M1-04；AC-ARCH-05 → MH-M5-02；AC-ARCH-06 → MH-M5-03 |
| AC-ITEM | AC-ITEM-01 → MH-M4-01；AC-ITEM-02 → MH-M4-02；AC-ITEM-03 → MH-M4-03；AC-ITEM-04 → MH-M4-07；AC-ITEM-05 → MH-M4-08 |
| AC-GAME | AC-GAME-01 → MH-M4-11；AC-GAME-02 → MH-M4-12；AC-GAME-03 → MH-M4-13；AC-GAME-04 → MH-M4-14 |
| AC-ROOM | AC-ROOM-01 → MH-M4-15；AC-ROOM-02 → MH-M4-16；AC-ROOM-03 → MH-M4-17；AC-ROOM-04 → MH-M4-18；AC-ROOM-05 → MH-M4-19 |
| AC-SITTER | AC-SITTER-01 → MH-M4-20；AC-SITTER-02 → MH-M4-21；AC-SITTER-03 → MH-M4-22；AC-SITTER-04 → MH-M4-23 |
| AC-WALK | AC-WALK-01 → MH-M5-13；AC-WALK-02 → MH-M5-14、MH-M5-15；AC-WALK-03 → MH-M5-16；AC-WALK-04 → MH-M5-17 |
| AC-SOCIAL | AC-SOCIAL-01 → MH-M5-18、MH-M5-20；AC-SOCIAL-02 → MH-M5-19、MH-M5-20；AC-SOCIAL-03 → MH-M5-18、MH-M5-20；AC-SOCIAL-04 → MH-M5-19、MH-M5-20 |
| AC-ONLINE | AC-ONLINE-01 → MH-M6-01；AC-ONLINE-02 → MH-M6-02；AC-ONLINE-03 → MH-M6-03；AC-ONLINE-04 → MH-M6-04 |

### 8.2 NFR、E2E、G、其他 → 新 ID

| 家族 | 對照 |
|---|---|
| NFR | NFR-01 → MH-M3-29、MH-M5-06；NFR-02 → MH-M3-30、MH-M5-07；NFR-03 → MH-M3-31、MH-M5-08；NFR-04 → MH-M3-31、MH-M5-02；NFR-05 → MH-M2-23、MH-M2-24；NFR-06 → MH-M2-25；NFR-07 → MH-M1-12、MH-M3-32；NFR-08 → MH-M3-32；NFR-09 → MH-M1-05；NFR-10 → MH-M3-21、MH-M3-35；NFR-11 → MH-M3-35 |
| E2E | E2E-01 → MH-M2-06、MH-M4-03；E2E-02 → MH-M2-21；E2E-03 → MH-M3-13、MH-D11-01；E2E-04 → MH-M1-09、MH-M2-08；E2E-05 → MH-M2-19 |
| G | G-01 → MH-M3-28；G-02 → MH-M2-28；G-03 → MH-M3-04；G-04 → MH-M3-13、MH-D11-01；G-05 → MH-M1-01、MH-M5-01；G-06 → MH-M2-26；G-07 → 第 9 節簽核 |
| D 決策 | D-05 → MH-M3-10、MH-M3-11；D-12 → MH-M2-07、MH-M2-33、MH-M4-03..05；D-13 → MH-M3-12；D-11 → MH-D11-01 |
| PRD §10.1 實機驗證 | GPIO → MH-M5-09；SPI／背光 → MH-M5-10；Flash／重啟 → MH-M5-11；離線時鐘 → MH-M5-12 |
| 舊 QA §2 | FX-00..FX-10 → 第 6 節（FX-04 改為好感門檻式） |
| 舊 QA §2A | WEB-MOTION-01、WEB-GROW-01..04 → 對照見 [ACCEPTANCE_WEB.md](ACCEPTANCE_WEB.md) §4（舊 PASS 不沿用） |

### 8.3 舊 TC → 新 ID

| 家族 | 對照 |
|---|---|
| TC-P0 | TC-P0-01 → MH-M2-01、MH-M2-04、MH-M1-13；TC-P0-02 → MH-M2-02、MH-M2-03；TC-P0-03 → MH-M1-06、MH-M1-08、MH-M1-09；TC-P0-04 → MH-M1-07、MH-M1-10、MH-M2-08；TC-P0-05 → MH-M2-06、MH-M2-09、MH-M2-10、MH-M2-14；TC-P0-06 → MH-M2-05、MH-M2-07、MH-M2-15、MH-M2-33、MH-M4-04、MH-M4-05；TC-P0-07 → MH-M2-05、MH-M2-11、MH-M2-12；TC-P0-08 → MH-M2-13、MH-M3-23；TC-P0-09 → MH-M2-16..20；TC-P0-10 → MH-M3-01、MH-M3-02、MH-M3-03、MH-M3-07；TC-P0-11 → MH-M3-04、MH-M3-05、MH-M3-06、MH-M3-08；TC-P0-12 → MH-M3-09..15、MH-M3-17、MH-D11-01；TC-P0-13 → MH-M2-20、MH-M3-16、MH-M3-18..20、MH-M3-22；TC-P0-14 → MH-M2-29..34、MH-M4-06；TC-P0-15 → MH-M2-21、MH-M2-22、MH-M3-24、MH-M3-25；TC-P0-16 → MH-M2-23；TC-P0-17 → MH-M1-11、MH-M1-14、MH-M2-26、MH-M2-27；TC-P0-18 → MH-M3-21、MH-M3-33；TC-P0-19 → MH-M1-01、MH-M1-03、MH-M1-04、MH-M3-27；TC-P0-20 → MH-M1-16、MH-M1-17 |
| TC-P1 | TC-P1-01 → MH-M4-01、MH-M4-03、MH-M4-07；TC-P1-02 → MH-M4-02、MH-M4-08；TC-P1-03 → MH-M4-11..14；TC-P1-04 → MH-M4-15、MH-M4-16、MH-M4-17、MH-M4-19；TC-P1-05 → MH-M4-18、MH-M2-26；TC-P1-06 → MH-M4-20..23 |
| TC-P2 | TC-P2-01 → MH-M5-13、MH-M5-14；TC-P2-02 → MH-M5-15；TC-P2-03 → MH-M5-16、MH-M5-17；TC-P2-04 → MH-M5-18、MH-M5-20；TC-P2-05 → MH-M5-19、MH-M5-20 |
| TC-P3 | TC-P3-01 → MH-M6-01、MH-M6-02；TC-P3-02 → MH-M6-03；TC-P3-03 → MH-M6-04 |
| TC-NFR | TC-NFR-01 → MH-M3-29、MH-M5-06；TC-NFR-02 → MH-M3-30、MH-M5-07；TC-NFR-03 → MH-M3-31、MH-M5-08；TC-NFR-04 → MH-M3-31、MH-M5-02；TC-NFR-05 → MH-M2-23、MH-M2-24；TC-NFR-06 → MH-M1-12、MH-M3-32；TC-NFR-07 → MH-M1-02、MH-M5-01；TC-NFR-08 → MH-M3-35；TC-NFR-09 → MH-M5-18、MH-M5-19、MH-M5-20；TC-NFR-10 → MH-M3-36 |

## 9. 發布簽核（M3／M5）

複製到 GitHub issue 使用。結論欄只能填第 1 節四值之一。

```markdown
### M3｜Mac MVP 簽核
- Release tag：
- Git commit SHA（40 碼）：
- BALANCE.md 版本（commit SHA）：
- macOS 版本／機型：
- Rust toolchain／視窗方案版本：
- Fixture 版本：
- 測試者／日期（台北時間）：

- [ ] M1：MH-M1-01..17 全 PASS
- [ ] M2：MH-M2-01..34 全 PASS
- [ ] M3：MH-M3-01..36 全 PASS
- [ ] HEALTH：MH-M2-29..34 全 PASS
- [ ] CLOUD：MH-M1-16、MH-M1-17、MH-M3-33..36 全 PASS，每項附 CI run URL（無 URL 不得 PASS）
- [ ] PLATFORM：MH-M1-01、MH-M1-02、MH-M1-04、MH-M3-27 全 PASS
- [ ] E2E-01..05 對應項 PASS：MH-M2-06、MH-M2-21、MH-M3-13、MH-M1-09、MH-M2-08、MH-M2-19
- [ ] G-01 可用性：MH-M3-28 PASS
- [ ] Mac 2 小時連續操作：MH-M3-31 PASS
- [ ] B-TIME-01 Mac 上限已在 BALANCE.md 定案
- [ ] 未解 Critical／High = 0；Medium／Low 已列負責人
- [ ] 實機項（M5）維持 BLOCKED，不計入本次阻擋

結論：PASS / FAIL / BLOCKED / NOT RUN
證據／CI／Issue 連結：
已知限制：
簽核人：

### M5｜實機簽核
- Release tag／韌體版本：
- Git commit SHA（40 碼）：
- BALANCE.md 版本（commit SHA）：
- 板卡型號（D-01）／螢幕型號（D-02）：
- 工具鏈與 SDK 版本：
- 測試者／日期（台北時間）：

- [ ] M3 簽核為 PASS；M1–M3 回歸重跑全 PASS
- [ ] 若已納入 M4：M4 納入項全 PASS
- [ ] 板卡已選定：MH-M5-03 PASS
- [ ] PLATFORM：MH-M5-01、MH-M5-04、MH-M5-05 全 PASS
- [ ] HEALTH：MH-M5-01 序列含 FX-09，健康狀態與 Mac 一致
- [ ] CLOUD：韌體產物重跑 MH-M3-35、MH-M3-36 全 PASS（記錄板卡 SDK 版本）
- [ ] 硬體 NFR 有實測資料：MH-M5-02、MH-M5-06、MH-M5-07、MH-M5-08 全 PASS
- [ ] 實機輸入／顯示／存檔／時鐘：MH-M5-09..12 全 PASS
- [ ] 納入的 P2：MH-M5-13..20 對應項全 PASS
- [ ] 未解 Critical／High = 0

結論：PASS / FAIL / BLOCKED / NOT RUN（板卡未選定時只能填 BLOCKED）
證據／串口 log／Issue 連結：
已知限制：
簽核人：
```

## 10. 不在本文件的內容

- **本文件不含 Web 原型驗收，見 [ACCEPTANCE_WEB.md](ACCEPTANCE_WEB.md)。**
- 遊戲數值不在本文件定義，見 [BALANCE.md](BALANCE.md)；產品規則與決策見 [PRD.md](PRD.md)。
