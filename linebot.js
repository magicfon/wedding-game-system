const line = require('@line/bot-sdk');
const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

const config = require('./config');
const database = require('./database');
const GoogleDriveBackup = require('./google-drive-backup');

// Line Bot 設定
const lineConfig = {
  channelAccessToken: config.line.channelAccessToken,
  channelSecret: config.line.channelSecret,
};

const client = new line.Client(lineConfig);

// 初始化 Google Drive 備份
const googleDriveBackup = new GoogleDriveBackup();

// 處理 Line Bot 事件
async function handleEvent(event) {
  try {
    console.log('收到事件:', event);

    if (event.type === 'follow') {
      // 用戶加入好友
      await handleFollow(event);
    } else if (event.type === 'message') {
      if (event.message.type === 'text') {
        await handleTextMessage(event);
      } else if (event.message.type === 'image') {
        await handleImageMessage(event);
      }
    } else {
      console.log('未處理的事件類型:', event.type);
    }
  } catch (error) {
    console.error('處理事件錯誤:', error);
    console.error('事件內容:', event);
    // 不要拋出錯誤，避免影響其他事件處理
  }
}

// 處理用戶加入好友
async function handleFollow(event) {
  const userId = event.source.userId;
  
  try {
    // 獲取用戶資料
    const profile = await client.getProfile(userId);
    
    // 將用戶加入資料庫
    await database.addUser(userId, profile.displayName, profile.pictureUrl);
    
    // 廣播參與者數量更新
    const count = await database.getUserCount();
    if (global.io) {
      global.io.emit('participants-updated', { count });
    }
    
    // 發送歡迎訊息
    const welcomeMessage = {
      type: 'text',
      text: `歡迎 ${profile.displayName} 參加婚禮互動遊戲！🎉\n\n遊戲說明：\n1. 快問快答：當主持人出題時，直接回覆您的答案\n2. 快門傳情：隨時傳送照片參與投票活動\n3. 投票時請回覆照片編號 (例如：1, 2, 3...)\n\n祝您玩得愉快！❤️`
    };
    
    await client.replyMessage(event.replyToken, welcomeMessage);
    
  } catch (error) {
    console.error('處理加入好友錯誤:', error);
  }
}

// 處理文字訊息
async function handleTextMessage(event) {
  const userId = event.source.userId;
  const messageText = event.message.text;
  
  console.log(`處理文字訊息: "${messageText}" 來自用戶 ${userId}`);
  
  try {
    // 先檢查快問快答是否進行中（優先級較高）
    console.log('檢查快問快答狀態...');
    const qaState = await database.getGameState('qa');
    console.log('快問快答狀態:', qaState);
    
    if (qaState && qaState.status === 'active') {
      console.log(`快問快答進行中，問題 ID: ${qaState.data.questionId}`);
      await handleQAAnswer(event, userId, messageText, qaState.data.questionId);
      return;
    }
    
    // 檢查是否為投票 (數字) - 只有在沒有快問快答時才處理
    const voteNumber = parseInt(messageText.trim());
    if (!isNaN(voteNumber) && voteNumber > 0) {
      console.log(`檢測到投票數字: ${voteNumber}`);
      await handleVote(event, userId, voteNumber);
      return;
    }
    
    console.log('沒有進行中的遊戲，發送一般回覆');
    // 一般回覆
    const replyMessage = {
      type: 'text',
      text: '目前沒有進行中的遊戲。請等待主持人開始遊戲！'
    };
    
    await client.replyMessage(event.replyToken, replyMessage);
    
  } catch (error) {
    console.error('處理文字訊息錯誤:', error);
    console.error('錯誤堆疊:', error.stack);
  }
}

// 處理快問快答答案
async function handleQAAnswer(event, userId, answer, questionId) {
  console.log(`=== 處理快問快答答案 ===`);
  console.log(`用戶 ID: ${userId}`);
  console.log(`答案: "${answer}"`);
  console.log(`問題 ID: ${questionId}`);
  
  try {
    // 確保用戶存在於資料庫中
    console.log('確保用戶存在...');
    const profile = await client.getProfile(userId);
    await database.addUser(userId, profile.displayName, profile.pictureUrl);
    console.log(`用戶已確保存在: ${profile.displayName}`);
    
    // 儲存答案到資料庫
    console.log('儲存答案到資料庫...');
    const answerId = await database.addQAAnswer(userId, questionId, answer);
    console.log(`答案已儲存，ID: ${answerId}`);
    
    // 廣播新答案給 Web 介面
    console.log('廣播新答案給 Web 介面...');
    if (global.io) {
      global.io.emit('qa-new-answer', {
        userId,
        userName: profile.displayName,
        answer,
        submittedAt: new Date().toISOString()
      });
      console.log('WebSocket 廣播完成');
    } else {
      console.log('⚠️ global.io 不存在，無法廣播');
    }
    
    // 回覆確認訊息
    console.log('發送確認訊息...');
    const replyMessage = {
      type: 'text',
      text: `已收到您的答案：「${answer}」✅`
    };
    
    await client.replyMessage(event.replyToken, replyMessage);
    console.log('確認訊息已發送');
    console.log('=== 快問快答答案處理完成 ===');
    
  } catch (error) {
    console.error('處理快問快答答案錯誤:', error);
    console.error('錯誤堆疊:', error.stack);
    
    // 嘗試發送錯誤回覆
    try {
      await client.replyMessage(event.replyToken, {
        type: 'text',
        text: '抱歉，處理您的答案時發生錯誤，請稍後再試。'
      });
    } catch (replyError) {
      console.error('發送錯誤回覆失敗:', replyError);
    }
  }
}

// 處理投票
async function handleVote(event, userId, voteNumber) {
  try {
    // 檢查投票是否進行中
    const votingState = await database.getGameState('photo_voting');
    if (!votingState || votingState.status !== 'active') {
      const replyMessage = {
        type: 'text',
        text: '目前沒有進行中的投票活動！'
      };
      await client.replyMessage(event.replyToken, replyMessage);
      return;
    }
    
    // 獲取所有照片
    const photos = await database.getPhotos();
    if (voteNumber > photos.length) {
      const replyMessage = {
        type: 'text',
        text: `無效的照片編號！請輸入 1 到 ${photos.length} 之間的數字。`
      };
      await client.replyMessage(event.replyToken, replyMessage);
      return;
    }
    
    const photoId = photos[voteNumber - 1].id;
    const voted = await database.votePhoto(userId, photoId);
    
    let replyText;
    if (voted) {
      replyText = `投票成功！您投給了編號 ${voteNumber} 的照片 🗳️`;
      
      // 廣播投票更新
      if (global.io) {
        global.io.emit('photo-vote-updated');
      }
    } else {
      replyText = `您已經對編號 ${voteNumber} 的照片投過票了！`;
    }
    
    const replyMessage = {
      type: 'text',
      text: replyText
    };
    
    await client.replyMessage(event.replyToken, replyMessage);
    
  } catch (error) {
    console.error('處理投票錯誤:', error);
  }
}

// 處理圖片訊息
async function handleImageMessage(event) {
  const userId = event.source.userId;
  const messageId = event.message.id;
  
  try {
    // 獲取圖片內容
    const stream = await client.getMessageContent(messageId);
    
    // 生成唯一檔名
    const filename = `${uuidv4()}.jpg`;
    const filepath = path.join('uploads', filename);
    
    // 儲存圖片
    const writeStream = fs.createWriteStream(filepath);
    stream.pipe(writeStream);
    
    await new Promise((resolve, reject) => {
      writeStream.on('finish', resolve);
      writeStream.on('error', reject);
    });
    
    // 獲取用戶資料
    const profile = await client.getProfile(userId);
    
    // 儲存到資料庫
    await database.addPhoto(userId, filename, `${profile.displayName}_photo`);
    
    // 同時備份到 Google Drive
    try {
      const result = await googleDriveBackup.uploadFile(filepath, filename);
      if (result && result.error === 'quota_exceeded') {
        console.log(`⚠️ Google Drive 配額限制，但照片已成功儲存: ${filename}`);
      } else if (result) {
        console.log(`📸 照片已備份到 Google Drive: ${filename}`);
      } else {
        console.log(`⚠️ Google Drive 備份失敗，但照片已成功儲存: ${filename}`);
      }
    } catch (error) {
      console.log(`⚠️ Google Drive 備份失敗，但照片已成功儲存: ${filename}`);
    }
    
    // 廣播新照片給 Web 介面
    if (global.io) {
      global.io.emit('photo-uploaded', {
        userId,
        userName: profile.displayName,
        filename,
        uploadedAt: new Date().toISOString()
      });
    }
    
    // 回覆確認訊息
    const replyMessage = {
      type: 'text',
      text: '照片上傳成功！📸 感謝您的參與！'
    };
    
    await client.replyMessage(event.replyToken, replyMessage);
    
  } catch (error) {
    console.error('處理圖片訊息錯誤:', error);
  }
}

// 中間件
const middleware = line.middleware(lineConfig);

// Webhook 處理器
const webhookHandler = async (req, res) => {
  try {
    console.log('收到 Webhook 請求:', req.body);
    
    // 檢查請求格式
    if (!req.body || !req.body.events) {
      console.log('無效的請求格式');
      return res.status(400).end();
    }
    
    const events = req.body.events;
    console.log(`處理 ${events.length} 個事件`);
    
    // 如果是空事件（驗證請求），直接回應 200
    if (events.length === 0) {
      console.log('Line 驗證請求');
      return res.status(200).end();
    }
    
    // 處理事件
    await Promise.all(events.map(handleEvent));
    res.status(200).end();
  } catch (error) {
    console.error('Webhook 處理錯誤:', error);
    console.error('錯誤堆疊:', error.stack);
    res.status(500).json({ error: 'Internal server error' });
  }
};

module.exports = {
  middleware,
  webhookHandler,
  client
};

