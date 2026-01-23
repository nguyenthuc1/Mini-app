// --- 1. KHỞI TẠO BIẾN ---
let coins = parseInt(localStorage.getItem('fishing_coins')) || 0;
let fishCount = parseFloat(localStorage.getItem('fishing_count')) || 0;
let boatLevel = parseInt(localStorage.getItem('boat_level')) || 1;
let endTime = localStorage.getItem('fishing_endTime') || 0;
const baseSpeed = 0.5;
let isFishing = false;

// --- 2. HÀM CẬP NHẬT HIỂN THỊ (Đồng bộ tất cả tab) ---
function updateDisplays() {
    const roundedFish = Math.floor(fishCount);
    const upgradeCost = boatLevel * 2000;
    const currentSpeed = baseSpeed + (boatLevel - 1) * 0.5;

    // Cập nhật số cá
    if(document.getElementById('fish-display')) document.getElementById('fish-display').innerText = roundedFish.toLocaleString();
    if(document.getElementById('sell-fish-count')) document.getElementById('sell-fish-count').innerText = roundedFish.toLocaleString();
    
    // Cập nhật số xu
    if(document.getElementById('coin-display')) document.getElementById('coin-display').innerText = coins.toLocaleString();
    if(document.getElementById('wallet-balance')) document.getElementById('wallet-balance').innerText = coins.toLocaleString();
    
    // Cập nhật thông số nâng cấp
    if(document.getElementById('boat-level')) document.getElementById('boat-level').innerText = boatLevel;
    if(document.getElementById('upgrade-cost')) document.getElementById('upgrade-cost').innerText = upgradeCost.toLocaleString();
    if(document.getElementById('speed-display')) document.getElementById('speed-display').innerText = currentSpeed.toFixed(1);

    // Lưu bộ nhớ
    localStorage.setItem('fishing_count', fishCount);
    localStorage.setItem('fishing_coins', coins);
    localStorage.setItem('boat_level', boatLevel);
}

// --- 3. HÀM CHUYỂN TAB (Fix lỗi không bấm được) ---
function switchTab(tabName) {
    // Ẩn tất cả các trang
    const pages = document.querySelectorAll('.tab-page');
    pages.forEach(p => p.classList.add('hidden'));

    // Hiện trang được chọn
    const target = document.getElementById('page-' + tabName);
    if (target) {
        target.classList.remove('hidden');
    }
    updateDisplays();
}

// --- 4. HÀM NÂNG CẤP & BÁN CÁ ---
function buyBoatUpgrade() {
    let cost = boatLevel * 2000;
    if (boatLevel >= 14) return alert("Thuyền đã đạt cấp tối đa!");
    
    if (coins >= cost) {
        coins -= cost;
        boatLevel++;
        updateDisplays();
        alert("Nâng cấp thành công lên cấp " + boatLevel);
    } else {
        alert("Bạn cần thêm " + (cost - coins).toLocaleString() + " xu!");
    }
}

function sellFishAction() {
    let toSell = Math.floor(fishCount);
    if (toSell < 1) return alert("Không có cá để bán!");
    coins += (toSell * 10);
    fishCount = 0;
    updateDisplays();
    alert("Đã bán cá thành công!");
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
