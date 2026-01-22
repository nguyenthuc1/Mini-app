Telegram.WebApp.ready()
Telegram.WebApp.expand()

let gold = 3301684
let speed = 7.0

setInterval(() => {
  gold += speed
  document.getElementById("gold").innerText = Math.floor(gold)
}, 1000)

document.getElementById("upgradeBtn").onclick = () => {
  alert("🚧 Chức năng nâng cấp sẽ kết nối backend sau")
}
