const express = require("express")
const cors = require("cors")
const crypto = require("crypto")

const app = express()
app.use(cors())
app.use(express.json())

const sessions = {}

app.post("/api/task/start", (req, res) => {
  const { telegramId, fingerprint } = req.body

  if (!telegramId || !fingerprint)
    return res.status(400).json({ error: "Thiếu dữ liệu" })

  const sessionId = crypto.randomUUID()

  sessions[sessionId] = {
    telegramId,
    fingerprint,
    startTime: Date.now(),
    done: false
  }

  res.json({
    sessionId,
    url: "https://link4m.com/xHprfP" // LINK RÚT GỌN
  })
})

app.post("/api/task/verify", (req, res) => {
  const { sessionId } = req.body
  const session = sessions[sessionId]

  if (!session) return res.status(400).json({ error: "Session sai" })

  const diff = Date.now() - session.startTime
  if (diff < 20000)
    return res.status(403).json({ error: "Chưa đủ thời gian" })

  if (session.done)
    return res.status(403).json({ error: "Đã nhận" })

  session.done = true

  res.json({ reward: 100 })
})

app.listen(3000, () => console.log("Server running"))
