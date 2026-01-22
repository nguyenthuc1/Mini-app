Telegram.WebApp.ready()
Telegram.WebApp.expand()

let gold = Number(localStorage.getItem("gold")) || 3301684
let speed = 7
let fishing = false
let endTime = null
let interval = null
let fish = Number(localStorage.getItem("fish")) || 0
let baseSpeed = 8
let bonusSpeed = 0
let rentExpire = Number(localStorage.getItem("rentExpire")) || 0

function updateUI() {
  document.getElementById("fish").innerText = fish
}

updateUI()

/* ===== ĐÀO / ĐÁNH CÁ ===== */
setInterval(() => {
  if (Date.now() < rentExpire) {
    bonusSpeed = 4
    document.getElementById("rentStatus").innerText =
      "⏳ Còn " + Math.ceil((rentExpire - Date.now()) / 60000) + " phút"
  } else {
    bonusSpeed = 0
    document.getElementById("rentStatus").innerText = "Chưa thuê"
    localStorage.removeItem("rentExpire")
  }

  fish += baseSpeed + bonusSpeed
  localStorage.setItem("fish", fish)
  updateUI()
}, 1000)

/* ===== ĐỔI CÁ ===== */
function exchangeFish() {
  if (fish < 100) {
    alert("Cần ít nhất 100 cá")
    return
  }

  fish -= 100
  localStorage.setItem("fish", fish)
  alert("Đã đổi 100 cá ➜ +1.000 VNĐ")
  updateUI()
}

/* ===== THUÊ THUYỀN ===== */
function rentBoat() {
  if (Date.now() < rentExpire) {
    alert("Bạn đang thuê thuyền rồi")
    return
  }

  // 🔥 CHỖ GẮN QUẢNG CÁO
  alert("Giả lập xem quảng cáo xong")

  rentExpire = Date.now() + 60 * 60 * 1000 // 1 giờ
  localStorage.setItem("rentExpire", rentExpire)

  alert("Thuê thuyền thành công! +4 cá / giây trong 1 giờ")
                            }
const goldEl = document.getElementById("gold")
const btn = document.getElementById("fishBtn")
const timerEl = document.getElementById("timer")

goldEl.innerText = gold

// Load lại nếu đang đánh cá
const savedEnd = localStorage.getItem("fish_end")
if (savedEnd && Date.now() < savedEnd) {
  startFishing(Number(savedEnd))
}

btn.onclick = () => {
  // 🔥 MỞ QUẢNG CÁO
  Telegram.WebApp.openLink(
    "https://example.com/quang-cao",
    { try_browser: true }
  )

  // Giả lập user xem quảng cáo
  setTimeout(() => {
    const end = Date.now() + 12 * 60 * 60 * 1000
    localStorage.setItem("fish_end", end)
    startFishing(end)
  }, 3000)
}

function startFishing(end) {
  fishing = true
  endTime = end
  btn.disabled = true
  btn.innerText = "🎣 Đang đánh cá..."
  timerEl.classList.remove("hidden")

  interval = setInterval(() => {
    gold += speed
    goldEl.innerText = Math.floor(gold)
    localStorage.setItem("gold", gold)
  }, 1000)

  updateTimer()
}

function updateTimer() {
  const t = setInterval(() => {
    const left = endTime - Date.now()
    if (left <= 0) {
      clearInterval(t)
      clearInterval(interval)
      fishing = false

      localStorage.removeItem("fish_end")
      btn.disabled = false
      btn.innerText = "🚤 RA KHƠI"
      timerEl.classList.add("hidden")
      return
    }

    const h = Math.floor(left / 3600000)
    const m = Math.floor((left % 3600000) / 60000)
    const s = Math.floor((left % 60000) / 1000)

    timerEl.innerText = `⏳ ${h}h ${m}m ${s}s`
  }, 1000)
      }
