alert("JS ĐÃ CHẠY");
// ================== CONFIG ==================
const ADS_BLOCK_ID = "https://www.google.com/?hl=vi"; // <-- thay ID AdsGram
const SAIL_TIME = 3 * 60 * 60; // 3 giờ
const BASE_SPEED = 3;
const RENT_BOAT_SPEED = 2;
const MAX_BOATS = 2;

// ================== STATE ==================
let gold = 0;
let fish = 0;
let boats = 0;
let speed = 0;
let sailEnd = 0;
let fishInterval = null;
let timerInterval = null;

// ================== UI ==================
function updateUI() {
  document.getElementById("gold").innerText = Math.floor(gold);
  document.getElementById("speed").innerText = speed;
  document.getElementById("sailBtn").onclick = watchAdAndSail;
}

// ================== ADS ==================
function showAd(onSuccess) {
  if (!window.Adsgram) {
    alert("Quảng cáo chưa sẵn sàng");
    return;
  }

  const ad = new Adsgram({ blockId: ADS_BLOCK_ID });

  ad.show().then(onSuccess).catch(() => {
    alert("Bạn phải xem hết quảng cáo");
  });
}

// ================== GAME LOGIC ==================
function watchAdAndSail() {
  startSailing(); // BỎ ADS
}

function startSailing() {
  sea.classList.remove("hidden");
sea.classList.add("fishing");
  clearInterval(fishInterval);
  clearInterval(timerInterval);

  speed = BASE_SPEED + boats * RENT_BOAT_SPEED;
  sailEnd = Date.now() + SAIL_TIME * 1000;

  fishInterval = setInterval(() => {
    fish += speed;
  }, 1000);

  timerInterval = setInterval(updateTimer, 1000);

  updateUI();
}

function updateTimer() {
  const left = sailEnd - Date.now();
  if (left <= 0) {
    clearInterval(fishInterval);
    clearInterval(timerInterval);
    speed = 0;
    document.getElementById("timer").innerText = "⛔ Hết thời gian – Ra khơi lại";
    updateUI();
    return;
  }

  const h = Math.floor(left / 3600000);
  const m = Math.floor((left % 3600000) / 60000);
  const s = Math.floor((left % 60000) / 1000);

  document.getElementById("timer").innerText =
    `⏳ ${h}:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
}

function watchAdAndRent() {
  if (boats >= MAX_BOATS) {
    alert("Đã thuê tối đa 2 thuyền");
    return;
  }

  showAd(() => {
    boats++;
    alert("Thuê thuyền thành công +2 cá/giây");
    if (speed > 0) {
      speed += RENT_BOAT_SPEED;
      updateUI();
    }
  });
}

function sellFish() {
  if (fish <= 0) {
    alert("Không có cá");
    return;
  }

  gold += fish;
  fish = 0;
  updateUI();
  alert("Đã bán cá sang xu");
}


// ================= SCREEN CONTROL =================
function showScreen(name) {
  document.querySelectorAll(".screen").forEach(s => {
    s.classList.add("hidden");
  });

  document
    .getElementById(`screen-${name}`)
    .classList.remove("hidden");

  updateUI(); // gọi lại UI khi chuyển màn
      }
