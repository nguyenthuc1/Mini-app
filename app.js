Telegram.WebApp.ready()
Telegram.WebApp.expand()

const tgUser = Telegram.WebApp.initDataUnsafe.user
const startBtn = document.getElementById("startBtn")

let currentSessionId = null

async function startTask() {
  if (!tgUser) {
    alert("Không xác thực được Telegram")
    return
  }

  // Disable nút chống spam
  startBtn.classList.add("btn-disabled")
  startBtn.innerText = "⏳ Đang mở nhiệm vụ..."
  startBtn.disabled = true

  try {
    const fingerprint = await genFingerprint()

    // GỌI SERVER TẠO SESSION
    const res = await fetch("/api/task/start", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        telegramId: tgUser.id,
        fingerprint
      })
    })

    const data = await res.json()

    currentSessionId = data.sessionId

    // 👉 CHUYỂN HƯỚNG LINK (CHUẨN TELEGRAM)
    Telegram.WebApp.openLink(data.url)

  } catch (err) {
    alert("Lỗi khi mở nhiệm vụ")
    startBtn.disabled = false
    startBtn.innerText = "🚀 Làm nhiệm vụ"
  }
}
async function genFingerprint() {
  const raw =
    navigator.userAgent +
    screen.width +
    screen.height +
    tgUser.id

  const hash = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(raw)
  )

  return [...new Uint8Array(hash)]
    .map(b => b.toString(16).padStart(2, "0"))
    .join("")
}
app.post("/api/task/start", async (req, res) => {
  const { telegramId, fingerprint } = req.body

  const sessionId = crypto.randomUUID()

  await redis.setex(
    `task:${sessionId}`,
    180,
    JSON.stringify({
      telegramId,
      fingerprint,
      startTime: Date.now()
    })
  )

  res.json({
    sessionId,
    url: "https://link4m.com/xHprfP" // LINK RÚT GỌN
  })
})
