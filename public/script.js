// Socket.IO 連接
const socket = io();

// 全域變數
let currentTab = 'leaderboard';
let isAdminLoggedIn = false;
let currentQuestionId = null;

// DOM 元素
const participantCountEl = document.getElementById('participantCount');
const leaderboardListEl = document.getElementById('leaderboardList');
const qaCurrentQuestionEl = document.getElementById('qaCurrentQuestion');
const qaStatusEl = document.getElementById('qaStatus');
const qaAnswersListEl = document.getElementById('qaAnswersList');
const allPhotosListEl = document.getElementById('allPhotosList');
const topPhotosListEl = document.getElementById('topPhotosList');
const photoVotingStatusEl = document.getElementById('photoVotingStatus');
const allPhotosSectionEl = document.getElementById('allPhotosSection');
const topPhotosSectionEl = document.getElementById('topPhotosSection');

// 初始化
document.addEventListener('DOMContentLoaded', function() {
    initializeTabs();
    initializeAdmin();
    loadInitialData();
    setupSocketListeners();
});

// 標籤切換功能
function initializeTabs() {
    const tabButtons = document.querySelectorAll('.tab-btn');
    const tabContents = document.querySelectorAll('.tab-content');
    
    tabButtons.forEach(button => {
        button.addEventListener('click', () => {
            const targetTab = button.getAttribute('data-tab');
            
            // 移除所有活動狀態
            tabButtons.forEach(btn => btn.classList.remove('active'));
            tabContents.forEach(content => content.classList.remove('active'));
            
            // 添加新的活動狀態
            button.classList.add('active');
            document.getElementById(targetTab).classList.add('active');
            
            currentTab = targetTab;
            
            // 載入對應頁面的資料
            loadTabData(targetTab);
        });
    });
}

// 載入標籤頁資料
function loadTabData(tab) {
    switch(tab) {
        case 'leaderboard':
            loadLeaderboard();
            break;
        case 'qa-game':
            loadQAStatus();
            break;
        case 'photo-game':
            loadPhotos();
            loadPhotoVotingStatus();
            break;
        case 'admin':
            if (isAdminLoggedIn) {
                loadAdminData();
            }
            break;
    }
}

// 載入初始資料
async function loadInitialData() {
    try {
        await Promise.all([
            loadParticipantCount(),
            loadLeaderboard()
        ]);
    } catch (error) {
        console.error('載入初始資料錯誤:', error);
    }
}

// 載入參與者數量
async function loadParticipantCount() {
    try {
        const response = await fetch('/api/participants/count');
        const data = await response.json();
        participantCountEl.textContent = data.count;
    } catch (error) {
        console.error('載入參與者數量錯誤:', error);
        participantCountEl.textContent = '錯誤';
    }
}

// 載入排行榜
async function loadLeaderboard() {
    try {
        leaderboardListEl.innerHTML = '<div class="loading">載入中...</div>';
        
        const response = await fetch('/api/leaderboard');
        const users = await response.json();
        
        if (users.length === 0) {
            leaderboardListEl.innerHTML = '<div class="loading">尚無參與者</div>';
            return;
        }
        
        leaderboardListEl.innerHTML = users.map((user, index) => {
            const rank = index + 1;
            const rankClass = rank <= 3 ? `rank-${rank}` : '';
            
            return `
                <div class="leaderboard-item ${rankClass} fade-in-up">
                    <div class="rank-number">${rank}</div>
                    ${user.avatar ? `<img src="${user.avatar}" alt="${user.name}" class="user-avatar">` : '<div class="user-avatar" style="background: #ddd;"></div>'}
                    <div class="user-info">
                        <div class="user-name">${user.name}</div>
                    </div>
                    <div class="user-score">${user.score} 分</div>
                </div>
            `;
        }).join('');
    } catch (error) {
        console.error('載入排行榜錯誤:', error);
        leaderboardListEl.innerHTML = '<div class="loading">載入失敗</div>';
    }
}

// 載入快問快答狀態
async function loadQAStatus() {
    try {
        const response = await fetch('/api/qa/status');
        const status = await response.json();
        
        if (status.status === 'active' && status.data) {
            currentQuestionId = status.data.questionId;
            qaCurrentQuestionEl.innerHTML = `<p><strong>問題：</strong>${status.data.question}</p>`;
            qaStatusEl.textContent = '進行中';
            qaStatusEl.className = 'game-status active';
            
            // 載入答案
            loadQAAnswers(status.data.questionId);
        } else if (status.status === 'ended') {
            qaStatusEl.textContent = '已結束';
            qaStatusEl.className = 'game-status ended';
        } else {
            qaCurrentQuestionEl.innerHTML = '<p>等待主持人出題...</p>';
            qaStatusEl.textContent = '準備中';
            qaStatusEl.className = 'game-status';
            qaAnswersListEl.innerHTML = '';
        }
    } catch (error) {
        console.error('載入快問快答狀態錯誤:', error);
    }
}

// 載入快問快答答案
async function loadQAAnswers(questionId) {
    try {
        const response = await fetch(`/api/qa/answers/${questionId}`);
        const answers = await response.json();
        
        qaAnswersListEl.innerHTML = answers.map((answer, index) => `
            <div class="answer-item fade-in-up">
                <div class="answer-content">
                    <div class="answer-user">${index + 1}. ${answer.user_name}</div>
                    <div class="answer-text">${answer.answer}</div>
                </div>
                <div class="answer-time">${formatTime(answer.submitted_at)}</div>
            </div>
        `).join('');
    } catch (error) {
        console.error('載入快問快答答案錯誤:', error);
    }
}

// 載入照片
async function loadPhotos() {
    try {
        allPhotosListEl.innerHTML = '<div class="loading">載入中...</div>';
        
        const response = await fetch('/api/photos');
        const photos = await response.json();
        
        if (photos.length === 0) {
            allPhotosListEl.innerHTML = '<div class="loading">尚無照片</div>';
            return;
        }
        
        allPhotosListEl.innerHTML = photos.map((photo, index) => `
            <div class="photo-item fade-in-up" style="position: relative;">
                <div class="photo-number">${index + 1}</div>
                <img src="/uploads/${photo.filename}" alt="${photo.user_name}的照片" loading="lazy">
                <div class="photo-info">
                    <div class="photo-user">${photo.user_name}</div>
                    <div class="photo-votes">
                        <i class="fas fa-heart"></i>
                        <span>${photo.votes} 票</span>
                    </div>
                </div>
            </div>
        `).join('');
    } catch (error) {
        console.error('載入照片錯誤:', error);
        allPhotosListEl.innerHTML = '<div class="loading">載入失敗</div>';
    }
}

// 載入照片投票狀態
async function loadPhotoVotingStatus() {
    try {
        const response = await fetch('/api/photos/voting/status');
        const status = await response.json();
        
        if (status.status === 'active') {
            photoVotingStatusEl.textContent = '投票進行中';
            photoVotingStatusEl.className = 'game-status active';
            allPhotosSectionEl.style.display = 'block';
            topPhotosSectionEl.style.display = 'none';
        } else if (status.status === 'ended') {
            photoVotingStatusEl.textContent = '投票已結束';
            photoVotingStatusEl.className = 'game-status ended';
            allPhotosSectionEl.style.display = 'none';
            topPhotosSectionEl.style.display = 'block';
            loadTopPhotos();
        } else {
            photoVotingStatusEl.textContent = '照片收集中';
            photoVotingStatusEl.className = 'game-status';
            allPhotosSectionEl.style.display = 'block';
            topPhotosSectionEl.style.display = 'none';
        }
    } catch (error) {
        console.error('載入照片投票狀態錯誤:', error);
    }
}

// 載入得票前五名照片
async function loadTopPhotos() {
    try {
        const response = await fetch('/api/photos/top');
        const photos = await response.json();
        
        topPhotosListEl.innerHTML = photos.map((photo, index) => `
            <div class="photo-item fade-in-up">
                <img src="/uploads/${photo.filename}" alt="${photo.user_name}的照片" loading="lazy">
                <div class="photo-info">
                    <div class="photo-user">${photo.user_name}</div>
                    <div class="photo-votes">
                        <i class="fas fa-heart"></i>
                        <span>${photo.votes} 票</span>
                    </div>
                </div>
            </div>
        `).join('');
    } catch (error) {
        console.error('載入得票前五名照片錯誤:', error);
    }
}

// 管理後台功能
function initializeAdmin() {
    const loginBtn = document.getElementById('loginBtn');
    const adminPassword = document.getElementById('adminPassword');
    const startQuestionBtn = document.getElementById('startQuestionBtn');
    const endQuestionBtn = document.getElementById('endQuestionBtn');
    const questionInput = document.getElementById('questionInput');
    const startVotingBtn = document.getElementById('startVotingBtn');
    const endVotingBtn = document.getElementById('endVotingBtn');
    
    // 管理員登入
    loginBtn.addEventListener('click', async () => {
        try {
            const response = await fetch('/api/admin/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ password: adminPassword.value })
            });
            
            if (response.ok) {
                isAdminLoggedIn = true;
                document.getElementById('adminLogin').style.display = 'none';
                document.getElementById('adminPanel').style.display = 'block';
                loadAdminData();
            } else {
                alert('密碼錯誤！');
            }
        } catch (error) {
            console.error('登入錯誤:', error);
            alert('登入失敗！');
        }
    });
    
    // 密碼輸入框回車登入
    adminPassword.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            loginBtn.click();
        }
    });
    
    // 開始問題
    startQuestionBtn.addEventListener('click', async () => {
        const question = questionInput.value.trim();
        if (!question) {
            alert('請輸入問題！');
            return;
        }
        
        try {
            const response = await fetch('/api/qa/start', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ question })
            });
            
            if (response.ok) {
                questionInput.value = '';
                startQuestionBtn.style.display = 'none';
                endQuestionBtn.style.display = 'inline-block';
            }
        } catch (error) {
            console.error('開始問題錯誤:', error);
            alert('開始問題失敗！');
        }
    });
    
    // 結束問題
    endQuestionBtn.addEventListener('click', async () => {
        try {
            const response = await fetch('/api/qa/end', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' }
            });
            
            if (response.ok) {
                startQuestionBtn.style.display = 'inline-block';
                endQuestionBtn.style.display = 'none';
            }
        } catch (error) {
            console.error('結束問題錯誤:', error);
            alert('結束問題失敗！');
        }
    });
    
    // 開始投票
    startVotingBtn.addEventListener('click', async () => {
        try {
            const response = await fetch('/api/photos/voting/start', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' }
            });
            
            if (response.ok) {
                startVotingBtn.style.display = 'none';
                endVotingBtn.style.display = 'inline-block';
            }
        } catch (error) {
            console.error('開始投票錯誤:', error);
            alert('開始投票失敗！');
        }
    });
    
    // 結束投票
    endVotingBtn.addEventListener('click', async () => {
        try {
            const response = await fetch('/api/photos/voting/end', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' }
            });
            
            if (response.ok) {
                startVotingBtn.style.display = 'inline-block';
                endVotingBtn.style.display = 'none';
            }
        } catch (error) {
            console.error('結束投票錯誤:', error);
            alert('結束投票失敗！');
        }
    });
}

// 載入管理後台資料
async function loadAdminData() {
    try {
        // 載入用戶分數管理
        const response = await fetch('/api/leaderboard');
        const users = await response.json();
        
        const scoreManagementEl = document.getElementById('scoreManagement');
        scoreManagementEl.innerHTML = users.map(user => `
            <div class="score-item">
                <div class="user-name">${user.name}</div>
                <div class="current-score">${user.score} 分</div>
                <div class="score-controls">
                    <button class="btn btn-success btn-small" onclick="updateScore('${user.id}', 1)">
                        <i class="fas fa-plus"></i> +1
                    </button>
                    <button class="btn btn-success btn-small" onclick="updateScore('${user.id}', 5)">
                        <i class="fas fa-plus"></i> +5
                    </button>
                    <button class="btn btn-danger btn-small" onclick="updateScore('${user.id}', -1)">
                        <i class="fas fa-minus"></i> -1
                    </button>
                    <button class="btn btn-danger btn-small" onclick="updateScore('${user.id}', -5)">
                        <i class="fas fa-minus"></i> -5
                    </button>
                </div>
            </div>
        `).join('');
        
        // 載入遊戲狀態
        const qaStatus = await fetch('/api/qa/status').then(r => r.json());
        const votingStatus = await fetch('/api/photos/voting/status').then(r => r.json());
        
        // 更新按鈕狀態
        const startQuestionBtn = document.getElementById('startQuestionBtn');
        const endQuestionBtn = document.getElementById('endQuestionBtn');
        const startVotingBtn = document.getElementById('startVotingBtn');
        const endVotingBtn = document.getElementById('endVotingBtn');
        
        if (qaStatus.status === 'active') {
            startQuestionBtn.style.display = 'none';
            endQuestionBtn.style.display = 'inline-block';
        } else {
            startQuestionBtn.style.display = 'inline-block';
            endQuestionBtn.style.display = 'none';
        }
        
        if (votingStatus.status === 'active') {
            startVotingBtn.style.display = 'none';
            endVotingBtn.style.display = 'inline-block';
        } else {
            startVotingBtn.style.display = 'inline-block';
            endVotingBtn.style.display = 'none';
        }
        
    } catch (error) {
        console.error('載入管理後台資料錯誤:', error);
    }
}

// 更新分數
async function updateScore(userId, scoreChange) {
    try {
        const response = await fetch('/api/admin/score', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId, scoreChange })
        });
        
        if (response.ok) {
            // 分數更新成功，重新載入管理資料
            loadAdminData();
        } else {
            alert('更新分數失敗！');
        }
    } catch (error) {
        console.error('更新分數錯誤:', error);
        alert('更新分數失敗！');
    }
}

// Socket.IO 事件監聽
function setupSocketListeners() {
    // 參與者數量更新
    socket.on('participants-updated', (data) => {
        participantCountEl.textContent = data.count;
    });
    
    // 排行榜更新
    socket.on('leaderboard-updated', () => {
        if (currentTab === 'leaderboard') {
            loadLeaderboard();
        }
        if (isAdminLoggedIn) {
            loadAdminData();
        }
    });
    
    // 快問快答相關事件
    socket.on('qa-question-started', (data) => {
        currentQuestionId = data.questionId;
        qaCurrentQuestionEl.innerHTML = `<p><strong>問題：</strong>${data.question}</p>`;
        qaStatusEl.textContent = '進行中';
        qaStatusEl.className = 'game-status active';
        qaAnswersListEl.innerHTML = '';
        
        if (currentTab === 'qa-game') {
            loadQAAnswers(data.questionId);
        }
    });
    
    socket.on('qa-question-ended', () => {
        qaStatusEl.textContent = '已結束';
        qaStatusEl.className = 'game-status ended';
    });
    
    socket.on('qa-new-answer', (data) => {
        if (currentTab === 'qa-game' && currentQuestionId) {
            loadQAAnswers(currentQuestionId);
        }
    });
    
    // 照片相關事件
    socket.on('photo-uploaded', () => {
        if (currentTab === 'photo-game') {
            loadPhotos();
        }
    });
    
    socket.on('photo-voting-started', () => {
        photoVotingStatusEl.textContent = '投票進行中';
        photoVotingStatusEl.className = 'game-status active';
        allPhotosSectionEl.style.display = 'block';
        topPhotosSectionEl.style.display = 'none';
    });
    
    socket.on('photo-voting-ended', () => {
        photoVotingStatusEl.textContent = '投票已結束';
        photoVotingStatusEl.className = 'game-status ended';
        allPhotosSectionEl.style.display = 'none';
        topPhotosSectionEl.style.display = 'block';
        loadTopPhotos();
    });
    
    socket.on('photo-vote-updated', () => {
        if (currentTab === 'photo-game') {
            loadPhotos();
        }
    });
}

// 工具函數
function formatTime(timeString) {
    const date = new Date(timeString);
    return date.toLocaleTimeString('zh-TW', { 
        hour: '2-digit', 
        minute: '2-digit',
        second: '2-digit'
    });
}

// 全域函數（供 HTML 中的 onclick 使用）
window.updateScore = updateScore;
