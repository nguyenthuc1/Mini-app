// --- 1. KẾT NỐI TELEGRAM & NHẬN DIỆN USER ---
const tg = window.Telegram.WebApp;
tg.ready();
// Lấy ID duy nhất của người dùng Telegram
const userId = tg.initDataUnsafe?.user?.id || "guest";

// --- 2. KHỞI TẠO DỮ LIỆU THEO USER ID ---
let coins = parseInt(localStorage.getItem('fishing_coins_' + userId)) || 0;
let fishCount = parseFloat(localStorage.getItem('fishing_count_' + userId)) || 0;
let boatLevel = parseInt(localStorage.getItem('boat_level_' + userId)) || 1;
let endTime = localStorage.getItem('fishing_endTime_' + userId) || 0;
const baseSpeed = 0.5;
let isFishing = false;

// --- 3. HÀM QUẢNG CÁO (AN TOÀN) ---
async function showAdBeforeAction(successCallback) {
    const blockId = "YOUR_BLOCK_ID"; 
    if (window.Adsgram && blockId !== "YOUR_BLOCK_ID") {
        try {
            const AdController = window.Adsgram.init({ blockId: blockId });
            const result = await AdController.show();
            if (result.done) successCallback();
        } catch (error) { successCallback(); }
    } else {
        successCallback(); // Nếu chưa có Ads thật vẫn cho chạy game
    }
}

// --- 4. CẬP NHẬT GIAO DIỆN & LƯU TRỮ ---
function updateDisplays() {
    const roundedFish = Math.floor(fishCount);
    const speed = baseSpeed + (boatLevel - 1) * 0.5;

    // Hiển thị lên màn hình
    if(document.getElementById('fish-display')) document.getElementById('fish-display').innerText = roundedFish.toLocaleString();
    if(document.getElementById('sell-fish-count')) document.getElementById('sell-fish-count').innerText = roundedFish.toLocaleString();
    if(document.getElementById('coin-display')) document.getElementById('coin-display').innerText = coins.toLocaleString();
    if(document.getElementById('wallet-balance')) document.getElementById('wallet-balance').innerText = coins.toLocaleString();
    if(document.getElementById('boat-level')) document.getElementById('boat-level').innerText = boatLevel;
    if(document.getElementById('upgrade-cost')) document.getElementById('upgrade-cost').innerText = (boatLevel * 2000).toLocaleString();

    // Lưu vào bộ nhớ THEO USER ID
    localStorage.setItem('fishing_count_' + userId, fishCount);
    localStorage.setItem('fishing_coins_' + userId, coins);
    localStorage.setItem('boat_level_' + userId, boatLevel);
}

// --- 5. XỬ LÝ NÚT RA KHƠI ---
function handleStartFishing() {
    if (isFishing) return;
    showAdBeforeAction(() => {
        endTime = Date.now() + (3 * 60 * 60 * 1000);
        localStorage.setItem('fishing_endTime_' + userId, endTime);
        startCountdown();
    });
}

// --- 6. CHUYỂN PAGE ---
function switchTab(tabName) {
    document.querySelectorAll('.tab-page').forEach(p => p.classList.add('hidden'));
    const target = document.getElementById('page-' + tabName);
    if (target) target.classList.remove('hidden');
    updateDisplays();
}

// --- 7. BÁN CÁ & NÂNG CẤP ---
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
    } else { alert("Thiếu xu!"); }
}

// --- 8. ĐẾM NGƯỢC & VẬN HÀNH ---
function startCountdown() {
    const btnText = document.getElementById('btn-text');
    const timerInterval = setInterval(() => {
        const timeLeft = endTime - Date.now();
        if (timeLeft <= 0) {
            clearInterval(timerInterval);
            isFishing = false;
            if(btnText) btnText.innerText = "🚢 RA KHƠI";
        } else {
            isFishing = true;
            const h = Math.floor(timeLeft / 3600000).toString().padStart(2, '0');
            const m = Math.floor((timeLeft % 3600000) / 60000).toString().padStart(2, '0');
            const s = Math.floor((timeLeft % 60000) / 1000).toString().padStart(2, '0');
            if(btnText) btnText.innerText = `${h}:${m}:${s}`;
        }
    }, 1000);
}

// --- 6. VẬN HÀNH (Chỉ cộng cá khi đang trong trạng thái ra khơi) ---
setInterval(() => {
    if (isFishing) { // Thêm điều kiện này
        fishCount += (baseSpeed + (boatLevel - 1) * 0.5);
        updateDisplays();
    }
}, 1000);

