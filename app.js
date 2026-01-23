// --- 1. NHẬN DIỆN USER & KHỞI TẠO ---
const tg = window.Telegram.WebApp;
tg.ready();
const userId = tg.initDataUnsafe?.user?.id || "guest";

let coins = parseInt(localStorage.getItem('fishing_coins_' + userId)) || 0;
let fishCount = parseFloat(localStorage.getItem('fishing_count_' + userId)) || 0;
let boatLevel = parseInt(localStorage.getItem('boat_level_' + userId)) || 1;
let endTime = localStorage.getItem('fishing_endTime_' + userId) || 0;
const baseSpeed = 0.5;
let isFishing = false;

// --- 2. CẬP NHẬT GIAO DIỆN & HIỂN THỊ CỘNG THÊM ---
function updateDisplays() {
    const currentSpeed = baseSpeed + (boatLevel - 1) * 0.5;
    const bonusValue = (boatLevel - 1) * 0.5;

    // Hiển thị tốc độ và Bonus +0.5
    if(document.getElementById('speed-display')) document.getElementById('speed-display').innerText = currentSpeed.toFixed(1);
    const bonusTag = document.getElementById('speed-bonus');
    if (bonusTag) {
        if (bonusValue > 0) {
            bonusTag.innerText = `+${bonusValue.toFixed(1)}`;
            bonusTag.classList.remove('hidden');
        } else {
            bonusTag.classList.add('hidden');
        }
    }

    // Các thông số khác
    if(document.getElementById('fish-display')) document.getElementById('fish-display').innerText = Math.floor(fishCount).toLocaleString();
    if(document.getElementById('sell-fish-count')) document.getElementById('sell-fish-count').innerText = Math.floor(fishCount).toLocaleString();
    if(document.getElementById('coin-display')) document.getElementById('coin-display').innerText = coins.toLocaleString();
    if(document.getElementById('wallet-balance')) document.getElementById('wallet-balance').innerText = coins.toLocaleString();
    if(document.getElementById('boat-level')) document.getElementById('boat-level').innerText = boatLevel;
    if(document.getElementById('upgrade-cost')) document.getElementById('upgrade-cost').innerText = (boatLevel * 2000).toLocaleString();

    // Lưu dữ liệu theo ID User
    localStorage.setItem('fishing_count_' + userId, fishCount);
    localStorage.setItem('fishing_coins_' + userId, coins);
    localStorage.setItem('boat_level_' + userId, boatLevel);
}

// --- 3. LOGIC CHUYỂN TRANG (SỬA LỖI MÀN HÌNH ĐEN) ---
function switchTab(tabName) {
    document.querySelectorAll('.tab-page').forEach(p => p.classList.add('hidden'));
    const target = document.getElementById('page-' + tabName);
    if (target) {
        target.classList.remove('hidden');
    }
    updateDisplays();
}

// --- 4. HÀNH ĐỘNG GAME ---
function buyBoatUpgrade() {
    const cost = boatLevel * 2000;
    if (coins >= cost) {
        coins -= cost;
        boatLevel++;
        updateDisplays();
        alert(`🚀 Nâng cấp thành công! Tốc độ đánh bắt tăng thêm 0.5 cá/s.`);
    } else {
        alert("Bạn không đủ xu để nâng cấp!");
    }
}

function sellFishAction() {
    const toSell = Math.floor(fishCount);
    if (toSell < 1) return alert("Không có cá!");
    const earned = toSell * 10;
    coins += earned;
    fishCount = 0;
    updateDisplays();
    alert(`💰 Bạn đã bán ${toSell} cá và nhận được ${earned.toLocaleString()} Xu!`);
}

function requestWithdraw() {
    if (coins < 50000) return alert("Cần tối thiểu 50,000 xu để rút tiền!");
    alert("Yêu cầu rút tiền của bạn đã được gửi đi!");
}

function handleStartFishing() {
    if (isFishing) return;
    endTime = Date.now() + (3 * 60 * 60 * 1000);
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

// Chạy mỗi giây để cộng cá khi đang ra khơi
setInterval(() => {
    if (isFishing) {
        fishCount += (baseSpeed + (boatLevel - 1) * 0.5);
        updateDisplays();
    }
}, 1000);

if (endTime && endTime > Date.now()) {
    isFishing = true;
    startCountdown();
}
updateDisplays();
