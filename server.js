const express = require("express")
const cors = require("cors")
const crypto = require("crypto")

const app = express()
app.use(cors())
app.use(express.json())

/**
 * sessionId => {
 *   telegramId,
 *   fingerprint,
 *   createdAt,
 *   completed,
 * }
 */
const sessions = new Map()

/* ========== HEALTH CHECK ========== */
app.get("/", (req, res) => {
  res.send("Mini App Backend Running")
})

/* ========== START TASK ========== */
app.post("/api/task/start", (req, res) => {
  const { telegramId, fingerprint } = req.body
  if (!telegramId || !fingerprint) {
    return res.status(400).json({ error: "Missing data" })
  }

  const sessionId = crypto.randomUUID()

  sessions.set(sessionId, {
    telegramId,
    fingerprint,
    createdAt: Date.now(),
    completed: false
  })

  // ⚠️ LINK RÚT GỌN + SUBID
  const shortLink =
   "https://google.com" + sessionId

  res.json({
    sessionId,
    url: shortLink
  })
})

/* ========== CALLBACK TỪ LINK RÚT GỌN ========== */
/**
 * Link rút gọn sẽ gọi về URL này
 * Ví dụ payload:
 * { subid: "sessionId", status: "completed" }
 */
app.post("/api/callback", (req, res) => {
  const { subid, status } = req.body

  const session = sessions.get(subid)
  if (!session) return res.send("INVALID")

  if (status === "completed") {
    session.completed = true
  }

  res.send("OK")
})

/* ========== VERIFY + NHẬN THƯỞNG ========== */
app.post("/api/task/verify", (req, res) => {
  const { sessionId, telegramId } = req.body
  const session = sessions.get(sessionId)

  if (!session) {
    return res.json({ success: false, reason: "no_session" })
  }

  if (session.telegramId !== telegramId) {
    return res.json({ success: false, reason: "user_mismatch" })
  }

  if (!session.completed) {
    return res.json({ success: false, reason: "not_completed" })
  }

  // Anti spam nhận nhiều lần
  sessions.delete(sessionId)

  res.json({
    success: true,
    reward: 100
  })
})

const PORT = process.env.PORT || 3000
app.listen(PORT, () =>
  console.log("Server running on port", PORT)
)
