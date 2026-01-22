import express from "express"
import cors from "cors"
import crypto from "crypto"

const app = express()
app.use(cors())
app.use(express.json())

const sessions = new Map()

// ================= START TASK =================
app.post("/api/task/start", (req, res) => {
  const { telegramId, fingerprint } = req.body
  if (!telegramId || !fingerprint) {
    return res.json({ error: "invalid" })
  }

  const token = crypto.randomUUID()

  sessions.set(token, {
    telegramId,
    fingerprint,
    completed: false,
    createdAt: Date.now()
  })

  res.json({
    sessionId: token,
    url: `https://miniapp-backend-d87k.onrender.com/go/${token}`
  })
})

// ================= SHORT LINK =================
app.get("/go/:token", (req, res) => {
  const session = sessions.get(req.params.token)
  if (!session) return res.send("Link không hợp lệ")

  res.send(`
    <html>
      <body style="text-align:center;font-family:sans-serif">
        <h2>⏳ Đang tải quảng cáo...</h2>
        <p>Vui lòng chờ 10 giây</p>

        <script>
          setTimeout(() => {
            window.location.href = "/callback/${req.params.token}"
          }, 10000)
        </script>
      </body>
    </html>
  `)
})

// ================= CALLBACK =================
app.get("/callback/:token", (req, res) => {
  const session = sessions.get(req.params.token)
  if (!session) return res.send("Invalid")

  session.completed = true

  res.send(`
    <html>
      <body style="text-align:center">
        <h2>✅ Hoàn thành</h2>
        <p>Quay lại Telegram để nhận thưởng</p>
      </body>
    </html>
  `)
})

// ================= VERIFY =================
app.post("/api/task/verify", (req, res) => {
  const { telegramId, sessionId, fingerprint } = req.body
  const session = sessions.get(sessionId)

  if (!session) return res.json({ success: false })

  if (
    session.telegramId !== telegramId ||
    session.fingerprint !== fingerprint ||
    !session.completed
  ) {
    return res.json({ success: false })
  }

  sessions.delete(sessionId)

  res.json({
    success: true,
    reward: 100
  })
})

app.listen(3000, () => {
  console.log("Backend running")
})
