@echo off
chcp 65001
echo 🎉 啟動婚禮遊戲開發環境...
echo.

echo 📋 檢查系統需求...
where node >nul 2>nul
if %ERRORLEVEL% neq 0 (
    echo ❌ 未找到 Node.js，請先安裝 Node.js
    pause
    exit /b 1
)

where npm >nul 2>nul
if %ERRORLEVEL% neq 0 (
    echo ❌ 未找到 npm，請確認 Node.js 安裝正確
    pause
    exit /b 1
)

echo ✅ Node.js 和 npm 已安裝

echo.
echo 📦 安裝相依套件...
call npm install

echo.
echo 🚀 1. 啟動婚禮遊戲系統...
start "婚禮遊戲系統" cmd /k "echo 🎮 婚禮遊戲系統啟動中... && npm start"

echo 💤 等待系統啟動...
timeout /t 5 /nobreak >nul

echo.
echo 🌐 2. 啟動 ngrok...
where ngrok >nul 2>nul
if %ERRORLEVEL% neq 0 (
    echo ⚠️  未找到 ngrok，請先安裝：
    echo    npm install -g ngrok
    echo    或前往 https://ngrok.com/download 下載
    echo.
    echo 📖 請參考 LOCAL_WEBHOOK_SETUP.md 了解詳細安裝步驟
    pause
    exit /b 1
)

start "ngrok" cmd /k "echo 🔗 ngrok 啟動中... && ngrok http 3000"

echo.
echo ✅ 開發環境啟動完成！
echo.
echo 📋 接下來請完成以下步驟：
echo.
echo 1. 📱 取得 Line Bot Channel Access Token：
echo    - 前往 Line Developers Console
echo    - 進入您的 Messaging API Channel
echo    - 點選「Messaging API」標籤
echo    - 在「Channel access token」區域點選「Issue」
echo    - 複製產生的 Token
echo.
echo 2. ⚙️  更新 config.js：
echo    - 將 Channel Access Token 填入 config.js
echo    - Channel Secret 已經設定為：631f794f1af39acab2deae7ed78d33ac
echo.
echo 3. 🔗 設定 Webhook URL：
echo    - 在 ngrok 視窗中複製 HTTPS 網址
echo    - 在 Line Developers Console 設定 Webhook URL
echo    - 格式：https://your-ngrok-url.ngrok-free.app/webhook
echo.
echo 4. 🌐 開啟 Web 介面：
echo    - http://localhost:3000
echo.
echo 5. 📱 測試 Line Bot：
echo    - 掃描 QR Code 加入機器人好友
echo    - 發送訊息測試
echo.
echo 💡 提示：ngrok 免費版每次重啟會產生新網址，需要重新設定 Webhook URL
echo.
pause
