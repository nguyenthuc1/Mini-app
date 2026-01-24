// Khởi tạo Telegram WebApp
const tg = window.Telegram.WebApp;
tg.ready(); // Thông báo WebApp đã sẵn sàng

// Lấy User ID từ Telegram (nếu chạy ngoài Telegram sẽ dùng 'guest')
const userId = tg.initDataUnsafe?.user?.id || 'guest';

// --- KHỞI TẠO DỮ LIỆU RIÊNG CHO TỪNG USER ID ---
const storageKey = `mining_data_${userId}`;

function loadUserData() {
    const savedData = JSON.parse(localStorage.getItem(storageKey)) || {};
    return {
        fish: parseFloat(savedData.fish) || 0,
        coins: parseInt(savedData.coins) || 0,
        miningSpeed: parseFloat(savedData.miningSpeed) || 0.5,
        startTime: savedData.startTime || null
    };
}

let userData = loadUserData();
let fish = userData.fish;
let coins = userData.coins;
let miningSpeed = userData.miningSpeed;
let startTime = userData.startTime;

// Các phần tử giao diện
const fishDisplay = document.getElementById('fish-count');
const coinDisplay = document.getElementById('coin-balance');
const speedDisplay = document.getElementById('mining-speed');
const btnMine = document.getElementById('btn-mine');
const timerDisplay = document.getElementById('timer-display');

const MINING_DURATION = 3 * 60 * 60 * 1000;
let timerInterval, miningInterval;

window.onload = () => {
    updateUI();
    checkOfflineMining();
    // Hiển thị tên người dùng nếu có
    if(tg.initDataUnsafe?.user?.first_name) {
        console.log("Chào mừng " + tg.initDataUnsafe.user.first_name);
    }
};

// Lưu dữ liệu vào LocalStorage kèm theo ID người dùng
function saveData() {
    const dataToSave = {
        fish: fish,
        coins: coins,
        miningSpeed: miningSpeed,
        startTime: startTime
    };
    localStorage.setItem(storageKey, JSON.stringify(dataToSave));
}

// --- CÁC LOGIC CÒN LẠI (GIỮ NGUYÊN NHƯ CODE TRƯỚC) ---

function checkOfflineMining() {
    if (!startTime) return;
    const now = Date.now();
    const start = parseInt(startTime);
    const elapsed = now - start;

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

function handleSell() {
    if (fish >= 1) {
        coins += Math.floor(fish) * 2;
        fish = 0;
        saveData();
        updateUI();
    }
}

function handleUpgrade() {
    if (coins >= 50) {
        coins -= 50;
        miningSpeed += 0.5;
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
