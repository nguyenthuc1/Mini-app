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
async function watchAds() {
  const userId = Telegram.WebApp.initDataUnsafe.user.id

  const r = await fetch("/ads/start", {
    method:"POST",
    headers:{ "Content-Type":"application/json" },
    body: JSON.stringify({ userId })
  })

  const { token, adUrl } = await r.json()

  localStorage.setItem("ad_token", token)

  Telegram.WebApp.openLink(adUrl, { try_browser:true })
}

// Khi user quay lại app
async function claimReward() {
  const token = localStorage.getItem("ad_token")
  const userId = Telegram.WebApp.initDataUnsafe.user.id

  const r = await fetch("/ads/verify", {
    method:"POST",
    headers:{ "Content-Type":"application/json" },
    body: JSON.stringify({ userId, token })
  })

  const data = await r.json()
  alert(JSON.stringify(data))
    }
