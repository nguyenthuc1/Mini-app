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

let data = { fish: 0, coins: 0, speed: 1, shipLevel: 1, startTime: null, history: [] };

// --- 1. KHỞI TẠO ---
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
            } else {
                // Lưu ID người dùng mới [cite: 2026-01-23, 2026-01-24]
                await db.ref('users/' + userId).set(data);
            }
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

// --- 2. GIAO DIỆN & TAB ---
window.switchTab = function(tab) {
    document.querySelectorAll('.tab-content').forEach(t => t.classList.add('hidden'));
    const target = document.getElementById('tab-' + tab);
    if (target) target.classList.remove('hidden');
    
    // Đổi màu icon menu
    document.querySelectorAll('.nav-btn').forEach(btn => btn.classList.replace('text-blue-400', 'text-gray-500'));
    const activeBtn = document.getElementById('nav-' + tab);
    if (activeBtn) activeBtn.classList.replace('text-gray-500', 'text-blue-400');
};

function updateUI() {
    const setText = (id, val) => {
        const el = document.getElementById(id);
        if (el) el.innerText = val;
    };
    setText('fish-count', Math.floor(data.fish).toLocaleString());
    setText('coin-balance', Math.floor(data.coins).toLocaleString());
    setText('wallet-balance', Math.floor(data.coins).toLocaleString());
    setText('ship-lv-display', data.shipLevel);
    setText('speed-display', (data.speed || 1).toFixed(1));
    setText('ref-link', `https://t.me/${BOT_USERNAME}/start?startapp=${userId}`);
    renderHistory();
}

// --- 3. LOGIC ĐÀO CÁ ---
function checkMining() {
    const btn = document.getElementById('btn-mine');
    const timer = document.getElementById('timer-display');
    if (!btn) return;

    if (!data.startTime) {
        btn.innerText = "RA KHƠI";
        btn.onclick = () => { 
            data.startTime = Date.now(); 
            save(); 
            checkMining(); 
        };
        if (timer) timer.classList.add('hidden');
        return;
    }

    const interval = setInterval(() => {
        const elapsed = Date.now() - data.startTime;
        const duration = 3 * 60 * 60 * 1000; // 3 tiếng
        
        if (elapsed >= duration) {
            clearInterval(interval);
            btn.innerText = "NHẬN CÁ 💰";
            btn.onclick = async () => {
                const earned = (3 * 3600) * data.speed;
                data.fish += earned;
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
                const h = Math.floor(rem/3600).toString().padStart(2,'0');
                const m = Math.floor((rem%3600)/60).toString().padStart(2,'0');
                const s = (rem%60).toString().padStart(2,'0');
                timer.innerText = `${h}:${m}:${s}`;
            }
        }
    }, 1000);
}

// --- 4. SỰ KIỆN & LƯU TRỮ ---
function setupEventListeners() {
    const safeClick = (id, fn) => {
        const el = document.getElementById(id);
        if (el) el.onclick = fn;
    };

    safeClick('btn-sell', async () => {
        if (data.fish < 100) return tg.showAlert("Cần tối thiểu 100 cá!");
        data.coins += (data.fish * 0.005);
        data.fish = 0;
        await save();
        updateUI();
        tg.showAlert("✅ Đã bán cá thành công!");
    });

    safeClick('btn-upgrade', async () => {
        if (data.coins < 200) return tg.showAlert("Cần 200 xu!");
        data.coins -= 200;
        data.speed += 0.2;
        data.shipLevel += 1;
        await save();
        updateUI();
        tg.showAlert("🚀 Nâng cấp thành công!");
    });

    safeClick('btn-copy-ref', () => {
        const link = document.getElementById('ref-link').innerText;
        navigator.clipboard.writeText(link);
        tg.showAlert("✅ Đã copy link giới thiệu!");
    });
}

async function save() {
    return db.ref('users/' + userId).set(data); [cite: 2026-01-24]
}

function renderHistory() {
    const div = document.getElementById('history-list');
    if(!div) return;
    div.innerHTML = (data.history || []).map(h => `
        <div class="p-3 bg-[#0f172a] rounded-xl mb-2 border border-slate-800 text-[10px] flex justify-between">
            <div><p class="text-white font-bold">${h.status}</p><p class="text-gray-500">${h.time}</p></div>
            <p class="text-yellow-500 font-bold">${h.amount.toLocaleString()} 💰</p>
        </div>
    `).join('') || '<p class="text-center text-gray-500 py-4 text-xs">Chưa có giao dịch</p>';
}

window.onload = init;
