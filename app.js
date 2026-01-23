
 // --- 1. KHỞI TẠO USER ---
const tg = window.Telegram.WebApp;
tg.ready();
const userId = tg.initDataUnsafe?.user?.id || "guest";

// Ép kiểu Number để tránh lỗi cộng chuỗi
let coins = parseInt(localStorage.getItem('fishing_coins_' + userId)) || 0;
let fishCount = parseFloat(localStorage.getItem('fishing_count_' + userId)) || 0;
let boatLevel = parseInt(localStorage.getItem('boat_level_' + userId)) || 1;
let endTime = parseInt(localStorage.getItem('fishing_endTime_' + userId)) || 0;
const baseSpeed = 0.5;
let isFishing = false;

// --- 2. HÀM ĐỒNG BỘ GIAO DIỆN TẤT CẢ CÁC TRANG ---
function updateDisplays() {
    const currentSpeed = baseSpeed + (boatLevel - 1) * 0.5;
    const roundedFish = Math.floor(fishCount);

    // Cập nhật số cá & xu trên MỌI trang có ID tương ứng
    const elements = {
        'fish-display': roundedFish.toLocaleString(),
        'sell-fish-count': roundedFish.toLocaleString(),
        'coin-display': coins.toLocaleString(),
        'wallet-balance': coins.toLocaleString(),
        'boat-level': boatLevel,
        'upgrade-cost': (boatLevel * 2000).toLocaleString(),
        'speed-display': currentSpeed.toFixed(1)
    };

    for (let id in elements) {
        const el = document.getElementById(id);
        if (el) el.innerText = elements[id];
    }

    // Lưu dữ liệu vào LocalStorage theo userId
    localStorage.setItem('fishing_count_' + userId, fishCount);
    localStorage.setItem('fishing_coins_' + userId, coins);
    localStorage.setItem('boat_level_' + userId, boatLevel);
}

// --- 3. XỬ LÝ QUẢNG CÁO & NÚT RA KHƠI ---
// Nếu bạn chưa có Block ID của Adsgram, hàm này sẽ tự động chạy lệnh mà không lỗi
function showAdBeforeAction(callback) {
    if (typeof AdController !== 'undefined') {
        AdController.show().then(() => callback()).catch(() => callback());
    } else {
        callback(); // Chạy luôn nếu không có SDK quảng cáo
    }
}

function handleStartFishing() {
    if (isFishing) return;

    showAdBeforeAction(() => {
        endTime = Date.now() + (3 * 60 * 60 * 1000); // 3 tiếng
        localStorage.setItem('fishing_endTime_' + userId, endTime);
        isFishing = true;
        startCountdown();
    });
}

function startCountdown() {
    const btnText = document.getElementById('btn-text');
    const timerInterval = setInterval(() => {
        const timeLeft = endTime - Date.now();
        
        if (timeLeft <= 0) {
            clearInterval(timerInterval);
            isFishing = false;
            if(btnText) btnText.innerText = "🚢 RA KHƠI";
            localStorage.removeItem('fishing_endTime_' + userId);
        } else {
            isFishing = true;
            const h = Math.floor(timeLeft / 3600000).toString().padStart(2, '0');
            const m = Math.floor((timeLeft % 3600000) / 60000).toString().padStart(2, '0');
            const s = Math.floor((timeLeft % 60000) / 1000).toString().padStart(2, '0');
            if(btnText) btnText.innerText = `${h}:${m}:${s}`;
        }
    }, 1000);
}

// --- 4. CHUYỂN TRANG & CHẠY GAME ---
function switchTab(tabName) {
    document.querySelectorAll('.tab-page').forEach(p => p.classList.add('hidden'));
    const target = document.getElementById('page-' + tabName);
    if (target) target.classList.remove('hidden');
    updateDisplays(); // Đồng bộ ngay khi chuyển trang
}

function sellFishAction() {
    const toSell = Math.floor(fishCount);
    if (toSell < 1) return alert("Không có cá!");
    coins += (toSell * 10);
    fishCount = 0;
    updateDisplays();
}

function buyBoatUpgrade() {
    const cost = boatLevel * 2000;
    if (coins >= cost) {
        coins -= cost;
        boatLevel++;
        updateDisplays();
    } else {
        alert("Thiếu xu!");
    }
}

// Chạy ngầm để cộng cá mỗi giây
setInterval(() => {
    if (isFishing) {
        fishCount += (baseSpeed + (boatLevel - 1) * 0.5);
        updateDisplays();
    }
}, 1000);

// Kiểm tra nếu đang đánh bắt dở dang khi vào app
if (endTime > Date.now()) {
    isFishing = true;
    startCountdown();
}

// Lần đầu load app
updateDisplays();
// --- CẬP NHẬT HÀM BÁN CÁ ---
function sellFishAction() {
    const toSell = Math.floor(fishCount);
    if (toSell < 1) return alert("Bạn không có đủ cá để bán!");
    
    const earnedGold = toSell * 10;
    coins += earnedGold;
    fishCount = 0;
    updateDisplays();
    
    // Thông báo chi tiết số tiền nhận được
    alert(`💰 Chúc mừng! Bạn đã bán ${toSell.toLocaleString()} cá và nhận được ${earnedGold.toLocaleString()} Xu!`);
}

// --- CẬP NHẬT HÀM NÂNG CẤP ---
function buyBoatUpgrade() {
    const cost = boatLevel * 2000;
    if (coins >= cost) {
        coins -= cost;
        boatLevel++;
        updateDisplays();
        
        // Thông báo khi nâng cấp thành công
        alert(`🚀 Nâng cấp thành công! Thuyền hiện tại: Cấp ${boatLevel}. Tốc độ đánh bắt đã tăng thêm +0.5 cá/s!`);
    } else {
        // Thông báo khi thiếu tiền
        alert(`Bạn còn thiếu ${(cost - coins).toLocaleString()} Xu để nâng cấp lên cấp ${boatLevel + 1}!`);
    }
}

// --- CẬP NHẬT HÀM RÚT TIỀN ---
function requestWithdraw() {
    const minWithdraw = 50000;
    if (coins < minWithdraw) {
        alert(`Cần tối thiểu ${minWithdraw.toLocaleString()} Xu để thực hiện rút tiền. Hãy chăm chỉ đánh cá thêm nhé!`);
        return;
    }
    
    // Thông báo xác nhận rút tiền
    alert("📤 Yêu cầu rút tiền đã được gửi! Hệ thống sẽ kiểm tra và cộng vào ví của bạn trong vòng 24h.");
}
