// --- 1. KHỞI TẠO BIẾN (Chỉ 1 lần duy nhất) ---
let coins = parseInt(localStorage.getItem('fishing_coins')) || 0;
let fishCount = parseFloat(localStorage.getItem('fishing_count')) || 0;
let boatLevel = parseInt(localStorage.getItem('boat_level')) || 1;
let endTime = localStorage.getItem('fishing_endTime') || 0;
const baseSpeed = 0.5;
let isFishing = false;

// --- 2. HÀM CẬP NHẬT HIỂN THỊ (Đồng bộ mọi nơi) ---
function updateDisplays() {
    const roundedFish = Math.floor(fishCount);
    const upgradeCost = boatLevel * 2000;
    const speed = baseSpeed + (boatLevel - 1) * 0.5;

    // Cập nhật số cá
    if(document.getElementById('fish-display')) document.getElementById('fish-display').innerText = roundedFish.toLocaleString();
    if(document.getElementById('sell-fish-count')) document.getElementById('sell-fish-count').innerText = roundedFish.toLocaleString();
    
    // Cập nhật xu
    if(document.getElementById('coin-display')) document.getElementById('coin-display').innerText = coins.toLocaleString();
    if(document.getElementById('wallet-balance')) document.getElementById('wallet-balance').innerText = coins.toLocaleString();
    
    // Cập nhật thông số nâng cấp
    if(document.getElementById('boat-level')) document.getElementById('boat-level').innerText = boatLevel;
    if(document.getElementById('upgrade-cost')) document.getElementById('upgrade-cost').innerText = upgradeCost.toLocaleString();
    if(document.getElementById('speed-display')) document.getElementById('speed-display').innerText = speed.toFixed(1);

    // Lưu bộ nhớ
    localStorage.setItem('fishing_count', fishCount);
    localStorage.setItem('fishing_coins', coins);
    localStorage.setItem('boat_level', boatLevel);
}

// --- 3. LOGIC NÂNG CẤP (Sửa lỗi nút này) ---
function buyBoatUpgrade() {
    const upgradeCost = boatLevel * 2000;
    if (boatLevel >= 14) {
        alert("Thuyền đã đạt cấp tối đa (Cấp 14)!");
        return;
    }
    if (coins >= upgradeCost) {
        coins -= upgradeCost;
        boatLevel++;
        updateDisplays();
        alert("Chúc mừng! Thuyền của bạn đã lên cấp " + boatLevel);
    } else {
        alert("Bạn còn thiếu " + (upgradeCost - coins).toLocaleString() + " Xu để nâng cấp!");
    }
}

// --- 4. CÁC HÀM KHÁC (Bán cá, Chuyển Tab, Đếm ngược) ---
function sellFishAction() {
    const toSell = Math.floor(fishCount);
    if (toSell < 1) return alert("Không có cá để bán!");
    coins += (toSell * 10);
    fishCount = 0;
    updateDisplays();
}

function switchTab(tabName) {
    document.querySelectorAll('.tab-page').forEach(p => p.classList.add('hidden'));
    const target = document.getElementById('page-' + tabName);
    if (target) target.classList.remove('hidden');
    updateDisplays();
}

function handleStartFishing() {
    if (isFishing) return;
    endTime = Date.now() + (3 * 60 * 60 * 1000);
    localStorage.setItem('fishing_endTime', endTime);
    startCountdown();
}

function startCountdown() {
    const btnText = document.getElementById('btn-text');
    const timerInterval = setInterval(() => {
        const timeLeft = endTime - Date.now();
        if (timeLeft <= 0) {
            clearInterval(timerInterval);
            isFishing = false;
            if(btnText) btnText.innerText = "🚢 Ra khơi";
            localStorage.removeItem('fishing_endTime');
        } else {
            isFishing = true;
            const h = Math.floor(timeLeft / 3600000).toString().padStart(2, '0');
            const m = Math.floor((timeLeft % 3600000) / 60000).toString().padStart(2, '0');
            const s = Math.floor((timeLeft % 60000) / 1000).toString().padStart(2, '0');
            if(btnText) btnText.innerText = `${h}:${m}:${s}`;
        }
    }, 1000);
}

// --- 5. VẬN HÀNH ---
setInterval(() => {
    fishCount += (baseSpeed + (boatLevel - 1) * 0.5);
    updateDisplays();
}, 1000);

if (endTime && endTime > Date.now()) startCountdown();
updateDisplays();
