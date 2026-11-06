# didi 角色重新生圖：ChatGPT 生圖規格與驗證條件

> 2026-11-06｜原因：現有角色圖未通過主觀驗收（WEB-PX-08 FAIL），改由 ChatGPT 重新生圖。
> 收圖檢查工具：`python3 scripts/intake-chatgpt-sheet.py`｜色票：[PALETTE.md](PALETTE.md)｜驗收清單：[ACCEPTANCE_WEB.md](ACCEPTANCE_WEB.md) §2.8

## 1. 流程

| 步驟 | 誰 | 做什麼 | 通過才進下一步 |
|---|---|---|---|
| 1. 定角色 | Randall 用 ChatGPT | 依 §4 提示詞 A、B 生**幼貓**與**成貓**的角色設定圖，用工具 `--action identity` 檢查 | 自動檢查全 PASS＋Randall 簽核外觀（ART-VIS-01） |
| 2. 生動作 | Randall 用 ChatGPT | 在同一個對話裡上傳已簽核的設定圖，依提示詞 C 一個動作生一張 | — |
| 3. 收圖檢查 | 工具 | `intake-chatgpt-sheet.py` 去背、對齊格子、套色票、跑 ART-RAW／PX／ID 全部自動檢查，產生報告與對照圖 | 自動檢查全 PASS |
| 4. 目視驗收 | Randall | 看對照圖與手機實機（ART-VIS） | 全部簽核才換進遊戲 |

收圖工具**不會**直接換掉遊戲裡的圖。通過的圖放在 `output/art-intake/`，簽核後才另外接進遊戲。

## 2. 交件格式（每一張圖）

> **請交 ChatGPT 的原始下載檔**：在 ChatGPT 圖片上按下載，存成 PNG 放到一個資料夾（例如 `~/Downloads/didi-art/`），再把資料夾路徑告訴 Claude。不要截圖或貼上聊天預覽：預覽會被縮放、轉成 webp，像素格會跑掉（2026-11-06 第一輪就是這樣，尺寸變成 1254×1254 與 1261×1247）。

| 項目 | 規格 |
|---|---|
| 檔案 | ChatGPT 下載的原始 PNG，正方形（約 1024～1600px，長寬差 ≤ 2%） |
| 格子 | 4×4 = 16 格；由左到右、由上到下放姿勢；用不到的格子留空 |
| 背景 | 完全透明。做不到時，用**純色 `#FF00FF` 洋紅**平塗（不能有漸層、陰影、地板） |
| 像素 | 每格是一隻 **32×32 像素**的角色（2026-11-06 定，見 PRD D-15），每個像素是同樣大小的正方形色塊；不能有反鋸齒、模糊、漸層 |
| 位置 | 腳底踩在每格倒數第 2 個像素列（同一條線），左右置中；耳朵上方至少空 3 個像素、左右至少空 1 個像素；不能超出格子 |
| 描邊 | 輪廓外圈 1 個像素的深色描邊 `#1a0e17` |
| 禁止 | 文字、浮水印、格線、地板陰影、多餘道具、第二隻貓 |
| 檔名 | `<幼貓 kitten／成貓 adult>-<動作>.png`，例：`kitten-eat.png` |

## 3. 角色外觀（兩個年齡都要遵守）

- **賓士貓（tuxedo）**：黑毛 `#383139`、亮部 `#554e5b`、描邊 `#1a0e17`；白色口鼻、胸口、四隻腳掌 `#fbf6f3`，陰影 `#cac9cb`
- **眼睛**：黃綠色 `#dcf84a`、深色瞳孔 `#1a0e17`、一個白色反光點
- **耳朵內側**粉紅 `#e98796`；**鼻子**淺粉 `#f7aeb6`；嘴巴 `#c33f63`
- **一條尾巴**，尾尖白色；**四條腿**；兩隻耳朵、兩隻眼睛
- **幼貓**：頭大身體小（頭約占身高 50%），高度 ≤ 24 像素（32 格中）
- **成貓**：頭身比例較長（頭約占身高 35–40%），高度 ≤ 28 像素，比幼貓高至少 3 像素
- 只用 [PALETTE.md](PALETTE.md) 的 24 個角色色；道具只能用色票中的道具色（碗、飼料、水、毛線）

## 4. ChatGPT 提示詞（直接複製）

### A. 幼貓角色設定圖

```
Pixel art character sheet of an original cute tuxedo kitten named "didi".
Square canvas, transparent background, a 4x4 grid of equal cells, no grid lines.
Each cell holds ONE 32x32-pixel sprite scaled up with nearest neighbour: every pixel is a crisp square of exactly the same size, all pixels aligned to one regular 32x32 grid per cell. No anti-aliasing, no gradients, no blur, no ground shadow, no text.
Cells 1-8: front sitting, 3/4 left sitting, 3/4 right sitting, side standing facing right, side walking facing right, lying down, sleeping curled, back view sitting. Cells 9-16 empty.
Feet of every pose on the same baseline, one pixel row above the bottom of its cell, centred horizontally, at least 3 empty pixels above the ears and 1 on each side.
Kitten proportions: big round head about half of the body height, small body, at most 24 pixels tall of the 32.
Colours only: outline #1a0e17 (1 pixel dark outline around the whole silhouette), black fur #383139, fur highlight #554e5b, white muzzle chest and paws #fbf6f3, white shadow #cac9cb, yellow-green eyes #dcf84a with #1a0e17 pupils and one white highlight, inner ears #e98796, nose #f7aeb6, mouth #c33f63.
Exactly four legs, one tail with a white tip, two ears, two eyes.
Mouth closed with a small calm smile (no open mouth in any of these poses). No collar, no line or band around the neck.
Cells 2 and 3 must be real three-quarter views (face turned, one eye partly hidden), not the front view with the tail moved.
```

### B. 成貓角色設定圖

把 A 的「Kitten proportions …」那一句換成：

```
Adult cat proportions: same individual as the attached kitten reference grown up, head about 35-40% of body height, longer body and legs, at most 28 pixels tall of the 32, never touching the cell edges.
```

並上傳已簽核的幼貓設定圖，加一句 `Keep the exact same markings, colours and face as the attached kitten reference.`

### C. 動作圖（每個動作一張）

上傳已簽核的該年齡設定圖，然後：

```
Using the attached didi <kitten|adult> character sheet as the exact reference (same markings, colours, proportions, outline), draw a pixel art animation sprite sheet for the action "<ACTION>".
Square canvas, transparent background, 4x4 grid of equal cells, no grid lines.
Cells 1-<N>: consecutive animation frames: <POSES>. Remaining cells empty.
Each frame is ONE 32x32-pixel sprite scaled up with nearest neighbour: crisp equal-size square pixels on one regular 32x32 grid per cell. No anti-aliasing, no gradients, no blur, no ground shadow, no text.
Feet on the same baseline one pixel row above the bottom of every cell; the body must not slide or change size between frames, only the moving parts change.
Use only the reference colours. Props allowed: <PROPS or "none">.
Mouth closed unless this action needs it open (eat, drink, yawn, angry hiss). No collar or neck line.
```

| 動作 `<ACTION>` | 格數 `<N>` | 姿勢 `<POSES>`（依序） | 道具 |
|---|---|---|---|
| idle | 8 | sit, blink half, blink closed, open, ear twitch, look left, look right, sit | none |
| walk | 8 | side walk cycle facing right: contact, down, pass, up × 2 legs | none |
| eat | 8 | look at bowl, lean down, bite, chew, chew, lick lips, lean up, happy | red bowl `#c33f63` with kibble `#a5652c` |
| drink | 8 | look at bowl, lean down, lap ×4, lean up, lick lips | bowl with water `#4b8ca6` `#99d0e3` |
| snack | 8 | notice, sniff, bite, chew ×2, happy ×2, sit | small treat `#d2983f` |
| play | 8 | crouch, wiggle, pounce, bat yarn, push, bat again, roll back, sit | yarn ball `#ef77a1` `#f7788e` |
| groom | 8 | lift paw, lick paw ×2, wipe face ×3, lower paw, sit | none |
| petting | 8 | look up, eyes close, lean in ×3, purr smile, open eyes, sit | none |
| sleep_prep | 8 | yawn, stretch front, circle ×2, lie down, curl, eyes close, sleep | none |
| sleep | 8 | curled sleeping breathing cycle (in/out) | none |
| wake | 8 | sleeping, ear twitch, eyes open, lift head, stretch, yawn, stand, sit | none |
| yawn | 8 | sit, mouth opens ×3, wide yawn, closes ×2, sit | none |
| tail_wag | 8 | sit, tail sways left → right → left (only tail moves) | none |
| curious | 8 | sit, head tilt left, ears forward, lean, sniff, head tilt right, blink, sit | none |
| happy | 8 | sit, smile, small hop ×2, land, eyes closed smile, sit ×2 | none |
| sad | 8 | sit, ears down, look down, sigh ×3, look up, sit (ears down) | none |
| angry | 8 | sit, ears back, arched back, hiss ×3, relax, sit | none |
| sick | 8 | lying, shiver ×4, weak look up, sigh, lying | none |
| toilet | 8 | walk in, sniff, dig, squat ×2, dig cover, step out, sit | litter box `#a19ea5` |

格數：每個動作先交 8 張不同姿勢；遊戲需要更長的時間軸時，由程式重複播放這 8 張，不必多畫。

## 5. 驗證條件

### ART-RAW｜原圖交件（工具自動檢查）

| ID | 條件 | 不通過時 |
|---|---|---|
| ART-RAW-01 | PNG、正方形（長寬差 ≤ 2%）、1000～2048px | 退件重生 |
| ART-RAW-02 | 背景可去除：透明，或四角是同一個純色（洋紅或白），去背後不留色塊 | 退件重生 |
| ART-RAW-03 | 有姿勢的格數 = 該動作規定格數（§4 表） | 退件重生 |
| ART-RAW-04 | 每格只有一個主體（最大連通區塊 ≥ 90% 不透明像素；道具動作可有 1 個道具塊） | 退件重生 |
| ART-RAW-05 | 角色不碰格子邊緣（以 32 格計）：上 ≥ 3 格、左右 ≥ 1 格、下 ≥ 1 格 | 退件重生 |
| ART-RAW-06 | 像素格整齊度：以「格子寬 ÷ 32」切格（自動找最佳起點），每格中心是單一顏色的比例 ≥ 75%；低於代表像素大小不固定，眼睛等細節轉換後會變形 | 退件重生 |

### ART-PX｜轉成遊戲格式後（工具自動檢查，沿用 PALETTE.md 規則）

工具會把每格取樣成 32×32（每格取中心區最多的顏色）、套色票、清雜點、統一描邊，輸出成遊戲格式（每格 128px，每個像素 4×4），再檢查：

| ID | 條件 |
|---|---|
| ART-PX-01 | 每個像素都是 24 個角色色之一；透明度只有 0／255 |
| ART-PX-02 | 轉換時被改掉的像素 ≤ 12%（太多代表原圖顏色或像素差太遠） |
| ART-PX-03 | 無孤立雜點、無 1 格缺口、實心區塊外框都是描邊色、身上無零星道具色（PX-03～06） |

### ART-ID｜角色一致性（工具自動檢查）

| ID | 條件 |
|---|---|
| ART-ID-01 | 每張的角色高度與該動作中位數差 ≤ 2 像素（躺、睡、生病、上廁所蹲下、設定圖除外） |
| ART-ID-02 | 腳底所在列：各張差 ≤ 1 像素（躺下類姿勢除外） |
| ART-ID-03 | 相鄰兩張身體中心水平移動 ≤ 1 像素（走路、設定圖除外） |
| ART-ID-04 | 材質比例：黑毛 ≥ 25%；看得到臉的張數白毛 5–40%（背面不要求）；至少一半張數有黃綠眼睛 ≥ 2 像素（睡覺類除外）；耳朵粉紅 ≥ 1 像素 |
| ART-ID-05 | 相鄰兩張至少 1.5% 像素不同（真的有動），且沒有完全相同的兩張（除非表中寫重複） |
| ART-ID-06 | 年齡差：成貓最高姿勢比幼貓高 ≥ 3 像素（兩個年齡的設定圖或 idle 都收圖後自動比對） |
| ART-ID-07 | 尺寸上限：幼貓 ≤ 24 像素高、成貓 ≤ 28 像素高 |

### ART-VIS｜目視驗收（Randall 簽核）

| ID | 條件 |
|---|---|
| ART-VIS-01 | 角色設定圖：幼貓、成貓是同一隻貓，花色、眼睛、耳朵符合 §3 |
| ART-VIS-02 | 構造正確：四條腿、一條尾巴、兩耳兩眼；沒有多出來的腳或斷掉的身體 |
| ART-VIS-03 | 動作看得出是在做什麼（對照 §4 表），節奏自然 |
| ART-VIS-04 | 手機實機 3 倍顯示時，邊緣乾淨、顏色不混、毛色不花 |
| ART-VIS-05 | 沒有文字、浮水印、地板陰影或奇怪的殘影 |
| ART-VIS-06 | 幼貓看起來比成貓年幼（頭比例較大），成長有感 |

**一張動作圖通過** = ART-RAW、ART-PX、ART-ID 全 PASS，加上 ART-VIS-02～05 簽核。
**換進遊戲** = 該年齡 19 個動作全部通過，且 ART-VIS-01、06 已簽核。

## 6. 收圖工具用法

```bash
python3 scripts/intake-chatgpt-sheet.py ~/Downloads/kitten-eat.png --stage kitten --action eat
python3 scripts/intake-chatgpt-sheet.py ~/Downloads/kitten-identity.png --stage kitten --action identity   # 角色設定圖
```

ChatGPT 原始輸出約 1254×1254，工具直接以「格子寬 ÷ 32」切格，不需先縮放。

輸出到 `output/art-intake/<stage>/`：

- `<action>.png`：遊戲格式（32×32 像素放大成每格 128px、8 欄），尚未接進遊戲；
- `<action>-review.png`：對照圖（左：原圖縮小；右：轉換後放大 3 倍，房間底色），給 ART-VIS 目視；
- `<action>-report.json`：每項 ART 檢查的結果與數值。

全部自動檢查通過時結束代碼為 0，否則為 1，並在畫面列出沒過的項目。

## 7. 紀錄

| 輪次 | 日期 | 檔案 | 結果 |
|---|---|---|---|
| 1 | 2026-11-06 | `public/assets/ChatGPT 圖像 2026年11月6日 下午05_33_14.png`（幼貓）、`…05_33_26.png`（成貓） | 退件。幼貓：像素格整齊度 69–76%（< 75%），高 26 格（上限 24）。成貓：高 31 格（上限 28）、貼格子邊緣、整齊度 62–70%。兩者：全姿勢張嘴、頸部灰線、前 3 格角度太像。量測：ChatGPT 自然畫成約 32×32（每格約 9.8px），因此規格改為 32×32。 |
