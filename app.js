const tg = window.Telegram.WebApp;
tg.ready();
tg.expand();

// ĐỊNH DANH USER (Dùng ID Telegram để không trùng data)
const userId = tg.initDataUnsafe?.user?.id || 'guest_user';
const STORAGE_KEY = `fish_mining_data_${userId}`;

// --- KHỞI TẠO DỮ LIỆU ---
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
const MINING_DURATION = 3 * 60 * 60 * 1000; // 3 tiếng
const MAX_UPGRADES = 10;
const UPGRADE_COSTS = [1000, 2500, 7500, 10000, 15000, 18000, 22000, 30000, 40000, 50000];

// DOM Elements
const fishDisplay = document.getElementById('fish-count');
const coinDisplay = document.getElementById('coin-balance');
const speedDisplay = document.getElementById('mining-speed');
const btnMine = document.getElementById('btn-mine');
const timerDisplay = document.getElementById('timer-display');
const shipIcon = document.getElementById('ship-icon');

window.onload = () => {
    updateUI();
    checkOfflineMining();
};

function saveData() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

function updateUI() {
    fishDisplay.innerText = Math.floor(data.fish);
    coinDisplay.innerText = data.coins;
    speedDisplay.innerText = `${data.miningSpeed.toFixed(1)} cá/s`;
    
    const btnUpgrade = document.getElementById('btn-upgrade');
    const cost = UPGRADE_COSTS[data.upgradeCount] || 0;
    if (data.upgradeCount >= MAX_UPGRADES) {
        btnUpgrade.innerText = "MAX LEVEL (10/10)";
        btnUpgrade.classList.replace('bg-purple-600', 'bg-slate-600');
        btnUpgrade.disabled = true;
    } else {
        btnUpgrade.innerText = `NÂNG CẤP (${cost} 💰)`;
    }
}

// --- LOGIC ĐÀO CÁ ---
function checkOfflineMining() {
    if (!data.startTime) return;
    const elapsed = Date.now() - parseInt(data.startTime);
    if (elapsed < MINING_DURATION) {
        data.fish += (elapsed / 1000) * data.miningSpeed;
        startMiningSession(MINING_DURATION - elapsed);
    } else {
        data.fish += (MINING_DURATION / 1000) * data.miningSpeed;
        stopMining();
    }
    updateUI();
}

function startAds() {
    if (data.startTime) return;
    btnMine.disabled = true;
    btnMine.innerHTML = `<span class="loading-spinner"></span> ĐANG XEM...`;
    
    setTimeout(() => {
        data.startTime = Date.now();
        saveData();
        startMiningSession(MINING_DURATION);
    }, 3000);
}

let mInterval, tInterval;
function startMiningSession(msLeft) {
    let secondsLeft = Math.floor(msLeft / 1000);
    btnMine.disabled = true;
    btnMine.innerText = "ĐANG ĐÀO...";
    btnMine.classList.replace('bg-blue-600', 'bg-green-600');
    timerDisplay.classList.remove('hidden');
    shipIcon.classList.add('mining');

    clearInterval(mInterval);
    clearInterval(tInterval);

    mInterval = setInterval(() => {
        data.fish += data.miningSpeed;
        fishDisplay.innerText = Math.floor(data.fish);
        if(Math.floor(data.fish) % 10 === 0) saveData();
    }, 1000);

    tInterval = setInterval(() => {
        secondsLeft--;
        let h = Math.floor(secondsLeft/3600).toString().padStart(2,'0');
        let m = Math.floor((secondsLeft%3600)/60).toString().padStart(2,'0');
        let s = (secondsLeft%60).toString().padStart(2,'0');
        timerDisplay.innerText = `${h}:${m}:${s}`;
        if(secondsLeft <= 0) stopMining();
    }, 1000);
}

function stopMining() {
    clearInterval(mInterval);
    clearInterval(tInterval);
    data.startTime = null;
    btnMine.disabled = false;
    btnMine.innerText = "RA KHƠI";
    btnMine.classList.replace('bg-green-600', 'bg-blue-600');
    timerDisplay.classList.add('hidden');
    shipIcon.classList.remove('mining');
    saveData();
}

// --- ACTIONS ---
function handleSell() {
    const amount = Math.floor(data.fish);
    if (amount >= 1) {
        data.coins += amount * 2;
        data.fish = 0;
        saveData();
        updateUI();
    }
}

function handleUpgrade() {
    const cost = UPGRADE_COSTS[data.upgradeCount]; // Đổi currentCost thành cost cho đồng bộ
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


function switchTab(name) {
    document.querySelectorAll('.tab-content').forEach(t => t.classList.add('hidden'));
    document.getElementById(`tab-${name}`).classList.remove('hidden');
    document.querySelectorAll('.nav-item').forEach(n => {
        n.classList.replace('text-blue-400', 'text-gray-500');
    });
    document.getElementById(`nav-${name}`).classList.replace('text-gray-500', 'text-blue-400');
}
