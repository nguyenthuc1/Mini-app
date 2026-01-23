const BLOCK_ID = 'YOUR_BLOCK_ID'; 
let coins = parseInt(localStorage.getItem('fishing_coins')) || 0;
let fishCount = parseInt(localStorage.getItem('fishing_count')) || 0;
let endTime = localStorage.getItem('fishing_endTime') || 0;
let fishInterval;

const btnAction = document.getElementById('btn-action');
const fishDisplay = document.getElementById('fish-display');
const coinDisplay = document.getElementById('coin-display');

// Cập nhật số liệu khi mở app
coinDisplay.innerText = coins;
fishDisplay.innerText = fishCount;

const AdController = window.Adsgram ? window.Adsgram.init({ blockId: BLOCK_ID }) : null;

btnAction.addEventListener('click', () => {
    if (!AdController) return alert("Lỗi tải Adsgram!");
    AdController.show().then(() => {
        startFishing(10800); // Đánh cá trong 3 tiếng
    }).catch(() => {
        alert("Bạn cần xem hết quảng cáo!");
    });
});

function startFishing(duration) {
    endTime = Date.now() + (duration * 1000);
    localStorage.setItem('fishing_endTime', endTime);
    runLogic();
}

function runLogic() {
    if (fishInterval) clearInterval(fishInterval);
    fishInterval = setInterval(() => {
        const now = Date.now();
        const timeLeft = endTime - now;

        if (timeLeft <= 0) {
            stopFishing();
        } else {
            btnAction.disabled = true;
            document.getElementById('boat-area').style.opacity = "1";
            document.getElementById('boat').classList.add('boat-float');
            
            // Mỗi giây cộng 1 con cá
            fishCount += 1;
            fishDisplay.innerText = fishCount;
            localStorage.setItem('fishing_count', fishCount);

            // Hiển thị đếm ngược trên nút
            const h = Math.floor(timeLeft / 3600000);
            const m = Math.floor((timeLeft % 3600000) / 60000);
            const s = Math.floor((timeLeft % 60000) / 1000);
            btnAction.innerText = `⏳ ${h}:${m}:${s}`;
            
            spawnFish();
        }
    }, 1000);
}

// HÀM BÁN CÁ ĐỔI XU
function sellFish() {
    if (fishCount <= 0) return alert("Bạn không có cá để bán!");
    
    let giaCa = 5; // 1 con cá = 5 xu
    let xuNhanDuoc = fishCount * giaCa;
    
    coins += xuNhanDuoc;
    fishCount = 0; // Reset cá về 0
    
    // Lưu và hiển thị
    coinDisplay.innerText = coins;
    fishDisplay.innerText = fishCount;
    localStorage.setItem('fishing_coins', coins);
    localStorage.setItem('fishing_count', fishCount);
    
    alert(`Đã bán cá! Nhận được ${xuNhanDuoc} Xu.`);
}

function stopFishing() {
    clearInterval(fishInterval);
    btnAction.disabled = false;
    btnAction.innerText = "🚢 Ra khơi";
    document.getElementById('boat-area').style.opacity = "0.4";
    document.getElementById('boat').classList.remove('boat-float');
    localStorage.removeItem('fishing_endTime');
}

function spawnFish() {
    const container = document.getElementById('effect-layer');
    const fish = document.createElement('div');
    fish.className = 'fish-particle text-2xl';
    fish.innerHTML = '🐟';
    fish.style.left = '50%';
    fish.style.top = '60%';
    fish.style.setProperty('--tx', `${(Math.random() - 0.5) * 150}px`);
    container.appendChild(fish);
    setTimeout(() => fish.remove(), 1200);
}

window.onload = () => {
    if (endTime && endTime > Date.now()) runLogic();
};
// ... Giữ lại các biến coins, fishCount, endTime từ code cũ ...

// HÀM CHUYỂN ĐỔI TAB
function showTab(tabName) {
    // Ẩn tất cả các tab
    document.querySelectorAll('.tab-item').forEach(el => el.classList.add('hidden'));
    // Hiện tab được chọn
    document.getElementById('tab-' + tabName).classList.remove('hidden');
    
    // Cập nhật màu sắc menu (giả lập)
    document.getElementById('wallet-balance').innerText = coins;
}

// HÀM NÂNG CẤP (Ví dụ)
let fishingPower = 1; // Mặc định 1 cá/giây
function upgradeBoat() {
    let cost = 500;
    if (coins >= cost) {
        coins -= cost;
        fishingPower += 1; // Nâng cấp sức mạnh
        updateDisplays();
        alert("Chúc mừng! Thuyền của bạn đã mạnh hơn.");
    } else {
        alert("Bạn không đủ Xu để nâng cấp!");
    }
}

// Sửa lại hàm runLogic để dùng fishingPower
function runLogic() {
    if (fishInterval) clearInterval(fishInterval);
    fishInterval = setInterval(() => {
        const now = Date.now();
        const timeLeft = endTime - now;

        if (timeLeft <= 0) {
            stopFishing();
        } else {
            // Hiệu ứng và cộng cá dựa trên sức mạnh nâng cấp
            fishCount += fishingPower; 
            updateDisplays();
            spawnFish();
            // ... (code đếm ngược thời gian trên nút) ...
        }
    }, 1000);
}

function updateDisplays() {
    document.getElementById('coin-display').innerText = coins;
    document.getElementById('fish-display').innerText = fishCount;
    localStorage.setItem('fishing_coins', coins);
    localStorage.setItem('fishing_count', fishCount);
}
function switchTab(tabName) {
    // 1. Ẩn tất cả các trang
    const allPages = document.querySelectorAll('.tab-page');
    allPages.forEach(page => {
        page.classList.add('hidden');
    });

    // 2. Hiện trang được chọn dựa trên tabName
    const activePage = document.getElementById('page-' + tabName);
    if (activePage) {
        activePage.classList.remove('hidden');
    }

    // 3. Đổi màu nút menu để người dùng biết mình đang ở đâu
    const allButtons = document.querySelectorAll('.menu-btn');
    allButtons.forEach(btn => {
        btn.classList.replace('text-blue-400', 'text-gray-400');
    });

    // Cập nhật màu nút hiện tại (dùng event để xác định nút vừa bấm)
    if (event && event.currentTarget) {
        event.currentTarget.classList.replace('text-gray-400', 'text-blue-400');
    }
}
// Hàm chuyển Tab
function switchTab(tabName) {
    // 1. Ẩn tất cả các trang có class 'tab-page'
    const pages = document.querySelectorAll('.tab-page');
    pages.forEach(p => p.classList.add('hidden'));

    // 2. Hiện trang có id tương ứng (ví dụ: page-home, page-sell...)
    const target = document.getElementById('page-' + tabName);
    if (target) {
        target.classList.remove('hidden');
    }

    // 3. Cập nhật số liệu hiển thị khi vào từng tab cụ thể
    if (tabName === 'sell') {
        document.getElementById('sell-fish-count').innerText = fishCount;
    }
    if (tabName === 'wallet') {
        document.getElementById('wallet-balance').innerText = coins;
    }
}



// Hàm thực hiện hành động bán cá (khi bấm nút to trong trang bán cá)
function sellFishAction() {
    if (fishCount <= 0) {
        alert("Bạn không có cá để bán!");
        return;
    }

    const price = 10;
    const earned = fishCount * price;
    
    coins += earned;
    fishCount = 0;

    // Cập nhật tất cả các vị trí hiển thị
    updateDisplays();
    
    // Cập nhật riêng con số trên trang bán cá
    document.getElementById('sell-fish-count').innerText = "0";
    
    alert(`Chúc mừng! Bạn đã nhận được ${earned} Xu.`);
}
// 1. CÁC BIẾN QUẢN LÝ NÂNG CẤP
let boatLevel = parseInt(localStorage.getItem('boat_level')) || 1;
let baseSpeed = 0.5; // Tốc độ mặc định 0.5 cá/giây
let maxLevel = 14;

// 2. TỰ ĐỘNG CỘNG CÁ (0.5 cá/giây mặc định + cấp độ)
setInterval(() => {
    // Tốc độ = 0.5 + (Cấp - 1) * 0.5. Ví dụ cấp 1 = 0.5, cấp 2 = 1.0...
    let currentSpeed = baseSpeed + (boatLevel - 1) * 0.5;
    fishCount += currentSpeed;
    updateDisplays();
}, 1000);

// 3. HÀM NÂNG CẤP THUYỀN
function buyBoatUpgrade() {
    if (boatLevel >= maxLevel) return;

    // Công thức tính giá: Cấp 1 lên 2 là 2000, mỗi cấp sau tăng thêm 2000 hoặc gấp đôi tùy bạn
    let upgradeCost = boatLevel * 2000; 

    if (coins >= upgradeCost) {
        coins -= upgradeCost;
        boatLevel++;
        
        // Lưu dữ liệu
        localStorage.setItem('boat_level', boatLevel);
        localStorage.setItem('fishing_coins', coins);
        
        updateDisplays();
        alert(`Chúc mừng! Thuyền đã lên Cấp ${boatLevel}`);
    } else {
        alert(`Bạn cần ${upgradeCost.toLocaleString()} Xu để nâng cấp!`);
    }
}

// 4. CẬP NHẬT HIỂN THỊ TOÀN APP
function updateDisplays() {
    // Hiển thị ở Trang chủ
    if(document.getElementById('fish-display')) 
        document.getElementById('fish-display').innerText = Math.floor(fishCount).toLocaleString();
    if(document.getElementById('coin-display')) 
        document.getElementById('coin-display').innerText = Math.floor(coins).toLocaleString();
    
    // Hiển thị ở Trang Nâng cấp
    if(document.getElementById('boat-level')) 
        document.getElementById('boat-level').innerText = boatLevel;
    if(document.getElementById('boat-speed')) 
        document.getElementById('boat-speed').innerText = (baseSpeed + (boatLevel - 1) * 0.5).toFixed(1);
    
    let upgradeCost = boatLevel * 2000;
    if(document.getElementById('upgrade-cost')) 
        document.getElementById('upgrade-cost').innerText = upgradeCost.toLocaleString();

    // Xử lý khi đạt cấp Max
    if (boatLevel >= maxLevel) {
        if(document.getElementById('upgrade-info')) document.getElementById('upgrade-info').classList.add('hidden');
        if(document.getElementById('max-level-msg')) document.getElementById('max-level-msg').classList.remove('hidden');
    }
}


// Các biến khởi tạo
let fishCount = parseFloat(localStorage.getItem('fishing_count')) || 0;
let coins = parseInt(localStorage.getItem('fishing_coins')) || 0;
let boatLevel = parseInt(localStorage.getItem('boat_level')) || 1;
const baseSpeed = 0.5;

// Hàm tính tốc độ hiện tại dựa trên Level
function getCurrentSpeed() {
    return baseSpeed + (boatLevel - 1) * 0.5;
}

// Logic tự động cộng cá mỗi giây
setInterval(() => {
    fishCount += getCurrentSpeed();
    updateDisplays();
}, 1000);

// Hàm cập nhật hiển thị (Fix lỗi ID hiển thị trên trang chủ)
function updateDisplays() {
    // Cập nhật số cá (Làm tròn xuống để nhìn cho đẹp)
    if(document.getElementById('fish-display')) 
        document.getElementById('fish-display').innerText = Math.floor(fishCount).toLocaleString();
    
    // Cập nhật số xu
    if(document.getElementById('coin-display')) 
        document.getElementById('coin-display').innerText = coins.toLocaleString();
    
    // Cập nhật tốc độ đánh cá
    if(document.getElementById('speed-display')) 
        document.getElementById('speed-display').innerText = getCurrentSpeed().toFixed(1);

    // Lưu dữ liệu vào bộ nhớ
    localStorage.setItem('fishing_count', fishCount);
    localStorage.setItem('fishing_coins', coins);
}

// Gọi cập nhật ngay khi mở app
updateDisplays();

