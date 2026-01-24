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
    let currentDisplayFish = data.fish;
    if (data.startTime) {
        const elapsed = (Date.now() - parseInt(data.startTime)) / 1000;
        currentDisplayFish = data.fish + (elapsed * data.miningSpeed);
    }
    
    // Luôn hiển thị số cá >= 0 và làm tròn xuống
    fishDisplay.innerText = Math.floor(Math.max(0, currentDisplayFish));
    
    coinDisplay.innerText = data.coins.toLocaleString();
    speedDisplay.innerText = `${data.miningSpeed.toFixed(1)} cá/s`;

    // Phần logic nút Nâng cấp (Nhớ thêm hàm handleUpgrade nếu chưa có)
    if (data.upgradeCount >= MAX_UPGRADES) {
        btnUpgrade.innerText = "MAX LEVEL (10/10)";
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

    mInterval = setInterval(() => {
        const now = Date.now();
        const elapsed = (now - start) / 1000;
        
        // Tính toán số cá hiện tại (đã bao gồm phần trừ âm khi bán)
        const currentDisplayFish = data.fish + (elapsed * data.miningSpeed);
        
        // Luôn dùng Math.max(0, ...) để không bao giờ hiện số âm
        fishDisplay.innerText = Math.floor(Math.max(0, currentDisplayFish)); 
    }, 1000);

    tInterval = setInterval(() => {
        const secondsLeft = Math.floor((MINING_DURATION - (Date.now() - start)) / 1000);
        if (secondsLeft <= 0) {
            // Khi hết 3 tiếng, chốt số cá thực tế vào data.fish
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
    // 1. Chốt số cá đào được sau 3 tiếng vào kho
    const totalFishFromSession = (MINING_DURATION / 1000) * data.miningSpeed;
    data.fish += totalFishFromSession;

    // 2. Dừng các bộ đếm
    clearInterval(mInterval);
    clearInterval(tInterval);
    
    // 3. Reset trạng thái đào
    data.startTime = null; 
    
    // 4. Cập nhật UI về trạng thái nghỉ
    btnMine.disabled = false;
    btnMine.innerText = "RA KHƠI";
    btnMine.classList.remove('opacity-50'); // Đảm bảo nút sáng lại
    timerDisplay?.classList.add('hidden');
    shipIcon?.classList.remove('mining');
    
    saveData();
    updateUI();
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
    let currentMiningFish = 0;

    if (data.startTime) {
        const now = Date.now();
        const start = parseInt(data.startTime);
        const elapsed = now - start;

        // Nếu thời gian trôi qua vượt quá 3 tiếng, chỉ tính đúng 3 tiếng
        const effectiveElapsed = Math.min(elapsed, MINING_DURATION);
        currentMiningFish = (effectiveElapsed / 1000) * data.miningSpeed;

        // Nếu đã quá 3 tiếng, tiện tay dừng đào luôn
        if (elapsed >= MINING_DURATION) {
            stopMining();
            return; // Sau khi stopMining, nó đã tự cộng cá và updateUI nên thoát luôn
        }
    }

    const totalFishToSell = Math.floor(data.fish + currentMiningFish);

    if (totalFishToSell >= 1) {
        data.coins += totalFishToSell * 2;
        
        // Reset cá về 0
        if (data.startTime) {
            // "Nợ" lại số giây đã trôi qua để đồng hồ vẫn chạy chuẩn mà cá về 0
            const elapsedSinceStart = (Date.now() - parseInt(data.startTime)) / 1000;
            data.fish = -(elapsedSinceStart * data.miningSpeed);
        } else {
            data.fish = 0;
        }

        saveData();
        updateUI();
        tg.showAlert(`💰 Đã bán! Nhận được ${(totalFishToSell * 2).toLocaleString()} xu.`);
    } else {
        tg.showAlert("❌ Bạn không có cá để bán!");
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
// Thêm hàm này vào bất cứ đâu trong file app.js (thường là gần cuối)
function resetDataForDev() {
    // Lưu ý: Đảm bảo biến STORAGE_KEY đã được định nghĩa ở đầu file app.js của bạn
    localStorage.removeItem(STORAGE_KEY);
    
    // Hiển thị thông báo của Telegram (thay vì alert thường cho đẹp)
    tg.showConfirm("Bạn có chắc chắn muốn xóa sạch dữ liệu và chơi lại từ đầu không?", (confirmed) => {
        if (confirmed) {
            localStorage.removeItem(STORAGE_KEY);
            location.reload();
        }
    });
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

// Sửa lại dòng gán cho nút Sell bằng ID đã thêm ở Bước 1
const btnSell = document.getElementById('btn-sell');
if (btnSell) btnSell.onclick = handleSell;

