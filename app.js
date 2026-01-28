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
const REF_REWARD = 2000; // Thưởng mời bạn bè [cite: 2026-01-24]

let data = { fish: 0, coins: 0, speed: 1, shipLevel: 1, startTime: null, history: [], completedTasks: [] };

// --- 1. KHỞI TẠO ---
async function init() {
    console.log("App đang khởi động...");
    firebase.auth().onAuthStateChanged(async (user) => {
        if (!user) {
            firebase.auth().signInAnonymously();
            return;
        }
        try {
            const snap = await db.ref('users/' + userId).once('value');
            if (snap.exists()) {
                data = { ...data, ...snap.val() };
            } else {
                const startParam = tg.initDataUnsafe?.start_param;
                if (startParam && startParam !== userId) await rewardReferrer(startParam);
                await db.ref('users/' + userId).set(data);
            }
            setupEventListeners();
            updateUI();
            checkMining();
            console.log("Hệ thống đã sẵn sàng!");
        } catch (e) { console.error("Lỗi khởi tạo:", e); }
    });
}

// --- 2. GÁN SỰ KIỆN ---
function setupEventListeners() { // Sửa 'Function' thành 'function' viết thường
    const safeClick = (id, fn) => {
        const el = document.getElementById(id);
        if (el) { 
            el.onclick = null; 
            el.onclick = fn; 
        }
    };

    // 1. Bán cá
    safeClick('btn-sell', async () => {
        if (data.fish < 100) return tg.showAlert("Cần tối thiểu 100 cá!");
        const earned = data.fish * 0.005;
        data.coins += earned;
        data.fish = 0;
        await save();
        updateUI();
        tg.showAlert(`✅ Đã nhận ${Math.floor(earned).toLocaleString()} xu!`);
    });

    // 2. Nâng cấp tàu
    safeClick('btn-upgrade', async () => {
        const cost = 200; 
        if (data.coins < cost) return tg.showAlert("Bạn cần 200 xu!");
        if (data.speed >= 5.0) return tg.showAlert("Đã đạt cấp tối đa!");
        data.coins -= cost;
        data.speed += 0.2;
        data.shipLevel += 1;
        await save();
        updateUI();
        tg.showAlert("🚀 Nâng cấp thành công!");
    });

    // 3. Copy Ref
    safeClick('btn-copy-ref', () => {
        const link = `https://t.me/${BOT_USERNAME}/start?startapp=${userId}`;
        navigator.clipboard.writeText(link);
        tg.showAlert("✅ Đã copy link giới thiệu!");
    });

    // 4. Chuyển Tab
    ['home', 'tasks', 'friends', 'wallet'].forEach(tab => {
        safeClick(`nav-${tab}`, () => switchTab(tab));
    });

    // 5. Rút tiền
           safeClick('btn-withdraw', async () => {
        // 1. Lấy đúng ID từ HTML của bạn là 'wd-amount'
        const inputEl = document.getElementById('wd-amount');
        const bankEl = document.getElementById('bank-name');
        const accEl = document.getElementById('bank-acc');
        const ownerEl = document.getElementById('bank-owner');

        // 2. Làm sạch dữ liệu nhập vào (xóa dấu phẩy, dấu chấm) [cite: 2026-01-24]
        let rawAmount = inputEl?.value || "";
        let cleanAmount = rawAmount.toString().replace(/\D/g, ''); 
        const amount = parseInt(cleanAmount);

        const bank = bankEl?.value?.trim();
        const account = accEl?.value?.trim();
        const name = ownerEl?.value?.trim();

        // 3. Kiểm tra điều kiện rút [cite: 2026-01-24]
        if (isNaN(amount) || amount < 20000) {
            return tg.showAlert("Số tiền rút tối thiểu là 20,000đ!");
        }
        
        if (!bank || !account || !name) {
            return tg.showAlert("Vui lòng điền đủ: Ngân hàng, STK và Tên!");
        }

        if (data.coins < amount) {
            return tg.showAlert("Số dư xu của bạn không đủ!");
        }

        // 4. Trừ tiền và lưu lịch sử theo User ID [cite: 2026-01-23, 2026-01-24]
        data.coins -= amount;
        const newHistory = {
            amount: amount,
name: name,
            bank: bank,
            account: account,
            status: 'Đang xử lý',
            time: new Date().toLocaleString('vi-VN')
        };
        
        if (!data.history) data.history = [];
        data.history.unshift(newHistory);

        await save(); // Lưu vào Firebase [cite: 2026-01-24]
        updateUI();
        tg.showAlert("✅ Gửi yêu cầu rút tiền thành công!");
        
        // Xóa trắng ô nhập sau khi xong
        inputEl.value = '';
    });
} // Đóng hàm setupEventListeners ở đây

// Đưa hàm save ra ngoài để các hàm khác có thể dùng chung [cite: 2026-01-24]
async function save() {
    await db.ref('users/' + userId).set(data);
}

// --- 3. CẬP NHẬT GIAO DIỆN ---
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
    setText('ref-link', `https://t.me/${BOT_USERNAME}/start?startapp=${userId}`);

    const btnUpgrade = document.getElementById('btn-upgrade');
    if (btnUpgrade) {
        if (data.speed >= 5.0) {
            btnUpgrade.innerText = "MAX LEVEL";
            btnUpgrade.disabled = true;
        } else {
            btnUpgrade.innerText = "NÂNG CẤP (200 💰)"; // Hiện giá 200 [cite: 2026-01-24]
            btnUpgrade.disabled = false;
        }
    }
    renderHistory(); // Gọi hàm vẽ lịch sử ở đây
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
        const duration = 3 * 60 * 60 * 1000; // Phiên đào 3 tiếng [cite: 2026-01-24]

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

function startMining() { data.startTime = Date.now(); save(); checkMining(); }

async function claim() {
    const earned = (3 * 60 * 60) * data.speed;
    data.fish = (parseFloat(data.fish) || 0) + earned;
    data.startTime = null; 
    await save();
    updateUI();
    checkMining();
    tg.showAlert(`✅ Đã nhận ${Math.floor(earned).toLocaleString()} cá!`);
}

// --- 5. NHIỆM VỤ, REFERRAL & TAB ---
window.doTask = async (type, reward) => {
    if (data.completedTasks?.includes(type)) return tg.showAlert("Đã hoàn thành!");
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
    try {
        const refPath = db.ref('users/' + referrerId);
        const snap = await refPath.once('value');
        if (snap.exists()) {
            let rData = snap.val();
            rData.coins = (parseFloat(rData.coins) || 0) + REF_REWARD; // Cộng 500 xu [cite: 2026-01-24]
            if(!rData.history) rData.history = [];
            rData.history.unshift({
                amount: REF_REWARD,
                status: 'Thưởng mời bạn',
                time: new Date().toLocaleString('vi-VN')
            });
            await refPath.update(rData);
        }
    } catch(e) { console.error(e); }
}

function switchTab(tab) {
    document.querySelectorAll('.tab-content').forEach(t => t.classList.add('hidden'));
    const target = document.getElementById(`tab-${tab}`);
    if (target) target.classList.remove('hidden');
    updateUI();
}


function renderHistory() {
    const div = document.getElementById('history-list');
    if(!div) return;
    div.innerHTML = (data.history || []).map(h => {
        // Nếu status là 'Đang xử lý' thì hiện dấu trừ (Rút tiền)
        const isWithdraw = h.status === 'Đang xử lý';
        const sign = isWithdraw ? '-' : '+';
        const color = isWithdraw ? 'text-yellow-500' : 'text-green-500';

        return `
            <div class="flex justify-between p-3 bg-[#0f172a] rounded-xl mb-2 border border-slate-800 text-[10px]">
                <div>
                    <p class="text-white font-bold">${h.status}</p>
                    <p class="text-gray-500">${h.time}</p>
                </div>
                <div class="text-right">
                    <p class="${color} font-bold">${sign}${h.amount.toLocaleString()} 💰</p>
                </div>
            </div>
        `;
    }).join('') || '<p class="text-center text-gray-500 py-4 text-xs">Chưa có giao dịch nào</p>';
}

window.onload = init;
