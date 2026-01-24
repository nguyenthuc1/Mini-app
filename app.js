// --- KHỞI TẠO DỮ LIỆU TỪ LOCALSTORAGE ---
let fish = parseFloat(localStorage.getItem('fish')) || 0;
let coins = parseInt(localStorage.getItem('coins')) || 0;
let miningSpeed = parseFloat(localStorage.getItem('miningSpeed')) || 0.5;
let startTime = localStorage.getItem('startTime'); // Lưu thời điểm bắt đầu đào

// Các phần tử giao diện
const fishDisplay = document.getElementById('fish-count');
const coinDisplay = document.getElementById('coin-balance');
const speedDisplay = document.getElementById('mining-speed');
const btnMine = document.getElementById('btn-mine');
const timerDisplay = document.getElementById('timer-display');

const MINING_DURATION = 3 * 60 * 60 * 1000; // 3 tiếng (miligiây)
let timerInterval, miningInterval;

// --- TỰ ĐỘNG CHẠY KHI VÀO APP ---
window.onload = () => {
    updateUI();
    checkOfflineMining();
};

// 1. KIỂM TRA ĐÀO OFFLINE (Khi tắt tab vẫn tính cá)
function checkOfflineMining() {
    if (!startTime) return;

    const now = Date.now();
    const start = parseInt(startTime);
    const elapsed = now - start;

    if (elapsed < MINING_DURATION) {
        // Vẫn đang trong thời gian 3 tiếng: cộng bù cá và chạy tiếp
        const offlineFish = (elapsed / 1000) * miningSpeed;
        fish += offlineFish;
        startMiningSession(MINING_DURATION - elapsed);
    } else {
        // Đã quá 3 tiếng kể từ lúc bấm: chỉ cộng tối đa 3 tiếng cá
        const maxFish = (MINING_DURATION / 1000) * miningSpeed;
        fish += maxFish;
        stopMiningSession();
    }
    saveData();
    updateUI();
}

// 2. XỬ LÝ QUẢNG CÁO
function startAds() {
    if (startTime) return; // Đang đào thì không bấm lại được

    btnMine.disabled = true;
    btnMine.innerHTML = `<span class="loading-spinner"></span> ĐANG XEM...`;

    // Giả lập xem quảng cáo 3 giây
    setTimeout(() => {
        const now = Date.now();
        localStorage.setItem('startTime', now);
        startTime = now;
        startMiningSession(MINING_DURATION);
    }, 3000);
}

// 3. LOGIC ĐÀO CÁ & ĐẾM NGƯỢC
function startMiningSession(durationLeft) {
    let timeLeft = Math.floor(durationLeft / 1000);
    
    btnMine.disabled = true;
    btnMine.innerHTML = "ĐANG ĐÀO...";
    btnMine.classList.add('bg-green-700');
    btnMine.classList.remove('bg-blue-600');
    timerDisplay.classList.remove('hidden');

    clearInterval(miningInterval);
    clearInterval(timerInterval);

    // Cộng cá mỗi giây
    miningInterval = setInterval(() => {
        fish += miningSpeed;
        fishDisplay.innerText = Math.floor(fish);
        // Lưu dữ liệu mỗi 5 giây để tránh mất mát nếu tắt web đột ngột
        if (Math.floor(fish) % 5 === 0) saveData();
    }, 1000);

    // Đồng hồ đếm ngược
    timerInterval = setInterval(() => {
        timeLeft--;
        updateTimerUI(timeLeft);

        if (timeLeft <= 0) {
            stopMiningSession();
        }
    }, 1000);
}

function stopMiningSession() {
    clearInterval(miningInterval);
    clearInterval(timerInterval);
    localStorage.removeItem('startTime');
    startTime = null;
    
    btnMine.disabled = false;
    btnMine.innerHTML = "RA KHƠI";
    btnMine.classList.add('bg-blue-600');
    btnMine.classList.remove('bg-green-700');
    timerDisplay.classList.add('hidden');
    saveData();
}

// 4. CÁC HÀM TIỆN ÍCH
function saveData() {
    localStorage.setItem('fish', fish);
    localStorage.setItem('coins', coins);
    localStorage.setItem('miningSpeed', miningSpeed);
}

function updateUI() {
    fishDisplay.innerText = Math.floor(fish);
    coinDisplay.innerText = coins;
    speedDisplay.innerText = `${miningSpeed.toFixed(1)} cá/s`;
}

function updateTimerUI(seconds) {
    let hrs = Math.floor(seconds / 3600);
    let mins = Math.floor((seconds % 3600) / 60);
    let secs = seconds % 60;
    timerDisplay.innerText = `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

// 5. CÁC HÀNH ĐỘNG TÍCH HỢP TẠI HOME
function handleSell() {
    if (fish >= 1) {
        let earnedCoins = Math.floor(fish) * 2;
        coins += earnedCoins;
        fish = 0;
        saveData();
        updateUI();
        alert(`Đã bán! Nhận được ${earnedCoins} 💰`);
    } else {
        alert("Cần ít nhất 1 cá để bán!");
    }
}

function handleUpgrade() {
    const cost = 50;
    if (coins >= cost) {
        coins -= cost;
        miningSpeed += 0.5;
        saveData();
        updateUI();
        alert("Nâng cấp thành công!");
    } else {
        alert("Bạn cần 50 xu!");
    }
}

// 6. LOGIC CHUYỂN TAB
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
