// 實際設定檔案 (敏感資訊請使用環境變數設定)
module.exports = {
  line: {
    channelAccessToken: process.env.LINE_CHANNEL_ACCESS_TOKEN,
    channelSecret: process.env.LINE_CHANNEL_SECRET
  },
  server: {
    port: process.env.PORT || 3000,
    host: 'localhost'
  },
  database: {
    path: process.env.DATABASE_PATH || './wedding_game.db'
  },
  admin: {
    password: process.env.ADMIN_PASSWORD || 'admin123'
  }
};

