# MOMO 幼年專屬動作圖集 v1

素材：`public/assets/momo-kitten-actions-v1.png`，887×1774，RGBA 透明 PNG，4 欄×8 列，共 32 格。使用內建 imagegen 生成；原始參考為 `momo-kitten.png`。

| 列 | 格號（0 起算） | 動作 |
|---|---|---|
| 1 | 0–3 | 待機、眨眼 |
| 2 | 4–7 | 餵食、咀嚼、舔嘴 |
| 3 | 8–11 | 抬爪、舔爪、洗臉（清潔與梳洗共用） |
| 4 | 12–15 | 毛線球、伸爪、拍球、收爪 |
| 5 | 16–19 | 睡意、閉眼、低頭、坐姿入睡；反向播放喚醒 |
| 6 | 20–23 | 撫摸回應 |
| 7 | 24–27 | 雙爪伸展、伸懶腰 |
| 8 | 28–31 | 看窗外、左右觀察 |

幼年固定 0.69 比例；同一成長階段不按動作換圖或縮放。達永久好感 10 時切換成長中圖集，30 時成年。成年現有素材仍有睡眠及伸展共用影格的限制。

`frameRegistration` 校正原圖中約 1–2 個來源像素的格內偏差，以腳底為基準；不逐格縮放、不移動角色容器。姿勢中的耳朵、嘴巴、爪子輪廓自然會改變，並非整張角色縮放。

美術檢視已修正第 7 列第 2 格的額外落地腳掌。PNG 本身含各姿勢的少量手繪差異；容器尺寸測試不代表每格輪廓逐像素相同。

## 生成提示

Use case: stylized-concept. Production bitmap sprite sheet for an original virtual pet game.
Reference image is MOMO's kitten identity. Create ONE transparent PNG sprite atlas, EXACTLY 4 columns x 8 rows, 32 equally sized square cells, portrait 1:2 aspect ratio (ideally 1024x2048). NO margins between cells, no labels, no lettering, no grid lines, no background, no shadows.
Character: the SAME baby tuxedo kitten in every cell, large round head, tiny short chubby body, big yellow-green eyes, black/charcoal fur, white center face blaze, white muzzle and triangular bib, white paws, pink nose with a small dark mark, pink inner ears, single tail to its right with white tip. Use reference identity but clear baby proportions. Crisp low-resolution square PIXEL ART, flat consistent limited palette with clean hard edges. No vector style, no blurry shading.
CRITICAL animation invariants: each cell identical scale and camera; body center at local x=50%, ground baseline local y=88%. Every kitten occupies approximately x=22%-78%, y=18%-88%. Same head size, torso dimensions, fur markings and colors in all 32 cells. Torso and planted feet remain anchored; only eyes, mouth, head gestures and anatomically attached limbs animate. Do not shift entire character across frames. Exactly four limbs TOTAL. When ONE front paw is raised, show only THREE paws on the ground, never duplicate that paw on ground. Tail is ONE continuous dark curved tail with white tip, never a fifth leg. Props do not affect centering or scale.
Rows in exact order, left to right four successive animation frames:
1 idle / blink: open eyes, half closed eyes, closed eyes, eyes open again. Same seated silhouette.
2 feeding: small red food bowl on ground LEFT of kitten, notice bowl, mouth opens, chew mouth, lick mouth. Keep body/head scale and position matching row1.
3 grooming: raise right front paw (remove it from floor), lick raised paw, wipe cheek with same paw, lower paw. Exactly FOUR limbs.
4 yarn play: small pink yarn ball on ground LEFT, look at ball, reach left front paw toward ball with three planted paws, tap ball with same paw, return paw to floor. No duplicated paws.
5 settling to sleep: sleepy seated droopy eyes, eyes close and chin dips slightly, head resting down on chest while seated, peacefully asleep in same seated position. Do not lie flat or shrink; maintain torso size and ground anchor. Reverse these frames for wake.
6 response to petting: neutral seated, happy eyes and slight ear tilt, eyes closed smiling with relaxed ears, open eyes smiling. No hands or human parts.
7 stretch: seated neutral, both forepaws start lifting (only two rear paws remain grounded), both front paws extended upward alongside face with body anchored, forepaws lowered back. Four limbs total, no vertical body movement or scaling.
8 window watching: seated looking forward, eyes glance left, eyes glance right, eyes look forward. Head and torso stay in place.
Output only the production-ready transparent 4x8 sprite atlas. Consistency across frames is more important than large pose changes.

## 修正提示

Edit this transparent 4-column 8-row sprite sheet. Make ONLY this exact anatomy correction: in ROW 7 COLUMN 2 (counting from 1, the kitten raising both front paws halfway), there are THREE white paws on the ground plus TWO raised paws = incorrect five legs. REMOVE the central ground white paw and its extra leg, replacing it with the natural dark belly/transparent gap between the TWO remaining hind legs. Final pose must have exactly TWO raised front paws and TWO grounded hind paws. Preserve every other cell unchanged, all 32 cells, exact grid positions, identical canvas dimensions and transparent background, colors, character size and crisp pixel style. No other edits.

## 驗證

- `npm test`：22/22 通過，包含幼年專屬圖集完整性、所有互動映射與超界影格檢查。
- 真實瀏覽器逐一操作 8 種互動：feed/play/clean/rest/pet/groom/stretch/window，皆觀察到至少三格切換，素材來源、縮放、容器位置固定；睡眠停在 19 格，C 喚醒後回到 0 格。
- 本機畫面證據：`output/playwright/kitten-live.png`（不入版控）。
