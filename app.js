// Khởi tạo biến lưu trữ dữ liệu
let fish = 0;
let coins = 0;
let miningSpeed = 0.5;

// DOM Elements
const fishDisplay = document.getElementById('fish-count');
const coinDisplay = document.getElementById('coin-balance');
const speedDisplay = document.getElementById('mining-speed');

// 1. Logic Đào cá tự động (Mining)
setInterval(() => {
    fish += miningSpeed;
    fishDisplay.innerText = Math.floor(fish);
}, 1000);

// 2. Logic Bán Cá (Sell)
function handleSell() {
    if (fish >= 1) {
        let earnedCoins = Math.floor(fish) * 2; // Ví dụ: 1 cá = 2 xu
        coins += earnedCoins;
        fish = 0;
        
        updateUI();
        alert(`Bạn đã bán cá và nhận được ${earnedCoins} 💰`);
    } else {
        alert("Không đủ cá để bán!");
    }
}

// 3. Logic Nâng cấp (Upgrade)
function handleUpgrade() {
    const upgradeCost = 50; // Giá nâng cấp cố định
    if (coins >= upgradeCost) {
        coins -= upgradeCost;
        miningSpeed += 0.5;
        
        updateUI();
        alert("Nâng cấp thành công! Tốc độ đào đã tăng.");
    } else {
        alert(`Bạn cần ${upgradeCost} xu để nâng cấp!`);
    }
}

function updateUI() {
    fishDisplay.innerText = Math.floor(fish);
    coinDisplay.innerText = coins;
    speedDisplay.innerText = `${miningSpeed.toFixed(1)} cá/s`;
}

// 4. Logic Chuyển Tab
function switchTab(tabName) {
    // Ẩn tất cả các tab
    const tabs = document.querySelectorAll('.tab-content');
    tabs.forEach(tab => tab.classList.add('hidden'));

    // Hiện tab được chọn
    document.getElementById(`tab-${tabName}`).classList.remove('hidden');

    // Cập nhật màu sắc menu dưới
    const navItems = document.querySelectorAll('.nav-item');
    navItems.forEach(item => {
        item.classList.remove('text-blue-400');
        item.classList.add('text-gray-500');
    });

    document.getElementById(`nav-${tabName}`).classList.remove('text-gray-500');
    document.getElementById(`nav-${tabName}`).classList.add('text-blue-400');
}
