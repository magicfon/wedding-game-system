# GitHub Desktop 部署指南

## 📥 步驟 1：下載並安裝 GitHub Desktop

1. 前往 https://desktop.github.com/
2. 下載 Windows 版本
3. 安裝並使用您的 GitHub 帳號登入

## 🏗 步驟 2：建立 GitHub Repository

### 在 GitHub 網站上建立 Repository：
1. 前往 https://github.com
2. 點選右上角的 "+" → "New repository"
3. **Repository name**: `wedding-game-system`
4. 設為 **Public**（免費用戶）
5. **不要勾選** "Add a README file"（我們已經有了）
6. 點選 "Create repository"

## 💻 步驟 3：使用 GitHub Desktop 上傳

### Clone Repository：
1. 開啟 GitHub Desktop
2. 點選 "Clone a repository from the Internet"
3. 選擇 `magicfon/wedding-game-system`
4. 選擇本地路徑（例如：`C:\Users\magic\Documents\GitHub\wedding-game-system`）
5. 點選 "Clone"

### 複製檔案：
1. **開啟檔案總管**，前往您目前的專案目錄：
   ```
   C:\Users\magic\OneDrive\Obsidian\NoteSlipBox\wedding game program
   ```

2. **選取所有專案檔案**（Ctrl+A），**複製**（Ctrl+C）

3. **前往 GitHub Desktop clone 的目錄**，**貼上所有檔案**（Ctrl+V）

### 提交變更：
1. 回到 GitHub Desktop
2. 您會看到所有檔案都顯示為 "新增"
3. 在左下角輸入提交訊息：
   ```
   Initial commit: 婚禮互動遊戲系統
   ```
4. 點選 "Commit to main"
5. 點選 "Push origin" 推送到 GitHub

## ⚙️ 步驟 4：設定環境變數（重要！）

由於我們已經移除了程式碼中的敏感資訊，現在需要透過環境變數設定：

### 本地開發環境變數：
在專案目錄建立 `.env` 檔案（注意：此檔案不會上傳到 GitHub）：

```bash
# Line Bot 設定
LINE_CHANNEL_ACCESS_TOKEN=您的_Channel_Access_Token
LINE_CHANNEL_SECRET=631f794f1af39acab2deae7ed78d33ac

# 其他設定
NODE_ENV=development
ADMIN_PASSWORD=admin123
```

### Railway 環境變數：
稍後在 Railway 部署時，我們會在 Railway 介面中設定這些環境變數。

## 🚀 步驟 5：部署到 Railway

### 註冊並連接 Railway：
1. 前往 https://railway.app/
2. 點選 "Login with GitHub"
3. 授權 Railway 存取您的 GitHub

### 建立新專案：
1. 點選 "New Project"
2. 選擇 "Deploy from GitHub repo"
3. 選擇 `wedding-game-system` repository
4. 點選 "Deploy Now"

### 設定環境變數：
1. 在 Railway 專案頁面，點選您的服務
2. 點選 "Variables" 標籤
3. 新增以下環境變數：

```
NODE_ENV=production
LINE_CHANNEL_ACCESS_TOKEN=您的_Channel_Access_Token
LINE_CHANNEL_SECRET=631f794f1af39acab2deae7ed78d33ac
ADMIN_PASSWORD=您的管理員密碼
```

**重要**：在 Railway 中設定環境變數的步驟：
- 點選 "Add Variable"
- Name: `LINE_CHANNEL_ACCESS_TOKEN`
- Value: 貼上您的實際 Token
- 點選 "Add"
- 重複此步驟添加其他變數

### 等待部署完成：
1. Railway 會自動開始建置和部署
2. 等待 2-5 分鐘
3. 部署完成後會顯示網址

## 🔗 步驟 6：設定 Line Bot Webhook

### 取得 Railway 網址：
1. 在 Railway 專案中，點選 "Settings" → "Domains"
2. 複製提供的網址，例如：
   ```
   https://wedding-game-system-production.up.railway.app
   ```

### 更新 Line Bot 設定：
1. 前往 Line Developers Console
2. 進入您的 Messaging API Channel
3. 點選 "Messaging API" 標籤
4. 在 "Webhook URL" 欄位輸入：
   ```
   https://your-app-name.up.railway.app/webhook
   ```
5. 點選 "Update"
6. 點選 "Verify" 測試連接（應該顯示 Success）

## 🧪 步驟 7：測試系統

### 測試 Web 介面：
1. 開啟您的 Railway 網址
2. 確認頁面正常載入
3. 測試各個功能頁面

### 測試 Line Bot：
1. 在 Line Developers Console 找到 QR Code
2. 用 Line 掃描 QR Code 加入機器人好友
3. 發送訊息測試回應

### 測試管理功能：
1. 在 Web 介面點選 "管理後台"
2. 使用您設定的管理員密碼登入
3. 測試分數管理和遊戲控制功能

## 📋 完整檢查清單

- [ ] 下載並安裝 GitHub Desktop
- [ ] 在 GitHub 網站建立 repository
- [ ] 使用 GitHub Desktop clone repository
- [ ] 複製所有專案檔案到 clone 目錄
- [ ] 在 GitHub Desktop 提交並推送
- [ ] 註冊 Railway 帳號
- [ ] 建立 Railway 專案並連接 GitHub
- [ ] 在 Railway 設定所有環境變數
- [ ] 等待部署完成並取得網址
- [ ] 更新 Line Bot Webhook URL
- [ ] 測試 Webhook 連接
- [ ] 測試 Web 介面
- [ ] 測試 Line Bot 功能
- [ ] 測試管理後台

## 💡 優點

使用這種方法的優點：
- ✅ **安全**：敏感資訊不會出現在程式碼中
- ✅ **簡單**：GitHub Desktop 提供圖形化介面
- ✅ **專業**：符合最佳實務
- ✅ **靈活**：可以輕鬆修改環境變數

## 🎉 完成！

完成以上步驟後，您就擁有一個：
- 安全的 GitHub repository
- 穩定的雲端部署
- 完整功能的婚禮互動遊戲系統

祝您的婚禮遊戲圓滿成功！🎊
