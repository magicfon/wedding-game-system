// 實際設定檔案 (請根據需要修改)
module.exports = {
  line: {
    channelAccessToken: process.env.LINE_CHANNEL_ACCESS_TOKEN || 'your_line_channel_access_token',
    channelSecret: process.env.LINE_CHANNEL_SECRET || 'your_line_channel_secret'
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

