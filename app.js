const tg = Telegram.WebApp
tg.ready()

async function watchAds() {
  const userId = tg.initDataUnsafe?.user?.id
  if (!userId) {
    alert("Không lấy được Telegram user")
    return
  }

  const r = await fetch("https://YOUR_SERVER_URL/ads/start", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ userId })
  })

  const { token, adUrl } = await r.json()

  localStorage.setItem("ad_token", token)

  tg.openLink(adUrl, { try_browser: true })
}

// Khi user quay lại app
async function claimReward() {
  const token = localStorage.getItem("ad_token")
  if (!token) {
    alert("Chưa xem quảng cáo")
    return
  }

  const userId = tg.initDataUnsafe.user.id

  const r = await fetch("https://YOUR_SERVER_URL/ads/verify", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ userId, token })
  })

  const data = await r.json()
  alert(data.success ? `+${data.coins} coin` : data.error)
}
