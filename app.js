// 1. Khởi tạo biến từ bộ nhớ (Duy nhất 1 lần)
let coins = parseInt(localStorage.getItem('fishing_coins')) || 0;
let fishCount = parseFloat(localStorage.getItem('fishing_count')) || 0;
let boatLevel = parseInt(localStorage.getItem('boat_level')) || 1;
let endTime = localStorage.getItem('fishing_endTime') || 0;
const baseSpeed = 0.5;
let fishInterval;

// 2. Hàm tính tốc độ hiện tại
function getCurrentSpeed() {
    return baseSpeed + (boatLevel - 1) * 0.5;
}

// 3. Hàm chuyển Tab (Đã sửa lỗi để chạy mượt)
function switchTab(tabName) {
    // Ẩn tất cả các trang có class tab-page
    const pages = document.querySelectorAll('.tab-page');
    pages.forEach(page => page.classList.add('hidden'));

    // Hiển thị trang được chọn
    const targetPage = document.getElementById('page-' + tabName);
    if (targetPage) {
        targetPage.classList.remove('hidden');
    }

    // Cập nhật dữ liệu cho tab cụ thể
    if (tabName === 'sell') document.getElementById('sell-fish-count').innerText = Math.floor(fishCount);
    if (tabName === 'wallet') document.getElementById('wallet-balance').innerText = coins;
    
    updateDisplays();
}

// 4. Cập nhật hiển thị toàn app
function updateDisplays() {
    if(document.getElementById('fish-display')) document.getElementById('fish-display').innerText = Math.floor(fishCount).toLocaleString();
    if(document.getElementById('coin-display')) document.getElementById('coin-display').innerText = coins.toLocaleString();
    if(document.getElementById('speed-display')) document.getElementById('speed-display').innerText = getCurrentSpeed().toFixed(1);
    
    localStorage.setItem('fishing_count', fishCount);
    localStorage.setItem('fishing_coins', coins);
}

// 5. Tự động cộng cá mỗi giây
setInterval(() => {
    fishCount += getCurrentSpeed();
    updateDisplays();
}, 1000);

// Khởi chạy cập nhật khi mở app
updateDisplays();
