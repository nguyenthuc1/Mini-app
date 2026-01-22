Telegram.WebApp.ready()
Telegram.WebApp.expand()

const tgUser = Telegram.WebApp.initDataUnsafe?.user
const btn = document.getElementById("btn")

let currentSessionId = null

btn.onclick = startTask

function genFingerprint() {
  return btoa(
    navigator.userAgent +
    screen.width +
    screen.height +
    Intl.DateTimeFormat().resolvedOptions().timeZone
  )
}

// ================= START =================
async function startTask() {
  if (!tgUser) {
    alert("Không xác thực Telegram")
    return
  }

  btn.disabled = true
  btn.innerText = "⏳ Đang mở..."

  try {
    const res = await fetch(
      "https://miniapp-backend-d87k.onrender.com/",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          telegramId: tgUser.id,
          fingerprint: genFingerprint()
        })
      }
    )

    const data = await res.json()
    currentSessionId = data.sessionId

    Telegram.WebApp.openLink(data.url, { try_browser: true })

    btn.innerText = "✅ Xác minh"
    btn.disabled = false
    btn.onclick = verifyTask

  } catch {
    alert("Lỗi mở nhiệm vụ")
    resetBtn()
  }
}

// ================= VERIFY =================
async function verifyTask() {
  btn.disabled = true
  btn.innerText = "🔎 Đang kiểm tra..."

  try {
    const res = await fetch(
      "https://miniapp-backend-d87k.onrender.com/",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          telegramId: tgUser.id,
          sessionId: currentSessionId,
          fingerprint: genFingerprint()
        })
      }
    )

    const data = await res.json()

    if (data.success) {
      alert("✅ Hoàn thành +" + data.reward + " xu")
    } else {
      alert("❌ Bạn chưa vượt link")
    }

  } catch {
    alert("Lỗi xác minh")
  }

  resetBtn()
}

function resetBtn() {
  btn.disabled = false
  btn.innerText = "🚀 Nhận nhiệm vụ"
  btn.onclick = startTask
}
