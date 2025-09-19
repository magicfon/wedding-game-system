#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

console.log('🎉 婚禮互動遊戲系統啟動檢查 🎉\n');

// 檢查配置檔案
if (!fs.existsSync('config.js')) {
    console.log('❌ 找不到 config.js 檔案');
    console.log('請複製 config.example.js 為 config.js 並設定您的 Line Bot 資訊\n');
    process.exit(1);
}

const config = require('./config');

// 檢查 Line Bot 設定
if (config.line.channelAccessToken === 'your_line_channel_access_token' || 
    config.line.channelSecret === 'your_line_channel_secret') {
    console.log('⚠️  請設定您的 Line Bot Channel Access Token 和 Channel Secret');
    console.log('在 config.js 檔案中修改相關設定\n');
}

// 檢查上傳目錄
if (!fs.existsSync('uploads')) {
    console.log('📁 建立 uploads 目錄...');
    fs.mkdirSync('uploads');
    console.log('✅ uploads 目錄建立完成\n');
}

// 檢查資料庫目錄
const dbDir = path.dirname(config.database.path);
if (dbDir !== '.' && !fs.existsSync(dbDir)) {
    console.log(`📁 建立資料庫目錄: ${dbDir}...`);
    fs.mkdirSync(dbDir, { recursive: true });
    console.log('✅ 資料庫目錄建立完成\n');
}

console.log('🚀 啟動伺服器...\n');

// 啟動主伺服器
require('./server.js');

