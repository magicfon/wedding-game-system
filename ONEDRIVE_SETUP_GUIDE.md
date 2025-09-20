# OneDrive 備份設定指南

本指南將幫助您設定 OneDrive 自動備份功能，確保婚禮照片永久保存。

## 📋 概述

**功能特色**：
- ✅ **自動備份**：照片上傳時同時備份到 OneDrive
- ✅ **手動批量備份**：管理後台一鍵備份所有照片
- ✅ **備份狀態監控**：即時查看備份情況
- ✅ **容錯設計**：備份失敗不影響主要功能

## 🚀 快速開始

### 步驟 1：註冊 Microsoft Azure 應用

1. **前往 Azure 入口網站**
   - 開啟 [Azure App Registration](https://portal.azure.com/#blade/Microsoft_AAD_RegisteredApps/ApplicationsListBlade)
   - 使用您的 Microsoft 帳號登入

2. **創建新應用註冊**
   ```
   名稱: Wedding Game OneDrive Backup
   支援的帳戶類型: 任何組織目錄中的帳戶和個人 Microsoft 帳戶
   重新導向 URI: Web -> http://localhost:3000/auth/callback
   ```

3. **記錄應用資訊**
   - **應用程式 (用戶端) ID**：這是您的 `CLIENT_ID`
   - **目錄 (租用戶) ID**：記錄備用

### 步驟 2：創建用戶端密碼

1. **在應用註冊頁面**
   - 點選「憑證和祕密」
   - 點選「新增用戶端密碼」
   - 描述：`Wedding Game Secret`
   - 到期：24個月
   - 點選「新增」

2. **複製密碼值**
   - ⚠️ **重要**：立即複製密碼值，這是您的 `CLIENT_SECRET`
   - 離開頁面後將無法再次查看

### 步驟 3：設定 API 權限

1. **添加權限**
   - 點選「API 權限」
   - 點選「新增權限」
   - 選擇「Microsoft Graph」
   - 選擇「委派的權限」
   - 搜尋並添加：`Files.ReadWrite`

2. **授予管理員同意**
   - 點選「授予管理員同意」
   - 確認授權

### 步驟 4：獲取 Refresh Token

由於這是一次性設定，我們需要手動獲取 Refresh Token：

1. **在瀏覽器中訪問授權 URL**（替換 `YOUR_CLIENT_ID`）：
   ```
   https://login.microsoftonline.com/common/oauth2/v2.0/authorize?client_id=YOUR_CLIENT_ID&response_type=code&redirect_uri=http://localhost:3000/auth/callback&scope=https://graph.microsoft.com/Files.ReadWrite%20offline_access
   ```

2. **登入並授權**
   - 使用您要備份到的 OneDrive 帳號登入
   - 同意應用存取您的檔案

3. **從重新導向 URL 中提取授權碼**
   - 瀏覽器會重新導向到：`http://localhost:3000/auth/callback?code=AUTHORIZATION_CODE`
   - 複製 `code=` 後面的授權碼

4. **使用授權碼獲取 Refresh Token**
   
   使用 PowerShell 或命令提示字元執行（替換相應值）：
   ```powershell
   $body = @{
       client_id = "YOUR_CLIENT_ID"
       client_secret = "YOUR_CLIENT_SECRET"
       code = "AUTHORIZATION_CODE"
       redirect_uri = "http://localhost:3000/auth/callback"
       grant_type = "authorization_code"
   }
   
   $response = Invoke-RestMethod -Uri "https://login.microsoftonline.com/common/oauth2/v2.0/token" -Method POST -Body $body
   Write-Host "Refresh Token: $($response.refresh_token)"
   ```

   或使用 curl：
   ```bash
   curl -X POST "https://login.microsoftonline.com/common/oauth2/v2.0/token" \
     -H "Content-Type: application/x-www-form-urlencoded" \
     -d "client_id=YOUR_CLIENT_ID&client_secret=YOUR_CLIENT_SECRET&code=AUTHORIZATION_CODE&redirect_uri=http://localhost:3000/auth/callback&grant_type=authorization_code"
   ```

5. **記錄 Refresh Token**
   - 從回應中複製 `refresh_token` 的值

## ⚙️ 環境變數設定

### Railway 部署設定

在 Railway 專案的環境變數中添加：

```
ONEDRIVE_CLIENT_ID=您的應用程式ID
ONEDRIVE_CLIENT_SECRET=您的用戶端密碼
ONEDRIVE_REFRESH_TOKEN=您的Refresh Token
```

### 本地開發設定

創建 `.env` 檔案：
```env
# OneDrive 備份設定
ONEDRIVE_CLIENT_ID=您的應用程式ID
ONEDRIVE_CLIENT_SECRET=您的用戶端密碼
ONEDRIVE_REFRESH_TOKEN=您的Refresh Token
```

## 🎯 使用方式

### 自動備份

照片上傳時會自動嘗試備份到 OneDrive：
- ✅ **成功**：日誌顯示 `📸 照片已備份到 OneDrive`
- ⚠️ **失敗**：日誌顯示 `⚠️ OneDrive 備份失敗，但照片已成功儲存`

### 管理後台操作

1. **檢查備份狀態**
   - 點選「檢查備份狀態」
   - 查看連接狀態、備份數量、檔案清單

2. **手動批量備份**
   - 點選「備份所有照片」
   - 系統會將所有現有照片上傳到 OneDrive
   - 顯示備份進度和結果

## 📁 OneDrive 檔案結構

備份的照片會儲存在：
```
OneDrive/
└── WeddingGameBackup/
    ├── uuid1.jpg
    ├── uuid2.jpg
    └── ...
```

## 🔧 疑難排解

### 常見錯誤

1. **`未設定 OneDrive 認證`**
   - 檢查環境變數是否正確設定
   - 確認變數名稱拼寫正確

2. **`獲取 Access Token 失敗`**
   - Refresh Token 可能已過期
   - 重新執行步驟 4 獲取新的 Refresh Token

3. **`無法連接到 OneDrive`**
   - 檢查網路連接
   - 確認 Microsoft Graph API 可用

### 測試備份功能

1. **檢查設定**
   - 管理後台 → 檢查備份狀態
   - 應顯示「✅ OneDrive 連接正常」

2. **測試上傳**
   - Line Bot 上傳一張照片
   - 檢查 Railway 日誌是否有備份成功訊息

3. **驗證 OneDrive**
   - 登入您的 OneDrive
   - 檢查是否有 `WeddingGameBackup` 資料夾
   - 確認照片已成功上傳

## 📊 備份監控

系統提供詳細的備份資訊：
- **連接狀態**：OneDrive API 連接是否正常
- **備份數量**：已備份的照片總數
- **最後備份時間**：最近一次備份的時間
- **檔案清單**：所有備份檔案的詳細資訊

## 🛡️ 安全性考量

1. **密碼保護**
   - Client Secret 和 Refresh Token 是敏感資訊
   - 僅存儲在環境變數中，不包含在程式碼中

2. **權限最小化**
   - 僅要求 `Files.ReadWrite` 權限
   - 不會存取其他個人資料

3. **Token 管理**
   - 系統自動更新 Access Token
   - Refresh Token 長期有效（通常 90 天）

## 🎉 完成設定

設定完成後，您的婚禮遊戲系統將具備：
- ✅ **雙重備份**：本地 + OneDrive
- ✅ **自動化備份**：無需手動操作
- ✅ **管理介面**：方便的備份管理
- ✅ **監控功能**：即時備份狀態

現在您可以放心使用婚禮遊戲系統，所有珍貴的照片都會安全地備份到您的 OneDrive 中！
