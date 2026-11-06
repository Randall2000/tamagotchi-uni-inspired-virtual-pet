# v0.8.3 — 以目前幼年配色統一成長中與成年

使用者選擇「目前幼年配色」。基於 Claude 已更新的 v0.8.2（ea6a089），保留單鍵照顧、單層選單、自動醒來、分鍵防連按、30/80 成長門檻、只顯示電子機與手機放大。

## 修改
- 幼年素材 momo-kitten-64-v2.png 不變。
- 成年與成長中改用 momo-adult-64-v3.png；保留 8×8、64 格、1254×1254 與透明背景。
- 成年毛色改為接近幼年的冷深灰、亮白毛、黃綠眼睛與粉紅耳鼻。
- 固定圖集定位、成長尺寸與所有互動程式不變。
- 新增配色回歸測試；定位測試使用實際上線的 v3 圖集。

## 本次驗證（2026-11-06）
- npm test：41/41 通過，包含各動作與待機圖集位置變動不超過 1 個素材像素。
- 本機瀏覽器：幼年、成長中、成年分別以 B 啟動餐食；3 秒內影格持續切換；每次取樣的角色元素位置、寬高、圖集來源不變；C 可取消；無頁面錯誤。
- 三個階段截圖：output/playwright/palette-{kitten,growing,adult}.png（本機驗證產物）。
- 此為配色範圍回歸，沒有把整份既有手動驗收重新宣告通過。原驗收文件 WEB-ANIM-05 的完整視覺錄影仍待完成。
- 生圖並非逐像素保證不變；以上定位測試與配色測試為本次可量測證據。配色使用不透明像素的代表中位數，並非每個高光像素完全相同。

| 代表色 RGB | 幼年 | 舊成年 | 新成年 |
|---|---|---|---|
| 深色毛 | 55,46,54 | 62,56,56 | 51,43,49 |
| 白毛 | 248,247,248 | 231,220,219 | 243,239,240 |
| 眼睛 | 211,222,78 | 168,164,85 | 197,202,75 |
| 粉紅 | 245,141,139 | 218,128,128 | 242,136,141 |

## 圖片編修來源與提示詞
透過內建 ChatGPT imagegen 編修成年圖集，以目前幼年圖集為配色參考。沒有使用程式繪製替代角色。
最終圖：[momo-adult-64-v3.png](../public/assets/momo-adult-64-v3.png)

第一次提示詞：
```text
Precise color-only edit of image 1, the ADULT cat 8x8 sprite atlas. Image 2 is the KITTEN palette reference only.
The user explicitly selects the CURRENT KITTEN COLORS. Recolor the ADULT atlas to match kitten's SAME exact fur, muzzle, eye, ear and nose palette. Adult currently looks washed out warm brown/gray. Its fur must become the kitten's deep cool charcoal with subtle dark violet gray, the SAME warm near-white muzzle/chest/paws, SAME vivid yellow-green eyes, SAME rosy pink ears/nose. Use corresponding sampled colors from kitten reference; do not make a different color palette or desaturate.
Critical: image1 adult body proportions, outlines, four-limb anatomy, tail, individual poses, every pixel's spatial placement, all 64 frames and 8x8 layout MUST remain identical. This is ONLY color correction, NOT redrawing. Keep canvas exactly 1254x1254, no resizing/cropping/repositioning. Keep original alpha and true transparency. Do not edit the kitten reference. Don't change food bowl or yarn colors. No new props/text/background/grid/labels. Output only recolored ADULT atlas with exactly the original adult geometry and matching kitten palette.
```

第二次修色提示詞：
```text
Color-only refinement of the ADULT 8x8 atlas in image 1. Image 2 is the exact KITTEN color reference. Preserve all adult shapes/poses/anatomy/positions, alpha, 1254x1254 canvas and grid EXACTLY. Do not redraw or resize. Keep the deep cool charcoal fur just as image1. Across ALL 64 frames change ONLY these color areas: eye irises need the bright lime YELLOW-GREEN of reference (target RGB 211,222,78 / #D3DE4E, green channel visibly higher than red, not muted gold). The white muzzle, bib, paws and tail-tip should be bright neutral near-white matching kitten (target RGB 248,247,248 / #F8F7F8; not beige/gray/pink). Pink nose and inner ears target same kitten pink (RGB245,141,139). Keep black pupils black. No glowing eyes. Keep food bowls and yarn props unchanged. Maintain true transparent background. Output only adult atlas with matched reference colors.
```

