const express = require('express');
const { google } = require('googleapis');
const open = require('open');

// 設定您的 OAuth 憑證
const CLIENT_ID = process.env.CLIENT_ID || 'YOUR_CLIENT_ID'; // 請替換為您的用戶端 ID
const CLIENT_SECRET = process.env.CLIENT_SECRET || 'YOUR_CLIENT_SECRET'; // 請替換為您的用戶端密碼
const REDIRECT_URI = process.env.NODE_ENV === 'production' 
  ? 'https://web-production-f06f.up.railway.app/auth/callback'
  : 'http://localhost:3000/auth/callback';

const oauth2Client = new google.auth.OAuth2(
  CLIENT_ID,
  CLIENT_SECRET,
  REDIRECT_URI
);

const app = express();

// 生成授權 URL 並自動開啟瀏覽器
app.get('/auth', (req, res) => {
  const authUrl = oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: ['https://www.googleapis.com/auth/drive.file'],
    prompt: 'consent'
  });
  
  console.log('🔗 授權 URL:', authUrl);
  console.log('🌐 正在開啟瀏覽器...');
  
  // 自動開啟瀏覽器
  open(authUrl);
  
  res.send(`
    <h2>Google Drive OAuth 授權</h2>
    <p>瀏覽器應該已經自動開啟授權頁面。</p>
    <p>如果沒有，請手動複製以下連結：</p>
    <p><a href="${authUrl}" target="_blank">${authUrl}</a></p>
    <p>授權完成後，您會被重新導向回來。</p>
  `);
});

// 處理授權回調
app.get('/auth/callback', async (req, res) => {
  const code = req.query.code;
  
  if (!code) {
    return res.status(400).send('❌ 沒有收到授權碼');
  }
  
  try {
    console.log('📝 收到授權碼:', code);
    
    // 交換授權碼為 tokens
    const { tokens } = await oauth2Client.getAccessToken(code);
    
    console.log('🎉 成功獲取 tokens!');
    console.log('✅ Access Token:', tokens.access_token);
    console.log('🔄 Refresh Token:', tokens.refresh_token);
    
    res.send(`
      <h2>✅ OAuth 授權成功！</h2>
      <h3>請將以下資訊設定到 Railway 環境變數：</h3>
      <div style="background: #f0f0f0; padding: 20px; margin: 20px 0; font-family: monospace;">
        <strong>GOOGLE_OAUTH_CLIENT_ID=</strong>${CLIENT_ID}<br>
        <strong>GOOGLE_OAUTH_CLIENT_SECRET=</strong>${CLIENT_SECRET}<br>
        <strong>GOOGLE_OAUTH_REFRESH_TOKEN=</strong>${tokens.refresh_token}
      </div>
      <p>⚠️ <strong>重要</strong>：請妥善保存 Refresh Token，它不會過期！</p>
      <p>設定完成後，您可以關閉這個視窗。</p>
    `);
    
    // 5 秒後自動關閉伺服器
    setTimeout(() => {
      console.log('🔚 授權完成，關閉伺服器...');
      process.exit(0);
    }, 5000);
    
  } catch (error) {
    console.error('❌ 獲取 tokens 失敗:', error);
    res.status(500).send(`❌ 獲取 tokens 失敗: ${error.message}`);
  }
});

// 啟動伺服器
const PORT = 3000;
app.listen(PORT, () => {
  console.log('🚀 OAuth 授權伺服器啟動在 http://localhost:3000');
  console.log('📝 請先在程式碼中設定您的 CLIENT_ID 和 CLIENT_SECRET');
  console.log('🌐 然後前往 http://localhost:3000/auth 開始授權');
});
