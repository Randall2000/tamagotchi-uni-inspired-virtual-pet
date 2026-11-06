# v0.10.2｜幼貓眼睛定位與 Pixel Art 硬邊修復

日期：2026-11-06。

## 問題與根因

舊版幼貓母圖 `momo-kitten-64-v2.png` 以 1254×1254 切分 8×8，單格為 156.75 px，存在非整數格線取樣差異。雖然 Alpha 已是二值透明，RGB 仍超過 9 萬個微小差異色，會產生髒邊及材質不一致；部分睜眼姿勢的眼框和瞳孔位置不一致。

## 修復方式

1. 從固定角色來源重新製作 **`momo-kitten-64-v3.png`**，8×8 × 128 px，總圖 1024×1024 RGBA。
2. 每格以 64×64 邏輯像素取樣，再以最近鄰放大 2× 至 128×128。所有 2×2 像素色彩完全相同；不使用雙線性、雙三次或插值模糊。
3. 使用固定 32 色上限的幼貓色盤；以原圖深灰黑毛色、白胸、粉耳、黃綠色眼睛作為材質依據。
4. 以第 0 格為眼眶基準，把「睜眼」的雙眼框固定在同一座標。向左/右看的姿勢僅允許**瞳孔在固定眼眶內移動**；半閉/閉眼保留對應表情，不強制睜眼。
5. 原始 `momo-kitten.png`、`momo-kitten-actions-v1.png`、舊版 v2 圖集和成年貓全部保留，不覆蓋。
6. 重建 `momo-motions-preview/kitten/` 19 組對應逐格動作。原本的成年貓 19 組圖集原封不動。
7. Web 的非觸控顯示與 A/B/C 操作不變，仍使用 `image-rendering:pixelated` 且禁止用整張角色圖左右搖晃偽裝動畫。

## 驗收條件與實際結果

| 驗收項目 | 門檻 | 實測 | 結果 |
| --- | --- | --- | --- |
| 格線/尺寸 | 8×8，每格 128×128；幼貓動作表每格 128×128 | 新母圖 1024×1024，19 組動作 PNG 皆正確 | PASS |
| 色盤一致 | 所有可見像素不超過 32 種顏色 | 母圖 31 色；各動作 21–30 色 | PASS |
| 透明乾淨 | Alpha 僅 0 或 255；透明像素 RGB 必須全零 | 新母圖及 19 組動作均符合 | PASS |
| Pixel 硬邊 | 每 2×2 實際像素完全一致 | 母圖＋19 組動作全檢 | PASS |
| 幼貓眼框定位 | 每個睜眼影格的黃綠色眼眶位置與第 0 格相同 | 40 個睜眼影格位置一致；閉眼影格未誤開眼 | PASS |
| 姿勢外形 | 64 個影格相對 v2 原始姿勢的 Alpha 輪廓 IoU ≥ 0.98 | 最小 IoU 1.000、平均 1.000 | PASS |
| 落地錨點 | 腳底在所有姿勢的差異不超過 1 個 64px 邏輯像素 | 64 格腳底 y=60–61 | PASS |
| 顏色偏移 | 除眼部重定位區外，Lab8 色差平均≤12、95 百分位≤25 | 平均 6.02；P95 16.97 | PASS |
| 實際 Chrome | 新幼貓圖集可載入、照顧動作播放、C 可返回、螢幕不可點擊 | Mac Chrome 測試通過，無 JS/HTTP 錯誤 | PASS |
| 成年貓保留 | 不修改成年角色的原始與動作素材 | Git 差異中無成年貓 PNG 變動 | PASS |

驗收程式：`npm test`、`python3 scripts/qa-kitten-source-identity.py`、`python3 scripts/qa-kitten-browser.py`、`python3 scripts/qa-momo-motions.py`。

使用相同來源重建兩次，母圖與待機圖集 SHA-256 完全一致，**重建具可重現性（PASS）**。

## 限制

這是**固定角色母版的像素重建**，不是任意 AI 重畫的全新角色。外輪廓保持一致，眼部坐標與色盤經程式驗證；但 19 組動作目前仍是從原始姿勢重組的預覽素材，有些動作重複使用相同姿勢。所有眼神與肢體動態的美術逐格主觀驗收尚未由使用者簽核，不能宣稱正式動畫完美完成。

重建指令：

```bash
python3 scripts/remaster_kitten_pixels.py
python3 scripts/build-momo-action-preview.py --stage kitten
npm test
python3 scripts/qa-kitten-source-identity.py
python3 scripts/qa-kitten-browser.py
```

Python 素材重建需 Pillow、NumPy、OpenCV；Web 預覽和 Node 測試不需額外安裝 Node 套件。
