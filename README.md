# 塔麻過幾 · Uni-inspired virtual pet MVP

原創全彩電子寵物 MVP。互動基準參考 Tamagotchi Uni 的照顧節奏與三鍵操作感；Catode32 僅作開源技術研究方向，不複製其品牌、素材或程式碼。

公開 demo：<https://tamagotchi-uni-inspired-virtual-pet.vercel.app>

## 已完成

- 240×240 全彩畫面語言：沙色、珊瑚色、薄荷綠與像素玩具感。
- 電子雞 A / B / C 三鍵選單：A 瀏覽，B 確認，C 返回；可餵食、玩耍、休息、摸摸 MOMO、看看窗外。房間是像素場景背景，不用點擊場景操作。
- 五種像素角色狀態：待機、進食、玩耍、睡覺、開心互動；床、食碗、毛線球與窗邊互動由按鍵選單觸發。
- 佔位角色 MOMO、心情狀態、飢餓／愉悅數值、金幣與即時時鐘。
- localStorage 存檔；重新整理後保留狀態，離開一段時間會自然衰減。
- Node 內建測試與 GitHub Actions CI artifact，無需安裝第三方套件。
- 可在 Apple Silicon Mac 直接用 Node 20 執行。

## 本版未完成

- 尚未接後端帳號、雲端同步、資料庫或多人社交。
- 角色仍是 CSS 佔位圖形，尚未替換為最終原創美術資產。
- 尚未加入聲音、進化分支、商店、通知與原生 macOS 打包。

## ESP32 韌體基礎

`firmware/` 已建立 Rust 共用遊戲核心與硬體介面骨架，對照 PRD v1.1 的 Core/Ports 分層。這是韌體開發起點，尚非可燒錄映像；板卡、螢幕、GPIO、存檔格式、Mac 模擬器與實機適配仍待完成。細節見 [`firmware/README.md`](firmware/README.md)。

## 本機測試

```bash
npm test
npm run serve
```

開啟 `http://localhost:4173`。此專案不依賴原生 CPU 架構，Apple Silicon Mac 使用 Node 20 即可。

## PRD 來源註記

本次工作區未找到使用者指定的 `/mnt/data/virtual-pet-prd/PRD_Uni_Inspired_Virtual_Pet_v1.0.md`，因此本 README 僅根據交接訊息內明確列出的 MVP 條件實作；取得原檔後應再逐條對照驗收條件。
