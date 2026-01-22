import express from "express"
import cors from "cors"
import crypto from "crypto"

const app = express()
app.use(cors())
app.use(express.json())

const PORT = process.env.PORT || 3000

// DB tạm (free)
const sessions = new Map()

// =======================
// START TASK
// =======================
app.post("/api/task/start", (req, res) => {
  const { telegramId } = req.body
  if (!telegramId) return res.status(400).json({ error: "No telegramId" })

  const sessionId = crypto.randomUUID()
  const token = crypto.randomUUID()

  sessions.set(sessionId, {
    telegramId,
    token,
    verified: false,
    createdAt: Date.now()
  })

  // ⚠️ ĐỔI link4m của bạn
  const shortLink =
    "https://google.com"" +
    "?redirect=" +
    encodeURIComponent(`https://miniappp-backend-d87k.onrender.com/callback/${token}`)

  res.json({
    sessionId,
    url: shortLink
  })
})

// =======================
// CALLBACK VERIFY (QUAN TRỌNG)
// =======================
app.get("/callback/:token", (req, res) => {
  const { token } = req.params

  for (const session of sessions.values()) {
    if (session.token === token) {
      session.verified = true
      break
    }
  }

  // quay lại Telegram
  res.redirect("https://t.me/YOUR_BOT_USERNAME")
})

// =======================
// VERIFY TASK
// =======================
app.post("/api/task/verify", (req, res) => {
  const { sessionId, telegramId } = req.body

  const session = sessions.get(sessionId)
  if (!session) return res.json({ success: false })

  if (session.telegramId !== telegramId)
    return res.json({ success: false })

  if (!session.verified)
    return res.json({ success: false })

  // OK
  sessions.delete(sessionId)
  res.json({
    success: true,
    reward: 100
  })
})

app.listen(PORT, () => {
  console.log("Server running on port", PORT)
})
