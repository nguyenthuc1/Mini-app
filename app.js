const tg = window.Telegram.WebApp;
tg.ready();
tg.expand();

// 1. ĐỊNH DANH USER
const userId = tg.initDataUnsafe?.user?.id || 'guest_user';
const STORAGE_KEY = `fish_mining_data_${userId}`;

// 2. CẤU HÌNH BẢNG GIÁ & HẰNG SỐ (15 cấp độ như đã thảo luận)
const UPGRADE_COSTS = [500, 1000, 2000, 4000, 7000, 12000, 18000, 25000, 35000, 50000, 70000, 100000, 140000, 190000, 250000]; 
const MAX_UPGRADES = UPGRADE_COSTS.length; 
const MINING_DURATION = 3 * 60 * 60 * 1000; 

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
let tInterval;

// DOM Elements
const fishDisplay = document.getElementById('fish-count');
const coinDisplay = document.getElementById('coin-balance');
const speedDisplay = document.getElementById('mining-speed');
const btnMine = document.getElementById('btn-mine');
const timerDisplay = document.getElementById('timer-display');
const shipIcon = document.getElementById('ship-icon');
const btnUpgrade = document.getElementById('btn-upgrade');
const btnSell = document.getElementById('btn-sell');
const excessFishDisplay = document.getElementById('excess-fish');
const estimatedCoinsDisplay = document.getElementById('estimated-coins');

// 4. CÁC HÀM CỐT LÕI
function saveData() {
    if (isNaN(data.fish)) data.fish = 0;
    if (isNaN(data.coins)) data.coins = 0;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

function updateUI() {
    let displayFish = data.fish;
    if (data.startTime) {
        const elapsed = (Date.now() - parseInt(data.startTime)) / 1000;
        displayFish = data.fish + (elapsed * data.miningSpeed);
    }

    const totalFish = Math.floor(Math.max(0, displayFish));
    fishDisplay.innerText = totalFish.toLocaleString();

    const RATIO = 0.00463;
    const coinsCanGet = Math.floor(totalFish * RATIO);
    const fishUsedForCoins = coinsCanGet / RATIO;
    const excessFish = totalFish - fishUsedForCoins;

    if (excessFishDisplay) excessFishDisplay.innerText = Math.floor(excessFish).toLocaleString();
    if (estimatedCoinsDisplay) estimatedCoinsDisplay.innerText = coinsCanGet.toLocaleString();

    coinDisplay.innerText = data.coins.toLocaleString();
    speedDisplay.innerText = `${data.miningSpeed.toFixed(1)} cá/s`;

    if (data.upgradeCount >= MAX_UPGRADES) {
        btnUpgrade.innerText = "MAX LEVEL";
        btnUpgrade.disabled = true;
        btnUpgrade.classList.add('opacity-50', 'cursor-not-allowed');
    } else {
        const cost = UPGRADE_COSTS[data.upgradeCount];
        btnUpgrade.innerText = `NÂNG CẤP (${cost ? cost.toLocaleString() : '---'} 💰)`;
        btnUpgrade.disabled = false;
        btnUpgrade.classList.remove('opacity-50');
    }
}

// 5. XỬ LÝ ĐÀO CÁ
function checkOfflineMining() {
    if (!data.startTime) return;
    const now = Date.now();
    const start = parseInt(data.startTime);
    const elapsed = now - start;

    if (elapsed >= MINING_DURATION) {
        stopMining(); 
    } else {
        if (timerDisplay) timerDisplay.classList.remove('hidden');
        if (btnMine) {
            btnMine.disabled = true;
            btnMine.innerText = "ĐANG RA KHƠI...";
        }
        startMiningSession(); 
    }
    updateUI();
}

function startMiningSession() {
    if (!data.startTime) return;
    const start = parseInt(data.startTime);
    clearInterval(tInterval);
    tInterval = setInterval(() => {
        const now = Date.now();
        const elapsed = now - start;
        if (elapsed >= MINING_DURATION) {
            stopMining();
            return;
        }
        const secondsLeft = Math.floor((MINING_DURATION - elapsed) / 1000);
        updateTimerUI(secondsLeft); 
        updateUI();
    }, 1000);
}

function startAds() {
    if (data.startTime) return;
    btnMine.disabled = true;
    btnMine.innerHTML = `ĐANG XEM...`;
    setTimeout(() => {
        data.startTime = Date.now();
        if (timerDisplay) timerDisplay.classList.remove('hidden');
        btnMine.innerText = "ĐANG RA KHƠI...";
        shipIcon?.classList.add('mining');
        saveData();
        startMiningSession();
    }, 3000);
}

function stopMining() {
    const totalFishFromSession = (MINING_DURATION / 1000) * data.miningSpeed;
    data.fish += totalFishFromSession;
    clearInterval(tInterval);
    data.startTime = null; 
    btnMine.disabled = false;
    btnMine.innerText = "RA KHƠI";
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
        const effectiveElapsed = Math.min(now - start, MINING_DURATION);
        currentMiningFish = (effectiveElapsed / 1000) * data.miningSpeed;
    }
    const totalFishAvailable = data.fish + currentMiningFish;
    const RATIO = 0.00463;
    const earnings = Math.floor(totalFishAvailable * RATIO);

    if (earnings >= 1) {
        const fishUsed = earnings / RATIO;
        data.coins += earnings;
        data.fish = totalFishAvailable - fishUsed;
        saveData(); // Lưu theo userId [cite: 2026-01-24]
        updateUI();
        tg.showAlert(`💰 Nhận được ${earnings.toLocaleString()} xu.`);
    } else {
        tg.showAlert(`❌ Cần ít nhất ${Math.ceil(1/RATIO)} cá!`);
    }
}

function handleUpgrade() {
    const cost = UPGRADE_COSTS[data.upgradeCount];
    if (data.coins >= cost && data.upgradeCount < MAX_UPGRADES) {
        if (data.startTime) {
            const elapsed = (Date.now() - parseInt(data.startTime)) / 1000;
            data.fish -= (elapsed * 0.32); 
        }
        data.coins -= cost;
        data.upgradeCount++;
        data.miningSpeed += 0.32; 
        saveData();
        updateUI();
        tg.showAlert("🚀 Nâng cấp thành công!");
    } else {
        tg.showAlert("❌ Không đủ xu!");
    }
}

// 7. TIỆN ÍCH
function switchTab(name) {
    document.querySelectorAll('.tab-content').forEach(t => t.classList.add('hidden'));
    document.getElementById(`tab-${name}`)?.classList.remove('hidden');
    document.querySelectorAll('.nav-item').forEach(n => n.classList.replace('text-blue-400', 'text-gray-500'));
    document.getElementById(`nav-${name}`)?.classList.replace('text-gray-500', 'text-blue-400');
}

function resetDataForDev() {
    tg.showConfirm("Xóa sạch dữ liệu chơi lại từ đầu?", (confirmed) => {
        if (confirmed) {
            localStorage.removeItem(STORAGE_KEY);
            location.reload();
        }
    });
}

// KHỞI CHẠY (Sửa lỗi gán sự kiện tại đây)
window.onload = () => {
    updateUI();
    if (data.startTime) {
        btnMine.disabled = true;
        btnMine.innerText = "ĐANG RA KHƠI...";
        shipIcon?.classList.add('mining');
        timerDisplay?.classList.remove('hidden'); 
    }
    checkOfflineMining();

    // Gán sự kiện cho nút
    if (btnMine) btnMine.onclick = startAds;
    if (btnUpgrade) btnUpgrade.onclick = handleUpgrade;
    if (btnSell) btnSell.onclick = handleSell;
};
