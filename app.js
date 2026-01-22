let fish = parseInt(localStorage.getItem("fish")) || 0;
let coin = parseInt(localStorage.getItem("coin")) || 0;

let fishingEnd = parseInt(localStorage.getItem("fishingEnd")) || 0;
let rentEnd = parseInt(localStorage.getItem("rentEnd")) || 0;

let baseSpeed = 0;
let interval = null;

updateUI();
startLoop();

function fakeAd(callback) {
  alert("📺 Đang xem quảng cáo...");
  setTimeout(callback, 3000);
}

/* 🚢 RA KHƠI */
function startFishing() {
  fakeAd(() => {
    fishingEnd = Date.now() + 3 * 60 * 60 * 1000;
    localStorage.setItem("fishingEnd", fishingEnd);
    startLoop();
  });
}

/* ⛴ THUÊ THUYỀN */
function rentBoat() {
  fakeAd(() => {
    rentEnd = Date.now() + 60 * 60 * 1000;
    localStorage.setItem("rentEnd", rentEnd);
    updateUI();
  });
}

/* 🔁 GAME LOOP */
function startLoop() {
  if (interval) clearInterval(interval);

  interval = setInterval(() => {
    const now = Date.now();

    baseSpeed = 0;

    if (now < fishingEnd) baseSpeed += 3;
    if (now < rentEnd) baseSpeed += 2;

    fish += baseSpeed;
    localStorage.setItem("fish", fish);

    updateUI();
  }, 1000);
}

/* 💰 BÁN CÁ */
function sellFish() {
  if (fish <= 0) return alert("Không có cá");
  coin += fish * 10;
  fish = 0;

  localStorage.setItem("fish", fish);
  localStorage.setItem("coin", coin);
  updateUI();
}

/* 🖥 UPDATE UI */
function updateUI() {
  document.getElementById("fish").innerText = fish;
  document.getElementById("coin").innerText = coin;
  document.getElementById("speed").innerText = baseSpeed;

  const now = Date.now();
  const timer = document.getElementById("timer");

  if (now < fishingEnd) {
    timer.innerText = "⏳ Còn " + formatTime(fishingEnd - now);
    document.getElementById("startBtn").disabled = true;
  } else {
    timer.innerText = "⛔ Chưa ra khơi";
    document.getElementById("startBtn").disabled = false;
  }

  document.getElementById("rentStatus").innerText =
    now < rentEnd ? "⏳ Còn " + formatTime(rentEnd - now) : "Chưa thuê";
}

function formatTime(ms) {
  let s = Math.floor(ms / 1000);
  let h = Math.floor(s / 3600);
  s %= 3600;
  let m = Math.floor(s / 60);
  s %= 60;
  return `${h}h ${m}m ${s}s`;
}
