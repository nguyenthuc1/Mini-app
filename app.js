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

