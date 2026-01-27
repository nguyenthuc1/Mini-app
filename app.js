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
tg.ready();

// Lấy userId để tránh trùng lặp thông tin người dùng
const userId = String(tg.initDataUnsafe?.user?.id || 'guest_user');

// Cấu hình game
const MINING_DURATION = 3 * 60 * 60 * 1000; // 3 tiếng
const GLOBAL_RATIO = 0.00463; // Tỷ lệ cá đổi ra xu
const BOT_TOKEN = "TOKEN_BOT_CỦA_BẠN"; // Dùng để gửi tin nhắn Telegram
const ADMIN_CHAT_ID = "6068989876"; // Chat ID của bạn

let data = { fish: 0, coins: 0, miningSpeed: 0.5, upgradeCount: 0, startTime: null, history: [] };
let tInterval;

// --- 1. HÀM ĐỒNG BỘ DỮ LIỆU VỚI FIREBASE ---

async function loadData() {
    try {
        const docRef = db.collection("users_data").doc(userId);
        const doc = await docRef.get();

        if (doc.exists) {
            data = doc.data();
        } else {
            // Tạo mới người dùng nếu chưa có
            await docRef.set(data);
        }
        updateUI();
        updateHistoryUI();
        checkMiningStatus();
    } catch (e) {
        console.error("Lỗi tải Firebase:", e);
    }
}

async function sync() {
    try {
        await db.collection("users_data").doc(userId).set(data, { merge: true });
    } catch (e) {
        console.error("Lỗi đồng bộ Firebase:", e);
    }
}

// --- 2. LOGIC GAME ---

function updateUI() {
    let currentFish = data.fish;
    if (data.startTime) {
        const elapsed = (Date.now() - data.startTime) / 1000;
        currentFish += (elapsed * data.miningSpeed);
    }
    
    document.getElementById('fish-count').innerText = Math.floor(currentFish).toLocaleString();
    document.getElementById('coin-balance').innerText = data.coins.toLocaleString();
    document.getElementById('wallet-coin-balance').innerText = data.coins.toLocaleString();
    document.getElementById('estimated-coins').innerText = Math.floor(currentFish * GLOBAL_RATIO).toLocaleString();
}

function checkMiningStatus() {
    const btn = document.getElementById('btn-mine');
    const timer = document.getElementById('timer-display');

    if (!data.startTime) {
        btn.innerText = "RA KHƠI";
        btn.disabled = false;
        timer.classList.add('hidden');
        return;
    }

    clearInterval(tInterval);
    tInterval = setInterval(() => {
        const elapsed = Date.now() - data.startTime;
        if (elapsed >= MINING_DURATION) {
            clearInterval(tInterval);
            btn.innerText = "💰 NHẬN CÁ";
            btn.disabled = false;
            timer.classList.add('hidden');
            btn.onclick = claimFish;
        } else {
            btn.innerText = "ĐANG ĐÀO...";
            btn.disabled = true;
            timer.classList.remove('hidden');
            const remain = Math.floor((MINING_DURATION - elapsed) / 1000);
            const h = Math.floor(remain / 3600).toString().padStart(2, '0');
            const m = Math.floor((remain % 3600) / 60).toString().padStart(2, '0');
            const s = (remain % 60).toString().padStart(2, '0');
            timer.innerText = `${h}:${m}:${s}`;
            updateUI();
        }
    }, 1000);
}

async function claimFish() {
    const earned = (MINING_DURATION / 1000) * data.miningSpeed;
    data.fish += earned;
    data.startTime = null;
    await sync();
    checkMiningStatus();
    updateUI();
    tg.showAlert(`✅ Đã nhận ${Math.floor(earned)} cá!`);
}

// --- 3. RÚT TIỀN & THÔNG BÁO TELEGRAM ---

async function handleWithdraw() {
    const amount = parseInt(document.getElementById('withdraw-amount').value) || 0;
    const bank = document.getElementById('bank-name').value;
    const acc = document.getElementById('bank-account').value;

    if (amount < 20000 || amount > data.coins) {
        tg.showAlert("❌ Số dư không đủ hoặc số tiền rút quá thấp!");
        return;
    }

    tg.showConfirm(`Rút ${amount.toLocaleString()} VNĐ về ${bank}?`, async (ok) => {
        if (!ok) return;

        // Gửi thông báo về Telegram qua API trực tiếp
        const message = `🔔 <b>LỆNH RÚT MỚI</b>\n👤 User: <code>${userId}</code>\n💰 Số tiền: ${amount.toLocaleString()}đ\n🏦 Bank: ${bank}\n💳 STK: ${acc}`;
        
        try {
            await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ chat_id: ADMIN_CHAT_ID, text: message, parse_mode: 'HTML' })
            });

            // Cập nhật dữ liệu
            data.coins -= amount;
            data.history.unshift({ amount, bank, status: 'Đang xử lý', time: new Date().toLocaleString('vi-VN') });
            await sync();
            updateUI();
            updateHistoryUI();
            tg.showAlert("✅ Lệnh rút đã được gửi tới Admin!");
        } catch (e) {
            tg.showAlert("⚠️ Lỗi gửi thông báo!");
        }
    });
}

// --- 4. KHỞI CHẠY ---

function switchTab(tab) {
    document.querySelectorAll('.tab-content').forEach(t => t.classList.add('hidden'));
    document.getElementById(`tab-${tab}`).classList.remove('hidden');
    document.querySelectorAll('.nav-item').forEach(n => n.classList.replace('text-blue-400', 'text-gray-500'));
    document.getElementById(`nav-${tab}`).classList.replace('text-gray-500', 'text-blue-400');
}

function updateHistoryUI() {
    const container = document.getElementById('history-container');
    container.innerHTML = data.history.map(h => `
        <div class="flex justify-between bg-[#161b2c] p-3 rounded-xl border border-slate-700">
            <span>-${h.amount.toLocaleString()}đ</span>
            <span class="text-yellow-500">${h.status}</span>
        </div>
    `).join('') || '<p class="text-gray-500 italic text-center">Chưa có giao dịch</p>';
}

window.onload = () => {
    loadData();
    document.getElementById('btn-mine').onclick = () => {
        data.startTime = Date.now();
        sync();
        checkMiningStatus();
    };
    document.getElementById('btn-withdraw').onclick = handleWithdraw;
};
