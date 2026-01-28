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

// Khởi tạo Firebase ngay lập tức
if (!firebase.apps.length) firebase.initializeApp(firebaseConfig);
const db = firebase.database();
const tg = window.Telegram.WebApp;
const userId = String(tg.initDataUnsafe?.user?.id || '88888888');

let data = { fish: 0, coins: 0, speed: 1, shipLevel: 1, startTime: null, history: [] };

// --- 1. HÀM PHÁ BĂNG CẤP TỐC ---
function hideLoading() {
    const loader = document.getElementById('loading-screen');
    if (loader) {
        loader.style.setProperty('display', 'none', 'important');
        console.log("Đã ép buộc ẩn loading thành công!");
    }
}

// Ép ẩn sau 3 giây bất kể chuyện gì xảy ra
setTimeout(hideLoading, 3000);

// --- 2. KHỞI TẠO DỮ LIỆU ---
async function init() {
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
                await db.ref('users/' + userId).set(data);
            }
            // Tải dữ liệu xong thì ẩn loading
            hideLoading();
            updateUI();
        } catch (e) {
            console.error(e);
            hideLoading();
        }
    });
}

function updateUI() {
    if (document.getElementById('fish-count')) {
        document.getElementById('fish-count').innerText = Math.floor(data.fish).toLocaleString();
        document.getElementById('coin-balance').innerText = Math.floor(data.coins).toLocaleString();
    }
}

// Các hàm chuyển tab toàn cục để HTML gọi được
window.switchTab = function(tab) {
    document.querySelectorAll('.tab-content').forEach(t => t.classList.add('hidden'));
    const target = document.getElementById('tab-' + tab);
    if (target) target.classList.remove('hidden');
};

window.onload = init;
