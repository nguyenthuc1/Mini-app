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
const GLOBAL_RATIO = 0.00463; // Đổi tên để tránh trùng lặp

// 3. KHỞI TẠO DỮ LIỆU
function loadData() {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY)) || {};
    return {
        fish: parseFloat(saved.fish) || 0,
        coins: parseInt(saved.coins) || 0,
        miningSpeed: parseFloat(saved.miningSpeed) || 0.5,
        upgradeCount: parseInt(saved.upgradeCount) || 0,
        startTime: saved.startTime || null,
        history: saved.history || []
    };
}

let data = loadData();
let tInterval;
let isAppBusy = false;

// 4. DOM ELEMENTS
const fishDisplay = document.getElementById('fish-count');
const coinDisplay = document.getElementById('coin-balance');
const speedDisplay = document.getElementById('mining-speed');
const btnMine = document.getElementById('btn-mine');
const timerDisplay = document.getElementById('timer-display');
const btnUpgrade = document.getElementById('btn-upgrade');
const btnSell = document.getElementById('btn-sell');
const excessFishDisplay = document.getElementById('excess-fish');
const estimatedCoinsDisplay = document.getElementById('estimated-coins');
const shipLevelDisplay = document.getElementById('ship-level');
const walletCoinDisplay = document.getElementById('wallet-coin-balance');
const withdrawInput = document.getElementById('withdraw-amount');
const vndReceive = document.getElementById('vnd-receive');

// 5. CÁC HÀM CỐT LÕI
function wrapAction(actionFn) {
    return function(...args) {
        if (isAppBusy) return; 
        isAppBusy = true;
        actionFn(...args);
        setTimeout(() => { isAppBusy = false; }, 500);
    };
}

function saveData() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

function updateUI() {
    let currentFish = data.fish;
    if (data.startTime) {
        const elapsed = (Date.now() - parseInt(data.startTime)) / 1000;
        const mined = elapsed * data.miningSpeed;
        currentFish = data.fish + mined;
    }
    
    const totalFish = Math.floor(Math.max(0, currentFish));
    
    // Cập nhật giao diện
    if (fishDisplay) fishDisplay.innerText = totalFish.toLocaleString();
    
    const coinsCanGet = Math.floor(totalFish * GLOBAL_RATIO);
    const fishUsed = coinsCanGet / GLOBAL_RATIO;
    const excess = totalFish - fishUsed;

    if (excessFishDisplay) excessFishDisplay.innerText = Math.floor(excess).toLocaleString();
    if (estimatedCoinsDisplay) estimatedCoinsDisplay.innerText = coinsCanGet.toLocaleString();
    if (shipLevelDisplay) shipLevelDisplay.innerText = (data.upgradeCount + 1);
    if (coinDisplay) coinDisplay.innerText = data.coins.toLocaleString();
    if (speedDisplay) speedDisplay.innerText = `${data.miningSpeed.toFixed(1)} cá/s`;
    if (walletCoinDisplay) walletCoinDisplay.innerText = data.coins.toLocaleString();

    // Nút nâng cấp
    if (btnUpgrade) {
        if (data.upgradeCount >= MAX_UPGRADES) {
            btnUpgrade.innerText = "MAX LEVEL";
            btnUpgrade.disabled = true;
        } else {
            const cost = UPGRADE_COSTS[data.upgradeCount];
            btnUpgrade.innerText = `NÂNG CẤP (${cost.toLocaleString()} 💰)`;
        }
    }
}

function updateHistoryUI() {
    const historyContainer = document.querySelector('#tab-wallet .mt-8 .bg-[#1e293b]\\/40');
    if (!historyContainer) return;

    if (!data.history || data.history.length === 0) {
        historyContainer.innerHTML = '<p class="text-[11px] text-slate-500 italic">Chưa có giao dịch</p>';
        return;
    }

    let html = '<div class="space-y-3 w-full">';
    data.history.forEach(item => {
        html += `
            <div class="flex justify-between items-center p-3 bg-[#0f172a] rounded-2xl border border-slate-700 text-[10px]">
                <div class="text-left">
                    <p class="font-bold">Rút -${item.amount.toLocaleString()} 💰</p>
                    <p class="text-gray-500">${item.time}</p>
                </div>
                <div class="text-right">
                    <span class="text-yellow-400">${item.status}</span>
                    <p class="text-gray-400">${item.bank}</p>
                </div>
            </div>`;
    });
    historyContainer.innerHTML = html + '</div>';
}

// 6. XỬ LÝ ĐÀO & BÁN
function startAds() {
    if (data.startTime) return;
    btnMine.innerText = "ĐANG XEM ADS...";
    setTimeout(() => {
        data.startTime = Date.now();
        saveData();
        checkOfflineMining(); // Khởi động timer
    }, 2000);
}

function checkOfflineMining() {
    if (!data.startTime) return;
    clearInterval(tInterval);
    
    tInterval = setInterval(() => {
        const elapsed = Date.now() - parseInt(data.startTime);
        if (elapsed >= MINING_DURATION) {
            stopMining();
        } else {
            timerDisplay?.classList.remove('hidden');
            btnMine.disabled = true;
            btnMine.innerText = "ĐANG RA KHƠI...";
            updateTimerUI(Math.floor((MINING_DURATION - elapsed) / 1000));
            updateUI();
        }
    }, 1000);
}

function stopMining() {
    const totalFishFromSession = (MINING_DURATION / 1000) * data.miningSpeed;
    data.fish += totalFishFromSession;
    data.startTime = null;
    clearInterval(tInterval);
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

function handleSell() {
    let displayFish = data.fish;
    if (data.startTime) {
        const elapsed = (Date.now() - parseInt(data.startTime)) / 1000;
        displayFish += (elapsed * data.miningSpeed);
    }

    const earnings = Math.floor(displayFish * GLOBAL_RATIO);
    if (earnings >= 1) {
        const fishUsed = earnings / GLOBAL_RATIO;
        data.coins += earnings;
        data.fish = displayFish - fishUsed;
        if (data.startTime) data.startTime = Date.now(); // Reset mốc đào
        
        saveData();
        updateUI();
        tg.showAlert(`💰 Nhận được ${earnings.toLocaleString()} xu!`);
    } else {
        tg.showAlert("❌ Bạn chưa có đủ cá để đổi ít nhất 1 xu!");
    }
}

function handleUpgrade() {
    const cost = UPGRADE_COSTS[data.upgradeCount];
    if (data.coins >= cost) {
        data.coins -= cost;
        data.upgradeCount++;
        data.miningSpeed += 0.5;
        saveData();
        updateUI();
        tg.showAlert("🚀 Nâng cấp thành công!");
    } else {
        tg.showAlert("❌ Không đủ xu!");
    }
}

// 7. RÚT TIỀN
function handleWithdraw() {
    const accName = document.getElementById('account-name')?.value.trim();
    const bankName = document.getElementById('bank-name')?.value.trim();
    const bankAcc = document.getElementById('bank-account')?.value.trim();
    const amount = parseInt(withdrawInput.value) || 0;

    if (!accName || !bankName || !bankAcc || amount < 20000) {
        tg.showAlert("❌ Vui lòng nhập đầy đủ thông tin (Rút tối thiểu 20.000)!");
        return;
    }
    if (amount > data.coins) {
        tg.showAlert("❌ Số dư không đủ!");
        return;
    }

    tg.showConfirm("Xác nhận gửi lệnh rút?", (ok) => {
        if (ok) {
            data.coins -= amount;
            data.history.unshift({
                amount: amount,
                bank: bankName,
                time: new Date().toLocaleString('vi-VN'),
                status: 'Đang xử lý'
            });
            saveData();
            updateUI();
            updateHistoryUI();
            tg.showAlert("✅ Đã gửi lệnh rút tới Admin!");
        }
    });
}

function calcVnd() {
    const amount = parseInt(withdrawInput.value) || 0;
    if (vndReceive) vndReceive.innerText = amount.toLocaleString() + " VNĐ";
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
}

// 8. KHỞI CHẠY
window.onload = () => {
    updateUI();
    checkOfflineMining();
    updateHistoryUI();

    if (btnMine) btnMine.onclick = wrapAction(startAds);
    if (btnSell) btnSell.onclick = wrapAction(handleSell);
    if (btnUpgrade) btnUpgrade.onclick = wrapAction(handleUpgrade);
    
    const btnWithdraw = document.getElementById('btn-withdraw'); 
    if (btnWithdraw) btnWithdraw.onclick = wrapAction(handleWithdraw);
};
