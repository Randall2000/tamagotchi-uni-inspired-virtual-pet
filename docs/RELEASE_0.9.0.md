# v0.9.0 — 房間裡的日常散步

2026-11-06。接續 v0.8.3（8cb2d11），依使用者新需求允許「平常走來走去」；照顧時固定位置、成長才改縮放的規則保留。

## 行為
- 休息 6–12 秒後，在散步與原地小動作之間交替；原地仍會眨眼、搖尾、舔爪、張望、伸展。
- 幼貓與成貓各有 8 格專用走路素材（4×4 圖集，共 16 格），四肢交替與尾巴姿勢逐格變化。朝右原圖、朝左水平翻轉。
- 每格 140ms，水平速度 12 房間像素／秒，活動中心限制在原點 ±32px；每次走一小段再停下。
- A/B/C 中斷散步，保留當下位置。餐食等照顧開始／結束／取消都不把角色重設回中央。只有重新開始新遊戲會回中央。
- 睡眠、選單、成長慶祝、隱藏分頁不啟動散步。隱藏分頁會取消當前散步；回來重新排程。
- 系統「減少動態」偏好停用散步，保留原地逐格動作。
- 不以散步增加關係度，不增加氣泡；縮放只依幼年 .69、成長中 .78、成年 .88。站走與坐姿的輪廓會自然不同，沒有播放縮放動畫。
- 圖片載入失敗時保留原地待機動作，三鍵仍可操作。
- 本機伺服器與 CI 可下載壓縮檔一併包含新模組 roaming.js。

## 本次驗收
| 項目 | 結果與證據 |
|---|---|
| 自動測試 | 43/43 PASS；包含既有照顧圖集定位／配色、路線邊界、每齡八格不同走路圖、三鍵、成長與存檔測試 |
| 三階段散步 | PASS；幼年／成長中／成年實際瀏覽器從 0px 走到 -7px，影格持續切換，縮放矩陣不變 |
| 餐食中斷、取消 | PASS；按下 B 的同一事件記錄位置 -8px，餐食與 C 取消後仍為 -8px；餐食影格正常播放 |
| 最終素材再驗 | PASS；幼年／成年走到 -7px，餐食開始與播放後仍為 -7px；更新後圖片實際截圖確認 |
| 睡眠、選單 | PASS；瀏覽器模擬時鐘各觀察 25 秒，均無水平位移 |
| 減少動態 | PASS；瀏覽器 emulateMedia 後觀察 30 秒，無散步位移 |
| 隱藏／恢復 | PASS；模擬 visibilitychange，隱藏 20 秒維持 -7px，恢復後走到 -20px；關係度保持 0 |
| 手機 | PASS；375×812 畫面無橫向溢出，角色元素位於房間左右邊界內 |
| 既有完整動作錄影 | 本次未重新完成整份既有驗收的 WEB-ANIM-05，不宣稱全產品已全部驗收 |

瀏覽器截圖（工作區產物）：output/playwright/walk-final-kitten.png、walk-final-adult.png、walk-phone.png。
成長中與成年共用成年素材。新增路線測試枚舉每個整數起點與四種隨機值，確認不越界、每個 16ms 取樣最多移動 1 房間像素。

## 圖片與提示詞
使用內建 ChatGPT imagegen，沒有使用 CLI 或程式重繪角色。
最終檔案：[didi-walk-v1.png](../public/assets/didi-walk-v1.png)，1254×1254 RGBA。
走路素材每齡使用同一固定定位，沒有逐格校正或縮放。首次輸出後，針對幼貓頭身比做一次修正；保留原有照顧圖集。

初始提示詞：
```text
Create a pixel-art walking sprite atlas for the EXACT tuxedo cat in the two attached reference sheets. Image1 kitten identity/color reference, image2 adult identity reference. NEW asset, not replacement for sitting atlases. Output square 1024x1024 true transparent PNG, precisely 4 columns by 4 rows of equal 256x256 cells, no margins between cells, NO text, NO grid. First TWO rows are an 8-frame seamless walk cycle for the KITTEN, last TWO rows an 8-frame walk cycle for the ADULT. All cats face RIGHT in three-quarter side view, head recognizable as same cat. Four legs TOTAL, alternating front/hind footfalls, lifted foot replaces planted foot; NEVER five legs. White feet, white bib and muzzle, white tail tip, pink ears/nose, bright yellow-green eyes, cool charcoal black fur exactly reference. No props or shadows. Same head size within each age, same scale in all frames, no bobbing body, squash or stretch. Every cell has fixed body center x128, feet baseline y240; adult ears top y35, kitten ears top y35 (runtime handles smaller kitten scale). Cat width including tail <=210px, keep equal head/body proportions to references; kitten round big head, adult taller slim torso. Clearly change leg silhouettes and tail curl in every frame. Torso/head registered absolutely steady throughout cycle; only legs/tail move. Frame order contact, down, passing, lift, opposite contact, down, passing, lift. Crisp low-resolution pixel edges, limited palette, no antialias/gradient/vector style. Must look like SAME black and white cat as references.
```

最終修正提示詞：
```text
Precise edit of FIRST reference image, the 4x4 WALK atlas, 1254x1254 transparent PNG. Only improve TOP TWO ROWS (8 kitten walk frames). BOTTOM TWO adult rows preserve unchanged. Kitten walking poses currently drawn too small and narrow-headed relative to second reference kitten identity. Increase the KITTEN HEAD WIDTH by approximately 20%, preserve round big cheeked adorable kitten face and same fur/eye palette. In EACH 313.5 square kitten cell, kitten ear tips should reach y35, feet remain planted at y290, centered torso x156.5, all pixels contained x30..290. Thus kitten total height about255px, matching its original sitting atlas proportion at runtime. Bigger round head, short plump body, four short legs with alternating footfalls from existing walk cycle, keep distinct tail waves. Keep same head size/body height/anchor across all eight kitten frames. Kitten walks on four legs, not upright human gait. Exactly FOUR legs anatomically, not five. Do not move adult frames. Maintain all 16 cells, layout, face identity, palette, crisp pixel art and true alpha background. No labels/shadows/props. Output complete corrected 4x4 atlas only.
```

