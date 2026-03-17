# 成语死斗 — 启动脚本
# 同时启动后端服务器（:3001）和前端开发服务器（:3000）

Write-Host "🎮 启动成语死斗 联网对战服务..." -ForegroundColor Cyan

# 启动后端
$backend = Start-Process powershell -ArgumentList "-NoExit", "-Command", "Set-Location D:\UIUX\game-server; Write-Host '[后端] 启动中...' -ForegroundColor Yellow; npx ts-node src/index.ts" -PassThru

Start-Sleep -Seconds 3

# 启动前端
$frontend = Start-Process powershell -ArgumentList "-NoExit", "-Command", "Set-Location D:\UIUX\game; Write-Host '[前端] 启动中...' -ForegroundColor Green; npx vite --port=3000 --host=0.0.0.0" -PassThru

Write-Host ""
Write-Host "✅ 服务启动完成！" -ForegroundColor Green
Write-Host "   前端游戏:  http://localhost:3000" -ForegroundColor Green  
Write-Host "   后端接口:  http://localhost:3001/health" -ForegroundColor Yellow
Write-Host ""
Write-Host "按任意键退出此窗口（服务继续在后台运行）..."
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
