// --- 0. CẤU HÌNH ---
const firebaseConfig = {
  apiKey: "AIzaSyAc0psT5Up6aEu0VnCz1TZ4sSNTKmif8oA",
  authDomain: "telegram-bot-backup-11c83.firebaseapp.com",
  databaseURL: "https://telegram-bot-backup-11c83-default-rtdb.firebaseio.com",
  projectId: "telegram-bot-backup-11c83",
  storageBucket: "telegram-bot-backup-11c83.firebasestorage.app",
  messagingSenderId: "363675104532",
  appId: "1:363675104532:web:6c51d1c7318b765e897e01"
};

if (!firebase.apps.length) firebase.initializeApp(firebaseConfig);
const db = firebase.database();
const tg = window.Telegram.WebApp;
const userId = String(tg.initDataUnsafe?.user?.id || '88888888');
const BOT_USERNAME = "Supermoneymine_bot";
const REF_REWARD = 2000; 

let data = { fish: 0, coins: 0, speed: 1, shipLevel: 1, startTime: null, history: [], completedTasks: [], total_time: 0 };

// --- 1. KHỞI TẠO (Đã sửa lỗi lồng hàm gây kẹt) ---

async function init() {
    console.log("Hệ thống bắt đầu khởi tạo..."); [cite: 2026-01-24]
    const loader = document.getElementById('loading-screen');

    // CƠ CHẾ PHÁ BĂNG KHẨN CẤP: Sau 5 giây tự động tắt loading dù có chuyện gì xảy ra [cite: 2026-01-24]
    const forceHide = setTimeout(() => {
        if (loader && loader.style.display !== 'none') {
            loader.style.display = 'none';
            console.warn("Cảnh báo: Buộc phải ẩn Loading do Firebase phản hồi quá lâu!"); [cite: 2026-01-24]
        }
    }, 5000);

    firebase.auth().onAuthStateChanged(async (user) => {
        if (!user) {
            firebase.auth().signInAnonymously(); [cite: 2026-01-24]
            return;
        }
        try {
            const snap = await db.ref('users/' + userId).once('value'); [cite: 2026-01-24]
            if (snap.exists()) {
                data = { ...data, ...snap.val() }; [cite: 2026-01-24]
            } else {
                // Lưu ID để tránh trùng thông tin người dùng [cite: 2026-01-23, 2026-01-24]
                await db.ref('users/' + userId).set(data); [cite: 2026-01-24]
            }

            setupEventListeners(); [cite: 2026-01-24]
            updateUI(); [cite: 2026-01-24]
            checkMining(); [cite: 2026-01-24]
            
            // Tắt Loading bình thường và hủy lệnh ép buộc [cite: 2026-01-24]
            clearTimeout(forceHide); 
            if (loader) loader.style.display = 'none'; [cite: 2026-01-24]

        } catch (e) {
            console.error("Lỗi kịch bản:", e); [cite: 2026-01-24]
            if (loader) loader.style.display = 'none'; [cite: 2026-01-24]
        }
    });
}

// --- 2. GÁN SỰ KIỆN ---
function setupEventListeners() {
    const safeClick = (id, fn) => {
        const el = document.getElementById(id);
        if (el) { el.onclick = fn; }
    };

    safeClick('btn-sell', async () => {
        if (data.fish < 100) return tg.showAlert("Cần tối thiểu 100 cá!");
        const earned = data.fish * 0.005;
        data.coins += earned;
        data.fish = 0;
        await save();
        updateUI();
        tg.showAlert(`✅ Đã bán cá nhận ${Math.floor(earned).toLocaleString()} xu!`);
    });

    safeClick('btn-upgrade', async () => {
        if (data.coins < 200) return tg.showAlert("Bạn cần 200 xu!");
        if (data.speed >= 5.0) return tg.showAlert("Đã đạt cấp tối đa!");
        data.coins -= 200;
        data.speed += 0.2;
        data.shipLevel += 1;
        await save();
        updateUI();
        tg.showAlert("🚀 Nâng cấp thành công!");
    });

    safeClick('btn-copy-ref', () => {
        const link = `https://t.me/${BOT_USERNAME}/start?startapp=${userId}`;
        navigator.clipboard.writeText(link);
        tg.showAlert("✅ Đã copy link giới thiệu!");
    });

    ['home', 'tasks', 'friends', 'wallet'].forEach(tab => {
        safeClick(`nav-${tab}`, () => switchTab(tab));
    });

    safeClick('btn-withdraw', async () => {
        const inputEl = document.getElementById('wd-amount');
        const bankEl = document.getElementById('bank-name');
        const accEl = document.getElementById('bank-acc');
        const ownerEl = document.getElementById('bank-owner');

        const amount = parseInt((inputEl?.value || "").replace(/\D/g, ''));
        if (isNaN(amount) || amount < 20000) return tg.showAlert("Tối thiểu 20,000đ!");
        if (data.coins < amount) return tg.showAlert("Không đủ xu!");

        data.coins -= amount;
        const newHistory = { amount, name: ownerEl?.value, bank: bankEl?.value, account: accEl?.value, status: 'Đang xử lý', time: new Date().toLocaleString('vi-VN') };
        if (!data.history) data.history = [];
        data.history.unshift(newHistory);
        await save();
        updateUI();
        tg.showAlert("✅ Gửi yêu cầu thành công!");
    });
}

// --- 3. HÀM BỔ TRỢ ---
async function save() {
    return db.ref('users/' + userId).set(data); [cite: 2026-01-24]
}

function updateUI() {
    const setText = (id, val) => {
        const el = document.getElementById(id);
        if (el) el.innerText = val;
    };
    setText('fish-count', Math.floor(data.fish).toLocaleString());
    setText('coin-balance', Math.floor(data.coins).toLocaleString());
    setText('ship-lv-display', data.shipLevel);
    setText('speed-display', (data.speed || 1).toFixed(1));
    setText('wallet-balance', Math.floor(data.coins).toLocaleString());
    renderHistory();
}

window.switchTab = function(tab) {
    document.querySelectorAll('.tab-content').forEach(t => t.classList.add('hidden'));
    const target = document.getElementById(`tab-${tab}`);
    if (target) target.classList.remove('hidden');
}

function renderHistory() {
    const div = document.getElementById('history-list');
    if(!div) return;
    div.innerHTML = (data.history || []).map(h => {
        const isRejected = h.status === 'Bị từ chối';
        const color = h.status === 'Đang xử lý' ? 'text-yellow-500' : isRejected ? 'text-red-500' : 'text-green-500';
        return `
            <div class="p-3 bg-[#0f172a] rounded-xl mb-2 border border-slate-800 text-[10px]">
                <div class="flex justify-between items-start">
                    <div><p class="text-white font-bold">${h.status}</p><p class="text-gray-500">${h.time}</p></div>
                    <div class="text-right"><p class="${color} font-bold">${h.amount.toLocaleString()} 💰</p></div>
                </div>
            </div>`;
    }).join('') || '<p class="text-center text-gray-500 py-4 text-xs">Chưa có giao dịch nào</p>';
}

// --- 4. ĐÀO CÁ ---
function checkMining() {
    const btn = document.getElementById('btn-mine');
    const timer = document.getElementById('timer-display');
    if (!btn) return;

    if (!data.startTime) {
        btn.innerText = "RA KHƠI";
        btn.onclick = () => { data.startTime = Date.now(); save(); checkMining(); };
        if (timer) timer.classList.add('hidden');
        return;
    }

    const interval = setInterval(() => {
        const elapsed = Date.now() - data.startTime;
        const duration = 3 * 60 * 60 * 1000;
        if (elapsed >= duration) {
            clearInterval(interval);
            btn.innerText = "NHẬN CÁ 💰";
            btn.onclick = async () => {
                const earned = (3 * 3600) * data.speed;
                data.fish = (data.fish || 0) + earned;
                data.startTime = null;
                await save();
                updateUI();
                checkMining();
            };
        } else {
            btn.innerText = "ĐANG ĐÀO...";
            if (timer) {
                timer.classList.remove('hidden');
                const rem = Math.floor((duration - elapsed) / 1000);
                timer.innerText = `${Math.floor(rem/3600)}:${Math.floor((rem%3600)/60).toString().padStart(2,'0')}:${(rem%60).toString().padStart(2,'0')}`;
            }
        }
    }, 1000);
}

async function rewardReferrer(referrerId) {
    const refPath = db.ref('users/' + referrerId);
    const snap = await refPath.once('value');
    if (snap.exists()) {
        let rData = snap.val();
        rData.coins = (rData.coins || 0) + REF_REWARD;
        await refPath.set(rData); [cite: 2026-01-24]
    }
}

window.onload = init;
