// 1. Khai báo biến (Duy nhất 1 lần)
const BLOCK_ID = 'YOUR_BLOCK_ID'; 
let coins = parseInt(localStorage.getItem('fishing_coins')) || 0;
let fishCount = parseFloat(localStorage.getItem('fishing_count')) || 0;
let boatLevel = parseInt(localStorage.getItem('boat_level')) || 1;
let endTime = localStorage.getItem('fishing_endTime') || 0;
const baseSpeed = 0.5;
let fishInterval;

// 2. Hàm chuyển Tab (Quan trọng nhất)
function switchTab(tabName) {
    // Ẩn tất cả trang
    const pages = document.querySelectorAll('.tab-page');
    pages.forEach(p => p.classList.add('hidden'));

    // Hiện trang được chọn
    const target = document.getElementById('page-' + tabName);
    if (target) {
        target.classList.remove('hidden');
    }

    // Cập nhật số liệu hiển thị cho tab vừa mở
    if (tabName === 'sell') document.getElementById('sell-fish-count').innerText = Math.floor(fishCount);
    if (tabName === 'wallet') document.getElementById('wallet-balance').innerText = coins;
}

// 3. Hàm tính tốc độ và cập nhật hiển thị
function getCurrentSpeed() {
    return baseSpeed + (boatLevel - 1) * 0.5;
}

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

// 4. Logic nâng cấp thuyền
function buyBoatUpgrade() {
    let upgradeCost = boatLevel * 2000;
    if (coins >= upgradeCost && boatLevel < 14) {
        coins -= upgradeCost;
        boatLevel++;
        localStorage.setItem('boat_level', boatLevel);
        updateDisplays();
        alert("Nâng cấp thành công!");
    } else if(boatLevel >= 14) {
        alert("Thuyền đã đạt cấp tối đa!");
    } else {
        alert("Không đủ tiền!");
    }
}

// 5. Chạy tự động
setInterval(() => {
    fishCount += getCurrentSpeed();
    updateDisplays();
}, 1000);

// Khởi tạo app
updateDisplays();
