const fs = require('fs');
const axios = require('axios');
const FormData = require('form-data');
const path = require('path');

class OneDriveBackup {
  constructor() {
    this.clientId = process.env.ONEDRIVE_CLIENT_ID;
    this.clientSecret = process.env.ONEDRIVE_CLIENT_SECRET;
    this.refreshToken = process.env.ONEDRIVE_REFRESH_TOKEN;
    this.accessToken = null;
    this.tokenExpiry = null;
    
    // OneDrive 備份資料夾名稱
    this.backupFolder = 'WeddingGameBackup';
  }

  // 檢查是否已設定 OneDrive 認證
  isConfigured() {
    return !!(this.clientId && this.clientSecret && this.refreshToken);
  }

  // 獲取或更新 Access Token
  async getAccessToken() {
    try {
      // 如果 token 仍有效，直接返回
      if (this.accessToken && this.tokenExpiry && Date.now() < this.tokenExpiry) {
        return this.accessToken;
      }

      console.log('🔄 更新 OneDrive Access Token...');
      
      const response = await axios.post('https://login.microsoftonline.com/common/oauth2/v2.0/token', 
        new URLSearchParams({
          client_id: this.clientId,
          client_secret: this.clientSecret,
          refresh_token: this.refreshToken,
          grant_type: 'refresh_token',
          scope: 'https://graph.microsoft.com/Files.ReadWrite'
        }), {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
          }
        }
      );

      this.accessToken = response.data.access_token;
      // 設定 token 過期時間（提前 5 分鐘更新）
      this.tokenExpiry = Date.now() + (response.data.expires_in - 300) * 1000;
      
      console.log('✅ OneDrive Access Token 更新成功');
      return this.accessToken;
      
    } catch (error) {
      console.error('❌ 獲取 OneDrive Access Token 失敗:', error.response?.data || error.message);
      throw error;
    }
  }

  // 確保備份資料夾存在
  async ensureBackupFolder() {
    try {
      const token = await this.getAccessToken();
      
      // 檢查資料夾是否存在
      try {
        await axios.get(`https://graph.microsoft.com/v1.0/me/drive/root:/${this.backupFolder}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        console.log(`📁 OneDrive 備份資料夾 "${this.backupFolder}" 已存在`);
      } catch (error) {
        if (error.response?.status === 404) {
          // 資料夾不存在，創建它
          console.log(`📁 創建 OneDrive 備份資料夾 "${this.backupFolder}"...`);
          await axios.post('https://graph.microsoft.com/v1.0/me/drive/root/children', {
            name: this.backupFolder,
            folder: {},
            '@microsoft.graph.conflictBehavior': 'rename'
          }, {
            headers: { 
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          });
          console.log('✅ OneDrive 備份資料夾創建成功');
        } else {
          throw error;
        }
      }
    } catch (error) {
      console.error('❌ 確保 OneDrive 備份資料夾失敗:', error.response?.data || error.message);
      throw error;
    }
  }

  // 上傳檔案到 OneDrive
  async uploadFile(localFilePath, fileName) {
    try {
      if (!this.isConfigured()) {
        console.log('⚠️ OneDrive 備份未設定，跳過上傳');
        return null;
      }

      const token = await this.getAccessToken();
      await this.ensureBackupFolder();

      console.log(`☁️ 上傳檔案到 OneDrive: ${fileName}`);

      // 讀取檔案
      const fileBuffer = fs.readFileSync(localFilePath);
      
      // 上傳檔案
      const response = await axios.put(
        `https://graph.microsoft.com/v1.0/me/drive/root:/${this.backupFolder}/${fileName}:/content`,
        fileBuffer,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/octet-stream'
          },
          maxContentLength: Infinity,
          maxBodyLength: Infinity
        }
      );

      console.log(`✅ 檔案上傳到 OneDrive 成功: ${fileName}`);
      return response.data;
      
    } catch (error) {
      console.error(`❌ 上傳檔案到 OneDrive 失敗 (${fileName}):`, error.response?.data || error.message);
      // 不拋出錯誤，讓主要功能繼續運作
      return null;
    }
  }

  // 批量下載所有照片到 OneDrive
  async backupAllPhotos() {
    try {
      if (!this.isConfigured()) {
        console.log('⚠️ OneDrive 備份未設定，無法執行批量備份');
        return { success: false, message: 'OneDrive 未設定' };
      }

      const uploadsDir = path.join(__dirname, 'uploads');
      
      if (!fs.existsSync(uploadsDir)) {
        return { success: false, message: '上傳目錄不存在' };
      }

      const files = fs.readdirSync(uploadsDir).filter(file => 
        file.toLowerCase().endsWith('.jpg') || 
        file.toLowerCase().endsWith('.jpeg') || 
        file.toLowerCase().endsWith('.png')
      );

      if (files.length === 0) {
        return { success: true, message: '沒有照片需要備份', count: 0 };
      }

      console.log(`🔄 開始批量備份 ${files.length} 張照片到 OneDrive...`);
      
      let successCount = 0;
      let failCount = 0;

      for (const file of files) {
        const localPath = path.join(uploadsDir, file);
        const result = await this.uploadFile(localPath, file);
        
        if (result) {
          successCount++;
        } else {
          failCount++;
        }
        
        // 避免 API 限制，每次上傳間隔 100ms
        await new Promise(resolve => setTimeout(resolve, 100));
      }

      console.log(`✅ 批量備份完成: 成功 ${successCount} 張，失敗 ${failCount} 張`);
      
      return {
        success: true,
        message: `備份完成: 成功 ${successCount} 張，失敗 ${failCount} 張`,
        total: files.length,
        success: successCount,
        failed: failCount
      };
      
    } catch (error) {
      console.error('❌ 批量備份失敗:', error.message);
      return { success: false, message: '批量備份失敗: ' + error.message };
    }
  }

  // 獲取 OneDrive 備份狀態
  async getBackupStatus() {
    try {
      if (!this.isConfigured()) {
        return {
          configured: false,
          message: '未設定 OneDrive 認證'
        };
      }

      const token = await this.getAccessToken();
      
      // 檢查備份資料夾
      const folderResponse = await axios.get(`https://graph.microsoft.com/v1.0/me/drive/root:/${this.backupFolder}:/children`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      const backupFiles = folderResponse.data.value.filter(item => 
        item.file && (
          item.name.toLowerCase().endsWith('.jpg') || 
          item.name.toLowerCase().endsWith('.jpeg') || 
          item.name.toLowerCase().endsWith('.png')
        )
      );

      return {
        configured: true,
        folderExists: true,
        backupCount: backupFiles.length,
        lastModified: backupFiles.length > 0 ? 
          Math.max(...backupFiles.map(f => new Date(f.lastModifiedDateTime).getTime())) : null,
        files: backupFiles.map(f => ({
          name: f.name,
          size: f.size,
          modified: f.lastModifiedDateTime
        }))
      };
      
    } catch (error) {
      if (error.response?.status === 404) {
        return {
          configured: true,
          folderExists: false,
          backupCount: 0,
          message: '備份資料夾不存在'
        };
      }
      
      console.error('❌ 獲取 OneDrive 備份狀態失敗:', error.response?.data || error.message);
      return {
        configured: true,
        error: true,
        message: '無法連接到 OneDrive: ' + (error.response?.data?.error?.message || error.message)
      };
    }
  }
}

module.exports = OneDriveBackup;
