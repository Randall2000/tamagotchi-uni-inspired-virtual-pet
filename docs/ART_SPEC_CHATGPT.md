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
Cells 1-8: front sitting, 3/4 left sitting, 3/4 right sitting, side standing facing right, side walking facing right, lying down, sleeping curled, back view sitting.
Cells 9-16 (expression row, each a different whole-body attitude, not only a different mouth): content (eyes closed in happy arcs, tail curled around paws), joyful (grin, one paw raised, tail high), surprised (ears straight up, round eyes, body leaning back), sad (ears drooping, head low, shoulders slumped), angry (ears flat, back arched, fur puffed, tail bristled), sleepy (half-closed eyes, head nodding, body slouched), curious (head tilted, one ear forward, leaning in), playful (front end down, rear up, tail flicking).
Feet of every pose on the same baseline, one pixel row above the bottom of its cell, centred horizontally, at least 3 empty pixels above the ears and 1 on each side.
Kitten proportions: big round head about half of the body height, small body, at most 24 pixels tall of the 32.
Colours only: outline #1a0e17 (1 pixel dark outline around the whole silhouette), black fur #383139, fur highlight #554e5b, white muzzle chest and paws #fbf6f3, white shadow #cac9cb, yellow-green eyes #dcf84a with #1a0e17 pupils and one white highlight, inner ears #e98796, nose #f7aeb6, mouth #c33f63.
Exactly four legs, one tail with a white tip, two ears, two eyes.
Mouth closed with a small calm smile in cells 1-8; in cells 9-16 the mouth follows the expression, but the eyes, ears, head angle, body posture and tail must change too. No collar, no line or band around the neck.
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
Make it lively, like a hand-animated game character:
- the whole body acts: anticipation before the main move, a clear key pose, then follow-through and settle;
- squash and stretch the body (crouch lower, stretch longer, land squashed);
- ears and tail move in EVERY frame; the head turns and tilts; paws lift and land;
- eyes act too (squint, blink, widen, close happily);
- never make a frame that differs from the previous one only in the mouth;
- mouth open only where the action needs it (biting, lapping, gobbling, yawning, hissing, laughing, coughing);
- no motion lines, sparkles, sweat drops, 'z' letters or other effect marks: the cat and its prop only.
No collar or neck line.
```

| 動作 `<ACTION>` | 格數 `<N>` | 姿勢 `<POSES>`（依序，要有預備→主動作→收尾） | 道具 |
|---|---|---|---|
| idle | 8 | sit breathing in (chest up), breathing out, slow happy blink, ear flick left, head turns left looking around, head turns right, tail curls around paws, settle | none |
| walk | 8 | side walk cycle facing right with head bob and swaying tail: contact, down, passing, up, then the other legs contact, down, passing, up | none |
| eat | 8 | ears perk at the bowl, trot one step, crouch to the bowl, head dips and bites, chew with puffed cheeks and tail flick, second bite, lick lips with eyes closed, sit up satisfied | red bowl `#c33f63` with kibble `#a5652c` |
| drink | 8 | walk up to the bowl, crouch low, tongue laps (head down), lap (head up), lap again, shake whiskers, lick lips, sit up | bowl with water `#4b8ca6` `#99d0e3` |
| snack | 8 | nose forward sniffing, paw taps the treat, gobble with head thrust forward, chew with eyes closed, happy wiggle of the body, tail straight up proud, lick paw, sit | small treat `#d2983f` |
| play | 8 | spots the yarn (ears forward, big eyes), crouch low with rear wiggling, leap with body fully stretched in the air, pounce landing squashed, swat with a paw raised high, roll onto the back hugging the yarn, kick with hind paws, pop up proud | yarn ball `#ef77a1` `#f7788e` |
| groom | 8 | raise a paw, lick the paw, wipe the paw over ear and face, twist to lick the shoulder, scratch the ear with a hind leg, shake the head (ears flapping), smooth the chest, sit tidy | none |
| petting | 8 | look up expectantly, lean the head up, eyes close in bliss, rub the cheek sideways, knead with front paws, flop onto the side, purr with tail curling, sit content | none |
| sleep_prep | 8 | big yawn, front-leg stretch with rear up, knead the floor, turn in a circle, turn again, flop down, curl with tail over the nose, eyes close | none |
| sleep | 8 | curled sleeping: body rises (breath in), falls (breath out), ear twitches, rises, falls, tail tip flicks, paw twitches dreaming, falls | none |
| wake | 8 | curled asleep, ear twitch, sleepy eyes open, head lifts, front-leg stretch with rear up, back stretch, whole-body shake, sit alert | none |
| yawn | 8 | eyes squeeze, head tilts back, mouth opens wide with curled tongue and ears flattening, front legs stretch forward, body sinks, mouth closes, shake the head, content blink | none |
| tail_wag | 8 | tail swishes left with the body leaning right, centre, swish right leaning left, ears perk, head tilt, swish left, swish right, settle | none |
| curious | 8 | ears perk forward, head tilts left, lean forward sniffing, one paw raised stepping forward, head tilts right, whiskers forward, sit back, blink | none |
| happy | 8 | eyes close in a smile, crouch, hop with all paws off the ground, land squashed, half spin, tail high and quivering, little bounce, sit beaming | none |
| sad | 8 | ears droop, head lowers, lie down slowly, chin on paws, sigh with the body sinking, look up with big eyes, tail curls in, ears stay down | none |
| angry | 8 | ears flatten, back arches high, fur puffs (bigger silhouette), tail bristles, hiss, side-step stiff-legged, puffed stare, calm down | none |
| sick | 8 | lying flat, shiver (body small shake), weak head lift, cough (body jerks), droopy eyes, curl up, sigh, lie still | none |
| toilet | 8 | walk into the box, sniff, dig with front paws (sand flicks), turn around, squat, look around, kick sand back, step out proud | litter box `#a19ea5` |

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
| ART-ID-01 | **安靜動作**（idle、walk、tail_wag、curious、sad、sick、yawn、sleep）每張高度與中位數差 ≤ 2 像素；大動作不檢查（會蹲、跳、伸展），躺臥類與設定圖也不檢查 |
| ART-ID-02 | 安靜動作的腳底所在列：各張差 ≤ 1 像素（大動作、躺臥類除外） |
| ART-ID-03 | 安靜動作的相鄰兩張身體中心水平移動 ≤ 1 像素（走路、大動作、設定圖除外） |
| ART-ID-04 | 材質比例：黑毛 ≥ 25%；看得到臉的張數白毛 5–40%（背面不要求）；至少一半張數有黃綠眼睛 ≥ 2 像素（睡覺類除外）；耳朵粉紅 ≥ 1 像素 |
| ART-ID-05 | 相鄰兩張至少 1.5% 像素不同（真的有動），且沒有完全相同的兩張（除非表中寫重複） |
| ART-ID-06 | 年齡差：成貓最高姿勢比幼貓高 ≥ 3 像素（兩個年齡的設定圖或 idle 都收圖後自動比對） |
| ART-ID-07 | 尺寸上限：幼貓 ≤ 24 像素高、成貓 ≤ 28 像素高 |

### ART-MOVE｜動作生動度（工具自動檢查，動作圖適用；設定圖不檢查）

| ID | 條件 | 為什麼 |
|---|---|---|
| ART-MOVE-01 | 相鄰兩張之間的變化不能只集中在臉部：變化範圍高度 < 角色高度 30% 的「只動臉」轉換，整張最多 2 次 | 不要只有張嘴 |
| ART-MOVE-02 | 身體輪廓真的有變：**大動作**（eat、drink、snack、play、groom、petting、sleep_prep、wake、happy、angry、toilet）至少 2 張與第 1 張的輪廓重疊度（IoU）≤ 0.85；**安靜動作**（idle、walk、tail_wag、curious、sad、sick、yawn、sleep）至少 1 張 ≤ 0.92。門檻為暫定，第一批正式動作圖量測後校正 | 不是同一個剪影只換表情（現行遊戲待機圖最低 0.95，會被擋下） |
| ART-MOVE-03 | 頭、身體、腳三段都有動：把角色高度分成上中下三段，整張動作中每一段至少有 4 個像素變過（sleep 只要求 2 段） | 耳朵、尾巴、腳要跟著動 |

### ART-VIS｜目視驗收（Randall 簽核）

| ID | 條件 |
|---|---|
| ART-VIS-01 | 角色設定圖：幼貓、成貓是同一隻貓，花色、眼睛、耳朵符合 §3 |
| ART-VIS-02 | 構造正確：四條腿、一條尾巴、兩耳兩眼；沒有多出來的腳或斷掉的身體 |
| ART-VIS-03 | 動作看得出是在做什麼（對照 §4 表），節奏自然；有預備、主動作、收尾，身體有彈性（壓扁、拉長） |
| ART-VIS-07 | **生動**：不是只有張嘴；耳朵、尾巴、頭、腳都有參與，表情跟著動作變（瞇眼、眨眼、睜大） |
| ART-VIS-04 | 手機實機 3 倍顯示時，邊緣乾淨、顏色不混、毛色不花 |
| ART-VIS-05 | 沒有文字、浮水印、地板陰影或奇怪的殘影 |
| ART-VIS-06 | 幼貓看起來比成貓年幼（頭比例較大），成長有感 |

**一張動作圖通過** = ART-RAW、ART-PX、ART-ID、ART-MOVE 全 PASS，加上 ART-VIS-02～05、07 簽核。
**換進遊戲** = 該年齡 19 個動作全部通過，且 ART-VIS-01、06 已簽核。

## 6. 收圖工具用法

```bash
python3 scripts/intake-chatgpt-sheet.py ~/Downloads/kitten-eat.png --stage kitten --action eat
python3 scripts/intake-chatgpt-sheet.py ~/Downloads/kitten-identity.png --stage kitten --action identity   # 角色設定圖
```

ChatGPT 原始輸出約 1254×1254，工具直接以「格子寬 ÷ 32」切格，不需先縮放。

`--out <資料夾>`：實驗或測試用，輸出到別的資料夾，不影響共用的 `output/art-intake/`（成貓／幼貓比對會讀那裡的報告）。

輸出到 `output/art-intake/<stage>/`：

- `<action>.png`：遊戲格式（32×32 像素放大成每格 128px、8 欄），尚未接進遊戲；
- `<action>-review.png`：對照圖（左：原圖縮小；右：轉換後放大 3 倍，房間底色），給 ART-VIS 目視；
- `<action>-report.json`：每項 ART 檢查的結果與數值。

全部自動檢查通過時結束代碼為 0，否則為 1，並在畫面列出沒過的項目。

## 7. 紀錄

| 輪次 | 日期 | 檔案 | 結果 |
|---|---|---|---|
| 1 | 2026-11-06 | `public/assets/ChatGPT 圖像 2026年11月6日 下午05_33_14.png`（幼貓）、`…05_33_26.png`（成貓） | 退件。幼貓：像素格整齊度 69–76%（< 75%），高 26 格（上限 24）。成貓：高 31 格（上限 28）、貼格子邊緣、整齊度 62–70%。兩者：全姿勢張嘴、頸部灰線、前 3 格角度太像。量測：ChatGPT 自然畫成約 32×32（每格約 9.8px），因此規格改為 32×32。 |
| 回饋 | 2026-11-06 | — | Randall：「不要只有張嘴，動作不生動」→ 設定圖加表情排（9–16 格）、動作提示詞加生動原則、19 個動作姿勢改寫、新增 ART-MOVE-01～03 與 ART-VIS-07 |
| 2 | 2026-11-06 | `public/assets/didi-generated/raw/` 38 張動作圖（幼貓 idle 用 v4，其餘 v1） | 退件，原圖直接檢查 0／38。**全部**：像素格不整齊（ART-RAW-06，整齊度幼貓 54–68%、成貓 47–66%，門檻 75%）。**幼貓**：15 張太高（多數 26 格、最高 28，上限 24）；只差格子＋高度的有 angry、drink、happy、sleep、snack、wake、walk；idle 8 格幾乎一樣（ART-MOVE-01）。**成貓**：17 張貼到格子邊（ART-RAW-05）；8 張多畫了動作線等記號或排版不對（ART-RAW-03／04）；只差格子的是 eat。**生動度**：play、petting 等大動作明顯進步。另一個工具先把原圖轉成標準格再檢查，得 3／38（幼貓 idle、sleep，成貓 idle）。**規則修正**：大動作本來就會蹲、跳、移動，ART-ID-01～03 改成只檢查安靜動作；提示詞加「不要畫動作線、閃光、汗滴、z 字」。 |
