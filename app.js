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
    let displayFish = data.fish;
    
    // Nếu đang trong phiên đào, tính toán số cá thực tế ngay lập tức
    if (data.startTime) {
        const elapsed = (Date.now() - parseInt(data.startTime)) / 1000;
        displayFish = data.fish + (elapsed * data.miningSpeed);
    }

    // Cập nhật số cá lên màn hình
    fishDisplay.innerText = Math.floor(Math.max(0, displayFish));
    
    // Cập nhật các thông tin khác
    coinDisplay.innerText = data.coins.toLocaleString();
    speedDisplay.innerText = `${data.miningSpeed.toFixed(1)} cá/s`;

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

    // Nếu đã quá 3 tiếng khi đang tắt app
    if (elapsed >= MINING_DURATION) {
        stopMining(); 
    } 
    // Nếu vẫn đang trong thời gian đào, kích hoạt lại bộ đếm
    else {
        startMiningSession(); 
        
        // Cập nhật trạng thái nút bấm
        if (btnMine) {
            btnMine.disabled = true;
            btnMine.innerText = "ĐANG RA KHƠI...";
        }
    }
}

function startMiningSession() {
    if (!data.startTime) return;
    const start = parseInt(data.startTime);

    clearInterval(tInterval); // Xóa bộ đếm cũ nếu có

    tInterval = setInterval(() => {
        const now = Date.now();
        const elapsed = now - start;

        // 1. Kiểm tra nếu đã hết 3 tiếng
        if (elapsed >= MINING_DURATION) {
            stopMining();
            return;
        }

        // 2. Cập nhật đồng hồ đếm ngược
        const secondsLeft = Math.floor((MINING_DURATION - elapsed) / 1000);
        updateTimerUI(secondsLeft);
        if (timerDisplay) timerDisplay.classList.remove('hidden');

        // 3. Cập nhật số cá hiển thị theo thời gian thực
        const secondsElapsed = elapsed / 1000;
        const currentFish = data.fish + (secondsElapsed * data.miningSpeed);
        
        // Cập nhật trực tiếp lên màn hình mỗi giây
        fishDisplay.innerText = Math.floor(Math.max(0, currentFish));

        // 4. Đảm bảo icon tàu vẫn quay
        shipIcon?.classList.add('mining');
    }, 1000); // Chạy mỗi giây
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
function handleUpgrade() {
    const cost = UPGRADE_COSTS[data.upgradeCount];
    
    if (data.coins >= cost && data.upgradeCount < MAX_UPGRADES) {
        data.coins -= cost;
        data.upgradeCount++;
        data.miningSpeed += 0.5; // Tăng tốc độ đào thêm 0.5 mỗi cấp
        
        saveData(); // Lưu vào localStorage
        updateUI(); // Cập nhật lại số dư xu và giá nâng cấp mới trên màn hình
        
        tg.showAlert("🚀 Nâng cấp thành công!");
        
        // Nếu đang trong phiên đào, chạy lại session để nhận tốc độ mới ngay
        if (data.startTime) {
            startMiningSession();
        }
    } else {
        tg.showAlert("❌ Không đủ xu hoặc đã đạt cấp tối đa!");
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

