# 塔麻過幾 · Uni-inspired virtual pet MVP

原創全彩電子寵物 MVP。互動基準參考 Tamagotchi Uni 的照顧節奏與三鍵操作感；Catode32 僅作開源技術研究方向，不複製其品牌、素材或程式碼。

## 已完成

- 240×240 全彩畫面語言：沙色、珊瑚色、薄荷綠與像素玩具感。
- A / B / C 三鍵：餵食、玩耍、休息；滑鼠與鍵盤皆可操作。
- 佔位角色 MOMO、心情狀態、飢餓／愉悅數值、金幣與即時時鐘。
- localStorage 存檔；重新整理後保留狀態，離開一段時間會自然衰減。
- Node 內建測試與 GitHub Actions CI artifact，無需安裝第三方套件。
- 可在 Apple Silicon Mac 直接用 Node 20 執行。

## 本版未完成

- 尚未接後端帳號、雲端同步、資料庫或多人社交。
- 角色仍是 CSS 佔位圖形，尚未替換為最終原創美術資產。
- 尚未加入聲音、進化分支、商店、通知與原生 macOS 打包。

## 本機測試

```bash
npm test
npm run serve
```

開啟 `http://localhost:4173`。此專案不依賴原生 CPU 架構，Apple Silicon Mac 使用 Node 20 即可。

## PRD 來源註記

本次工作區未找到使用者指定的 `/mnt/data/virtual-pet-prd/PRD_Uni_Inspired_Virtual_Pet_v1.0.md`，因此本 README 僅根據交接訊息內明確列出的 MVP 條件實作；取得原檔後應再逐條對照驗收條件。
