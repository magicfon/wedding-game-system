// 測試用戶添加的腳本
const database = require('./database');

async function testAddUser() {
  try {
    console.log('開始測試用戶添加...');
    
    // 添加測試用戶
    await database.addUser('test-user-123', '測試用戶', null);
    console.log('✅ 測試用戶添加成功');
    
    // 檢查用戶數量
    const count = await database.getUserCount();
    console.log(`✅ 當前用戶數量: ${count}`);
    
    // 獲取所有用戶
    const users = await database.getUsers();
    console.log('✅ 所有用戶:', users);
    
    process.exit(0);
  } catch (error) {
    console.error('❌ 測試失敗:', error);
    process.exit(1);
  }
}

testAddUser();
