// --- 1. KHỞI TẠO DỮ LIỆU ---
let coins = parseInt(localStorage.getItem('fishing_coins')) || 0;
let fishCount = parseFloat(localStorage.getItem('fishing_count')) || 0;
let boatLevel = parseInt(localStorage.getItem('boat_level')) || 1;
let endTime = localStorage.getItem('fishing_endTime') || 0;
const baseSpeed = 0.5;
let isFishing = false;

// --- 2. CẬP NHẬT GIAO DIỆN (Đồng bộ tất cả) ---
function updateDisplays() {
    const roundedFish = Math.floor(fishCount);
    const upgradeCost = boatLevel * 2000;
    const currentSpeed = baseSpeed + (boatLevel - 1) * 0.5;

    // Cập nhật số cá
    const fishIds = ['fish-display', 'sell-fish-count'];
    fishIds.forEach(id => {
        let el = document.getElementById(id);
        if(el) el.innerText = roundedFish.toLocaleString();
    });

    // Cập nhật số xu
    const coinIds = ['coin-display', 'wallet-balance'];
    coinIds.forEach(id => {
        let el = document.getElementById(id);
        if(el) el.innerText = coins.toLocaleString();
    });

    // Cập nhật thông số thuyền
    if(document.getElementById('boat-level')) document.getElementById('boat-level').innerText = boatLevel;
    if(document.getElementById('upgrade-cost')) document.getElementById('upgrade-cost').innerText = upgradeCost.toLocaleString();
    if(document.getElementById('speed-display')) document.getElementById('speed-display').innerText = currentSpeed.toFixed(1);

    // Lưu bộ nhớ
    localStorage.setItem('fishing_count', fishCount);
    localStorage.setItem('fishing_coins', coins);
    localStorage.setItem('boat_level', boatLevel);
}

// --- 3. LOGIC NÂNG CẤP (Fix lỗi bấm không ăn) ---
function buyBoatUpgrade() {
    let cost = boatLevel * 2000;
    if (boatLevel >= 14) return alert("Thuyền đã đạt cấp tối đa!");
    
    if (coins >= cost) {
        coins -= cost;
        boatLevel++;
        updateDisplays();
        alert("Nâng cấp thành công! Cấp hiện tại: " + boatLevel);
    } else {
        alert("Bạn còn thiếu " + (cost - coins).toLocaleString() + " xu!");
    }
}

// --- 4. BÁN CÁ & CHUYỂN TAB ---
function sellFishAction() {
    let toSell = Math.floor(fishCount);
    if (toSell < 1) return alert("Không có cá để bán!");
    coins += (toSell * 10);
    fishCount = 0;
    updateDisplays();
}

function switchTab(tabName) {
    document.querySelectorAll('.tab-page').forEach(p => p.classList.add('hidden'));
    let target = document.getElementById('page-' + tabName);
    if (target) target.classList.remove('hidden');
    updateDisplays();
}

// --- 5. LOGIC ĐẾM NGƯỢC 3 TIẾNG ---
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

// --- 6. VẬN HÀNH ---
setInterval(() => {
    fishCount += (baseSpeed + (boatLevel - 1) * 0.5);
    updateDisplays();
}, 1000);

if (endTime && endTime > Date.now()) startCountdown();
updateDisplays();
