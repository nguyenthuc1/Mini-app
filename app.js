// Khởi tạo Telegram WebApp
const tg = window.Telegram.WebApp;
tg.ready();

// Lấy User ID từ Telegram để tránh trùng lặp dữ liệu
const userId = tg.initDataUnsafe?.user?.id || 'guest';
const storageKey = `mining_data_${userId}`;

// --- KHỞI TẠO DỮ LIỆU ---
function loadUserData() {
    const savedData = JSON.parse(localStorage.getItem(storageKey)) || {};
    return {
        fish: parseFloat(savedData.fish) || 0,
        coins: parseInt(savedData.coins) || 0,
        miningSpeed: parseFloat(savedData.miningSpeed) || 0.5,
        startTime: savedData.startTime || null,
        upgradeCount: parseInt(savedData.upgradeCount) || 0 // Thêm biến đếm số lần nâng cấp
    };
}

let userData = loadUserData();
let fish = userData.fish;
let coins = userData.coins;
let miningSpeed = userData.miningSpeed;
let startTime = userData.startTime;
let upgradeCount = userData.upgradeCount;

// Các phần tử giao diện
const fishDisplay = document.getElementById('fish-count');
const coinDisplay = document.getElementById('coin-balance');
const speedDisplay = document.getElementById('mining-speed');
const btnMine = document.getElementById('btn-mine');
const timerDisplay = document.getElementById('timer-display');

const MINING_DURATION = 3 * 60 * 60 * 1000; // 3 tiếng
const MAX_UPGRADES = 10; // Giới hạn 10 lần nâng cấp

window.onload = () => {
    updateUI();
    checkOfflineMining();
};

// 1. LƯU DỮ LIỆU
function saveData() {
    const dataToSave = {
        fish: fish,
        coins: coins,
        miningSpeed: miningSpeed,
        startTime: startTime,
        upgradeCount: upgradeCount
    };
    localStorage.setItem(storageKey, JSON.stringify(dataToSave));
}

// 2. TÍNH TOÁN GIÁ NÂNG CẤP (Công thức: 50 * (lần_nâng + 1))
function getUpgradeCost() {
    return 50 * (upgradeCount + 1);
}

// 3. LOGIC NÂNG CẤP (UPGRADE)
function handleUpgrade() {
    if (upgradeCount >= MAX_UPGRADES) {
        alert("Bạn đã đạt cấp độ tối đa (10/10)!");
        return;
    }

    const currentCost = getUpgradeCost();

    if (coins >= currentCost) {
        coins -= currentCost;
        upgradeCount++; // Tăng số lần đã nâng
        miningSpeed += 0.5; // Tăng tốc độ đào
        
        saveData();
        updateUI();
        
        alert(`Nâng cấp thành công lần ${upgradeCount}/10!\nGiá lần tới: ${getUpgradeCost()} 💰`);
    } else {
        alert(`Bạn cần ${currentCost} xu để nâng cấp!`);
    }
}

// 4. CẬP NHẬT GIAO DIỆN
function updateUI() {
    fishDisplay.innerText = Math.floor(fish);
    coinDisplay.innerText = coins;
    speedDisplay.innerText = `${miningSpeed.toFixed(1)} cá/s`;
    
    // Cập nhật text trên nút Upgrade (nếu bạn muốn hiển thị giá trên nút)
    const btnUpgrade = document.querySelector('button[onclick="handleUpgrade()"]');
    if (upgradeCount >= MAX_UPGRADES) {
        btnUpgrade.innerHTML = "MAX LEVEL";
        btnUpgrade.classList.replace('bg-purple-600', 'bg-gray-600');
    } else {
        btnUpgrade.innerHTML = `UPGRADE (${getUpgradeCost()} 💰)`;
    }
}

// 5. CÁC LOGIC ĐÀO CÁ & OFFLINE (Giữ nguyên từ bản trước)
function checkOfflineMining() {
    if (!startTime) return;
    const now = Date.now();
    const elapsed = now - parseInt(startTime);

    if (elapsed < MINING_DURATION) {
        fish += (elapsed / 1000) * miningSpeed;
        startMiningSession(MINING_DURATION - elapsed);
    } else {
        fish += (MINING_DURATION / 1000) * miningSpeed;
        stopMiningSession();
    }
    saveData();
    updateUI();
}

function startAds() {
    if (startTime) return;
    btnMine.disabled = true;
    btnMine.innerHTML = `ĐANG XEM...`;
    setTimeout(() => {
        startTime = Date.now();
        saveData();
        startMiningSession(MINING_DURATION);
    }, 3000);
}

let timerInterval, miningInterval;
function startMiningSession(durationLeft) {
    let timeLeft = Math.floor(durationLeft / 1000);
    btnMine.disabled = true;
    btnMine.innerHTML = "ĐANG ĐÀO...";
    btnMine.classList.add('bg-green-700');
    timerDisplay.classList.remove('hidden');

    clearInterval(miningInterval);
    clearInterval(timerInterval);

    miningInterval = setInterval(() => {
        fish += miningSpeed;
        fishDisplay.innerText = Math.floor(fish);
        if (Math.floor(fish) % 5 === 0) saveData();
    }, 1000);

    timerInterval = setInterval(() => {
        timeLeft--;
        updateTimerUI(timeLeft);
        if (timeLeft <= 0) stopMiningSession();
    }, 1000);
}

function stopMiningSession() {
    clearInterval(miningInterval);
    clearInterval(timerInterval);
    startTime = null;
    btnMine.disabled = false;
    btnMine.innerHTML = "RA KHƠI";
    btnMine.classList.remove('bg-green-700');
    timerDisplay.classList.add('hidden');
    saveData();
}

function updateTimerUI(seconds) {
    let hrs = Math.floor(seconds / 3600);
    let mins = Math.floor((seconds % 3600) / 60);
    let secs = seconds % 60;
    timerDisplay.innerText = `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

function handleSell() {
    if (fish >= 1) {
        coins += Math.floor(fish) * 2;
        fish = 0;
        saveData();
        updateUI();
    }
}

function switchTab(tabName) {
    const tabs = document.querySelectorAll('.tab-content');
    tabs.forEach(tab => tab.classList.add('hidden'));
    document.getElementById(`tab-${tabName}`).classList.remove('hidden');
    const navItems = document.querySelectorAll('.nav-item');
    navItems.forEach(item => {
        item.classList.remove('text-blue-400');
        item.classList.add('text-gray-500');
    });
    document.getElementById(`nav-${tabName}`).classList.add('text-blue-400');
}
