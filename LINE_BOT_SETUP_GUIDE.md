# Line Bot 設定指南

本指南將詳細說明如何建立 Line Bot 並取得 Channel Access Token 和 Channel Secret。

## 📋 前置準備

1. **Line 帳號**: 確保您有 Line 個人帳號
2. **電子郵件**: 用於註冊 Line Developers 帳號
3. **手機號碼**: 用於驗證

## 🚀 步驟一：建立 Line Developers 帳號

### 1. 前往 Line Developers Console
- 開啟瀏覽器，前往：https://developers.line.biz/console/
- 點選「Login」按鈕

### 2. 登入或註冊
- 如果您已有 Line 帳號，點選「Log in with LINE」
- 如果沒有，點選「Create account」建立新帳號
- 使用您的 Line 帳號登入

### 3. 同意條款
- 閱讀並同意 Line Developers Agreement
- 點選「Agree」繼續

## 🏢 步驟二：建立 Provider

### 1. 建立 Provider
- 登入後，點選「Create」按鈕
- 選擇「Create a new provider」

### 2. 填寫 Provider 資訊
- **Provider name**: 輸入您的公司或專案名稱（例如：「婚禮遊戲系統」）
- 點選「Create」建立

## 🤖 步驟三：建立 Messaging API Channel

### 1. 建立新 Channel
- 在 Provider 頁面中，點選「Create a Messaging API channel」

### 2. 填寫 Channel 基本資訊
- **Channel type**: 自動選擇「Messaging API」
- **Provider**: 自動選擇剛建立的 Provider
- **Company or owner's country or region**: 選擇「Taiwan」
- **Channel name**: 輸入機器人名稱（例如：「婚禮互動遊戲Bot」）
- **Channel description**: 輸入機器人描述（例如：「婚禮現場互動遊戲專用機器人」）
- **Category**: 選擇適合的類別（例如：「Entertainment」）
- **Subcategory**: 選擇子類別（例如：「Games」）

### 3. 上傳 Channel 圖示
- **Channel icon**: 上傳一張 1:1 比例的圖片作為機器人頭像
- 建議尺寸：512x512 像素
- 格式：JPG 或 PNG

### 4. 填寫其他資訊
- **Email address**: 輸入您的聯絡電子郵件
- **Privacy policy URL**: 如果有隱私政策網址可填入，沒有可留空
- **Terms of use URL**: 如果有使用條款網址可填入，沒有可留空

### 5. 同意條款並建立
- 閱讀並勾選所有必要的同意項目
- 點選「Create」建立 Channel

## 🔑 步驟四：取得 Channel Access Token 和 Channel Secret

### 1. 進入 Channel 設定
- Channel 建立完成後，點選進入該 Channel

### 2. 取得 Channel Secret
- 在 Channel 頁面中，找到「Basic settings」標籤
- 在「Channel secret」欄位中，點選「Show」
- 複製顯示的 Channel Secret（格式類似：`a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6`）

### 3. 取得 Channel Access Token
- 點選「Messaging API」標籤
- 滑動到「Channel access token」區域
- 點選「Issue」按鈕產生新的 Token
- 複製顯示的 Channel Access Token（格式較長，類似：`xoxb-1234567890-abcdefghijklmnop`）
**Channel ID**: 您的 Channel ID
**Channel secret**: 您的 Channel Secret（請勿公開分享）
## ⚙️ 步驟五：設定 Webhook

### 1. 啟用 Webhook
- 在「Messaging API」標籤中找到「Webhook settings」
- 將「Use webhook」設定為「Enabled」

### 2. 設定 Webhook URL
- 在「Webhook URL」欄位輸入您的服務器網址：
  ```
  https://your-domain.com/webhook
  ```
- **注意**: 必須是 HTTPS 網址，Line 不支援 HTTP

### 3. 驗證 Webhook（可選）
- 點選「Verify」按鈕測試 Webhook 連接
- 如果顯示「Success」表示設定正確

## 🎯 步驟六：其他重要設定

### 1. 關閉自動回覆
- 在「Messaging API」標籤中找到「LINE Official Account features」
- 將「Auto-reply messages」設定為「Disabled」
- 將「Greeting messages」設定為「Disabled」

### 2. 允許機器人加入群組（可選）
- 在「Messaging API」標籤中找到「Bot info」
- 可以設定「Allow bot to join group chats」和「Allow bot to join multi-person chats」

## 📱 步驟七：測試 Line Bot

### 1. 取得 QR Code
- 在「Messaging API」標籤中找到「QR code」
- 使用 Line 掃描 QR Code 加入機器人好友

### 2. 測試基本功能
- 發送訊息給機器人
- 確認機器人能正確接收並回應

## 🔧 設定到婚禮遊戲系統

將取得的憑證設定到系統中：

### 1. 修改 config.js
```javascript
module.exports = {
  line: {
    channelAccessToken: '您的_CHANNEL_ACCESS_TOKEN',
    channelSecret: '您的_CHANNEL_SECRET'
  },
  // ... 其他設定
};
```

### 2. 設定環境變數（推薦用於正式環境）
```bash
export LINE_CHANNEL_ACCESS_TOKEN="您的_CHANNEL_ACCESS_TOKEN"
export LINE_CHANNEL_SECRET="您的_CHANNEL_SECRET"
```

## 🌐 部署到公開伺服器

### 使用 ngrok 進行本地測試
如果您想在本地測試，可以使用 ngrok：

```bash
# 安裝 ngrok
npm install -g ngrok

# 啟動您的應用
npm start

# 在另一個終端啟動 ngrok
ngrok http 3000
```

ngrok 會提供一個 HTTPS 網址，將此網址設定為 Webhook URL：
```
https://abc123.ngrok.io/webhook
```

### 正式部署建議
- 使用雲端服務（如 Heroku, Vercel, AWS）
- 確保有 SSL 憑證（HTTPS）
- 設定環境變數保護敏感資訊

## ❗ 常見問題

### Q: Webhook 驗證失敗
**A**: 確認：
- URL 是 HTTPS 格式
- 伺服器正在運行
- 防火牆允許外部連接
- Webhook 路徑正確（/webhook）

### Q: 機器人沒有回應
**A**: 檢查：
- Channel Access Token 和 Channel Secret 是否正確
- 自動回覆功能是否關閉
- 伺服器日誌是否有錯誤訊息

### Q: 無法上傳圖片
**A**: 確認：
- 圖片格式為 JPG 或 PNG
- 圖片大小不超過 1MB
- 圖片比例為 1:1

## 📞 技術支援

如果遇到問題：
1. 查看 Line Developers 官方文件：https://developers.line.biz/en/docs/
2. 檢查伺服器日誌檔案
3. 使用 Line Bot SDK 的偵錯功能

---

完成以上步驟後，您的婚禮互動遊戲系統就可以開始使用了！🎉
