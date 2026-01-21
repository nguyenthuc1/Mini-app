let currentToken = null;
const userId = Telegram.WebApp.initDataUnsafe.user.id;

function startTask(taskId) {
  fetch("/start-task", {
    method: "POST",
    headers: {"Content-Type": "application/json"},
    body: JSON.stringify({ user: userId, task: taskId })
  })
  .then(res => res.json())
  .then(data => {
    currentToken = data.link.split("token=")[1];
    window.open(data.link, "_blank");
    document.getElementById("status").innerText =
      "⏳ Hãy ở lại trang quảng cáo";
  });
}

function confirmTask() {
  fetch("/confirm", {
    method: "POST",
    headers: {"Content-Type": "application/json"},
    body: JSON.stringify({
      user: userId,
      token: currentToken
    })
  })
  .then(res => res.json())
  .then(data => {
    document.getElementById("status").innerText =
      data.success || data.error;
  });
    }
