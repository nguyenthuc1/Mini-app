// --- 0. CẤU HÌNH FIREBASE (Dựa trên ảnh của bạn) ---
const firebaseConfig = {
  apiKey: "AIzaSyAc0psT5Up6aEu0VnCz1TZ4sSNTKmif8oA",
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
    speed: 1,
    shipLevel: 1,
    startTime: null,
    history: [],
    completedTasks: []
};

// --- 1. HÀM KHỞI TẠO & ĐỒNG BỘ ---

async function init() {
    firebase.auth().onAuthStateChanged(async (user) => {
        if (user) {
            console.log("Đã đăng nhập với UID:", user.uid);
            // 1. Tải dữ liệu từ database
            const snapshot = await db.ref('users/' + userId).once('value');
            
            if (snapshot.exists()) {
                // Nếu là người cũ: Tải dữ liệu lên
                data = { ...data, ...snapshot.val() };
            } else {
                // Nếu là NGƯỜI MỚI: Kiểm tra start_param (Người mời)
                const startParam = tg.initDataUnsafe?.start_param; 
                if (startParam && startParam !== userId) {
                    // Cộng thưởng cho người đã gửi link mời
                    await rewardReferrer(startParam);
                }
                // Khởi tạo dữ liệu mặc định cho người mới
                await db.ref('users/' + userId).set(data);
            }

            setupEventListeners();
            updateUI();
            checkMining();
        } else {
            firebase.auth().signInAnonymously().catch((error) => {
                tg.showAlert("Lỗi xác thực: " + error.code); 
            });
        }
    });
}


async function save() {
    try {
        await db.ref('users/' + userId).set(data);
        console.log("Dữ liệu đã được đồng bộ lên Firebase.");
    } catch (error) {
        console.error("Lỗi đồng bộ:", error);
        tg.showAlert("Không thể lưu dữ liệu, vui lòng kiểm tra kết nối!");
    }
}

function setupEventListeners() {
    // 1. Nút Đào cá (Ra khơi / Nhận cá)
    const btnMine = document.getElementById('btn-mine');
    if (btnMine) {
        // Không dùng trực tiếp onclick ở đây vì hàm checkMining() sẽ tự quản lý nút này
        checkMining(); 
    }

    // 2. Nút Bán cá
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

    // 3. Nút Nâng cấp
    const btnUpgrade = 
document.getElementById('btn-upgrade').onclick = async () => {
    const cost = 200; 
    const MAX_SPEED = 5.0; 

    // CHÚ Ý: Sửa miningSpeed thành speed
    if (data.speed >= MAX_SPEED) { 
        tg.showAlert("🚀 Đã đạt tốc độ tối đa!");
        return;
    }

    if (data.coins >= cost) {
        data.coins -= cost;
        data.speed += 0.2; // CHÚ Ý: Sửa miningSpeed thành speed
        data.shipLevel += 1; // Tăng thêm level tàu cho đẹp UI

        if (data.speed > MAX_SPEED) data.speed = MAX_SPEED;

        await save(); // Bây giờ hàm save() sẽ chạy vì data đã đúng cấu trúc
        updateUI();
        tg.showAlert("🚀 Nâng cấp thành công!");
    } else {
        tg.showAlert("❌ Bạn cần 200 xu!");
    }
};


    // 4. Các nút chuyển Tab (để quay lại Home vẫn bấm được)
    const tabs = ['home', 'tasks', 'friends', 'wallet'];
    tabs.forEach(tab => {
        const btn = document.getElementById(`nav-${tab}`);
        if (btn) btn.onclick = () => switchTab(tab);
    });
}
       //3. UPDATEUI
function updateUI() {
    // 1. Cập nhật Cá và Xu (Các id này chắc chắn bạn đã có)
    const fishEl = document.getElementById('fish-count');
    const coinEl = document.getElementById('coin-balance');
    if (fishEl) fishEl.innerText = Math.floor(data.fish).toLocaleString();
    if (coinEl) coinEl.innerText = Math.floor(data.coins).toLocaleString();

    // 2. Cập nhật Level và Tốc độ (Đoạn này giúp UI nhảy số ngay)
    const lvEl = document.getElementById('ship-lv-display');
    const speedEl = document.getElementById('speed-display');
    
    if (lvEl) lvEl.innerText = data.shipLevel; // Cập nhật số Level
    if (speedEl) speedEl.innerText = data.speed.toFixed(1); // Cập nhật 1.2, 1.4...

    // 3. Cập nhật trạng thái nút Nâng cấp
    const btnUpgrade = document.getElementById('btn-upgrade');
    if (btnUpgrade) {
        if (data.speed >= 5.0) { 
            btnUpgrade.innerText = "MAX LEVEL";
            btnUpgrade.disabled = true;
            btnUpgrade.style.opacity = "0.5";
        } else {
            btnUpgrade.innerText = "NÂNG CẤP (200 💰)";
            btnUpgrade.disabled = false;
            btnUpgrade.style.opacity = "1";
        }
    }

    // 4. Cập nhật các phần khác
    const estEl = document.getElementById('est-coins');
    const walletEl = document.getElementById('wallet-balance');
    if (estEl) estEl.innerText = Math.floor(data.fish * 0.005).toLocaleString();
    if (walletEl) walletEl.innerText = Math.floor(data.coins).toLocaleString();
    
    renderHistory(); 
    // Thêm đoạn này vào cuối hàm
    const refLinkEl = document.getElementById('ref-link');
    if (refLinkEl) {
        refLinkEl.innerText = `https://t.me/${BOT_USERNAME}/start?startapp=${userId}`;
    }
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

    // 1. Tính toán số cá kiếm được dựa trên thời gian thực tế
    const effectiveTimeSeconds = Math.min(elapsed, duration) / 1000;
    const earned = effectiveTimeSeconds * data.speed;

    // 2. CỘNG DỒN: Đảm bảo lấy giá trị cũ cộng với giá trị mới
    // Sử dụng parseFloat để tránh lỗi cộng chuỗi văn bản
    data.fish = (parseFloat(data.fish) || 0) + earned;
    
    // 3. Reset mốc thời gian về null để kết thúc phiên đào
    data.startTime = null; 

    // 4. Lưu lên Firebase và cập nhật giao diện
    try {
        await save(); // Gọi hàm save đã có của bạn
        updateUI();
        checkMining();
        tg.showAlert(`✅ Bạn đã nhận được ${Math.floor(earned).toLocaleString()} cá!`);
    } catch (error) {
        console.error("Lỗi lưu dữ liệu:", error);
        tg.showAlert("❌ Lỗi kết nối, không thể cộng cá vào tài khoản!");
    }
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
const REF_REWARD = 500; // Số xu thưởng cho người mời
const BOT_USERNAME = "Supermoneymine_bot"; // Thay tên Username Bot của bạn vào đây (không có @)

// Tạo link mời dựa trên userId của Telegram [cite: 2026-01-24]
const refLink = `https://t.me/${BOT_USERNAME}/start?startapp=${userId}`;
const refLinkEl = document.getElementById('ref-link');
if (refLinkEl) refLinkEl.innerText = refLink;

// Tìm đến đoạn nút copy-ref trong ảnh số 3
document.getElementById('btn-copy-ref').onclick = () => {
    const link = `https://t.me/${BOT_USERNAME}/start?startapp=${userId}`;
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
