const fs = require('fs');
const path = require('path');
const { google } = require('googleapis');

class GoogleDriveBackup {
  constructor() {
    this.clientEmail = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
    this.privateKey = process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY?.replace(/\\n/g, '\n');
    this.backupFolderId = process.env.GOOGLE_DRIVE_BACKUP_FOLDER_ID;
    
    // Google Drive 備份資料夾名稱
    this.backupFolderName = 'WeddingGameBackup';
    this.drive = null;
    
    this.initializeAuth();
  }

  // 初始化 Google Drive 認證
  initializeAuth() {
    try {
      if (!this.clientEmail || !this.privateKey) {
        console.log('⚠️ Google Drive 服務帳戶認證未設定');
        return;
      }

      const auth = new google.auth.GoogleAuth({
        credentials: {
          client_email: this.clientEmail,
          private_key: this.privateKey,
        },
        scopes: ['https://www.googleapis.com/auth/drive.file'],
      });

      this.drive = google.drive({ version: 'v3', auth });
      console.log('✅ Google Drive 認證初始化成功');
      
    } catch (error) {
      console.error('❌ Google Drive 認證初始化失敗:', error.message);
    }
  }

  // 檢查是否已設定 Google Drive 認證
  isConfigured() {
    return !!(this.clientEmail && this.privateKey && this.drive);
  }

  // 創建或獲取備份資料夾
  async ensureBackupFolder() {
    try {
      if (!this.drive) {
        throw new Error('Google Drive 未初始化');
      }

      // 如果已有資料夾 ID，直接使用
      if (this.backupFolderId) {
        console.log(`📁 使用指定的備份資料夾 ID: ${this.backupFolderId}`);
        return this.backupFolderId;
      }

      // 搜尋是否已存在備份資料夾
      const searchResponse = await this.drive.files.list({
        q: `name='${this.backupFolderName}' and mimeType='application/vnd.google-apps.folder' and trashed=false`,
        fields: 'files(id, name)',
      });

      if (searchResponse.data.files.length > 0) {
        const folderId = searchResponse.data.files[0].id;
        console.log(`📁 找到現有備份資料夾: ${this.backupFolderName} (${folderId})`);
        return folderId;
      }

      // 創建新的備份資料夾
      console.log(`📁 創建新的備份資料夾: ${this.backupFolderName}`);
      const createResponse = await this.drive.files.create({
        resource: {
          name: this.backupFolderName,
          mimeType: 'application/vnd.google-apps.folder',
        },
        fields: 'id',
      });

      const folderId = createResponse.data.id;
      console.log(`✅ 備份資料夾創建成功，ID: ${folderId}`);
      
      // 建議用戶將此 ID 設為環境變數
      console.log(`💡 建議將以下 ID 設為環境變數 GOOGLE_DRIVE_BACKUP_FOLDER_ID: ${folderId}`);
      
      return folderId;
      
    } catch (error) {
      console.error('❌ 確保備份資料夾失敗:', error.message);
      throw error;
    }
  }

  // 上傳檔案到 Google Drive
  async uploadFile(localFilePath, fileName) {
    try {
      if (!this.isConfigured()) {
        console.log('⚠️ Google Drive 備份未設定，跳過上傳');
        return null;
      }

      console.log(`☁️ 上傳檔案到 Google Drive: ${fileName}`);

      const folderId = await this.ensureBackupFolder();

      // 檢查檔案是否已存在
      const existingFiles = await this.drive.files.list({
        q: `name='${fileName}' and parents in '${folderId}' and trashed=false`,
        fields: 'files(id, name)',
      });

      let fileId = null;
      const fileMetadata = {
        name: fileName,
        parents: [folderId],
      };

      const media = {
        mimeType: 'image/jpeg',
        body: fs.createReadStream(localFilePath),
      };

      if (existingFiles.data.files.length > 0) {
        // 更新現有檔案
        fileId = existingFiles.data.files[0].id;
        console.log(`🔄 更新現有檔案: ${fileName}`);
        
        const response = await this.drive.files.update({
          fileId: fileId,
          media: media,
        });
        
        fileId = response.data.id;
      } else {
        // 創建新檔案
        console.log(`📤 上傳新檔案: ${fileName}`);
        
        const response = await this.drive.files.create({
          resource: fileMetadata,
          media: media,
          fields: 'id',
        });
        
        fileId = response.data.id;
      }

      console.log(`✅ 檔案上傳到 Google Drive 成功: ${fileName} (${fileId})`);
      return { id: fileId, name: fileName };
      
    } catch (error) {
      console.error(`❌ 上傳檔案到 Google Drive 失敗 (${fileName}):`, error.message);
      // 不拋出錯誤，讓主要功能繼續運作
      return null;
    }
  }

  // 批量備份所有照片到 Google Drive
  async backupAllPhotos() {
    try {
      if (!this.isConfigured()) {
        console.log('⚠️ Google Drive 備份未設定，無法執行批量備份');
        return { success: false, message: 'Google Drive 未設定' };
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

      console.log(`🔄 開始批量備份 ${files.length} 張照片到 Google Drive...`);
      
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
        
        // 避免 API 限制，每次上傳間隔 200ms
        await new Promise(resolve => setTimeout(resolve, 200));
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

  // 獲取 Google Drive 備份狀態
  async getBackupStatus() {
    try {
      if (!this.isConfigured()) {
        return {
          configured: false,
          message: '未設定 Google Drive 服務帳戶認證'
        };
      }

      const folderId = await this.ensureBackupFolder();
      
      // 獲取備份資料夾中的檔案
      const filesResponse = await this.drive.files.list({
        q: `parents in '${folderId}' and trashed=false and (name contains '.jpg' or name contains '.jpeg' or name contains '.png')`,
        fields: 'files(id, name, size, modifiedTime, webViewLink)',
        orderBy: 'modifiedTime desc',
      });

      const backupFiles = filesResponse.data.files || [];

      return {
        configured: true,
        folderExists: true,
        folderId: folderId,
        backupCount: backupFiles.length,
        lastModified: backupFiles.length > 0 ? 
          new Date(backupFiles[0].modifiedTime).getTime() : null,
        files: backupFiles.map(f => ({
          id: f.id,
          name: f.name,
          size: parseInt(f.size) || 0,
          modified: f.modifiedTime,
          viewLink: f.webViewLink
        }))
      };
      
    } catch (error) {
      console.error('❌ 獲取 Google Drive 備份狀態失敗:', error.message);
      return {
        configured: true,
        error: true,
        message: '無法連接到 Google Drive: ' + error.message
      };
    }
  }

  // 獲取備份資料夾的分享連結
  async getBackupFolderLink() {
    try {
      if (!this.isConfigured()) {
        return null;
      }

      const folderId = await this.ensureBackupFolder();
      
      // 設定資料夾為可檢視（任何人都可以透過連結檢視）
      await this.drive.permissions.create({
        fileId: folderId,
        resource: {
          role: 'reader',
          type: 'anyone',
        },
      });

      // 獲取分享連結
      const file = await this.drive.files.get({
        fileId: folderId,
        fields: 'webViewLink',
      });

      return file.data.webViewLink;
      
    } catch (error) {
      console.error('❌ 獲取備份資料夾連結失敗:', error.message);
      return null;
    }
  }
}

module.exports = GoogleDriveBackup;
