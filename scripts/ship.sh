#!/bin/sh
# 一鍵上雲：跑測試 → 存成一個 commit → 推上 GitHub（Vercel 會自動重新部署 main）。
# 用法：npm run ship -- "這次改了什麼"
set -e
cd "$(dirname "$0")/.."

message="$1"
if [ -z "$message" ]; then
  message="Update $(TZ=Asia/Taipei date '+%Y-%m-%d %H:%M')"
fi

echo "▶ 跑測試…"
if ! npm test --silent; then
  echo "✖ 測試沒過，這次不上傳。修好後再跑一次。"
  exit 1
fi

git add -A
if git diff --cached --quiet; then
  echo "• 沒有新的改動，只確認遠端是最新。"
else
  git commit -q -m "$message"
  echo "✔ 已存檔：$(git log --oneline -1)"
fi

git push -q
echo "✔ 已推上 GitHub，網站約 1 分鐘後更新：https://tamagotchi-uni-inspired-virtual-pet.vercel.app"
