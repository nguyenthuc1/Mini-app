// --- 1. NHẬN DIỆN USER (Chống trùng dữ liệu theo yêu cầu của bạn) ---
const tg = window.Telegram.WebApp;
tg.ready();
const userId = tg.initDataUnsafe?.user?.id || "guest";

// --- 2. KHỞI TẠO DỮ LIỆU ---
let coins = parseInt(localStorage.getItem('fishing_coins_' + userId)) || 0;
let fishCount = parseFloat(localStorage.getItem('fishing_count_' + userId)) || 0;
let boatLevel = parseInt(localStorage.getItem('boat_level_' + userId)) || 1;
let endTime = localStorage.getItem('fishing_endTime_' + userId) || 0;
const baseSpeed = 0.5; 
let isFishing = false;

// --- 3. HÀM CHUYỂN PAGE (Quan trọng nhất để hiển thị UI) ---
function switchTab(tabName) {
    // Ẩn tất cả các page
    document.querySelectorAll('.tab-page').forEach(p => p.classList.add('hidden'));
    
    // Hiện page được chọn
    const target = document.getElementById('page-' + tabName);
    if (target) {
        target.classList.remove('hidden');
    }
    updateDisplays();
}

// --- 4. CẬP NHẬT GIAO DIỆN & HIỂN THỊ CỘNG THÊM ---
function updateDisplays() {
    const currentSpeed = baseSpeed + (boatLevel - 1) * 0.5;
    const cost = boatLevel * 2000;

    // Hiển thị tốc độ
    const speedEl = document.getElementById('speed-display');
    if(speedEl) speedEl.innerText = currentSpeed.toFixed(1);

    // Hiển thị +0.5 khi nâng cấp
    const bonusTag = document.getElementById('speed-bonus');
    if (bonusTag) {
        if (boatLevel > 1) {
            bonusTag.classList.remove('hidden');
            bonusTag.innerText = `+${((boatLevel - 1) * 0.5).toFixed(1)}`;
        } else {
            bonusTag.classList.add('hidden');
        }
    }

    // Các thông số khác
    if(document.getElementById('fish-display')) document.getElementById('fish-display').innerText = Math.floor(fishCount).toLocaleString();
    if(document.getElementById('coin-display')) document.getElementById('coin-display').innerText = coins.toLocaleString();
    if(document.getElementById('boat-level')) document.getElementById('boat-level').innerText = boatLevel;
    if(document.getElementById('upgrade-cost')) document.getElementById('upgrade-cost').innerText = cost.toLocaleString();

    // Lưu dữ liệu theo ID User
    localStorage.setItem('fishing_count_' + userId, fishCount);
    localStorage.setItem('fishing_coins_' + userId, coins);
    localStorage.setItem('boat_level_' + userId, boatLevel);
}

// --- 5. LOGIC GAME (Bán cá, Nâng cấp) ---
function sellFishAction() {
    const toSell = Math.floor(fishCount);
    if (toSell < 1) return alert("Không có cá!");
    const earned = toSell * 10;
    coins += earned;
    fishCount = 0;
    updateDisplays();
    alert(`💰 Bạn đã bán ${toSell} cá và nhận được ${earned.toLocaleString()} Xu!`);
}

function buyBoatUpgrade() {
    const cost = boatLevel * 2000;
    if (coins >= cost) {
        coins -= cost;
        boatLevel++;
        updateDisplays();
        alert(`🚀 Nâng cấp thành công lên Cấp ${boatLevel}! Tốc độ tăng thêm 0.5`);
    } else {
        alert("Bạn không đủ xu để nâng cấp!");
    }
}

// Khởi chạy
updateDisplays();
