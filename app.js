// Khởi tạo biến lưu trữ dữ liệu
let fish = 0;
let coins = 0;
let miningSpeed = 0.5;
let isMining = false; // Trạng thái kiểm tra xem đã xem quảng cáo chưa

const fishDisplay = document.getElementById('fish-count');
const coinDisplay = document.getElementById('coin-balance');
const speedDisplay = document.getElementById('mining-speed');
const btnMine = document.getElementById('btn-mine');

// 1. Hàm giả lập xem quảng cáo
function startAds() {
    if (isMining) return; // Nếu đang đào rồi thì thôi

    // Đổi trạng thái nút sang đang xem quảng cáo
    btnMine.disabled = true;
    btnMine.innerHTML = `<span class="loading-spinner"></span> ĐANG XEM QUẢNG CÁO...`;

    // Giả lập quảng cáo chạy trong 3 giây (3000ms)
    setTimeout(() => {
        isMining = true;
        btnMine.innerHTML = "ĐANG ĐÀO...";
        btnMine.classList.remove('bg-blue-600');
        btnMine.classList.add('bg-green-600');
        
        alert("Xem quảng cáo hoàn tất! Cá bắt đầu được đào.");
        
        // Bắt đầu vòng lặp cộng cá
        startMiningLoop();
    }, 3000);
}

// 2. Logic Đào cá (Chỉ chạy khi isMining = true)
function startMiningLoop() {
    setInterval(() => {
        if (isMining) {
            fish += miningSpeed;
            fishDisplay.innerText = Math.floor(fish);
        }
    }, 1000);
}

// 3. Logic Bán Cá (Giữ nguyên hoặc chỉnh sửa tùy ý)
function handleSell() {
    if (fish >= 1) {
        let earnedCoins = Math.floor(fish) * 2;
        coins += earnedCoins;
        fish = 0;
        updateUI();
    } else {
        alert("Không đủ cá để bán!");
    }
}

// 4. Logic Nâng cấp
function handleUpgrade() {
    const upgradeCost = 50;
    if (coins >= upgradeCost) {
        coins -= upgradeCost;
        miningSpeed += 0.5;
        updateUI();
        alert("Nâng cấp thành công!");
    } else {
        alert("Bạn cần 50 xu!");
    }
}

function updateUI() {
    fishDisplay.innerText = Math.floor(fish);
    coinDisplay.innerText = coins;
    speedDisplay.innerText = `${miningSpeed.toFixed(1)} cá/s`;
}

// Logic chuyển tab (Giữ nguyên như cũ)
function switchTab(tabName) {
    const tabs = document.querySelectorAll('.tab-content');
    tabs.forEach(tab => tab.classList.add('hidden'));
    document.getElementById(`tab-${tabName}`).classList.remove('hidden');

    const navItems = document.querySelectorAll('.nav-item');
    navItems.forEach(item => {
        item.classList.remove('text-blue-400');
        item.classList.add('text-gray-500');
    });
    document.getElementById(`nav-${tabName}`).classList.remove('text-gray-500');
    document.getElementById(`nav-${tabName}`).classList.add('text-blue-400');
}
