const sqlite3 = require('sqlite3').verbose();
const config = require('./config');

class Database {
  constructor() {
    this.db = new sqlite3.Database(config.database.path);
    this.init();
  }

  init() {
    // 創建用戶表
    this.db.run(`
      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        avatar TEXT,
        score INTEGER DEFAULT 0,
        joined_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // 創建遊戲狀態表
    this.db.run(`
      CREATE TABLE IF NOT EXISTS game_states (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        type TEXT NOT NULL,
        status TEXT NOT NULL,
        data TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // 創建快問快答表
    this.db.run(`
      CREATE TABLE IF NOT EXISTS qa_answers (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id TEXT NOT NULL,
        question_id INTEGER,
        answer TEXT NOT NULL,
        submitted_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users (id)
      )
    `);

    // 創建照片表
    this.db.run(`
      CREATE TABLE IF NOT EXISTS photos (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id TEXT NOT NULL,
        filename TEXT NOT NULL,
        original_name TEXT,
        votes INTEGER DEFAULT 0,
        uploaded_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users (id)
      )
    `);

    // 創建投票表
    this.db.run(`
      CREATE TABLE IF NOT EXISTS votes (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id TEXT NOT NULL,
        photo_id INTEGER NOT NULL,
        voted_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users (id),
        FOREIGN KEY (photo_id) REFERENCES photos (id),
        UNIQUE(user_id, photo_id)
      )
    `);

    console.log('資料庫初始化完成');
  }

  // 用戶相關方法
  addUser(userId, name, avatar = null) {
    return new Promise((resolve, reject) => {
      this.db.run(
        'INSERT OR REPLACE INTO users (id, name, avatar) VALUES (?, ?, ?)',
        [userId, name, avatar],
        function(err) {
          if (err) reject(err);
          else resolve(this.lastID);
        }
      );
    });
  }

  getUsers() {
    return new Promise((resolve, reject) => {
      this.db.all(
        'SELECT * FROM users ORDER BY score DESC, joined_at ASC',
        (err, rows) => {
          if (err) reject(err);
          else resolve(rows);
        }
      );
    });
  }

  getUserCount() {
    return new Promise((resolve, reject) => {
      this.db.get('SELECT COUNT(*) as count FROM users', (err, row) => {
        if (err) reject(err);
        else resolve(row.count);
      });
    });
  }

  updateUserScore(userId, scoreChange) {
    return new Promise((resolve, reject) => {
      this.db.run(
        'UPDATE users SET score = score + ? WHERE id = ?',
        [scoreChange, userId],
        function(err) {
          if (err) reject(err);
          else resolve(this.changes);
        }
      );
    });
  }

  // 快問快答相關方法
  addQAAnswer(userId, questionId, answer) {
    return new Promise((resolve, reject) => {
      this.db.run(
        'INSERT INTO qa_answers (user_id, question_id, answer) VALUES (?, ?, ?)',
        [userId, questionId, answer],
        function(err) {
          if (err) reject(err);
          else resolve(this.lastID);
        }
      );
    });
  }

  getQAAnswers(questionId) {
    return new Promise((resolve, reject) => {
      this.db.all(
        `SELECT qa.*, u.name as user_name 
         FROM qa_answers qa 
         JOIN users u ON qa.user_id = u.id 
         WHERE qa.question_id = ? 
         ORDER BY qa.submitted_at ASC`,
        [questionId],
        (err, rows) => {
          if (err) reject(err);
          else resolve(rows);
        }
      );
    });
  }

  // 照片相關方法
  addPhoto(userId, filename, originalName) {
    return new Promise((resolve, reject) => {
      this.db.run(
        'INSERT INTO photos (user_id, filename, original_name) VALUES (?, ?, ?)',
        [userId, filename, originalName],
        function(err) {
          if (err) reject(err);
          else resolve(this.lastID);
        }
      );
    });
  }

  getPhotos() {
    return new Promise((resolve, reject) => {
      this.db.all(
        `SELECT p.*, u.name as user_name 
         FROM photos p 
         JOIN users u ON p.user_id = u.id 
         ORDER BY p.uploaded_at ASC`,
        (err, rows) => {
          if (err) reject(err);
          else resolve(rows);
        }
      );
    });
  }

  getTopPhotos(limit = 5) {
    return new Promise((resolve, reject) => {
      this.db.all(
        `SELECT p.*, u.name as user_name 
         FROM photos p 
         JOIN users u ON p.user_id = u.id 
         ORDER BY p.votes DESC, p.uploaded_at ASC 
         LIMIT ?`,
        [limit],
        (err, rows) => {
          if (err) reject(err);
          else resolve(rows);
        }
      );
    });
  }

  votePhoto(userId, photoId) {
    return new Promise((resolve, reject) => {
      this.db.serialize(() => {
        this.db.run('BEGIN TRANSACTION');
        
        // 新增投票記錄
        this.db.run(
          'INSERT OR IGNORE INTO votes (user_id, photo_id) VALUES (?, ?)',
          [userId, photoId],
          function(err) {
            if (err) {
              this.db.run('ROLLBACK');
              reject(err);
              return;
            }
            
            if (this.changes > 0) {
              // 更新照片票數
              this.db.run(
                'UPDATE photos SET votes = votes + 1 WHERE id = ?',
                [photoId],
                function(err) {
                  if (err) {
                    this.db.run('ROLLBACK');
                    reject(err);
                  } else {
                    this.db.run('COMMIT');
                    resolve(true);
                  }
                }
              );
            } else {
              this.db.run('ROLLBACK');
              resolve(false); // 已經投過票
            }
          }
        );
      });
    });
  }

  // 遊戲狀態相關方法
  setGameState(type, status, data = null) {
    return new Promise((resolve, reject) => {
      this.db.run(
        `INSERT OR REPLACE INTO game_states (id, type, status, data, updated_at) 
         VALUES ((SELECT id FROM game_states WHERE type = ?), ?, ?, ?, CURRENT_TIMESTAMP)`,
        [type, type, status, JSON.stringify(data)],
        function(err) {
          if (err) reject(err);
          else resolve(this.lastID);
        }
      );
    });
  }

  getGameState(type) {
    return new Promise((resolve, reject) => {
      this.db.get(
        'SELECT * FROM game_states WHERE type = ? ORDER BY updated_at DESC LIMIT 1',
        [type],
        (err, row) => {
          if (err) reject(err);
          else {
            if (row && row.data) {
              row.data = JSON.parse(row.data);
            }
            resolve(row);
          }
        }
      );
    });
  }
}

module.exports = new Database();

