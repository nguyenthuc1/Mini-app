// --- 1. KHỞI TẠO BIẾN (Chỉ khai báo 1 lần duy nhất) ---
const BLOCK_ID = 'YOUR_BLOCK_ID'; 
let coins = parseInt(localStorage.getItem('fishing_coins')) || 0;
let fishCount = parseFloat(localStorage.getItem('fishing_count')) || 0;
let boatLevel = parseInt(localStorage.getItem('boat_level')) || 1;
let endTime = localStorage.getItem('fishing_endTime') || 0;
const baseSpeed = 0.5;
let fishInterval;

// --- 2. HÀM CHUYỂN TAB (Sửa lỗi không bấm được) ---
function switchTab(tabName) {
    console.log("Đang chuyển sang tab:", tabName); // Để kiểm tra trong Console
    
    // Ẩn tất cả các trang
    const pages = document.querySelectorAll('.tab-page');
    pages.forEach(p => p.classList.add('hidden'));

    // Hiện trang được chọn
    const target = document.getElementById('page-' + tabName);
    if (target) {
        target.classList.remove('hidden');
    }

    // Cập nhật dữ liệu riêng cho từng trang khi mở
    if (tabName === 'sell') document.getElementById('sell-fish-count').innerText = Math.floor(fishCount);
    if (tabName === 'wallet') document.getElementById('wallet-balance').innerText = coins;
    
    updateDisplays();
}

// --- 3. LOGIC NÂNG CẤP & BÁN CÁ ---
function getCurrentSpeed() {
    return baseSpeed + (boatLevel - 1) * 0.5;
}

function buyBoatUpgrade() {
    let upgradeCost = boatLevel * 2000;
    if (coins >= upgradeCost && boatLevel < 14) {
        coins -= upgradeCost;
        boatLevel++;
        localStorage.setItem('boat_level', boatLevel);
        updateDisplays();
        alert("Nâng cấp thuyền lên cấp " + boatLevel + " thành công!");
    } else if (boatLevel >= 14) {
        alert("Thuyền đã đạt cấp tối đa!");
    } else {
        alert("Bạn cần " + upgradeCost + " Xu để nâng cấp!");
    }
}

function sellFishAction() {
    if (fishCount < 1) return alert("Bạn không có đủ cá để bán!");
    let money = Math.floor(fishCount) * 10;
    coins += money;
    fishCount = 0;
    updateDisplays();
    document.getElementById('sell-fish-count').innerText = "0";
    alert("Đã bán cá và nhận được " + money + " Xu!");
}

// --- 4. CẬP NHẬT HIỂN THỊ ---
function updateDisplays() {
    if(document.getElementById('fish-display')) document.getElementById('fish-display').innerText = Math.floor(fishCount).toLocaleString();
    if(document.getElementById('coin-display')) document.getElementById('coin-display').innerText = coins.toLocaleString();
    if(document.getElementById('speed-display')) document.getElementById('speed-display').innerText = getCurrentSpeed().toFixed(1);
    if(document.getElementById('boat-level')) document.getElementById('boat-level').innerText = boatLevel;
    
    let upgradeCost = boatLevel * 2000;
    if(document.getElementById('upgrade-cost')) document.getElementById('upgrade-cost').innerText = upgradeCost.toLocaleString();

    localStorage.setItem('fishing_count', fishCount);
    localStorage.setItem('fishing_coins', coins);
}

// --- 5. TỰ ĐỘNG CHẠY ---
setInterval(() => {
    fishCount += getCurrentSpeed();
    updateDisplays();
}, 1000);

// Khởi tạo hiển thị lần đầu
updateDisplays();
