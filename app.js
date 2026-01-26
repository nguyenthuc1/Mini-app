const tg = window.Telegram.WebApp;
tg.ready();
tg.expand();

// 1. ĐỊNH DANH USER
const userId = tg.initDataUnsafe?.user?.id || 'guest_user';
const STORAGE_KEY = `fish_mining_data_${userId}`;

// 2. CẤU HÌNH
const UPGRADE_COSTS = [500, 1000, 2000, 4000, 7000, 12000, 18000, 25000, 35000, 50000, 70000, 100000, 140000, 190000, 250000];
const MAX_UPGRADES = UPGRADE_COSTS.length;
const MINING_DURATION = 3 * 60 * 60 * 1000;
const RATIO = 0.00463; // Tỷ giá đổi xu

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
const shipLevelDisplay = document.getElementById('ship-level');
const walletCoinDisplay = document.getElementById('wallet-coin-balance');
const withdrawInput = document.getElementById('withdraw-amount');
const vndReceive = document.getElementById('vnd-receive');

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
    
    // 1. Hiển thị Kho Cá
    if (fishDisplay) fishDisplay.innerText = totalFish.toLocaleString();

    // 2. Tính toán Xu dự kiến và Cá dư (Cách B)
    const RATIO = 0.00463;
    const coinsCanGet = Math.floor(totalFish * RATIO);
    const fishUsed = coinsCanGet / RATIO;
    const excess = totalFish - fishUsed;

    // 3. Hiển thị thông số phụ
    if (excessFishDisplay) excessFishDisplay.innerText = Math.floor(excess).toLocaleString();
    if (estimatedCoinsDisplay) estimatedCoinsDisplay.innerText = coinsCanGet.toLocaleString();

    // 4. Hiển thị Level tàu (Đã có ID ship-level trong index.html)
    if (shipLevelDisplay) {
        shipLevelDisplay.innerText = (data.upgradeCount + 1);
    }

    // 5. Các thông số cơ bản khác
    if (coinDisplay) coinDisplay.innerText = data.coins.toLocaleString();
    if (speedDisplay) speedDisplay.innerText = `${data.miningSpeed.toFixed(1)} cá/s`;

    // 6. Cập nhật trạng thái nút Nâng cấp
    if (data.upgradeCount >= MAX_UPGRADES) {
        btnUpgrade.innerText = "MAX LEVEL";
        btnUpgrade.disabled = true;
        btnUpgrade.classList.add('opacity-50');
    } else {
        const cost = UPGRADE_COSTS[data.upgradeCount];
        btnUpgrade.innerText = `NÂNG CẤP (${cost ? cost.toLocaleString() : '---'} 💰)`;
        btnUpgrade.disabled = false;
        btnUpgrade.classList.remove('opacity-50');
    }
 if (walletCoinDisplay) {
        walletCoinDisplay.innerText = data.coins.toLocaleString();
    }
}

// Hàm tính toán tiền VNĐ thực tế
function calcVnd() {
    const amount = parseInt(withdrawInput.value) || 0;
    // Tỷ lệ 1 xu = 1 VNĐ
    vndReceive.innerText = amount.toLocaleString() + " VNĐ";
}

// Hàm xử lý rút tiền
function handleWithdraw() {
    const amount = parseInt(withdrawInput.value) || 0;
    if (amount < 20000) {
        tg.showAlert("❌ Số tiền rút tối thiểu là 20.000 Xu!");
        return;
    }
    if (amount > data.coins) {
        tg.showAlert("❌ Số dư xu không đủ!");
        return;
    }
    
    tg.showConfirm(`Bạn chắc chắn muốn rút ${amount.toLocaleString()} VNĐ?`, (confirmed) => {
        if (confirmed) {
            data.coins -= amount;
            saveData(); // Lưu theo userId [cite: 2026-01-24]
            updateUI();
            withdrawInput.value = "";
            vndReceive.innerText = "0 VNĐ";
            tg.showAlert("✅ Gửi yêu cầu thành công! Tiền sẽ về ví sau khi Admin duyệt.");
        }
    });
}


// 5. XỬ LÝ ĐÀO
function checkOfflineMining() {
    if (!data.startTime) return;
    const now = Date.now();
    const elapsed = now - parseInt(data.startTime);

    if (elapsed >= MINING_DURATION) {
        stopMining();
    } else {
        timerDisplay?.classList.remove('hidden');
        btnMine.disabled = true;
        btnMine.innerText = "ĐANG RA KHƠI...";
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
        updateTimerUI(Math.floor((MINING_DURATION - elapsed) / 1000));
        updateUI();
    }, 1000);
}

function startAds() {
    if (data.startTime) return;
    btnMine.disabled = true;
    btnMine.innerHTML = "ĐANG XEM...";
    setTimeout(() => {
        data.startTime = Date.now();
        timerDisplay?.classList.remove('hidden');
        btnMine.innerText = "ĐANG RA KHƠI...";
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

// 6. BÁN & NÂNG CẤP

function handleSell() {
    let currentMiningFish = 0;
    let now = Date.now();
    
    // 1. Tính số cá đang đào được tại thời điểm bấm nút
    if (data.startTime) {
        const start = parseInt(data.startTime);
        const elapsed = Math.min(now - start, MINING_DURATION);
        currentMiningFish = (elapsed / 1000) * data.miningSpeed;
    }

    // 2. Tổng số cá thực tế đang có
    const totalFishAvailable = data.fish + currentMiningFish;
    const RATIO = 0.00463;
    const earnings = Math.floor(totalFishAvailable * RATIO);

    if (earnings >= 1) {
        // 3. Tính số cá tương ứng với số xu nguyên đã bán
        const fishUsed = earnings / RATIO;

        // 4. CẬP NHẬT DỮ LIỆU (Sửa lỗi trừ cá ở đây)
        data.coins += earnings;
        
        if (data.startTime) {
            // Nếu đang đào: Cập nhật lại mốc bắt đầu là BÂY GIỜ
            // Và số cá gốc (data.fish) sẽ là số dư sau khi trừ
            data.fish = totalFishAvailable - fishUsed;
            data.startTime = now; 
        } else {
            // Nếu không đào: Trừ thẳng vào kho
            data.fish = totalFishAvailable - fishUsed;
        }

        saveData(); // Lưu theo userId [cite: 2026-01-24]
        updateUI();

tg.showAlert(`💰 Bán thành công!\nNhận được: ${earnings.toLocaleString()} xu\nTương đương: ${earnings.toLocaleString()} VNĐ`);

    } else {
        const fishNeeded = Math.ceil(1 / RATIO);
        tg.showAlert(`❌ Bạn cần ít nhất ${fishNeeded} cá để đổi được 1 xu!`);
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

function switchTab(name) {
    document.querySelectorAll('.tab-content').forEach(t => t.classList.add('hidden'));
    document.getElementById(`tab-${name}`)?.classList.remove('hidden');
    document.querySelectorAll('.nav-item').forEach(n => n.classList.replace('text-blue-400', 'text-gray-500'));
    document.getElementById(`nav-${name}`)?.classList.replace('text-gray-500', 'text-blue-400');
}

function resetDataForDev() {
    data.coins += 20000;
    saveData();
    updateUI();
    tg.showAlert("💰 Đã bơm 20.000 xu để test rút tiền!");
}

// 7. KHỞI CHẠY
window.onload = () => {
    updateUI();
    checkOfflineMining();

    if (btnMine) btnMine.onclick = startAds;
    if (btnUpgrade) btnUpgrade.onclick = handleUpgrade;
    if (btnSell) btnSell.onclick = handleSell;
};
