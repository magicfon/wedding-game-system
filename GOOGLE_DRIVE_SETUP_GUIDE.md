# Google Drive 備份設定指南

本指南將幫助您設定 Google Drive 自動備份功能，確保婚禮照片永久保存。

## 📋 概述

**功能特色**：
- ✅ **自動備份**：照片上傳時同時備份到 Google Drive
- ✅ **手動批量備份**：管理後台一鍵備份所有照片
- ✅ **備份狀態監控**：即時查看備份情況和檔案連結
- ✅ **容錯設計**：備份失敗不影響主要功能
- ✅ **直接存取**：可直接開啟 Google Drive 備份資料夾

## 🚀 快速開始

### 步驟 1：創建 Google Cloud 專案

1. **前往 Google Cloud Console**
   - 開啟 [Google Cloud Console](https://console.cloud.google.com/)
   - 使用您的 Google 帳號登入

2. **創建新專案**
   - 點選專案下拉選單
   - 點選「新增專案」
   - 專案名稱：`Wedding Game Backup`
   - 點選「建立」

### 步驟 2：啟用 Google Drive API

1. **啟用 API**
   - 在左側選單選擇「API 和服務」→「程式庫」
   - 搜尋「Google Drive API」
   - 點選「Google Drive API」
   - 點選「啟用」

### 步驟 3：創建服務帳戶

1. **建立服務帳戶**
   - 在左側選單選擇「API 和服務」→「憑證」
   - 點選「建立憑證」→「服務帳戶」
   - 服務帳戶名稱：`wedding-game-backup`
   - 服務帳戶 ID：`wedding-game-backup`
   - 點選「建立並繼續」

2. **設定角色（可跳過）**
   - 直接點選「繼續」
   - 再點選「完成」

### 步驟 4：創建並下載金鑰

1. **創建金鑰**
   - 在憑證頁面找到剛創建的服務帳戶
   - 點選服務帳戶電子郵件
   - 切換到「金鑰」分頁
   - 點選「新增金鑰」→「建立新的金鑰」
   - 選擇「JSON」格式
   - 點選「建立」

2. **保存金鑰檔案**
   - 系統會自動下載 JSON 檔案
   - ⚠️ **重要**：妥善保管此檔案，包含敏感資訊

### 步驟 5：獲取服務帳戶資訊

從下載的 JSON 檔案中提取以下資訊：

```json
{
  "type": "service_account",
  "project_id": "your-project-id",
  "private_key_id": "key-id",
  "private_key": "-----BEGIN PRIVATE KEY-----\n....\n-----END PRIVATE KEY-----\n",
  "client_email": "wedding-game-backup@your-project.iam.gserviceaccount.com",
  "client_id": "123456789",
  "auth_uri": "https://accounts.google.com/o/oauth2/auth",
  "token_uri": "https://oauth2.googleapis.com/token"
}
```

您需要的是：
- `client_email`：服務帳戶電子郵件
- `private_key`：私鑰（包含 \\n 換行符號）

### 步驟 6：創建 Google Drive 備份資料夾

1. **開啟 Google Drive**
   - 前往 [Google Drive](https://drive.google.com/)
   - 使用您要儲存備份的 Google 帳號登入

2. **創建備份資料夾**
   - 右鍵點選空白處或點選「新增」
   - 選擇「資料夾」
   - 名稱：`WeddingGameBackup`
   - 點選「建立」

3. **分享資料夾給服務帳戶**
   - 右鍵點選剛創建的資料夾
   - 選擇「共用」
   - 在「新增使用者和群組」中輸入服務帳戶的電子郵件地址
   - 權限設為「編輯者」
   - 點選「傳送」

4. **獲取資料夾 ID（可選但建議）**
   - 開啟 `WeddingGameBackup` 資料夾
   - 從網址列複製資料夾 ID
   - 網址格式：`https://drive.google.com/drive/folders/FOLDER_ID`
   - `FOLDER_ID` 就是您需要的資料夾 ID

## ⚙️ 環境變數設定

### Railway 部署設定

在 Railway 專案的環境變數中添加：

```
GOOGLE_SERVICE_ACCOUNT_EMAIL=wedding-game-backup@your-project.iam.gserviceaccount.com
GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY=-----BEGIN PRIVATE KEY-----\nMIIEvgIBADANBgkqhkiG9w0BAQEFAASCBKgwggSkAgEAAoIBAQC...\n-----END PRIVATE KEY-----\n
GOOGLE_DRIVE_BACKUP_FOLDER_ID=1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms
```

**注意事項**：
- `PRIVATE_KEY` 必須包含 `\n` 換行符號
- `FOLDER_ID` 是可選的，如果不設定系統會自動創建

### 本地開發設定

創建 `.env` 檔案：
```env
# Google Drive 備份設定
GOOGLE_SERVICE_ACCOUNT_EMAIL=wedding-game-backup@your-project.iam.gserviceaccount.com
GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nMIIEvgIBADANBgkqhkiG9w0BAQEFAASCBKgwggSkAgEAAoIBAQC...\n-----END PRIVATE KEY-----\n"
GOOGLE_DRIVE_BACKUP_FOLDER_ID=1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms
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
   - 顯示備份進度和結果

3. **開啟備份資料夾**
   - 點選「開啟備份資料夾」
   - 直接在新分頁開啟 Google Drive 備份資料夾

## 📁 Google Drive 檔案結構

備份的照片會儲存在：
```
Google Drive/
└── WeddingGameBackup/
    ├── uuid1.jpg
    ├── uuid2.jpg
    └── ...
```

## 🔧 疑難排解

### 常見錯誤

1. **`未設定 Google Drive 服務帳戶認證`**
   - 檢查環境變數是否正確設定
   - 確認變數名稱拼寫正確
   - 確認 JSON 金鑰檔案內容正確

2. **`無法連接到 Google Drive`**
   - 檢查服務帳戶是否有權限存取資料夾
   - 確認 Google Drive API 已啟用
   - 檢查私鑰格式是否正確（包含 \\n）

3. **`資料夾存取被拒絕`**
   - 確認已將資料夾分享給服務帳戶
   - 檢查服務帳戶電子郵件是否正確
   - 確認權限設為「編輯者」

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

## 📊 備份監控

系統提供詳細的備份資訊：
- **連接狀態**：Google Drive API 連接是否正常
- **資料夾 ID**：備份資料夾的唯一識別碼
- **備份數量**：已備份的照片總數
- **最後備份時間**：最近一次備份的時間
- **檔案清單**：所有備份檔案的詳細資訊和直接連結

## 🛡️ 安全性考量

1. **服務帳戶安全**
   - 私鑰是敏感資訊，僅存儲在環境變數中
   - 不要將 JSON 金鑰檔案包含在程式碼中
   - 定期輪換服務帳戶金鑰

2. **權限最小化**
   - 服務帳戶僅有存取指定資料夾的權限
   - 使用 `drive.file` 範圍，不會存取其他檔案

3. **資料夾權限**
   - 備份資料夾僅分享給服務帳戶
   - 可設定為私人資料夾，提高安全性

## 💡 進階設定

### 自動資料夾 ID 設定

如果您沒有設定 `GOOGLE_DRIVE_BACKUP_FOLDER_ID`，系統會：
1. 自動搜尋名為 `WeddingGameBackup` 的資料夾
2. 如果不存在，會自動創建
3. 在日誌中顯示建議的資料夾 ID

### 批量處理優化

系統已針對 Google Drive API 限制進行優化：
- 上傳間隔：200ms
- 自動重試機制
- 檔案重複檢查

## 🎉 完成設定

設定完成後，您的婚禮遊戲系統將具備：
- ✅ **雙重備份**：本地 + Google Drive
- ✅ **自動化備份**：無需手動操作
- ✅ **管理介面**：方便的備份管理和直接存取
- ✅ **監控功能**：即時備份狀態和檔案連結

現在您可以放心使用婚禮遊戲系統，所有珍貴的照片都會安全地備份到您的 Google Drive 中！

## 🔗 相關連結

- [Google Cloud Console](https://console.cloud.google.com/)
- [Google Drive API 文件](https://developers.google.com/drive/api/v3/reference)
- [服務帳戶說明](https://cloud.google.com/iam/docs/service-accounts)
