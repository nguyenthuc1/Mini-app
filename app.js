let fish = 0;
let coins = 0;
let miningSpeed = 0.5;
let isMining = false;
let miningTimeout = 10800; // 3 tiếng tính bằng giây (3 * 3600)
let timerInterval;
let miningInterval;

const fishDisplay = document.getElementById('fish-count');
const coinDisplay = document.getElementById('coin-balance');
const speedDisplay = document.getElementById('mining-speed');
const btnMine = document.getElementById('btn-mine');
const timerDisplay = document.getElementById('timer-display');

function startAds() {
    if (isMining) return;

    btnMine.disabled = true;
    btnMine.innerHTML = `<span class="loading-spinner"></span> ĐANG XEM...`;

    // Giả lập xem quảng cáo 3 giây
    setTimeout(() => {
        startMiningSession();
    }, 3000);
}

function startMiningSession() {
    isMining = true;
    let timeLeft = miningTimeout;
    
    btnMine.innerHTML = "ĐANG ĐÀO...";
    btnMine.classList.replace('bg-blue-600', 'bg-green-700');
    timerDisplay.classList.remove('hidden');

    // Xóa các interval cũ nếu có
    clearInterval(miningInterval);
    clearInterval(timerInterval);

    // 1. Interval cộng cá mỗi giây
    miningInterval = setInterval(() => {
        if (isMining) {
            fish += miningSpeed;
            fishDisplay.innerText = Math.floor(fish);
        }
    }, 1000);

    // 2. Interval đếm ngược 3 tiếng
    timerInterval = setInterval(() => {
        timeLeft--;
        
        // Cập nhật giao diện đồng hồ (HH:MM:SS)
        let hrs = Math.floor(timeLeft / 3600);
        let mins = Math.floor((timeLeft % 3600) / 60);
        let secs = timeLeft % 60;
        timerDisplay.innerText = `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;

        if (timeLeft <= 0) {
            stopMiningSession();
        }
    }, 1000);
}

function stopMiningSession() {
    isMining = false;
    clearInterval(miningInterval);
    clearInterval(timerInterval);
    
    btnMine.disabled = false;
    btnMine.innerHTML = "RA KHƠI";
    btnMine.classList.replace('bg-green-700', 'bg-blue-600');
    timerDisplay.classList.add('hidden');
    
    alert("Hết thời gian đào! Hãy xem quảng cáo để tiếp tục ra khơi.");
}



// 3. Logic Bán Cá (Giữ nguyên hoặc chỉnh sửa tùy ý)
function handleSell() {
    if (fish >= 1) {
        let earnedCoins = Math.floor(fish) * 2;
        coins += earnedCoins;
        fish = 0;
        updateUI();
    } else {
        alert("Không đủ cá để bán!");
    }
}

// 4. Logic Nâng cấp
function handleUpgrade() {
    const upgradeCost = 50;
    if (coins >= upgradeCost) {
        coins -= upgradeCost;
        miningSpeed += 0.5;
        updateUI();
        alert("Nâng cấp thành công!");
    } else {
        alert("Bạn cần 50 xu!");
    }
}

function updateUI() {
    fishDisplay.innerText = Math.floor(fish);
    coinDisplay.innerText = coins;
    speedDisplay.innerText = `${miningSpeed.toFixed(1)} cá/s`;
}

// Logic chuyển tab (Giữ nguyên như cũ)
function switchTab(tabName) {
    const tabs = document.querySelectorAll('.tab-content');
    tabs.forEach(tab => tab.classList.add('hidden'));
    document.getElementById(`tab-${tabName}`).classList.remove('hidden');

    const navItems = document.querySelectorAll('.nav-item');
    navItems.forEach(item => {
        item.classList.remove('text-blue-400');
        item.classList.add('text-gray-500');
    });
    document.getElementById(`nav-${tabName}`).classList.remove('text-gray-500');
    document.getElementById(`nav-${tabName}`).classList.add('text-blue-400');
}
