Telegram.WebApp.ready()
Telegram.WebApp.expand()

let gold = 3301684
let speed = 7
let mining = false
let endTime = null
let mineInterval = null

const mineBtn = document.getElementById("mineBtn")

// Load trạng thái cũ
const savedEnd = localStorage.getItem("mine_end")
if (savedEnd && Date.now() < savedEnd) {
  startMining(Number(savedEnd))
}

// ======================
// BẤM ĐÀO
// ======================
mineBtn.onclick = () => {
  // 1️⃣ Mở quảng cáo
  Telegram.WebApp.openLink(
    "https://example.com/quang-cao",
    { try_browser: true }
  )

  // 2️⃣ Khi user quay lại app
  setTimeout(() => {
    const end = Date.now() + 12 * 60 * 60 * 1000 // 12h
    localStorage.setItem("mine_end", end)
    startMining(end)
  }, 3000) // giả lập user xem quảng cáo
}

// ======================
// BẮT ĐẦU ĐÀO
// ======================
function startMining(end) {
  mining = true
  endTime = end
  mineBtn.disabled = true
  mineBtn.innerText = "⏳ Đang đào..."

  // đào vàng
  mineInterval = setInterval(() => {
    gold += speed
    document.getElementById("gold").innerText = Math.floor(gold)
  }, 1000)

  // cập nhật timer
  updateTimer()
}

// ======================
// TIMER 12H
// ======================
function updateTimer() {
  const timer = document.createElement("div")
  timer.className = "timer"
  mineBtn.parentNode.insertBefore(timer, mineBtn)

  const t = setInterval(() => {
    const left = endTime - Date.now()

    if (left <= 0) {
      clearInterval(t)
      clearInterval(mineInterval)
      localStorage.removeItem("mine_end")

      mining = false
      mineBtn.disabled = false
      mineBtn.innerText = "⛏️ ĐÀO NGAY"
      timer.remove()
      return
    }

    const h = Math.floor(left / 3600000)
    const m = Math.floor((left % 3600000) / 60000)
    const s = Math.floor((left % 60000) / 1000)

    timer.innerText = `⏳ ${h}h ${m}m ${s}s`
  }, 1000)
    }
