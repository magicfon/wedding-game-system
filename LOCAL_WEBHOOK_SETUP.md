# 本地開發 Webhook 設定指南

如果您的電腦沒有公開的 domain，可以使用以下方法來設定 Line Bot webhook。

## 🌟 方法一：使用 ngrok（推薦）

### 1. 安裝 ngrok

#### Windows 用戶：
```powershell
# 使用 npm 安裝
npm install -g ngrok

# 或者下載 ngrok 執行檔
# 前往 https://ngrok.com/download 下載
```

#### 或者直接下載：
- 前往：https://ngrok.com/download
- 下載 Windows 版本
- 解壓縮到任意資料夾

### 2. 註冊 ngrok 帳號（免費）
- 前往：https://dashboard.ngrok.com/signup
- 註冊免費帳號
- 取得您的 authtoken

### 3. 設定 authtoken
```bash
ngrok authtoken YOUR_AUTHTOKEN_HERE
```

### 4. 啟動婚禮遊戲系統
```bash
# 在專案目錄中
npm start
```

### 5. 在另一個終端啟動 ngrok
```bash
# 開啟新的 PowerShell 或 CMD
ngrok http 3000
```

### 6. 取得 HTTPS 網址
ngrok 會顯示類似以下的資訊：
```
Session Status                online
Account                       你的帳號 (Plan: Free)
Version                       3.x.x
Region                        Asia Pacific (ap)
Latency                       -
Web Interface                 http://127.0.0.1:4040
Forwarding                    https://abc123def.ngrok-free.app -> http://localhost:3000
```

### 7. 設定 Line Bot Webhook URL
- 複製 `https://abc123def.ngrok-free.app` 這個網址
- 在 Line Developers Console 中設定 Webhook URL：
  ```
  https://abc123def.ngrok-free.app/webhook
  ```

## 🌟 方法二：使用 Localtunnel

### 1. 安裝 localtunnel
```bash
npm install -g localtunnel
```

### 2. 啟動系統
```bash
npm start
```

### 3. 在另一個終端啟動 localtunnel
```bash
lt --port 3000 --subdomain wedding-game
```

### 4. 使用提供的網址
會顯示類似：`https://wedding-game.loca.lt`

## 🌟 方法三：使用免費雲端服務

### Heroku（免費方案已停止，但仍可使用付費方案）
### Railway（推薦免費選項）
### Vercel（適合靜態網站，需要調整）

## 🔧 完整設定步驟

### 1. 首先取得您的 Channel Access Token

您已經有 Channel Secret：`631f794f1af39acab2deae7ed78d33ac`

現在需要取得 Channel Access Token：
- 在 Line Developers Console 中
- 進入您的 Messaging API Channel
- 點選「Messaging API」標籤
- 在「Channel access token」區域點選「Issue」
- 複製產生的 Token

### 2. 更新 config.js
```javascript
module.exports = {
  line: {
    channelAccessToken: '您的_CHANNEL_ACCESS_TOKEN_在這裡',
    channelSecret: '631f794f1af39acab2deae7ed78d33ac'
  },
  server: {
    port: 3000,
    host: 'localhost'
  },
  database: {
    path: './wedding_game.db'
  },
  admin: {
    password: 'admin123'
  }
};
```

### 3. 啟動系統並測試

#### 終端 1：啟動婚禮遊戲系統
```bash
cd "C:\Users\magic\OneDrive\Obsidian\NoteSlipBox\wedding game program"
npm install
npm start
```

#### 終端 2：啟動 ngrok
```bash
ngrok http 3000
```

### 4. 設定 Line Bot
- 複製 ngrok 提供的 HTTPS 網址
- 在 Line Developers Console 設定 Webhook URL
- 啟用 Webhook
- 關閉自動回覆功能

### 5. 測試
- 掃描 Line Bot QR Code 加入好友
- 發送訊息測試

## ⚠️ 重要注意事項

### ngrok 免費版限制：
- 每次重啟會產生新的網址
- 每月有流量限制
- 需要重新設定 Webhook URL

### 解決方法：
1. **固定網址**：升級到 ngrok 付費版可以使用固定網址
2. **自動化腳本**：建立腳本自動更新 Webhook URL
3. **雲端部署**：部署到雲端服務取得固定網址

## 🚀 快速啟動腳本

建立一個批次檔案 `start-development.bat`：

```batch
@echo off
echo 啟動婚禮遊戲開發環境...

echo 1. 啟動婚禮遊戲系統...
start cmd /k "npm start"

timeout /t 5

echo 2. 啟動 ngrok...
start cmd /k "ngrok http 3000"

echo 3. 請等待 ngrok 啟動完成，然後：
echo    - 複製 ngrok 提供的 HTTPS 網址
echo    - 在 Line Developers Console 設定 Webhook URL
echo    - 格式：https://your-ngrok-url.ngrok-free.app/webhook

pause
```

## 🔍 偵錯技巧

### 1. 檢查 ngrok 狀態
開啟瀏覽器前往：http://localhost:4040
可以看到所有 HTTP 請求的詳細資訊

### 2. 檢查系統日誌
在啟動系統的終端中查看是否有錯誤訊息

### 3. 測試 Webhook
在 Line Developers Console 中點選「Verify」按鈕測試連接

## 📱 完整測試流程

1. ✅ 啟動系統：`npm start`
2. ✅ 啟動 ngrok：`ngrok http 3000`
3. ✅ 複製 HTTPS 網址
4. ✅ 設定 Line Bot Webhook URL
5. ✅ 驗證 Webhook 連接
6. ✅ 掃描 QR Code 加入機器人
7. ✅ 發送訊息測試
8. ✅ 開啟 Web 介面：http://localhost:3000

完成以上步驟後，您就可以在本地環境中完整測試婚禮互動遊戲系統了！🎉
