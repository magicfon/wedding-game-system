const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
const path = require('path');
const multer = require('multer');
const { v4: uuidv4 } = require('uuid');

const config = require('./config');
const database = require('./database');
const lineBot = require('./linebot');
const GoogleDriveBackup = require('./google-drive-backup');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

// 中間件設定
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));

// 檔案上傳設定
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/')
  },
  filename: function (req, file, cb) {
    const uniqueName = uuidv4() + path.extname(file.originalname);
    cb(null, uniqueName);
  }
});
const upload = multer({ storage: storage });

// 創建上傳目錄
const fs = require('fs');
if (!fs.existsSync('uploads')) {
  fs.mkdirSync('uploads');
}

// Line Bot webhook
app.post('/webhook', (req, res) => {
  console.log('=== Line Webhook 請求收到 ===');
  console.log('Headers:', JSON.stringify(req.headers, null, 2));
  console.log('Body:', JSON.stringify(req.body, null, 2));
  console.log('============================');
  
  // 先檢查是否為 Line 的驗證請求
  if (req.body && req.body.events && req.body.events.length === 0) {
    console.log('Line webhook verification request - 回應 200');
    return res.status(200).end();
  }
  
  // 暫時跳過 Line SDK 中間件，直接處理
  try {
    console.log('直接處理 webhook 請求（跳過中間件）');
    lineBot.webhookHandler(req, res);
  } catch (error) {
    console.error('Webhook 處理錯誤:', error);
    console.error('錯誤堆疊:', error.stack);
    res.status(500).json({ error: 'Webhook processing failed', details: error.message });
  }
});

// API 路由

// 獲取參與者數量
app.get('/api/participants/count', async (req, res) => {
  try {
    // 嘗試從 Line API 獲取好友數量
    let count = 0;
    
    try {
      const lineBot = require('./linebot');
      // 注意：Line API 不直接提供好友總數，我們使用資料庫數量 + 預設值
      const dbCount = await database.getUserCount();
      
      // 如果資料庫為空但系統已部署，假設至少有1個好友（您）
      count = dbCount > 0 ? dbCount : 1;
      
    } catch (lineError) {
      console.log('無法從 Line API 獲取好友數，使用資料庫數量');
      count = await database.getUserCount();
    }
    
    res.json({ count });
  } catch (error) {
    console.error('獲取參與者數量錯誤:', error);
    res.status(500).json({ error: '伺服器錯誤' });
  }
});

// 獲取排行榜
app.get('/api/leaderboard', async (req, res) => {
  try {
    const users = await database.getUsers();
    res.json(users);
  } catch (error) {
    console.error('獲取排行榜錯誤:', error);
    res.status(500).json({ error: '伺服器錯誤' });
  }
});

// 管理員登入
app.post('/api/admin/login', (req, res) => {
  const { password } = req.body;
  if (password === config.admin.password) {
    res.json({ success: true, token: 'admin-token' });
  } else {
    res.status(401).json({ error: '密碼錯誤' });
  }
});

// 管理員更新分數
app.post('/api/admin/score', async (req, res) => {
  const { userId, scoreChange } = req.body;
  try {
    await database.updateUserScore(userId, scoreChange);
    const users = await database.getUsers();
    
    // 廣播更新給所有客戶端
    io.emit('leaderboard-updated', users);
    
    res.json({ success: true });
  } catch (error) {
    console.error('更新分數錯誤:', error);
    res.status(500).json({ error: '伺服器錯誤' });
  }
});

// 快問快答相關 API

// 開始新問題
app.post('/api/qa/start', async (req, res) => {
  const { question } = req.body;
  try {
    const questionId = Date.now();
    await database.setGameState('qa', 'active', { 
      questionId, 
      question, 
      startTime: new Date().toISOString() 
    });
    
    // 廣播新問題給所有客戶端
    io.emit('qa-question-started', { questionId, question });
    
    res.json({ success: true, questionId });
  } catch (error) {
    console.error('開始問題錯誤:', error);
    res.status(500).json({ error: '伺服器錯誤' });
  }
});

// 結束問題
app.post('/api/qa/end', async (req, res) => {
  try {
    await database.setGameState('qa', 'ended');
    
    // 廣播問題結束
    io.emit('qa-question-ended');
    
    res.json({ success: true });
  } catch (error) {
    console.error('結束問題錯誤:', error);
    res.status(500).json({ error: '伺服器錯誤' });
  }
});

// 獲取問題答案
app.get('/api/qa/answers/:questionId', async (req, res) => {
  const { questionId } = req.params;
  try {
    console.log(`獲取問題 ${questionId} 的答案`);
    const answers = await database.getQAAnswers(questionId);
    console.log(`找到 ${answers.length} 個答案:`, answers);
    res.json(answers);
  } catch (error) {
    console.error('獲取答案錯誤:', error);
    res.status(500).json({ error: '伺服器錯誤' });
  }
});

// 獲取當前問題狀態
app.get('/api/qa/status', async (req, res) => {
  try {
    const gameState = await database.getGameState('qa');
    res.json(gameState || { status: 'inactive' });
  } catch (error) {
    console.error('獲取問題狀態錯誤:', error);
    res.status(500).json({ error: '伺服器錯誤' });
  }
});

// 照片遊戲相關 API

// 獲取所有照片
app.get('/api/photos', async (req, res) => {
  try {
    const photos = await database.getPhotos();
    res.json(photos);
  } catch (error) {
    console.error('獲取照片錯誤:', error);
    res.status(500).json({ error: '伺服器錯誤' });
  }
});

// 獲取得票前五名照片
app.get('/api/photos/top', async (req, res) => {
  try {
    const photos = await database.getTopPhotos(5);
    res.json(photos);
  } catch (error) {
    console.error('獲取熱門照片錯誤:', error);
    res.status(500).json({ error: '伺服器錯誤' });
  }
});

// 開始投票
app.post('/api/photos/voting/start', async (req, res) => {
  try {
    await database.setGameState('photo_voting', 'active', {
      startTime: new Date().toISOString()
    });
    
    // 廣播投票開始
    io.emit('photo-voting-started');
    
    res.json({ success: true });
  } catch (error) {
    console.error('開始投票錯誤:', error);
    res.status(500).json({ error: '伺服器錯誤' });
  }
});

// 結束投票
app.post('/api/photos/voting/end', async (req, res) => {
  try {
    await database.setGameState('photo_voting', 'ended');
    
    // 廣播投票結束
    io.emit('photo-voting-ended');
    
    res.json({ success: true });
  } catch (error) {
    console.error('結束投票錯誤:', error);
    res.status(500).json({ error: '伺服器錯誤' });
  }
});

// 獲取投票狀態
app.get('/api/photos/voting/status', async (req, res) => {
  try {
    const gameState = await database.getGameState('photo_voting');
    res.json(gameState || { status: 'inactive' });
  } catch (error) {
    console.error('獲取投票狀態錯誤:', error);
    res.status(500).json({ error: '伺服器錯誤' });
  }
});

// 提供上傳的照片
app.use('/uploads', express.static('uploads'));

// 初始化 Google Drive 備份
const googleDriveBackup = new GoogleDriveBackup();

// 測試端點：手動添加用戶
app.post('/api/test/add-user', async (req, res) => {
  try {
    const testUserId = 'test-user-' + Date.now();
    await database.addUser(testUserId, '測試用戶', null);
    const count = await database.getUserCount();
    
    // 廣播更新
    io.emit('participants-updated', { count });
    
    res.json({ 
      success: true, 
      message: '測試用戶添加成功',
      userId: testUserId,
      totalCount: count
    });
  } catch (error) {
    console.error('添加測試用戶錯誤:', error);
    res.status(500).json({ error: error.message });
  }
});

// 測試端點：檢查資料庫狀態
app.get('/api/test/db-status', async (req, res) => {
  try {
    const count = await database.getUserCount();
    const users = await database.getUsers();
    
    res.json({
      userCount: count,
      users: users,
      dbPath: require('./config').database.path
    });
  } catch (error) {
    console.error('檢查資料庫狀態錯誤:', error);
    res.status(500).json({ error: error.message });
  }
});

// 測試端點：模擬 Line Webhook 請求
app.post('/api/test/webhook', (req, res) => {
  console.log('=== 測試 Webhook 收到 POST 請求 ===');
  console.log('Headers:', JSON.stringify(req.headers, null, 2));
  console.log('Body:', JSON.stringify(req.body, null, 2));
  console.log('===============================');
  
  res.json({ 
    success: true, 
    message: '測試 Webhook 請求收到',
    receivedData: req.body 
  });
});

// 測試端點：GET 版本用於瀏覽器直接測試
app.get('/api/test/webhook', (req, res) => {
  console.log('=== 測試 Webhook 收到 GET 請求 ===');
  console.log('Query:', JSON.stringify(req.query, null, 2));
  console.log('===============================');
  
  res.json({ 
    success: true, 
    message: '測試 Webhook GET 請求收到',
    note: '如果您看到這個訊息，表示伺服器能正常接收請求'
  });
});

// 測試端點：檢查環境變數
app.get('/api/test/env-check', (req, res) => {
  res.json({
    hasLineToken: !!process.env.LINE_CHANNEL_ACCESS_TOKEN,
    hasLineSecret: !!process.env.LINE_CHANNEL_SECRET,
    nodeEnv: process.env.NODE_ENV,
    tokenPrefix: process.env.LINE_CHANNEL_ACCESS_TOKEN ? 
      process.env.LINE_CHANNEL_ACCESS_TOKEN.substring(0, 10) + '...' : 'not set'
  });
});

// 測試端點：檢查快問快答狀態
app.get('/api/test/qa-status', async (req, res) => {
  try {
    const qaState = await database.getGameState('qa');
    const allAnswers = qaState && qaState.data ? 
      await database.getQAAnswers(qaState.data.questionId) : [];
    
    res.json({
      gameState: qaState,
      answersCount: allAnswers.length,
      answers: allAnswers,
      currentTime: new Date().toISOString()
    });
  } catch (error) {
    console.error('檢查快問快答狀態錯誤:', error);
    res.status(500).json({ error: error.message });
  }
});

// 測試端點：模擬添加答案
app.post('/api/test/add-answer', async (req, res) => {
  try {
    const { questionId, answer } = req.body;
    const testUserId = 'test-user-' + Date.now();
    
    // 確保用戶存在
    await database.addUser(testUserId, '測試用戶', null);
    
    // 添加答案
    const answerId = await database.addQAAnswer(testUserId, questionId || 123, answer || '測試答案');
    
    // 廣播更新
    if (global.io) {
      global.io.emit('qa-new-answer', {
        userId: testUserId,
        userName: '測試用戶',
        answer: answer || '測試答案',
        submittedAt: new Date().toISOString()
      });
    }
    
    res.json({
      success: true,
      answerId,
      message: '測試答案添加成功'
    });
  } catch (error) {
    console.error('添加測試答案錯誤:', error);
    res.status(500).json({ error: error.message });
  }
});

// Google Drive 備份管理 API
app.get('/api/admin/backup/status', requireAuth, async (req, res) => {
  try {
    const status = await googleDriveBackup.getBackupStatus();
    res.json(status);
  } catch (error) {
    console.error('獲取備份狀態錯誤:', error);
    res.status(500).json({ error: '獲取備份狀態失敗' });
  }
});

app.post('/api/admin/backup/all', requireAuth, async (req, res) => {
  try {
    console.log('🔄 開始手動批量備份...');
    const result = await googleDriveBackup.backupAllPhotos();
    res.json(result);
  } catch (error) {
    console.error('批量備份錯誤:', error);
    res.status(500).json({ error: '批量備份失敗' });
  }
});

app.get('/api/admin/backup/folder-link', requireAuth, async (req, res) => {
  try {
    const link = await googleDriveBackup.getBackupFolderLink();
    res.json({ link });
  } catch (error) {
    console.error('獲取備份資料夾連結錯誤:', error);
    res.status(500).json({ error: '獲取連結失敗' });
  }
});

// Socket.IO 連接處理
io.on('connection', (socket) => {
  console.log('客戶端已連接:', socket.id);
  
  socket.on('disconnect', () => {
    console.log('客戶端已斷線:', socket.id);
  });
});

// 全域 Socket.IO 實例，讓其他模組可以使用
global.io = io;

// 啟動伺服器
const port = process.env.PORT || config.server.port;
const host = process.env.NODE_ENV === 'production' ? '0.0.0.0' : config.server.host;

server.listen(port, host, () => {
  console.log(`婚禮遊戲伺服器運行在 port ${port}`);
  console.log('請確保已設定 Line Bot 的 Channel Access Token 和 Channel Secret');
  
  if (process.env.NODE_ENV !== 'production') {
    console.log(`本地網址: http://${config.server.host}:${port}`);
  }
});
