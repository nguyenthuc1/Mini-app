Telegram.WebApp.ready()
Telegram.WebApp.expand()

let gold = Number(localStorage.getItem("gold")) || 3301684
let speed = 7
let fishing = false
let endTime = null
let interval = null

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
