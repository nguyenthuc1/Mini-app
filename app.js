let token = null;
let startTime = 0;

function startTask(taskId) {
  const userId = Telegram.WebApp.initDataUnsafe.user.id;

  fetch("create_task.php", {
    method: "POST",
    body: JSON.stringify({
      user: userId,
      task: taskId
    })
  })
  .then(res => res.json())
  .then(data => {
    token = data.token;
    startTime = Date.now();
    window.open(data.link, "_blank");
    document.getElementById("status").innerText =
      "⏳ Đang làm nhiệm vụ...";
  });
}

function confirmTask(taskId) {
  const userId = Telegram.WebApp.initDataUnsafe.user.id;
  const timeSpent = (Date.now() - startTime) / 1000;

  if (timeSpent < 10) {
    alert("❌ Chưa đủ thời gian");
    return;
  }

  fetch("reward.php", {
    method: "POST",
    body: JSON.stringify({
      user: userId,
      task: taskId,
      token: token
    })
  })
  .then(res => res.text())
  .then(res => {
    document.getElementById("status").innerText = res;
  });
}