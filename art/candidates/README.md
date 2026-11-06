# didi 角色設定圖候選 v1

依照 `docs/ART_SPEC_CHATGPT.md` 的設定圖 A、B 提示，使用 ChatGPT 生圖製作。這兩張是外觀討論稿，**尚未接入遊戲**。

| 圖 | 檔案 | 生圖原始尺寸 | 驗收 |
|---|---|---:|---|
| 幼貓，8 個視角／姿勢 | `kitten-character-v1.png` | 1254×1254 | ART-RAW-01 FAIL；ART-VIS 待簽核 |
| 成貓，與幼貓同花色 | `adult-character-v1.png` | 1261×1247 | ART-RAW-01 FAIL；ART-VIS 待簽核 |

兩張均含大量半透明邊緣（幼貓 370,563、成貓 368,005 像素），不符合最終硬像素交件要求。使用者已於後續對話確認兩張圖的**角色外觀**。原圖已複製到 `public/assets/didi-generated/character/` 供動作圖參考；此確認不代表原始檔通過技術收圖。

38 張幼貓／成貓動作原圖已依核准外觀生成，詳見 `art/action-intake-summary.json`。目前只有 3 張轉檔後通過所有自動檢查，其餘仍需修圖。未達自動及目視條件前不替換正式遊戲素材。
