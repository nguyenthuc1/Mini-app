Telegram.WebApp.ready()
Telegram.WebApp.expand()

const user = Telegram.WebApp.initDataUnsafe.user
document.getElementById("user").innerText =
  `ID: ${user.id} | ${user.first_name}`

async function startTask() {
  const res = await fetch("/api/task/start", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      telegramId: user.id
    })
  })

  const data = await res.json()
  Telegram.WebApp.openLink(data.url)
      }
import express from "express"
const app = express()

app.use(express.json())

app.post("/api/task/start", (req, res) => {
  const { telegramId } = req.body

  // TODO: tạo session + anti-cheat
  res.json({
    url: "https://link4m.com/xHprfP"
  })
})

app.listen(3000)
import crypto from "crypto"

function verifyTelegram(initData) {
  const secret = crypto
    .createHash("sha256")
    .update(BOT_TOKEN)
    .digest()

  // verify theo chuẩn Telegram
}
