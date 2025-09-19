# 免費雲端架設選項

以下是可以免費架設婚禮互動遊戲系統的雲端服務選項：

## 🌟 推薦免費服務

### 1. Railway（強烈推薦）
**優點**：
- 免費額度充足
- 支援 Node.js
- 自動 HTTPS
- 容易部署
- 固定網址

**免費額度**：
- $5 USD 免費額度/月
- 通常足夠小型專案使用

**部署步驟**：
1. 前往 https://railway.app/
2. 使用 GitHub 帳號登入
3. 建立新專案
4. 連接您的 GitHub repository
5. 設定環境變數
6. 自動部署

### 2. Render（推薦）
**優點**：
- 完全免費方案
- 支援 Node.js
- 自動 HTTPS
- GitHub 整合

**限制**：
- 免費方案會在閒置時休眠
- 冷啟動時間較長

**部署步驟**：
1. 前往 https://render.com/
2. 使用 GitHub 帳號註冊
3. 建立新的 Web Service
4. 連接 GitHub repository
5. 設定建置和啟動指令

### 3. Fly.io（推薦）
**優點**：
- 免費額度不錯
- 全球 CDN
- 支援 Node.js
- 固定網址

**免費額度**：
- 3 個小型應用程式
- 160GB 頻寬/月

### 4. Vercel（需要調整）
**優點**：
- GitHub 整合完美
- 自動部署
- 全球 CDN

**限制**：
- 主要針對靜態網站和 Serverless
- 需要調整架構

### 5. Netlify（需要調整）
**優點**：
- 免費額度充足
- GitHub 整合

**限制**：
- 主要針對靜態網站
- 需要調整為 Serverless 架構

## 🚀 推薦方案：Railway

由於 Railway 最適合您的 Node.js 應用程式，以下是詳細部署步驟：

### 步驟 1：準備 GitHub Repository

1. **建立 GitHub 帳號**（如果沒有）
2. **建立新的 repository**
3. **上傳您的專案檔案**

```bash
# 在專案目錄中
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/YOUR_USERNAME/wedding-game-system.git
git push -u origin main
```

### 步驟 2：修改專案以支援雲端部署

我們需要建立一些檔案來支援雲端部署：

#### 建立 `railway.json`
```json
{
  "$schema": "https://railway.app/railway.schema.json",
  "build": {
    "builder": "NIXPACKS"
  },
  "deploy": {
    "startCommand": "npm start",
    "healthcheckPath": "/",
    "healthcheckTimeout": 100,
    "restartPolicyType": "ON_FAILURE",
    "restartPolicyMaxRetries": 10
  }
}
```

#### 更新 `package.json`
確保有正確的 start script：
```json
{
  "scripts": {
    "start": "node server.js",
    "build": "echo 'No build step required'"
  },
  "engines": {
    "node": ">=14.0.0"
  }
}
```

### 步驟 3：部署到 Railway

1. **前往 Railway**：https://railway.app/
2. **使用 GitHub 帳號登入**
3. **建立新專案**：
   - 點選 "New Project"
   - 選擇 "Deploy from GitHub repo"
   - 選擇您的 wedding-game-system repository
4. **設定環境變數**：
   - 在專案設定中點選 "Variables"
   - 新增以下環境變數：
     ```
     LINE_CHANNEL_ACCESS_TOKEN=您的_Channel_Access_Token
     LINE_CHANNEL_SECRET=631f794f1af39acab2deae7ed78d33ac
     NODE_ENV=production
     ```
5. **部署**：
   - Railway 會自動開始部署
   - 等待部署完成

### 步驟 4：取得部署網址

部署完成後，Railway 會提供一個網址，例如：
```
https://wedding-game-system-production.up.railway.app
```

### 步驟 5：設定 Line Bot Webhook

在 Line Developers Console 中設定 Webhook URL：
```
https://your-app-name.up.railway.app/webhook
```

## 🛠 部署前的程式碼調整

### 1. 修改 server.js 以支援動態 PORT
```javascript
const port = process.env.PORT || 3000;
server.listen(port, '0.0.0.0', () => {
  console.log(`婚禮遊戲伺服器運行在 port ${port}`);
});
```

### 2. 建立 Procfile（某些平台需要）
```
web: node server.js
```

### 3. 建立 .gitignore
```
node_modules/
*.db
.env
uploads/*.jpg
uploads/*.png
uploads/*.gif
!uploads/.gitkeep
```

### 4. 建立 uploads/.gitkeep
```
# 確保 uploads 目錄被包含在 git 中
```

## 📋 完整部署檢查清單

- [ ] 建立 GitHub repository
- [ ] 上傳專案檔案
- [ ] 修改 server.js 支援動態 PORT
- [ ] 建立 railway.json
- [ ] 更新 package.json
- [ ] 建立 .gitignore
- [ ] 註冊 Railway 帳號
- [ ] 連接 GitHub repository
- [ ] 設定環境變數
- [ ] 等待部署完成
- [ ] 取得部署網址
- [ ] 更新 Line Bot Webhook URL
- [ ] 測試系統功能

## 🎯 其他免費選項

### GitHub Codespaces（開發用）
- 免費額度：每月 60 小時
- 適合開發測試，不適合正式環境

### Google Cloud Platform（有免費額度）
- 複雜度較高
- 需要信用卡驗證

### AWS Free Tier（有免費額度）
- 複雜度較高
- 需要信用卡驗證

## 💡 建議

對於婚禮遊戲這種短期使用的專案，我強烈推薦 **Railway**：
1. 設定簡單
2. 免費額度充足
3. 自動 HTTPS
4. 固定網址
5. 不會休眠（在免費額度內）

這樣您就不需要擔心 ngrok 重啟後網址改變的問題了！

## 🚀 快速開始

如果您想立即開始，我可以幫您：
1. 準備部署所需的檔案
2. 建立 GitHub repository
3. 設定 Railway 部署
4. 更新 Line Bot 設定

這樣您就能擁有一個穩定的公開網址來運行婚禮遊戲系統！
