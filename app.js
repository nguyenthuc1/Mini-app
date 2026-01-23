// --- 1. NHẬN DIỆN USER (Chống trùng dữ liệu) ---
const tg = window.Telegram.WebApp;
tg.ready();
const userId = tg.initDataUnsafe?.user?.id || "guest";

// --- 2. KHỞI TẠO DỮ LIỆU ---
let coins = parseInt(localStorage.getItem('fishing_coins_' + userId)) || 0;
let fishCount = parseFloat(localStorage.getItem('fishing_count_' + userId)) || 0;
let boatLevel = parseInt(localStorage.getItem('boat_level_' + userId)) || 1;
let endTime = localStorage.getItem('fishing_endTime_' + userId) || 0;
const baseSpeed = 0.5; // Tốc độ gốc cấp 1
let isFishing = false;

// --- 3. CẬP NHẬT GIAO DIỆN ---
function updateDisplays() {
    const roundedFish = Math.floor(fishCount);
    const cost = boatLevel * 2000;
    // Công thức: Tốc độ = 0.5 + (Cấp - 1) * 0.5
    const speed = baseSpeed + (boatLevel - 1) * 0.5;

    // Hiển thị tốc độ và cá
    if(document.getElementById('speed-display')) document.getElementById('speed-display').innerText = speed.toFixed(1);
    if(document.getElementById('fish-display')) document.getElementById('fish-display').innerText = roundedFish.toLocaleString();
    if(document.getElementById('sell-fish-count')) document.getElementById('sell-fish-count').innerText = roundedFish.toLocaleString();
    
    // Hiển thị tiền và nâng cấp
    if(document.getElementById('coin-display')) document.getElementById('coin-display').innerText = coins.toLocaleString();
    if(document.getElementById('wallet-balance')) document.getElementById('wallet-balance').innerText = coins.toLocaleString();
    if(document.getElementById('boat-level')) document.getElementById('boat-level').innerText = boatLevel;
    if(document.getElementById('upgrade-cost')) document.getElementById('upgrade-cost').innerText = cost.toLocaleString();

    // HIỂN THỊ +0.5 TRÊN HOME NẾU ĐÃ NÂNG CẤP
    const bonusTag = document.getElementById('speed-bonus');
    if (bonusTag) {
        if (boatLevel > 1) {
            bonusTag.classList.remove('hidden');
            bonusTag.innerText = `+${((boatLevel - 1) * 0.5).toFixed(1)}`;
        } else {
            bonusTag.classList.add('hidden');
        }
    }

    // Lưu dữ liệu theo ID
    localStorage.setItem('fishing_count_' + userId, fishCount);
    localStorage.setItem('fishing_coins_' + userId, coins);
    localStorage.setItem('boat_level_' + userId, boatLevel);
}

// --- 4. LOGIC QUẢNG CÁO & NÂNG CẤP ---
const blockId = "YOUR_BLOCK_ID"; 
async function showAdBeforeAction(successCallback) {
    if (window.Adsgram && blockId !== "YOUR_BLOCK_ID") {
        try {
            const AdController = window.Adsgram.init({ blockId: blockId });
            const result = await AdController.show();
            if (result.done) successCallback();
            else alert("Bạn cần xem hết quảng cáo!");
        } catch (error) { successCallback(); }
    } else { successCallback(); }
}

function buyBoatUpgrade() {
    const cost = boatLevel * 2000;
    if (boatLevel >= 14) return alert("Cấp tối đa!");
    
    showAdBeforeAction(() => {
        if (coins >= cost) {
            coins -= cost;
            boatLevel++;
            updateDisplays();
            alert(`🚀 Nâng cấp thành công! Tốc độ hiện tại: ${(baseSpeed + (boatLevel - 1) * 0.5).toFixed(1)} cá/s`);
        } else {
            alert("Thiếu xu!");
        }
    });
}

// --- 5. RA KHƠI & BÁN CÁ ---
function handleStartFishing() {
    if (isFishing) return;
    showAdBeforeAction(() => {
        endTime = Date.now() + (3 * 60 * 60 * 1000);
        localStorage.setItem('fishing_endTime_' + userId, endTime);
        isFishing = true;
        startCountdown();
    });
}

function sellFishAction() {
    const toSell = Math.floor(fishCount);
    if (toSell < 1) return alert("Không có cá!");
    const earned = toSell * 10;
    coins += earned;
    fishCount = 0;
    updateDisplays();
    alert(`💰 Bạn đã bán ${toSell} cá và nhận được ${earned} Xu!`);
}

function switchTab(tabName) {
    document.querySelectorAll('.tab-page').forEach(p => p.classList.add('hidden'));
    const target = document.getElementById('page-' + tabName);
    if (target) target.classList.remove('hidden');
    updateDisplays();
}

// --- 6. VẬN HÀNH ---
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

// Chỉ cộng cá khi ĐANG RA KHƠI
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
