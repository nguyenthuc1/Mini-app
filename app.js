// --- 0. CẤU HÌNH FIREBASE (Dựa trên ảnh của bạn) ---
const firebaseConfig = {
  apiKey: "AIzaSyAc8psT5Up6aEu8VnCz1TZ4sSNTKmf8oA",
  authDomain: "telegram-bot-backup-11c83.firebaseapp.com",
  databaseURL: "https://telegram-bot-backup-11c83-default-rtdb.firebaseio.com",
  projectId: "telegram-bot-backup-11c83",
  storageBucket: "telegram-bot-backup-11c83.firebasestorage.app",
  messagingSenderId: "363675104532",
  appId: "1:363675104532:web:6c51d1c7318b765e897e01"
};

// Khởi tạo Firebase Realtime Database
firebase.initializeApp(firebaseConfig);
const db = firebase.database(); 

// Lấy thông tin từ Telegram Mini App
const tg = window.Telegram.WebApp;
tg.expand();
// Sử dụng userId để đảm bảo thông tin không bị trùng
const userId = String(tg.initDataUnsafe?.user?.id || '88888888'); 

// Khung dữ liệu mặc định
let data = {
    fish: 0,
    coins: 0,
    speed: 0.5,
    shipLevel: 1,
    startTime: null,
    history: [],
    completedTasks: []
};

// --- 1. HÀM KHỞI TẠO & ĐỒNG BỘ ---

async function init() {
    // Tải dữ liệu người dùng từ Firebase
    db.ref('users/' + userId).once('value').then((snapshot) => {
        if (snapshot.exists()) {
            data = { ...data, ...snapshot.val() };
        } else {
            // Nếu là người dùng mới, khởi tạo dữ liệu lên server
            db.ref('users/' + userId).set(data);
        }
        
        // Cập nhật Link mời bạn bè
        const refLink = document.getElementById('ref-link');
        if(refLink) refLink.innerText = `https://t.me/YourBotName?start=${userId}`;
        
        updateUI();
        checkMining(); // Kiểm tra trạng thái đào cá ngay khi vào app
    }).catch(e => {
        console.error("Lỗi khởi tạo:", e);
        tg.showAlert("Lỗi kết nối máy chủ!");
    });
}

async function save() {
    // Lưu dữ liệu lên Realtime Database
    await db.ref('users/' + userId).set(data);
}

function updateUI() {
    document.getElementById('fish-count').innerText = Math.floor(data.fish).toLocaleString();
    document.getElementById('coin-balance').innerText = Math.floor(data.coins).toLocaleString();
    
    document.getElementById('ship-lv-display').innerText = data.shipLevel;
    document.getElementById('speed-display').innerText = data.speed.toFixed(1);
    document.getElementById('upgrade-cost').innerText = (data.shipLevel * 2000).toLocaleString();
    document.getElementById('est-coins').innerText = Math.floor(data.fish * 0.005).toLocaleString();
    
    document.getElementById('wallet-balance').innerText = Math.floor(data.coins).toLocaleString();
    renderHistory();
}

// --- 2. LOGIC ĐÀO CÁ (3 TIẾNG & OFFLINE) ---

function checkMining() {
    const btn = document.getElementById('btn-mine');
    const timer = document.getElementById('timer-display');
    
    if (!data.startTime) {
        btn.innerText = "RA KHƠI";
        btn.disabled = false;
        btn.onclick = startMining;
        timer.classList.add('hidden');
        return;
    }

    const interval = setInterval(() => {
        const now = Date.now();
        const elapsed = now - data.startTime;
        const duration = 3 * 60 * 60 * 1000; // Mốc 3 tiếng đào

        if (elapsed >= duration) {
            clearInterval(interval);
            btn.innerText = "NHẬN CÁ 💰";
            btn.disabled = false;
            btn.onclick = claim;
            timer.classList.add('hidden');
        } else {
            btn.innerText = "ĐANG ĐÀO...";
            btn.disabled = true;
            timer.classList.remove('hidden');
            const remain = Math.floor((duration - elapsed) / 1000);
            const h = Math.floor(remain / 3600);
            const m = Math.floor((remain % 3600) / 60);
            const s = remain % 60;
            timer.innerText = `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
        }
    }, 1000);
}

function startMining() {
    data.startTime = Date.now();
    save(); // Lưu mốc bắt đầu để tính toán khi người dùng offline
    checkMining();
}

async function claim() {
    const now = Date.now();
    const duration = 3 * 60 * 60 * 1000;
    const elapsed = now - data.startTime;

    // Tính toán số cá dựa trên thời gian thực trôi qua (tối đa 3 tiếng)
    const effectiveTimeSeconds = Math.min(elapsed, duration) / 1000;
    const earned = effectiveTimeSeconds * data.speed;

    data.fish += earned;
    data.startTime = null; // Reset để ra khơi chuyến mới
    
    await save();
    updateUI();
    checkMining();
    tg.showAlert(`✅ Bạn nhận được ${Math.floor(earned).toLocaleString()} cá!`);
}

// --- 3. BÁN CÁ & NÂNG CẤP ---

document.getElementById('btn-sell').onclick = async () => {
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

document.getElementById('btn-upgrade').onclick = async () => {
    const cost = data.shipLevel * 2000;
    if (data.coins >= cost) {
        data.coins -= cost;
        data.shipLevel += 1;
        data.speed += 0.2;
        await save();
        updateUI();
        tg.showAlert("🚀 Nâng cấp thành công!");
    } else {
        tg.showAlert("❌ Bạn không đủ xu!");
    }
};

// --- 4. NHIỆM VỤ & BẠN BÈ ---

window.doTask = async (type, reward) => {
    if (data.completedTasks?.includes(type)) {
        tg.showAlert("Nhiệm vụ này đã xong!");
        return;
    }
    window.open("https://t.me/your_channel", "_blank");
    setTimeout(async () => {
        if(!data.completedTasks) data.completedTasks = [];
        data.coins += reward;
        data.completedTasks.push(type);
        await save();
        updateUI();
        tg.showAlert(`✅ Nhận thưởng thành công: +${reward} xu`);
    }, 2000);
};

document.getElementById('btn-copy-ref').onclick = () => {
    const link = document.getElementById('ref-link').innerText;
    navigator.clipboard.writeText(link);
    tg.showAlert("✅ Đã sao chép link mời!");
};

// --- 5. RÚT TIỀN (VỚI TÊN CHỦ TÀI KHOẢN) ---

document.getElementById('btn-withdraw').onclick = async () => {
    const amount = parseInt(document.getElementById('wd-amount').value);
    const bank = document.getElementById('bank-name').value;
    const owner = document.getElementById('bank-owner').value;
    const acc = document.getElementById('bank-acc').value;

    if (isNaN(amount) || amount < 20000) {
        tg.showAlert("❌ Số tiền tối thiểu là 20.000đ!");
        return;
    }
    if (amount > data.coins) {
        tg.showAlert("❌ Số dư xu không đủ!");
        return;
    }
    if (!owner || !bank || !acc) {
        tg.showAlert("❌ Vui lòng điền đủ thông tin ngân hàng!");
        return;
    }

    tg.showConfirm(`Xác nhận rút ${amount.toLocaleString()}đ về ${bank}?`, async (ok) => {
        if (!ok) return;

        data.coins -= amount;
        if(!data.history) data.history = [];
        data.history.unshift({
            amount, bank, owner, account: acc,
            status: 'Đang xử lý',
            time: new Date().toLocaleString('vi-VN')
        });

        await save();
        updateUI();
        document.getElementById('wd-amount').value = "";
        tg.showAlert("✅ Lệnh rút đã được ghi nhận trên hệ thống!");
    });
};

// --- 6. ĐIỀU HƯỚNG TAB ---

window.switchTab = (tab) => {
    document.querySelectorAll('.tab-content').forEach(t => t.classList.add('hidden'));
    document.getElementById(`tab-${tab}`).classList.remove('hidden');
    
    document.querySelectorAll('.nav-btn').forEach(b => b.classList.replace('text-blue-400', 'text-gray-500'));
    const activeBtn = document.getElementById(`nav-${tab}`);
    if(activeBtn) activeBtn.classList.replace('text-gray-500', 'text-blue-400');
    
    updateUI();
};

function renderHistory() {
    const div = document.getElementById('history-list');
    if(!div) return;
    div.innerHTML = (data.history || []).map(h => `
        <div class="flex justify-between p-3 bg-[#0f172a] rounded-xl mb-2 border border-slate-800 text-[10px]">
            <div>
                <p class="text-white font-bold">Rút -${h.amount.toLocaleString()}đ</p>
                <p class="text-gray-500">${h.time}</p>
            </div>
            <div class="text-right">
                <p class="text-yellow-500 font-bold">${h.status}</p>
                <p class="text-gray-400 text-[8px]">${h.owner}</p>
            </div>
        </div>
    `).join('') || '<p class="text-center text-gray-500 py-4 text-xs">Chưa có giao dịch nào</p>';
}

// Khởi chạy khi tải xong trang
window.onload = init;
