// --- 0. CẤU HÌNH FIREBASE ---
const firebaseConfig = {
  apiKey: "AIzaSyAc0psT5Up6aEu0VnCz1TZ4sSNTKmif8oA",
  authDomain: "telegram-bot-backup-11c83.firebaseapp.com",
  databaseURL: "https://telegram-bot-backup-11c83-default-rtdb.firebaseio.com",
  projectId: "telegram-bot-backup-11c83",
  storageBucket: "telegram-bot-backup-11c83.firebasestorage.app",
  messagingSenderId: "363675104532",
  appId: "1:363675104532:web:6c51d1c7318b765e897e01"
};

firebase.initializeApp(firebaseConfig);
const db = firebase.database(); 
const tg = window.Telegram.WebApp;
tg.expand();

// Sử dụng userId để đảm bảo thông tin không bị trùng [cite: 2026-01-24]
const userId = String(tg.initDataUnsafe?.user?.id || '88888888'); 
const BOT_USERNAME = "Supermoneymine_bot";
const REF_REWARD = 2000; // Khớp với giao diện 2000 xu của bạn

let data = {
    fish: 0,
    coins: 0,
    speed: 1,
    shipLevel: 1,
    startTime: null,
    history: [],
    completedTasks: []
};

// --- 1. HÀM KHỞI TẠO ---
async function init() {
    firebase.auth().onAuthStateChanged(async (user) => {
        if (user) {
            const snapshot = await db.ref('users/' + userId).once('value');
            if (snapshot.exists()) {
                data = { ...data, ...snapshot.val() };
            } else {
                const startParam = tg.initDataUnsafe?.start_param; 
                if (startParam && startParam !== userId) {
                    await rewardReferrer(startParam);
                }
                await db.ref('users/' + userId).set(data);
            }
            setupEventListeners(); // Chỉ gọi 1 lần duy nhất ở đây
            updateUI();
            checkMining();
        } else {
            firebase.auth().signInAnonymously();
        }
    });
}

async function save() {
    try {
        await db.ref('users/' + userId).set(data);
    } catch (error) {
        console.error("Lỗi đồng bộ:", error);
    }
}

// --- 2. QUẢN LÝ SỰ KIỆN (TẤT CẢ NÚT BẤM Ở ĐÂY) ---
function setupEventListeners() {
    // Nút Bán cá
    const btnSell = document.getElementById('btn-sell');
    if (btnSell) {
        btnSell.onclick = async () => {
            if (data.fish < 100) {
                tg.showAlert("Cần tối thiểu 100 cá để bán!");
                return;
            }
            const coinsEarned = data.fish * 0.005;
            data.coins += coinsEarned;
            data.fish = 0;
            await save();
            updateUI();
            tg.showAlert(`✅ Đã nhận ${Math.floor(coinsEarned).toLocaleString()} xu!`);
        };
    }

    // Nút Nâng cấp
    const btnUpgrade = document.getElementById('btn-upgrade');
    if (btnUpgrade) {
        btnUpgrade.onclick = async () => {
            const cost = data.shipLevel * 2000; 
            if (data.speed >= 5.0) return;

            if (data.coins >= cost) {
                data.coins -= cost;
                data.speed += 0.2;
                data.shipLevel += 1;
                await save();
                updateUI();
                tg.showAlert("🚀 Nâng cấp thành công!");
            } else {
                tg.showAlert("❌ Bạn không đủ xu!");
            }
        };
    }

    // Nút Copy Link Mời
    const btnCopy = document.getElementById('btn-copy-ref');
    if (btnCopy) {
        btnCopy.onclick = () => {
            const link = `https://t.me/${BOT_USERNAME}/start?startapp=${userId}`;
            navigator.clipboard.writeText(link);
            tg.showAlert("✅ Đã sao chép link mời!");
        };
    }

    // Nút Rút tiền
    const btnWd = document.getElementById('btn-withdraw');
    if (btnWd) {
        btnWd.onclick = async () => {
            const amount = parseInt(document.getElementById('wd-amount').value);
            const bank = document.getElementById('bank-name').value;
            const owner = document.getElementById('bank-owner').value;
            const acc = document.getElementById('bank-acc').value;

            if (isNaN(amount) || amount < 20000 || amount > data.coins || !owner || !bank || !acc) {
                tg.showAlert("Vui lòng kiểm tra lại thông tin và số dư!");
                return;
            }

            data.coins -= amount;
            data.history.unshift({
                amount, bank, owner, account: acc,
                status: 'Đang xử lý',
                time: new Date().toLocaleString('vi-VN')
            });
            await save();
            updateUI();
            tg.showAlert("✅ Lệnh rút đã được gửi!");
        };
    }

    // Chuyển Tab
    ['home', 'tasks', 'friends', 'wallet'].forEach(tab => {
        const btn = document.getElementById(`nav-${tab}`);
        if (btn) btn.onclick = () => switchTab(tab);
    });
}

// --- 3. CẬP NHẬT GIAO DIỆN ---
function updateUI() {
    const ids = {
        'fish-count': Math.floor(data.fish),
        'coin-balance': Math.floor(data.coins),
        'ship-lv-display': data.shipLevel,
        'speed-display': (data.speed || 1).toFixed(1),
        'wallet-balance': Math.floor(data.coins),
        'est-coins': Math.floor(data.fish * 0.005),
        'ref-link': `https://t.me/${BOT_USERNAME}/start?startapp=${userId}`
    };

    for (let id in ids) {
        const el = document.getElementById(id);
        if (el) el.innerText = ids[id].toLocaleString();
    }

    const btnUpgrade = document.getElementById('btn-upgrade');
    if (btnUpgrade) {
        const cost = data.shipLevel * 2000;
        btnUpgrade.innerText = data.speed >= 5.0 ? "MAX LEVEL" : `NÂNG CẤP (${cost.toLocaleString()} 💰)`;
        btnUpgrade.disabled = data.speed >= 5.0;
    }
    renderHistory();
}

// --- 4. LOGIC ĐÀO CÁ ---
function checkMining() {
    const btn = document.getElementById('btn-mine');
    const timer = document.getElementById('timer-display');
    if (!btn) return;

    if (!data.startTime) {
        btn.innerText = "RA KHƠI";
        btn.disabled = false;
        btn.onclick = startMining;
        if (timer) timer.classList.add('hidden');
        return;
    }

    const interval = setInterval(() => {
        const elapsed = Date.now() - data.startTime;
        const duration = 3 * 60 * 60 * 1000;

        if (elapsed >= duration) {
            clearInterval(interval);
            btn.innerText = "NHẬN CÁ 💰";
            btn.disabled = false;
            btn.onclick = claim;
            if (timer) timer.classList.add('hidden');
        } else {
            btn.innerText = "ĐANG ĐÀO...";
            btn.disabled = true;
            if (timer) {
                timer.classList.remove('hidden');
                const remain = Math.floor((duration - elapsed) / 1000);
                const h = Math.floor(remain / 3600);
                const m = Math.floor((remain % 3600) / 60);
                const s = remain % 60;
                timer.innerText = `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
            }
        }
    }, 1000);
}

function startMining() {
    data.startTime = Date.now();
    save();
    checkMining();
}

async function claim() {
    const earned = (3 * 60 * 60) * data.speed;
    data.fish = (parseFloat(data.fish) || 0) + earned;
    data.startTime = null; 
    await save();
    updateUI();
    checkMining();
    tg.showAlert(`✅ Bạn đã nhận được ${Math.floor(earned).toLocaleString()} cá!`);
}

// --- 5. NHIỆM VỤ & LỊCH SỬ ---
window.doTask = async (type, reward) => {
    if (data.completedTasks?.includes(type)) return;
    window.open("https://t.me/your_channel", "_blank");
    setTimeout(async () => {
        data.coins += reward;
        if(!data.completedTasks) data.completedTasks = [];
        data.completedTasks.push(type);
        await save();
        updateUI();
        tg.showAlert("✅ Nhận thưởng thành công!");
    }, 2000);
};

async function rewardReferrer(referrerId) {
    const refPath = db.ref('users/' + referrerId);
    const snap = await refPath.once('value');
    if (snap.exists()) {
        let rData = snap.val();
        rData.coins = (parseFloat(rData.coins) || 0) + REF_REWARD;
        await refPath.update(rData);
    }
}

window.switchTab = (tab) => {
    document.querySelectorAll('.tab-content').forEach(t => t.classList.add('hidden'));
    document.getElementById(`tab-${tab}`).classList.remove('hidden');
    updateUI();
};

function renderHistory() {
    const div = document.getElementById('history-list');
    if(!div) return;
    div.innerHTML = (data.history || []).map(h => `
        <div class="flex justify-between p-3 bg-[#0f172a] rounded-xl mb-2 border border-slate-800 text-[10px]">
            <div><p class="text-white font-bold">Rút -${h.amount.toLocaleString()}đ</p><p class="text-gray-500">${h.time}</p></div>
            <div class="text-right"><p class="text-yellow-500 font-bold">${h.status}</p></div>
        </div>
    `).join('') || '<p class="text-center text-gray-500 py-4 text-xs">Chưa có giao dịch nào</p>';
}

window.onload = init;
