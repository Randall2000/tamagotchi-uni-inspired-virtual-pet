# MOMO 動畫 v2

內建 imagegen 生成透明 PNG，使用既有角色作為參考，逐格檢視後修正成年伸爪時的重複落地腳掌。生成後只讀取像素量測定位，未用程式重畫角色。

素材：`public/assets/momo-kitten-64-v2.png`、`public/assets/momo-adult-64-v2.png`，各 1254×1254，8×8 格，各 64 姿勢。尺寸：幼年 0.69、成長中 0.78（成年圖集）、成年 0.88。

| 列 | 動作 | 時長 |
|---|---|---|
| 1 | 待機、尾巴擺動與眨眼 | 1.76 秒 |
| 2 | 正餐／點心，含咀嚼循環 | 4.5 秒 |
| 3 | 清潔／梳洗，含洗臉循環 | 4.6 秒 |
| 4 | 毛線球，含拍球循環 | 4.6 秒 |
| 5 | 坐姿入睡／喚醒／熟睡循環 | 入睡 5.2 秒、喚醒 3.42 秒 |
| 6 | 陪伴回應 | 4 秒 |
| 7 | 伸懶腰 | 4.4 秒 |
| 8 | 看窗外 | 4.4 秒 |

主要動作每組 8 個不同姿勢；循環僅重播咀嚼／拍球等子段。尾巴彎曲直接畫入影格。熟睡循環使用閉眼段，不重播打呵欠。C 取消先以末兩格收勢，360ms 後恢復選單，取消不結算照顧獎勵。

v0.7 起每個圖集只用一個固定定位點（待機姿勢），所有影格套用同一偏移。舊版逐格以鼻部中心定位，頭一轉就把整隻貓拉著走，造成動作時位移；改為固定定位後，相鄰影格整隻貓的位移 ≤1px（`node scripts/sprite-align.mjs` 量測，測試把關）。等比尺度只由成長階段設定。

## 幼貓生成提示

Expand the reference baby tuxedo kitten animation into a production-ready transparent PNG atlas. EXACTLY 8 columns by 8 rows = 64 distinct sprite frames on a SQUARE canvas. Each cell same square size. Reference is the exact kitten identity and pixel style to preserve. No titles, text, labels, borders, grid, background or shadows. Flat consistent crisp pixel palette. Cat remains same head/torso scale and color across every frame, centered at local x50%, feet anchored y90%, ear tips near y15%. Big round baby head, short small torso, black/charcoal fur, white muzzle/blaze/bib/paws, yellow-green eyes, pink nose and inner ears. ONE tail with white tip on right, EXACTLY FOUR limbs. If one paw lifts, remove that same paw from the ground; only three grounded paws. If both forepaws lift, only two hind paws on ground. Never five legs.
Make EIGHT genuine gradual frames per row: anticipation, 4 main gestures, response, recovery. Every consecutive frame MUST visibly differ in the tail curve/tip position as well as face or paws. Tail gently curls outward/up/in/down over eight frames, drawn as different pixels, NEVER rotating or moving the whole cat. No body translation/scaling. Minimum 10% transparent gap around each sprite and tails wholly inside cells.
Row1: idle, tail sweep, half-blink, close blink, opening eyes, ear twitch, glance, neutral.
Row2: red food bowl at left, notice, open mouth, bite, cheeks chew, second chew, tongue lick, satisfied neutral. No lifted paws in this row.
Row3: grooming single front paw rises, lick, lick, wipe cheek, wipe forehead, lower paw, relaxed. Four legs total.
Row4: pink yarn ball on left, notice, reach left forepaw, touch ball, push ball slightly, tap, retract paw, satisfied.
Row5: sleep seated at SAME height/body size: sleepy eyes, yawn mouth, finishing yawn, droopy eyelids, closed eyes, slight chin tilt, resting eyes, peacefully asleep. Tail gently settles. Preserve head scale; no lying down or shrink.
Row6: petting response: notice viewer, ears soften, smile, happy closed eyes, relaxed cheeks, reopen, smile, neutral. No human hands.
Row7: seated stretch: neutral, one forepaw lifts, second lifts, both forepaws reach up next to face, hold stretch, lower both, paws return, neutral. Exactly two grounded feet while both forepaws lift.
Row8: window observation: notice left, eyes left, ear twitch, forward, eyes right, curious ears, forward blink, neutral.
Keep all 64 cells aligned, face markings identical. Square 8x8 atlas, transparent.

## 成年生成提示

Expand the reference adult tuxedo cat animation into a production-ready transparent PNG atlas. EXACTLY 8 columns by 8 rows = 64 distinct sprite frames on a SQUARE canvas. Each cell same square size. Reference is the exact adult cat identity and pixel style to preserve. No titles, text, labels, borders, grid, background or shadows. Flat consistent crisp pixel palette. Cat remains same head/torso scale and color across every frame, centered at local x50%, feet anchored y90%, ear tips near y15%. Mature cat proportions matching the reference: medium head and taller slender seated torso, clearly adult, black/charcoal fur, white muzzle/blaze/bib/paws, yellow-green eyes, pink nose and inner ears. ONE tail with white tip on right, EXACTLY FOUR limbs. If one paw lifts, remove that same paw from the ground; only three grounded paws. If both forepaws lift, only two hind paws on ground. Never five legs.
Make EIGHT genuine gradual frames per row: anticipation, 4 main gestures, response, recovery. Every consecutive frame MUST visibly differ in the tail curve/tip position as well as face or paws. Tail gently curls outward/up/in/down over eight frames, drawn as different pixels, NEVER rotating or moving the whole cat. No body translation/scaling. Minimum 10% transparent gap around each sprite and tails wholly inside cells.
Row1: idle, tail sweep, half-blink, close blink, opening eyes, ear twitch, glance, neutral.
Row2: red food bowl at left, notice, open mouth, bite, cheeks chew, second chew, tongue lick, satisfied neutral. No lifted paws in this row.
Row3: grooming single front paw rises, lick, lick, wipe cheek, wipe forehead, lower paw, relaxed. Four legs total.
Row4: pink yarn ball on left, notice, reach left forepaw, touch ball, push ball slightly, tap, retract paw, satisfied.
Row5: sleep seated at SAME height/body size: sleepy eyes, yawn mouth, finishing yawn, droopy eyelids, closed eyes, slight chin tilt, resting eyes, peacefully asleep. Tail gently settles. Preserve head scale; no lying down or shrink.
Row6: petting response: notice viewer, ears soften, smile, happy closed eyes, relaxed cheeks, reopen, smile, neutral. No human hands.
Row7: seated stretch: neutral, one forepaw lifts, second lifts, both forepaws reach up next to face, hold stretch, lower both, paws return, neutral. Exactly two grounded feet while both forepaws lift.
Row8: window observation: notice left, eyes left, ear twitch, forward, eyes right, curious ears, forward blink, neutral.
Keep all 64 cells aligned, face markings identical. Square 8x8 atlas, transparent.

## 成年修正提示

Precisely correct limb anatomy in this 8x8 transparent sprite atlas; preserve all other pixels, canvas size, grid, character scale, markings, palette and tails. There are incorrect extra grounded paws in some raised-paw poses. ROW 4 COLUMNS 3,4,5,6,7 (yarn play): ONE forepaw reaches toward ball so show ONLY THREE ground paws, removing the duplicated ground paw under that lifted foreleg. ROW 7 COLUMNS 2,3,7 (stretch): ONE front paw lifted requires ONLY THREE ground paws. ROW 7 COLUMN 6 has TWO raised forepaws: show ONLY TWO grounded hind paws; remove both duplicated planted forepaws. ROW 7 COLUMNS 4 and 5 already have two raised + two grounded, preserve. Check row3 grooming too: ONE raised front paw must have max THREE remaining grounded paws. Exactly four total limbs per cat, tail is separate with white tip. No added limbs. Keep every sprite anchored, keep 64 sprites in EXACT 8x8 grid. Preserve true transparency. Do not redraw unrelated rows.
