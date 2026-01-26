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
history: saved.history || []
    };
}

let data = loadData();
let tInterval;
let isAppBusy = false;

function wrapAction(actionFn) {
    return function(...args) {
        if (isAppBusy) return; 
        isAppBusy = true;
        
        actionFn(...args);
        
        // Mở khóa sau 500ms
        setTimeout(() => { isAppBusy = false; }, 500);
    };
}
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
    try {
        const dataToSave = JSON.stringify(data);
        localStorage.setItem(STORAGE_KEY, dataToSave);
    } catch (e) {
        console.error("Lỗi lưu dữ liệu do spam:", e);
    }
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


// Dán hàm mới vào đây
function updateHistoryUI() {
    const historyContainer = document.querySelector('#tab-wallet .mt-8 .bg-[#1e293b]\\/40');
    if (!historyContainer) return;

    if (!data.history || data.history.length === 0) {
        historyContainer.innerHTML = `
            <div class="text-3xl mb-2 opacity-20">📂</div>
            <p class="text-[11px] text-slate-500 italic">Chưa có giao dịch nào được thực hiện</p>
        `;
        return;
    }

    let html = '<div class="space-y-3 w-full">';
    data.history.forEach(item => {
        html += `
            <div class="flex justify-between items-center p-3 bg-[#0f172a] rounded-2xl border border-slate-700">
                <div class="text-left">
                    <p class="text-[10px] font-bold text-white">Rút -${item.amount.toLocaleString()} 💰</p>
                    <p class="text-[8px] text-gray-500">${item.time}</p>
                </div>
                <div class="text-right">
                    <span class="px-2 py-1 rounded-full text-[8px] font-bold ${item.status === 'Thành công' ? 'bg-green-500/20 text-green-400' : 'bg-yellow-500/20 text-yellow-400'}">
                        ${item.status}
                    </span>
                    <p class="text-[8px] text-gray-400 mt-1">${item.bank}</p>
                </div>
            </div>
        `;
    });
    html += '</div>';
    historyContainer.innerHTML = html;
}

// Hàm tính toán tiền VNĐ thực tế
function calcVnd() {
    const amount = parseInt(withdrawInput.value) || 0;
    // Tỷ lệ 1 xu = 1 VNĐ
    vndReceive.innerText = amount.toLocaleString() + " VNĐ";
}

// Hàm xử lý rút tiền

function handleWithdraw() {
    // 1. Lấy thông tin từ các ô Input
    const accountNameInput = document.getElementById('account-name');
    const bankNameInput = document.querySelector('input[placeholder*="MB Bank"]');
    const bankAccountInput = document.querySelector('input[placeholder*="số tài khoản"]');
    
    const accountName = accountNameInput?.value.trim() || "";
    const bankName = bankNameInput?.value.trim() || "";
    const bankAccount = bankAccountInput?.value.trim() || "";
    const amount = parseInt(withdrawInput.value) || 0;

    // 2. Kiểm tra điều kiện nhập liệu
    if (!bankName || !bankAccount || !accountName) {
        tg.showAlert("❌ Vui lòng nhập đầy đủ thông tin ngân hàng!");
        return;
    }
    
    if (amount < 20000) {
        tg.showAlert("❌ Số tiền rút tối thiểu là 20.000 Xu!");
        return;
    }
    
    if (amount > data.coins) {
        tg.showAlert("❌ Số dư xu không đủ!");
        return;
    }
    
    // 3. Xác nhận và gửi lệnh
    tg.showConfirm(`Rút ${amount.toLocaleString()} VNĐ về TK: ${accountName.toUpperCase()}?`, (confirmed) => {
        if (confirmed) {
            data.coins -= amount;
            saveData(); // Lưu theo userId [cite: 2026-01-24]
            updateUI();

            const message = `🔔 LỆNH RÚT TIỀN MỚI
👤 User: ${tg.initDataUnsafe?.user?.first_name || 'Guest'} (ID: ${userId})
💰 Số tiền: ${amount.toLocaleString()} VNĐ
🏦 Ngân hàng: ${bankName}
💳 STK: ${bankAccount}
👤 Chủ TK: ${accountName.toUpperCase()}`;

            const botToken = '8380349652:AAECxqrFHRWGsOSIj-Cb7kgG3tOaC9lir48';
            const adminId = '6068989876';

            fetch(`https://api.telegram.org/bot${botToken}/sendMessage?chat_id=${adminId}&text=${encodeURIComponent(message)}`)
                .then(() => {
const newTransaction = {
    id: Date.now(),
    amount: amount,
    bank: bankName,
    time: new Date().toLocaleString('vi-VN'),
    status: 'Đang xử lý' // Mặc định là đang chờ Admin duyệt
};

data.history.unshift(newTransaction); // Đưa giao dịch mới lên đầu danh sách
saveData(); // Lưu lại theo userId [cite: 2026-01-24]
updateHistoryUI(); // Cập nhật giao diện lịch sử

                    tg.showAlert("✅ Gửi yêu cầu thành công! Admin sẽ xử lý trong 24h.");
                    // Reset form
                    withdrawInput.value = "";
                    if (vndReceive) vndReceive.innerText = "0 VNĐ";
                })
                .catch((err) => {
                    console.error("Lỗi gửi tin nhắn:", err);
                    tg.showAlert("❌ Lỗi mạng, hãy thử lại!");
                });
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

async function handleUpgrade() {
    const btn = document.getElementById('btn-upgrade');
    if (btn.disabled) return; // Chống spam

    btn.disabled = true; // Khóa nút ngay lập tức
    
    const cost = UPGRADE_COSTS[data.upgradeCount];
    if (data.coins >= cost && data.upgradeCount < MAX_UPGRADES) {
        // ... logic nâng cấp của bạn ...
        saveData();
        updateUI();
        tg.showAlert("🚀 Nâng cấp thành công!", () => {
            btn.disabled = false; // Chỉ mở lại sau khi user đóng thông báo
        });
    } else {
        tg.showAlert("❌ Không đủ xu!", () => {
            btn.disabled = false;
        });
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
updateHistoryUI();
   // Gán sự kiện chống spam cho các nút chính
    if (btnMine) btnMine.onclick = wrapAction(startAds);
    if (btnSell) btnSell.onclick = wrapAction(handleSell);
    if (btnUpgrade) btnUpgrade.onclick = wrapAction(handleUpgrade);
    
    // Đừng quên nút "Xác nhận rút tiền" trong tab Wallet
    const btnWithdraw = document.querySelector('.tab-content#tab-wallet button'); 
    if (btnWithdraw) btnWithdraw.onclick = wrapAction(handleWithdraw);
};