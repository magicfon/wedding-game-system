const line = require('@line/bot-sdk');
const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

const config = require('./config');
const database = require('./database');

// Line Bot 設定
const lineConfig = {
  channelAccessToken: config.line.channelAccessToken,
  channelSecret: config.line.channelSecret,
};

const client = new line.Client(lineConfig);

// 處理 Line Bot 事件
async function handleEvent(event) {
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
  
  try {
    // 檢查是否為投票 (數字)
    const voteNumber = parseInt(messageText.trim());
    if (!isNaN(voteNumber) && voteNumber > 0) {
      await handleVote(event, userId, voteNumber);
      return;
    }
    
    // 檢查快問快答是否進行中
    const qaState = await database.getGameState('qa');
    if (qaState && qaState.status === 'active') {
      await handleQAAnswer(event, userId, messageText, qaState.data.questionId);
      return;
    }
    
    // 一般回覆
    const replyMessage = {
      type: 'text',
      text: '目前沒有進行中的遊戲。請等待主持人開始遊戲！'
    };
    
    await client.replyMessage(event.replyToken, replyMessage);
    
  } catch (error) {
    console.error('處理文字訊息錯誤:', error);
  }
}

// 處理快問快答答案
async function handleQAAnswer(event, userId, answer, questionId) {
  try {
    // 儲存答案到資料庫
    await database.addQAAnswer(userId, questionId, answer);
    
    // 獲取用戶資料
    const profile = await client.getProfile(userId);
    
    // 廣播新答案給 Web 介面
    if (global.io) {
      global.io.emit('qa-new-answer', {
        userId,
        userName: profile.displayName,
        answer,
        submittedAt: new Date().toISOString()
      });
    }
    
    // 回覆確認訊息
    const replyMessage = {
      type: 'text',
      text: `已收到您的答案：「${answer}」✅`
    };
    
    await client.replyMessage(event.replyToken, replyMessage);
    
  } catch (error) {
    console.error('處理快問快答答案錯誤:', error);
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
    const events = req.body.events;
    await Promise.all(events.map(handleEvent));
    res.status(200).end();
  } catch (error) {
    console.error('Webhook 處理錯誤:', error);
    res.status(500).end();
  }
};

module.exports = {
  middleware,
  webhookHandler,
  client
};

