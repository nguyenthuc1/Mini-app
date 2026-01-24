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
    let elapsed = now - start;

    if (elapsed <= 0) return;

    // 1. Giới hạn thời gian trôi qua tối đa là 3 tiếng
    let actualElapsed = Math.min(elapsed, MINING_DURATION);
    
    // 2. Tính số cá dựa trên thời gian thực tế đã trôi qua
    // Sử dụng Math.floor để lấy số nguyên, tránh nhảy số lẻ
    const fishEarned = Math.floor((actualElapsed / 1000) * data.miningSpeed);

    if (fishEarned >= 1) {
        data.fish += fishEarned;
        tg.showAlert(`🚢 Bạn nhận được ${fishEarned.toLocaleString()} 🐟 khi vắng mặt.`);
        
        // --- GIẢI PHÁP TRIỆT ĐỂ ---
        // Chúng ta cập nhật startTime để bù đắp phần thời gian đã cộng cá
        // Điều này giữ cho đồng hồ chạy tiếp CHÍNH XÁC từ giây bạn reset
        data.startTime = Date.now() - (actualElapsed - (fishEarned * 1000 / data.miningSpeed));
    }

    if (elapsed >= MINING_DURATION) {
        stopMining(); 
    } else {
        startMiningSession(); 
    }
    
    saveData();
    updateUI();
}

function checkOfflineMining() {
    if (!data.startTime) return;
    
    const now = Date.now();
    const start = parseInt(data.startTime);
    let elapsed = now - start;

    if (elapsed <= 0) return;

    // 1. Giới hạn thời gian trôi qua tối đa là 3 tiếng
    let actualElapsed = Math.min(elapsed, MINING_DURATION);
    
    // 2. Tính số cá dựa trên thời gian thực tế đã trôi qua
    // Sử dụng Math.floor để lấy số nguyên, tránh nhảy số lẻ
    const fishEarned = Math.floor((actualElapsed / 1000) * data.miningSpeed);

    if (fishEarned >= 1) {
        data.fish += fishEarned;
        tg.showAlert(`🚢 Bạn nhận được ${fishEarned.toLocaleString()} 🐟 khi vắng mặt.`);
        
        // --- GIẢI PHÁP TRIỆT ĐỂ ---
        // Chúng ta cập nhật startTime để bù đắp phần thời gian đã cộng cá
        // Điều này giữ cho đồng hồ chạy tiếp CHÍNH XÁC từ giây bạn reset
        data.startTime = start + (fishEarned * 1000 / data.miningSpeed);
    }

    if (elapsed >= MINING_DURATION) {
        stopMining(); 
    } else {
        startMiningSession(); 
    }
    
    saveData();
    updateUI();
}

    // 3. Kiểm tra xem phiên đào đã kết thúc chưa
    if (elapsed >= MINING_DURATION) {
        stopMining(); // Hết 3 tiếng thì dừng và xóa startTime
    } else {
        // Vẫn trong 3 tiếng, chạy session để đồng hồ chạy tiếp từ mốc start


function startAds() {
    if (data.startTime) return;
    btnMine.disabled = true;
    btnMine.innerHTML = `<span class="loading-spinner"></span> ĐANG XEM...`;
    
    setTimeout(() => {
        data.startTime = Date.now(); // Lưu mốc bắt đầu
        saveData();
        startMiningSession(); // Bắt đầu đào
    }, 3000);
}


function startMiningSession() {
    if (!data.startTime) return;

    // Lấy mốc thời gian đã lưu
    const start = parseInt(data.startTime);

    clearInterval(mInterval);
    clearInterval(tInterval);

    // Vòng lặp cộng cá mỗi giây
  tInterval = setInterval(() => {
    const currentNow = Date.now();
    const currentElapsed = currentNow - start; // start là mốc cố định từ lúc bấm nút
    const currentSecondsLeft = Math.floor((MINING_DURATION - currentElapsed) / 1000);

    if (currentSecondsLeft <= 0) {
        stopMining();
    } else {
        updateTimerUI(currentSecondsLeft);
    }
}, 1000);

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
        
        // Nếu bạn muốn sau khi bán cá thì dừng đào luôn để an toàn:
        // stopMining(); 
        
        // Hoặc ít nhất phải cập nhật mốc thời gian về hiện tại
        
if (data.startTime) {
    data.startTime = Date.now(); 
    saveData(); // Đảm bảo mốc mới được lưu ngay lập tức
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
    checkOfflineMining();
};
