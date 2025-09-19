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
  // 先檢查是否為 Line 的驗證請求
  if (req.body && req.body.events && req.body.events.length === 0) {
    console.log('Line webhook verification request');
    return res.status(200).end();
  }
  
  // 使用 Line SDK 中間件處理
  lineBot.middleware(req, res, () => {
    lineBot.webhookHandler(req, res);
  });
});

// API 路由

// 獲取參與者數量
app.get('/api/participants/count', async (req, res) => {
  try {
    const count = await database.getUserCount();
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
    const answers = await database.getQAAnswers(questionId);
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
