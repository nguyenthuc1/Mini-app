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

// Cấu hình giới hạn
const MAX_SPEED = 5.0; // Tốc độ tối đa: 5 cá/giây
const UPGRADE_COST = 200; // Chi phí nâng cấp cố định
const SPEED_INCREMENT = 0.2; // Tăng 0.2 cá/s mỗi lần

let data = { fish: 0, coins: 0, speed: 1, shipLevel: 1, startTime: null, history: [] };

async function init() {
    const loader = document.getElementById('loading-screen');
    firebase.auth().onAuthStateChanged(async (user) => {
        if (!user) {
            firebase.auth().signInAnonymously();
            return;
        }
        try {
            const snap = await db.ref('users/' + userId).once('value');
            if (snap.exists()) {
                data = Object.assign(data, snap.val());
                
                // Đảm bảo speed không vượt quá giới hạn
                if (data.speed > MAX_SPEED) {
                    data.speed = MAX_SPEED;
                }
            } else {
                // Khởi tạo user mới
                await db.ref('users/' + userId).set(data);
            }

            // KÍCH HOẠT CÁC NÚT BẤM NGAY SAU KHI CÓ DATA
            setupEventListeners();
            updateUI();
            checkMining();

            if (loader) loader.style.display = 'none';
        } catch (e) {
            console.error(e);
            if (loader) loader.style.display = 'none';
        }
    });
}

// HÀM GÁN SỰ KIỆN
function setupEventListeners() {
    const bind = (id, fn) => {
        const el = document.getElementById(id);
        if (el) el.onclick = fn;
    };

    bind('btn-mine', handleMine);
    bind('btn-sell', handleSell);
    bind('btn-upgrade', handleUpgrade);
    bind('btn-withdraw', handleWithdraw);
    bind('btn-copy-ref', handleCopyRef);

    ['home', 'tasks', 'friends', 'wallet'].forEach(tab => {
        bind(`nav-${tab}`, () => switchTab(tab));
    });
}

function switchTab(tab) {
    document.querySelectorAll('.tab-content').forEach(t => t.classList.add('hidden'));
    const target = document.getElementById('tab-' + tab);
    if (target) target.classList.remove('hidden');

    document.querySelectorAll('.nav-btn').forEach(btn => {
        btn.classList.remove('text-blue-400', 'text-purple-400', 'text-pink-400', 'text-yellow-400');
        btn.classList.add('text-gray-500');
    });
    
    const activeBtn = document.getElementById('nav-' + tab);
    if (activeBtn) {
        activeBtn.classList.remove('text-gray-500');
        // Đặt màu theo tab
        if (tab === 'home') activeBtn.classList.add('text-blue-400');
        else if (tab === 'tasks') activeBtn.classList.add('text-purple-400');
        else if (tab === 'friends') activeBtn.classList.add('text-pink-400');
        else if (tab === 'wallet') activeBtn.classList.add('text-yellow-400');
    }
}

function handleMine() {
    if (!data.startTime) {
        data.startTime = Date.now();
        save();
        checkMining();
        tg.showAlert("⛵ Đã ra khơi! Quay lại sau 3 giờ để nhận cá.");
    } else {
        const elapsed = Date.now() - data.startTime;
        if (elapsed >= 3 * 3600 * 1000) {
            // Tính số cá nhận được = 3 giờ * 3600 giây/giờ * tốc độ
            const fishEarned = Math.floor(3 * 3600 * data.speed);
            data.fish += fishEarned;
            data.startTime = null;
            save(); 
            updateUI(); 
            checkMining();
            tg.showAlert(`🎉 Đã nhận ${fishEarned.toLocaleString()} con cá!`);
        } else {
            const remainingMs = (3 * 3600 * 1000) - elapsed;
            const remainingMin = Math.ceil(remainingMs / 60000);
            tg.showAlert(`⏳ Còn ${remainingMin} phút nữa!`);
        }
    }
}

function handleSell() {
    if (data.fish < 100) {
        tg.showAlert("❌ Cần tối thiểu 100 con cá để bán!");
        return;
    }
    
    const coinsEarned = Math.floor(data.fish * 0.005);
    data.coins += coinsEarned;
    data.fish = 0;
    save(); 
    updateUI();
    tg.showAlert(`💰 Đã bán cá và nhận ${coinsEarned.toLocaleString()} xu!`);
}

function handleUpgrade() {
    // Kiểm tra đã đạt max level chưa
    if (data.speed >= MAX_SPEED) {
        tg.showAlert(`⚠️ Đã đạt tốc độ tối đa ${MAX_SPEED} cá/giây!`);
        return;
    }
    
    // Chi phí cố định 200 xu
    if (data.coins < UPGRADE_COST) {
        tg.showAlert(`❌ Cần ${UPGRADE_COST.toLocaleString()} xu để nâng cấp!`);
        return;
    }
    
    // Nâng cấp
    data.coins -= UPGRADE_COST;
    data.speed += SPEED_INCREMENT;
    
    // Đảm bảo không vượt quá giới hạn
    if (data.speed > MAX_SPEED) {
        data.speed = MAX_SPEED;
    }
    
    data.shipLevel += 1;
    save(); 
    updateUI();
    tg.showAlert(`⚡ Nâng cấp thành công! Tốc độ: ${data.speed.toFixed(1)} cá/s`);
}

function handleCopyRef() {
    const link = `https://t.me/${BOT_USERNAME}/start?startapp=${userId}`;
    navigator.clipboard.writeText(link).then(() => {
        tg.showAlert("✅ Đã sao chép link giới thiệu!");
    }).catch(() => {
        tg.showAlert("❌ Không thể sao chép. Vui lòng thử lại!");
    });
}

function handleWithdraw() {
    const bankName = document.getElementById('bank-name').value.trim();
    const bankOwner = document.getElementById('bank-owner').value.trim();
    const bankAcc = document.getElementById('bank-acc').value.trim();
    const amount = parseInt(document.getElementById('wd-amount').value);
    
    // Validate
    if (!bankName || !bankOwner || !bankAcc) {
        tg.showAlert("❌ Vui lòng điền đầy đủ thông tin ngân hàng!");
        return;
    }
    
    if (!amount || amount < 20000) {
        tg.showAlert("❌ Số tiền rút tối thiểu là 20,000 xu!");
        return;
    }
    
    if (data.coins < amount) {
        tg.showAlert(`❌ Số dư không đủ! Bạn chỉ có ${data.coins.toLocaleString()} xu.`);
        return;
    }
    
    // Trừ xu và thêm vào lịch sử
    data.coins -= amount;
    if (!data.history) data.history = [];
    
    data.history.unshift({
        amount: amount,
        status: 'Đang xử lý',
        time: new Date().toLocaleString('vi-VN'),
        bankName: bankName,
        bankOwner: bankOwner,
        bankAcc: bankAcc
    });
    
    // Giới hạn lịch sử tối đa 50 giao dịch
    if (data.history.length > 50) {
        data.history = data.history.slice(0, 50);
    }
    
    save(); 
    updateUI();
    
    // Clear form
    document.getElementById('bank-name').value = '';
    document.getElementById('bank-owner').value = '';
    document.getElementById('bank-acc').value = '';
    document.getElementById('wd-amount').value = '';
    
    tg.showAlert("✅ Đã gửi yêu cầu rút tiền! Chúng tôi sẽ xử lý trong 24-48h.");
}

function checkMining() {
    const btn = document.getElementById('btn-mine');
    const timer = document.getElementById('timer-display');
    if (!btn) return;
    
    if (!data.startTime) {
        btn.innerHTML = '<span class="relative z-10">⛵ RA KHƠI</span>';
        if (timer) timer.classList.add('hidden');
    } else {
        const interval = setInterval(() => {
            const elapsed = Date.now() - data.startTime;
            const duration = 3 * 3600 * 1000; // 3 giờ
            
            if (elapsed >= duration) {
                clearInterval(interval);
                btn.innerHTML = '<span class="relative z-10">🎁 NHẬN CÁ</span>';
                if (timer) timer.innerText = "00:00:00";
            } else {
                btn.innerHTML = '<span class="relative z-10">⏳ ĐANG ĐÀO...</span>';
                if (timer) {
                    timer.classList.remove('hidden');
                    const remaining = Math.floor((duration - elapsed) / 1000);
                    const h = Math.floor(remaining / 3600).toString().padStart(2, '0');
                    const m = Math.floor((remaining % 3600) / 60).toString().padStart(2, '0');
                    const s = (remaining % 60).toString().padStart(2, '0');
                    timer.innerText = `${h}:${m}:${s}`;
                }
            }
        }, 1000);
    }
}

function updateUI() {
    const setText = (id, val) => { 
        const el = document.getElementById(id); 
        if (el) el.innerText = val; 
    };
    
    // Cập nhật số liệu chính
    setText('fish-count', Math.floor(data.fish).toLocaleString());
    setText('coin-balance', Math.floor(data.coins).toLocaleString());
    setText('wallet-balance', Math.floor(data.coins).toLocaleString());
    setText('ship-lv-display', data.shipLevel);
    setText('speed-display', (data.speed || 1).toFixed(1));
    setText('ref-link', `https://t.me/${BOT_USERNAME}/start?startapp=${userId}`);
    
    // Cập nhật nút nâng cấp
    const btnUpgrade = document.getElementById('btn-upgrade');
    if (btnUpgrade) {
        if (data.speed >= MAX_SPEED) {
            btnUpgrade.innerHTML = '<span class="text-xl mr-2">✅</span> ĐÃ MAX LEVEL';
            btnUpgrade.disabled = true;
            btnUpgrade.classList.add('opacity-50', 'cursor-not-allowed');
        } else {
            btnUpgrade.innerHTML = `<span class="text-2xl mr-2">💰</span> ${UPGRADE_COST.toLocaleString()} Xu - Nâng cấp`;
            btnUpgrade.disabled = false;
            btnUpgrade.classList.remove('opacity-50', 'cursor-not-allowed');
        }
    }
    
    renderHistory();
}

function renderHistory() {
    const div = document.getElementById('history-list');
    if (!div) return;
    
    if (!data.history || data.history.length === 0) {
        div.innerHTML = '<p class="text-center text-gray-500 py-8 text-sm">📭 Chưa có giao dịch nào</p>';
        return;
    }
    
    div.innerHTML = data.history.map(h => `
        <div class="p-4 bg-gradient-to-r from-slate-800/50 to-slate-700/50 rounded-xl border border-slate-600/30 text-xs">
            <div class="flex justify-between items-start mb-2">
                <div class="flex-1">
                    <p class="text-white font-bold text-sm mb-1">${h.status}</p>
                    <p class="text-gray-400 text-[10px]">🏦 ${h.bankName || 'N/A'}</p>
                    <p class="text-gray-400 text-[10px]">👤 ${h.bankOwner || 'N/A'}</p>
                    <p class="text-gray-400 text-[10px]">💳 ${h.bankAcc || 'N/A'}</p>
                </div>
                <div class="text-right">
                    <p class="text-yellow-400 font-bold text-base">${h.amount.toLocaleString()} 💰</p>
                    <p class="text-gray-500 text-[9px] mt-1">${h.time}</p>
                </div>
            </div>
        </div>
    `).join('');
}

function save() { 
    db.ref('users/' + userId).set(data).catch(err => {
        console.error('Lỗi lưu dữ liệu:', err);
        tg.showAlert('❌ Lỗi lưu dữ liệu. Vui lòng thử lại!');
    });
}

// Khởi động app
window.onload = init;

// Telegram WebApp ready
if (tg) {
    tg.ready();
    tg.expand();
}
