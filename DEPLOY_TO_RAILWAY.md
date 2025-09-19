# 部署到 Railway 指南

## 🚀 快速部署步驟

### 1. 準備 GitHub Repository

#### 如果您還沒有 GitHub 帳號：
1. 前往 https://github.com 註冊帳號
2. 驗證電子郵件

#### 建立新的 Repository：
1. 登入 GitHub
2. 點選右上角的 "+" → "New repository"
3. Repository name: `wedding-game-system`
4. 設為 Public（免費用戶）
5. 點選 "Create repository"

### 2. 上傳專案到 GitHub

在您的專案目錄中執行：

```bash
# 初始化 git repository
git init

# 加入所有檔案
git add .

# 提交變更
git commit -m "Initial commit: 婚禮互動遊戲系統"

# 連接到 GitHub repository（替換 YOUR_USERNAME）
git remote add origin https://github.com/magicfon/wedding-game-system.git

# 推送到 GitHub
git branch -M main
git push -u origin main
```

### 3. 部署到 Railway

#### 註冊 Railway：
1. 前往 https://railway.app/
2. 點選 "Login"
3. 選擇 "Login with GitHub"
4. 授權 Railway 存取您的 GitHub

#### 建立新專案：
1. 點選 "New Project"
2. 選擇 "Deploy from GitHub repo"
3. 選擇 `wedding-game-system` repository
4. 點選 "Deploy Now"

#### 設定環境變數：
1. 在專案儀表板中，點選您的服務
2. 點選 "Variables" 標籤
3. 新增以下環境變數：

```
NODE_ENV=production
LINE_CHANNEL_ACCESS_TOKEN=您的_Channel_Access_Token
LINE_CHANNEL_SECRET=
ADMIN_PASSWORD=您的管理員密碼
```

### 4. 取得部署網址

1. 等待部署完成（通常 2-5 分鐘）
2. 在專案儀表板中點選 "Settings" → "Domains"
3. 複製提供的網址，例如：`https://wedding-game-system-production.up.railway.app`

### 5. 設定 Line Bot Webhook

1. 前往 Line Developers Console
2. 進入您的 Messaging API Channel
3. 點選 "Messaging API" 標籤
4. 在 "Webhook URL" 欄位輸入：
   ```
   https://your-app-name.up.railway.app/webhook
   ```
5. 點選 "Update"
6. 點選 "Verify" 測試連接

### 6. 測試系統

1. **測試 Web 介面**：
   - 開啟您的部署網址
   - 確認頁面正常載入

2. **測試 Line Bot**：
   - 掃描 QR Code 加入機器人好友
   - 發送訊息測試回應

3. **測試管理功能**：
   - 在 Web 介面進入管理後台
   - 使用您設定的管理員密碼登入

## 🔧 故障排除

### 部署失敗
1. 檢查 Railway 的建置日誌
2. 確認 `package.json` 中有正確的 start script
3. 確認所有依賴都在 `package.json` 中

### Line Bot 無法連接
1. 確認 Webhook URL 設定正確
2. 檢查環境變數是否正確設定
3. 在 Railway 日誌中查看錯誤訊息

### 網站無法存取
1. 確認部署狀態為 "Active"
2. 檢查 Railway 服務狀態
3. 確認沒有超出免費額度

## 💰 Railway 免費額度

- **每月 $5 USD 免費額度**
- **包含**：
  - 運算時間
  - 頻寬使用
  - 儲存空間

- **對於婚禮遊戲**：
  - 通常足夠使用數天到數週
  - 適合短期活動

## 🎯 部署後檢查清單

- [ ] GitHub repository 建立完成
- [ ] 專案檔案上傳到 GitHub
- [ ] Railway 專案建立完成
- [ ] 環境變數設定完成
- [ ] 部署成功並取得網址
- [ ] Line Bot Webhook URL 更新
- [ ] Webhook 驗證成功
- [ ] Web 介面可以正常存取
- [ ] Line Bot 可以正常回應
- [ ] 管理後台可以正常登入

## 🚀 完成！

恭喜！您的婚禮互動遊戲系統現在已經部署到雲端，擁有固定的網址，可以穩定運行了！

**您的系統網址**：`https://your-app-name.up.railway.app`

現在您可以：
1. 分享 Line Bot 給婚禮賓客
2. 在婚禮現場使用 Web 介面
3. 透過管理後台控制遊戲

🎉 祝您的婚禮遊戲圓滿成功！
