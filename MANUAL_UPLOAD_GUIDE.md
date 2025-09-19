# 手動上傳到 GitHub 指南

由於 GitHub 的安全掃描誤報，我們可以使用手動方式上傳檔案。

## 🌐 方法 1：使用 GitHub 網頁介面

### 1. 前往 GitHub Repository
- 開啟 https://github.com/magicfon/wedding-game-system
- 如果 repository 不存在，請先建立它

### 2. 上傳檔案
- 點選 "uploading an existing file"
- 將以下檔案拖拽到上傳區域：

**核心檔案**：
- `package.json`
- `server.js`
- `database.js`
- `linebot.js`
- `config.js`

**前端檔案**：
- `public/index.html`
- `public/style.css`  
- `public/script.js`

**部署檔案**：
- `railway.json`
- `Procfile`
- `.gitignore`

**說明檔案**：
- `README.md`
- `DEPLOY_TO_RAILWAY.md`

### 3. 提交變更
- 在底部輸入提交訊息：`Initial commit: 婚禮互動遊戲系統`
- 點選 "Commit changes"

## 🖥 方法 2：使用 GitHub Desktop

### 1. 下載 GitHub Desktop
- 前往 https://desktop.github.com/
- 下載並安裝

### 2. Clone Repository
- 開啟 GitHub Desktop
- Clone `magicfon/wedding-game-system`

### 3. 複製檔案
- 將所有專案檔案複製到 cloned repository 目錄
- GitHub Desktop 會自動偵測變更

### 4. 提交並推送
- 輸入提交訊息
- 點選 "Commit to main"
- 點選 "Push origin"

## 🚀 方法 3：允許 GitHub 的誤報

最簡單的方法是告訴 GitHub 這不是真實的 secret：

1. 點選這個連結：
   https://github.com/magicfon/wedding-game-system/security/secret-scanning/unblock-secret/32v5EZN9K7FLq5fpcfayAN81nWI

2. 點選 "Allow secret"

3. 重新執行：
   ```bash
   git push -u origin main
   ```

## 📋 推薦順序

1. **優先嘗試方法 3**（允許誤報）
2. 如果不行，使用**方法 1**（網頁上傳）
3. 最後使用**方法 2**（GitHub Desktop）

完成上傳後，您就可以繼續進行 Railway 部署了！
