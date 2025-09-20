# Google Drive OAuth 備份設定指南

本指南將幫助您使用個人 Google 帳號設定 Google Drive 自動備份功能。

## 📋 概述

**OAuth 方案優勢**：
- ✅ **使用個人 Google 帳號**：不需要 Google Workspace
- ✅ **免費使用**：使用您現有的 Google Drive 空間
- ✅ **完整權限**：可以正常上傳和管理檔案
- ✅ **穩定可靠**：沒有配額限制問題

## 🚀 詳細設定步驟

### 步驟 1：創建 Google Cloud 專案

1. **前往 Google Cloud Console**
   - 開啟 [Google Cloud Console](https://console.cloud.google.com/)
   - 使用您的個人 Google 帳號登入

2. **創建新專案**
   - 點選專案下拉選單
   - 點選「新增專案」
   - 專案名稱：`Wedding Game OAuth`
   - 點選「建立」

### 步驟 2：啟用 Google Drive API

1. **啟用 API**
   - 在左側選單選擇「API 和服務」→「程式庫」
   - 搜尋「Google Drive API」
   - 點選「Google Drive API」
   - 點選「啟用」

### 步驟 3：設定 OAuth 同意畫面

1. **設定同意畫面**
   - 在左側選單選擇「API 和服務」→「OAuth 同意畫面」
   - 選擇「外部」用戶類型
   - 點選「建立」

2. **填寫基本資訊**
   - 應用程式名稱：`Wedding Game Backup`
   - 用戶支援電子郵件：您的電子郵件
   - 開發人員聯絡資訊：您的電子郵件
   - 點選「儲存並繼續」

3. **範圍設定**
   - 點選「新增或移除範圍」
   - 搜尋並添加：`https://www.googleapis.com/auth/drive.file`
   - 點選「更新」
   - 點選「儲存並繼續」

4. **測試使用者**
   - 點選「新增使用者」
   - 輸入您的 Google 帳號電子郵件
   - 點選「新增」
   - 點選「儲存並繼續」

### 步驟 4：創建 OAuth 2.0 憑證

1. **建立憑證**
   - 在左側選單選擇「API 和服務」→「憑證」
   - 點選「建立憑證」→「OAuth 2.0 用戶端 ID」

2. **設定憑證**
   - 應用程式類型：「網頁應用程式」
   - 名稱：`Wedding Game OAuth Client`
   - 已授權的重新導向 URI：
     - `http://localhost:3000/auth/callback`
     - `https://your-railway-app.railway.app/auth/callback`（替換為您的 Railway URL）
   - 點選「建立」

3. **記錄憑證資訊**
   - 複製「用戶端 ID」
   - 複製「用戶端密碼」
   - 點選「確定」

### 步驟 5：獲取 Refresh Token

這是最重要的步驟，需要手動授權：

1. **創建授權 URL**
   
   將以下 URL 中的 `YOUR_CLIENT_ID` 替換為您的用戶端 ID：
   ```
   https://accounts.google.com/o/oauth2/auth?client_id=YOUR_CLIENT_ID&redirect_uri=http://localhost:3000/auth/callback&scope=https://www.googleapis.com/auth/drive.file&response_type=code&access_type=offline&prompt=consent
   ```

2. **授權應用程式**
   - 在瀏覽器中開啟上述 URL
   - 登入您的 Google 帳號
   - 點選「允許」授權應用程式存取您的 Google Drive
   - 瀏覽器會重新導向到 `http://localhost:3000/auth/callback?code=AUTHORIZATION_CODE`

3. **提取授權碼**
   - 從 URL 中複製 `code=` 後面的授權碼
   - 這個授權碼很長，請完整複製

4. **獲取 Refresh Token**
   
   使用以下 PowerShell 命令（替換相應的值）：
   ```powershell
   $body = @{
       client_id = "YOUR_CLIENT_ID"
       client_secret = "YOUR_CLIENT_SECRET"
       code = "AUTHORIZATION_CODE"
       grant_type = "authorization_code"
       redirect_uri = "http://localhost:3000/auth/callback"
   }
   
   $response = Invoke-RestMethod -Uri "https://oauth2.googleapis.com/token" -Method POST -Body $body
   Write-Host "Access Token: $($response.access_token)"
   Write-Host "Refresh Token: $($response.refresh_token)"
   ```

   或使用 curl：
   ```bash
   curl -d "client_id=YOUR_CLIENT_ID" \
        -d "client_secret=YOUR_CLIENT_SECRET" \
        -d "code=AUTHORIZATION_CODE" \
        -d "grant_type=authorization_code" \
        -d "redirect_uri=http://localhost:3000/auth/callback" \
        -X POST https://oauth2.googleapis.com/token
   ```

5. **記錄 Refresh Token**
   - 從回應中複製 `refresh_token` 的值
   - ⚠️ **重要**：妥善保存這個 token，它不會過期

### 步驟 6：創建 Google Drive 備份資料夾

1. **開啟 Google Drive**
   - 前往 [Google Drive](https://drive.google.com/)
   - 使用您剛才授權的 Google 帳號登入

2. **創建備份資料夾**
   - 右鍵點選空白處或點選「新增」
   - 選擇「資料夾」
   - 名稱：`WeddingGameBackup`
   - 點選「建立」

3. **獲取資料夾 ID（可選但建議）**
   - 開啟 `WeddingGameBackup` 資料夾
   - 從網址列複製資料夾 ID
   - 網址格式：`https://drive.google.com/drive/folders/FOLDER_ID`
   - `FOLDER_ID` 就是您需要的資料夾 ID

## ⚙️ 環境變數設定

### Railway 部署設定

在 Railway 專案的環境變數中添加：

```
GOOGLE_OAUTH_CLIENT_ID=您的用戶端ID
GOOGLE_OAUTH_CLIENT_SECRET=您的用戶端密碼
GOOGLE_OAUTH_REFRESH_TOKEN=您的Refresh Token
GOOGLE_DRIVE_BACKUP_FOLDER_ID=您的資料夾ID（可選）
```

### 本地開發設定

創建 `.env` 檔案：
```env
# Google Drive OAuth 備份設定
GOOGLE_OAUTH_CLIENT_ID=您的用戶端ID
GOOGLE_OAUTH_CLIENT_SECRET=您的用戶端密碼
GOOGLE_OAUTH_REFRESH_TOKEN=您的Refresh Token
GOOGLE_DRIVE_BACKUP_FOLDER_ID=您的資料夾ID
```

## 🎯 使用方式

### 自動備份

照片上傳時會自動嘗試備份到 Google Drive：
- ✅ **成功**：日誌顯示 `📸 照片已備份到 Google Drive`
- ⚠️ **失敗**：日誌顯示 `⚠️ Google Drive 備份失敗，但照片已成功儲存`

### 管理後台操作

1. **檢查備份狀態**
   - 點選「檢查備份狀態」
   - 查看連接狀態、備份數量、檔案清單

2. **手動批量備份**
   - 點選「備份所有照片」
   - 系統會將所有現有照片上傳到 Google Drive

3. **開啟備份資料夾**
   - 點選「開啟備份資料夾」
   - 直接在新分頁開啟 Google Drive 備份資料夾

## 📁 Google Drive 檔案結構

備份的照片會儲存在您的個人 Google Drive 中：
```
Google Drive/
└── WeddingGameBackup/
    ├── uuid1.jpg
    ├── uuid2.jpg
    └── ...
```

## 🔧 疑難排解

### 常見錯誤

1. **`未設定 Google Drive OAuth 認證`**
   - 檢查環境變數是否正確設定
   - 確認變數名稱拼寫正確

2. **`invalid_grant` 錯誤**
   - Refresh Token 可能已過期或無效
   - 重新執行步驟 5 獲取新的 Refresh Token

3. **`access_denied` 錯誤**
   - 檢查 OAuth 同意畫面設定
   - 確認您的帳號已添加為測試使用者

4. **`redirect_uri_mismatch` 錯誤**
   - 檢查重新導向 URI 是否正確設定
   - 確認 URL 完全匹配（包含 http/https）

### 測試備份功能

1. **檢查設定**
   - 管理後台 → 檢查備份狀態
   - 應顯示「✅ Google Drive 連接正常」

2. **測試上傳**
   - Line Bot 上傳一張照片
   - 檢查 Railway 日誌是否有備份成功訊息

3. **驗證 Google Drive**
   - 點選「開啟備份資料夾」
   - 檢查照片是否已成功上傳

## 🛡️ 安全性考量

1. **OAuth Token 安全**
   - Refresh Token 是敏感資訊，僅存儲在環境變數中
   - 不要將 token 包含在程式碼中

2. **權限最小化**
   - 僅要求 `drive.file` 權限
   - 只能存取應用程式創建的檔案

3. **測試用戶限制**
   - 應用程式處於測試模式
   - 只有添加為測試用戶的帳號可以使用

## 🎉 完成設定

設定完成後，您的婚禮遊戲系統將具備：
- ✅ **個人 Google Drive 備份**：使用您自己的儲存空間
- ✅ **自動化備份**：無需手動操作
- ✅ **管理介面**：方便的備份管理和直接存取
- ✅ **穩定可靠**：沒有配額限制問題

現在您可以放心使用婚禮遊戲系統，所有珍貴的照片都會安全地備份到您的個人 Google Drive 中！

## 🔗 相關連結

- [Google Cloud Console](https://console.cloud.google.com/)
- [Google Drive API 文件](https://developers.google.com/drive/api/v3/reference)
- [OAuth 2.0 說明](https://developers.google.com/identity/protocols/oauth2)
