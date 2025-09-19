// 系統測試腳本
const http = require('http');
const config = require('./config');

console.log('🧪 婚禮互動遊戲系統測試\n');

function testEndpoint(path, method = 'GET', data = null) {
    return new Promise((resolve, reject) => {
        const options = {
            hostname: 'localhost',
            port: config.server.port,
            path: path,
            method: method,
            headers: {
                'Content-Type': 'application/json',
            }
        };

        const req = http.request(options, (res) => {
            let body = '';
            res.on('data', (chunk) => {
                body += chunk;
            });
            res.on('end', () => {
                resolve({
                    statusCode: res.statusCode,
                    body: body
                });
            });
        });

        req.on('error', (err) => {
            reject(err);
        });

        if (data) {
            req.write(JSON.stringify(data));
        }
        req.end();
    });
}

async function runTests() {
    try {
        console.log('測試 API 端點...\n');

        // 測試參與者數量 API
        console.log('🔍 測試參與者數量 API...');
        const participantsResult = await testEndpoint('/api/participants/count');
        if (participantsResult.statusCode === 200) {
            console.log('✅ 參與者數量 API 正常');
            console.log(`   回應: ${participantsResult.body}\n`);
        } else {
            console.log('❌ 參與者數量 API 錯誤');
        }

        // 測試排行榜 API
        console.log('🔍 測試排行榜 API...');
        const leaderboardResult = await testEndpoint('/api/leaderboard');
        if (leaderboardResult.statusCode === 200) {
            console.log('✅ 排行榜 API 正常');
            console.log(`   回應: ${leaderboardResult.body}\n`);
        } else {
            console.log('❌ 排行榜 API 錯誤');
        }

        // 測試快問快答狀態 API
        console.log('🔍 測試快問快答狀態 API...');
        const qaStatusResult = await testEndpoint('/api/qa/status');
        if (qaStatusResult.statusCode === 200) {
            console.log('✅ 快問快答狀態 API 正常');
            console.log(`   回應: ${qaStatusResult.body}\n`);
        } else {
            console.log('❌ 快問快答狀態 API 錯誤');
        }

        // 測試照片 API
        console.log('🔍 測試照片 API...');
        const photosResult = await testEndpoint('/api/photos');
        if (photosResult.statusCode === 200) {
            console.log('✅ 照片 API 正常');
            console.log(`   回應: ${photosResult.body}\n`);
        } else {
            console.log('❌ 照片 API 錯誤');
        }

        // 測試照片投票狀態 API
        console.log('🔍 測試照片投票狀態 API...');
        const votingStatusResult = await testEndpoint('/api/photos/voting/status');
        if (votingStatusResult.statusCode === 200) {
            console.log('✅ 照片投票狀態 API 正常');
            console.log(`   回應: ${votingStatusResult.body}\n`);
        } else {
            console.log('❌ 照片投票狀態 API 錯誤');
        }

        console.log('🎉 所有基本 API 測試完成！');
        console.log('\n📋 下一步：');
        console.log('1. 設定 Line Bot Channel Access Token 和 Channel Secret');
        console.log('2. 部署到有公開 IP 的伺服器');
        console.log('3. 設定 Line Bot Webhook URL');
        console.log('4. 開始使用婚禮互動遊戲系統！');

    } catch (error) {
        console.error('❌ 測試過程中發生錯誤:', error.message);
        console.log('\n請確認伺服器是否正在運行：npm start');
    }
}

// 等待伺服器啟動
setTimeout(runTests, 2000);

