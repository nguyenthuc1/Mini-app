// --- 1. KHỞI TẠO ---
const tg = window.Telegram.WebApp;
tg.ready();
const userId = tg.initDataUnsafe?.user?.id || "guest";

let coins = parseInt(localStorage.getItem('fishing_coins_' + userId)) || 0;
let fishCount = parseFloat(localStorage.getItem('fishing_count_' + userId)) || 0;
let boatLevel = parseInt(localStorage.getItem('boat_level_' + userId)) || 1;
let endTime = parseInt(localStorage.getItem('fishing_endTime_' + userId)) || 0;
const baseSpeed = 0.5;
let isFishing = true;

// --- 2. CẬP NHẬT GIAO DIỆN (ĐỒNG BỘ) ---
function updateDisplays() {
    const roundedFish = Math.floor(fishCount);
    const currentSpeed = baseSpeed + (boatLevel - 1) * 0.5;
    const bonusValue = (boatLevel - 1) * 0.5;

    // Cập nhật tất cả các ID
    const elements = {
        'fish-display': roundedFish.toLocaleString(),
        'sell-fish-count': roundedFish.toLocaleString(),
        'coin-display': coins.toLocaleString(),
        'wallet-balance': coins.toLocaleString(),
        'boat-level': boatLevel,
        'upgrade-cost': (boatLevel * 2000).toLocaleString(),
        'speed-display': currentSpeed.toFixed(1)
    };

    for (let id in elements) {
        const el = document.getElementById(id);
        if (el) el.innerText = elements[id];
    }

    // Hiển thị +0.5 khi nâng cấp
    const bonusTag = document.getElementById('speed-bonus');
    if (bonusTag) {
        if (bonusValue > 0) {
            bonusTag.innerText = `+${bonusValue.toFixed(1)}`;
            bonusTag.classList.remove('hidden');
        } else {
            bonusTag.classList.add('hidden');
        }
    }

    // Lưu dữ liệu
    localStorage.setItem('fishing_count_' + userId, fishCount);
    localStorage.setItem('fishing_coins_' + userId, coins);
    localStorage.setItem('boat_level_' + userId, boatLevel);
}

// --- 3. QUẢN LÝ MENU & RA KHƠI ---
window.switchTab = function(tabName) {
    // Ẩn tất cả các trang
    document.querySelectorAll('.tab-page').forEach(p => p.classList.add('hidden'));
    
    // Hiện trang được chọn dựa trên ID (Ví dụ: page-home, page-upgrade)
    const target = document.getElementById('page-' + tabName);
    if (target) {
        target.classList.remove('hidden');
    }
    updateDisplays(); // Cập nhật số liệu ngay khi chuyển trang
};

window.handleStartFishing = function() {
    if (isFishing) return; // Nếu đang câu thì không cho bấm lại
    
    // Thiết lập thời gian kết thúc (3 giờ)
    endTime = Date.now() + (3 * 60 * 60 * 1000); 
    
    // Lưu vào LocalStorage theo userId để không bị trùng dữ liệu
    localStorage.setItem('fishing_endTime_' + userId, endTime);
    
    isFishing = true;
    startCountdown(); // Gọi hàm bắt đầu đếm ngược
};

//------lập lại---------



    function startCountdown() {
    isFishing = true;
    const btnText = document.getElementById('btn-text');
    
    const timerInterval = setInterval(() => {
        const timeLeft = endTime - Date.now();
        
        if (timeLeft <= 0) {
            clearInterval(timerInterval);
            isFishing = false;
            if(btnText) btnText.innerText = "🚢 RA KHƠI";
            localStorage.removeItem('fishing_endTime_' + userId);
        } else {
            // --- THÊM LOGIC CỘNG CÁ VÀO ĐÂY ---
            const maxStorage = getMaxStorage(); // Lấy giới hạn kho
            if (fishCount < maxStorage) {
                // Tốc độ: Cơ bản 0.5 + (Cấp thuyền - 1) * 0.5
                fishCount += (0.5 + (boatLevel - 1) * 0.5); 
                updateDisplays(); // Ép màn hình hiển thị số cá mới
            }
            // ---------------------------------

            // Hiển thị đồng hồ (Giữ nguyên code của bạn)
            const h = Math.floor(timeLeft / 3600000).toString().padStart(2, '0');
            const m = Math.floor((timeLeft % 3600000) / 60000).toString().padStart(2, '0');
            const s = Math.floor((timeLeft % 60000) / 1000).toString().padStart(2, '0');
            if(btnText) btnText.innerText = `${h}:${m}:${s}`;
        }
    }, 1000);
}



// --- 4. BÁN CÁ & NÂNG CẤP (CÓ THÔNG BÁO) ---
function sellFishAction() {
    const toSell = Math.floor(fishCount);
    if (toSell < 1) return alert("Bạn không có đủ cá để bán!");
    
    const earned = toSell * 10;
    coins += earned;
    fishCount = 0;
    updateDisplays();
    alert(`💰 Bán thành công! Bạn nhận được ${earned.toLocaleString()} Xu từ ${toSell} cá.`);
}

function buyBoatUpgrade() {
    const cost = boatLevel * 2000;
    if (coins >= cost) {
        coins -= cost;
        boatLevel++;
        updateDisplays();
        alert(`🚀 Nâng cấp thành công lên Cấp ${boatLevel}! Tốc độ tăng thêm +0.5.`);
    } else {
        alert(`Thiếu ${(cost - coins).toLocaleString()} Xu để nâng cấp!`);
    }
}

function requestWithdraw() {
    alert("📤 Yêu cầu rút tiền đang được xử lý (Tối thiểu 50,000 Xu).");
}

// --- 5. VẬN HÀNH ---
setInterval(() => {
    if (isFishing) {
        fishCount += (baseSpeed + (boatLevel - 1) * 0.5);
        updateDisplays();
    }
}, 1000);

// Khôi phục trạng thái khi vào lại app
if (endTime > Date.now()) {
    isFishing = true;
    startCountdown();
}
updateDisplays();
// --- 6. VẬN HÀNH & OFFLINE MINING ---

// Hàm tính toán cá khi quay lại App
function calculateOfflineMining() {
    const now = Date.now();
    const lastUpdate = parseInt(localStorage.getItem('fishing_lastUpdate_' + userId)) || now;
    
    // Nếu đang trong trạng thái Ra khơi
    if (isFishing && endTime > lastUpdate) {
        // Chỉ tính thời gian từ lúc thoát đến lúc hết giờ (nếu đã hết) hoặc đến hiện tại
        const limit = Math.min(now, endTime);
        const secondsOffline = Math.floor((limit - lastUpdate) / 1000);
        
        if (secondsOffline > 0) {
            const currentSpeed = baseSpeed + (boatLevel - 1) * 0.5;
            const fishEarned = secondsOffline * currentSpeed;
            fishCount += fishEarned;
            
            // Thông báo cho người dùng
            alert(`🎣 Bạn đã đánh bắt được ${Math.floor(fishEarned).toLocaleString()} cá khi đang vắng mặt!`);
        }
    }
    // Cập nhật mốc thời gian mới nhất
    localStorage.setItem('fishing_lastUpdate_' + userId, now);
    updateDisplays();
}

// Chạy mỗi giây để cộng cá khi đang mở App
setInterval(() => {
    const now = Date.now();
    if (isFishing && now < endTime) {
        fishCount += (baseSpeed + (boatLevel - 1) * 0.5);
        localStorage.setItem('fishing_lastUpdate_' + userId, now);
        updateDisplays();
    } else if (isFishing && now >= endTime) {
        isFishing = false;
        document.getElementById('btn-text').innerText = "🚢 RA KHƠI";
        localStorage.removeItem('fishing_endTime_' + userId);
        updateDisplays();
    }
}, 1000);

// Khởi tạo khi vào App
if (endTime > Date.now()) {
    isFishing = true;
    startCountdown();
    calculateOfflineMining(); // Tính cá vắng mặt ngay khi vào app
} else {
    updateDisplays();
}
// --- 1. KHỞI TẠO (Thêm storageLevel) ---
let storageLevel = parseInt(localStorage.getItem('storage_level_' + userId)) || 1;

// Sức chứa kho: 2000 cá cơ bản + 3000 mỗi cấp độ nâng cấp
function getMaxStorage() {
    return 2000 + (storageLevel - 1) * 3000; 
}

// --- 2. CẬP NHẬT GIAO DIỆN ---
function updateDisplays() {
    const roundedFish = Math.floor(fishCount);
    const maxStorage = getMaxStorage();
    const storageCost = storageLevel * 5000;

    const elements = {
        'fish-display': roundedFish.toLocaleString(),
        'sell-fish-count': roundedFish.toLocaleString(),
        'coin-display': coins.toLocaleString(),
        'boat-level': boatLevel,
        'upgrade-cost': (boatLevel * 2000).toLocaleString(),
        'storage-level': storageLevel,
        'storage-upgrade-cost': storageCost.toLocaleString(),
        'max-storage-display': maxStorage.toLocaleString(),
        'max-storage-display-up': maxStorage.toLocaleString(),
        'storage-display': roundedFish.toLocaleString()
    };

    for (let id in elements) {
        const el = document.getElementById(id);
        if (el) el.innerText = elements[id];
    }

    // Lưu dữ liệu
    localStorage.setItem('fishing_count_' + userId, fishCount);
    localStorage.setItem('fishing_coins_' + userId, coins);
    localStorage.setItem('boat_level_' + userId, boatLevel);
    localStorage.setItem('storage_level_' + userId, storageLevel);
}

// --- 3. LOGIC NÂNG CẤP KHO ---
window.buyStorageUpgrade = function() {
    const cost = storageLevel * 5000;
    if (coins >= cost) {
        coins -= cost;
        storageLevel++;
        updateDisplays();
        alert(`📦 Mở rộng kho thành công! Sức chứa mới: ${getMaxStorage().toLocaleString()} cá.`);
    } else {
        alert(`Bạn cần thêm ${(cost - coins).toLocaleString()} Xu để mở rộng kho!`);
    }
};

// Đảm bảo nút Bán cá và Nâng cấp thuyền vẫn hoạt động
window.buyBoatUpgrade = function() {
    const cost = boatLevel * 2000;
    if (coins >= cost) {
        coins -= cost;
        boatLevel++;
        updateDisplays();
        alert(`🚀 Nâng cấp thuyền thành công lên Cấp ${boatLevel}!`);
    } else alert("Thiếu xu!");
};
setInterval(() => {
    const now = Date.now();
    const maxStorage = getMaxStorage(); // Lấy sức chứa kho hiện tại
    
    if (isFishing && now < endTime) {
        if (fishCount < maxStorage) {
            // Tốc độ câu = Cơ bản (0.5) + (Cấp thuyền - 1) * 0.5
            const speed = baseSpeed + (boatLevel - 1) * 0.5;
            fishCount += speed;
            
            // Cập nhật mốc thời gian cuối cùng để tính cá offline sau này
            localStorage.setItem('fishing_lastUpdate_' + userId, now);
            
            updateDisplays(); // Cập nhật số liệu lên màn hình
        }
    }
}, 1000);
