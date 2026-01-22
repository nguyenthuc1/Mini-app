// ===== TELEGRAM INIT =====
const tg = window.Telegram.WebApp;
tg.ready();

// ===== CONFIG =====
const BASE_FISH_PER_SEC = 8;
const RENT_BONUS = 4;
const FISH_TO_MONEY = 1; // 1 cá = 1 tiền (bạn đổi sau)
const FISH_TIME = 12 * 60 * 60; // 12 giờ
const RENT_TIME = 60 * 60; // 1 giờ

// ===== ELEMENTS =====
const fishBtn = document.getElementById("fishBtn");
const fishEl = document.getElementById("fish");
const goldEl = document.getElementById("gold");
const timerEl = document.getElementById("timer");
const rentStatusEl = document.getElementById("rentStatus");

// ===== STATE =====
let fish = Number(localStorage.getItem("fish")) || 0;
let gold = Number(localStorage.getItem("gold")) || 0;

let fishingEnd = Number(localStorage.getItem("fishingEnd")) || 0;
let rentEnd = Number(localStorage.getItem("rentEnd")) || 0;

let fishingInterval = null;

// ===== UI UPDATE =====
function updateUI() {
  fishEl.innerText = Math.floor(fish);
  if (goldEl) goldEl.innerText = Math.floor(gold);
}
updateUI();

// ===== TIME FORMAT =====
function formatTime(sec) {
  const h = String(Math.floor(sec / 3600)).padStart(2, "0");
  const m = String(Math.floor((sec % 3600) / 60)).padStart(2, "0");
  const s = String(sec % 60).padStart(2, "0");
  return `${h}:${m}:${s}`;
}

// ===== START FISHING =====
fishBtn.onclick = () => {
  if (Date.now() < fishingEnd) return;

  // Giả lập xem quảng cáo
  fishBtn.disabled = true;
  fishBtn.innerText = "📺 Đang xem quảng cáo...";

  setTimeout(() => {
    fishingEnd = Date.now() + FISH_TIME * 1000;
    localStorage.setItem("fishingEnd", fishingEnd);

    fishBtn.innerText = "🎣 Đang đánh cá...";
    startFishing();
  }, 2000); // 2s giả lập quảng cáo
};

// ===== FISH LOOP =====
function startFishing() {
  if (fishingInterval) clearInterval(fishingInterval);

  fishingInterval = setInterval(() => {
    const now = Date.now();

    if (now >= fishingEnd) {
      clearInterval(fishingInterval);
      fishingInterval = null;
      timerEl.classList.add("hidden");
      fishBtn.disabled = false;
      fishBtn.innerText = "🚤 RA KHƠI";
      return;
    }

    let speed = BASE_FISH_PER_SEC;
    if (now < rentEnd) speed += RENT_BONUS;

    fish += speed;
    localStorage.setItem("fish", fish);

    timerEl.classList.remove("hidden");
    timerEl.innerText = "⏳ " + formatTime(Math.floor((fishingEnd - now) / 1000));

    updateUI();
  }, 1000);
}

// ===== RESUME WHEN RELOAD =====
if (Date.now() < fishingEnd) {
  fishBtn.disabled = true;
  fishBtn.innerText = "🎣 Đang đánh cá...";
  startFishing();
}

// ===== EXCHANGE FISH =====
window.exchangeFish = () => {
  if (fish < 1) return alert("Không có cá để đổi");

  gold += fish * FISH_TO_MONEY;
  fish = 0;

  localStorage.setItem("fish", fish);
  localStorage.setItem("gold", gold);

  updateUI();
  alert("✅ Đổi cá thành tiền thành công");
};

// ===== RENT BOAT =====
window.rentBoat = () => {
  if (Date.now() < rentEnd) return alert("Bạn đã thuê thuyền rồi");

  // Giả lập xem quảng cáo
  rentStatusEl.innerText = "📺 Đang xem quảng cáo...";

  setTimeout(() => {
    rentEnd = Date.now() + RENT_TIME * 1000;
    localStorage.setItem("rentEnd", rentEnd);
    rentStatusEl.innerText = "🚤 Đã thuê thuyền (+4 cá/giây)";
  }, 2000);
};

// ===== RENT STATUS CHECK =====
setInterval(() => {
  if (Date.now() >= rentEnd) {
    rentStatusEl.innerText = "Chưa thuê";
  }
}, 1000);
