const crypto = require("crypto")

function verifyTelegram(initData, botToken) {
  const params = new URLSearchParams(initData)
  const hash = params.get("hash")
  params.delete("hash")

  const dataCheck = [...params.entries()]
    .sort()
    .map(([k,v]) => `${k}=${v}`)
    .join("\n")

  const secret = crypto
    .createHash("sha256")
    .update(botToken)
    .digest()

  const hmac = crypto
    .createHmac("sha256", secret)
    .update(dataCheck)
    .digest("hex")

  return hmac === hash
}

module.exports = { verifyTelegram }
