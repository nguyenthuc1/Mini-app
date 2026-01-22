import express from "express"
import cors from "cors"

const app = express()
app.use(cors())
app.use(express.json())

const users = {}

app.post("/save", (req, res) => {
  const { telegramId, coins, energy } = req.body
  if (!telegramId) return res.sendStatus(400)

  users[telegramId] = {
    coins,
    energy
  }

  res.json({ ok: true })
})

app.get("/user/:id", (req, res) => {
  res.json(users[req.params.id] || { coins: 0, energy: 10 })
})

app.listen(3000, () => console.log("Server running"))
