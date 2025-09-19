// 簡化的 webhook 測試檔案
const express = require('express');
const app = express();

// 中間件
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 簡單的 webhook 處理器（用於測試）
app.post('/webhook', (req, res) => {
  console.log('=== Webhook Debug ===');
  console.log('Headers:', req.headers);
  console.log('Body:', JSON.stringify(req.body, null, 2));
  console.log('Environment Variables:');
  console.log('LINE_CHANNEL_ACCESS_TOKEN:', process.env.LINE_CHANNEL_ACCESS_TOKEN ? '已設定' : '未設定');
  console.log('LINE_CHANNEL_SECRET:', process.env.LINE_CHANNEL_SECRET ? '已設定' : '未設定');
  console.log('===================');
  
  try {
    // 檢查是否為 Line 的請求
    if (!req.body) {
      console.log('沒有 body');
      return res.status(400).json({ error: 'No body' });
    }
    
    // 檢查是否有 events
    if (!req.body.events) {
      console.log('沒有 events');
      return res.status(400).json({ error: 'No events' });
    }
    
    // Line 驗證請求（空 events）
    if (req.body.events.length === 0) {
      console.log('Line 驗證請求 - 回應 200');
      return res.status(200).json({ message: 'OK' });
    }
    
    console.log(`收到 ${req.body.events.length} 個事件`);
    
    // 簡單回應成功
    res.status(200).json({ message: 'Events processed' });
    
  } catch (error) {
    console.error('處理錯誤:', error);
    res.status(500).json({ error: error.message });
  }
});

// 健康檢查
app.get('/', (req, res) => {
  res.json({ 
    status: 'OK', 
    message: 'Wedding Game Debug Server',
    env: {
      NODE_ENV: process.env.NODE_ENV,
      hasToken: !!process.env.LINE_CHANNEL_ACCESS_TOKEN,
      hasSecret: !!process.env.LINE_CHANNEL_SECRET
    }
  });
});

// 啟動伺服器
const port = process.env.PORT || 3000;
const host = process.env.NODE_ENV === 'production' ? '0.0.0.0' : 'localhost';

app.listen(port, host, () => {
  console.log(`Debug server running on port ${port}`);
  console.log('Environment check:');
  console.log('- NODE_ENV:', process.env.NODE_ENV);
  console.log('- LINE_CHANNEL_ACCESS_TOKEN:', process.env.LINE_CHANNEL_ACCESS_TOKEN ? '已設定' : '未設定');
  console.log('- LINE_CHANNEL_SECRET:', process.env.LINE_CHANNEL_SECRET ? '已設定' : '未設定');
});
