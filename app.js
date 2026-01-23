// --- 1. KHỞI TẠO BIẾN (Duy nhất 1 lần) ---
let coins = parseInt(localStorage.getItem('fishing_coins')) || 0;
let fishCount = parseFloat(localStorage.getItem('fishing_count')) || 0;
let boatLevel = parseInt(localStorage.getItem('boat_level')) || 1;
let endTime = localStorage.getItem('fishing_endTime') || 0;
const baseSpeed = 0.5;
let isFishing = false;

// --- 2. HÀM BÁN CÁ (Nằm ở đây) ---
function sellFishAction() {
    const roundedFish = Math.floor(fishCount);
    if (roundedFish < 1) {
        alert("Bạn không có đủ cá để bán!");
        return;
    }

    const money = roundedFish * 10; // Giá 10 xu/cá
    coins += money;
    fishCount = 0; // Bán xong thì cá về 0
    
    updateDisplays();
    alert(`Đã bán ${roundedFish} cá, nhận được ${money} Xu!`);
}

// --- 3. ĐỒNG HỒ 3 TIẾNG ---
function handleStartFishing() {
    if (isFishing) return;
    endTime = Date.now() + (3 * 60 * 60 * 1000); // 3 tiếng
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

// --- 4. CẬP NHẬT ĐỒNG BỘ TẤT CẢ TAB ---
function updateDisplays() {
    const roundedFish = Math.floor(fishCount);
    const formattedCoins = coins.toLocaleString();

    // Cập nhật mọi ID có trên các tab
    if(document.getElementById('fish-display')) document.getElementById('fish-display').innerText = roundedFish;
    if(document.getElementById('sell-fish-count')) document.getElementById('sell-fish-count').innerText = roundedFish;
    if(document.getElementById('coin-display')) document.getElementById('coin-display').innerText = formattedCoins;
    if(document.getElementById('wallet-balance')) document.getElementById('wallet-balance').innerText = formattedCoins;
    if(document.getElementById('speed-display')) document.getElementById('speed-display').innerText = (baseSpeed + (boatLevel-1)*0.5).toFixed(1);

    localStorage.setItem('fishing_count', fishCount);
    localStorage.setItem('fishing_coins', coins);
}

// --- 5. CHUYỂN TAB ---
function switchTab(tabName) {
    document.querySelectorAll('.tab-page').forEach(p => p.classList.add('hidden'));
    const target = document.getElementById('page-' + tabName);
    if (target) target.classList.remove('hidden');
    updateDisplays();
}

// --- 6. KHỞI CHẠY ---
setInterval(() => {
    fishCount += (baseSpeed + (boatLevel - 1) * 0.5);
    updateDisplays();
}, 1000);

if (endTime && endTime > Date.now()) startCountdown();
updateDisplays();
