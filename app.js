// --- 0. CẤU HÌNH ---
const firebaseConfig = {
    databaseURL: "https://telegram-bot-backup-11c83-default-rtdb.firebaseio.com/"
};

// Khởi tạo
firebase.initializeApp(firebaseConfig);
const db = firebase.database();
const tg = window.Telegram.WebApp;
tg.ready();
tg.expand();

// --- 1. BIẾN TOÀN CỤC ---
const userId = tg.initDataUnsafe?.user?.id || 'guest_user';
const userRef = db.ref('users/' + userId);

const UPGRADE_COSTS = [500, 1000, 2000, 4000, 7000, 12000, 18000, 25000, 35000, 50000, 70000, 100000, 140000, 190000, 250000];
const MINING_DURATION = 3 * 60 * 60 * 1000; // 3 tiếng
const GLOBAL_RATIO = 0.00463;

let data = { fish: 0, coins: 0, miningSpeed: 0.5, upgradeCount: 0, startTime: null, history: [] };
let tInterval;

// --- 2. HÀM ĐỒNG BỘ DỮ LIỆU ---

async function loadDataFromServer() {
    try {
        const snapshot = await userRef.once('value');
        const val = snapshot.val();
        if (val) {
            data = { ...data, ...val };
            if (!data.history) data.history = [];
        } else {
            await userRef.set(data);
        }
        updateUI();
        checkOfflineMining();
        updateHistoryUI();
    } catch (e) {
        console.error("Lỗi tải data:", e);
        tg.showAlert("Không thể kết nối máy chủ!");
    }
}

async function sync() {
    localStorage.setItem('backup_data', JSON.stringify(data));
    try {
        await userRef.update({
            fish: data.fish,
            coins: data.coins,
            miningSpeed: data.miningSpeed,
            upgradeCount: data.upgradeCount,
            startTime: data.startTime,
            history: data.history
        });
    } catch (e) {
        console.error("Lỗi đồng bộ:", e);
    }
}

// --- 3. GIAO DIỆN ---

function switchTab(name) {
    document.querySelectorAll('.tab-content').forEach(t => t.classList.add('hidden'));
    document.getElementById(`tab-${name}`)?.classList.remove('hidden');
    
    document.querySelectorAll('.nav-item').forEach(n => n.classList.replace('text-blue-400', 'text-gray-500'));
    document.getElementById(`nav-${name}`)?.classList.replace('text-gray-500', 'text-blue-400');
}

function updateUI() {
    let currentFish = data.fish;
    if (data.startTime) {
        const elapsed = (Date.now() - data.startTime) / 1000;
        const limit = MINING_DURATION / 1000;
        currentFish += Math.min(elapsed, limit) * data.miningSpeed;
    }

    document.getElementById('fish-count').innerText = Math.floor(currentFish).toLocaleString();
    document.getElementById('coin-balance').innerText = data.coins.toLocaleString();
    document.getElementById('wallet-coin-balance').innerText = data.coins.toLocaleString();
    document.getElementById('mining-speed').innerText = `${data.miningSpeed.toFixed(1)} cá/s`;
    document.getElementById('ship-level').innerText = data.upgradeCount + 1;

    const btnUpgrade = document.getElementById('btn-upgrade');
    if (data.upgradeCount >= UPGRADE_COSTS.length) {
        btnUpgrade.innerText = "MAX LEVEL";
        btnUpgrade.disabled = true;
    } else {
        btnUpgrade.innerText = `NÂNG CẤP (${UPGRADE_COSTS[data.upgradeCount].toLocaleString()} 💰)`;
    }
}

// --- 4. LOGIC CHÍNH ---

function startMining() {
    if (data.startTime) return;
    const btnMine = document.getElementById('btn-mine');
    btnMine.innerText = "RA KHƠI...";
    btnMine.disabled = true;

    setTimeout(async () => {
        data.startTime = Date.now();
        await sync();
        checkOfflineMining();
    }, 1000);
}

function checkOfflineMining() {
    const btnMine = document.getElementById('btn-mine');
    const timerDisplay = document.getElementById('timer-display');

    clearInterval(tInterval);
    if (!data.startTime) {
        timerDisplay.classList.add('hidden');
        btnMine.disabled = false;
        btnMine.innerText = "RA KHƠI";
        btnMine.onclick = startMining;
        return;
    }

    tInterval = setInterval(() => {
        const elapsed = Date.now() - data.startTime;
        if (elapsed >= MINING_DURATION) {
            clearInterval(tInterval);
            timerDisplay.classList.add('hidden');
            btnMine.disabled = false;
            btnMine.innerText = "💰 NHẬN CÁ";
            btnMine.onclick = claimFish;
        } else {
            timerDisplay.classList.remove('hidden');
            const remain = Math.floor((MINING_DURATION - elapsed) / 1000);
            const h = Math.floor(remain / 3600).toString().padStart(2, '0');
            const m = Math.floor((remain % 3600) / 60).toString().padStart(2, '0');
            const s = (remain % 60).toString().padStart(2, '0');
            timerDisplay.innerText = `${h}:${m}:${s}`;
            btnMine.disabled = true;
            btnMine.innerText = "ĐANG ĐÀO...";
            updateUI();
        }
    }, 1000);
}

async function claimFish() {
    const elapsed = Date.now() - data.startTime;
    const fished = (Math.min(elapsed, MINING_DURATION) / 1000) * data.miningSpeed;
    
    data.fish += fished;
    data.startTime = null;
    await sync();
    tg.showAlert(`Đã nhận ${Math.floor(fished)} cá!`);
    checkOfflineMining();
    updateUI();
}

function handleSell() {
    const earnings = Math.floor(data.fish * GLOBAL_RATIO);
    if (earnings >= 1) {
        data.coins += earnings;
        data.fish = 0;
        sync();
        updateUI();
        tg.showAlert(`Bán thành công, nhận ${earnings} xu!`);
    } else {
        tg.showAlert("Chưa đủ cá để bán!");
    }
}

function handleUpgrade() {
    const cost = UPGRADE_COSTS[data.upgradeCount];
    if (data.coins >= cost) {
        data.coins -= cost;
        data.upgradeCount++;
        data.miningSpeed += 0.3;
        sync();
        updateUI();
        tg.showAlert("🚀 Nâng cấp thành công!");
    } else {
        tg.showAlert("Không đủ xu!");
    }
}

async function handleWithdraw() {
    const amount = parseInt(document.getElementById('withdraw-amount').value);
    const bank = document.getElementById('bank-name').value;
    const acc = document.getElementById('bank-account').value;

    if (amount < 20000 || amount > data.coins || !bank || !acc) {
        tg.showAlert("Thông tin không hợp lệ hoặc số dư không đủ!");
        return;
    }

    tg.showConfirm(`Rút ${amount.toLocaleString()}đ về ${bank}?`, async (ok) => {
        if (!ok) return;
        
        const request = {
            userId, bank, acc, amount,
            time: new Date().toLocaleString('vi-VN'),
            status: 'Chờ duyệt'
        };

        try {
            // Lưu yêu cầu rút tiền lên database để Admin duyệt (GIẤU TOKEN)
            await db.ref('withdraw_requests').push(request);
            
            data.coins -= amount;
            data.history.unshift({ amount, bank, time: request.time, status: 'Đang xử lý' });
            await sync();
            updateUI();
            updateHistoryUI();
            tg.showAlert("✅ Lệnh rút đã gửi!");
        } catch (e) {
            tg.showAlert("Lỗi hệ thống!");
        }
    });
}

function updateHistoryUI() {
    const container = document.getElementById('history-container');
    if (!container) return;
    container.innerHTML = data.history.map(item => `
        <div class="flex justify-between items-center p-3 bg-[#0f172a] rounded-2xl mb-2 border border-slate-700 text-[10px]">
            <div><p class="font-bold">Rút -${item.amount.toLocaleString()}</p><p class="text-gray-500">${item.time}</p></div>
            <div class="text-right"><span class="text-yellow-400">${item.status}</span><p class="text-gray-400">${item.bank}</p></div>
        </div>
    `).join('') || '<p class="text-center text-gray-500 py-4 italic text-xs">Chưa có giao dịch</p>';
}

// --- 5. KHỞI CHẠY ---

window.onload = () => {
    loadDataFromServer();

    // Gán sự kiện trực tiếp bằng JS để tránh lỗi nút không hoạt động
    document.getElementById('btn-mine').onclick = startMining;
    document.getElementById('btn-sell').onclick = handleSell;
    document.getElementById('btn-upgrade').onclick = handleUpgrade;
    document.getElementById('btn-withdraw').onclick = handleWithdraw;
    
    document.getElementById('withdraw-amount').oninput = (e) => {
        document.getElementById('vnd-receive').innerText = (parseInt(e.target.value) || 0).toLocaleString() + " VNĐ";
    };
};

window.switchTab = switchTab;
