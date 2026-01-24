// Khởi tạo biến lưu trữ dữ liệu
let fish = 0;
let coins = 0;
let miningSpeed = 0.5;
let isMining = false;
let miningTimeout = 10800; // 3 tiếng tính bằng giây (3 * 3600)
let timerInterval;
let miningInterval;

const fishDisplay = document.getElementById('fish-count');
const coinDisplay = document.getElementById('coin-balance');
const speedDisplay = document.getElementById('mining-speed');
const btnMine = document.getElementById('btn-mine');
const timerDisplay = document.getElementById('timer-display');

function startAds() {
    if (isMining) return;

    btnMine.disabled = true;
    btnMine.innerHTML = `<span class="loading-spinner"></span> ĐANG XEM...`;

    // Giả lập xem quảng cáo 3 giây
    setTimeout(() => {
        startMiningSession();
    }, 3000);
}

function startMiningSession() {
    isMining = true;
    let timeLeft = miningTimeout;
    
    btnMine.innerHTML = "ĐANG ĐÀO...";
    btnMine.classList.replace('bg-blue-600', 'bg-green-700');
    timerDisplay.classList.remove('hidden');

    // Xóa các interval cũ nếu có
    clearInterval(miningInterval);
    clearInterval(timerInterval);

    // 1. Interval cộng cá mỗi giây
    miningInterval = setInterval(() => {
        if (isMining) {
            fish += miningSpeed;
            fishDisplay.innerText = Math.floor(fish);
        }
    }, 1000);

    // 2. Interval đếm ngược 3 tiếng
    timerInterval = setInterval(() => {
        timeLeft--;
        
        // Cập nhật giao diện đồng hồ (HH:MM:SS)
        let hrs = Math.floor(timeLeft / 3600);
        let mins = Math.floor((timeLeft % 3600) / 60);
        let secs = timeLeft % 60;
        timerDisplay.innerText = `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;

        if (timeLeft <= 0) {
            stopMiningSession();
        }
    }, 1000);
}

function stopMiningSession() {
    isMining = false;
    clearInterval(miningInterval);
    clearInterval(timerInterval);
    
    btnMine.disabled = false;
    btnMine.innerHTML = "RA KHƠI";
    btnMine.classList.replace('bg-green-700', 'bg-blue-600');
    timerDisplay.classList.add('hidden');
    
    alert("Hết thời gian đào! Hãy xem quảng cáo để tiếp tục ra khơi.");
}

// Giữ nguyên các hàm handleSell, handleUpgrade và switchTab như cũ...
