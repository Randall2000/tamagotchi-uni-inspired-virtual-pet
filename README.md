# 塔麻過幾 · Uni-inspired virtual pet MVP

原創全彩電子寵物 MVP。互動基準參考 Tamagotchi Uni 的照顧節奏與三鍵操作感；Catode32 僅作開源技術研究方向，不複製其品牌、素材或程式碼。

公開 demo：<https://tamagotchi-uni-inspired-virtual-pet.vercel.app>

## 網頁版 v0.2

- 240×240 螢幕與三顆圓形按鍵。A 輪選、B 確認、C 逐層返回；鍵盤支援 A/B/C 與 J/K/L。
- 螢幕內主選單：照顧、互動、狀態、設定。重設需確認，預設保留進度。
- 九種像素姿勢：待機、進食、玩耍、睡覺、開心、洗臉、伸懶腰、觀望、閉眼。後四種由新生成的透明圖集呈現。
- 移除整張角色的浮動、跳躍與縮放；待機定時切換姿勢。這是姿勢切換，尚非每個動作都有連續逐格動畫。
- 照顧期間阻擋重複確認；C 返回待機，睡覺時 B/C 喚醒。
- 瀏覽器本機存檔與狀態頁（飽足、心情、精力、金幣）。洗臉、伸懶腰、觀望目前是視覺互動。
- CI 執行 Node 測試，下載包包含角色素材與選單模組。

## 本版未完成

- 正式逐格動畫、完整六需求、健康與成長系統尚未完成。
- 尚未接雲端存檔、聲音、商店或原生 macOS 打包。
- Web 與 Rust 韌體核心尚未共用執行邏輯；本輪只更新網頁介面。

## ESP32 韌體基礎

`firmware/` 已建立 Rust 共用遊戲核心與硬體介面骨架，對照 PRD v1.1 的 Core/Ports 分層。這是韌體開發起點，尚非可燒錄映像；板卡、螢幕、GPIO、存檔格式、Mac 模擬器與實機適配仍待完成。細節見 [`firmware/README.md`](firmware/README.md)。

## 本機測試

```bash
npm test
npm run serve
```

開啟 `http://localhost:4173`。此專案不依賴原生 CPU 架構，Apple Silicon Mac 使用 Node 20 即可。

## PRD 來源註記

目前採用使用者提供的 [PRD v1.1](docs/PRD_Uni_Inspired_Virtual_Pet_v1.1.md) 與 [QA 驗收計畫 v1.1](docs/QA_Acceptance_Test_Plan_v1.1.md) 作為後續韌體與模擬器開發基準。文件中的驗收項目尚未因此自動視為通過。
