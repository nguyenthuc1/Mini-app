const express = require("express");
const fs = require("fs");
const app = express();

app.use(express.json());
app.use(express.static("public"));

let db = require("./db.json");

// START TASK
app.post("/start-task", (req, res) => {
  const { user, task } = req.body;

  const token = Math.random().toString(36).slice(2);
  db.sessions[token] = {
    user,
    task,
    opened: false,
    startTime: Date.now()
  };

  saveDB();

  res.json({
    link: `https://your-offer-site.com/?token=${token}`
  });
});

// CALLBACK TỪ WEBSITE
app.get("/callback", (req, res) => {
  const token = req.query.token;
  if (db.sessions[token]) {
    db.sessions[token].opened = true;
    saveDB();
  }
  res.send("OK");
});

// CONFIRM TASK
app.post("/confirm", (req, res) => {
  const { user, token } = req.body;
  const session = db.sessions[token];

  if (!session || session.user !== user)
    return res.json({ error: "Session không hợp lệ" });

  if (!session.opened)
    return res.json({ error: "Bạn chưa mở link" });

  if (Date.now() - session.startTime < 15000)
    return res.json({ error: "Chưa đủ thời gian" });

  if (!db.users[user])
    db.users[user] = { balance: 0, done: [] };

  if (db.users[user].done.includes(session.task))
    return res.json({ error: "Đã làm nhiệm vụ này" });

  db.users[user].balance += 100;
  db.users[user].done.push(session.task);

  delete db.sessions[token];
  saveDB();

  res.json({ success: "🎉 Nhận 100 xu thành công" });
});

function saveDB() {
  fs.writeFileSync("./db.json", JSON.stringify(db, null, 2));
}

app.listen(3000);
