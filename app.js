// --- 1. KHỞI TẠO BIẾN ---
let coins = parseInt(localStorage.getItem('fishing_coins')) || 0;
let fishCount = parseFloat(localStorage.getItem('fishing_count')) || 0;
let boatLevel = parseInt(localStorage.getItem('boat_level')) || 1;
let endTime = localStorage.getItem('fishing_endTime') || 0;
const baseSpeed = 0.5;
let isFishing = false;

// --- 2. LOGIC ĐỒNG HỒ ĐẾM NGƯỢC (3 TIẾNG) ---
function handleStartFishing() {
    if (isFishing) return; 

    // Thiết lập 3 tiếng kể từ bây giờ
    const duration = 3 * 60 * 60 * 1000; 
    endTime = Date.now() + duration;
    
    localStorage.setItem('fishing_endTime', endTime);
    startCountdown();
}

function startCountdown() {
    const btnText = document.getElementById('btn-text');
    const btnAction = document.getElementById('btn-action');

    const timerInterval = setInterval(() => {
        const now = Date.now();
        const timeLeft = endTime - now;

        if (timeLeft <= 0) {
            clearInterval(timerInterval);
            isFishing = false;
            if(btnText) btnText.innerText = "🚢 Ra khơi";
            if(btnAction) btnAction.classList.remove('opacity-50', 'cursor-not-allowed');
            localStorage.removeItem('fishing_endTime');
        } else {
            isFishing = true;
            if(btnAction) btnAction.classList.add('opacity-50', 'cursor-not-allowed');

            const hours = Math.floor((timeLeft / (1000 * 60 * 60)) % 24);
            const minutes = Math.floor((timeLeft / 1000 / 60) % 60);
            const seconds = Math.floor((timeLeft / 1000) % 60);

            const hDisplay = hours < 10 ? "0" + hours : hours;
            const mDisplay = minutes < 10 ? "0" + minutes : minutes;
            const sDisplay = seconds < 10 ? "0" + seconds : seconds;

            if(btnText) btnText.innerText = `${hDisplay}:${mDisplay}:${sDisplay}`;
        }
    }, 1000);
}

// --- 3. CÁC HÀM CƠ BẢN (TAB, UPGRADE, DISPLAY) ---
function switchTab(tabName) {
    const pages = document.querySelectorAll('.tab-page');
    pages.forEach(p => p.classList.add('hidden'));

    const target = document.getElementById('page-' + tabName);
    if (target) {
        target.classList.remove('hidden');
    }
    
    // Gọi update ngay lập tức để màn hình mới có số liệu mới nhất
    updateDisplays();
}


function getCurrentSpeed() {
    return baseSpeed + (boatLevel - 1) * 0.5;
}


   function updateDisplays() {
    const roundedFish = Math.floor(fishCount);

    // 1. Đồng bộ số cá lên TẤT CẢ các tab (Home và Sell)
    if(document.getElementById('fish-display')) {
        document.getElementById('fish-display').innerText = roundedFish.toLocaleString();
    }
    if(document.getElementById('sell-fish-count')) {
        document.getElementById('sell-fish-count').innerText = roundedFish.toLocaleString();
    }
    
    // 2. Đồng bộ số xu lên Home và Wallet
    const formattedCoins = coins.toLocaleString();
    if(document.getElementById('coin-display')) {
        document.getElementById('coin-display').innerText = formattedCoins;
    }
    if(document.getElementById('wallet-balance')) {
        document.getElementById('wallet-balance').innerText = formattedCoins;
    }

    // 3. Cập nhật tốc độ và cấp độ
    if(document.getElementById('speed-display')) {
        document.getElementById('speed-display').innerText = getCurrentSpeed().toFixed(1);
    }
    if(document.getElementById('boat-level')) {
        document.getElementById('boat-level').innerText = boatLevel;
    }

    // Lưu dữ liệu vào bộ nhớ
    localStorage.setItem('fishing_count', fishCount);
    localStorage.setItem('fishing_coins', coins);
}



// --- 4. CHẠY KHI MỞ APP ---
setInterval(() => {
    fishCount += getCurrentSpeed();
    updateDisplays();
}, 1000);

// Kiểm tra nếu đang ra khơi dở
if (endTime && endTime > Date.now()) {
    startCountdown();
}

updateDisplays();
