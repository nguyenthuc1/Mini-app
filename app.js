const BLOCK_ID = 'YOUR_BLOCK_ID_HERE'; // Thay ID thật vào đây
let coins = parseInt(localStorage.getItem('fishing_coins')) || 0;
let endTime = localStorage.getItem('fishing_endTime') || 0;
let fishInterval;

const btnAction = document.getElementById('btn-action');
const boatArea = document.getElementById('boat-area');
const boat = document.getElementById('boat');
const speedDisplay = document.getElementById('speed-display');
const coinDisplay = document.getElementById('coin-display');

// Khởi tạo Adsgram
const AdController = window.Adsgram ? window.Adsgram.init({ blockId: BLOCK_ID }) : null;

// Lắng nghe sự kiện bấm nút
btnAction.addEventListener('click', () => {
    if (!AdController) return alert("Lỗi tải Adsgram!");

    AdController.show().then(() => {
        // Xem xong quảng cáo -> Cho đánh cá 3 tiếng (10800 giây)
        startFishing(10800);
    }).catch(() => {
        alert("Bạn cần xem hết quảng cáo để ra khơi!");
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
            // Cập nhật giao diện đang hoạt động
            btnAction.disabled = true;
            boatArea.style.opacity = "1";
            boat.classList.add('boat-float');
            speedDisplay.innerText = "5";
            
            coins += 1;
            coinDisplay.innerText = coins;
            localStorage.setItem('fishing_coins', coins);

            // Hiển thị đếm ngược h:m:s
            const h = Math.floor(timeLeft / 3600000);
            const m = Math.floor((timeLeft % 3600000) / 60000);
            const s = Math.floor((timeLeft % 60000) / 1000);
            btnAction.innerText = `⏳ ${h}h ${m}m ${s}s`;
            
            spawnFish();
        }
    }, 1000);
}

function stopFishing() {
    clearInterval(fishInterval);
    btnAction.disabled = false;
    btnAction.innerText = "🚢 Ra khơi";
    boatArea.style.opacity = "0.4";
    boat.classList.remove('boat-float');
    speedDisplay.innerText = "0";
    localStorage.removeItem('fishing_endTime');
}

function spawnFish() {
    const container = document.getElementById('effect-layer');
    const fish = document.createElement('div');
    const randomX = (Math.random() - 0.5) * 150;
    fish.className = 'fish-particle text-2xl';
    fish.innerHTML = '🐟';
    fish.style.left = '50%';
    fish.style.top = '60%';
    fish.style.setProperty('--tx', `${randomX}px`);
    container.appendChild(fish);
    setTimeout(() => fish.remove(), 1200);
}

// Khôi phục trạng thái khi vào lại App
window.onload = () => {
    coinDisplay.innerText = coins;
    if (endTime && endTime > Date.now()) {
        runLogic();
    }
};
// Thêm biến quản lý cá
let coins = parseInt(localStorage.getItem('fishing_coins')) || 0;
let fishCount = parseInt(localStorage.getItem('fishing_count')) || 0; // Số cá hiện có
let endTime = localStorage.getItem('fishing_endTime') || 0;

// Cập nhật hiển thị lúc đầu
document.getElementById('coin-display').innerText = coins;
document.getElementById('fish-display').innerText = fishCount;

function runLogic() {
    if (fishInterval) clearInterval(fishInterval);

    fishInterval = setInterval(() => {
        const now = Date.now();
        const timeLeft = endTime - now;

        if (timeLeft <= 0) {
            stopFishing();
        } else {
            // ... (giữ nguyên logic quảng cáo và thời gian) ...

            // Thay vì cộng xu, ta cộng cá
            fishCount += 1; 
            document.getElementById('fish-display').innerText = fishCount;
            localStorage.setItem('fishing_count', fishCount);

            spawnFish();
        }
    }, 1000);
}

// Hàm đổi cá lấy xu (Ví dụ: 1 con cá = 10 xu)
function sellFish() {
    if (fishCount <= 0) {
        alert("Bạn không có cá để bán!");
        return;
    }

    const pricePerFish = 10; // Bạn có thể chỉnh giá ở đây
    const earnedCoins = fishCount * pricePerFish;
    
    coins += earnedCoins;
    fishCount = 0; // Reset số cá về 0 sau khi bán

    // Cập nhật giao diện và bộ nhớ
    document.getElementById('coin-display').innerText = coins;
    document.getElementById('fish-display').innerText = fishCount;
    localStorage.setItem('fishing_coins', coins);
    localStorage.setItem('fishing_count', fishCount);

    alert(`Bạn đã bán cá và nhận được ${earnedCoins} Xu!`);
}


