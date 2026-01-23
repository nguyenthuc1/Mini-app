// --- 1. KHỞI TẠO ---
const tg = window.Telegram.WebApp;
tg.ready();
const userId = tg.initDataUnsafe?.user?.id || "guest";

let coins = parseInt(localStorage.getItem('fishing_coins_' + userId)) || 0;
let fishCount = parseFloat(localStorage.getItem('fishing_count_' + userId)) || 0;
let boatLevel = parseInt(localStorage.getItem('boat_level_' + userId)) || 1;
let endTime = parseInt(localStorage.getItem('fishing_endTime_' + userId)) || 0;
const baseSpeed = 0.5;
let isFishing = false;

// --- 2. CẬP NHẬT GIAO DIỆN (ĐỒNG BỘ) ---
function updateDisplays() {
    const roundedFish = Math.floor(fishCount);
    const currentSpeed = baseSpeed + (boatLevel - 1) * 0.5;
    const bonusValue = (boatLevel - 1) * 0.5;

    // Cập nhật tất cả các ID
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

    // Hiển thị +0.5 khi nâng cấp
    const bonusTag = document.getElementById('speed-bonus');
    if (bonusTag) {
        if (bonusValue > 0) {
            bonusTag.innerText = `+${bonusValue.toFixed(1)}`;
            bonusTag.classList.remove('hidden');
        } else {
            bonusTag.classList.add('hidden');
        }
    }

    // Lưu dữ liệu
    localStorage.setItem('fishing_count_' + userId, fishCount);
    localStorage.setItem('fishing_coins_' + userId, coins);
    localStorage.setItem('boat_level_' + userId, boatLevel);
}

// --- 3. QUẢN LÝ MENU & RA KHƠI ---
function switchTab(tabName) {
    document.querySelectorAll('.tab-page').forEach(p => p.classList.add('hidden'));
    const target = document.getElementById('page-' + tabName);
    if (target) target.classList.remove('hidden');
    updateDisplays();
}

function handleStartFishing() {
    if (isFishing) return;
    endTime = Date.now() + (3 * 60 * 60 * 1000); // 3 giờ
    localStorage.setItem('fishing_endTime_' + userId, endTime);
    isFishing = true;
    startCountdown();
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

// --- 4. BÁN CÁ & NÂNG CẤP (CÓ THÔNG BÁO) ---
function sellFishAction() {
    const toSell = Math.floor(fishCount);
    if (toSell < 1) return alert("Bạn không có đủ cá để bán!");
    
    const earned = toSell * 10;
    coins += earned;
    fishCount = 0;
    updateDisplays();
    alert(`💰 Bán thành công! Bạn nhận được ${earned.toLocaleString()} Xu từ ${toSell} cá.`);
}

function buyBoatUpgrade() {
    const cost = boatLevel * 2000;
    if (coins >= cost) {
        coins -= cost;
        boatLevel++;
        updateDisplays();
        alert(`🚀 Nâng cấp thành công lên Cấp ${boatLevel}! Tốc độ tăng thêm +0.5.`);
    } else {
        alert(`Thiếu ${(cost - coins).toLocaleString()} Xu để nâng cấp!`);
    }
}

function requestWithdraw() {
    alert("📤 Yêu cầu rút tiền đang được xử lý (Tối thiểu 50,000 Xu).");
}

// --- 5. VẬN HÀNH ---
setInterval(() => {
    if (isFishing) {
        fishCount += (baseSpeed + (boatLevel - 1) * 0.5);
        updateDisplays();
    }
}, 1000);

// Khôi phục trạng thái khi vào lại app
if (endTime > Date.now()) {
    isFishing = true;
    startCountdown();
}
updateDisplays();
