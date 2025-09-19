// Line Bot 設定範例
module.exports = {
  line: {
    channelAccessToken: 'your_line_channel_access_token',
    channelSecret: 'your_line_channel_secret'
  },
  server: {
    port: process.env.PORT || 3000,
    host: 'localhost'
  },
  database: {
    path: './wedding_game.db'
  },
  admin: {
    password: 'admin123'
  }
};

