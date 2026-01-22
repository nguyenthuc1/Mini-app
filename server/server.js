const express = require("express")
const crypto = require("crypto")
const app = express()

app.use(express.json())

const tokens = new Map()
const users = new Map()

// 1️⃣ tạo token
app.post("/ads/start", (req,res)=>{
  const userId = req.body.userId

  const token = crypto.randomBytes(16).toString("hex")
  tokens.set(token, {
    userId,
    createdAt: Date.now(),
    used: false
  })

  res.json({
    token,
    adUrl: "https://YOUR_DIRECT_AD_LINK"
  })
})

// 2️⃣ xác nhận
app.post("/ads/verify", (req,res)=>{
  const { userId, token } = req.body
  const data = tokens.get(token)

  if (!data) return res.status(400).json({ error:"INVALID_TOKEN" })
  if (data.used) return res.status(400).json({ error:"USED" })
  if (data.userId !== userId) return res.status(403).json({ error:"USER_MISMATCH" })

  const timeSpent = Date.now() - data.createdAt
  if (timeSpent < 10000) {
    return res.status(400).json({ error:"TOO_FAST" })
  }

  data.used = true

  const u = users.get(userId) || { coins:0 }
  u.coins += 5
  users.set(userId, u)

  res.json({ success:true, coins:u.coins })
})

app.listen(3000, ()=>console.log("Server running"))
