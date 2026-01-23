// --- 1. KHỞI TẠO DỮ LIỆU ---
let coins = parseInt(localStorage.getItem('fishing_coins')) || 0;
let fishCount = parseFloat(localStorage.getItem('fishing_count')) || 0;
let boatLevel = parseInt(localStorage.getItem('boat_level')) || 1;
let endTime = localStorage.getItem('fishing_endTime') || 0;
const baseSpeed = 0.5;
let isFishing = false;

// --- 2. CẤU HÌNH ADSGRAM (An toàn) ---
// Thay 'YOUR_BLOCK_ID' bằng ID thật từ Adsgram.ai nếu có
const blockId = "YOUR_BLOCK_ID"; 

async function showAdBeforeAction(successCallback) {
    // Kiểm tra xem SDK Adsgram đã tải xong chưa
    if (window.Adsgram && blockId !== "YOUR_BLOCK_ID") {
        try {
            const AdController = window.Adsgram.init({ blockId: blockId });
            const result = await AdController.show();
            if (result.done) {
                successCallback();
            } else {
                alert("Bạn cần xem hết quảng cáo!");
            }
        } catch (error) {
            console.log("Adsgram chưa sẵn sàng hoặc lỗi, bỏ qua quảng cáo.");
            successCallback(); // Vẫn cho chạy game nếu lỗi quảng cáo
        }
    } else {
        // Nếu chưa cấu hình Ads hoặc SDK chưa tải, cho chạy thẳng vào game
        successCallback();
    }
}

// --- 3. CÁC HÀM CẬP NHẬT GIAO DIỆN ---
function updateDisplays() {
    const roundedFish = Math.floor(fishCount);
    const cost = boatLevel * 2000;
    const speed = baseSpeed + (boatLevel - 1) * 0.5;

    if(document.getElementById('fish-display')) document.getElementById('fish-display').innerText = roundedFish.toLocaleString();
    if(document.getElementById('sell-fish-count')) document.getElementById('sell-fish-count').innerText = roundedFish.toLocaleString();
    if(document.getElementById('coin-display')) document.getElementById('coin-display').innerText = coins.toLocaleString();
    if(document.getElementById('wallet-balance')) document.getElementById('wallet-balance').innerText = coins.toLocaleString();
    if(document.getElementById('boat-level')) document.getElementById('boat-level').innerText = boatLevel;
    if(document.getElementById('upgrade-cost')) document.getElementById('upgrade-cost').innerText = cost.toLocaleString();
    if(document.getElementById('speed-display')) document.getElementById('speed-display').innerText = speed.toFixed(1);

    localStorage.setItem('fishing_count', fishCount);
    localStorage.setItem('fishing_coins', coins);
    localStorage.setItem('boat_level', boatLevel);
}

// --- 4. CÁC NÚT BẤM (Đã gắn Ads) ---

function handleStartFishing() {
    if (isFishing) return;
    showAdBeforeAction(() => {
        endTime = Date.now() + (3 * 60 * 60 * 1000);
        localStorage.setItem('fishing_endTime', endTime);
        startCountdown();
    });
}

function buyBoatUpgrade() {
    const cost = boatLevel * 2000;
    if (boatLevel >= 14) return alert("Cấp tối đa!");
    
    showAdBeforeAction(() => {
        if (coins >= cost) {
            coins -= cost;
            boatLevel++;
            updateDisplays();
            alert("Nâng cấp thành công!");
        } else {
            alert("Thiếu xu!");
        }
    });
}

function sellFishAction() {
    const toSell = Math.floor(fishCount);
    if (toSell < 1) return alert("Không có cá!");
    coins += (toSell * 10);
    fishCount = 0;
    updateDisplays();
}

function switchTab(tabName) {
    document.querySelectorAll('.tab-page').forEach(p => p.classList.add('hidden'));
    const target = document.getElementById('page-' + tabName);
    if (target) target.classList.remove('hidden');
    updateDisplays();
}

// --- 5. LOGIC THỜI GIAN ---
function startCountdown() {
    const btnText = document.getElementById('btn-text');
    const timerInterval = setInterval(() => {
        const timeLeft = endTime - Date.now();
        if (timeLeft <= 0) {
            clearInterval(timerInterval);
            isFishing = false;
            if(btnText) btnText.innerText = "🚢 RA KHƠI";
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

setInterval(() => {
    fishCount += (baseSpeed + (boatLevel - 1) * 0.5);
    updateDisplays();
}, 1000);

if (endTime && endTime > Date.now()) startCountdown();
updateDisplays();
