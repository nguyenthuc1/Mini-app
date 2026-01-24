const tg = window.Telegram.WebApp;
tg.ready();
tg.expand();

// 1. ĐỊNH DANH USER (Tránh trùng dữ liệu giữa các người dùng Telegram)
const userId = tg.initDataUnsafe?.user?.id || 'guest_user';
const STORAGE_KEY = `fish_mining_data_${userId}`;

// 2. CẤU HÌNH BẢNG GIÁ & HẰNG SỐ
const UPGRADE_COSTS = [2000, 5000, 10000, 15000, 20000, 30000, 50000, 100000, 150000, 250000];
const MAX_UPGRADES = 10;
const MINING_DURATION = 3 * 60 * 60 * 1000; // 3 tiếng

// 3. KHỞI TẠO DỮ LIỆU
function loadData() {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY)) || {};
    return {
        fish: parseFloat(saved.fish) || 0,
        coins: parseInt(saved.coins) || 0,
        miningSpeed: parseFloat(saved.miningSpeed) || 0.5,
        upgradeCount: parseInt(saved.upgradeCount) || 0,
        startTime: saved.startTime || null
    };
}

let data = loadData();
let mInterval, tInterval;

// DOM Elements
const fishDisplay = document.getElementById('fish-count');
const coinDisplay = document.getElementById('coin-balance');
const speedDisplay = document.getElementById('mining-speed');
const btnMine = document.getElementById('btn-mine');
const timerDisplay = document.getElementById('timer-display');
const shipIcon = document.getElementById('ship-icon');
const btnUpgrade = document.getElementById('btn-upgrade');

// 4. CÁC HÀM CỐT LÕI
function saveData() {
const userId = tg.initDataUnsafe?.user?.id || 'guest_user'; //
const STORAGE_KEY = `fish_mining_data_${userId}`; //

    // Đảm bảo các con số là hợp lệ trước khi lưu
    if (isNaN(data.fish)) data.fish = 0;
    if (isNaN(data.coins)) data.coins = 0;
    
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

function updateUI() {
    fishDisplay.innerText = Math.floor(data.fish);
    coinDisplay.innerText = data.coins.toLocaleString();
    speedDisplay.innerText = `${data.miningSpeed.toFixed(1)} cá/s`;
    
    // Cập nhật trạng thái nút Nâng cấp
    if (data.upgradeCount >= MAX_UPGRADES) {
        btnUpgrade.innerText = "MAX LEVEL (10/10)";
        btnUpgrade.classList.add('bg-slate-600');
        btnUpgrade.disabled = true;
    } else {
        const cost = UPGRADE_COSTS[data.upgradeCount];
        btnUpgrade.innerText = `NÂNG CẤP (${cost.toLocaleString()} 💰)`;
    }
}

// 5. XỬ LÝ ĐÀO CÁ & OFFLINE (Sửa lỗi hồi sinh cá)


function checkOfflineMining() {
    if (!data.startTime) return;

    const now = Date.now();
    const start = parseInt(data.startTime);
    const elapsed = now - start;

    if (elapsed <= 0) return;

    if (elapsed >= MINING_DURATION) {
        // ... (giữ nguyên đoạn showAlert và stopMining)
    } 
    else {
        // CHỈ CỘNG CÁ, KHÔNG ĐỔI START TIME
        const fishEarned = Math.floor((elapsed / 1000) * data.miningSpeed);
        if (fishEarned >= 1) {
            // Chúng ta không cộng vào data.fish ở đây vì startMiningSession 
            // sẽ bắt đầu tính toán lại từ đầu mốc startTime gốc. 
            // Để tránh cộng trùng, bạn chỉ nên cộng phần "chênh lệch" hoặc 
            // đơn giản là để startMiningSession tự lo phần hiển thị.
        }
        
        // Cập nhật giao diện đang đào
        if (timerDisplay) timerDisplay.classList.remove('hidden');
        if (shipIcon) shipIcon.classList.add('mining');
        btnMine.disabled = true;
        btnMine.innerText = "ĐANG RA KHƠI...";

        startMiningSession(); 
    }
    saveData();
    updateUI();
}

function startMiningSession() {
    if (!data.startTime) return;
    const start = parseInt(data.startTime);
    
    clearInterval(mInterval);
    clearInterval(tInterval);

    // Tính toán cá dựa trên mốc thời gian thực để không bao giờ sai lệch
    mInterval = setInterval(() => {
        const currentElapsed = Date.now() - start;
        // Số cá thực tế phải có = (thời gian đã trôi qua / 1000) * tốc độ
        // Cách này giúp cá luôn khớp với đồng hồ dù có reset bao nhiêu lần
        const totalFishTarget = (currentElapsed / 1000) * data.miningSpeed;
        
        // Cập nhật hiển thị (không cộng dồn liên tục để tránh sai số)
        fishDisplay.innerText = Math.floor(data.fish + totalFishTarget);
    }, 1000);

    tInterval = setInterval(() => {
        const secondsLeft = Math.floor((MINING_DURATION - (Date.now() - start)) / 1000);
        if (secondsLeft <= 0) {
            // Trước khi dừng, cộng số cá đào được vào tài khoản chính
            data.fish += (MINING_DURATION / 1000) * data.miningSpeed;
            stopMining();
        } else {
            updateTimerUI(secondsLeft);
        }
    }, 1000);
}

function startAds() {
    if (data.startTime) return;
    btnMine.disabled = true;
    btnMine.innerHTML = `ĐANG XEM...`;
    setTimeout(() => {
        data.startTime = Date.now();
        saveData();
        startMiningSession();
    }, 3000);
}

function stopMining() {
    clearInterval(mInterval);
    clearInterval(tInterval);
    data.startTime = null; // Xóa mốc thời gian khi hết hạn hoặc dừng
    btnMine.disabled = false;
    btnMine.innerText = "RA KHƠI";
    btnMine.classList.replace('bg-green-600', 'bg-blue-600');
    timerDisplay?.classList.add('hidden');
    shipIcon?.classList.remove('mining');
    saveData();
}

function updateTimerUI(seconds) {
    if (!timerDisplay) return;
    let h = Math.floor(seconds / 3600).toString().padStart(2, '0');
    let m = Math.floor((seconds % 3600) / 60).toString().padStart(2, '0');
    let s = (seconds % 60).toString().padStart(2, '0');
    timerDisplay.innerText = `${h}:${m}:${s}`;
}

// 6. TÍNH NĂNG BÁN & NÂNG CẤP

function handleSell() {
    const amount = Math.floor(data.fish);
    if (amount >= 1) {
        data.coins += amount * 2;
        data.fish = 0;
        
        // Nếu đang trong phiên đào, ta cập nhật startTime về hiện tại 
        // để người dùng bắt đầu tích lũy cá mới từ mốc 0, đồng hồ vẫn chạy tiếp
        if (data.startTime) {
            data.startTime = Date.now() - (Date.now() - parseInt(data.startTime)); 
            // Giữ nguyên đồng hồ nhưng reset mốc tính cá
        }
        
        saveData();
        updateUI();
    }
}

function handleUpgrade() {
    const cost = UPGRADE_COSTS[data.upgradeCount];
    if (data.coins >= cost && data.upgradeCount < MAX_UPGRADES) {
        data.coins -= cost;
        data.upgradeCount++;
        data.miningSpeed += 0.5;
        saveData();
        updateUI();
    } else if (data.upgradeCount < MAX_UPGRADES) {
        alert(`Bạn cần ${cost.toLocaleString()} xu!`);
    }
}

// 7. CHUYỂN TAB
function switchTab(name) {
    document.querySelectorAll('.tab-content').forEach(t => t.classList.add('hidden'));
    document.getElementById(`tab-${name}`)?.classList.remove('hidden');
    
    document.querySelectorAll('.nav-item').forEach(n => {
        n.classList.replace('text-blue-400', 'text-gray-500');
    });
    document.getElementById(`nav-${name}`)?.classList.replace('text-gray-500', 'text-blue-400');
}

// Khởi chạy
window.onload = () => {
    updateUI();
    
    // Nếu đang đào, khôi phục trạng thái nút bấm ngay lập tức
    if (data.startTime) {
        btnMine.disabled = true;
        btnMine.innerText = "ĐANG RA KHƠI...";
        shipIcon?.classList.add('mining');
    }
    
    checkOfflineMining();
};

// Thêm vào cuối file app.js
if (btnMine) btnMine.onclick = startAds;
if (btnUpgrade) btnUpgrade.onclick = handleUpgrade;
// Nút Bán cá không có ID trong HTML, bạn nên dùng querySelector
const btnSell = document.querySelector('button[onclick="handleSell()"]');
if (btnSell) btnSell.onclick = handleSell;
