require("dotenv").config()
const express = require("express")
const cors = require("cors")
const crypto = require("crypto")
const { v4: uuidv4 } = require("uuid")

const { users, sessions } = require("./db")
const { verifyTelegram } = require("./antiCheat")

const app = express()
app.use(cors())
app.use(express.json())

/* ================= AUTH ================= */
app.post("/auth", (req, res) => {
  const { initData } = req.body

  if (!verifyTelegram(initData, process.env.BOT_TOKEN)) {
    return res.status(403).json({ error: "Invalid Telegram auth" })
  }

  const params = new URLSearchParams(initData)
  const user = JSON.parse(params.get("user"))

  if (!users.has(user.id)) {
    users.set(user.id, {
      telegramId: user.id,
      coins: 0,
      banned: false,
      lastActions: []
    })
  }

  res.json({ success: true })
})

/* ================= START TASK ================= */
app.post("/task/start", (req, res) => {
  const { telegramId } = req.body
  const user = users.get(telegramId)

  if (!user || user.banned) {
    return res.status(403).json({ error: "User blocked" })
  }

  const sessionToken = uuidv4()

  sessions.set(sessionToken, {
    telegramId,
    createdAt: Date.now(),
    used: false
  })

  res.json({
    sessionToken,
    url: "https://link4m.com/YOUR_AD_LINK"
  })
})

/* ================= VERIFY TASK ================= */
app.post("/task/verify", (req, res) => {
  const { telegramId, sessionToken } = req.body
  const session = sessions.get(sessionToken)
  const user = users.get(telegramId)

  if (!session || session.used) {
    return res.json({ success: false })
  }

  if (session.telegramId !== telegramId) {
    return res.json({ success: false })
  }

  const spent = Date.now() - session.createdAt
  if (spent < 15000) {
    return res.json({ success: false })
  }

  session.used = true

  const reward = Math.floor(Math.random() * 3) + 1
  user.coins += reward

  res.json({
    success: true,
    reward,
    total: user.coins
  })
})

/* ================= SERVER ================= */
app.listen(process.env.PORT, () => {
  console.log("🚀 Backend running on port", process.env.PORT)
})
