// server.js
const express = require("express");
const cors = require("cors");
const fs = require("fs");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 3000;

// 讀寫資料的工具函式 ---------------------------------
const DATA_FILE = path.join(__dirname, "data.json");

function loadData() {
  const raw = fs.readFileSync(DATA_FILE, "utf8");
  return JSON.parse(raw);
}

function saveData(data) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), "utf8");
}

// 中介軟體（middleware）--------------------------------
app.use(cors());
app.use(express.json());

// 靜態檔案：前端放在 public 資料夾 --------------------
app.use(express.static(path.join(__dirname, "public")));

// API Routes ------------------------------------------

// 1. Login / Register（簡單版：只要有名字就當作登入成功）
app.post("/api/login", (req, res) => {
  const { username } = req.body;

  if (!username) {
    return res.status(400).json({ error: "Username is required" });
  }

  const data = loadData();
  let user = data.users.find(u => u.username === username);

  if (!user) {
    // 沒有就自動註冊
    user = {
      id: Date.now(),
      username
    };
    data.users.push(user);
    saveData(data);
  }

  res.json({
    message: "Login success",
    user
  });
});

// 2. 取得任務列表
app.get("/api/tasks", (req, res) => {
  const data = loadData();
  res.json(data.tasks);
});

// 3. 完成任務：建立 coupon
app.post("/api/tasks/:id/complete", (req, res) => {
  const taskId = parseInt(req.params.id, 10);
  const { username } = req.body; // 前端傳 username

  if (!username) {
    return res.status(400).json({ error: "Username is required" });
  }

  const data = loadData();
  const user = data.users.find(u => u.username === username);
  const task = data.tasks.find(t => t.id === taskId);

  if (!user) {
    return res.status(404).json({ error: "User not found" });
  }
  if (!task) {
    return res.status(404).json({ error: "Task not found" });
  }

  // 檢查是否已完成過
  const existing = data.coupons.find(
    c => c.userId === user.id && c.taskId === task.id
  );
  if (existing) {
    return res.status(400).json({ error: "Task already completed" });
  }

  const coupon = {
    id: Date.now(),
    userId: user.id,
    taskId: task.id,
    taskName: task.name,
    reward: task.reward,
    time: new Date().toISOString()
  };

  data.coupons.push(coupon);
  saveData(data);

  res.json({
    message: "Task completed, coupon created",
    coupon
  });
});

// 4. 取得某使用者的 coupons
app.get("/api/coupons", (req, res) => {
  const username = req.query.username;
  if (!username) {
    return res.status(400).json({ error: "Username is required" });
  }

  const data = loadData();
  const user = data.users.find(u => u.username === username);

  if (!user) {
    return res.json([]); // 沒有就視為沒 coupon
  }

  const userCoupons = data.coupons.filter(c => c.userId === user.id);
  res.json(userCoupons);
});

// 5. 測試用：健康檢查
app.get("/api/health", (req, res) => {
  res.json({ status: "ok" });
});

// 啟動伺服器 ------------------------------------------
const server = app.listen(PORT, () => {
  console.log(`DeepSK server running at http://localhost:${PORT}`);
});

server.on("error", (err) => {
  if (err && err.code === "EADDRINUSE") {
    console.error(
      `Port ${PORT} is already in use. Stop the process using it or run with a different PORT.`
    );
    process.exit(1);
  }
  throw err;
});
