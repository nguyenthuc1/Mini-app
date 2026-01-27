// --- 0. CẤU HÌNH FIREBASE ---
const firebaseConfig = {
    apiKey: "YOUR_API_KEY",
    authDomain: "YOUR_PROJECT.firebaseapp.com",
    projectId: "YOUR_PROJECT_ID",
    storageBucket: "YOUR_PROJECT.appspot.com",
    messagingSenderId: "YOUR_SENDER_ID",
    appId: "YOUR_APP_ID"
};

firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();

const tg = window.Telegram.WebApp;
tg.expand();

// Đảm bảo mỗi User ID là duy nhất để không trùng dữ liệu
const userId = String(tg.initDataUnsafe?.user?.id || '88888888'); 

let data = {
    fish: 0,
    coins: 0,
    speed: 0.5,
    shipLevel: 1,
    startTime: null,
    history: [],
    completedTasks: []
};

// --- 1. HÀM XỬ LÝ DỮ LIỆU ---

async function init() {
    try {
        const doc = await db.collection("users").doc(userId).get();
        if (doc.exists) {
            data = { ...data, ...doc.data() };
        } else {
            // Tạo mới người dùng nếu chưa có trong Database
            await db.collection("users").doc(userId).set(data);
        }
        
        // Cập nhật Link mời (Thay YourBotName bằng tên bot thật của bạn)
        document.getElementById('ref-link').innerText = `https://t.me/YourBotName?start=${userId}`;
        
        updateUI();
        checkMining();
    } catch (e) {
        console.error("Lỗi khởi tạo:", e);
    }
}

async function save() {
    // Lưu mọi thay đổi lên Firebase dựa theo ID Telegram
    await db.collection("users").doc(userId).update(data);
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

// --- 2. LOGIC GAME ---

function checkMining() {
    const btn = document.getElementById('btn-mine');
    const timer = document.getElementById('timer-display');
    
    if (!data.startTime) {
        btn.innerText = "RA KHƠI";
        btn.disabled = false;
        timer.classList.add('hidden');
        return;
    }

    const interval = setInterval(() => {
        const elapsed = Date.now() - data.startTime;
        const duration = 2 * 60 * 60 * 1000; // 2 tiếng

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
            const m = Math.floor(remain / 60);
            const s = remain % 60;
            timer.innerText = `${m}:${s.toString().padStart(2, '0')}`;
        }
    }, 1000);
}

async function claim() {
    const earned = (2 * 60 * 60) * data.speed; // Số cá nhận được dựa trên tốc độ
    data.fish += earned;
    data.startTime = null;
    await save();
    updateUI();
    checkMining();
    tg.showAlert(`✅ Bạn đã nhận được ${Math.floor(earned)} cá!`);
}

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

// --- 3. NHIỆM VỤ & BẠN BÈ ---

window.doTask = async (type, reward) => {
    if (data.completedTasks.includes(type)) {
        tg.showAlert("Bạn đã làm nhiệm vụ này rồi!");
        return;
    }
    window.open("https://t.me/your_channel", "_blank");
    
    setTimeout(async () => {
        data.coins += reward;
        data.completedTasks.push(type);
        await save();
        updateUI();
        tg.showAlert(`✅ Nhận thành công ${reward} xu!`);
    }, 2000);
};

document.getElementById('btn-copy-ref').onclick = () => {
    const link = document.getElementById('ref-link').innerText;
    navigator.clipboard.writeText(link);
    tg.showAlert("✅ Đã sao chép link mời!");
};

// --- 4. RÚT TIỀN (ĐÃ BỎ THÔNG BÁO BOT) ---

document.getElementById('btn-withdraw').onclick = async () => {
    const amount = parseInt(document.getElementById('wd-amount').value);
    const bank = document.getElementById('bank-name').value;
    const acc = document.getElementById('bank-acc').value;

    if (isNaN(amount) || amount < 20000) {
        tg.showAlert("❌ Số tiền tối thiểu là 20,000đ!");
        return;
    }
    if (amount > data.coins) {
        tg.showAlert("❌ Số dư xu không đủ!");
        return;
    }

    tg.showConfirm(`Bạn muốn rút ${amount.toLocaleString()}đ về ${bank}?`, async (ok) => {
        if (!ok) return;

        // Lưu thông tin vào lịch sử trên Firebase để Admin kiểm tra
        data.coins -= amount;
        data.history.unshift({
            amount: amount,
            bank: bank,
            account: acc, // Lưu cả STK vào DB để Admin biết đường chuyển tiền
            status: 'Đang xử lý',
            time: new Date().toLocaleString('vi-VN')
        });

        await save();
        updateUI();
        document.getElementById('wd-amount').value = ""; // Clear input
        tg.showAlert("✅ Gửi lệnh rút thành công! Vui lòng chờ Admin duyệt trên hệ thống.");
    });
};

// Điều hướng Tab
window.switchTab = (tab) => {
    document.querySelectorAll('.tab-content').forEach(t => t.classList.add('hidden'));
    document.getElementById(`tab-${tab}`).classList.remove('hidden');
    document.querySelectorAll('.nav-btn').forEach(b => b.classList.replace('text-blue-400', 'text-gray-500'));
    document.getElementById(`nav-${tab}`).classList.replace('text-gray-500', 'text-blue-400');
};

function renderHistory() {
    const div = document.getElementById('history-list');
    div.innerHTML = data.history.map(h => `
        <div class="flex justify-between text-[10px] bg-[#0f172a] p-3 rounded-xl border border-slate-800">
            <div>
                <p class="font-bold text-white">Rút -${h.amount.toLocaleString()}đ</p>
                <p class="text-gray-500">${h.time}</p>
            </div>
            <div class="text-right">
                <p class="text-yellow-500 font-bold">${h.status}</p>
                <p class="text-gray-500 text-[8px]">${h.bank}</p>
            </div>
        </div>
    `).join('') || '<p class="text-center text-gray-500 text-xs">Chưa có giao dịch</p>';
}

window.onload = init;

document.getElementById('btn-mine').onclick = () => {
    if (data.startTime) return;
    data.startTime = Date.now();
    save();
    checkMining();
};
