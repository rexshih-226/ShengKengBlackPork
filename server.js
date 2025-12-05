// ==========================================
//  DeepSK Backend Server (Final Version)
// ==========================================

const express = require("express");
const cors = require("cors");
const app = express();
const PORT = 3000;

// ================================
// Middlewares
// ================================
app.use(cors());
app.use(express.json());
app.use(express.static("public")); // 讓前端能讀 public 資料夾

// ================================
// In-memory DB（真正部署時可換 DB）
// ================================
let users = {};          // { username: { username } }
let coupons = [];        // { id, username, taskName, reward, time }

// ⭐ 新任務：使用 x, y（百分比）代表在像素地圖的位置
let tasks = [
    { id: 1, name: "深坑老街", x: 12, y: 38 },
    { id: 2, name: "豆腐博物館", x: 48, y: 42 },
    { id: 3, name: "阿婆豆腐店", x: 70, y: 60 },
    { id: 4, name: "吊橋入口", x: 30, y: 18 },
    { id: 5, name: "深坑茶園步道", x: 60, y: 25 }
];

// ================================
// API Routes
// ================================

// ⭐ 1. Login
app.post("/api/login", (req, res) => {
    const { username } = req.body;

    if (!username || username.trim() === "") {
        return res.status(400).json({ error: "Missing username" });
    }

    if (!users[username]) {
        users[username] = { username };
    }

    return res.json({ user: users[username] });
});

// ⭐ 2. Get tasks
app.get("/api/tasks", (req, res) => {
    res.json(tasks);
});

// ⭐ 3. Complete task → Give coupon
app.post("/api/tasks/:id/complete", (req, res) => {
    const taskId = parseInt(req.params.id);
    const { username } = req.body;

    if (!username) {
        return res.status(400).json({ error: "Missing username" });
    }

    const task = tasks.find(t => t.id === taskId);
    if (!task) {
        return res.status(404).json({ error: "Task not found" });
    }

    const coupon = {
        id: coupons.length + 1,
        username: username,
        taskName: task.name,
        reward: `${task.name} 專屬優惠券`,
        time: Date.now()
    };

    coupons.push(coupon);

    res.json({ success: true, coupon });
});

// ⭐ 4. Get user coupons
app.get("/api/coupons", (req, res) => {
    const { username } = req.query;

    if (!username) {
        return res.status(400).json({ error: "Missing username" });
    }

    const userCoupons = coupons.filter(c => c.username === username);
    res.json(userCoupons);
});

// ================================
// Start Server
// ================================
app.listen(PORT, () => {
    console.log(`🚀 DeepSK backend running at http://localhost:${PORT}`);
});
