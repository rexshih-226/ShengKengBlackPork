// ========================
// DeepSK 前端主程式 main.js
// ========================

const API_BASE = "http://localhost:3000/api";


// ------------------------------
// 取得目前登入使用者
// ------------------------------
function getCurrentUser() {
    return localStorage.getItem("user");
}


// ------------------------------
// Login
// ------------------------------
async function login() {
    const name = document.getElementById("username").value.trim();
    if (!name) return alert("請輸入暱稱！");

    try {
        const res = await fetch(`${API_BASE}/login`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ username: name })
        });

        const data = await res.json();
        localStorage.setItem("user", data.user.username);

        // 登入後載入背景音樂 & 進入首頁
        window.location.href = "home.html";

    } catch (err) {
        alert("登入失敗，請稍後再試");
        console.error(err);
    }
}


// ------------------------------
// Logout
// ------------------------------
function logout() {
    localStorage.removeItem("user");
    window.location.href = "index.html";
}


// ------------------------------
// 未登入強制離開
// ------------------------------
function checkLogin() {
    if (!getCurrentUser()) {
        alert("請先登入！");
        window.location.href = "index.html";
    }
}


// ------------------------------
// Profile 顯示暱稱
// ------------------------------
function showUser() {
    const name = getCurrentUser();
    const el = document.getElementById("username-info");
    if (el) el.innerText = "暱稱：" + (name || "未登入");
}



// ========================================
// 🎵 背景音樂（程式啟動就播放）
// ========================================

let bgm = null;
let musicOn = true;
let firstClickListenerAdded = false;

function initBGM() {
    // 建立播放器（只建立一次）
    if (!bgm) {
        bgm = new Audio("bgm.mp3");
        bgm.loop = true;
        bgm.volume = 1.0;
    }

    // 讀取使用者設定
    const saved = localStorage.getItem("musicOn");

    if (saved === null) {
        // ⭐ 程式第一次啟動 → 強制 ON
        musicOn = true;
        localStorage.setItem("musicOn", "true");
    } else {
        musicOn = (saved === "true");
    }

    // ⭐ 嘗試自動播放
    if (musicOn) {
        bgm.play().catch(() => {
            console.log("⚠ 自動播放被阻擋，需要第一次點擊才啟動音樂");

            if (!firstClickListenerAdded) {
                firstClickListenerAdded = true;

                // ⭐ 使用者首次點擊 → 音樂立即播放
                document.addEventListener("click", () => {
                    if (musicOn) bgm.play();
                }, { once: true });
            }
        });
    }
}

// ⭐ Music ON / OFF 切換（Settings 用）
function toggleMusic() {
    const btn = document.getElementById("music-btn");

    musicOn = !musicOn;

    if (musicOn) {
        bgm.play();
        btn.innerText = "Music: ON";
    } else {
        bgm.pause();
        btn.innerText = "Music: OFF";
    }

    localStorage.setItem("musicOn", musicOn.toString());
}





// ================================================
// 🎵 音樂 ON/OFF（Settings 用）
// ================================================
function toggleMusic() {
    const btn = document.getElementById("music-btn");

    musicOn = !musicOn;

    if (musicOn) {
        bgm.play();
        btn.innerText = "Music: ON";
    } else {
        bgm.pause();
        btn.innerText = "Music: OFF";
    }

    localStorage.setItem("musicOn", musicOn.toString());
}


// ================================================
// Settings 載入頁面
// ================================================
function loadSettingsPage() {
    loadUserSettings();  // 讀暱稱

    const btn = document.getElementById("music-btn");
    const saved = localStorage.getItem("musicOn");

    musicOn = (saved === null ? true : saved === "true");

    btn.innerText = musicOn ? "Music: ON" : "Music: OFF";
}



// ================================================
// 讀取目前暱稱（Settings 用）
// ================================================
function loadUserSettings() {
    const name = getCurrentUser();
    if (!name) {
        alert("尚未登入！");
        window.location.href = "index.html";
        return;
    }

    const el = document.getElementById("current-name");
    if (el) el.innerText = name;
}


// ================================================
// 修改暱稱（Settings）
// ================================================
function saveNewName() {
    const input = document.getElementById("new-name");
    if (!input) return;

    const newName = input.value.trim();
    if (!newName) {
        alert("暱稱不可為空！");
        return;
    }

    localStorage.setItem("user", newName);

    alert("暱稱已更新！");
    window.location.reload();
}



// ================================================
// 深坑限定地圖
// ================================================
async function initMap() {

    const center = [25.002, 121.615];
    const bounds = [
        [24.995, 121.600],
        [25.010, 121.630]
    ];

    const map = L.map("map", {
        center,
        zoom: 15,
        minZoom: 14,
        maxZoom: 18,
        maxBounds: bounds,
        maxBoundsViscosity: 1.0
    });

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        maxZoom: 18
    }).addTo(map);

    const res = await fetch(`${API_BASE}/tasks`);
    const tasks = await res.json();

    tasks.forEach(t => {
        const marker = L.marker([t.lat, t.lng]).addTo(map);

        marker.bindPopup(`
            <b>${t.name}</b><br>
            ${t.reward}<br><br>
            <button class="complete-btn" data-id="${t.id}">
                完成任務
            </button>
        `);

        marker.on("popupopen", () => {
            const btn = document.querySelector(".complete-btn");

            if (btn) {
                btn.addEventListener("click", async () => {
                    const username = getCurrentUser();
                    const res = await fetch(`${API_BASE}/tasks/${t.id}/complete`, {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ username })
                    });

                    const data = await res.json();

                    if (!res.ok) {
                        alert(data.error || "任務已完成過！");
                        return;
                    }

                    alert("任務完成！已獲得優惠券 🎉");
                    window.location.href = "coupon.html";
                });
            }
        });
    });
}



// ===========================
// 在像素地圖上產生任務點
// ===========================
function loadTaskPanel() {
    fetch(`${API_BASE}/tasks`)
        .then(res => res.json())
        .then(tasks => {
            const container = document.getElementById("taskPoints");
            container.innerHTML = "";

            tasks.forEach(t => {
                const marker = document.createElement("div");
                marker.className = "task-marker";

                // ⭐ 使用 t.x, t.y 來定位（百分比）
                marker.style.left = t.x + "%";
                marker.style.top = t.y + "%";

                marker.onclick = () => {
                    if (confirm(`前往任務：${t.name}？`)) {
                        completeTask(t.id);
                    }
                };

                container.appendChild(marker);
            });
        });
}


async function completeTaskFromPanel(taskId) {
    const username = getCurrentUser();
    if (!username) return alert("尚未登入");

    const res = await fetch(`${API_BASE}/tasks/${taskId}/complete`, {
        method: "POST",
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify({ username })
    });

    const data = await res.json();

    if (!res.ok) {
        alert(data.error || "任務已完成過！");
        return;
    }

    alert("任務完成！已獲得優惠券 🎉");
    window.location.href = "coupon.html";
}



// ================================================
// 優惠券頁面
// ================================================
async function loadCoupons() {

    const username = getCurrentUser();
    const area = document.getElementById("coupon-list");

    if (!area) return;

    if (!username) {
        area.innerHTML = "<p>尚未登入</p>";
        return;
    }

    const res = await fetch(`${API_BASE}/coupons?username=${username}`);
    const coupons = await res.json();

    if (coupons.length === 0) {
        area.innerHTML = "<p>目前沒有優惠券</p>";
        return;
    }

    area.innerHTML = "";
    coupons.forEach(c => {
        area.innerHTML += `
            <div class="coupon">
                <h3>${c.reward}</h3>
                <p>任務：${c.taskName}</p>
                <p>時間：${new Date(c.time).toLocaleString()}</p>
            </div>
        `;
    });
}
